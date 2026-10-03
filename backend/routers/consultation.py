import re
import json
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List
from database.database import get_db, SessionLocal
from database.models import User, Doctor, Hospital
from services.rag_engine import retrieve_relevant_history, index_health_record
from services.llm_service import generate_consultation_response
from routers.auth import get_current_user

router = APIRouter(prefix="/consultation", tags=["Consultation"])

# ─── Request / Response Models ────────────────────────────────────────────────

class ConversationTurn(BaseModel):
    """A single turn in the chat history (user or ai message)."""
    sender: str  # "user" or "ai"
    text: str

class ConsultationRequest(BaseModel):
    query: str = Field(..., description="Patient's current message to the doctor")
    conversation_history: Optional[List[ConversationTurn]] = Field(
        default=[],
        description="Full conversation history so far for multi-turn context"
    )
    patient_context: Optional[dict] = Field(
        default=None,
        description="Patient profile: age, sex, blood_group, allergies, chronic_conditions, etc."
    )

class DiseaseEstimate(BaseModel):
    name: Optional[str] = None
    probability: Optional[int] = None
    icd10: Optional[str] = None
    description: Optional[str] = None
    urgency: Optional[str] = None

class DifferentialDx(BaseModel):
    name: Optional[str] = None
    reason: Optional[str] = None

class TriageResult(BaseModel):
    type: Optional[str] = None          # "LOW_CONCERN" | "LAB_TEST" | "DOCTOR_NEEDED"
    diagnosis: Optional[str] = None
    reasoning: Optional[str] = None
    badge: Optional[str] = None
    severityScore: Optional[int] = None
    symptomTags: Optional[List[str]] = None
    diseaseEstimation: Optional[List[DiseaseEstimate]] = None
    differentialDiagnoses: Optional[List[DifferentialDx]] = None
    safetyReminders: Optional[List[str]] = None
    dietaryAdvice: Optional[str] = None
    medicationTips: Optional[List[str]] = None
    tests: Optional[List[str]] = None
    reminders: Optional[List[str]] = None
    doctorInstructions: Optional[str] = None
    doctorSpecialty: Optional[str] = None
    matchedDoctor: Optional[dict] = None

class ConsultationResponse(BaseModel):
    phase: str                          # "QUESTIONING" | "TRIAGE"
    message: str                        # The doctor's spoken message
    triage: Optional[TriageResult] = None  # Present only when phase == "TRIAGE"
    context_used: bool = False

# ─── Medical & Red-flag Keyword Lists (module-level, loaded once) ─────────────

MEDICAL_KEYWORDS = [
    "pain", "ache", "hurt", "fever", "headache", "cough", "cold", "vomit", "nausea",
    "dizzy", "tired", "fatigue", "rash", "bleed", "blood", "breath", "chest",
    "stomach", "throat", "back", "leg", "arm", "eye", "ear", "nose", "skin",
    "swelling", "burn", "itch", "pressure", "sore", "weak", "faint", "stress",
    "anxiety", "sleep", "urine", "stool", "bowel", "weight", "appetite", "sugar",
    "heart", "kidney", "liver", "joint", "muscle", "bone", "neck", "shoulder",
    "day", "week", "hour", "sudden", "since", "started", "constant", "feeling",
    "medicine", "tablet", "drug", "allergy", "condition", "diagnosed", "symptom",
    "infection", "inflammation", "swollen", "cramp", "spasm", "discharge", "lump",
    "redness", "numbness", "tingling", "palpitation", "breathless", "wheeze",
    # Vital sign shorthand & medical abbreviations
    "temp", "temperature", "degree", "fahrenheit", "celsius",
    "bp", "spo2", "pulse", "bpm", "glucose", "sugar level",
    "sob", "n/v", "cp", "ha", "gi", "uti", "abd",
    "100f", "101f", "102f", "103f", "104f", "99f",
    "100 f", "101 f", "102 f", "103 f", "104 f",
]

RED_FLAG_KEYWORDS = [
    "chest pain", "can't breathe", "cannot breathe", "breathless", "heart attack",
    "stroke", "face drooping", "arm weak", "slurred speech", "blood in vomit",
    "vomiting blood", "blood in stool", "blood in urine", "fainting", "unconscious",
    "seizure", "worst headache", "severe abdominal", "rigid abdomen"
]

FOLLOW_UP_MAP = {
    "headache": "Headaches can have different causes. How long has it been going on — hours or days? Is it one-sided or all over? Any nausea, vomiting, or sensitivity to light?",
    "fever":    "Fever needs more context. How high is the temperature? How long has it been there? Any chills, body aches, or vomiting alongside?",
    "stomach":  "Stomach issues vary a lot. Where exactly is the pain — upper, lower, or all over? Does it come in waves or stay constant? Any vomiting or loose stools?",
    "vomit":    "Vomiting can have several causes. How many times today? Any fever or stomach pain with it? Did it start suddenly or build up?",
    "cough":    "A cough can be dry or chesty — which is yours? How long has it been going on? Any fever, breathlessness, or chest tightness?",
    "pain":     "Pain needs more detail. Where exactly is it located? Sharp, dull, or throbbing? How long has it been there?",
    "back":     "Back pain is common. Is it more upper or lower back? Does it radiate to your legs or arms? Any recent injury or prolonged sitting?",
    "throat":   "Sore throats can be viral or bacterial. How long has it been there? Any fever, difficulty swallowing, or white patches you can see?",
    "dizzy":    "Dizziness can mean a few things. Is the room spinning, or do you feel light-headed? How long does it last — seconds or continuous? Any nausea or hearing changes?",
    "rash":     "A rash needs more description. Where on your body is it? Is it itchy, raised, or blistered? Any recent new food, medicine, or exposure to something new?",
}

def _background_index_interaction(patient_id: int, query: str, ai_response: str):
    """Asynchronously indexes the interaction into vector memory without delaying the user response."""
    try:
        db = SessionLocal()
        interaction_text = f"Patient: {query}\nDr. HealthVerse: {ai_response}"
        index_health_record(
            db,
            patient_id=patient_id,
            content=interaction_text,
            record_type="consultation"
        )
        db.close()
    except Exception as e:
        print(f"[BACKGROUND INDEX ERROR]: {e}")


# ─── CHECKPOINT: WhatsApp-style Shorthand Normalizer ─────────────────────────
def normalize_query(text: str) -> str:
    """
    Pre-processes patient input before sending to the LLM.
    Handles:
      - Connectivity/hearing checks ("can u hear me", "r u there")
      - Temperature shorthand (100f, 102.5F → 100°F (37.8°C))
      - Chat-speak (u→you, ur→your, r→are, n→and, hw→how, frm→from)
      - Medical abbreviations (sob, bp, spo2, n/v, ha, cp, abd, gi, uti, tbsp)
      - Common typo corrections (headche, stomac, discomfort)
      - Informal English expansions (wanna, gonna, gotta)
    """
    t = text.strip()
    if not t:
        return t

    lower = t.lower()

    # ── Hearing/connectivity checks → let LLM respond to naturally ──────────
    hearing_patterns = [
        r'\bcan\s+(u|you)\s+hear\s+(me|this)\b',
        r'\bare\s+(u|you)\s+there\b',
        r'\br\s+u\s+there\b',
        r'\bis\s+(anyone|somebody)\s+there\b',
        r'\bhello\???\s*(are|r)\s*(u|you)\s*(there|online)\b',
        r'\bcan\s+(u|you)\s+see\s+(this|me)\b',
        r'\bhello\s*\???\s*doctor\b',
        r'\btest\s*message\b',
    ]
    if any(re.search(p, lower) for p in hearing_patterns):
        return "I can hear you clearly. How are you feeling today? Please tell me about any symptoms or health concerns you have."

    # ── Temperature shorthand: expand to °F with Celsius equivalent ─────────
    def expand_temp(m):
        val = float(m.group(1))
        celsius = round((val - 32) * 5/9, 1)
        return f"{val}°F ({celsius}°C)"

    t = re.sub(r'\b(\d{2,3}(?:\.\d)?)\s*°?\s*[fF]\b', expand_temp, t)

    # ── Celsius temperature ──────────────────────────────────────────────────
    t = re.sub(r'\b(\d{2,3}(?:\.\d)?)\s*°?\s*[cC]\b', r'\1°C', t)

    # ── Chat-speak word substitutions (word-boundary safe) ──────────────────
    CHAT_MAP = [
        (r'\bu\b',      'you'),
        (r'\bur\b',     'your'),
        (r'\br\b',      'are'),
        (r'\bn\b',      'and'),
        (r'\bhw\b',     'how'),
        (r'\bfrm\b',    'from'),
        (r'\bm\b',      'I am'),
        (r'\bim\b',     'I am'),
        (r'\bi\'?m\b',  'I am'),
        (r'\bwanna\b',  'want to'),
        (r'\bgonna\b',  'going to'),
        (r'\bgotta\b',  'have to'),
        (r'\bdunno\b',  'do not know'),
        (r'\bkinda\b',  'kind of'),
        (r'\blotta\b',  'a lot of'),
        (r'\btmrw\b',   'tomorrow'),
        (r'\bystrdy\b', 'yesterday'),
        (r'\bplz\b',    'please'),
        (r'\bpls\b',    'please'),
        (r'\bthx\b',    'thanks'),
        (r'\bsrry\b',   'sorry'),
        (r'\bbt\b',     'but'),
        (r'\bbc\b',     'because'),
        (r'\bnot\s+ok\b', 'not feeling well'),
        (r'\bfeeling\s+bad\b', 'feeling unwell'),
        (r'\bsmth\b',   'something'),
        (r'\banything\b', 'anything'),
    ]
    for pattern, replacement in CHAT_MAP:
        t = re.sub(pattern, replacement, t, flags=re.IGNORECASE)

    # ── Medical abbreviation expansions ──────────────────────────────────────
    MED_MAP = [
        (r'\bsob\b',    'shortness of breath'),
        (r'\bcp\b',     'chest pain'),
        (r'\bha\b',     'headache'),
        (r'\babd\b',    'abdominal'),
        (r'\bgi\b',     'gastrointestinal'),
        (r'\buti\b',    'urinary tract infection'),
        (r'\bn/?v\b',   'nausea and vomiting'),
        (r'\bbp\b',     'blood pressure'),
        (r'\bspo2\b',   'blood oxygen level (SpO2)'),
        (r'\bhr\b',     'heart rate'),
        (r'\brr\b',     'respiratory rate'),
        (r'\bpcp\b',    'primary care physician'),
        (r'\bOTC\b',    'over-the-counter medication'),
        (r'\bRx\b',     'prescription medication'),
        (r'\bHbA1c\b',  'glycated hemoglobin (HbA1c)'),
        (r'\bECG\b',    'electrocardiogram (ECG)'),
        (r'\bCBC\b',    'complete blood count (CBC)'),
        (r'\bBMI\b',    'body mass index (BMI)'),
    ]
    for pattern, replacement in MED_MAP:
        t = re.sub(pattern, replacement, t, flags=re.IGNORECASE)

    # ── Common typo corrections ──────────────────────────────────────────────
    TYPO_MAP = [
        (r'\bheadche\b',   'headache'),
        (r'\bheadach\b',   'headache'),
        (r'\bstomac\b',    'stomach'),
        (r'\bfever\s*\b',  'fever'),
        (r'\btemprature\b','temperature'),
        (r'\btemperture\b','temperature'),
        (r'\bdizzyness\b', 'dizziness'),
        (r'\bbreathing\s+problem\b', 'difficulty breathing'),
        (r'\bcan\s*not\s*breath\b',  'cannot breathe'),
        (r'\bcan\'?t\s*breath\b',    'cannot breathe'),
        (r'\bswollening\b', 'swelling'),
        (r'\bvomitin\b',   'vomiting'),
        (r'\bdirrhea\b',   'diarrhea'),
        (r'\bdiarrhoea\b', 'diarrhea'),
    ]
    for pattern, replacement in TYPO_MAP:
        t = re.sub(pattern, replacement, t, flags=re.IGNORECASE)

    return t.strip()



@router.post("/chat", response_model=ConsultationResponse)
def ai_chat_consultation(
    request: ConsultationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    CHECKPOINT: Production AI Doctor Chat Endpoint
    Layers: Normalize → Unclear-guard → RAG → LLM → Turn guard → Triage → Response
    """
    query_stripped = normalize_query(request.query.strip())
    query_lower    = query_stripped.lower()

    # ─── LAYER 1: Unclear Input Guard ─────────────────────────────────────────
    # Short message with no recognisable medical word → ask to clarify
    query_words     = [w for w in re.split(r'\s+', query_stripped) if len(w) > 1]
    has_medical_word = any(kw in query_lower for kw in MEDICAL_KEYWORDS)

    # Regex-based vital sign shorthand detection (e.g. "100f", "102.5°F", "140/90 bp", "spo2 92")
    VITAL_PATTERNS = [
        r'\b\d{2,3}\.?\d*\s*[fF°]\b',           # temperature: 100F, 102.5F, 39°F
        r'\b\d{2,3}/\d{2,3}\b',                   # blood pressure: 140/90
        r'\bspo2\s*\d+\b',                         # SpO2: spo2 92
        r'\bpulse\s*\d+\b',                        # pulse: pulse 110
        r'\b\d+\s*bpm\b',                          # bpm: 110bpm
        r'\bsugar\s*\d+\b',                        # blood sugar: sugar 300
        r'\bglucose\s*\d+\b',                      # glucose level
        r'\b\d{2,3}\s*mg\b',                       # dosage mention
        r'\b(sob|n\/v|cp|ha|gi|uti|abd)\b',        # common medical abbreviations
    ]
    has_vital_shorthand = any(re.search(p, query_lower) for p in VITAL_PATTERNS)

    # Casual/greeting patterns — let Gemini handle these naturally
    CASUAL_PATTERNS = [
        r'\bhi\b', r'\bhello\b', r'\bhey\b', r'\bgreet\b',
        r'how are you', r'how r u', r'how do you do',
        r'good morning', r'good evening', r'good afternoon', r'good night',
        r'who are you', r'what are you', r'what can you do',
        r'\bthank', r'\bthanks\b', r'\bok\b', r'\bokay\b',
        r'\bbye\b', r'\bgoodbye\b', r'\bsee you\b',
        r'what is your name', r"what's your name",
    ]
    is_casual = any(re.search(p, query_lower) for p in CASUAL_PATTERNS)

    # Only block truly empty or garbage input (1 char, no real words)
    is_unclear = (
        len(query_words) == 0 or
        (len(query_stripped) < 3 and not has_medical_word and not has_vital_shorthand and not is_casual)
    )

    if is_unclear:
        return ConsultationResponse(
            phase="QUESTIONING",
            message="I'm sorry, I didn't quite catch that. Could you describe what you're experiencing in a little more detail — your main symptom, how long it's been going on, and how severe it feels?",
            triage=None,
            context_used=False
        )

    # ─── 1. Retrieve RAG context from vector DB ────────────────────────────────
    context = retrieve_relevant_history(
        db,
        patient_id=current_user.id,
        query=request.query
    )

    # ─── 2. Format conversation history ───────────────────────────────────────
    history_dicts: List[dict] = []
    if request.conversation_history:
        for turn in request.conversation_history:
            history_dicts.append({"sender": turn.sender, "text": turn.text})

    # ─── 2b. Build patient profile string for LLM ─────────────────────────────
    patient_profile_str = ""
    pc = request.patient_context
    if pc:
        parts = []
        if pc.get("name"):             parts.append(f"Name: {pc['name']}")
        if pc.get("age"):              parts.append(f"Age: {pc['age']} years")
        if pc.get("sex"):              parts.append(f"Sex: {pc['sex']}")
        if pc.get("blood_group"):      parts.append(f"Blood Group: {pc['blood_group']}")
        if pc.get("height"):           parts.append(f"Height: {pc['height']} cm")
        if pc.get("weight"):           parts.append(f"Weight: {pc['weight']} kg")
        if pc.get("allergies") and pc["allergies"]:
            allergy_list = pc["allergies"] if isinstance(pc["allergies"], list) else [pc["allergies"]]
            parts.append(f"Known Allergies: {', '.join(str(a) for a in allergy_list)}")
        if pc.get("chronic_conditions"):
            parts.append(f"Chronic Conditions: {pc['chronic_conditions']}")
        if pc.get("active_medications") and len(pc["active_medications"]) > 0:
            parts.append(f"Current Active Medications: {', '.join(pc['active_medications'])}")
        if pc.get("active_reminders") and len(pc["active_reminders"]) > 0:
            parts.append(f"Active Health Reminders: {', '.join(pc['active_reminders'])}")
        if parts:
            patient_profile_str = (
                "[PATIENT PROFILE — consider allergies and conditions when prescribing]:\n"
                + "\n".join(parts)
            )

    # ─── 3. Call LLM ──────────────────────────────────────────────────────────
    llm_result = generate_consultation_response(
        query=request.query,
        context=context,
        conversation_history=history_dicts,
        patient_profile=patient_profile_str
    )

    # ─── LAYER 2: Turn Guard — prevent premature triage ───────────────────────
    # Allow triage after just 1 full user turn (they've given symptoms + answered at least 1 question)
    user_turns   = sum(1 for t in history_dicts if t.get("sender") == "user")
    has_red_flag = any(kw in query_lower for kw in RED_FLAG_KEYWORDS)

    if llm_result.get("phase") == "TRIAGE" and user_turns < 1 and not has_red_flag:
        follow_up_msg = next(
            (v for k, v in FOLLOW_UP_MAP.items() if k in query_lower),
            "Tell me more — how long has this been going on? Is it constant or does it come and go? Any other symptoms alongside it?"
        )
        llm_result = {
            "phase":  "QUESTIONING",
            "message": follow_up_msg,
            "triage": None
        }

    # ─── 4. Background vector indexing (non-blocking) ─────────────────────────
    background_tasks.add_task(
        _background_index_interaction,
        patient_id=current_user.id,
        query=request.query,
        ai_response=llm_result.get("message", "")
    )

    # ─── 5. Build structured triage object ────────────────────────────────────
    raw_triage  = llm_result.get("triage")
    # Normalise: LLM sometimes returns the string "null" or an empty dict
    triage_data = raw_triage if isinstance(raw_triage, dict) and raw_triage else None
    triage_obj  = None

    if triage_data:
        matched_doc_dict = None

        # Match a doctor from DB when DOCTOR_NEEDED or specialty is present
        if triage_data.get("type") == "DOCTOR_NEEDED" or triage_data.get("doctorSpecialty"):
            specialty    = (triage_data.get("doctorSpecialty") or "").strip()
            keyword      = specialty.split()[0] if specialty else ""

            doc = None
            if keyword:
                doc = (
                    db.query(Doctor)
                    .filter(Doctor.specialization.ilike(f"%{keyword}%"))
                    .order_by(Doctor.rating.desc())
                    .first()
                )
            if not doc:
                # Fallback: highest-rated doctor overall
                doc = db.query(Doctor).order_by(Doctor.rating.desc()).first()

            if doc:
                hosp = db.query(Hospital).filter(Hospital.id == doc.hospital_id).first()
                try:
                    slots = json.loads(doc.slots) if doc.slots else ["Morning & Evening Slots"]
                except (json.JSONDecodeError, TypeError):
                    slots = ["Morning & Evening Slots"]

                matched_doc_dict = {
                    "id":             doc.id,
                    "name":           doc.name,
                    "specialization": doc.specialization,
                    "sub_specialty":  doc.sub_specialty,
                    "hospitalName":   hosp.name if hosp else "Unknown Hospital",
                    "experience":     doc.experience,
                    "rating":         doc.rating,
                    "reviews_count":  doc.reviews_count,
                    "fee":            doc.fee,
                    "avatar":         doc.avatar,
                    "availableSlots": slots,
                }

        # Parse disease estimation objects safely
        raw_de = triage_data.get("diseaseEstimation") or []
        disease_est = [DiseaseEstimate(**d) for d in raw_de if isinstance(d, dict)]

        raw_dd = triage_data.get("differentialDiagnoses") or []
        diff_dx = [DifferentialDx(**d) for d in raw_dd if isinstance(d, dict)]

        triage_obj = TriageResult(
            type=triage_data.get("type"),
            diagnosis=triage_data.get("diagnosis"),
            reasoning=triage_data.get("reasoning"),
            badge=triage_data.get("badge"),
            severityScore=triage_data.get("severityScore"),
            symptomTags=triage_data.get("symptomTags") or [],
            diseaseEstimation=disease_est if disease_est else None,
            differentialDiagnoses=diff_dx if diff_dx else None,
            safetyReminders=triage_data.get("safetyReminders") or [],
            dietaryAdvice=triage_data.get("dietaryAdvice"),
            medicationTips=triage_data.get("medicationTips"),
            tests=triage_data.get("tests"),
            reminders=triage_data.get("reminders"),
            doctorInstructions=triage_data.get("doctorInstructions"),
            doctorSpecialty=triage_data.get("doctorSpecialty"),
            matchedDoctor=matched_doc_dict,
        )

    # ─── 6. Return final response ──────────────────────────────────────────────
    return ConsultationResponse(
        phase=llm_result.get("phase", "QUESTIONING"),
        message=llm_result.get("message", "Could you describe your symptoms in a bit more detail?"),
        triage=triage_obj,
        context_used=bool(
            context and context.strip() != "No relevant past medical history found."
        ),
    )

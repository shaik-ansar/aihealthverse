import os
import json
import re
import time
import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
from config import get_settings

settings = get_settings()

# ─── CHECKPOINT: LLM Initialization ─────────────────────────────────────────
clean_api_key = settings.google_api_key.strip("'\"")
genai.configure(api_key=clean_api_key)

# ─── System Prompt: Dr. HealthVerse — Precision Clinical Triage + Disease Estimation ────
DR_HEALTHVERSE_SYSTEM_PROMPT = """
You are Dr. HealthVerse — a senior consultant physician (MD, 25 yrs experience, MBBS + MD Internal Medicine). You think like a clinician, reason like a diagnostician, and speak like a trusted doctor. You handle ALL medical questions — symptoms, medications, test interpretation, health advice, nutrition, anatomy, drug queries, general wellness. You are NOT a chatbot. Respond ONLY in valid JSON.

━━━ CORE PERSONA ━━━
- Answer ANY health question directly and intelligently, whether it's "what is metformin?" or "why do I wake up at 3am?"
- For symptoms: follow the clinical workflow below
- For general health questions: give a direct, accurate, medically sound answer in "message", set phase="QUESTIONING", triage=null
- Never say "I'm an AI" or "consult a doctor" as a cop-out — YOU are the doctor

━━━ SHORTHAND DECODING (always interpret, never ask to clarify) ━━━
100f/100F = 100°F (37.8°C, low fever) | 102F = 38.9°C | 104F = 40°C (URGENT)
bp 140/90 = Stage 1 HTN | sugar 300 = hyperglycemia | spo2 92 = hypoxia (urgent)
sob = dyspnea | cp = chest pain | ha = headache | n/v = nausea/vomiting
abd = abdominal | gi = GI | uti = UTI | hr = heart rate | bpm = beats/min

━━━ CLINICAL REASONING (before every response) ━━━
1. Parse all symptoms + their severity, duration, and pattern
2. Check patient history (from [RETRIEVED PATIENT CLINICAL HISTORY]) — if a chronic disease is listed (diabetes, HTN, heart disease, asthma, kidney disease, cancer, thyroid, epilepsy, etc.) and it is RELEVANT to the current symptoms, explicitly incorporate it into your reasoning and triage
3. Generate differential diagnosis (top 3 by Bayesian probability)
4. Screen for RED FLAGS — escalate immediately if found
5. Select lab tests that are SPECIFICALLY justified by the symptom constellation (not generic panels)

━━━ QUESTIONING RULES — STRICT ━━━
- Maximum 60 words per questioning response
- Ask EXACTLY 2 specific, targeted questions — no more
- No warm openers like "I understand..." — start with a crisp clinical observation
- Format: [1-line clinical observation]. [Question 1]? [Question 2]?

GOOD: "A 100°F fever with headache points to a viral or bacterial process. How long has the fever been present, and is it continuous or spiking? Any neck stiffness, rash, or vomiting alongside?"
BAD: "Thank you for sharing. I understand you're not feeling well. Let me ask you a few questions to better understand your condition..."

━━━ SMART DOCTOR ANSWERS (for non-symptom questions) ━━━
If the patient asks a knowledge question (drug name, test result, anatomy, nutrition, mental health, lifestyle), answer it directly and clearly in ≤80 words, like a knowledgeable doctor explaining to a patient. Do NOT ask follow-up questions. Use phase="QUESTIONING", triage=null.

EXAMPLE — "what is metformin?": "Metformin is a first-line oral medication for Type 2 diabetes. It works by reducing glucose production in the liver and improving insulin sensitivity. It is taken with meals to reduce stomach upset. Common side effects include nausea and diarrhea initially. Do not take it if you have kidney disease (eGFR < 30). Is there something specific about your diabetes management you'd like to discuss?"

━━━ TRIAGE DECISION ━━━
LOW_CONCERN   → Mild, self-limiting (<3 days), no red flags. Home care + OTC.
LAB_TEST      → Moderate, recurrent, metabolic, infectious, or >5 days. Specific labs required.
DOCTOR_NEEDED → Severe, red-flag symptoms, organ involvement, or systemic disease suspected. Urgent referral.

━━━ LAB TEST PRECISION RULES ━━━
Only order tests that are directly justified by the symptom constellation. Never order generic panels.
FEVER + sore throat → Throat culture, Rapid Strep Test, CBC with differential
FEVER >5 days → CBC, ESR, CRP, Malaria RDT, Dengue NS1/IgM, Blood culture
Chest pain (non-cardiac) → ECG, Chest X-ray, D-dimer if PE suspected
Chest pain (cardiac risk) → ECG, Troponin I/T, CK-MB, Chest X-ray, Lipid profile
Recurrent headache → CBC, ESR, BP check, CT Head (if red flags)
Fatigue + weight change → CBC, TSH, FT4, FBS, HbA1c, LFT, RFT
Abdominal pain (acute) → CBC, LFT, Amylase/Lipase, Urinalysis, USG Abdomen
UTI symptoms → Urine R&M, Urine Culture & Sensitivity
Diabetes monitoring → FBS, PPBS, HbA1c, RFT, Urine Microalbumin, Lipid Profile
Hypertension workup → RFT, Electrolytes, ECG, Echocardiogram, Urine Microalbumin
Joint pain → ESR, CRP, RF, Anti-CCP, Uric acid, X-ray of affected joint
Skin rash + fever → CBC, ESR, Dengue serology, ANA if autoimmune suspected
Anaemia workup → CBC, Peripheral smear, Serum Iron, TIBC, Ferritin, B12, Folate
Respiratory symptoms → CBC, CXR, Sputum AFB (if TB suspected), Spirometry

━━━ TRIAGE MESSAGE FORMAT (STRICT) ━━━
Structure the "message" field in this exact flow (plain text, no markdown, no lists):
[Impression]: One sentence stating the most likely diagnosis.
[Reasoning]: One sentence explaining which specific symptoms led to this conclusion.
[Plan]: What they should take/do right now.
[Watch-for]: One sentence on when to seek emergency care.
Total: 3-4 sentences, under 80 words.

EXAMPLE: "Your symptom pattern — 102°F fever for 3 days, severe throat pain, and white patches — is most consistent with bacterial tonsillitis, likely Group A Streptococcal infection. The high fever and tonsillar exudate make a viral cause less likely. Start warm salt-water gargles and paracetamol 500mg every 6 hours after meals for now. Seek emergency care immediately if you develop difficulty breathing, drooling, or your fever exceeds 104°F."

━━━ CHRONIC HISTORY INTEGRATION ━━━
If [RETRIEVED PATIENT CLINICAL HISTORY] contains a chronic condition:
- ALWAYS mention it in reasoning if relevant (e.g., "given your history of diabetes, we must rule out diabetic nephropathy")
- Adjust triage upward if the chronic disease increases risk (e.g., diabetic with fever → higher suspicion for bacterial infection)
- Exclude drugs that conflict with known conditions from medicationTips
- Add relevant monitoring tests (e.g., for diabetic: always include HbA1c and RFT if metabolic concern)

━━━ OUTPUT FORMAT ━━━
{
  "phase": "QUESTIONING" | "TRIAGE",
  "message": "Concise clinical message. No markdown. No lists. Real doctor voice. Max 80 words.",
  "triage": null | {
    "type": "LOW_CONCERN" | "LAB_TEST" | "DOCTOR_NEEDED",
    "diagnosis": "1-sentence clinical impression with likely condition",
    "reasoning": "Specific symptoms → specific conclusion. Mention relevant history if applicable.",
    "badge": "LOW CONCERN — HOME CARE" | "MODERATE — LAB TESTS REQUIRED" | "SEVERE — DOCTOR APPOINTMENT REQUIRED",
    "severityScore": 1-10,
    "symptomTags": ["Tag1", "Tag2", "Tag3"],
    "diseaseEstimation": [
      {"name": "Disease Name", "probability": 72, "icd10": "CODE", "description": "Why this fits", "urgency": "Low|Moderate|High|Critical"}
    ],
    "differentialDiagnoses": [
      {"name": "Condition", "reason": "Why considered/excluded"}
    ],
    "safetyReminders": [
      "⏰ 08:00 AM -- Paracetamol 500mg after breakfast -- Fever control, every 6h",
      "⏰ 02:00 PM -- Paracetamol 500mg after lunch -- Afternoon dose",
      "⏰ Throughout day -- Drink 3L water/ORS -- Fever causes fluid loss",
      "⏰ 09:00 PM -- Rest, no screens -- Immune recovery peaks during sleep",
      "⏰ Every 4h -- Check temperature -- Go to ER if >103°F",
      "⏰ Tomorrow AM -- Reassess symptoms -- See doctor if no improvement"
    ],
    "dietaryAdvice": "Condition-specific dietary guidance. What to eat, what to avoid, hydration. 2-3 sentences.",
    "medicationTips": ["DrugName XMG -- every Nh -- after food -- for X days (NEVER antibiotics/steroids/opioids/insulin)"],
    "tests": ["Test Name (clinical reason)"] or null,
    "reminders": [
      "08:00 AM -- Action -- Reason",
      "08:30 AM -- Action -- Reason",
      "01:00 PM -- Action -- Reason",
      "02:00 PM -- Action -- Reason",
      "09:30 PM -- Action -- Reason",
      "Next AM -- Action -- Reason"
    ],
    "appointmentNeeded": true|false,
    "doctorInstructions": "DOCTOR_NEEDED only: script of exactly what to tell the doctor",
    "doctorSpecialty": "General Physician|Cardiologist|Neurologist|Gastroenterologist|Pulmonologist|Endocrinologist|Dermatologist|Orthopedist|Nephrologist|Urologist|Psychiatrist|null"
  }
}
"""


# ─── CHECKPOINT: Model Instantiation ─────────────────────────────────────────
# Ordered from latest/most-capable to reliable fallbacks; skipped if quota/404 error.
# Falls back to next model on 404 (retired), 429 (quota), or 503 (overload).
PREFERRED_MODELS = [
    'models/gemini-3.8-flash',       # Primary — fastest, newest
    'models/gemini-3.6-flash',       # Fallback 1
    'models/gemini-3.5-flash',       # Fallback 2
    'models/gemini-3.1-flash-lite',  # Fallback 3
    'models/gemini-2.5-flash',       # Fallback 4
    'models/gemini-2.0-flash',       # Fallback 5
    'models/gemini-1.5-flash',       # Last resort
]

chat_model      = None
chat_model_name = None

for m_name in PREFERRED_MODELS:
    try:
        _tmp = genai.GenerativeModel(
            m_name,
            system_instruction=DR_HEALTHVERSE_SYSTEM_PROMPT,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.15,
                "top_p": 0.85
            }
        )
        chat_model      = _tmp
        chat_model_name = m_name
        print(f"[FAST-LLM] Initialized primary model: {m_name}")
        break
    except Exception as e:
        print(f"[FAST-LLM] Skipping {m_name}: {e}")

if not chat_model:
    print("[ERROR] No Gemini chat model could be initialized.")


# ─── Retry Helper ─────────────────────────────────────────────────────────────
def _is_overload_error(exc: Exception) -> bool:
    """Return True for transient Gemini 503 / quota exhausted errors (NOT 404)."""
    msg = str(exc).lower()
    # 404 = model retired, NOT a transient error — must NOT retry the same model
    if '404' in msg or 'no longer available' in msg or 'not found' in msg:
        return False
    return (
        isinstance(exc, (google_exceptions.ServiceUnavailable,
                         google_exceptions.ResourceExhausted,
                         google_exceptions.DeadlineExceeded)) or
        '503' in msg or 'overloaded' in msg or 'resource_exhausted' in msg or
        'quota' in msg or 'rate limit' in msg
    )


def _gemini_send_with_retry(chat_session, prompt: str, max_retries: int = 3):
    """
    Send a Gemini message with exponential back-off for transient overload errors.
    Tries the next model in PREFERRED_MODELS on repeated failure.
    """
    global chat_model, chat_model_name
    delay = 1.0
    last_exc = None

    for attempt in range(max_retries):
        try:
            return chat_session.send_message(prompt)
        except Exception as exc:
            last_exc = exc
            msg_lower = str(exc).lower()
            print(f"[LLM] {chat_model_name} error (attempt {attempt+1}): {str(exc)[:120]}")

            # Hard model errors — switch model immediately
            if '404' in msg_lower or 'no longer available' in msg_lower or 'not found' in msg_lower:
                print(f"[LLM] Model {chat_model_name} unavailable (404). Switching model...")
                break
            if '429' in msg_lower or 'quota' in msg_lower or 'resource_exhausted' in msg_lower:
                print(f"[LLM] Quota exhausted for {chat_model_name}. Switching model...")
                break
            if '400' in msg_lower or 'invalid' in msg_lower or 'bad request' in msg_lower:
                print(f"[LLM] Bad request on {chat_model_name}. Switching model...")
                break
            if '403' in msg_lower or 'permission' in msg_lower or 'unauthorized' in msg_lower:
                print(f"[LLM] Auth/permission error on {chat_model_name}. Switching model...")
                break

            # Transient overload — retry with backoff
            if _is_overload_error(exc):
                print(f"[LLM] Transient overload (attempt {attempt+1}/{max_retries}). Retrying in {delay:.1f}s...")
                time.sleep(delay)
                delay *= 2
            else:
                # Unknown error — break and try next model
                print(f"[LLM] Unknown error type on {chat_model_name}. Switching model...")
                break

    # All retries exhausted — try next model in the list
    current_idx = PREFERRED_MODELS.index(chat_model_name) if chat_model_name in PREFERRED_MODELS else -1
    for m_name in PREFERRED_MODELS[current_idx + 1:]:
        try:
            print(f"[LLM] Trying fallback model: {m_name}")
            fallback = genai.GenerativeModel(
                m_name,
                system_instruction=DR_HEALTHVERSE_SYSTEM_PROMPT,
                generation_config={"response_mime_type": "application/json",
                                   "temperature": 0.15, "top_p": 0.85}
            )
            new_session = fallback.start_chat(history=chat_session.history)
            response = new_session.send_message(prompt)
            # Promote this model so future calls use it directly
            chat_model      = fallback
            chat_model_name = m_name
            print(f"[LLM] Switched primary model to {m_name} after overload.")
            return response
        except Exception as fe:
            print(f"[LLM] Fallback model {m_name} also failed: {fe}")
            continue

    raise last_exc  # Everything failed


# ─── CHECKPOINT: DeepSeek-R1 Client (Optional Fallback) ──────────────────────
import httpx

def call_deepseek_r1(messages: list) -> dict:
    """
    DeepSeek-R1 (deepseek-reasoner) Clinical Reasoning Engine — used only if Gemini fails.
    """
    api_key = settings.deepseek_api_key.strip("'\"") or os.getenv("DEEPSEEK_API_KEY", "").strip("'\"")
    if not api_key:
        raise ValueError("No DeepSeek API key configured")

    base_url = (settings.deepseek_base_url or "https://api.deepseek.com").rstrip("/")
    endpoint = f"{base_url}/chat/completions"

    payload = {
        "model": "deepseek-reasoner",
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 2048
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    with httpx.Client(timeout=30.0) as client:
        res = client.post(endpoint, json=payload, headers=headers)
        if res.status_code != 200:
            raise RuntimeError(f"DeepSeek API returned {res.status_code}: {res.text}")

        data = res.json()
        choice = data.get("choices", [{}])[0]
        message_data = choice.get("message", {})
        raw_content = message_data.get("content", "").strip()

        if raw_content.startswith("```json"):
            raw_content = raw_content[7:-3].strip()
        elif raw_content.startswith("```"):
            raw_content = raw_content[3:-3].strip()

        return json.loads(raw_content)


def get_embedding(text: str) -> list[float]:
    """
    CHECKPOINT: Text-to-Vector Embedding
    Converts clinical text into a semantic vector for RAG retrieval.
    """
    try:
        result = genai.embed_content(
            model="models/gemini-embedding-001",
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        print(f"[ERROR] Embedding generation failed: {e}")
        return [0.0] * 3072


# ─── CHECKPOINT: Main Consultation Response ───────────────────────────────────
def generate_consultation_response(
    query: str,
    context: str,
    conversation_history: list = None,
    patient_profile: str = ""
) -> dict:
    """
    CHECKPOINT: Multi-turn LLM Consultation
    Primary:  Google Gemini Flash (main AI provider — handles casual + medical)
    Fallback: DeepSeek-R1 (only if Gemini is completely unavailable)
    """
    current_user_prompt = query
    no_history = not context or context.strip() == "No relevant past medical history found."
    if not no_history:
        current_user_prompt = (
            f"[RETRIEVED PATIENT CLINICAL HISTORY — use only if directly relevant]:\n{context}\n\n"
            f"[PATIENT CURRENT INPUT]: {query}"
        )
    if patient_profile:
        current_user_prompt = f"{patient_profile}\n\n{current_user_prompt}"

    # ── PRIMARY: Google Gemini ────────────────────────────────────────────────
    if chat_model:
        history_messages = []
        if conversation_history:
            for turn in conversation_history:
                role = "user" if turn.get("sender") == "user" else "model"
                history_messages.append({"role": role, "parts": [turn.get("text", "")]})

        try:
            chat_session = chat_model.start_chat(history=history_messages)
            # _gemini_send_with_retry handles 503 overloads with exponential back-off
            # and auto-promotes the next available model on repeated failure
            response = _gemini_send_with_retry(chat_session, current_user_prompt)
            raw_text = response.text.strip()

            if raw_text.startswith("```json"):
                raw_text = raw_text[7:-3].strip()
            elif raw_text.startswith("```"):
                raw_text = raw_text[3:-3].strip()

            result = json.loads(raw_text)
            print(f"[LLM] Consultation handled by Google Gemini ({chat_model_name}) — primary")
            return result

        except json.JSONDecodeError as e:
            print(f"[WARNING] Gemini JSON parse error: {e}, returning text fallback")
            try:
                clean_msg = re.sub(r'[*#_`]', '', response.text.strip())[:600]
            except Exception:
                clean_msg = "How long has this been going on? And does anything make it feel better or worse?"
            return {
                "phase": "QUESTIONING",
                "message": clean_msg,
                "triage": None
            }
        except Exception as e:
            print(f"[WARNING] Gemini primary failed after retries: {e}. Trying DeepSeek fallback.")

    # ── FALLBACK: DeepSeek-R1 (only when Gemini is unavailable) ─────────────
    api_key = settings.deepseek_api_key.strip("'\"") or os.getenv("DEEPSEEK_API_KEY", "").strip("'\"")
    if api_key:
        try:
            deepseek_messages = [{"role": "system", "content": DR_HEALTHVERSE_SYSTEM_PROMPT}]
            if conversation_history:
                for turn in conversation_history:
                    role = "user" if turn.get("sender") == "user" else "assistant"
                    deepseek_messages.append({"role": role, "content": turn.get("text", "")})
            deepseek_messages.append({"role": "user", "content": current_user_prompt})

            result = call_deepseek_r1(deepseek_messages)
            print("[LLM] Consultation handled by DeepSeek-R1 (fallback)")
            return result
        except Exception as e:
            print(f"[ERROR] DeepSeek fallback also failed: {e}")

    # ── LAST RESORT ───────────────────────────────────────────────────────────
    return {
        "phase": "QUESTIONING",
        "message": "I'm Dr. HealthVerse. Could you please describe what symptoms you've been experiencing?",
        "triage": None
    }


# ─── CHECKPOINT: Medical Report OCR ──────────────────────────────────────────
def extract_medical_report_ocr(file_bytes: bytes, mime_type: str = "image/jpeg", patient_context: str = None) -> dict:
    """
    CHECKPOINT: Gemini Multimodal Vision Medical Report OCR
    Uses the same stable PREFERRED_MODELS list as chat; retries on 503 overload.
    Produces rich, structured clinical summaries with disease context, risk levels,
    value-range interpretations, and Grammarly/NotebookLM-style actionable insights.
    """
    context_instruction = ""
    if patient_context and patient_context != "No previous history.":
        context_instruction = f"\n\nPATIENT MEDICAL HISTORY CONTEXT:\n{patient_context}\n\nUse this history to personalise the summary, insights, and triage level."

    prompt = f"""You are a Senior Clinical Pathologist and AI Health Analyst. Your job is to:
1. OCR-extract every test value exactly as printed in this medical report.
2. Generate a premium, beautifully structured clinical analysis — like a NotebookLM / Grammarly summary.

{context_instruction}

CRITICAL RULES:
- If this is NOT a medical/lab/clinical document (ID card, selfie, receipt, etc.): return empty testResults and set triageRecommendation to "NON_MEDICAL_DOCUMENT".
- Do NOT hallucinate or invent any test that is not visibly present in the image.
- Every testResult must have all 6 fields populated.
- The "status" field MUST be determined by comparing the extracted value against the refRange: Normal / Low / High / Critical.
- "tagColor": green=Normal, amber=borderline, red=Low/High/Critical.

For the "summary" field — write a 2-3 sentence doctor's narrative that:
  • Opens with the patient's overall health picture (e.g., "Your report reveals...")
  • Names the key abnormal findings and what they suggest clinically (e.g., anaemia, pre-diabetes, hypothyroidism risk, etc.)
  • Gives a confident, warm closing sentence about their general health status.

For the "aiExplanation" array — write 4-7 bullet strings, EACH covering:
  • The exact test name + value + unit + reference range in parentheses
  • A STATUS tag: 🟢 Normal | 🟡 Borderline | 🔴 High | 🔵 Low
  • What the result means clinically (what disease/condition it relates to)
  • What it leads to if untreated (e.g., "If left unmanaged, elevated LDL raises long-term cardiovascular risk")
  • A clear, actionable recommendation (diet, supplement, retest, consult)
  Example format: "🔴 Vitamin D — 14 ng/mL (Ref: 30–100 ng/mL) — DEFICIENT. Severe Vitamin D deficiency can cause bone weakening (osteopenia), fatigue, and immune dysfunction. Supplement with Vitamin D3 60,000 IU weekly for 8 weeks and recheck after 3 months."

For "diseaseSummary" — list up to 3 conditions suggested by the report:
  Each entry: {{"condition": "name", "likelihood": "Possible | Probable | Detected", "evidencedBy": "test1, test2", "leadsto": "what it can cause if untreated"}}

For "triageRecommendation" — pick ONE:
  "LOW CONCERN — All values within normal range. Maintain healthy lifestyle and routine annual check-up."
  "MONITOR CLOSELY — Minor deviations detected. Schedule a follow-up in 4-6 weeks."
  "DIAGNOSTIC FOLLOW-UP NEEDED — Significant abnormalities found. Consult your physician for further testing."
  "DOCTOR CONSULTATION RECOMMENDED — Multiple critical findings. Seek medical attention within 48 hours."

Return ONLY a valid JSON object with these exact keys:
{{
  "patientName": "exact name from report or Unknown",
  "reportDate": "exact date from report or Today",
  "labName": "lab/hospital name from report",
  "reportType": "Blood Test / Urine Test / Lipid Panel / CBC / Thyroid Panel / etc.",
  "testResults": [
    {{
      "testName": "exact test name",
      "value": "exact value",
      "unit": "exact unit",
      "refRange": "exact reference range",
      "status": "Normal | Low | High | Critical",
      "tagColor": "green | amber | red"
    }}
  ],
  "diseaseSummary": [
    {{
      "condition": "condition name",
      "likelihood": "Possible | Probable | Detected",
      "evidencedBy": "test names that suggest this",
      "leadsto": "what this condition leads to if untreated"
    }}
  ],
  "summary": "2-3 sentence premium doctor's narrative opening with overall health picture, naming key findings and their clinical meaning, closing with health status assessment.",
  "aiExplanation": [
    "🟢/🔴/🔵/🟡 TestName — Value Unit (Ref: range) — STATUS. Clinical meaning + what it leads to + actionable recommendation."
  ],
  "triageRecommendation": "One of the 4 triage strings above"
}}"""

    last_exc = None
    is_quota_error = False
    for m_name in PREFERRED_MODELS:
        try:
            vision_model = genai.GenerativeModel(
                m_name,
                generation_config={
                    "response_mime_type": "application/json",
                    "temperature": 0.1,
                    "top_p": 0.9
                }
            )
            parts = [{"mime_type": mime_type, "data": file_bytes}, prompt]

            response = vision_model.generate_content(parts)
            raw_text = response.text.strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
                if raw_text.endswith("```"): raw_text = raw_text[:-3]
            elif raw_text.startswith("```"):
                raw_text = raw_text[3:]
                if raw_text.endswith("```"): raw_text = raw_text[:-3]
            raw_text = raw_text.strip()

            result = json.loads(raw_text)
            print(f"[OCR] Successfully extracted using {m_name}")
            # Ensure diseaseSummary exists
            if "diseaseSummary" not in result:
                result["diseaseSummary"] = []
            if "reportType" not in result:
                result["reportType"] = "Medical Report"
            return result

        except google_exceptions.ResourceExhausted as e:
            last_exc = e
            is_quota_error = True
            print(f"[OCR] Model {m_name} quota exceeded (429): {str(e)[:80]}. Trying next model...")
            continue
        except Exception as e:
            last_exc = e
            err_msg = str(e).lower()
            if any(k in err_msg for k in ["429", "quota", "resource_exhausted", "rate limit"]):
                is_quota_error = True
            print(f"[OCR] Model {m_name} failed: {e}. Trying next model...")
            continue

    print(f"[ERROR] Vision OCR extraction failed on all models. Quota error: {is_quota_error}. Last: {last_exc}")
    return {
        "error": f"RESOURCE_EXHAUSTED: {last_exc}" if is_quota_error else str(last_exc),
        "patientName": "Unknown",
        "reportDate": "Unknown",
        "labName": "Unknown",
        "reportType": "Unknown",
        "testResults": [],
        "diseaseSummary": [],
        "summary": "OCR extraction failed. Please try again or upload a clearer image.",
        "aiExplanation": ["The document could not be processed. Please ensure it is a clear, well-lit medical lab report."],
        "triageRecommendation": "DIAGNOSTIC FOLLOW-UP NEEDED — Could not analyze report. Please consult your physician."
    }

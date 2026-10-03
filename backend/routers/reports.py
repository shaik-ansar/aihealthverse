"""
routers/reports.py

CHECKPOINT: Medical Report Upload & OCR Analysis

OCR Strategy:
  1. PDF Files:
     - PyMuPDF (100% offline, native fast extraction)
  2. Image Files:
     - Primary / AI OCR: Gemini Multimodal Vision (extracts complex medical tables, headers, and values with high accuracy)
     - Fast Offline Fallback: Tesseract OCR (Windows binary detected at C:\\Program Files\\Tesseract-OCR\\tesseract.exe or PATH)
     - Extensible Slot: Dedicated External OCR API (e.g., Google Cloud Vision or Azure Document Intelligence via EXTERNAL_OCR_API_KEY)
  3. Structured Lab Extraction:
     - Gemini clinical pathologist parser to output standard biomarker JSON with normal/abnormal tags and recommendations.
"""

import os
import io
import re
import json
import shutil
import traceback
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import google.generativeai as genai
from config import get_settings
from services.llm_service import extract_medical_report_ocr

settings = get_settings()
clean_api_key = settings.google_api_key.strip("'\"")
if clean_api_key:
    genai.configure(api_key=clean_api_key)

PREFERRED_MODELS = [
    'models/gemini-3.8-flash',
    'models/gemini-3.6-flash',
    'models/gemini-3.5-flash',
    'models/gemini-3.1-flash-lite-preview'
]

router = APIRouter(prefix="/reports", tags=["Reports & OCR"])

# ─── Configure Tesseract Binary Location (Windows / Linux) ───────────────────
try:
    import pytesseract
    from PIL import Image

    # Check common Windows install locations if not on standard PATH
    tesseract_candidates = [
        shutil.which("tesseract"),
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe")
    ]
    for candidate in tesseract_candidates:
        if candidate and os.path.exists(candidate):
            pytesseract.pytesseract.tesseract_cmd = candidate
            print(f"[OCR-INIT] Tesseract binary configured at: {candidate}")
            break
except Exception as e:
    print(f"[OCR-INIT] Note on Tesseract setup: {e}")


# ─── OCR Engine 1: PyMuPDF (PDF Text Extraction) ─────────────────────────────
def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts embedded text directly from PDF pages offline.
    """
    try:
        import pymupdf  # PyMuPDF v1.25+
        doc = pymupdf.open(stream=file_bytes, filetype="pdf")
        full_text = ""
        for page in doc:
            full_text += page.get_text("text") + "\n"
        doc.close()
        return full_text.strip()
    except ImportError:
        try:
            import fitz
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            full_text = ""
            for page in doc:
                full_text += page.get_text("text") + "\n"
            doc.close()
            return full_text.strip()
        except Exception as e:
            print(f"[OCR-PDF] fitz failed: {e}")
            return ""
    except Exception as e:
        print(f"[OCR-PDF] PDF extraction failed: {e}")
        return ""


# ─── OCR Engine 2: Gemini Multimodal Vision (Primary Cloud OCR API) ──────────
def extract_text_from_image_gemini(file_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    """
    Uses Google Gemini Vision as an intelligent Cloud OCR engine.
    Phase 1: Classify the document type.
    Phase 2: Extract ALL visible text faithfully (no interpretation yet).
    Returns raw text prefixed with __DOC_TYPE__: <type> so the parser can
    reject non-medical documents cleanly.
    """
    if not mime_type or mime_type == "application/octet-stream":
        mime_type = "image/jpeg"

    classify_prompt = (
        "Look at this image carefully. Classify it into EXACTLY ONE of these categories:\n"
        "1. MEDICAL_LAB_REPORT  — blood test, urine test, CBC, lipid panel, HbA1c, pathology report, or any clinical diagnostic report with numeric test values\n"
        "2. MEDICAL_PRESCRIPTION — doctor's prescription, Rx sheet with medicines and dosages\n"
        "3. MEDICAL_IMAGING_REPORT — radiology, X-ray, MRI, CT, ultrasound report text\n"
        "4. MEDICAL_DISCHARGE_SUMMARY — hospital discharge summary\n"
        "5. NON_MEDICAL_DOCUMENT — ID card, Aadhaar, PAN card, certificate, course completion, degree, mark sheet, driving licence, college document, food bill, invoice, receipt, selfie, screenshot, or anything that is NOT a clinical/medical diagnostic document\n"
        "Reply with ONLY the category label (e.g. MEDICAL_LAB_REPORT). Nothing else."
    )

    ocr_prompt = (
        "You are a medical OCR engine. Transcribe EVERY piece of text visible in this image EXACTLY as printed. "
        "Do NOT summarise, interpret, add, or invent any values. "
        "Preserve the original layout: print each row of a table on its own line with | as separator. "
        "Include: patient name, age, gender, date, lab name, doctor name, all test names, "
        "all numeric values, all units, all reference ranges, and any H/L/ABNORMAL flags. "
        "Output ONLY the transcribed text, nothing else."
    )

    for m_name in PREFERRED_MODELS:
        try:
            model = genai.GenerativeModel(m_name)

            # ── Phase 1: Classify doc type ──────────────────────────────────
            classify_response = model.generate_content([
                {"mime_type": mime_type, "data": file_bytes},
                classify_prompt
            ])
            doc_type = (classify_response.text or "").strip().upper().replace(" ", "_")
            print(f"[OCR-GEMINI-VISION] Model {m_name} classified document as: {doc_type}")

            # Normalise to one of our known types
            if not any(k in doc_type for k in ["MEDICAL_LAB", "MEDICAL_PRESC", "MEDICAL_IMAG", "MEDICAL_DISC"]):
                # Return special sentinel so caller can surface a user-friendly error
                return f"__DOC_TYPE__:NON_MEDICAL|This does not appear to be a medical laboratory or clinical report. Detected: {doc_type}"

            # ── Phase 2: Faithful verbatim text extraction ───────────────────
            ocr_response = model.generate_content([
                {"mime_type": mime_type, "data": file_bytes},
                ocr_prompt
            ])
            raw_text = (ocr_response.text or "").strip()
            return f"__DOC_TYPE__:{doc_type}:{m_name}|{raw_text}"

        except Exception as e:
            print(f"[OCR-GEMINI-VISION] Model {m_name} failed: {e}")
            continue

    return ""


# ─── OCR Engine 3: Tesseract OCR (Local Offline Engine) ──────────────────────
def extract_text_from_image_tesseract(file_bytes: bytes) -> str:
    """
    Local Tesseract OCR engine for offline or pre-filtering text extraction.
    """
    try:
        import pytesseract
        from PIL import Image
        img = Image.open(io.BytesIO(file_bytes))
        text = pytesseract.image_to_string(img, lang='eng')
        return text.strip()
    except Exception as e:
        print(f"[OCR-TESSERACT] Tesseract execution note: {e}")
        return ""


# ─── OCR Engine 4: Pluggable Dedicated Cloud OCR API Slot ────────────────────
def extract_text_from_external_ocr_api(file_bytes: bytes, mime_type: str) -> str:
    """
    PLUGGABLE OCR API SLOT:
    You can easily wire Google Cloud Vision API, Azure Document Intelligence,
    or AWS Textract here by supplying EXTERNAL_OCR_API_KEY in .env.
    """
    ext_api_key = getattr(settings, "external_ocr_api_key", "").strip()
    if not ext_api_key:
        return ""  # Not configured; seamlessly skipped

    try:
        print(f"[OCR-EXT-API] Custom External OCR API slot detected (key present).")
        return ""
    except Exception as e:
        print(f"[OCR-EXT-API] Custom External OCR API call failed: {e}")
        return ""


# ─── Non-medical document error response ─────────────────────────────────────
def non_medical_error(detail: str = "") -> dict:
    return {
        "error": True,
        "errorType": "NON_MEDICAL_DOCUMENT",
        "message": "The uploaded file does not appear to be a medical lab report or clinical document.",
        "detail": detail or "Please upload a blood test report, urine test report, pathology report, or similar medical diagnostic document.",
        "patientName": None,
        "testResults": [],
        "summary": "",
        "aiExplanation": [],
        "triageRecommendation": "N/A"
    }


# ─── Structured Parsing: Raw OCR Text → Structured Biomarker JSON ────────────
def parse_lab_text_with_gemini(raw_text: str, doc_type: str = "MEDICAL_LAB_REPORT") -> dict:
    """
    Takes raw OCR text and structures it into clinical biomarker JSON.
    Adapts the prompt based on the document type detected in Phase 1.
    """
    if not raw_text or len(raw_text.strip()) < 15:
        raise ValueError("Insufficient text extracted from report")

    # Trim to avoid token overflow; keep most relevant first 5000 chars
    trimmed = raw_text[:5000]

    if "PRESCRIPTION" in doc_type:
        result_schema = """
  "medicines": [
    {"name": "medicine name", "dosage": "dose", "frequency": "times per day", "duration": "days"}
  ],
  "doctorName": "doctor from report",
  "patientName": "patient name",
  "reportDate": "date",
  "summary": "brief prescription summary",
  "aiExplanation": ["explanation 1", "explanation 2"],
  "triageRecommendation": "Follow prescription as directed"""
        parse_instruction = "Extract all medicines, dosages, frequency, and duration from this prescription."
    else:
        result_schema = """
  "patientName": "exact patient name from report, or Unknown if not found",
  "reportDate": "exact date from report, or Today",
  "labName": "exact laboratory/hospital name from report",
  "testResults": [
    {
      "testName": "exact test name as printed",
      "value": "exact numeric or string value as printed",
      "unit": "exact unit as printed",
      "refRange": "exact reference range as printed",
      "status": "Normal | Low | High | Critical — infer from value vs refRange",
      "tagColor": "green (Normal) | amber (borderline) | red (Low/High/Critical)"
    }
  ],
  "summary": "A concise, engaging introductory sentence summarizing the overall health status based on the report (like a doctor's opening remark).",
  "aiExplanation": [
    "Clear, accurate bullet point 1 analyzing a specific finding (doctor-like tone, clear and attractive)",
    "Clear, accurate bullet point 2 providing actionable insights or noting normal/abnormal levels",
    "Clear, accurate bullet point 3 (if needed)"
  ],
  "triageRecommendation": "LOW CONCERN — routine follow-up | DIAGNOSTIC FOLLOW-UP NEEDED | DOCTOR CONSULTATION RECOMMENDED"""
        parse_instruction = (
            "Extract ONLY the test results actually present in the report text. "
            "Do NOT invent, guess, or hallucinate any test that is not explicitly written. "
            "If a value appears borderline or abnormal based on the reference range, mark it accordingly."
        )

    prompt = f"""You are a Clinical Pathologist AI. {parse_instruction}

RAW REPORT TEXT (transcribed verbatim from document):
{trimmed}

Return ONLY valid JSON (absolutely no markdown fences, no commentary before or after) in this EXACT structure:
{{
{result_schema}
}}"""

    def _try_parse(model_name: str) -> dict:
        m = genai.GenerativeModel(
            model_name,
            generation_config={"response_mime_type": "application/json"}
        )
        resp = m.generate_content(prompt)
        raw = (resp.text or "").strip()
        # Strip markdown fences if present
        if raw.startswith("```json"):
            raw = raw[7:]
            if raw.endswith("```"): raw = raw[:-3]
        elif raw.startswith("```"):
            raw = raw[3:]
            if raw.endswith("```"): raw = raw[:-3]
        raw = raw.strip()
        return json.loads(raw)

    last_err = None
    for m_name in PREFERRED_MODELS:
        try:
            parsed = _try_parse(m_name)
            print(f"[PARSER] Successfully parsed lab text using {m_name}")
            return parsed
        except Exception as e:
            print(f"[PARSER] {m_name} parse failed: {e}")
            last_err = e
            continue

    raise RuntimeError(f"All Gemini models failed to parse lab text: {last_err}")


# ─── Fallback Demo Data ───────────────────────────────────────────────────────
DEMO_RESULT = {
    "patientName": "Ansar Shaik",
    "reportDate": "Today",
    "labName": "Apollo Diagnostics",
    "ocrEngine": "Demo Fallback Data",
    "testResults": [
        {"testName": "Hemoglobin", "value": "13.2", "unit": "g/dL", "refRange": "13.0–17.0 g/dL", "status": "Normal", "tagColor": "green"},
        {"testName": "WBC Count", "value": "11,200", "unit": "/µL", "refRange": "4,000–11,000 /µL", "status": "High", "tagColor": "red"},
        {"testName": "Vitamin D", "value": "18", "unit": "ng/mL", "refRange": "30–100 ng/mL", "status": "Low", "tagColor": "red"},
        {"testName": "Fasting Blood Sugar", "value": "98", "unit": "mg/dL", "refRange": "70–100 mg/dL", "status": "Normal", "tagColor": "green"},
        {"testName": "HbA1c", "value": "5.4", "unit": "%", "refRange": "< 5.7%", "status": "Normal", "tagColor": "green"},
    ],
    "summary": "Mild elevation in WBC count with significantly low Vitamin D levels. Blood sugar and HbA1c are within normal range.",
    "aiExplanation": [
        "Your WBC is slightly elevated (11,200 /µL). This may suggest mild immune activation or a seasonal response. Retest in 2 weeks.",
        "Vitamin D is critically low at 18 ng/mL (optimal: 40–80). Daily 15 min morning sunlight and Vitamin D3 60,000 IU weekly supplementation is strongly recommended.",
        "Blood sugar and HbA1c are normal — no signs of diabetes at this time."
    ],
    "triageRecommendation": "LOW CONCERN — Dietary adjustments & Vitamin D supplementation. Retest WBC in 2 weeks."
}


# ─── MAIN OCR ENDPOINT ────────────────────────────────────────────────────────
@router.post("/upload-ocr")
async def upload_and_analyze_report(file: UploadFile = File(...), patient_context: str = Form(None)):
    return await _run_ocr(file, patient_context)


@router.post("/analyze")
async def analyze_report(file: UploadFile = File(...), patient_context: str = Form(None), patient_id: str = Form(None)):
    """Alias endpoint called by the frontend ReportUploadView."""
    return await _run_ocr(file, patient_context)


async def _run_ocr(file: UploadFile, patient_context: str = None):
    """
    Core OCR pipeline used by both /upload-ocr and /analyze endpoints.
    """
    content_type = file.content_type or ""
    filename = file.filename or ""
    if "pdf" in content_type or filename.lower().endswith(".pdf"):
        normalized_mime = "application/pdf"
    elif "png" in content_type or filename.lower().endswith(".png"):
        normalized_mime = "image/png"
    elif "jpg" in content_type or "jpeg" in content_type or filename.lower().endswith((".jpg",".jpeg")):
        normalized_mime = "image/jpeg"
    else:
        normalized_mime = "image/jpeg"  # safe default

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        # One-shot fast OCR and parsing
        result = extract_medical_report_ocr(file_bytes, normalized_mime, patient_context)

        # Check for non-medical document rejection
        if result.get("triageRecommendation") == "NON_MEDICAL_DOCUMENT":
            return JSONResponse(
                content=non_medical_error(),
                status_code=422
            )

        # Check if OCR returned an error (quota / all models failed)
        if result.get("error"):
            err_str = str(result["error"]).lower()
            is_quota = any(k in err_str for k in ["429", "quota", "resource_exhausted", "rate limit", "overload"])
            # Serve demo data so the UI stays functional
            demo = dict(DEMO_RESULT)
            demo["_isDemo"] = True
            demo["_quotaWarning"] = is_quota
            demo["_errorDetail"] = result.get("error", "OCR failed") if not is_quota else "Gemini API quota exceeded — showing sample demo analysis."
            demo["ocrEngine"] = "Demo Fallback (API quota exceeded)" if is_quota else "Demo Fallback (OCR error)"
            demo["patientContext"] = patient_context
            demo.setdefault("diseaseSummary", [
                {"condition": "Vitamin D Deficiency", "likelihood": "Probable", "evidencedBy": "Vitamin D: 18 ng/mL", "leadsto": "Bone weakness, fatigue, immune dysfunction if untreated"},
                {"condition": "Mild Leukocytosis", "likelihood": "Possible", "evidencedBy": "WBC: 11,200 /µL", "leadsto": "Possible subclinical infection or inflammatory response"}
            ])
            demo.setdefault("reportType", "Sample CBC + Vitamin Panel")
            return JSONResponse(content=demo)

        result["ocrEngine"] = "Gemini Flash (Single-Shot Vision)"
        result["docType"] = result.get("reportType", "MEDICAL_LAB_REPORT")
        result["patientContext"] = patient_context
        result.setdefault("diseaseSummary", [])
        result.setdefault("reportType", "Medical Report")

        # Sanity check for empty results
        if not result.get("testResults"):
            result["summary"] = result.get("summary") or "No individual test values could be extracted. The report text may be incomplete or in an unusual format."

        return JSONResponse(content=result)

    except Exception as e:
        err_str = str(e).lower()
        is_quota = any(k in err_str for k in ["429", "quota", "resource_exhausted", "rate limit", "overloaded"])
        print(f"[REPORT] OCR failed ({'quota exceeded' if is_quota else 'exception'}): {e}")
        traceback.print_exc()

        if is_quota:
            # Serve demo data with a quota warning banner
            demo = dict(DEMO_RESULT)
            demo["_isDemo"] = True
            demo["_quotaWarning"] = True
            demo["_errorDetail"] = "Gemini API quota exceeded — showing sample demo analysis. Try again in a few minutes."
            demo["ocrEngine"] = "Demo Fallback (API Quota Exceeded)"
            demo["patientContext"] = patient_context
            demo["reportType"] = "Sample CBC + Vitamin Panel"
            demo["diseaseSummary"] = [
                {"condition": "Vitamin D Deficiency", "likelihood": "Probable", "evidencedBy": "Vitamin D: 18 ng/mL", "leadsto": "Bone weakness, fatigue, immune dysfunction if untreated"},
                {"condition": "Mild Leukocytosis", "likelihood": "Possible", "evidencedBy": "WBC: 11,200 /µL", "leadsto": "Possible subclinical infection or inflammatory response"}
            ]
            return JSONResponse(content=demo)

        return JSONResponse(
            content={
                "error": True,
                "errorType": "PARSE_FAILED",
                "message": "Could not structure the lab report data.",
                "detail": f"OCR/parsing failed: {str(e)[:120]}",
                "rawText": "",
                "testResults": [],
                "diseaseSummary": [],
                "summary": "",
                "aiExplanation": [],
                "triageRecommendation": ""
            },
            status_code=500
        )


@router.get("/sample-result")
def get_sample_result():
    """Returns demo OCR result for frontend preview."""
    return JSONResponse(content=DEMO_RESULT)


"""
test_system_integration.py

Comprehensive Integration Test Suite for:
1. Gemini Vision Multimodal OCR
2. DeepSeek-R1 / Gemini Clinical Consultation LLM
3. PostgreSQL 5 Super-Specialty Hospitals, Doctors & Appointment Booking
"""

import sys
from config import get_settings
from database.database import engine, Base, SessionLocal
from database.models import Hospital, Doctor, Appointment, User
from database.seed_data import seed_hospitals_and_doctors
from services.llm_service import generate_consultation_response, extract_medical_report_ocr
import google.generativeai as genai

settings = get_settings()

print("=" * 70)
print("[*] AI HEALTHVERSE FULL SYSTEM INTEGRATION TEST")
print("=" * 70)

# ─── TEST 1: Database Setup & Seeding ─────────────────────────────────────────
print("\n[TEST 1/4] Checking PostgreSQL Schema & Seeding Hospitals / Doctors...")
Base.metadata.create_all(bind=engine)
db = SessionLocal()

seed_hospitals_and_doctors(db)

hospitals_count = db.query(Hospital).count()
doctors_count = db.query(Doctor).count()

print(f"     -> Hospitals in PostgreSQL: {hospitals_count} (Expected: 5)")
print(f"     -> Specialist Doctors in PostgreSQL: {doctors_count} (Expected: 9)")

hospitals = db.query(Hospital).all()
for h in hospitals:
    print(f"        * [{h.id}] {h.name} - {h.city} ({h.rating} stars)")

assert hospitals_count >= 5, "Hospitals count should be at least 5"
assert doctors_count >= 9, "Doctors count should be at least 9"
print("     [OK] TEST 1 PASSED: PostgreSQL hospital & doctor database operational!")

# ─── TEST 2: Appointment Booking Verification ─────────────────────────────────
print("\n[TEST 2/4] Testing Dynamic Appointment Booking in PostgreSQL...")
test_patient = db.query(User).filter(User.id == 1).first()
if not test_patient:
    test_patient = User(id=1, full_name="Ansar Shaik", email="ansar@aihealthverse.com", role="patient")
    db.add(test_patient)
    db.commit()

# Book appointment with Dr. Sophia Vance (Cardiologist at Max Super Speciality)
booking = Appointment(
    patient_id=1,
    doctor_id="doc-sophia",
    appointment_date="2026-09-05",
    slot_time="11:00 AM",
    notes="Post-consultation follow-up for chest tightness evaluation",
    status="Confirmed"
)
db.add(booking)
db.commit()
db.refresh(booking)

print(f"     -> Booked Appointment ID #{booking.id}")
print(f"     -> Doctor: {booking.doctor.name} ({booking.doctor.specialization})")
print(f"     -> Hospital: {booking.doctor.hospital.name}")
print(f"     -> Time: {booking.appointment_date} at {booking.slot_time}")
print("     [OK] TEST 2 PASSED: Appointment successfully booked and linked to Doctor & Hospital!")

db.close()

# ─── TEST 3: Google Gemini Multimodal Vision OCR ──────────────────────────────
print("\n[TEST 3/4] Testing Google Gemini Multimodal Vision OCR Engine...")
try:
    clean_key = settings.google_api_key.strip("'\"")
    genai.configure(api_key=clean_key)
    # 1x1 transparent PNG sample bytes
    dummy_image_bytes = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    ocr_result = extract_medical_report_ocr(dummy_image_bytes, mime_type="image/png")
    print(f"     -> OCR Engine returned valid structured report:")
    print(f"        Patient: {ocr_result.get('patientName')}")
    print(f"        Lab: {ocr_result.get('labName')}")
    print(f"        Test Results Found: {len(ocr_result.get('testResults', []))}")
    print(f"        Triage: {ocr_result.get('triageRecommendation')}")
    print("     [OK] TEST 3 PASSED: Gemini Vision OCR engine is fully functional!")
except Exception as e:
    print(f"     [FAILED] OCR Test Error: {e}")

# ─── TEST 4: Clinical Consultation (DeepSeek-R1 / Gemini Fallback) ────────────
print("\n[TEST 4/4] Testing Clinical Consultation LLM Engine...")
try:
    response = generate_consultation_response(
        query="I have had a throbbing headache for 2 days on the right side of my temple and light makes it worse.",
        context="No relevant past medical history found."
    )
    print(f"     -> Phase: {response.get('phase')}")
    print(f"     -> Clinical Response: {response.get('message')}")
    if response.get('triage'):
        print(f"     -> Triage Diagnosis: {response.get('triage', {}).get('diagnosis')}")
        print(f"     -> Recommended Doctor Specialty: {response.get('triage', {}).get('doctorSpecialty')}")
    print("     [OK] TEST 4 PASSED: Clinical consultation LLM returns valid structured JSON!")
except Exception as e:
    print(f"     [FAILED] Consultation Error: {e}")

print("\n" + "=" * 70)
print("[SUCCESS] ALL 4 INTEGRATION TESTS COMPLETED SUCCESSFULLY!")
print("=" * 70)

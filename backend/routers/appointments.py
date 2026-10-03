"""
routers/appointments.py

CHECKPOINT: Hospital Directory, Specialist Doctors Retrieval & Appointment Booking Router
"""

import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List
from database.database import get_db
from database.models import Hospital, Doctor, Appointment, User
from routers.auth import get_current_user
from datetime import date, timedelta


def _fresh_dates(n: int = 10, skip_sun: bool = True) -> List[str]:
    """Compute n upcoming dates from today (excluding Sundays by default)."""
    out, d = [], date.today()
    while len(out) < n:
        if not (skip_sun and d.weekday() == 6):
            out.append(d.strftime("%Y-%m-%d"))
        d += timedelta(days=1)
    return out


FRESH_DATES: dict = {}

router = APIRouter(prefix="", tags=["Hospitals & Appointments"])

# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class HospitalOut(BaseModel):
    id: str
    name: str
    location: str
    city: str
    rating: float
    reviews_count: int
    accreditation: str
    phone: Optional[str] = None
    image: Optional[str] = None
    departments: List[str]

    class Config:
        from_attributes = True


class DoctorOut(BaseModel):
    id: str
    name: str
    specialization: str
    sub_specialty: Optional[str] = None
    hospital_id: str
    hospital_name: Optional[str] = None
    experience: str
    rating: float
    reviews_count: int
    fee: str
    avatar: Optional[str] = None
    available_dates: List[str]
    slots: List[str]

    class Config:
        from_attributes = True


class AppointmentCreate(BaseModel):
    # patient_id is now derived from the JWT token — not user-supplied
    doctor_id: str = Field(..., description="Doctor ID (e.g. doc-sophia)")
    appointment_date: str = Field(..., description="Date (YYYY-MM-DD)")
    slot_time: str = Field(..., description="Time slot (e.g. 11:00 AM)")
    notes: Optional[str] = Field(default="", description="Reason for consultation or triage summary")


class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    doctor_id: str
    doctor_name: str
    doctor_specialization: str
    hospital_name: str
    appointment_date: str
    slot_time: str
    status: str
    notes: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/hospitals", response_model=List[HospitalOut])
def get_all_hospitals(db: Session = Depends(get_db)):
    """Retrieve all 5 super-speciality hospitals with department listings."""
    hospitals = db.query(Hospital).all()
    results = []
    for h in hospitals:
        depts = []
        if h.departments:
            try:
                depts = json.loads(h.departments) if isinstance(h.departments, str) else h.departments
            except Exception:
                depts = []
        results.append(HospitalOut(
            id=h.id,
            name=h.name,
            location=h.location,
            city=h.city,
            rating=h.rating,
            reviews_count=h.reviews_count,
            accreditation=h.accreditation,
            phone=h.phone,
            image=h.image,
            departments=depts
        ))
    return results


@router.get("/doctors", response_model=List[DoctorOut])
def get_doctors(
    specialization: Optional[str] = Query(None, description="Filter by specialization (e.g. Cardiologist)"),
    hospital_id:    Optional[str] = Query(None, description="Filter by hospital ID"),
    date_filter:    Optional[str] = Query(None, alias="date", description="Filter by available date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Retrieve specialist doctors from PostgreSQL.
    Available dates are always recomputed fresh from today so they are never stale.
    Number of available dates matches the original seeded count (D10/D8/D6/D5/D4/D3).
    """
    query = db.query(Doctor)
    if specialization:
        query = query.filter(Doctor.specialization.ilike(f"%{specialization}%"))
    if hospital_id:
        query = query.filter(Doctor.hospital_id == hospital_id)

    doctors_db = query.order_by(Doctor.rating.desc()).all()

    # Generate fresh dates once per request (cached per call)
    fresh_10 = _fresh_dates(10)

    results = []
    for d in doctors_db:
        # Parse stored dates only to get the count the doctor was seeded with
        try:
            stored_dates = json.loads(d.available_dates) if isinstance(d.available_dates, str) else (d.available_dates or [])
            n_dates = max(len(stored_dates), 5)  # fallback to 5 if empty
        except Exception:
            n_dates = 5

        # Always use fresh dates starting today
        fresh_dates = fresh_10[:min(n_dates, 10)]

        try:
            slots = json.loads(d.slots) if isinstance(d.slots, str) else (d.slots or [])
        except Exception:
            slots = ["09:00 AM", "11:00 AM", "02:00 PM", "04:30 PM"]

        if not slots:
            slots = ["09:00 AM", "11:00 AM", "02:00 PM", "04:30 PM"]

        # Filter by requested date
        if date_filter and date_filter not in fresh_dates:
            continue

        hosp_name = d.hospital.name if d.hospital else "Apollo Multi-Speciality Hospital"

        results.append(DoctorOut(
            id=d.id,
            name=d.name,
            specialization=d.specialization,
            sub_specialty=d.sub_specialty,
            hospital_id=d.hospital_id,
            hospital_name=hosp_name,
            experience=d.experience,
            rating=d.rating,
            reviews_count=d.reviews_count,
            fee=d.fee,
            avatar=d.avatar,
            available_dates=fresh_dates,
            slots=slots
        ))
    return results


@router.get("/doctors/specialties", response_model=List[str])
def get_specialties(db: Session = Depends(get_db)):
    """Return distinct specializations available in the doctors database."""
    rows = db.query(Doctor.specialization).distinct().order_by(Doctor.specialization).all()
    return [r[0] for r in rows if r[0]]


@router.post("/appointments/book", response_model=AppointmentOut)
def book_appointment(
    booking: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Book an appointment. The patient_id is taken from the JWT token (not user input).
    """
    # Always use the authenticated user's real ID
    patient_id = current_user.id

    # 1. Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == booking.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail=f"Doctor with ID '{booking.doctor_id}' not found.")

    # 2. Check for duplicate (same doctor + date + slot + patient) — prevent double booking
    existing = db.query(Appointment).filter(
        Appointment.patient_id == patient_id,
        Appointment.doctor_id  == booking.doctor_id,
        Appointment.appointment_date == booking.appointment_date,
        Appointment.slot_time  == booking.slot_time,
        Appointment.status     == "Confirmed"
    ).first()

    if existing:
        new_appointment = existing
    else:
        new_appointment = Appointment(
            patient_id=patient_id,
            doctor_id=booking.doctor_id,
            appointment_date=booking.appointment_date,
            slot_time=booking.slot_time,
            notes=booking.notes,
            status="Confirmed"
        )
        db.add(new_appointment)
        db.commit()
        db.refresh(new_appointment)

    hosp_name = doctor.hospital.name if doctor.hospital else "Super Speciality Hospital"

    return AppointmentOut(
        id=new_appointment.id,
        patient_id=new_appointment.patient_id,
        doctor_id=new_appointment.doctor_id,
        doctor_name=doctor.name,
        doctor_specialization=doctor.specialization,
        hospital_name=hosp_name,
        appointment_date=new_appointment.appointment_date,
        slot_time=new_appointment.slot_time,
        status=new_appointment.status,
        notes=new_appointment.notes,
        created_at=str(new_appointment.created_at)
    )


@router.get("/appointments/patient/{patient_id}", response_model=List[AppointmentOut])
def get_patient_appointments(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all appointments for a patient. Patients see only their own."""
    if current_user.role == 'patient' and current_user.id != patient_id:
        raise HTTPException(status_code=403, detail="Access denied.")
    appointments = db.query(Appointment).filter(Appointment.patient_id == patient_id).order_by(Appointment.id.desc()).all()
    results = []
    for appt in appointments:
        doc = appt.doctor
        doc_name = doc.name if doc else "Specialist Doctor"
        doc_spec = doc.specialization if doc else "General Physician"
        hosp_name = doc.hospital.name if doc and doc.hospital else "Hospital"
        results.append(AppointmentOut(
            id=appt.id, patient_id=appt.patient_id, doctor_id=appt.doctor_id,
            doctor_name=doc_name, doctor_specialization=doc_spec, hospital_name=hosp_name,
            appointment_date=appt.appointment_date, slot_time=appt.slot_time,
            status=appt.status, notes=appt.notes, created_at=str(appt.created_at)
        ))
    return results


@router.patch("/appointments/{appointment_id}/cancel")
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel an appointment. Patients can only cancel their own."""
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail=f"Appointment {appointment_id} not found.")
    if current_user.role == 'patient' and appt.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only cancel your own appointments.")
    appt.status = "Cancelled"
    db.commit()
    return {"id": appointment_id, "status": "Cancelled", "message": "Appointment cancelled successfully"}


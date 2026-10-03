import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from database.database import get_db
from database.models import HealthRecord, User
from routers.auth import get_current_user

router = APIRouter(prefix="/records", tags=["Health Records"])

# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class RecordCreate(BaseModel):
    patient_id: int
    record_type: str  # 'consultation' | 'report' | 'prescription'
    content: dict

class RecordResponse(BaseModel):
    id: int
    patient_id: int
    record_type: str
    content: dict
    timestamp: datetime

    class Config:
        from_attributes = True

# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("", response_model=RecordResponse)
def create_record(
    record: RecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Save a new health record (consultation, report, or prescription).
    Authenticated — only the record owner or an admin can write.
    """
    # Doctors can write for any patient; patients can only write for themselves
    if current_user.role == 'patient' and current_user.id != record.patient_id:
        raise HTTPException(status_code=403, detail="You can only create records for your own account.")

    try:
        new_record = HealthRecord(
            patient_id=record.patient_id,
            record_type=record.record_type,
            content=json.dumps(record.content)
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)

        return RecordResponse(
            id=new_record.id,
            patient_id=new_record.patient_id,
            record_type=new_record.record_type,
            content=json.loads(new_record.content),
            timestamp=new_record.timestamp
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{patient_id}", response_model=List[RecordResponse])
def get_patient_records(
    patient_id: int,
    record_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all health records for a patient.
    Authenticated — patients can only see their own; doctors can see all.
    """
    if current_user.role == 'patient' and current_user.id != patient_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    query = db.query(HealthRecord).filter(HealthRecord.patient_id == patient_id)
    if record_type:
        query = query.filter(HealthRecord.record_type == record_type)
    records = query.order_by(HealthRecord.timestamp.desc()).all()

    response = []
    for r in records:
        try:
            content_dict = json.loads(r.content)
        except Exception:
            content_dict = {}
        response.append(RecordResponse(
            id=r.id,
            patient_id=r.patient_id,
            record_type=r.record_type,
            content=content_dict,
            timestamp=r.timestamp
        ))
    return response

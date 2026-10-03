"""
database/models.py

CHECKPOINT: Database Schema / ORM Models

Strategy for embeddings:
- pgvector extension NOT installed on this PostgreSQL instance.
- We store embeddings as a TEXT column (JSON-serialized list of floats).
- The RAG engine serializes/deserializes as needed.
- If pgvector is installed in future, swap Text -> Vector(3072).
"""

from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    # CHECKPOINT: User Schema
    id        = Column(Integer, primary_key=True, index=True)
    role      = Column(String(50), default="patient")       # 'patient' | 'doctor'
    full_name = Column(String(100), nullable=False)
    email     = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    profile_data = Column(Text, nullable=True) # JSON profile details (height, weight, dob)

    records = relationship("HealthRecord", back_populates="patient")
    appointments = relationship("Appointment", back_populates="patient")


class HealthRecord(Base):
    __tablename__ = "health_records"

    # CHECKPOINT: Health Record Schema
    id          = Column(Integer, primary_key=True, index=True)
    patient_id  = Column(Integer, ForeignKey("users.id"))
    record_type = Column(String(50))   # 'consultation' | 'report' | 'prescription'
    content     = Column(Text, nullable=False)
    timestamp   = Column(DateTime, default=datetime.utcnow)

    patient    = relationship("User", back_populates="records")
    embeddings = relationship("VectorEmbedding", back_populates="record")


class VectorEmbedding(Base):
    __tablename__ = "vector_embeddings"

    # CHECKPOINT: Vector Store Schema
    # Embeddings stored as TEXT (JSON array string) since pgvector extension
    # is not installed on this PostgreSQL instance.
    # RAG engine uses cosine similarity computed in Python.
    id        = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("health_records.id"))
    embedding = Column(Text)  # JSON-serialized list[float] of 3072 dimensions

    record = relationship("HealthRecord", back_populates="embeddings")


class Hospital(Base):
    __tablename__ = "hospitals"

    # CHECKPOINT: Super-Speciality Hospital Directory Schema
    id            = Column(String(50), primary_key=True, index=True)
    name          = Column(String(150), nullable=False)
    location      = Column(String(200), nullable=False)
    city          = Column(String(100), default="Hyderabad")
    rating        = Column(Float, default=4.8)
    reviews_count = Column(Integer, default=1000)
    accreditation = Column(String(150), default="NABH & JCI Accredited")
    phone         = Column(String(50))
    image         = Column(String(500))
    departments   = Column(Text)  # JSON array string of departments

    doctors = relationship("Doctor", back_populates="hospital")


class Doctor(Base):
    __tablename__ = "doctors"

    # CHECKPOINT: Specialist Doctor Schema
    id              = Column(String(50), primary_key=True, index=True)
    name            = Column(String(150), nullable=False)
    specialization  = Column(String(100), nullable=False, index=True)
    sub_specialty   = Column(String(150))
    hospital_id     = Column(String(50), ForeignKey("hospitals.id"))
    experience      = Column(String(50))
    rating          = Column(Float, default=4.8)
    reviews_count   = Column(Integer, default=200)
    fee             = Column(String(50), default="₹800")
    avatar          = Column(String(500))
    available_dates = Column(Text)  # JSON array string of dates
    slots           = Column(Text)  # JSON array string of time slots

    hospital     = relationship("Hospital", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")


class Appointment(Base):
    __tablename__ = "appointments"

    # CHECKPOINT: Patient Doctor Appointment Booking Schema
    id               = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id        = Column(String(50), ForeignKey("doctors.id"), nullable=False)
    appointment_date = Column(String(50), nullable=False)
    slot_time        = Column(String(50), nullable=False)
    status           = Column(String(50), default="Confirmed")  # 'Confirmed' | 'Completed' | 'Cancelled'
    notes            = Column(Text, nullable=True)
    created_at       = Column(DateTime, default=datetime.utcnow)

    patient = relationship("User", back_populates="appointments")
    doctor  = relationship("Doctor", back_populates="appointments")

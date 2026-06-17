from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.types import JSON
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

DATABASE_URL = "sqlite:///../backend/medcare.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─────────────────────────────────────────────
# Mapped Doctor Models (for Reading Data)
# ─────────────────────────────────────────────

class Patient(Base):
    __tablename__ = "patients"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    sex = Column(String, nullable=False)
    weight_kg = Column(Float, nullable=True)
    blood_group = Column(String, nullable=True)
    allergies = Column(JSON, default=[])
    contact = Column(String, nullable=True)
    address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    gamification = relationship("PatientGamification", back_populates="patient", uselist=False)

class Case(Base):
    __tablename__ = "cases"
    id = Column(String, primary_key=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    discharge_text = Column(Text, nullable=True)
    status = Column(String, default="uploaded")
    extracted_entities = Column(JSON, nullable=True)
    resolved_rules = Column(JSON, nullable=True)
    human_review_flags = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    
    care_plan = relationship("CarePlan", back_populates="case", uselist=False)

class CarePlan(Base):
    __tablename__ = "care_plans"
    id = Column(String, primary_key=True)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False)
    plan_data = Column(JSON, nullable=False)
    approved = Column(Boolean, default=False)
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    case = relationship("Case", back_populates="care_plan")

# ─────────────────────────────────────────────
# Patient-Specific Gamification & Tracking Model
# ─────────────────────────────────────────────

class PatientGamification(Base):
    __tablename__ = "patient_gamification"
    patient_id = Column(String, ForeignKey("patients.id"), primary_key=True)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_active_date = Column(String, nullable=True)
    badges = Column(JSON, default=[])         # Array of badge strings, e.g., ["first_step", "move_it"]
    task_log = Column(JSON, default={})        # JSON map: {"2026-06-17": {"exercise": true, "bp_morning": false}}
    vital_log = Column(JSON, default=[])       # List of vital measurements: [{"date": "...", "bp": "...", ...}]
    
    patient = relationship("Patient", back_populates="gamification")

# ─────────────────────────────────────────────
# Pydantic Schemas for Patient APIs
# ─────────────────────────────────────────────

class PatientListOut(BaseModel):
    id: str
    name: str
    age: int
    sex: str
    created_at: datetime
    class Config:
        from_attributes = True

class GamificationState(BaseModel):
    patient_id: str
    xp: int
    level: int
    streak: int
    longest_streak: int
    last_active_date: Optional[str] = None
    badges: List[str] = []
    task_log: Dict[str, Dict[str, bool]] = {}
    vital_log: List[Dict[str, Any]] = []

class GamificationSave(BaseModel):
    xp: int
    level: int
    streak: int
    longest_streak: int
    last_active_date: Optional[str] = None
    badges: List[str] = []
    task_log: Dict[str, Dict[str, bool]] = {}
    vital_log: List[Dict[str, Any]] = []

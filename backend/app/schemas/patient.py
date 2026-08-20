"""
app/schemas/patient.py
Pydantic v2 models for the PATIENT entity.
"""
from pydantic import BaseModel, Field
from typing import Optional


class PatientBase(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    bmi: Optional[float] = None
    smoking_status: Optional[str] = None
    alcohol_use: Optional[str] = None
    physical_activity: Optional[str] = None
    income_range: Optional[str] = None
    education_level: Optional[str] = None
    health_literacy_score: Optional[float] = None
    state: Optional[str] = None
    locality_type: Optional[str] = None
    care_sector: Optional[str] = None
    comorbidity_count: Optional[int] = None
    diabetes_flag: Optional[int] = Field(default=0, ge=0, le=1)
    disease_duration: Optional[float] = None
    diagnosis_age: Optional[float] = None
    forgetfulness_propensity: Optional[float] = None
    baseline_bp_control: Optional[int] = Field(default=0, ge=0, le=1)
    diagnosis: Optional[str] = None
    enrollment_date: Optional[str] = None
    medication_status: Optional[str] = None


class PatientCreate(PatientBase):
    patient_id: str


class PatientUpdate(PatientBase):
    """All fields optional for PUT (full replace also uses this)."""
    pass


class PatientResponse(PatientBase):
    patient_id: str

    model_config = {"from_attributes": True}


class PatientListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[PatientResponse]


# ---------------------------------------------------------------
# Full-profile response — joins all related data for one patient
# Shape mirrors the frontend mock patient object
# ---------------------------------------------------------------
class RiskFactorItem(BaseModel):
    factor: str
    contribution: float


class InterventionHistoryItem(BaseModel):
    type: str
    status: str
    timestamp: str


class PatientFullProfile(BaseModel):
    patient_id: str
    diagnosis: Optional[str] = None
    therapy_area: Optional[str] = None

    # From ML_FEATURES (latest)
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    adherence: Optional[float] = None          # derived from missed_refill_rate
    persistency_months: Optional[float] = None

    # From PHARMACY_CLAIM (latest)
    refill_gap_days: Optional[int] = None
    copay_level: Optional[str] = None          # derived from avg copay bucket

    # Comorbidities list (derived from patient fields)
    comorbidities: list[str] = []

    # From RISK_SCORE (latest)
    top_risk_factors: list[RiskFactorItem] = []
    estimated_time_to_discontinuation: Optional[float] = None

    # From ACTION_RULES (latest risk_band lookup)
    recommended_action: Optional[str] = None

    # From SUPPORT_EVENT / OUTCOME_LOG
    intervention_status: Optional[str] = "Pending"
    intervention_history: list[InterventionHistoryItem] = []

    # Raw patient demographics
    age: Optional[int] = None
    gender: Optional[str] = None
    bmi: Optional[float] = None
    comorbidity_count: Optional[int] = None
    diabetes_flag: Optional[int] = None
    state: Optional[str] = None
    enrollment_date: Optional[str] = None
    medication_status: Optional[str] = None
    missed_doses: Optional[int] = None
    days_since_last_medication: Optional[int] = None

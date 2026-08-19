"""
app/schemas/ml_features.py
Pydantic v2 models for the ML_FEATURES entity.
These are written by the external ML/feature-engineering pipeline.
"""
from pydantic import BaseModel, Field
from typing import Optional


class MLFeaturesBase(BaseModel):
    patient_id: str
    prediction_date: Optional[str] = None
    missed_refill_rate: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    avg_refill_gap: Optional[float] = None
    max_refill_gap: Optional[float] = None
    avg_financial_burden: Optional[float] = None
    medication_count: Optional[int] = None
    unique_drug_classes: Optional[int] = None
    regimen_complexity_score: Optional[float] = None
    support_contact_count: Optional[int] = None
    patient_response_rate: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    non_persistent_next_60d: Optional[int] = Field(default=0, ge=0, le=1)


class MLFeaturesCreate(MLFeaturesBase):
    feature_id: str


class MLFeaturesUpdate(MLFeaturesBase):
    patient_id: Optional[str] = None


class MLFeaturesResponse(MLFeaturesBase):
    feature_id: str

    model_config = {"from_attributes": True}


class MLFeaturesListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[MLFeaturesResponse]

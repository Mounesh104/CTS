"""
app/schemas/therapy_outcome.py
Pydantic v2 models for the THERAPY_OUTCOME entity.
Written by the external ML pipeline as labeled outcomes.
"""
from pydantic import BaseModel, Field
from typing import Optional


class TherapyOutcomeBase(BaseModel):
    patient_id: str
    therapy_start_date: Optional[str] = None
    prediction_date: Optional[str] = None
    prediction_window_end_date: Optional[str] = None
    followup_end_date: Optional[str] = None
    discontinuation_date: Optional[str] = None
    discontinuation_flag: Optional[int] = Field(default=0, ge=0, le=1)
    event_observed: Optional[int] = Field(default=0, ge=0, le=1)
    persistence_days: Optional[int] = None
    censoring_type: Optional[str] = None
    non_persistent_next_60d: Optional[int] = Field(default=0, ge=0, le=1)
    side_effect_concern: Optional[int] = Field(default=0, ge=0, le=1)
    perceived_treatment_benefit: Optional[float] = None


class TherapyOutcomeCreate(TherapyOutcomeBase):
    therapy_id: str


class TherapyOutcomeUpdate(TherapyOutcomeBase):
    patient_id: Optional[str] = None


class TherapyOutcomeResponse(TherapyOutcomeBase):
    therapy_id: str

    model_config = {"from_attributes": True}


class TherapyOutcomeListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[TherapyOutcomeResponse]

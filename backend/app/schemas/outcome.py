"""
app/schemas/outcome.py
Pydantic v2 models for OUTCOME_LOG entity.
"""
from pydantic import BaseModel
from typing import Optional


class OutcomeLogBase(BaseModel):
    patient_id: str
    intervention_performed: Optional[str] = None
    intervention_date: Optional[str] = None
    intervention_channel: Optional[str] = None
    patient_response: Optional[str] = None
    outcome_recorded: Optional[str] = None


class OutcomeLogCreate(OutcomeLogBase):
    pass  # outcome_id and created_at generated server-side


class OutcomeLogResponse(OutcomeLogBase):
    outcome_id: str
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


class OutcomeLogListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[OutcomeLogResponse]


class OutcomeSummaryResponse(BaseModel):
    total_outcomes: int
    by_intervention_type: dict[str, int]
    by_patient_response: dict[str, int]
    by_channel: dict[str, int]

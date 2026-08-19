"""
app/schemas/support_event.py
Pydantic v2 models for the SUPPORT_EVENT entity.
"""
from pydantic import BaseModel, Field
from typing import Optional


class SupportEventBase(BaseModel):
    patient_id: str
    contact_date: Optional[str] = None
    contact_type: Optional[str] = None
    channel: Optional[str] = None
    contact_outcome: Optional[str] = None
    refill_reminder_sent: Optional[int] = Field(default=0, ge=0, le=1)
    patient_response_flag: Optional[int] = Field(default=0, ge=0, le=1)
    side_effect_reported: Optional[int] = Field(default=0, ge=0, le=1)
    financial_assistance_flag: Optional[int] = Field(default=0, ge=0, le=1)
    intervention_type: Optional[str] = None
    intervention_outcome: Optional[str] = None


class SupportEventCreate(SupportEventBase):
    support_id: str


class SupportEventUpdate(SupportEventBase):
    patient_id: Optional[str] = None


class SupportEventResponse(SupportEventBase):
    support_id: str

    model_config = {"from_attributes": True}


class SupportEventListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[SupportEventResponse]

"""
app/schemas/settings.py
Pydantic v2 schemas for SETTINGS entity.
"""
from pydantic import BaseModel, Field
from typing import Optional


class SettingsResponse(BaseModel):
    therapy_area: str = "Hypertension"
    high_risk_threshold: int = Field(default=70, ge=0, le=100)
    med_risk_threshold: int = Field(default=40, ge=0, le=100)
    pdc_target: int = Field(default=80, ge=0, le=100)
    alerts_enabled: bool = True
    reminders_enabled: bool = True
    summary_enabled: bool = False


class SettingsUpdate(BaseModel):
    therapy_area: Optional[str] = None
    high_risk_threshold: Optional[int] = Field(default=None, ge=0, le=100)
    med_risk_threshold: Optional[int] = Field(default=None, ge=0, le=100)
    pdc_target: Optional[int] = Field(default=None, ge=0, le=100)
    alerts_enabled: Optional[bool] = None
    reminders_enabled: Optional[bool] = None
    summary_enabled: Optional[bool] = None

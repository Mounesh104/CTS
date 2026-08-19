"""
app/schemas/action.py
Pydantic v2 models for ACTION_RULES entity and action response.
"""
from pydantic import BaseModel
from typing import Optional


class ActionRuleBase(BaseModel):
    risk_band: str
    recommended_action: str
    reason: Optional[str] = None
    priority: Optional[str] = None


class ActionRuleCreate(ActionRuleBase):
    rule_id: str


class ActionRuleResponse(ActionRuleBase):
    rule_id: str

    model_config = {"from_attributes": True}


class ActionRuleBulkUpdate(BaseModel):
    """Replace all rules with this new set."""
    rules: list[ActionRuleCreate]


class PatientActionResponse(BaseModel):
    """Response for GET /actions/{patient_id}"""
    patient_id: str
    risk_band: Optional[str] = None
    risk_score: Optional[float] = None
    recommended_action: Optional[str] = None
    reason: Optional[str] = None
    priority: Optional[str] = None

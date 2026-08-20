"""
app/schemas/risk.py
Pydantic v2 models for RISK_SCORE entity.
Risk scores, SHAP explanations, and survival estimates are produced
by the external ML pipeline and stored here via POST.
"""
from pydantic import BaseModel, Field
from typing import Optional


class RiskFactorItem(BaseModel):
    factor: str
    contribution: float = Field(ge=0.0, le=1.0)


class RiskScoreBase(BaseModel):
    patient_id: str
    score_date: Optional[str] = None
    risk_score: float = Field(ge=0.0, le=100.0)
    risk_band: str = Field(pattern="^(Low|Moderate|High|Critical)$")
    top_risk_factors: list[RiskFactorItem] = []
    estimated_time_to_discontinuation: Optional[float] = None
    model_version: Optional[str] = None


class RiskScoreCreate(RiskScoreBase):
    score_id: str


class RiskScoreResponse(RiskScoreBase):
    score_id: str

    model_config = {"from_attributes": True}


class RiskScoreListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[RiskScoreResponse]


class RiskScoreBulkCreate(BaseModel):
    scores: list[RiskScoreCreate]

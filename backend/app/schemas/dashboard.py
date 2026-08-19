"""
app/schemas/dashboard.py
Pydantic v2 models for /dashboard endpoints.
Shapes match what the frontend Dashboard.jsx and Monitoring.jsx expect.
"""
from pydantic import BaseModel
from typing import Optional


class AdherenceTrendPoint(BaseModel):
    month: str
    adherence: float


class RecentActivityItem(BaseModel):
    id: str
    patient_id: str
    type: str
    description: str
    timestamp: str
    status: str


class RiskDistribution(BaseModel):
    High: int = 0
    Medium: int = 0
    Low: int = 0


class DashboardSummaryResponse(BaseModel):
    totalPatients: int
    highRiskCount: int
    mediumRiskCount: int
    lowRiskCount: int
    averageAdherence: float
    interventionsRequired: int
    adherenceTrend: list[AdherenceTrendPoint]
    recentActivity: list[RecentActivityItem]
    riskDistribution: RiskDistribution


class RiskFactorItem(BaseModel):
    factor: str
    contribution: float


class PatientDashboardResponse(BaseModel):
    """Single-patient dashboard payload for GET /dashboard/patient/{patient_id}"""
    patient_id: str
    risk_score: Optional[float] = None
    risk_band: Optional[str] = None
    top_risk_factor: Optional[str] = None
    recommended_action: Optional[str] = None
    adherence: Optional[float] = None
    persistency_months: Optional[float] = None
    latest_refill_gap_days: Optional[int] = None
    top_risk_factors: list[RiskFactorItem] = []
    estimated_time_to_discontinuation: Optional[float] = None

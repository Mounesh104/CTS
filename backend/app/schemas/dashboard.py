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
    Low: int = 0
    Moderate: int = 0
    High: int = 0
    Critical: int = 0


class DashboardSummaryResponse(BaseModel):
    totalPatients: int
    criticalRiskCount: int = 0
    highRiskCount: int
    moderateRiskCount: int
    lowRiskCount: int
    averageAdherence: float
    interventionsRequired: int
    adherenceTrend: list[AdherenceTrendPoint]
    recentActivity: list[RecentActivityItem]
    riskDistribution: RiskDistribution


class DashboardKpisResponse(BaseModel):
    """GET /dashboard/kpis"""
    totalPatients: int
    criticalRiskCount: int
    highRiskCount: int
    moderateRiskCount: int
    lowRiskCount: int
    averageAdherence: float
    interventionsRequired: int


class CohortItem(BaseModel):
    group: str
    count: int
    avgAdherence: float
    avgRiskScore: float


class DashboardCohortsResponse(BaseModel):
    """GET /dashboard/cohorts"""
    byAgeGroup: list[CohortItem]
    byRiskCategory: list[CohortItem]
    byAdherenceBand: list[CohortItem]


class HighRiskPatientItem(BaseModel):
    patient_id: str
    risk_score: float
    risk_level: str
    adherence: Optional[float] = None
    status: str


class HighRiskPatientsResponse(BaseModel):
    """GET /dashboard/high-risk-patients"""
    total: int
    page: int
    page_size: int
    items: list[HighRiskPatientItem]


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

"""
app/schemas/monitoring.py
Pydantic v2 models for MODEL_METRICS entity and monitoring endpoints.
Metrics are written by the external ML monitoring pipeline.
"""
from pydantic import BaseModel, Field
from typing import Optional


class ModelMetricsBase(BaseModel):
    evaluation_date: Optional[str] = None
    accuracy: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    auc: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    c_index: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    drift_score: Optional[float] = None
    model_version: Optional[str] = None
    retrain_triggered: Optional[int] = Field(default=0, ge=0, le=1)
    notes: Optional[str] = None


class ModelMetricsCreate(ModelMetricsBase):
    metric_id: str


class ModelMetricsResponse(ModelMetricsBase):
    metric_id: str

    model_config = {"from_attributes": True}


class EvaluateRequest(BaseModel):
    """
    Posted by the ML monitoring pipeline with a new evaluation result.
    The backend stores it and returns whether performance declined.
    """
    metric_id: str
    evaluation_date: str
    accuracy: float = Field(ge=0.0, le=1.0)
    auc: float = Field(ge=0.0, le=1.0)
    c_index: float = Field(ge=0.0, le=1.0)
    drift_score: float
    model_version: str
    notes: Optional[str] = None
    # Threshold below which performance is "declining"
    performance_threshold: float = Field(default=0.75, ge=0.0, le=1.0)


class EvaluateResponse(BaseModel):
    metric_id: str
    performance_declining: bool
    auc: float
    accuracy: float
    c_index: float
    drift_score: float
    message: str


class RetrainRequest(BaseModel):
    """Posted by the ML pipeline to log a retraining event."""
    event_id: str
    model_version: str
    validation_auc: float
    validation_accuracy: float
    retrain_trigger_reason: str
    notes: Optional[str] = None


class RetrainResponse(BaseModel):
    event_id: str
    model_version: str
    status: str
    message: str

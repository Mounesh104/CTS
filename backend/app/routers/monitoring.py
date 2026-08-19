"""
app/routers/monitoring.py
Store and serve model performance metrics.
The external ML monitoring pipeline POSTs evaluation + retraining events here.
"""
import sqlite3
import uuid
from datetime import date
from fastapi import APIRouter, Depends, Query
from app.db.connection import get_db
from app.schemas.monitoring import (
    ModelMetricsResponse, EvaluateRequest, EvaluateResponse,
    RetrainRequest, RetrainResponse,
)
from app.crud import model_metrics as crud

router = APIRouter(prefix="/monitoring", tags=["Monitoring & Retraining"])


@router.get("/model-performance", response_model=list[ModelMetricsResponse],
            summary="Get stored model performance metrics (accuracy, AUC, C-index, drift)")
def get_model_performance(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: sqlite3.Connection = Depends(get_db),
):
    items, _ = crud.get_all_metrics(db, limit=limit, offset=offset)
    return [ModelMetricsResponse(**r) for r in items]


@router.post("/evaluate", response_model=EvaluateResponse,
             summary="Accept an evaluation result from the ML monitoring pipeline. "
                     "Stores metrics and returns whether performance has declined.")
def store_evaluation(body: EvaluateRequest, db: sqlite3.Connection = Depends(get_db)):
    data = {
        "metric_id": body.metric_id,
        "evaluation_date": body.evaluation_date,
        "accuracy": body.accuracy,
        "auc": body.auc,
        "c_index": body.c_index,
        "drift_score": body.drift_score,
        "model_version": body.model_version,
        "retrain_triggered": 0,
        "notes": body.notes,
    }
    crud.create_model_metrics(db, data)

    # Compare against threshold to determine if performance is declining
    threshold = body.performance_threshold
    performance_declining = body.auc < threshold or body.accuracy < threshold

    return EvaluateResponse(
        metric_id=body.metric_id,
        performance_declining=performance_declining,
        auc=body.auc,
        accuracy=body.accuracy,
        c_index=body.c_index,
        drift_score=body.drift_score,
        message=(
            "Performance is declining — consider triggering retraining."
            if performance_declining
            else "Performance is within acceptable thresholds."
        ),
    )


@router.post("/retrain", response_model=RetrainResponse,
             summary="Accept a retraining event from the ML pipeline. Logs the event with a version bump.")
def log_retrain_event(body: RetrainRequest, db: sqlite3.Connection = Depends(get_db)):
    data = {
        "metric_id": body.event_id,
        "evaluation_date": str(date.today()),
        "accuracy": body.validation_accuracy,
        "auc": body.validation_auc,
        "c_index": None,
        "drift_score": None,
        "model_version": body.model_version,
        "retrain_triggered": 1,
        "notes": f"Retrain reason: {body.retrain_trigger_reason}. {body.notes or ''}".strip(),
    }
    crud.create_model_metrics(db, data)

    return RetrainResponse(
        event_id=body.event_id,
        model_version=body.model_version,
        status="logged",
        message=f"Retraining event for model version '{body.model_version}' has been recorded.",
    )

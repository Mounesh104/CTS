"""
app/routers/risk.py
Store and retrieve RISK_SCORE records.
Risk scores (XGBoost + Cox PH + SHAP) are computed externally and POSTed here.
"""
import sqlite3
import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from app.db.connection import get_db
from app.schemas.risk import (
    RiskScoreCreate, RiskScoreResponse,
    RiskScoreListResponse, RiskScoreBulkCreate,
)
from app.crud import risk_score as crud
from app.crud import patient as crud_patient
from app.ml import predictor
from app.ml.predictor import ModelNotAvailable

router = APIRouter(prefix="/risk", tags=["Risk Scoring"])


@router.post("/scores", response_model=RiskScoreResponse, status_code=201,
             summary="Store a risk score result from the ML pipeline (XGBoost + SHAP + Cox PH)")
def store_risk_score(body: RiskScoreCreate, db: sqlite3.Connection = Depends(get_db)):
    if not crud_patient.get_patient_by_id(db, body.patient_id):
        raise HTTPException(status_code=404, detail=f"Patient '{body.patient_id}' not found.")
    data = body.model_dump()
    # Auto-set score_date to today if not provided
    if not data.get("score_date"):
        data["score_date"] = str(date.today())
    row = crud.create_risk_score(db, data)
    return RiskScoreResponse(**row)


@router.post("/scores/bulk", status_code=201,
             summary="Batch store risk scores from the ML pipeline")
def bulk_store_risk_scores(body: RiskScoreBulkCreate, db: sqlite3.Connection = Depends(get_db)):
    records = [s.model_dump() for s in body.scores]
    for r in records:
        if not r.get("score_date"):
            r["score_date"] = str(date.today())
    count = crud.bulk_create_risk_scores(db, records)
    return {"inserted": count}


@router.post("/{patient_id}/predict", response_model=RiskScoreResponse, status_code=201,
             summary="Runs the real classifier + SHAP + survival model on demand and persists the result. "
                     "Only works for patients with real ML feature history.")
def predict_risk_score(patient_id: str, db: sqlite3.Connection = Depends(get_db)):
    if not crud_patient.get_patient_by_id(db, patient_id):
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")
    try:
        result = predictor.predict_for_patient(db, patient_id)
    except ModelNotAvailable as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    if result is None:
        raise HTTPException(
            status_code=422,
            detail=f"No ML feature history available for patient '{patient_id}' — cannot generate a prediction.",
        )
    row = crud.upsert_risk_score(db, result)
    return RiskScoreResponse(**row)


@router.get("/{patient_id}", response_model=RiskScoreResponse,
            summary="Get the latest risk score for a patient")
def get_latest_risk_score(patient_id: str, db: sqlite3.Connection = Depends(get_db)):
    if not crud_patient.get_patient_by_id(db, patient_id):
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")
    row = crud.get_latest_risk_score_by_patient(db, patient_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"No risk score found for patient '{patient_id}'.")
    return RiskScoreResponse(**row)


@router.get("/{patient_id}/history", response_model=RiskScoreListResponse,
            summary="Get historical risk scores for trend charts")
def get_risk_score_history(
    patient_id: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: sqlite3.Connection = Depends(get_db),
):
    if not crud_patient.get_patient_by_id(db, patient_id):
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")
    items, total = crud.get_risk_score_history(db, patient_id, limit=limit, offset=offset)
    return RiskScoreListResponse(total=total, limit=limit, offset=offset,
                                 items=[RiskScoreResponse(**r) for r in items])

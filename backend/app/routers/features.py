"""
app/routers/features.py
Store and retrieve ML_FEATURES records.
Features are computed by the external feature-engineering pipeline and POSTed here.
"""
import sqlite3
from fastapi import APIRouter, Depends, HTTPException, Query
from app.db.connection import get_db
from app.schemas.ml_features import (
    MLFeaturesCreate, MLFeaturesResponse, MLFeaturesListResponse,
)
from app.crud import ml_features as crud
from app.crud import patient as crud_patient

router = APIRouter(prefix="/features", tags=["Feature Engineering"])


@router.post("", response_model=MLFeaturesResponse, status_code=201,
             summary="Store pre-computed ML features from the feature-engineering pipeline")
def store_features(body: MLFeaturesCreate, db: sqlite3.Connection = Depends(get_db)):
    if not crud_patient.get_patient_by_id(db, body.patient_id):
        raise HTTPException(status_code=404, detail=f"Patient '{body.patient_id}' not found.")
    row = crud.upsert_ml_features(db, body.model_dump())
    return MLFeaturesResponse(**row)


@router.post("/bulk", status_code=201,
             summary="Batch store pre-computed ML features for multiple patients")
def bulk_store_features(body: list[MLFeaturesCreate], db: sqlite3.Connection = Depends(get_db)):
    count = crud.bulk_upsert_ml_features(db, [f.model_dump() for f in body])
    return {"upserted": count}


@router.get("", response_model=MLFeaturesListResponse, summary="List all ML feature records")
def list_features(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: sqlite3.Connection = Depends(get_db),
):
    items, total = crud.get_ml_features_list(db, limit=limit, offset=offset)
    return MLFeaturesListResponse(total=total, limit=limit, offset=offset,
                                  items=[MLFeaturesResponse(**r) for r in items])


@router.get("/{patient_id}", response_model=MLFeaturesResponse,
            summary="Get latest ML features for a patient")
def get_latest_features(patient_id: str, db: sqlite3.Connection = Depends(get_db)):
    if not crud_patient.get_patient_by_id(db, patient_id):
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")
    row = crud.get_latest_features_by_patient(db, patient_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"No ML features found for patient '{patient_id}'.")
    return MLFeaturesResponse(**row)


@router.get("/{patient_id}/history", response_model=list[MLFeaturesResponse],
            summary="Get all historical ML feature snapshots for a patient")
def get_features_history(patient_id: str, db: sqlite3.Connection = Depends(get_db)):
    if not crud_patient.get_patient_by_id(db, patient_id):
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")
    rows = crud.get_features_history_by_patient(db, patient_id)
    return [MLFeaturesResponse(**r) for r in rows]

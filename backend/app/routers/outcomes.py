"""
app/routers/outcomes.py
Log and retrieve intervention outcomes (the Outcome Logging stage).
"""
import sqlite3
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from app.db.connection import get_db
from app.schemas.outcome import (
    OutcomeLogCreate, OutcomeLogResponse,
    OutcomeLogListResponse, OutcomeSummaryResponse,
)
from app.crud import outcome_log as crud
from app.crud import patient as crud_patient

router = APIRouter(prefix="/outcomes", tags=["Outcome Logging"])


@router.post("", response_model=OutcomeLogResponse, status_code=201,
             summary="Log an intervention outcome (intervention performed, patient response, channel)")
def log_outcome(body: OutcomeLogCreate, db: sqlite3.Connection = Depends(get_db)):
    if not crud_patient.get_patient_by_id(db, body.patient_id):
        raise HTTPException(status_code=404, detail=f"Patient '{body.patient_id}' not found.")
    data = body.model_dump()
    data["outcome_id"] = str(uuid.uuid4())
    data["created_at"] = datetime.utcnow().isoformat()
    row = crud.create_outcome_log(db, data)
    return OutcomeLogResponse(**row)


@router.get("/summary", response_model=OutcomeSummaryResponse,
            summary="Aggregate outcome metrics for reporting")
def get_outcome_summary(db: sqlite3.Connection = Depends(get_db)):
    summary = crud.get_outcome_summary(db)
    return OutcomeSummaryResponse(**summary)


@router.get("/{patient_id}", response_model=OutcomeLogListResponse,
            summary="Get intervention outcome history for a patient")
def get_patient_outcomes(
    patient_id: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: sqlite3.Connection = Depends(get_db),
):
    if not crud_patient.get_patient_by_id(db, patient_id):
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")
    items, total = crud.get_outcome_logs_by_patient(db, patient_id, limit=limit, offset=offset)
    return OutcomeLogListResponse(total=total, limit=limit, offset=offset,
                                  items=[OutcomeLogResponse(**r) for r in items])

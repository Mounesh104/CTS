"""
app/routers/therapy_outcomes.py
Full CRUD + bulk for THERAPY_OUTCOME entity.
"""
import sqlite3
from fastapi import APIRouter, Depends, HTTPException, Query
from app.db.connection import get_db
from app.schemas.therapy_outcome import (
    TherapyOutcomeCreate, TherapyOutcomeUpdate,
    TherapyOutcomeResponse, TherapyOutcomeListResponse,
)
from app.crud import therapy_outcome as crud
from app.crud import patient as crud_patient

router = APIRouter(prefix="/therapy-outcomes", tags=["Therapy Outcomes"])


@router.post("", response_model=TherapyOutcomeResponse, status_code=201,
             summary="Store a therapy outcome record (written by ML pipeline)")
def create_therapy_outcome(body: TherapyOutcomeCreate, db: sqlite3.Connection = Depends(get_db)):
    if not crud_patient.get_patient_by_id(db, body.patient_id):
        raise HTTPException(status_code=404, detail=f"Patient '{body.patient_id}' not found.")
    if crud.get_therapy_outcome_by_id(db, body.therapy_id):
        raise HTTPException(status_code=409, detail=f"Therapy outcome '{body.therapy_id}' already exists.")
    row = crud.create_therapy_outcome(db, body.model_dump())
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create therapy outcome.")
    return TherapyOutcomeResponse(**row)


@router.get("", response_model=TherapyOutcomeListResponse, summary="List therapy outcomes")
def list_therapy_outcomes(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    patient_id: str | None = Query(None),
    db: sqlite3.Connection = Depends(get_db),
):
    items, total = crud.get_therapy_outcomes(db, limit=limit, offset=offset, patient_id=patient_id)
    return TherapyOutcomeListResponse(total=total, limit=limit, offset=offset,
                                     items=[TherapyOutcomeResponse(**r) for r in items])


@router.post("/bulk", status_code=201, summary="Bulk store therapy outcomes")
def bulk_create(body: list[TherapyOutcomeCreate], db: sqlite3.Connection = Depends(get_db)):
    count = crud.bulk_create_therapy_outcomes(db, [r.model_dump() for r in body])
    return {"inserted": count}


@router.get("/{therapy_id}", response_model=TherapyOutcomeResponse, summary="Get therapy outcome by ID")
def get_therapy_outcome(therapy_id: str, db: sqlite3.Connection = Depends(get_db)):
    row = crud.get_therapy_outcome_by_id(db, therapy_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Therapy outcome '{therapy_id}' not found.")
    return TherapyOutcomeResponse(**row)


@router.put("/{therapy_id}", response_model=TherapyOutcomeResponse, summary="Update therapy outcome")
def update_therapy_outcome(therapy_id: str, body: TherapyOutcomeUpdate, db: sqlite3.Connection = Depends(get_db)):
    if not crud.get_therapy_outcome_by_id(db, therapy_id):
        raise HTTPException(status_code=404, detail=f"Therapy outcome '{therapy_id}' not found.")
    row = crud.update_therapy_outcome(db, therapy_id, body.model_dump(exclude_unset=True))
    if not row:
        raise HTTPException(status_code=404, detail=f"Therapy outcome '{therapy_id}' not found after update.")
    return TherapyOutcomeResponse(**row)


@router.delete("/{therapy_id}", status_code=204, summary="Delete therapy outcome")
def delete_therapy_outcome(therapy_id: str, db: sqlite3.Connection = Depends(get_db)):
    if not crud.delete_therapy_outcome(db, therapy_id):
        raise HTTPException(status_code=404, detail=f"Therapy outcome '{therapy_id}' not found.")

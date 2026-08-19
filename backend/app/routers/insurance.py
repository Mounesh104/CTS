"""
app/routers/insurance.py
Full CRUD + bulk for INSURANCE entity.
"""
import sqlite3
from fastapi import APIRouter, Depends, HTTPException, Query
from app.db.connection import get_db
from app.schemas.insurance import (
    InsuranceCreate, InsuranceUpdate,
    InsuranceResponse, InsuranceListResponse,
)
from app.crud import insurance as crud
from app.crud import patient as crud_patient

router = APIRouter(prefix="/insurance", tags=["Insurance"])


@router.post("", response_model=InsuranceResponse, status_code=201,
             summary="Create an insurance record")
def create_insurance(body: InsuranceCreate, db: sqlite3.Connection = Depends(get_db)):
    if not crud_patient.get_patient_by_id(db, body.patient_id):
        raise HTTPException(status_code=404, detail=f"Patient '{body.patient_id}' not found.")
    if crud.get_insurance_by_id(db, body.policy_id):
        raise HTTPException(status_code=409, detail=f"Policy '{body.policy_id}' already exists.")
    row = crud.create_insurance(db, body.model_dump())
    return InsuranceResponse(**row)


@router.get("", response_model=InsuranceListResponse, summary="List insurance records")
def list_insurance(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    patient_id: str | None = Query(None),
    db: sqlite3.Connection = Depends(get_db),
):
    items, total = crud.get_insurance_records(db, limit=limit, offset=offset, patient_id=patient_id)
    return InsuranceListResponse(total=total, limit=limit, offset=offset,
                                 items=[InsuranceResponse(**r) for r in items])


@router.post("/bulk", status_code=201, summary="Bulk insert insurance records")
def bulk_create(body: list[InsuranceCreate], db: sqlite3.Connection = Depends(get_db)):
    count = crud.bulk_create_insurance(db, [r.model_dump() for r in body])
    return {"inserted": count}


@router.get("/{policy_id}", response_model=InsuranceResponse, summary="Get insurance by policy ID")
def get_insurance(policy_id: str, db: sqlite3.Connection = Depends(get_db)):
    row = crud.get_insurance_by_id(db, policy_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Policy '{policy_id}' not found.")
    return InsuranceResponse(**row)


@router.put("/{policy_id}", response_model=InsuranceResponse, summary="Update insurance record")
def update_insurance(policy_id: str, body: InsuranceUpdate, db: sqlite3.Connection = Depends(get_db)):
    if not crud.get_insurance_by_id(db, policy_id):
        raise HTTPException(status_code=404, detail=f"Policy '{policy_id}' not found.")
    row = crud.update_insurance(db, policy_id, body.model_dump(exclude_unset=True))
    if row is None:
        raise HTTPException(status_code=404, detail=f"Policy '{policy_id}' not found after update.")
    return InsuranceResponse(**row)


@router.patch("/{policy_id}", response_model=InsuranceResponse, summary="Partial update insurance")
def patch_insurance(policy_id: str, body: InsuranceUpdate, db: sqlite3.Connection = Depends(get_db)):
    if not crud.get_insurance_by_id(db, policy_id):
        raise HTTPException(status_code=404, detail=f"Policy '{policy_id}' not found.")
    row = crud.update_insurance(db, policy_id, body.model_dump(exclude_unset=True))
    if row is None:
        raise HTTPException(status_code=404, detail=f"Policy '{policy_id}' not found after update.")
    return InsuranceResponse(**row)


@router.delete("/{policy_id}", status_code=204, summary="Delete insurance record")
def delete_insurance(policy_id: str, db: sqlite3.Connection = Depends(get_db)):
    if not crud.delete_insurance(db, policy_id):
        raise HTTPException(status_code=404, detail=f"Policy '{policy_id}' not found.")

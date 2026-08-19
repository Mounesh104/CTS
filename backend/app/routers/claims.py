"""
app/routers/claims.py
Full CRUD + bulk for PHARMACY_CLAIM entity.
"""
import sqlite3
from fastapi import APIRouter, Depends, HTTPException, Query
from app.db.connection import get_db
from app.schemas.pharmacy_claim import (
    PharmacyClaimCreate, PharmacyClaimUpdate,
    PharmacyClaimResponse, PharmacyClaimListResponse,
)
from app.crud import pharmacy_claim as crud
from app.crud import patient as crud_patient

router = APIRouter(prefix="/claims", tags=["Pharmacy Claims"])


def _check_patient(db, patient_id):
    if not crud_patient.get_patient_by_id(db, patient_id):
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")


@router.post("", response_model=PharmacyClaimResponse, status_code=201,
             summary="Create a pharmacy claim")
def create_claim(body: PharmacyClaimCreate, db: sqlite3.Connection = Depends(get_db)):
    _check_patient(db, body.patient_id)
    if crud.get_claim_by_id(db, body.claim_id):
        raise HTTPException(status_code=409, detail=f"Claim '{body.claim_id}' already exists.")
    row = crud.create_claim(db, body.model_dump())
    if row is None:
        raise HTTPException(status_code=500, detail="Failed to create claim.")
    return PharmacyClaimResponse(**row)


@router.get("", response_model=PharmacyClaimListResponse, summary="List claims with pagination")
def list_claims(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    patient_id: str | None = Query(None),
    db: sqlite3.Connection = Depends(get_db),
):
    items, total = crud.get_claims(db, limit=limit, offset=offset, patient_id=patient_id)
    return PharmacyClaimListResponse(total=total, limit=limit, offset=offset,
                                     items=[PharmacyClaimResponse(**r) for r in items])


@router.post("/bulk", status_code=201, summary="Bulk insert pharmacy claims")
def bulk_create_claims(body: list[PharmacyClaimCreate], db: sqlite3.Connection = Depends(get_db)):
    count = crud.bulk_create_claims(db, [c.model_dump() for c in body])
    return {"inserted": count}


@router.get("/{claim_id}", response_model=PharmacyClaimResponse, summary="Get claim by ID")
def get_claim(claim_id: str, db: sqlite3.Connection = Depends(get_db)):
    row = crud.get_claim_by_id(db, claim_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found.")
    return PharmacyClaimResponse(**row)


@router.put("/{claim_id}", response_model=PharmacyClaimResponse, summary="Update claim")
def update_claim(claim_id: str, body: PharmacyClaimUpdate, db: sqlite3.Connection = Depends(get_db)):
    if not crud.get_claim_by_id(db, claim_id):
        raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found.")
    row = crud.update_claim(db, claim_id, body.model_dump(exclude_unset=True))
    if row is None:
        raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found.")
    return PharmacyClaimResponse(**row)


@router.patch("/{claim_id}", response_model=PharmacyClaimResponse, summary="Partial update claim")
def patch_claim(claim_id: str, body: PharmacyClaimUpdate, db: sqlite3.Connection = Depends(get_db)):
    if not crud.get_claim_by_id(db, claim_id):
        raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found.")
    row = crud.update_claim(db, claim_id, body.model_dump(exclude_unset=True))
    if row is None:
        raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found.")
    return PharmacyClaimResponse(**row)


@router.delete("/{claim_id}", status_code=204, summary="Delete claim")
def delete_claim(claim_id: str, db: sqlite3.Connection = Depends(get_db)):
    if not crud.delete_claim(db, claim_id):
        raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found.")

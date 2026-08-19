"""
app/routers/support_events.py
Full CRUD + bulk for SUPPORT_EVENT entity.
"""
import sqlite3
from fastapi import APIRouter, Depends, HTTPException, Query
from app.db.connection import get_db
from app.schemas.support_event import (
    SupportEventCreate, SupportEventUpdate,
    SupportEventResponse, SupportEventListResponse,
)
from app.crud import support_event as crud
from app.crud import patient as crud_patient

router = APIRouter(prefix="/support-events", tags=["Support Events"])


@router.post("", response_model=SupportEventResponse, status_code=201,
             summary="Create a support event")
def create_support_event(body: SupportEventCreate, db: sqlite3.Connection = Depends(get_db)):
    if not crud_patient.get_patient_by_id(db, body.patient_id):
        raise HTTPException(status_code=404, detail=f"Patient '{body.patient_id}' not found.")
    if crud.get_support_event_by_id(db, body.support_id):
        raise HTTPException(status_code=409, detail=f"Support event '{body.support_id}' already exists.")
    row = crud.create_support_event(db, body.model_dump())
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create support event.")
    return SupportEventResponse(**row)


@router.get("", response_model=SupportEventListResponse, summary="List support events")
def list_support_events(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    patient_id: str | None = Query(None),
    db: sqlite3.Connection = Depends(get_db),
):
    items, total = crud.get_support_events(db, limit=limit, offset=offset, patient_id=patient_id)
    return SupportEventListResponse(total=total, limit=limit, offset=offset,
                                    items=[SupportEventResponse(**r) for r in items])


@router.post("/bulk", status_code=201, summary="Bulk insert support events")
def bulk_create(body: list[SupportEventCreate], db: sqlite3.Connection = Depends(get_db)):
    count = crud.bulk_create_support_events(db, [e.model_dump() for e in body])
    return {"inserted": count}


@router.get("/{support_id}", response_model=SupportEventResponse, summary="Get support event by ID")
def get_support_event(support_id: str, db: sqlite3.Connection = Depends(get_db)):
    row = crud.get_support_event_by_id(db, support_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Support event '{support_id}' not found.")
    return SupportEventResponse(**row)


@router.put("/{support_id}", response_model=SupportEventResponse, summary="Update support event")
def update_support_event(support_id: str, body: SupportEventUpdate, db: sqlite3.Connection = Depends(get_db)):
    if not crud.get_support_event_by_id(db, support_id):
        raise HTTPException(status_code=404, detail=f"Support event '{support_id}' not found.")
    row = crud.update_support_event(db, support_id, body.model_dump(exclude_unset=True))
    if not row:
        raise HTTPException(status_code=404, detail=f"Support event '{support_id}' not found after update.")
    return SupportEventResponse(**row)


@router.patch("/{support_id}", response_model=SupportEventResponse, summary="Partial update support event")
def patch_support_event(support_id: str, body: SupportEventUpdate, db: sqlite3.Connection = Depends(get_db)):
    if not crud.get_support_event_by_id(db, support_id):
        raise HTTPException(status_code=404, detail=f"Support event '{support_id}' not found.")
    row = crud.update_support_event(db, support_id, body.model_dump(exclude_unset=True))
    if not row:
        raise HTTPException(status_code=404, detail=f"Support event '{support_id}' not found after update.")
    return SupportEventResponse(**row)


@router.delete("/{support_id}", status_code=204, summary="Delete support event")
def delete_support_event(support_id: str, db: sqlite3.Connection = Depends(get_db)):
    if not crud.delete_support_event(db, support_id):
        raise HTTPException(status_code=404, detail=f"Support event '{support_id}' not found.")

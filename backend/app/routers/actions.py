"""
app/routers/actions.py
Risk-to-action mapping: looks up the patient's latest risk band
and returns the recommended action from the ACTION_RULES table.
Also exposes GET/PUT on the rules themselves for config management.
"""
import sqlite3
from fastapi import APIRouter, Depends, HTTPException
from app.db.connection import get_db
from app.schemas.action import (
    ActionRuleResponse, ActionRuleBulkUpdate, PatientActionResponse,
)
from app.crud import action_rules as crud
from app.crud import patient as crud_patient
from app.services.action_mapping import get_patient_action

router = APIRouter(prefix="/actions", tags=["Risk to Action Mapping"])


@router.get("/rules", response_model=list[ActionRuleResponse],
            summary="List all configurable risk-to-action rules")
def list_rules(db: sqlite3.Connection = Depends(get_db)):
    rules = crud.get_all_rules(db)
    return [ActionRuleResponse(**r) for r in rules]


@router.put("/rules", response_model=list[ActionRuleResponse],
            summary="Replace all action rules (bulk update)")
def update_rules(body: ActionRuleBulkUpdate, db: sqlite3.Connection = Depends(get_db)):
    crud.replace_all_rules(db, [r.model_dump() for r in body.rules])
    rules = crud.get_all_rules(db)
    return [ActionRuleResponse(**r) for r in rules]


@router.get("/{patient_id}", response_model=PatientActionResponse,
            summary="Get recommended action for a patient based on their latest risk band")
def get_action_for_patient(patient_id: str, db: sqlite3.Connection = Depends(get_db)):
    if not crud_patient.get_patient_by_id(db, patient_id):
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")
    result = get_patient_action(db, patient_id)
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"No risk score found for patient '{patient_id}'. Score the patient first.",
        )
    return PatientActionResponse(**result)

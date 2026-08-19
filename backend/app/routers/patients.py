"""
app/routers/patients.py
Full CRUD + bulk + full-profile for PATIENT entity.
"""
import json
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
import sqlite3

from app.db.connection import get_db
from app.schemas.patient import (
    PatientCreate, PatientUpdate, PatientResponse,
    PatientListResponse, PatientFullProfile, RiskFactorItem, InterventionHistoryItem,
)
from app.crud import patient as crud
from app.crud import pharmacy_claim as crud_claims
from app.crud import support_event as crud_support
from app.crud import insurance as crud_insurance
from app.crud import ml_features as crud_features
from app.crud import therapy_outcome as crud_therapy
from app.crud import risk_score as crud_risk
from app.crud import action_rules as crud_rules
from app.crud import outcome_log as crud_outcomes
from app.crud import settings as crud_settings

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("", response_model=PatientResponse, status_code=201,
             summary="Create a new patient record")
def create_patient(body: PatientCreate, db: sqlite3.Connection = Depends(get_db)):
    existing = crud.get_patient_by_id(db, body.patient_id)
    if existing:
        raise HTTPException(status_code=409, detail=f"Patient '{body.patient_id}' already exists.")
    row = crud.create_patient(db, body.model_dump())
    return PatientResponse(**row)


@router.get("", response_model=PatientListResponse, summary="List patients with pagination")
def list_patients(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    diagnosis: str | None = Query(None),
    db: sqlite3.Connection = Depends(get_db),
):
    items, total = crud.get_patients(db, limit=limit, offset=offset, diagnosis=diagnosis)
    return PatientListResponse(total=total, limit=limit, offset=offset,
                               items=[PatientResponse(**r) for r in items])


@router.get("/bulk", summary="Alias — same as GET /patients", include_in_schema=False)
def list_patients_alias(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: sqlite3.Connection = Depends(get_db),
):
    items, total = crud.get_patients(db, limit=limit, offset=offset)
    return PatientListResponse(total=total, limit=limit, offset=offset,
                               items=[PatientResponse(**r) for r in items])


@router.post("/bulk", status_code=201, summary="Bulk insert patients")
def bulk_create_patients(body: list[PatientCreate], db: sqlite3.Connection = Depends(get_db)):
    count = crud.bulk_create_patients(db, [p.model_dump() for p in body])
    return {"inserted": count}


@router.get("/{patient_id}/full-profile", response_model=PatientFullProfile,
            summary="Full patient profile — all related data joined")
def get_full_profile(patient_id: str, db: sqlite3.Connection = Depends(get_db)):
    patient = crud.get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")

    latest_risk = crud_risk.get_latest_risk_score_by_patient(db, patient_id)
    latest_features = crud_features.get_latest_features_by_patient(db, patient_id)
    latest_therapy = crud_therapy.get_latest_therapy_outcome_by_patient(db, patient_id)
    latest_claims = crud_claims.get_claims_by_patient(db, patient_id)
    support_events = crud_support.get_support_events_by_patient(db, patient_id)
    outcome_logs, _ = crud_outcomes.get_outcome_logs_by_patient(db, patient_id, limit=10)

    # Derive risk info
    risk_score = latest_risk["risk_score"] if latest_risk else None
    settings_dict = crud_settings.get_all_settings(db)
    high_thresh = float(settings_dict.get("high_risk_threshold", 70))
    med_thresh = float(settings_dict.get("med_risk_threshold", 40))

    if risk_score is not None:
        if risk_score >= high_thresh:
            risk_band = "High"
        elif risk_score >= med_thresh:
            risk_band = "Medium"
        else:
            risk_band = "Low"
    else:
        risk_band = latest_risk.get("risk_band") if latest_risk else None
    top_risk_factors = []
    if latest_risk and latest_risk.get("top_risk_factors"):
        factors = latest_risk["top_risk_factors"]
        if isinstance(factors, str):
            try:
                factors = json.loads(factors)
            except Exception:
                factors = []
        top_risk_factors = [RiskFactorItem(**f) for f in factors]

    # Derive adherence from missed_refill_rate
    adherence = None
    if latest_features and latest_features.get("missed_refill_rate") is not None:
        adherence = round((1 - latest_features["missed_refill_rate"]) * 100, 1)

    # Persistency from therapy outcome
    persistency_months = None
    if latest_therapy and latest_therapy.get("persistence_days"):
        persistency_months = round(latest_therapy["persistence_days"] / 30.0, 1)

    # Latest refill gap
    refill_gap_days = None
    if latest_claims:
        refill_gap_days = latest_claims[0].get("refill_gap_days", 0)

    # Copay level derived from average copay
    copay_level = "Low"
    insurance_records = crud_insurance.get_insurance_by_patient(db, patient_id)
    if insurance_records:
        avg_copay = sum(r.get("copay_amount", 0) or 0 for r in insurance_records) / len(insurance_records)
        copay_level = "High" if avg_copay > 500 else ("Medium" if avg_copay > 200 else "Low")

    # Comorbidities
    comorbidities: list[str] = []
    if patient.get("diabetes_flag"):
        comorbidities.append("Type 2 Diabetes")
    if patient.get("comorbidity_count", 0) and patient["comorbidity_count"] > 1:
        comorbidities.append("Multiple Comorbidities")
    if not comorbidities:
        comorbidities = ["None"]

    # Recommended action
    recommended_action = None
    if risk_band:
        rule = crud_rules.get_primary_rule_by_band(db, risk_band)
        recommended_action = rule["recommended_action"] if rule else "Routine Monitoring"

    # Intervention status and history
    intervention_status = "Pending"
    intervention_history: list[InterventionHistoryItem] = []
    for log in outcome_logs:
        if log.get("patient_response") in ("Accepted", "Completed"):
            intervention_status = "Completed"
        elif log.get("patient_response") == "In Progress":
            intervention_status = "Triggered"
        intervention_history.append(InterventionHistoryItem(
            type=log.get("intervention_performed", "Unknown"),
            status=log.get("patient_response", "Pending"),
            timestamp=log.get("intervention_date", "N/A"),
        ))
    if not intervention_history:
        intervention_history = [InterventionHistoryItem(
            type="Initial Risk Assessment", status="Completed", timestamp="On record"
        )]

    return PatientFullProfile(
        patient_id=patient_id,
        diagnosis=patient.get("diagnosis"),
        therapy_area=patient.get("diagnosis"),
        risk_score=risk_score,
        risk_level=risk_band,
        adherence=adherence,
        persistency_months=persistency_months,
        refill_gap_days=refill_gap_days,
        copay_level=copay_level,
        comorbidities=comorbidities,
        top_risk_factors=top_risk_factors,
        estimated_time_to_discontinuation=latest_risk.get("estimated_time_to_discontinuation") if latest_risk else None,
        recommended_action=recommended_action,
        intervention_status=intervention_status,
        intervention_history=intervention_history,
        age=patient.get("age"),
        gender=patient.get("gender"),
        bmi=patient.get("bmi"),
        comorbidity_count=patient.get("comorbidity_count"),
        diabetes_flag=patient.get("diabetes_flag"),
        state=patient.get("state"),
    )


@router.get("/{patient_id}", response_model=PatientResponse, summary="Get patient by ID")
def get_patient(patient_id: str, db: sqlite3.Connection = Depends(get_db)):
    row = crud.get_patient_by_id(db, patient_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")
    return PatientResponse(**row)


@router.put("/{patient_id}", response_model=PatientResponse, summary="Full update patient")
def update_patient(patient_id: str, body: PatientUpdate, db: sqlite3.Connection = Depends(get_db)):
    if not crud.get_patient_by_id(db, patient_id):
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")
    row = crud.update_patient(db, patient_id, body.model_dump(exclude_unset=True))
    if row is None:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found after update.")
    return PatientResponse(**row)


@router.patch("/{patient_id}", response_model=PatientResponse, summary="Partial update patient")
def patch_patient(patient_id: str, body: PatientUpdate, db: sqlite3.Connection = Depends(get_db)):
    if not crud.get_patient_by_id(db, patient_id):
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")
    row = crud.update_patient(db, patient_id, body.model_dump(exclude_unset=True))
    if row is None:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found after update.")
    return PatientResponse(**row)


@router.delete("/{patient_id}", status_code=204, summary="Delete patient (cascades all related data)")
def delete_patient(patient_id: str, db: sqlite3.Connection = Depends(get_db)):
    if not crud.delete_patient(db, patient_id):
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")

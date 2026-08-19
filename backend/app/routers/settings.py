"""
app/routers/settings.py
Store and serve system configuration & risk scoring thresholds.
"""
import sqlite3
from fastapi import APIRouter, Depends
from app.db.connection import get_db
from app.schemas.settings import SettingsResponse, SettingsUpdate
from app.crud import settings as crud

router = APIRouter(prefix="/settings", tags=["Configuration & Settings"])


@router.get("", response_model=SettingsResponse, summary="Get active system threshold settings")
def get_settings(db: sqlite3.Connection = Depends(get_db)):
    data = crud.get_all_settings(db)
    return SettingsResponse(
        therapy_area=data.get("therapy_area", "Hypertension"),
        high_risk_threshold=int(data.get("high_risk_threshold", 70)),
        med_risk_threshold=int(data.get("med_risk_threshold", 40)),
        pdc_target=int(data.get("pdc_target", 80)),
        alerts_enabled=data.get("alerts_enabled", "true").lower() == "true",
        reminders_enabled=data.get("reminders_enabled", "true").lower() == "true",
        summary_enabled=data.get("summary_enabled", "false").lower() == "true",
    )


@router.put("", response_model=SettingsResponse, summary="Update system threshold settings")
def update_settings(body: SettingsUpdate, db: sqlite3.Connection = Depends(get_db)):
    to_update = {}
    if body.therapy_area is not None:
        to_update["therapy_area"] = body.therapy_area
    if body.high_risk_threshold is not None:
        to_update["high_risk_threshold"] = str(body.high_risk_threshold)
    if body.med_risk_threshold is not None:
        to_update["med_risk_threshold"] = str(body.med_risk_threshold)
    if body.pdc_target is not None:
        to_update["pdc_target"] = str(body.pdc_target)
    if body.alerts_enabled is not None:
        to_update["alerts_enabled"] = str(body.alerts_enabled).lower()
    if body.reminders_enabled is not None:
        to_update["reminders_enabled"] = str(body.reminders_enabled).lower()
    if body.summary_enabled is not None:
        to_update["summary_enabled"] = str(body.summary_enabled).lower()

    crud.update_settings(db, to_update)
    return get_settings(db)

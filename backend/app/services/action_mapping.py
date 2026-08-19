"""
app/services/action_mapping.py
-------------------------------
The only piece of business logic the backend owns:
given a patient's latest risk band, look up the appropriate
recommended action from the ACTION_RULES table.
"""
import sqlite3
from typing import Optional
from app.crud import action_rules as crud_rules
from app.crud import risk_score as crud_risk
from app.crud import settings as crud_settings


def get_patient_action(
    conn: sqlite3.Connection, patient_id: str
) -> Optional[dict]:
    """
    1. Fetch the patient's latest risk score.
    2. Dynamically determine risk_band using DB settings thresholds.
    3. Look up ACTION_RULES for that band.
    4. Return a combined action payload.
    Returns None if no risk score exists for the patient.
    """
    latest_score = crud_risk.get_latest_risk_score_by_patient(conn, patient_id)
    if not latest_score:
        return None

    score_val = latest_score["risk_score"]
    settings_dict = crud_settings.get_all_settings(conn)
    high_thresh = float(settings_dict.get("high_risk_threshold", 70))
    med_thresh = float(settings_dict.get("med_risk_threshold", 40))

    if score_val is not None:
        if score_val >= high_thresh:
            risk_band = "High"
        elif score_val >= med_thresh:
            risk_band = "Medium"
        else:
            risk_band = "Low"
    else:
        risk_band = latest_score.get("risk_band", "Low")

    rule = crud_rules.get_primary_rule_by_band(conn, risk_band)

    return {
        "patient_id": patient_id,
        "risk_band": risk_band,
        "risk_score": score_val,
        "recommended_action": rule["recommended_action"] if rule else "Routine Monitoring",
        "reason": rule["reason"] if rule else "No specific action rule configured.",
        "priority": rule["priority"] if rule else "Low",
    }

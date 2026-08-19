"""
tests/conftest.py
-----------------
Shared pytest fixtures:
  - in-memory SQLite DB (fresh per test)
  - FastAPI TestClient wired to the in-memory DB
"""
import sqlite3
import pytest
from fastapi.testclient import TestClient
from pathlib import Path

from app.main import app
from app.db.connection import get_db
from app.db.init_db import init_db


# ── In-memory DB fixture ────────────────────────────────────────────────────
@pytest.fixture(scope="function")
def test_db():
    """
    Creates a fresh in-memory SQLite connection for each test.
    Schema is applied via init_db with ":memory:" path.
    """
    schema_path = Path(__file__).parent.parent / "app" / "db" / "schema.sql"
    sql = schema_path.read_text(encoding="utf-8")

    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(sql)

    # Seed default action rules so action tests work
    conn.executemany(
        "INSERT INTO ACTION_RULES (rule_id, risk_band, recommended_action, reason, priority) VALUES (?,?,?,?,?)",
        [
            ("R1", "High",   "Copay Assistance",  "High copay burden.",    "Critical"),
            ("R2", "Medium", "SMS Reminder",       "Minor refill gaps.",    "Medium"),
            ("R3", "Low",    "Routine Monitoring", "Patient on track.",     "Low"),
        ],
    )
    conn.commit()
    yield conn
    conn.close()


# ── TestClient fixture ──────────────────────────────────────────────────────
@pytest.fixture(scope="function")
def client(test_db):
    """FastAPI TestClient with get_db overridden to use the in-memory DB."""
    def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── Helper data factories ────────────────────────────────────────────────────
def make_patient(patient_id: str = "PT001") -> dict:
    return {
        "patient_id": patient_id,
        "age": 45,
        "gender": "Female",
        "bmi": 26.5,
        "smoking_status": "Never",
        "alcohol_use": "None",
        "physical_activity": "Moderate",
        "income_range": "5-10L",
        "education_level": "Graduate",
        "health_literacy_score": 0.75,
        "state": "Maharashtra",
        "locality_type": "Urban",
        "care_sector": "Private",
        "comorbidity_count": 2,
        "diabetes_flag": 1,
        "disease_duration": 5.5,
        "diagnosis_age": 40.0,
        "forgetfulness_propensity": 0.35,
        "baseline_bp_control": 0,
        "diagnosis": "Hypertension",
    }


def make_risk_score(patient_id: str, score_id: str = "RS001",
                    risk_score: float = 82.0, risk_band: str = "High") -> dict:
    return {
        "score_id": score_id,
        "patient_id": patient_id,
        "score_date": "2026-08-01",
        "risk_score": risk_score,
        "risk_band": risk_band,
        "top_risk_factors": [
            {"factor": "Refill Gap", "contribution": 0.31},
            {"factor": "High Copay", "contribution": 0.22},
        ],
        "estimated_time_to_discontinuation": 45.0,
        "model_version": "v1.2",
    }

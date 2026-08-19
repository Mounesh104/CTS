"""
app/crud/ml_features.py
Raw-SQL data access for ML_FEATURES table.
Records are written by the external ML feature-engineering pipeline.
"""
import sqlite3
from typing import Optional


def upsert_ml_features(conn: sqlite3.Connection, data: dict) -> dict:
    """Insert or replace an ML_FEATURES record (idempotent for same feature_id)."""
    sql = """
        INSERT OR REPLACE INTO ML_FEATURES (
            feature_id, patient_id, prediction_date, missed_refill_rate,
            avg_refill_gap, max_refill_gap, avg_financial_burden,
            medication_count, unique_drug_classes, regimen_complexity_score,
            support_contact_count, patient_response_rate, non_persistent_next_60d
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    """
    params = (
        data["feature_id"], data["patient_id"], data.get("prediction_date"),
        data.get("missed_refill_rate"), data.get("avg_refill_gap"), data.get("max_refill_gap"),
        data.get("avg_financial_burden"), data.get("medication_count"),
        data.get("unique_drug_classes"), data.get("regimen_complexity_score"),
        data.get("support_contact_count"), data.get("patient_response_rate"),
        data.get("non_persistent_next_60d", 0),
    )
    conn.cursor().execute(sql, params)
    conn.commit()
    return get_features_by_id(conn, data["feature_id"])


def get_features_by_id(conn: sqlite3.Connection, feature_id: str) -> Optional[dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ML_FEATURES WHERE feature_id = ?", (feature_id,))
    row = cursor.fetchone()
    return dict(row) if row else None


def get_latest_features_by_patient(conn: sqlite3.Connection, patient_id: str) -> Optional[dict]:
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM ML_FEATURES WHERE patient_id = ? ORDER BY prediction_date DESC LIMIT 1",
        (patient_id,),
    )
    row = cursor.fetchone()
    return dict(row) if row else None


def get_features_history_by_patient(conn: sqlite3.Connection, patient_id: str) -> list[dict]:
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM ML_FEATURES WHERE patient_id = ? ORDER BY prediction_date DESC",
        (patient_id,),
    )
    return [dict(r) for r in cursor.fetchall()]


def get_ml_features_list(
    conn: sqlite3.Connection, limit: int = 20, offset: int = 0
) -> tuple[list[dict], int]:
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM ML_FEATURES")
    total = cursor.fetchone()[0]
    cursor.execute("SELECT * FROM ML_FEATURES ORDER BY prediction_date DESC LIMIT ? OFFSET ?", (limit, offset))
    return [dict(r) for r in cursor.fetchall()], total


def bulk_upsert_ml_features(conn: sqlite3.Connection, records: list[dict]) -> int:
    sql = """
        INSERT OR REPLACE INTO ML_FEATURES (
            feature_id, patient_id, prediction_date, missed_refill_rate,
            avg_refill_gap, max_refill_gap, avg_financial_burden,
            medication_count, unique_drug_classes, regimen_complexity_score,
            support_contact_count, patient_response_rate, non_persistent_next_60d
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    """
    params = [
        (
            r["feature_id"], r["patient_id"], r.get("prediction_date"),
            r.get("missed_refill_rate"), r.get("avg_refill_gap"), r.get("max_refill_gap"),
            r.get("avg_financial_burden"), r.get("medication_count"),
            r.get("unique_drug_classes"), r.get("regimen_complexity_score"),
            r.get("support_contact_count"), r.get("patient_response_rate"),
            r.get("non_persistent_next_60d", 0),
        )
        for r in records
    ]
    cursor = conn.cursor()
    cursor.executemany(sql, params)
    conn.commit()
    return len(params)

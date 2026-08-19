"""
app/crud/therapy_outcome.py
Raw-SQL data access for THERAPY_OUTCOME table.
"""
import sqlite3
from typing import Optional


def create_therapy_outcome(conn: sqlite3.Connection, data: dict) -> dict:
    sql = """
        INSERT INTO THERAPY_OUTCOME (
            therapy_id, patient_id, therapy_start_date, prediction_date,
            prediction_window_end_date, followup_end_date, discontinuation_date,
            discontinuation_flag, event_observed, persistence_days,
            censoring_type, non_persistent_next_60d, side_effect_concern,
            perceived_treatment_benefit
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """
    params = (
        data["therapy_id"], data["patient_id"], data.get("therapy_start_date"),
        data.get("prediction_date"), data.get("prediction_window_end_date"),
        data.get("followup_end_date"), data.get("discontinuation_date"),
        data.get("discontinuation_flag", 0), data.get("event_observed", 0),
        data.get("persistence_days"), data.get("censoring_type"),
        data.get("non_persistent_next_60d", 0), data.get("side_effect_concern", 0),
        data.get("perceived_treatment_benefit"),
    )
    conn.cursor().execute(sql, params)
    conn.commit()
    return get_therapy_outcome_by_id(conn, data["therapy_id"])


def get_therapy_outcome_by_id(conn: sqlite3.Connection, therapy_id: str) -> Optional[dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM THERAPY_OUTCOME WHERE therapy_id = ?", (therapy_id,))
    row = cursor.fetchone()
    return dict(row) if row else None


def get_therapy_outcomes(
    conn: sqlite3.Connection,
    limit: int = 20,
    offset: int = 0,
    patient_id: Optional[str] = None,
) -> tuple[list[dict], int]:
    where = "WHERE patient_id = ?" if patient_id else ""
    params: list = [patient_id] if patient_id else []
    cursor = conn.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM THERAPY_OUTCOME {where}", params)
    total = cursor.fetchone()[0]
    cursor.execute(f"SELECT * FROM THERAPY_OUTCOME {where} ORDER BY prediction_date DESC LIMIT ? OFFSET ?", params + [limit, offset])
    return [dict(r) for r in cursor.fetchall()], total


def get_latest_therapy_outcome_by_patient(conn: sqlite3.Connection, patient_id: str) -> Optional[dict]:
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM THERAPY_OUTCOME WHERE patient_id = ? ORDER BY prediction_date DESC LIMIT 1",
        (patient_id,),
    )
    row = cursor.fetchone()
    return dict(row) if row else None


def update_therapy_outcome(conn: sqlite3.Connection, therapy_id: str, data: dict) -> Optional[dict]:
    fields = {k: v for k, v in data.items() if k != "therapy_id" and v is not None}
    if not fields:
        return get_therapy_outcome_by_id(conn, therapy_id)
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    conn.cursor().execute(f"UPDATE THERAPY_OUTCOME SET {set_clause} WHERE therapy_id = ?", list(fields.values()) + [therapy_id])
    conn.commit()
    return get_therapy_outcome_by_id(conn, therapy_id)


def delete_therapy_outcome(conn: sqlite3.Connection, therapy_id: str) -> bool:
    cursor = conn.cursor()
    cursor.execute("DELETE FROM THERAPY_OUTCOME WHERE therapy_id = ?", (therapy_id,))
    conn.commit()
    return cursor.rowcount > 0


def bulk_create_therapy_outcomes(conn: sqlite3.Connection, records: list[dict]) -> int:
    sql = """
        INSERT OR IGNORE INTO THERAPY_OUTCOME (
            therapy_id, patient_id, therapy_start_date, prediction_date,
            prediction_window_end_date, followup_end_date, discontinuation_date,
            discontinuation_flag, event_observed, persistence_days,
            censoring_type, non_persistent_next_60d, side_effect_concern,
            perceived_treatment_benefit
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """
    params_list = [
        (
            r["therapy_id"], r["patient_id"], r.get("therapy_start_date"),
            r.get("prediction_date"), r.get("prediction_window_end_date"),
            r.get("followup_end_date"), r.get("discontinuation_date"),
            r.get("discontinuation_flag", 0), r.get("event_observed", 0),
            r.get("persistence_days"), r.get("censoring_type"),
            r.get("non_persistent_next_60d", 0), r.get("side_effect_concern", 0),
            r.get("perceived_treatment_benefit"),
        )
        for r in records
    ]
    cursor = conn.cursor()
    cursor.executemany(sql, params_list)
    conn.commit()
    return len(params_list)

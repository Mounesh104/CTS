"""
app/crud/outcome_log.py
Raw-SQL data access for OUTCOME_LOG table.
"""
import sqlite3
from typing import Optional


def create_outcome_log(conn: sqlite3.Connection, data: dict) -> dict:
    sql = """
        INSERT INTO OUTCOME_LOG (
            outcome_id, patient_id, intervention_performed,
            intervention_date, intervention_channel,
            patient_response, outcome_recorded, created_at
        ) VALUES (?,?,?,?,?,?,?,?)
    """
    params = (
        data["outcome_id"], data["patient_id"],
        data.get("intervention_performed"), data.get("intervention_date"),
        data.get("intervention_channel"), data.get("patient_response"),
        data.get("outcome_recorded"), data.get("created_at"),
    )
    conn.cursor().execute(sql, params)
    conn.commit()
    return get_outcome_log_by_id(conn, data["outcome_id"])


def get_outcome_log_by_id(conn: sqlite3.Connection, outcome_id: str) -> Optional[dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM OUTCOME_LOG WHERE outcome_id = ?", (outcome_id,))
    row = cursor.fetchone()
    return dict(row) if row else None


def get_outcome_logs_by_patient(
    conn: sqlite3.Connection,
    patient_id: str,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[dict], int]:
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM OUTCOME_LOG WHERE patient_id = ?", (patient_id,))
    total = cursor.fetchone()[0]
    cursor.execute(
        "SELECT * FROM OUTCOME_LOG WHERE patient_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
        (patient_id, limit, offset),
    )
    return [dict(r) for r in cursor.fetchall()], total


def get_outcome_summary(conn: sqlite3.Connection) -> dict:
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM OUTCOME_LOG")
    total = cursor.fetchone()[0]

    cursor.execute("SELECT intervention_performed, COUNT(*) FROM OUTCOME_LOG GROUP BY intervention_performed")
    by_type = {r[0] or "Unknown": r[1] for r in cursor.fetchall()}

    cursor.execute("SELECT patient_response, COUNT(*) FROM OUTCOME_LOG GROUP BY patient_response")
    by_response = {r[0] or "Unknown": r[1] for r in cursor.fetchall()}

    cursor.execute("SELECT intervention_channel, COUNT(*) FROM OUTCOME_LOG GROUP BY intervention_channel")
    by_channel = {r[0] or "Unknown": r[1] for r in cursor.fetchall()}

    return {
        "total_outcomes": total,
        "by_intervention_type": by_type,
        "by_patient_response": by_response,
        "by_channel": by_channel,
    }

"""
app/crud/patient.py
-------------------
Raw-SQL data access functions for the PATIENT table.
All queries use parameterized ? placeholders — no string formatting.
"""
import sqlite3
from typing import Optional


def create_patient(conn: sqlite3.Connection, data: dict) -> dict:
    sql = """
        INSERT INTO PATIENT (
            patient_id, age, gender, bmi, smoking_status, alcohol_use,
            physical_activity, income_range, education_level, health_literacy_score,
            state, locality_type, care_sector, comorbidity_count, diabetes_flag,
            disease_duration, diagnosis_age, forgetfulness_propensity,
            baseline_bp_control, diagnosis
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """
    params = (
        data["patient_id"], data.get("age"), data.get("gender"), data.get("bmi"),
        data.get("smoking_status"), data.get("alcohol_use"), data.get("physical_activity"),
        data.get("income_range"), data.get("education_level"), data.get("health_literacy_score"),
        data.get("state"), data.get("locality_type"), data.get("care_sector"),
        data.get("comorbidity_count"), data.get("diabetes_flag", 0),
        data.get("disease_duration"), data.get("diagnosis_age"),
        data.get("forgetfulness_propensity"), data.get("baseline_bp_control", 0),
        data.get("diagnosis"),
    )
    cursor = conn.cursor()
    cursor.execute(sql, params)
    conn.commit()
    return get_patient_by_id(conn, data["patient_id"])


def get_patient_by_id(conn: sqlite3.Connection, patient_id: str) -> Optional[dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM PATIENT WHERE patient_id = ?", (patient_id,))
    row = cursor.fetchone()
    return dict(row) if row else None


def get_patients(
    conn: sqlite3.Connection,
    limit: int = 20,
    offset: int = 0,
    risk_level: Optional[str] = None,
    diagnosis: Optional[str] = None,
) -> tuple[list[dict], int]:
    """Returns (items, total_count)."""
    where_clauses = []
    params: list = []

    # risk_level filter requires joining with RISK_SCORE — handled in router via subquery
    if diagnosis:
        where_clauses.append("p.diagnosis = ?")
        params.append(diagnosis)

    where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    count_sql = f"SELECT COUNT(*) FROM PATIENT p {where_sql}"
    cursor = conn.cursor()
    cursor.execute(count_sql, params)
    total = cursor.fetchone()[0]

    query_sql = f"SELECT * FROM PATIENT p {where_sql} LIMIT ? OFFSET ?"
    cursor.execute(query_sql, params + [limit, offset])
    rows = cursor.fetchall()
    return [dict(r) for r in rows], total


def update_patient(conn: sqlite3.Connection, patient_id: str, data: dict) -> Optional[dict]:
    fields = {k: v for k, v in data.items() if k != "patient_id" and v is not None}
    if not fields:
        return get_patient_by_id(conn, patient_id)
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    params = list(fields.values()) + [patient_id]
    conn.cursor().execute(f"UPDATE PATIENT SET {set_clause} WHERE patient_id = ?", params)
    conn.commit()
    return get_patient_by_id(conn, patient_id)


def delete_patient(conn: sqlite3.Connection, patient_id: str) -> bool:
    cursor = conn.cursor()
    cursor.execute("DELETE FROM PATIENT WHERE patient_id = ?", (patient_id,))
    conn.commit()
    return cursor.rowcount > 0


def bulk_create_patients(conn: sqlite3.Connection, patients: list[dict]) -> int:
    sql = """
        INSERT OR IGNORE INTO PATIENT (
            patient_id, age, gender, bmi, smoking_status, alcohol_use,
            physical_activity, income_range, education_level, health_literacy_score,
            state, locality_type, care_sector, comorbidity_count, diabetes_flag,
            disease_duration, diagnosis_age, forgetfulness_propensity,
            baseline_bp_control, diagnosis
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """
    params = [
        (
            p["patient_id"], p.get("age"), p.get("gender"), p.get("bmi"),
            p.get("smoking_status"), p.get("alcohol_use"), p.get("physical_activity"),
            p.get("income_range"), p.get("education_level"), p.get("health_literacy_score"),
            p.get("state"), p.get("locality_type"), p.get("care_sector"),
            p.get("comorbidity_count"), p.get("diabetes_flag", 0),
            p.get("disease_duration"), p.get("diagnosis_age"),
            p.get("forgetfulness_propensity"), p.get("baseline_bp_control", 0),
            p.get("diagnosis"),
        )
        for p in patients
    ]
    cursor = conn.cursor()
    cursor.executemany(sql, params)
    conn.commit()
    return cursor.rowcount

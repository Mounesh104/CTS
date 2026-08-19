"""
app/crud/risk_score.py
Raw-SQL data access for RISK_SCORE table.
Risk scores are computed externally and stored here via POST.
top_risk_factors is stored as JSON string and parsed on read.
"""
import sqlite3
import json
from typing import Optional


def _serialize(data: dict) -> dict:
    """Serialize top_risk_factors list → JSON string before DB insert."""
    d = dict(data)
    if isinstance(d.get("top_risk_factors"), list):
        d["top_risk_factors"] = json.dumps(d["top_risk_factors"])
    return d


def _deserialize(row: dict) -> dict:
    """Parse top_risk_factors JSON string → list on read."""
    if row and isinstance(row.get("top_risk_factors"), str):
        try:
            row["top_risk_factors"] = json.loads(row["top_risk_factors"])
        except (json.JSONDecodeError, TypeError):
            row["top_risk_factors"] = []
    return row


def create_risk_score(conn: sqlite3.Connection, data: dict) -> dict:
    d = _serialize(data)
    sql = """
        INSERT INTO RISK_SCORE (
            score_id, patient_id, score_date, risk_score, risk_band,
            top_risk_factors, estimated_time_to_discontinuation, model_version
        ) VALUES (?,?,?,?,?,?,?,?)
    """
    params = (
        d["score_id"], d["patient_id"], d.get("score_date"), d["risk_score"],
        d["risk_band"], d.get("top_risk_factors", "[]"),
        d.get("estimated_time_to_discontinuation"), d.get("model_version"),
    )
    conn.cursor().execute(sql, params)
    conn.commit()
    return get_risk_score_by_id(conn, d["score_id"])


def get_risk_score_by_id(conn: sqlite3.Connection, score_id: str) -> Optional[dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM RISK_SCORE WHERE score_id = ?", (score_id,))
    row = cursor.fetchone()
    return _deserialize(dict(row)) if row else None


def get_latest_risk_score_by_patient(conn: sqlite3.Connection, patient_id: str) -> Optional[dict]:
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM RISK_SCORE WHERE patient_id = ? ORDER BY score_date DESC LIMIT 1",
        (patient_id,),
    )
    row = cursor.fetchone()
    return _deserialize(dict(row)) if row else None


def get_risk_score_history(
    conn: sqlite3.Connection,
    patient_id: str,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[dict], int]:
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM RISK_SCORE WHERE patient_id = ?", (patient_id,))
    total = cursor.fetchone()[0]
    cursor.execute(
        "SELECT * FROM RISK_SCORE WHERE patient_id = ? ORDER BY score_date DESC LIMIT ? OFFSET ?",
        (patient_id, limit, offset),
    )
    return [_deserialize(dict(r)) for r in cursor.fetchall()], total


def bulk_create_risk_scores(conn: sqlite3.Connection, records: list[dict]) -> int:
    sql = """
        INSERT OR IGNORE INTO RISK_SCORE (
            score_id, patient_id, score_date, risk_score, risk_band,
            top_risk_factors, estimated_time_to_discontinuation, model_version
        ) VALUES (?,?,?,?,?,?,?,?)
    """
    params_list = []
    for r in records:
        d = _serialize(r)
        params_list.append((
            d["score_id"], d["patient_id"], d.get("score_date"), d["risk_score"],
            d["risk_band"], d.get("top_risk_factors", "[]"),
            d.get("estimated_time_to_discontinuation"), d.get("model_version"),
        ))
    cursor = conn.cursor()
    cursor.executemany(sql, params_list)
    conn.commit()
    return len(params_list)


def get_risk_band_counts(conn: sqlite3.Connection) -> dict:
    """Return count of patients by their latest risk_band."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT rs.risk_band, COUNT(*) as cnt
        FROM RISK_SCORE rs
        INNER JOIN (
            SELECT patient_id, MAX(score_date) as max_date
            FROM RISK_SCORE
            GROUP BY patient_id
        ) latest ON rs.patient_id = latest.patient_id AND rs.score_date = latest.max_date
        GROUP BY rs.risk_band
    """)
    result = {"High": 0, "Medium": 0, "Low": 0}
    for row in cursor.fetchall():
        result[row["risk_band"]] = row["cnt"]
    return result

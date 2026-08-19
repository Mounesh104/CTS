"""
app/crud/model_metrics.py
Raw-SQL data access for MODEL_METRICS table.
Metrics are written by the external ML monitoring pipeline.
"""
import sqlite3
from typing import Optional


def create_model_metrics(conn: sqlite3.Connection, data: dict) -> dict:
    sql = """
        INSERT INTO MODEL_METRICS (
            metric_id, evaluation_date, accuracy, auc, c_index,
            drift_score, model_version, retrain_triggered, notes
        ) VALUES (?,?,?,?,?,?,?,?,?)
    """
    params = (
        data["metric_id"], data.get("evaluation_date"),
        data.get("accuracy"), data.get("auc"), data.get("c_index"),
        data.get("drift_score"), data.get("model_version"),
        data.get("retrain_triggered", 0), data.get("notes"),
    )
    conn.cursor().execute(sql, params)
    conn.commit()
    return get_metrics_by_id(conn, data["metric_id"])


def get_metrics_by_id(conn: sqlite3.Connection, metric_id: str) -> Optional[dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM MODEL_METRICS WHERE metric_id = ?", (metric_id,))
    row = cursor.fetchone()
    return dict(row) if row else None


def get_all_metrics(
    conn: sqlite3.Connection, limit: int = 20, offset: int = 0
) -> tuple[list[dict], int]:
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM MODEL_METRICS")
    total = cursor.fetchone()[0]
    cursor.execute(
        "SELECT * FROM MODEL_METRICS ORDER BY evaluation_date DESC LIMIT ? OFFSET ?",
        (limit, offset),
    )
    return [dict(r) for r in cursor.fetchall()], total


def get_latest_metrics(conn: sqlite3.Connection) -> Optional[dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM MODEL_METRICS ORDER BY evaluation_date DESC LIMIT 1")
    row = cursor.fetchone()
    return dict(row) if row else None

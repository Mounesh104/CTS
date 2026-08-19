"""
app/crud/support_event.py
Raw-SQL data access for SUPPORT_EVENT table.
"""
import sqlite3
from typing import Optional


def create_support_event(conn: sqlite3.Connection, data: dict) -> dict:
    sql = """
        INSERT INTO SUPPORT_EVENT (
            support_id, patient_id, contact_date, contact_type, channel,
            contact_outcome, refill_reminder_sent, patient_response_flag,
            side_effect_reported, financial_assistance_flag,
            intervention_type, intervention_outcome
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    """
    params = (
        data["support_id"], data["patient_id"], data.get("contact_date"),
        data.get("contact_type"), data.get("channel"), data.get("contact_outcome"),
        data.get("refill_reminder_sent", 0), data.get("patient_response_flag", 0),
        data.get("side_effect_reported", 0), data.get("financial_assistance_flag", 0),
        data.get("intervention_type"), data.get("intervention_outcome"),
    )
    conn.cursor().execute(sql, params)
    conn.commit()
    return get_support_event_by_id(conn, data["support_id"])


def get_support_event_by_id(conn: sqlite3.Connection, support_id: str) -> Optional[dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM SUPPORT_EVENT WHERE support_id = ?", (support_id,))
    row = cursor.fetchone()
    return dict(row) if row else None


def get_support_events(
    conn: sqlite3.Connection,
    limit: int = 20,
    offset: int = 0,
    patient_id: Optional[str] = None,
) -> tuple[list[dict], int]:
    where = "WHERE patient_id = ?" if patient_id else ""
    params: list = [patient_id] if patient_id else []
    cursor = conn.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM SUPPORT_EVENT {where}", params)
    total = cursor.fetchone()[0]
    cursor.execute(f"SELECT * FROM SUPPORT_EVENT {where} ORDER BY contact_date DESC LIMIT ? OFFSET ?", params + [limit, offset])
    return [dict(r) for r in cursor.fetchall()], total


def get_support_events_by_patient(conn: sqlite3.Connection, patient_id: str) -> list[dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM SUPPORT_EVENT WHERE patient_id = ? ORDER BY contact_date DESC", (patient_id,))
    return [dict(r) for r in cursor.fetchall()]


def update_support_event(conn: sqlite3.Connection, support_id: str, data: dict) -> Optional[dict]:
    fields = {k: v for k, v in data.items() if k != "support_id" and v is not None}
    if not fields:
        return get_support_event_by_id(conn, support_id)
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    conn.cursor().execute(f"UPDATE SUPPORT_EVENT SET {set_clause} WHERE support_id = ?", list(fields.values()) + [support_id])
    conn.commit()
    return get_support_event_by_id(conn, support_id)


def delete_support_event(conn: sqlite3.Connection, support_id: str) -> bool:
    cursor = conn.cursor()
    cursor.execute("DELETE FROM SUPPORT_EVENT WHERE support_id = ?", (support_id,))
    conn.commit()
    return cursor.rowcount > 0


def bulk_create_support_events(conn: sqlite3.Connection, events: list[dict]) -> int:
    sql = """
        INSERT OR IGNORE INTO SUPPORT_EVENT (
            support_id, patient_id, contact_date, contact_type, channel,
            contact_outcome, refill_reminder_sent, patient_response_flag,
            side_effect_reported, financial_assistance_flag,
            intervention_type, intervention_outcome
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    """
    params = [
        (
            e["support_id"], e["patient_id"], e.get("contact_date"),
            e.get("contact_type"), e.get("channel"), e.get("contact_outcome"),
            e.get("refill_reminder_sent", 0), e.get("patient_response_flag", 0),
            e.get("side_effect_reported", 0), e.get("financial_assistance_flag", 0),
            e.get("intervention_type"), e.get("intervention_outcome"),
        )
        for e in events
    ]
    cursor = conn.cursor()
    cursor.executemany(sql, params)
    conn.commit()
    return len(params)

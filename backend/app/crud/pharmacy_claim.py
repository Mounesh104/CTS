"""
app/crud/pharmacy_claim.py
Raw-SQL data access for PHARMACY_CLAIM table.
"""
import sqlite3
from typing import Optional


def create_claim(conn: sqlite3.Connection, data: dict) -> dict:
    sql = """
        INSERT INTO PHARMACY_CLAIM (
            claim_id, patient_id, drug_id, dispense_date, expected_refill_date,
            refill_date, days_supply, quantity_dispensed, refill_gap_days,
            missed_refill_flag, refill_cause, stockout_flag, pharmacy_id,
            claim_status, copay_amount_inr, financial_burden, refill_number
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """
    params = (
        data["claim_id"], data["patient_id"], data.get("drug_id"),
        data.get("dispense_date"), data.get("expected_refill_date"), data.get("refill_date"),
        data.get("days_supply"), data.get("quantity_dispensed"), data.get("refill_gap_days", 0),
        data.get("missed_refill_flag", 0), data.get("refill_cause"), data.get("stockout_flag", 0),
        data.get("pharmacy_id"), data.get("claim_status"),
        data.get("copay_amount_inr"), data.get("financial_burden"), data.get("refill_number"),
    )
    conn.cursor().execute(sql, params)
    conn.commit()
    return get_claim_by_id(conn, data["claim_id"])


def get_claim_by_id(conn: sqlite3.Connection, claim_id: str) -> Optional[dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM PHARMACY_CLAIM WHERE claim_id = ?", (claim_id,))
    row = cursor.fetchone()
    return dict(row) if row else None


def get_claims(
    conn: sqlite3.Connection,
    limit: int = 20,
    offset: int = 0,
    patient_id: Optional[str] = None,
) -> tuple[list[dict], int]:
    where = "WHERE patient_id = ?" if patient_id else ""
    params: list = [patient_id] if patient_id else []
    cursor = conn.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM PHARMACY_CLAIM {where}", params)
    total = cursor.fetchone()[0]
    cursor.execute(f"SELECT * FROM PHARMACY_CLAIM {where} ORDER BY dispense_date DESC LIMIT ? OFFSET ?", params + [limit, offset])
    return [dict(r) for r in cursor.fetchall()], total


def get_claims_by_patient(conn: sqlite3.Connection, patient_id: str) -> list[dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM PHARMACY_CLAIM WHERE patient_id = ? ORDER BY dispense_date DESC", (patient_id,))
    return [dict(r) for r in cursor.fetchall()]


def update_claim(conn: sqlite3.Connection, claim_id: str, data: dict) -> Optional[dict]:
    fields = {k: v for k, v in data.items() if k not in ("claim_id",) and v is not None}
    if not fields:
        return get_claim_by_id(conn, claim_id)
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    conn.cursor().execute(f"UPDATE PHARMACY_CLAIM SET {set_clause} WHERE claim_id = ?", list(fields.values()) + [claim_id])
    conn.commit()
    return get_claim_by_id(conn, claim_id)


def delete_claim(conn: sqlite3.Connection, claim_id: str) -> bool:
    cursor = conn.cursor()
    cursor.execute("DELETE FROM PHARMACY_CLAIM WHERE claim_id = ?", (claim_id,))
    conn.commit()
    return cursor.rowcount > 0


def bulk_create_claims(conn: sqlite3.Connection, claims: list[dict]) -> int:
    sql = """
        INSERT OR IGNORE INTO PHARMACY_CLAIM (
            claim_id, patient_id, drug_id, dispense_date, expected_refill_date,
            refill_date, days_supply, quantity_dispensed, refill_gap_days,
            missed_refill_flag, refill_cause, stockout_flag, pharmacy_id,
            claim_status, copay_amount_inr, financial_burden, refill_number
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """
    params = [
        (
            c["claim_id"], c["patient_id"], c.get("drug_id"),
            c.get("dispense_date"), c.get("expected_refill_date"), c.get("refill_date"),
            c.get("days_supply"), c.get("quantity_dispensed"), c.get("refill_gap_days", 0),
            c.get("missed_refill_flag", 0), c.get("refill_cause"), c.get("stockout_flag", 0),
            c.get("pharmacy_id"), c.get("claim_status"),
            c.get("copay_amount_inr"), c.get("financial_burden"), c.get("refill_number"),
        )
        for c in claims
    ]
    cursor = conn.cursor()
    cursor.executemany(sql, params)
    conn.commit()
    return len(params)

"""
app/crud/insurance.py
Raw-SQL data access for INSURANCE table.
"""
import sqlite3
from typing import Optional


def create_insurance(conn: sqlite3.Connection, data: dict) -> dict:
    sql = """
        INSERT INTO INSURANCE (
            policy_id, patient_id, insurance_vendor_name, coverage_type,
            annual_contribution, claim_amount, claim_status, copay_amount,
            out_of_pocket_amount, drug_coverage_flag, prior_auth_flag, monthly_income_inr
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    """
    params = (
        data["policy_id"], data["patient_id"], data.get("insurance_vendor_name"),
        data.get("coverage_type"), data.get("annual_contribution"), data.get("claim_amount"),
        data.get("claim_status"), data.get("copay_amount"), data.get("out_of_pocket_amount"),
        data.get("drug_coverage_flag", 0), data.get("prior_auth_flag", 0),
        data.get("monthly_income_inr"),
    )
    conn.cursor().execute(sql, params)
    conn.commit()
    return get_insurance_by_id(conn, data["policy_id"])


def get_insurance_by_id(conn: sqlite3.Connection, policy_id: str) -> Optional[dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM INSURANCE WHERE policy_id = ?", (policy_id,))
    row = cursor.fetchone()
    return dict(row) if row else None


def get_insurance_records(
    conn: sqlite3.Connection,
    limit: int = 20,
    offset: int = 0,
    patient_id: Optional[str] = None,
) -> tuple[list[dict], int]:
    where = "WHERE patient_id = ?" if patient_id else ""
    params: list = [patient_id] if patient_id else []
    cursor = conn.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM INSURANCE {where}", params)
    total = cursor.fetchone()[0]
    cursor.execute(f"SELECT * FROM INSURANCE {where} LIMIT ? OFFSET ?", params + [limit, offset])
    return [dict(r) for r in cursor.fetchall()], total


def get_insurance_by_patient(conn: sqlite3.Connection, patient_id: str) -> list[dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM INSURANCE WHERE patient_id = ?", (patient_id,))
    return [dict(r) for r in cursor.fetchall()]


def update_insurance(conn: sqlite3.Connection, policy_id: str, data: dict) -> Optional[dict]:
    fields = {k: v for k, v in data.items() if k != "policy_id" and v is not None}
    if not fields:
        return get_insurance_by_id(conn, policy_id)
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    conn.cursor().execute(f"UPDATE INSURANCE SET {set_clause} WHERE policy_id = ?", list(fields.values()) + [policy_id])
    conn.commit()
    return get_insurance_by_id(conn, policy_id)


def delete_insurance(conn: sqlite3.Connection, policy_id: str) -> bool:
    cursor = conn.cursor()
    cursor.execute("DELETE FROM INSURANCE WHERE policy_id = ?", (policy_id,))
    conn.commit()
    return cursor.rowcount > 0


def bulk_create_insurance(conn: sqlite3.Connection, records: list[dict]) -> int:
    sql = """
        INSERT OR IGNORE INTO INSURANCE (
            policy_id, patient_id, insurance_vendor_name, coverage_type,
            annual_contribution, claim_amount, claim_status, copay_amount,
            out_of_pocket_amount, drug_coverage_flag, prior_auth_flag, monthly_income_inr
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    """
    params = [
        (
            r["policy_id"], r["patient_id"], r.get("insurance_vendor_name"),
            r.get("coverage_type"), r.get("annual_contribution"), r.get("claim_amount"),
            r.get("claim_status"), r.get("copay_amount"), r.get("out_of_pocket_amount"),
            r.get("drug_coverage_flag", 0), r.get("prior_auth_flag", 0),
            r.get("monthly_income_inr"),
        )
        for r in records
    ]
    cursor = conn.cursor()
    cursor.executemany(sql, params)
    conn.commit()
    return len(params)

"""
app/crud/action_rules.py
Raw-SQL data access for ACTION_RULES table.
"""
import sqlite3
from typing import Optional


def get_all_rules(conn: sqlite3.Connection) -> list[dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ACTION_RULES ORDER BY risk_band")
    return [dict(r) for r in cursor.fetchall()]


def get_rule_by_id(conn: sqlite3.Connection, rule_id: str) -> Optional[dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ACTION_RULES WHERE rule_id = ?", (rule_id,))
    row = cursor.fetchone()
    return dict(row) if row else None


def get_rules_by_band(conn: sqlite3.Connection, risk_band: str) -> list[dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ACTION_RULES WHERE risk_band = ?", (risk_band,))
    return [dict(r) for r in cursor.fetchall()]


def get_primary_rule_by_band(conn: sqlite3.Connection, risk_band: str) -> Optional[dict]:
    """Return the first (primary) rule for a given risk band."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ACTION_RULES WHERE risk_band = ? LIMIT 1", (risk_band,))
    row = cursor.fetchone()
    return dict(row) if row else None


def create_rule(conn: sqlite3.Connection, data: dict) -> dict:
    sql = """
        INSERT INTO ACTION_RULES (rule_id, risk_band, recommended_action, reason, priority)
        VALUES (?,?,?,?,?)
    """
    conn.cursor().execute(sql, (
        data["rule_id"], data["risk_band"], data["recommended_action"],
        data.get("reason"), data.get("priority"),
    ))
    conn.commit()
    return get_rule_by_id(conn, data["rule_id"])


def replace_all_rules(conn: sqlite3.Connection, rules: list[dict]) -> int:
    """Delete all existing rules and insert the new set (atomic)."""
    cursor = conn.cursor()
    cursor.execute("DELETE FROM ACTION_RULES")
    sql = """
        INSERT INTO ACTION_RULES (rule_id, risk_band, recommended_action, reason, priority)
        VALUES (?,?,?,?,?)
    """
    params = [
        (r["rule_id"], r["risk_band"], r["recommended_action"], r.get("reason"), r.get("priority"))
        for r in rules
    ]
    cursor.executemany(sql, params)
    conn.commit()
    return len(params)

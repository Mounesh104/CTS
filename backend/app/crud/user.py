"""
app/crud/user.py
Raw-SQL data access for the USERS table (signup / login / profile).
"""
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Optional

from app.core.security import hash_password, verify_password


def _to_response(row: sqlite3.Row) -> dict:
    d = dict(row)
    d.pop("password_hash", None)
    d.pop("password_salt", None)
    return d


def get_user_by_email(conn: sqlite3.Connection, email: str) -> Optional[dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM USERS WHERE email = ?", (email.lower(),))
    row = cursor.fetchone()
    return dict(row) if row else None


def get_user_by_id(conn: sqlite3.Connection, user_id: str) -> Optional[dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM USERS WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    return _to_response(row) if row else None


def create_user(conn: sqlite3.Connection, full_name: str, email: str, password: str,
                 organization: Optional[str], role: Optional[str]) -> dict:
    email = email.lower().strip()
    if get_user_by_email(conn, email):
        raise ValueError(f"An account with email '{email}' already exists.")

    password_hash, password_salt = hash_password(password)
    user_id = f"USR-{uuid.uuid4().hex[:12]}"
    created_at = datetime.now(timezone.utc).isoformat()

    conn.execute("""
        INSERT INTO USERS (user_id, full_name, email, password_hash, password_salt, organization, role, created_at)
        VALUES (?,?,?,?,?,?,?,?)
    """, (user_id, full_name.strip(), email, password_hash, password_salt, organization, role, created_at))
    conn.commit()
    return get_user_by_id(conn, user_id)


def authenticate(conn: sqlite3.Connection, email: str, password: str) -> Optional[dict]:
    row = get_user_by_email(conn, email)
    if not row:
        return None
    if not verify_password(password, row["password_salt"], row["password_hash"]):
        return None
    return _to_response(row)


def update_user(conn: sqlite3.Connection, user_id: str, data: dict) -> Optional[dict]:
    existing = get_user_by_id(conn, user_id)
    if not existing:
        return None

    fields = {}
    if data.get("full_name"):
        fields["full_name"] = data["full_name"].strip()
    if data.get("organization") is not None:
        fields["organization"] = data["organization"]
    if data.get("role") is not None:
        fields["role"] = data["role"]
    if data.get("email"):
        new_email = data["email"].lower().strip()
        if new_email != existing["email"]:
            other = get_user_by_email(conn, new_email)
            if other and other["user_id"] != user_id:
                raise ValueError(f"An account with email '{new_email}' already exists.")
            fields["email"] = new_email
    if data.get("new_password"):
        password_hash, password_salt = hash_password(data["new_password"])
        fields["password_hash"] = password_hash
        fields["password_salt"] = password_salt

    if not fields:
        return existing

    set_clause = ", ".join(f"{k} = ?" for k in fields)
    params = list(fields.values()) + [user_id]
    conn.execute(f"UPDATE USERS SET {set_clause} WHERE user_id = ?", params)
    conn.commit()
    return get_user_by_id(conn, user_id)

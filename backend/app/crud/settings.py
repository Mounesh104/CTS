"""
app/crud/settings.py
Raw-SQL data access for SETTINGS table.
"""
import sqlite3

DEFAULT_SETTINGS = {
    "therapy_area": "Hypertension",
    "high_risk_threshold": "70",
    "med_risk_threshold": "40",
    "pdc_target": "80",
    "alerts_enabled": "true",
    "reminders_enabled": "true",
    "summary_enabled": "false",
}


def get_all_settings(conn: sqlite3.Connection) -> dict:
    """Fetch all key-value settings from DB, merged with defaults."""
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM SETTINGS")
    rows = cursor.fetchall()
    result = dict(DEFAULT_SETTINGS)
    for row in rows:
        result[row[0]] = row[1]
    return result


def get_setting(conn: sqlite3.Connection, key: str, default: str = "") -> str:
    """Get a single setting value by key."""
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM SETTINGS WHERE key = ?", (key,))
    row = cursor.fetchone()
    if row:
        return row[0]
    return DEFAULT_SETTINGS.get(key, default)


def update_settings(conn: sqlite3.Connection, settings_dict: dict) -> dict:
    """Upsert key-value settings into SETTINGS table."""
    cursor = conn.cursor()
    for key, value in settings_dict.items():
        val_str = str(value)
        cursor.execute(
            "INSERT INTO SETTINGS (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (key, val_str),
        )
    conn.commit()
    return get_all_settings(conn)

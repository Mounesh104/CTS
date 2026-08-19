"""
app/db/init_db.py
-----------------
Reads schema.sql and executes it against the configured SQLite database.
Run once on startup (called from app/main.py lifespan) or manually:

    python -m app.db.init_db
"""

import sqlite3
import os
from pathlib import Path
from app.core.config import settings


def init_db(db_path: str | None = None) -> None:
    """
    Execute schema.sql against the SQLite file at db_path.
    Creates the file if it does not exist.
    """
    target = db_path or settings.database_url
    schema_path = Path(__file__).parent / "schema.sql"

    sql = schema_path.read_text(encoding="utf-8")

    conn = sqlite3.connect(target)
    try:
        conn.executescript(sql)
        conn.commit()
        print(f"[init_db] Schema applied to '{target}'")
    finally:
        conn.close()


if __name__ == "__main__":
    init_db()

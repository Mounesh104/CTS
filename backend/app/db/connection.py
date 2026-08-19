"""
app/db/connection.py
--------------------
FastAPI dependency that opens a sqlite3.Connection per request,
sets PRAGMA foreign_keys = ON and row_factory = sqlite3.Row,
then closes it in a finally block.
"""

import sqlite3
from typing import Generator
from app.core.config import settings


def get_db() -> Generator[sqlite3.Connection, None, None]:
    """
    Yield a sqlite3 connection for the duration of one HTTP request.
    Always closes the connection after the request, even on error.
    """
    conn = sqlite3.connect(settings.database_url, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
    finally:
        conn.close()

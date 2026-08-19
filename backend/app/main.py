"""
app/main.py
-----------
FastAPI application entry point.
- Runs schema init on startup
- Mounts all routers
- Configures CORS
- Exposes /health
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.init_db import init_db
from app.routers import (
    patients, claims, support_events, insurance,
    features, risk, actions, dashboard,
    outcomes, monitoring, therapy_outcomes, settings as settings_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the DB schema on startup."""
    init_db()
    yield


app = FastAPI(
    title="PAPRS API",
    description=(
        "Patient Adherence & Persistency Risk Scoring — Backend API.\n\n"
        "Stores and serves data across the full PAPRS pipeline:\n"
        "Data Ingestion → Feature Engineering → Risk Scoring → "
        "Action Mapping → Dashboard → Outcome Logging → Monitoring & Retraining.\n\n"
        "**Risk scores, SHAP explanations, and survival estimates are computed by the "
        "external ML pipeline and stored here via POST endpoints.**"
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"], summary="Health check — returns DB connectivity status")
def health_check():
    import sqlite3
    try:
        conn = sqlite3.connect(settings.database_url)
        conn.execute("SELECT 1")
        conn.close()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"
    return {"status": "healthy", "db": db_status, "version": "1.0.0"}


# ---------------------------------------------------------------------------
# Routers — one per pipeline stage
# ---------------------------------------------------------------------------
app.include_router(patients.router)           # /patients
app.include_router(claims.router)             # /claims
app.include_router(support_events.router)     # /support-events
app.include_router(insurance.router)          # /insurance
app.include_router(therapy_outcomes.router)   # /therapy-outcomes
app.include_router(features.router)           # /features
app.include_router(risk.router)               # /risk
app.include_router(actions.router)            # /actions
app.include_router(dashboard.router)          # /dashboard
app.include_router(outcomes.router)           # /outcomes
app.include_router(monitoring.router)         # /monitoring
app.include_router(settings_router.router)    # /settings

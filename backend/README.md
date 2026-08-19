# PAPRS Backend

**Patient Adherence & Persistency Risk Scoring — FastAPI + SQLite3 Backend**

---

## Architecture

This backend is a **data storage and API serving layer**. It does not run any ML models.

```
External ML Pipeline                    PAPRS Backend                  Frontend (React)
─────────────────────                   ─────────────────              ────────────────
Feature Engineering  ──POST /features──▶  ML_FEATURES table
XGBoost Classifier   ──POST /risk/scores─▶ RISK_SCORE table   ──GET /dashboard/summary──▶
Cox PH Survival      ──POST /risk/scores─▶ RISK_SCORE table   ──GET /patients/{id}/full-profile──▶
SHAP Explainability  ──POST /risk/scores─▶ RISK_SCORE table   ──GET /actions/{id}──▶
ML Monitoring        ──POST /monitoring──▶ MODEL_METRICS table
```

The backend owns one piece of business logic: **risk-to-action mapping** (reading the `ACTION_RULES` table and returning a recommended action for a given patient's risk band).

---

## Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app entry point
│   ├── core/config.py           # pydantic-settings config
│   ├── db/
│   │   ├── schema.sql           # All DDL (10 tables + indexes)
│   │   ├── connection.py        # get_db() dependency
│   │   └── init_db.py           # Schema initializer
│   ├── schemas/                 # Pydantic v2 request/response models
│   ├── routers/                 # One router per pipeline stage
│   ├── services/
│   │   └── action_mapping.py   # Risk-band → action lookup
│   ├── crud/                    # Raw-SQL data access
│   └── seed/
│       └── generate_seed_data.py
├── tests/
│   ├── conftest.py
│   ├── test_patients.py
│   ├── test_risk.py
│   └── test_actions.py
├── requirements.txt
├── .env.example
└── README.md
```

---

## Setup & Run

### 1. Prerequisites

- Python 3.11+
- pip

### 2. Install dependencies

```bash
cd x:\cts\CTS\backend
pip install -r requirements.txt
```

### 3. Configure environment

```bash
copy .env.example .env
# Edit .env if needed (DATABASE_URL, CORS_ORIGINS)
```

### 4. Seed the database

Generates 200 patients with correlated pharmacy claims, support events, insurance, ML features, therapy outcomes, risk scores, action rules, and model metrics:

```bash
cd x:\cts\CTS\backend
python -m app.seed.generate_seed_data
```

### 5. Start the server

```bash
cd x:\cts\CTS\backend
uvicorn app.main:app --reload --port 8000
```

The API will be available at: **http://localhost:8000**

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Health check:** http://localhost:8000/health

---

## API Overview

| Pipeline Stage | Router | Prefix | Description |
|---|---|---|---|
| Data Ingestion | `patients.py` | `/patients` | Full CRUD + bulk + full-profile |
| Data Ingestion | `claims.py` | `/claims` | Pharmacy claims CRUD + bulk |
| Data Ingestion | `support_events.py` | `/support-events` | Support events CRUD + bulk |
| Data Ingestion | `insurance.py` | `/insurance` | Insurance records CRUD + bulk |
| Data Ingestion | `therapy_outcomes.py` | `/therapy-outcomes` | Therapy outcomes CRUD + bulk |
| Feature Engineering | `features.py` | `/features` | Store/retrieve ML feature records |
| Risk Scoring | `risk.py` | `/risk` | Store/retrieve ML risk scores + history |
| Action Mapping | `actions.py` | `/actions` | Patient action lookup + rules CRUD |
| Dashboard | `dashboard.py` | `/dashboard` | Aggregate summary + per-patient payload |
| Outcome Logging | `outcomes.py` | `/outcomes` | Log interventions + history + summary |
| Monitoring | `monitoring.py` | `/monitoring` | Store/serve model performance metrics |

### Key endpoints

```
GET  /health                               Health check
GET  /patients/{id}/full-profile          Frontend-compatible full patient object
POST /risk/scores                          ML pipeline pushes risk scores here
GET  /risk/{patient_id}                    Latest risk score for a patient
GET  /risk/{patient_id}/history            Historical scores for trend charts
GET  /actions/{patient_id}                 Recommended action for a patient
GET  /actions/rules                        List configurable action rules
PUT  /actions/rules                        Replace all action rules
GET  /dashboard/summary                    Aggregate dashboard data
POST /outcomes                             Log an intervention outcome
POST /monitoring/evaluate                  ML pipeline posts evaluation results
POST /monitoring/retrain                   ML pipeline logs retraining event
```

---

## Database Schema

10 tables in `app/db/schema.sql`:

| Table | Role |
|---|---|
| `PATIENT` | Primary entity — demographics and clinical data |
| `PHARMACY_CLAIM` | Refill history (Data Sources) |
| `SUPPORT_EVENT` | Support interactions (Data Sources) |
| `INSURANCE` | Coverage and copay data (Data Sources) |
| `ML_FEATURES` | Engineered features written by ML pipeline |
| `THERAPY_OUTCOME` | Labeled outcomes written by ML pipeline |
| `RISK_SCORE` | Risk scores + SHAP outputs from ML pipeline |
| `ACTION_RULES` | Configurable risk-to-action mapping |
| `OUTCOME_LOG` | Intervention outcomes logged by care managers |
| `MODEL_METRICS` | Performance metrics from ML monitoring pipeline |

All FK relationships use `ON DELETE CASCADE` from `PATIENT`. Foreign keys enabled per-connection with `PRAGMA foreign_keys = ON`.

---

## Running Tests

```bash
cd x:\cts\CTS\backend
python -m pytest tests/ -v
```

Tests use an **in-memory SQLite database** via FastAPI dependency override — no file I/O, fully isolated per test.

Test coverage:
- `test_patients.py` — Full CRUD, pagination, filtering, bulk insert, full-profile join
- `test_risk.py` — Store risk scores, get latest, history pagination, bulk, validation
- `test_actions.py` — High/Medium/Low action lookup, rules list/replace, dynamic rule changes

---

## Frontend Integration

The frontend at `x:\cts\CTS\src` currently uses mock data. To integrate:

1. Set `CORS_ORIGINS=http://localhost:5173` in `.env`
2. Start the backend: `uvicorn app.main:app --reload`
3. Replace `mockPatients` imports in the frontend with `fetch()` calls to this API
4. The `/patients/{id}/full-profile` response shape matches the frontend's mock patient object exactly

The 20 patients from the frontend mock (`P1024`, `P1087`, ..., `P1800`) are included in the seed data with matching `risk_score`, `risk_level`, `adherence`, `refill_gap_days`, and `recommended_action` values.

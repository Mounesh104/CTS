# PAPRS — Patient Adherence & Persistency Risk Scoring

Clinical decision-support dashboard for care managers: risk-scored patient
population, adherence tracking, cohort analysis, and intervention workflows.

- **Frontend**: React 19 + Vite + Tailwind (`src/`)
- **Backend**: FastAPI + SQLite (`backend/`)
- **ML**: XGBoost classifier + Cox PH survival model (`backend/app/ml/`)

---

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+ and pip

---

## 1. Backend setup & run

```bash
cd backend

# One-time setup
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt   # Windows
# source .venv/bin/activate && pip install -r requirements.txt  # macOS/Linux

# Configure environment
copy .env.example .env
# Edit .env if needed (DATABASE_URL, CORS_ORIGINS)
```

### Load the patient dataset

The database is seeded from one of two generators — run **one** of these
before starting the server for the first time (both wipe and rebuild the DB):

```bash
# Option A — 2,573 fully synthetic patients (current default dataset)
python -m app.seed.generate_synthetic_patients

# Option B — import a real ML-features CSV (100K+ patients)
python -m app.seed.import_ml_features_csv "<path-to-csv>"
```

> **Option B leaves risk scores empty** — that importer only loads patient
> demographics + features, so `RISK_SCORE` stays empty and every risk KPI
> on the dashboard shows 0 until you also run one of the scoring steps in
> [§4 ML pipeline](#4-ml-pipeline-optional) below. It also writes only the
> old 2-tier settings keys, not the `critical_risk_threshold` /
> `moderate_risk_threshold` the current 4-tier UI expects — re-run Option A
> afterward if you need those restored.

### Start the API server

```bash
python -m uvicorn app.main:app --port 8000
```

- API: **http://localhost:8000**
- Swagger UI: **http://localhost:8000/docs**
- Health check: **http://localhost:8000/health**

> **Note:** `--reload` has repeatedly hung on Windows once the ML packages
> (xgboost/pandas/sklearn) are loaded in-process — the file watcher stops
> picking up changes without erroring. Run without `--reload` and restart
> manually after backend code changes.

---

## 2. Frontend setup & run

```bash
npm install
npm run dev
```

- App: **http://localhost:5173**

The frontend reads `VITE_API_BASE_URL` (defaults to `http://localhost:8000`)
— see `src/services/api.js`. No `.env` needed for local development against
the default backend port.

---

## 3. Log in

Any syntactically valid email + password (6+ chars) works — auth is a local
mock, not checked against a backend. On the login screen, use **"Quick Demo
Sign In"** to autofill, then on the two-factor screen use **"Fill Demo OTP
(123456)"**.

---

## 4. ML pipeline (optional)

These populate real trained-model risk scores instead of the default
rule-based ones. Run from `backend/`, after the dataset is loaded:

```bash
# Train the XGBoost classifier (saves app/ml/artifacts/, scores all patients)
python -m app.ml.train_risk_model "<path-to-ml-features-csv>"

# Train the Cox PH survival model (saves app/ml/model_output/)
python -m app.ml.train_survival_model
```

> Do **not** run `python -m app.ml.survival_model` directly to produce the
> production artifact — running it as `__main__` pickles the model class
> under the wrong module path and breaks `joblib.load()` from the API
> server. Use `train_survival_model.py`.

Once trained, the **"Run Prediction"** button on any patient's profile page
runs both models live for that patient and persists the result
(`POST /risk/{patient_id}/predict`).

See `backend/app/ml/work.md` for the full pipeline write-up.

---

## Project structure

```
CTS/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── core/                # config, risk-band thresholds
│   │   ├── db/                  # schema.sql, connection, init
│   │   ├── routers/             # one router per resource
│   │   ├── schemas/             # Pydantic models
│   │   ├── crud/                # raw-SQL data access
│   │   ├── seed/                # dataset generators/importers
│   │   └── ml/                  # XGBoost + Cox PH training & inference
│   ├── requirements.txt
│   └── paprs.db                 # SQLite database (generated)
├── src/
│   ├── pages/                   # Dashboard, Patients, PatientProfile, ...
│   ├── components/
│   ├── services/api.js          # backend API client
│   └── data/mockPatients.js     # offline fallback if backend unreachable
└── package.json
```

## Key API endpoints

| Endpoint | Purpose |
|---|---|
| `GET /dashboard/kpis` | Top-line KPI numbers |
| `GET /dashboard/risk-distribution` | Patient counts per risk band |
| `GET /dashboard/adherence-trend` | Cohort adherence trend (months) |
| `GET /dashboard/cohorts` | Age group / risk category / adherence band breakdown |
| `GET /dashboard/high-risk-patients?page=&page_size=` | Paginated highest-risk patients |
| `GET /patients?page=&page_size=` | Paginated patient list |
| `GET /patients/{id}/full-profile` | Full joined patient record |
| `POST /risk/{id}/predict` | Run live XGBoost + Cox PH prediction for one patient |

Full interactive reference at `http://localhost:8000/docs` once the backend
is running.

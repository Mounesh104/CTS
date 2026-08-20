# PAPRS ML Pipeline — Workflow

How the 100K-patient dataset became a working risk-scoring system: two real
trained models (a classifier and a survival model), combined, wired into the
backend, and exposed to the frontend.

## 1. Data

- **Source**: `ml_features_100k.csv` — 500,000 rows = 100,000 patients × ~5
  time-stamped snapshots each. Demographic fields (age, gender, BMI, smoking,
  comorbidities, ...) plus ~50 engineered adherence/refill/support features,
  and a label column `NON_PERSISTENT_NEXT_60D`.
- **Imported into SQLite** (`backend/paprs.db`) via
  `app/seed/import_ml_features_csv.py`:
  - Static demographic fields → `PATIENT` table (one row per patient).
  - All per-snapshot features → `ML_FEATURES` table (one row per snapshot;
    schema extended from 10 to 53 columns to keep every original CSV column,
    not just a subset).
  - A composite index `(patient_id, prediction_date)` was added after an
    initial version of the "latest snapshot per patient" dashboard query hit
    a bad SQLite query plan and hung at 100K scale — fixed and documented in
    `schema.sql`.

## 2. Model 1 — XGBoost classifier (`train_risk_model.py`)

**What it predicts**: probability of `NON_PERSISTENT_NEXT_60D` (will this
patient likely go non-persistent with therapy in the next 60 days).

- Trains on all 500K snapshot rows (each snapshot is an independent labeled
  sample), 80/20 stratified split, one-hot encoded demographics (73 features
  total).
- **Result**: Test AUC 0.687, accuracy 80.1%.
- **Explainability**: uses XGBoost's native TreeSHAP (`pred_contribs=True`)
  instead of the separate `shap` package — much faster at this row count and
  no extra heavy dependency. Per-patient top risk factors are the
  highest-magnitude positive SHAP contributions, expressed as a share of
  total positive contribution (so they read like the original mock data's
  `{factor, contribution}` shape).
- **Artifacts saved** (were *not* being saved before — this was a real gap,
  fixed):
  - `app/ml/artifacts/xgboost_risk_model.json` — the trained booster.
  - `app/ml/artifacts/model_metadata.json` — feature list, AUC, accuracy,
    train/test row counts, source CSV path, training date.
- **Re-run**: `python -m app.ml.train_risk_model "<path-to-csv>"`
  (from `backend/`).

## 3. Model 2 — Cox PH survival model (`survival_model.py` / `train_survival_model.py`)

This file already existed in the repo — a stratified Cox Proportional
Hazards model with isotonic calibration per horizon, cross-validated
penalizer selection, PH-assumption checking, subgroup validation, and a
production wrapper class (`PersistencySurvivalModel`). It has a built-in
fallback data loader (`build_dataset()`) that synthesizes survival targets
(`REMAINING_DAYS`, `EVENT_OBSERVED`) directly from `ml_features_100k.csv`
when its preferred richer dataset isn't present — which is our exact
situation, so it runs against the same CSV as the classifier.

**What it predicts**: a full survival curve — probability of remaining
persistent at 30/60/90/180 days — and `estimated_days_remaining`, computed
as the true integral `E[T] = ∫ S(t) dt`, not a guessed formula.

- 14 engineered features (PDC, refill gaps/trends, support engagement,
  health literacy, forgetfulness, regimen complexity, financial burden,
  synthesized monthly income), stratified by patient support-responsiveness.
- 5-fold CV over 5 penalizer values, then final fit + horizon-specific
  isotonic calibrators (14/30/45/60/90/180/365 days).
- **Result**: Test Global C-index 0.6409 (subgroup C-index 0.63–0.65 across
  age/income groups — consistent, no major fairness gaps found). Calibrated
  Brier scores at 14/30/45 days all "GOOD" (< 0.15).
- Some proportional-hazards violations were flagged for `AVG_REFILL_GAP`,
  `REFILL_GAP_TREND`, `FORGETFULNESS_PROPENSITY` on this dataset (the
  original file's "zero violations" claim was against a different, richer
  dataset it was designed for) — noted, not fixed, since it doesn't block
  the calibrated output from being usable.
- **Artifact saved**: `app/ml/model_output/persistency_survival_model.joblib`.
- **Re-run**: `python -m app.ml.train_survival_model` (from `backend/`).
  - **Do not** run `python -m app.ml.survival_model` directly to produce the
    artifact used in production — that runs the file as `__main__`, which
    pickles the class under the wrong module path and breaks
    `joblib.load()` from any other process (this bit us once; the fix was
    writing this thin entry-point wrapper that imports the module normally).

## 4. Combining the two models (`predictor.py`)

Single-patient, on-demand inference — this is the actual "combining" step:

1. Look up the patient's latest `ML_FEATURES` row. No row → no prediction
   (real feature history is required; this is enforced, not glossed over).
2. Reconstruct the model's expected feature vector directly from DB columns.
   DB columns are the lowercased original CSV column names by design, so
   `.upper()` on each column name exactly reproduces the training-time
   feature name — no separate mapping table needed.
3. Run the XGBoost booster → probability → `risk_score` (0–100),
   `risk_band` (via the app's configurable High/Medium/Low thresholds), and
   TreeSHAP `top_risk_factors`.
4. Run the Cox PH survival model (if its artifact is present) on the same
   patient's raw features → `estimated_days_remaining`. This **replaces**
   the earlier placeholder heuristic (`180 × (1 − probability)`) with a real
   survival-model output. If the survival artifact is missing, it falls
   back to the heuristic rather than failing the request.
5. Result is upserted into `RISK_SCORE` (one canonical row per patient,
   `score_id = "RS-{patient_id}"`), tagged
   `model_version = "xgboost-v1+coxph-v1"` when both models contributed, or
   `"xgboost-v1"` if the survival model wasn't available.

## 5. API + Frontend

- `POST /risk/{patient_id}/predict` — runs the above, persists the result.
  404 if the patient doesn't exist, 422 if they have no ML feature history,
  503 if the XGBoost artifact itself is missing.
- Frontend: "Run Prediction" button on the patient profile's Risk Overview
  card (`src/pages/PatientProfile.jsx`), calls `runPrediction()` in
  `src/services/api.js`. Shows `"Failed to generate prediction. Please try
  again."` on any failure, per spec.

## 6. What's real vs. still approximate

| Thing | Status |
|---|---|
| 100K patients, 500K feature snapshots | Real, from your CSV |
| XGBoost risk_score / risk_band / SHAP top factors | Real, trained model, AUC 0.687 |
| Cox PH survival curve / estimated_days_remaining (on-demand, per-patient) | Real, trained model, C-index 0.64 |
| Bulk `RISK_SCORE` table (100K rows, precomputed at import time) | `estimated_time_to_discontinuation` there is still the old heuristic — **not yet backfilled** with the Cox model. Only patients that have been through "Run Prediction" on-demand have the real survival estimate. |
| `copay_level`, insurance, support-event history, `recentActivity` | Placeholder/empty — not in the source CSV |
| Demographics: `state`, `income_range`, `education_level` | `null` — not in the source CSV |
| `ACTION_RULES` (risk band → recommended action) | Carried over from the original synthetic seed, not derived from this data |

The bulk backfill (re-running the Cox model over all 100K patients rather
than only on-demand) was intentionally left out of this pass — the Cox
model's per-row `.predict()` call is not vectorized, and 100K sequential
calls would take a while; doing it as a batch job is a reasonable next step
if the dashboard-level average `estimated_time_to_discontinuation` needs to
reflect the real model too, not just individual on-demand lookups.

## 7. Commands reference

```bash
cd backend

# One-time setup
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt

# Import the raw dataset (wipes and reloads PATIENT + ML_FEATURES)
python -m app.seed.import_ml_features_csv "<path-to-csv>"

# Train / retrain the classifier (also scores all patients + saves MODEL_METRICS)
python -m app.ml.train_risk_model "<path-to-csv>"

# Train / retrain the survival model
python -m app.ml.train_survival_model

# Run the API
python -m uvicorn app.main:app --port 8000
# NOTE: --reload has repeatedly hung on this machine once the ML packages
# are loaded in-process (Windows WatchFiles issue). Restart manually after
# backend code changes instead of relying on it.
```

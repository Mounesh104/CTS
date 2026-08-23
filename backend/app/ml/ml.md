# PAPRS ML Model — Explanation

This document explains the machine learning system behind patient risk scoring in
`app/ml/`. There are two trained models working together, plus a small on-demand
inference layer that combines them.

## Overview

| | Model 1: Risk Classifier | Model 2: Survival Model |
|---|---|---|
| File | `train_risk_model.py` | `survival_model.py` / `train_survival_model.py` |
| Type | XGBoost binary classifier | Stratified Cox Proportional Hazards |
| Predicts | P(non-persistent with therapy in next 60 days) | Full survival curve → estimated days remaining on therapy |
| Output fields | `risk_score`, `risk_band`, `top_risk_factors` | `estimated_time_to_discontinuation` |
| Artifact | `artifacts/xgboost_risk_model.json` | `model_output/persistency_survival_model.joblib` |
| Result | Test AUC **0.687**, Accuracy **80.1%** | Test C-index **0.64** |

Both are trained from the same source dataset: `ml_features_100k.csv`
(500,000 rows = 100,000 patients × ~5 time-stamped snapshots each), imported
into SQLite via `app/seed/import_ml_features_csv.py`.

---

## Model 1 — XGBoost Risk Classifier

**Goal**: predict `NON_PERSISTENT_NEXT_60D` — will this patient likely stop
taking their medication as prescribed within the next 60 days.

### Training (`train_risk_model.py`)

1. Loads all 500K snapshot rows, treats each snapshot as an independent
   labeled training example.
2. Builds a feature matrix: drops ID columns and the label, one-hot encodes
   categorical fields (gender, smoking status, alcohol use, physical
   activity) → **73 features** total.
3. 80/20 stratified train/test split (`random_state=42`).
4. Trains a binary logistic XGBoost model:
   - `max_depth=5`, `eta=0.1`, `subsample=0.8`, `colsample_bytree=0.8`
   - Up to 200 boosting rounds with early stopping (20 rounds patience)
   - Best iteration selected: **60**
5. Saves the booster and metadata (feature names, AUC, accuracy, row
   counts) to `artifacts/`.
6. Scores every patient's *latest* snapshot and writes results into the
   `RISK_SCORE` table (replacing the old rule-based placeholder), plus logs
   evaluation metrics to `MODEL_METRICS`.

### Explainability

Uses XGBoost's native **TreeSHAP** (`pred_contribs=True`) rather than the
separate `shap` package — faster at this scale and avoids an extra heavy
dependency. For each patient, the top 4 features with the highest positive
SHAP contribution are surfaced as `top_risk_factors`, expressed as a share
of total positive contribution (e.g. `{"factor": "Missed Refill Rate",
"contribution": 0.34}`).

### Risk score & band

- `risk_score` = predicted probability × 100 (0–100 scale).
- `risk_band` (Low / Moderate / High / Critical) is derived from
  configurable thresholds (`app/core/risk_bands.py`), not hardcoded.

---

## Model 2 — Cox Proportional Hazards Survival Model

**Goal**: predict the *timing* of therapy discontinuation, not just whether
it happens — a full survival curve (probability of remaining persistent at
30/60/90/180 days) and a single summary number,
`estimated_days_remaining = ∫ S(t) dt` (the true expected value integral,
not a guessed formula).

### Why a second model

The source CSV has no real survival/discontinuation-date data — only the
binary 60-day label. `survival_model.py` (pre-existing in the repo) has a
built-in fallback loader (`build_dataset()`) that synthesizes survival
targets (`REMAINING_DAYS`, `EVENT_OBSERVED`) directly from
`ml_features_100k.csv` when its preferred richer dataset isn't available —
which is the case here.

### Training (`train_survival_model.py`)

- 14 engineered features: PDC, refill gaps/trends, support engagement,
  health literacy, forgetfulness propensity, regimen complexity, financial
  burden, synthesized monthly income — stratified by patient
  support-responsiveness.
- 5-fold cross-validation over 5 penalizer values to select regularization
  strength, then a final fit.
- Horizon-specific isotonic calibration at 14/30/45/60/90/180/365 days.
- Checks the proportional-hazards assumption and validates C-index across
  age/income subgroups (0.63–0.65 across groups — no major fairness gaps).
  Some PH violations were flagged for `AVG_REFILL_GAP`, `REFILL_GAP_TREND`,
  and `FORGETFULNESS_PROPENSITY` on this dataset — noted but not blocking,
  since calibrated output is still usable.
- Calibrated Brier scores at 14/30/45 days are all "GOOD" (< 0.15).

**Important**: retrain via `python -m app.ml.train_survival_model`, not by
running `survival_model.py` directly — running it as `__main__` pickles the
class under the wrong module path and breaks `joblib.load()` from any other
process.

---

## Combining the two models (`predictor.py`)

Single-patient, on-demand inference (`predict_for_patient`):

1. Look up the patient's **latest** `ML_FEATURES` row. If none exists, no
   prediction is made — a real feature history is required.
2. Reconstruct the model's expected feature vector directly from DB
   columns. DB columns are lowercased versions of the original CSV column
   names by design, so `.upper()` on each reproduces the exact
   training-time feature name (no separate mapping table needed).
3. Run the XGBoost booster → probability → `risk_score`, `risk_band`
   (via configurable thresholds), and TreeSHAP `top_risk_factors`.
4. Run the Cox PH survival model (if its artifact is present) on the same
   patient's raw features → `estimated_days_remaining`. This **replaces**
   the earlier placeholder heuristic (`180 × (1 − probability)`). If the
   survival artifact is missing, it falls back to that heuristic instead of
   failing the request.
5. Result is upserted into `RISK_SCORE` (`score_id = "RS-{patient_id}"`),
   tagged `model_version = "xgboost-v1+coxph-v1"` when both models
   contributed, or `"xgboost-v1"` alone if the survival model wasn't
   available.

## API / Frontend

- `POST /risk/{patient_id}/predict` runs the above and persists the result.
  Returns 404 if the patient doesn't exist, 422 if they have no ML feature
  history, 503 if the XGBoost artifact is missing.
- Frontend: "Run Prediction" button on the patient profile's Risk Overview
  card (`src/pages/PatientProfile.jsx`) via `runPrediction()` in
  `src/services/api.js`.

## Known limitations

- The bulk `RISK_SCORE` table (precomputed for all 100K patients at import
  time) still uses the old heuristic for `estimated_time_to_discontinuation`
  — it has **not** been backfilled with the real Cox model output. Only
  patients scored via on-demand "Run Prediction" get the real survival
  estimate, because the Cox model's `.predict()` isn't vectorized and a
  100K-row sequential backfill would be slow (a reasonable follow-up batch
  job).
- `copay_level`, insurance/support-event history, and `recentActivity` are
  placeholder/empty — not present in the source CSV.
- `state`, `income_range`, `education_level` are `null` for the same reason.
- `ACTION_RULES` (risk band → recommended action) are carried over from the
  original synthetic seed, not derived from this dataset.

## Commands

```bash
cd backend

# Train / retrain the classifier (also scores all patients + saves MODEL_METRICS)
python -m app.ml.train_risk_model "<path-to-csv>"

# Train / retrain the survival model
python -m app.ml.train_survival_model
```

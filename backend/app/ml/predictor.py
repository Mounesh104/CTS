"""
app/ml/predictor.py
---------------------
On-demand single-patient inference using the saved XGBoost model
(app/ml/artifacts/xgboost_risk_model.json). Loads the model + feature
schema once per process and reuses it across requests.

Only works for patients that have at least one ML_FEATURES row -- there is
no feature history to build a prediction from otherwise.
"""

import json
from datetime import date
from pathlib import Path

import numpy as np
import xgboost as xgb

from app.crud import patient as crud_patient
from app.crud import ml_features as crud_features
from app.crud import settings as crud_settings
from app.ml.train_risk_model import top_positive_factors
from app.core.risk_bands import band_for_score, get_thresholds
from app.ml.survival_model import PersistencySurvivalModel

ARTIFACT_DIR = Path(__file__).parent / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "xgboost_risk_model.json"
METADATA_PATH = ARTIFACT_DIR / "model_metadata.json"
SURVIVAL_MODEL_PATH = Path(__file__).parent / "model_output" / "persistency_survival_model.joblib"

CATEGORICAL_COLUMNS = ["GENDER", "SMOKING_STATUS", "ALCOHOL_USE", "PHYSICAL_ACTIVITY"]
EXCLUDE_PATIENT_COLS = {"patient_id", "diagnosis"}
EXCLUDE_FEATURE_COLS = {"feature_id", "patient_id", "prediction_date", "non_persistent_next_60d"}

_booster = None
_feature_names = None
_survival_model = None
_survival_model_load_attempted = False


class ModelNotAvailable(Exception):
    pass


def _load_model():
    global _booster, _feature_names
    if _booster is None:
        if not MODEL_PATH.exists() or not METADATA_PATH.exists():
            raise ModelNotAvailable(
                f"Trained model not found at {MODEL_PATH}. Run `python -m app.ml.train_risk_model <csv>` first."
            )
        booster = xgb.Booster()
        booster.load_model(str(MODEL_PATH))
        metadata = json.loads(METADATA_PATH.read_text())
        _booster = booster
        _feature_names = metadata["feature_names"]
    return _booster, _feature_names


def _load_survival_model():
    """Lazily loads the Cox PH survival model. Returns None if unavailable
    (survival estimate then falls back to the probability-based heuristic)."""
    global _survival_model, _survival_model_load_attempted
    if not _survival_model_load_attempted:
        _survival_model_load_attempted = True
        if SURVIVAL_MODEL_PATH.exists():
            _survival_model = PersistencySurvivalModel.load(str(SURVIVAL_MODEL_PATH))
    return _survival_model


def _build_survival_features(patient: dict, features: dict) -> dict:
    """Maps DB fields to the raw feature names survival_model.py expects
    (same derivations as its build_dataset() data2_file branch)."""
    pdc = features.get("pdc_all_history")
    if pdc is None:
        pdc = features.get("pdc_90d")
    health_literacy = patient.get("health_literacy_score") or 0.5
    avg_financial_burden = features.get("avg_financial_burden") or 0.0
    return {
        "PDC": max(0.0, min(pdc if pdc is not None else 0.75, 1.0)),
        "MISSED_REFILL_RATE": features.get("missed_refill_rate") or 0.0,
        "THERAPY_DURATION_SO_FAR": max((patient.get("disease_duration") or 0.0) * 365, 30),
        "AVG_REFILL_GAP": features.get("avg_refill_gap") or 0.0,
        "MAX_REFILL_GAP": features.get("max_refill_gap") or 0.0,
        "REFILL_GAP_TREND": features.get("avg_refill_gap_trend") or 0.0,
        "AVG_FINANCIAL_BURDEN": avg_financial_burden,
        "SUPPORT_CONTACT_COUNT": features.get("support_contact_count") or 0,
        "REFILL_REMINDER_COUNT": features.get("refill_reminder_count") or 0,
        "FINANCIAL_ASSIST_COUNT": features.get("financial_assistance_count") or 0,
        "PATIENT_RESPONSE_RATE": features.get("patient_response_rate") or 0.0,
        "HEALTH_LITERACY_SCORE": health_literacy,
        "FORGETFULNESS_PROPENSITY": patient.get("forgetfulness_propensity") or 0.5,
        "REGIMEN_COMPLEXITY_SCORE": features.get("regimen_complexity_score") or 1.0,
        "MEDICATION_COUNT": features.get("medication_count") or 1,
        "COMORBIDITY_COUNT": patient.get("comorbidity_count") or 0,
        "MONTHLY_INCOME_INR": 50000.0 + (health_literacy * 30000.0) - (avg_financial_burden * 100000.0),
    }


def _build_feature_vector(patient: dict, features: dict, feature_names: list) -> np.ndarray:
    # DB column names are the lowercased original CSV column names, so
    # uppercasing them reproduces the exact training-time column names.
    raw = {}
    for col, val in patient.items():
        if col in EXCLUDE_PATIENT_COLS:
            continue
        raw[col.upper()] = val
    for col, val in features.items():
        if col in EXCLUDE_FEATURE_COLS:
            continue
        raw[col.upper()] = val

    vector = []
    for name in feature_names:
        value = None
        for cat in CATEGORICAL_COLUMNS:
            prefix = cat + "_"
            if name.startswith(prefix):
                category_value = name[len(prefix):]
                value = 1.0 if raw.get(cat) == category_value else 0.0
                break
        if value is None:
            raw_val = raw.get(name)
            value = float(raw_val) if raw_val is not None else np.nan
        vector.append(value)
    return np.array(vector, dtype=np.float32)


def predict_for_patient(db, patient_id: str) -> dict | None:
    """Returns a RISK_SCORE-shaped dict, or None if the patient has no ML feature history."""
    patient = crud_patient.get_patient_by_id(db, patient_id)
    features = crud_features.get_latest_features_by_patient(db, patient_id)
    if not patient or not features:
        return None

    booster, feature_names = _load_model()
    vector = _build_feature_vector(patient, features, feature_names).reshape(1, -1)

    dmat = xgb.DMatrix(vector, feature_names=feature_names)
    prob = float(booster.predict(dmat)[0])
    contribs = booster.predict(dmat, pred_contribs=True)[0, :-1]

    settings_dict = crud_settings.get_all_settings(db)
    thresholds = get_thresholds(settings_dict)

    score = round(prob * 100, 1)
    band = band_for_score(score, thresholds)
    top_risk_factors = top_positive_factors(contribs, feature_names)

    # Prefer the real Cox PH survival model for the time-to-event estimate;
    # fall back to the probability-based heuristic if it isn't available.
    survival_model = _load_survival_model()
    model_version = "xgboost-v1"
    if survival_model is not None:
        try:
            survival_result = survival_model.predict(_build_survival_features(patient, features))
            estimated_time_to_discontinuation = survival_result["estimated_days_remaining"]
            model_version = "xgboost-v1+coxph-v1"
        except Exception:
            estimated_time_to_discontinuation = round(max(7.0, 180.0 * (1 - prob)), 1)
    else:
        estimated_time_to_discontinuation = round(max(7.0, 180.0 * (1 - prob)), 1)

    return {
        "score_id": f"RS-{patient_id}",
        "patient_id": patient_id,
        "score_date": str(date.today()),
        "risk_score": score,
        "risk_band": band,
        "top_risk_factors": top_risk_factors,
        "estimated_time_to_discontinuation": estimated_time_to_discontinuation,
        "model_version": model_version,
    }

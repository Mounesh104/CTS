"""
app/seed/import_ml_features_csv.py
-----------------------------------
Bulk-imports a large ML-features CSV (patient demographics + engineered
features, one row per patient per prediction_date) into PATIENT and
ML_FEATURES. Wipes all existing patient-scoped data first, then reseeds
the non-patient config tables (ACTION_RULES, MODEL_METRICS, SETTINGS).

Run from backend/ directory:
    python -m app.seed.import_ml_features_csv "C:\\CTS2.0\\ml_features_100k.csv"
"""

import csv
import sqlite3
import sys
from pathlib import Path

from app.core.config import settings
from app.db.init_db import init_db
from app.seed.generate_seed_data import seed_action_rules, seed_model_metrics, seed_settings

BATCH_SIZE = 5000

PATIENT_COLUMNS = [
    "patient_id", "age", "gender", "bmi", "smoking_status", "alcohol_use",
    "physical_activity", "health_literacy_score", "comorbidity_count",
    "diabetes_flag", "disease_duration", "diagnosis_age",
    "forgetfulness_propensity", "baseline_bp_control", "diagnosis",
]

FEATURE_COLUMNS = [
    "feature_id", "patient_id", "prediction_date",
    "perceived_treatment_benefit", "total_refills", "missed_refills",
    "missed_refill_rate", "avg_refill_gap", "max_refill_gap",
    "pdc_30d", "pdc_60d", "pdc_90d", "pdc_all_history",
    "avg_financial_burden",
    "missed_refill_rate_recent_30d", "missed_refill_rate_previous_30d", "missed_refill_rate_change_30d",
    "avg_refill_gap_recent_30d", "avg_refill_gap_previous_30d", "avg_refill_gap_change_30d",
    "pdc_recent_30d", "pdc_previous_30d", "pdc_change_30d",
    "pdc_trend", "missed_refill_rate_trend", "avg_refill_gap_trend", "refill_frequency_trend",
    "days_since_last_refill", "days_since_last_missed_refill",
    "days_since_last_support", "days_since_last_prescription",
    "medication_count", "unique_drug_classes", "twice_daily_drug_count",
    "regimen_complexity_score", "treatment_change_count", "days_since_treatment_change",
    "medication_count_recent_30d", "medication_count_change",
    "drug_class_count_recent_30d", "drug_class_count_change",
    "regimen_complexity_recent_30d", "regimen_complexity_change", "medication_added_count",
    "support_contact_count", "support_contact_count_recent_30d", "support_contact_count_previous_30d",
    "support_contact_change",
    "patient_response_rate", "response_rate_recent_30d", "response_rate_previous_30d", "response_rate_change",
    "side_effect_reported_count", "financial_assistance_count", "refill_reminder_count",
    "non_persistent_next_60d",
]


def to_int(v):
    if v is None or v == "":
        return None
    return int(float(v))


def to_float(v):
    if v is None or v == "":
        return None
    return float(v)


def wipe_database(db_path: str):
    db_file = Path(db_path)
    if db_file.exists():
        db_file.unlink()
    for ext in ("-wal", "-shm"):
        side_file = Path(str(db_file) + ext)
        if side_file.exists():
            side_file.unlink()


def build_patient_row(row: dict) -> tuple:
    return (
        row["PATIENT_ID"],
        to_int(row["AGE"]),
        row["GENDER"] or None,
        to_float(row["BMI"]),
        row["SMOKING_STATUS"] or None,
        row["ALCOHOL_USE"] or None,
        row["PHYSICAL_ACTIVITY"] or None,
        to_float(row["HEALTH_LITERACY_SCORE"]),
        to_int(row["COMORBIDITY_COUNT"]),
        to_int(row["DIABETES_FLAG"]) or 0,
        to_float(row["DISEASE_DURATION"]),
        to_float(row["DIAGNOSIS_AGE"]),
        to_float(row["FORGETFULNESS_PROPENSITY"]),
        to_int(row["BASELINE_BP_CONTROL"]) or 0,
        "Hypertension",
    )


def build_feature_row(row: dict) -> tuple:
    pid = row["PATIENT_ID"]
    pred_date = row["PREDICTION_DATE"] or None
    return (
        f"{pid}_{pred_date}", pid, pred_date,
        to_float(row["PERCEIVED_TREATMENT_BENEFIT"]), to_int(row["TOTAL_REFILLS"]), to_int(row["MISSED_REFILLS"]),
        to_float(row["MISSED_REFILL_RATE"]), to_float(row["AVG_REFILL_GAP"]), to_float(row["MAX_REFILL_GAP"]),
        to_float(row["PDC_30D"]), to_float(row["PDC_60D"]), to_float(row["PDC_90D"]), to_float(row["PDC_ALL_HISTORY"]),
        to_float(row["AVG_FINANCIAL_BURDEN"]),
        to_float(row["MISSED_REFILL_RATE_RECENT_30D"]), to_float(row["MISSED_REFILL_RATE_PREVIOUS_30D"]),
        to_float(row["MISSED_REFILL_RATE_CHANGE_30D"]),
        to_float(row["AVG_REFILL_GAP_RECENT_30D"]), to_float(row["AVG_REFILL_GAP_PREVIOUS_30D"]),
        to_float(row["AVG_REFILL_GAP_CHANGE_30D"]),
        to_float(row["PDC_RECENT_30D"]), to_float(row["PDC_PREVIOUS_30D"]), to_float(row["PDC_CHANGE_30D"]),
        to_float(row["PDC_TREND"]), to_float(row["MISSED_REFILL_RATE_TREND"]), to_float(row["AVG_REFILL_GAP_TREND"]),
        to_float(row["REFILL_FREQUENCY_TREND"]),
        to_int(row["DAYS_SINCE_LAST_REFILL"]), to_int(row["DAYS_SINCE_LAST_MISSED_REFILL"]),
        to_int(row["DAYS_SINCE_LAST_SUPPORT"]), to_int(row["DAYS_SINCE_LAST_PRESCRIPTION"]),
        to_int(row["MEDICATION_COUNT"]), to_int(row["UNIQUE_DRUG_CLASSES"]), to_int(row["TWICE_DAILY_DRUG_COUNT"]),
        to_float(row["REGIMEN_COMPLEXITY_SCORE"]), to_int(row["TREATMENT_CHANGE_COUNT"]),
        to_int(row["DAYS_SINCE_TREATMENT_CHANGE"]),
        to_int(row["MEDICATION_COUNT_RECENT_30D"]), to_int(row["MEDICATION_COUNT_CHANGE"]),
        to_int(row["DRUG_CLASS_COUNT_RECENT_30D"]), to_int(row["DRUG_CLASS_COUNT_CHANGE"]),
        to_float(row["REGIMEN_COMPLEXITY_RECENT_30D"]), to_float(row["REGIMEN_COMPLEXITY_CHANGE"]),
        to_int(row["MEDICATION_ADDED_COUNT"]),
        to_int(row["SUPPORT_CONTACT_COUNT"]), to_int(row["SUPPORT_CONTACT_COUNT_RECENT_30D"]),
        to_int(row["SUPPORT_CONTACT_COUNT_PREVIOUS_30D"]),
        to_int(row["SUPPORT_CONTACT_CHANGE"]),
        to_float(row["PATIENT_RESPONSE_RATE"]), to_float(row["RESPONSE_RATE_RECENT_30D"]),
        to_float(row["RESPONSE_RATE_PREVIOUS_30D"]), to_float(row["RESPONSE_RATE_CHANGE"]),
        to_int(row["SIDE_EFFECT_REPORTED_COUNT"]), to_int(row["FINANCIAL_ASSISTANCE_COUNT"]),
        to_int(row["REFILL_REMINDER_COUNT"]),
        to_int(row["NON_PERSISTENT_NEXT_60D"]) or 0,
    )


def run(csv_path: str):
    db_path = settings.database_url
    print(f"\n[Import] ML features CSV: {csv_path}")
    print(f"[Import] Target DB: {db_path}")

    print("[Import] Wiping existing database...")
    wipe_database(db_path)
    init_db(db_path)

    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode = MEMORY")
    conn.execute("PRAGMA synchronous = OFF")
    conn.execute("PRAGMA foreign_keys = OFF")

    patient_sql = f"INSERT INTO PATIENT ({', '.join(PATIENT_COLUMNS)}) VALUES ({','.join(['?'] * len(PATIENT_COLUMNS))})"
    feature_sql = f"INSERT INTO ML_FEATURES ({', '.join(FEATURE_COLUMNS)}) VALUES ({','.join(['?'] * len(FEATURE_COLUMNS))})"

    seen_patients = set()
    patient_batch = []
    feature_batch = []
    total_patients = 0
    total_features = 0

    print("[Import] Streaming CSV rows...")
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pid = row["PATIENT_ID"]
            if pid not in seen_patients:
                seen_patients.add(pid)
                patient_batch.append(build_patient_row(row))
                total_patients += 1

            feature_batch.append(build_feature_row(row))
            total_features += 1

            if len(patient_batch) >= BATCH_SIZE:
                conn.executemany(patient_sql, patient_batch)
                patient_batch.clear()
            if len(feature_batch) >= BATCH_SIZE:
                conn.executemany(feature_sql, feature_batch)
                feature_batch.clear()
                conn.commit()
                print(f"  ... {total_features:,} feature rows / {total_patients:,} patients processed")

    if patient_batch:
        conn.executemany(patient_sql, patient_batch)
    if feature_batch:
        conn.executemany(feature_sql, feature_batch)
    conn.commit()

    print("[Import] Restoring action rules, model metrics, settings...")
    conn.execute("PRAGMA foreign_keys = ON")
    seed_action_rules(conn)
    seed_model_metrics(conn)
    seed_settings(conn)

    conn.close()
    print(f"\n[OK] Imported {total_patients:,} patients, {total_features:,} ML feature records.\n")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m app.seed.import_ml_features_csv <path-to-csv>")
        sys.exit(1)
    run(sys.argv[1])

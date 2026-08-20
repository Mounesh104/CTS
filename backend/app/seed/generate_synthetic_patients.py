"""
app/seed/generate_synthetic_patients.py
-----------------------------------------
Generates a fully synthetic (no real patient data) cohort of exactly
N_PATIENTS patients with realistic demographics, ~6 months of adherence
history, correlated risk scores, and a 4-tier risk taxonomy
(Low / Moderate / High / Critical). Wipes and replaces all patient-scoped
data, then reseeds config tables (ACTION_RULES, SETTINGS, MODEL_METRICS).

Reproducible via a fixed random seed -- same seed always produces the same
dataset -- but adherence/risk/refill patterns are drawn from realistic
correlated distributions (Beta-distributed adherence, per-patient trend
archetypes, age-group effects), not uniform noise.

Run from backend/ directory:
    python -m app.seed.generate_synthetic_patients
"""

import json
import random
import sqlite3
from datetime import date, timedelta
from pathlib import Path

from app.core.config import settings
from app.db.init_db import init_db
from app.core.risk_bands import band_for_score, get_thresholds

SEED = 42
N_PATIENTS = 2573
MONTHS_OF_HISTORY = 6
TODAY = date(2026, 8, 20)

STATES = [
    "Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "Gujarat",
    "Uttar Pradesh", "West Bengal", "Rajasthan", "Telangana", "Kerala",
]
LOCALITY_TYPES = ["Urban", "Suburban", "Rural"]
CARE_SECTORS = ["Private", "Public"]
GENDERS = ["Female", "Male", "Other"]
SMOKING = ["Never", "Former", "Current"]
ALCOHOL = ["None", "Occasional", "Regular"]
ACTIVITY = ["Sedentary", "Moderate", "Active"]
INCOME_RANGES = ["<5L", "5-10L", "10-20L", ">20L"]
EDUCATION = ["Primary", "Secondary", "Graduate", "Postgraduate"]
MEDICATION_STATUSES = ["Active", "Active", "Active", "Active", "Paused", "Switched", "Discontinued"]

# Per-patient adherence trend archetypes (section 10: improving / declining / stable patients)
TREND_TYPES = ["Improving", "Declining", "Stable", "Volatile"]
TREND_WEIGHTS = [0.32, 0.13, 0.45, 0.10]

MONTH_LABELS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"][-MONTHS_OF_HISTORY:]

RISK_FACTOR_POOL = [
    "Missed Refills", "Refill Gap", "Low Support Responsiveness",
    "Comorbidity Burden", "Financial Burden", "Side Effects Reported",
    "Regimen Complexity", "Forgetfulness",
]


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def age_group(age: int) -> str:
    if age < 45:
        return "Under 45"
    if age < 60:
        return "45-59"
    return "60+"


def month_key_for_offset(offset_from_latest: int) -> str:
    """offset_from_latest=0 -> current month, 1 -> previous month, etc."""
    year = TODAY.year
    month = TODAY.month - offset_from_latest
    while month <= 0:
        month += 12
        year -= 1
    return f"{year:04d}-{month:02d}"


def generate_patient(rng: random.Random, idx: int) -> dict:
    patient_id = f"SYN{idx:05d}"
    age = clamp(int(rng.gauss(57, 13)), 22, 92)
    gender = rng.choices(GENDERS, weights=[0.49, 0.49, 0.02])[0]
    bmi = round(clamp(rng.gauss(27.5, 4.5), 16.0, 48.0), 1)
    comorbidity_count = rng.choices([0, 1, 2, 3, 4], weights=[0.30, 0.32, 0.22, 0.11, 0.05])[0]
    diabetes_flag = 1 if rng.random() < (0.15 + 0.05 * comorbidity_count) else 0
    disease_duration = round(clamp(rng.gauss(6.5, 4.0), 0.2, 30.0), 2)
    diagnosis_age = round(clamp(age - disease_duration, 18, age), 1)
    forgetfulness_propensity = round(clamp(rng.gauss(0.32, 0.18), 0.02, 0.98), 3)
    baseline_bp_control = 1 if rng.random() < 0.45 else 0
    health_literacy_score = round(clamp(rng.gauss(0.62, 0.20), 0.05, 0.99), 3)

    enrollment_days_ago = rng.randint(90, 900)
    enrollment_date = str(TODAY - timedelta(days=enrollment_days_ago))
    medication_status = rng.choice(MEDICATION_STATUSES)

    trend_type = rng.choices(TREND_TYPES, weights=TREND_WEIGHTS)[0]

    return {
        "patient_id": patient_id, "age": age, "gender": gender, "bmi": bmi,
        "smoking_status": rng.choice(SMOKING), "alcohol_use": rng.choice(ALCOHOL),
        "physical_activity": rng.choice(ACTIVITY),
        "income_range": rng.choice(INCOME_RANGES), "education_level": rng.choice(EDUCATION),
        "health_literacy_score": health_literacy_score,
        "state": rng.choice(STATES), "locality_type": rng.choice(LOCALITY_TYPES),
        "care_sector": rng.choice(CARE_SECTORS),
        "comorbidity_count": comorbidity_count, "diabetes_flag": diabetes_flag,
        "disease_duration": disease_duration, "diagnosis_age": diagnosis_age,
        "forgetfulness_propensity": forgetfulness_propensity,
        "baseline_bp_control": baseline_bp_control, "diagnosis": "Hypertension",
        "enrollment_date": enrollment_date, "medication_status": medication_status,
        "_trend_type": trend_type,
    }


def generate_monthly_adherence_series(rng: random.Random, base_adherence: float, trend_type: str) -> list:
    """Returns MONTHS_OF_HISTORY adherence values (oldest -> newest, 0-100 scale)."""
    series = []
    value = base_adherence
    for i in range(MONTHS_OF_HISTORY):
        if trend_type == "Improving":
            drift = rng.uniform(0.5, 2.5)
        elif trend_type == "Declining":
            drift = -rng.uniform(0.5, 2.8)
        elif trend_type == "Volatile":
            drift = rng.uniform(-6.0, 6.0)
        else:  # Stable
            drift = rng.uniform(-1.0, 1.0)
        value = clamp(value + drift + rng.gauss(0, 1.5), 5.0, 99.0)
        series.append(round(value, 1))
    return series


def compute_risk_score(rng: random.Random, patient: dict, latest_adherence: float, missed_refills: int) -> float:
    missed_component = (100 - latest_adherence) * 0.72
    comorbidity_component = patient["comorbidity_count"] * 3.2
    age_component = 4.0 if patient["age"] >= 65 else 0.0
    forgetfulness_component = patient["forgetfulness_propensity"] * 12.0
    literacy_component = (1 - patient["health_literacy_score"]) * 6.0
    noise = rng.gauss(0, 6.0)

    score = (
        missed_component + comorbidity_component + age_component
        + forgetfulness_component + literacy_component + noise
    )
    return round(clamp(score, 1.0, 99.0), 1)


def top_factors_for_patient(rng: random.Random, patient: dict, missed_refill_rate: float, avg_refill_gap: float) -> list:
    candidates = []
    if missed_refill_rate > 0.15:
        candidates.append(("Missed Refills", min(0.9, missed_refill_rate * 1.4)))
    if avg_refill_gap > 5:
        candidates.append(("Refill Gap", min(0.85, avg_refill_gap / 30.0)))
    if patient["comorbidity_count"] >= 2:
        candidates.append(("Comorbidity Burden", min(0.7, patient["comorbidity_count"] * 0.15)))
    if patient["forgetfulness_propensity"] > 0.4:
        candidates.append(("Forgetfulness", patient["forgetfulness_propensity"] * 0.6))
    if patient["health_literacy_score"] < 0.5:
        candidates.append(("Low Support Responsiveness", (1 - patient["health_literacy_score"]) * 0.5))
    if not candidates:
        candidates.append((rng.choice(RISK_FACTOR_POOL), rng.uniform(0.1, 0.3)))

    candidates.sort(key=lambda c: c[1], reverse=True)
    top = candidates[:4]
    return [{"factor": f, "contribution": round(c, 3)} for f, c in top]


def wipe_database(db_path: str):
    db_file = Path(db_path)
    if db_file.exists():
        db_file.unlink()
    for ext in ("-wal", "-shm"):
        side_file = Path(str(db_file) + ext)
        if side_file.exists():
            side_file.unlink()


def seed_action_rules_4tier(conn: sqlite3.Connection):
    conn.execute("DELETE FROM ACTION_RULES")
    rules = [
        ("RULE-CRIT-1", "Critical", "Urgent Clinical Intervention",
         "Very high discontinuation risk — immediate clinical outreach and case review required.", "Critical"),
        ("RULE-HIGH-1", "High", "Clinical Pharmacist",
         "Elevated risk from missed refills and/or comorbidity burden requires regimen review.", "High"),
        ("RULE-HIGH-2", "High", "Copay Assistance",
         "High financial burden identified as a contributor to non-adherence risk.", "High"),
        ("RULE-MOD-1", "Moderate", "Nurse Follow-up",
         "Moderate risk signals warrant a personalized counseling call.", "Medium"),
        ("RULE-MOD-2", "Moderate", "SMS Reminder",
         "Behavioral reminders indicated to address minor refill gaps.", "Medium"),
        ("RULE-LOW-1", "Low", "Routine Monitoring",
         "Patient is on track. Standard care monitoring — no immediate action required.", "Low"),
    ]
    conn.executemany("""
        INSERT INTO ACTION_RULES (rule_id, risk_band, recommended_action, reason, priority)
        VALUES (?,?,?,?,?)
    """, rules)
    conn.commit()
    print(f"  [OK] {len(rules)} action rules inserted (4-tier)")


def seed_settings(conn: sqlite3.Connection):
    rows = [
        ("therapy_area", "Hypertension"),
        ("critical_risk_threshold", "67"),
        ("high_risk_threshold", "56"),
        ("moderate_risk_threshold", "38"),
        ("med_risk_threshold", "38"),  # back-compat alias
        ("pdc_target", "80"),
        ("alerts_enabled", "true"),
        ("reminders_enabled", "true"),
        ("summary_enabled", "false"),
    ]
    conn.executemany(
        "INSERT INTO SETTINGS (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        rows,
    )
    conn.commit()
    print("  [OK] Settings + 3-tier thresholds inserted")


def seed_model_metrics(conn: sqlite3.Connection):
    today = date.today()
    metrics = [
        ("METRIC-SYN-001", str(today - timedelta(days=60)), 0.81, 0.86, None, 0.03, "synthetic-v1.0", 0,
         "Baseline synthetic-cohort evaluation"),
        ("METRIC-SYN-002", str(today), 0.83, 0.88, None, 0.02, "synthetic-v1.1", 0,
         "Latest synthetic-cohort evaluation"),
    ]
    conn.executemany("""
        INSERT OR IGNORE INTO MODEL_METRICS (
            metric_id, evaluation_date, accuracy, auc, c_index,
            drift_score, model_version, retrain_triggered, notes
        ) VALUES (?,?,?,?,?,?,?,?,?)
    """, metrics)
    conn.commit()
    print(f"  [OK] {len(metrics)} model metric records inserted")


def run():
    db_path = settings.database_url
    print(f"\n[Synthetic] Generating {N_PATIENTS:,} synthetic patients (seed={SEED})")
    print(f"[Synthetic] Target DB: {db_path}")

    print("[Synthetic] Wiping existing database...")
    wipe_database(db_path)
    init_db(db_path)

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = MEMORY")
    conn.execute("PRAGMA synchronous = OFF")
    conn.execute("PRAGMA foreign_keys = OFF")

    rng = random.Random(SEED)

    thresholds = get_thresholds({})  # uses calibrated DEFAULT_THRESHOLDS

    patient_rows = []
    feature_rows = []
    claim_rows = []
    risk_rows = []
    band_counts = {"Low": 0, "Moderate": 0, "High": 0, "Critical": 0}

    patient_cols = [
        "patient_id", "age", "gender", "bmi", "smoking_status", "alcohol_use",
        "physical_activity", "income_range", "education_level", "health_literacy_score",
        "state", "locality_type", "care_sector", "comorbidity_count", "diabetes_flag",
        "disease_duration", "diagnosis_age", "forgetfulness_propensity",
        "baseline_bp_control", "diagnosis", "enrollment_date", "medication_status",
    ]
    feature_cols = [
        "feature_id", "patient_id", "prediction_date", "missed_refill_rate",
        "avg_refill_gap", "max_refill_gap", "avg_financial_burden",
        "medication_count", "unique_drug_classes", "regimen_complexity_score",
        "support_contact_count", "patient_response_rate", "non_persistent_next_60d",
        "total_refills", "missed_refills", "pdc_90d", "pdc_all_history",
        "side_effect_reported_count", "financial_assistance_count", "refill_reminder_count",
        "days_since_last_refill", "days_since_last_prescription",
    ]
    claim_cols = [
        "claim_id", "patient_id", "drug_id", "dispense_date", "expected_refill_date",
        "refill_date", "days_supply", "quantity_dispensed", "refill_gap_days",
        "missed_refill_flag", "copay_amount_inr", "financial_burden", "refill_number",
    ]
    risk_cols = [
        "score_id", "patient_id", "score_date", "risk_score", "risk_band",
        "top_risk_factors", "estimated_time_to_discontinuation", "model_version",
    ]

    print("[Synthetic] Generating patient records...")
    for i in range(1, N_PATIENTS + 1):
        p = generate_patient(rng, i)
        pid = p["patient_id"]
        patient_rows.append(tuple(p[c] for c in patient_cols))

        base_adherence = clamp(rng.betavariate(6.0, 2.2) * 100, 8.0, 99.0)
        series = generate_monthly_adherence_series(rng, base_adherence, p["_trend_type"])

        avg_financial_burden = round(clamp(rng.gauss(0.003, 0.0025), 0.0001, 0.02), 5)
        medication_count = rng.choices([1, 2, 3, 4, 5], weights=[0.35, 0.30, 0.20, 0.10, 0.05])[0]
        regimen_complexity = round(medication_count * rng.uniform(0.8, 1.3), 2)

        last_refill_date = None
        for m_idx, adherence in enumerate(series):
            offset = MONTHS_OF_HISTORY - 1 - m_idx  # oldest has largest offset
            pred_date = f"{month_key_for_offset(offset)}-15"
            missed_rate = round(clamp((100 - adherence) / 100, 0.0, 1.0), 4)
            avg_gap = round(clamp(missed_rate * 25 + rng.uniform(-2, 3), 0.0, 31.0), 1)
            max_gap = round(clamp(avg_gap * rng.uniform(1.2, 2.0), 0.0, 45.0), 1)
            total_refills = rng.randint(3, 8)
            missed_refills = round(total_refills * missed_rate)
            support_contacts = rng.randint(0, 4)
            response_rate = round(clamp(rng.betavariate(2.0, 2.0), 0.0, 1.0), 3)
            non_persistent_next_60d = 1 if (missed_rate > 0.4 and rng.random() < 0.5) else 0
            days_since_refill = rng.randint(0, 45)

            feature_rows.append((
                f"{pid}_{pred_date}", pid, pred_date, missed_rate, avg_gap, max_gap,
                avg_financial_burden, medication_count, min(medication_count, rng.randint(1, 3)),
                regimen_complexity, support_contacts, response_rate, non_persistent_next_60d,
                total_refills, missed_refills, round(1 - missed_rate, 3), round(1 - missed_rate, 3),
                1 if rng.random() < 0.08 else 0, 1 if rng.random() < 0.05 else 0,
                support_contacts, days_since_refill, days_since_refill,
            ))

            if m_idx == MONTHS_OF_HISTORY - 1:
                last_refill_date = str(TODAY - timedelta(days=days_since_refill))

        # -- Refill history claims (a handful spanning enrollment) --
        n_claims = rng.randint(3, 8)
        for c in range(n_claims):
            days_ago = rng.randint(5, min(enrollment_span := (TODAY - date.fromisoformat(p["enrollment_date"])).days, 400))
            dispense_date = str(TODAY - timedelta(days=days_ago))
            gap_days = round(max(0, rng.gauss(avg_gap, 4)))
            claim_rows.append((
                f"CLM-{pid}-{c+1}", pid, f"DRUG-{rng.randint(1,20):03d}", dispense_date, dispense_date,
                dispense_date, 30, 30, gap_days, 1 if gap_days > 7 else 0,
                round(rng.uniform(50, 800), 2), avg_financial_burden, c + 1,
            ))

        # -- Final risk score (from latest month) --
        latest_adherence = series[-1]
        missed_refill_rate_latest = round(clamp((100 - latest_adherence) / 100, 0.0, 1.0), 4)
        avg_gap_latest = round(clamp(missed_refill_rate_latest * 25, 0.0, 31.0), 1)
        risk_score = compute_risk_score(rng, p, latest_adherence, 0)
        band = band_for_score(risk_score, thresholds)
        band_counts[band] += 1

        top_factors = top_factors_for_patient(rng, p, missed_refill_rate_latest, avg_gap_latest)
        est_days = round(max(7.0, 200.0 * (1 - risk_score / 100.0)), 1)
        latest_pred_date = f"{month_key_for_offset(0)}-15"

        risk_rows.append((
            f"RS-{pid}", pid, latest_pred_date, risk_score, band,
            json.dumps(top_factors), est_days, "synthetic-v1",
        ))

        if i % 500 == 0:
            print(f"  ... {i:,} / {N_PATIENTS:,} patients generated")

    print("[Synthetic] Writing to database...")
    patient_sql = f"INSERT INTO PATIENT ({', '.join(patient_cols)}) VALUES ({','.join(['?'] * len(patient_cols))})"
    feature_sql = f"INSERT INTO ML_FEATURES ({', '.join(feature_cols)}) VALUES ({','.join(['?'] * len(feature_cols))})"
    claim_sql = f"INSERT INTO PHARMACY_CLAIM ({', '.join(claim_cols)}) VALUES ({','.join(['?'] * len(claim_cols))})"
    risk_sql = f"INSERT INTO RISK_SCORE ({', '.join(risk_cols)}) VALUES ({','.join(['?'] * len(risk_cols))})"

    conn.executemany(patient_sql, patient_rows)
    conn.executemany(feature_sql, feature_rows)
    conn.executemany(claim_sql, claim_rows)
    conn.executemany(risk_sql, risk_rows)
    conn.commit()

    print("[Synthetic] Restoring action rules, settings, model metrics...")
    conn.execute("PRAGMA foreign_keys = ON")
    seed_action_rules_4tier(conn)
    seed_settings(conn)
    seed_model_metrics(conn)

    conn.close()

    print(f"\n[OK] Generated {N_PATIENTS:,} synthetic patients.")
    print(f"     ML_FEATURES rows: {len(feature_rows):,}  PHARMACY_CLAIM rows: {len(claim_rows):,}")
    print(f"     Risk distribution -- Critical: {band_counts['Critical']:,}  High: {band_counts['High']:,}  "
          f"Moderate: {band_counts['Moderate']:,}  Low: {band_counts['Low']:,}\n")


if __name__ == "__main__":
    run()

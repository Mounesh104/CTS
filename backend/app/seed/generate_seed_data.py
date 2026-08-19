"""
app/seed/generate_seed_data.py
-------------------------------
Populates the SQLite database with realistic synthetic data:
  - 200 patients (includes the 20 frontend mock patient IDs)
  - 3-8 pharmacy claims per patient
  - 1-4 support events per patient
  - 1-2 insurance policies per patient
  - 1 ML features record per patient
  - 1 therapy outcome per patient
  - 1-3 risk score records per patient (simulating ML pipeline output)
  - Default ACTION_RULES (6 rules matching frontend expectations)
  - 3 MODEL_METRICS records (historical performance snapshots)

Run from backend/ directory:
    python -m app.seed.generate_seed_data
"""

import sqlite3
import random
import uuid
import json
from datetime import date, timedelta
from pathlib import Path

from app.core.config import settings
from app.db.init_db import init_db

# ── Reproducible randomness ────────────────────────────────────────────────
random.seed(42)

# ── Constants ─────────────────────────────────────────────────────────────
STATES = ["Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "Gujarat",
          "Rajasthan", "Uttar Pradesh", "West Bengal", "Telangana", "Kerala"]
LOCALITIES = ["Urban", "Semi-Urban", "Rural"]
CARE_SECTORS = ["Private", "Public", "NGO"]
GENDERS = ["Male", "Female", "Other"]
SMOKING = ["Never", "Former", "Current"]
ALCOHOL = ["None", "Occasional", "Regular"]
ACTIVITY = ["Sedentary", "Light", "Moderate", "Active"]
INCOMES = ["<2L", "2-5L", "5-10L", "10-20L", ">20L"]
EDUCATION = ["Primary", "Secondary", "Graduate", "Post-Graduate", "None"]
DIAGNOSES = ["Hypertension", "Type 2 Diabetes", "Asthma", "Heart Failure", "Hypertension"]
DRUG_IDS = ["D001", "D002", "D003", "D004", "D005", "D006", "D007", "D008"]
PHARMACIES = ["PH001", "PH002", "PH003", "PH004", "PH005"]
CONTACT_TYPES = ["Inbound", "Outbound", "Automated"]
CHANNELS = ["Phone", "SMS", "WhatsApp", "Email", "In-Person"]
CONTACT_OUTCOMES = ["Successful", "No Answer", "Callback Requested", "Declined"]
INTERVENTION_TYPES = ["Copay Assistance", "Nurse Follow-up", "SMS Reminder",
                       "Clinical Pharmacist", "Patient-support call"]
INTERVENTION_OUTCOMES = ["Accepted", "Declined", "Pending", "Completed"]
VENDORS = ["Star Health", "HDFC ERGO", "United India", "New India", "Bajaj Allianz"]
COVERAGE_TYPES = ["Individual", "Family", "Group"]
RISK_FACTORS_POOL = [
    "Refill Gap", "High Copay", "Comorbidities", "Side Effects",
    "Previous Adherence", "Missed Doses", "Financial Burden",
    "Low Health Literacy", "Forgetfulness", "Regimen Complexity"
]

# ── The 20 frontend mock patients (must match mockPatients.js exactly) ─────
FRONTEND_MOCK_PATIENTS = [
    {"patient_id": "P1024", "risk_score": 82, "risk_band": "High",  "adherence": 62, "persistency_months": 8,  "refill_gap": 14, "copay": 700},
    {"patient_id": "P1087", "risk_score": 76, "risk_band": "High",  "adherence": 67, "persistency_months": 11, "refill_gap": 18, "copay": 400},
    {"patient_id": "P1132", "risk_score": 58, "risk_band": "Medium","adherence": 74, "persistency_months": 5,  "refill_gap": 7,  "copay": 150},
    {"patient_id": "P1204", "risk_score": 89, "risk_band": "High",  "adherence": 51, "persistency_months": 3,  "refill_gap": 22, "copay": 800},
    {"patient_id": "P1221", "risk_score": 41, "risk_band": "Medium","adherence": 79, "persistency_months": 14, "refill_gap": 4,  "copay": 100},
    {"patient_id": "P1289", "risk_score": 22, "risk_band": "Low",   "adherence": 88, "persistency_months": 24, "refill_gap": 0,  "copay": 80},
    {"patient_id": "P1302", "risk_score": 85, "risk_band": "High",  "adherence": 58, "persistency_months": 9,  "refill_gap": 19, "copay": 750},
    {"patient_id": "P1345", "risk_score": 65, "risk_band": "Medium","adherence": 71, "persistency_months": 6,  "refill_gap": 9,  "copay": 350},
    {"patient_id": "P1399", "risk_score": 18, "risk_band": "Low",   "adherence": 94, "persistency_months": 18, "refill_gap": 0,  "copay": 60},
    {"patient_id": "P1410", "risk_score": 79, "risk_band": "High",  "adherence": 64, "persistency_months": 10, "refill_gap": 15, "copay": 650},
    {"patient_id": "P1452", "risk_score": 30, "risk_band": "Low",   "adherence": 83, "persistency_months": 12, "refill_gap": 2,  "copay": 280},
    {"patient_id": "P1490", "risk_score": 72, "risk_band": "High",  "adherence": 69, "persistency_months": 7,  "refill_gap": 12, "copay": 420},
    {"patient_id": "P1520", "risk_score": 93, "risk_band": "High",  "adherence": 45, "persistency_months": 4,  "refill_gap": 25, "copay": 900},
    {"patient_id": "P1560", "risk_score": 48, "risk_band": "Medium","adherence": 77, "persistency_months": 15, "refill_gap": 5,  "copay": 120},
    {"patient_id": "P1601", "risk_score": 15, "risk_band": "Low",   "adherence": 96, "persistency_months": 30, "refill_gap": 0,  "copay": 50},
    {"patient_id": "P1644", "risk_score": 61, "risk_band": "Medium","adherence": 73, "persistency_months": 9,  "refill_gap": 8,  "copay": 300},
    {"patient_id": "P1690", "risk_score": 87, "risk_band": "High",  "adherence": 55, "persistency_months": 6,  "refill_gap": 20, "copay": 720},
    {"patient_id": "P1711", "risk_score": 34, "risk_band": "Low",   "adherence": 82, "persistency_months": 13, "refill_gap": 3,  "copay": 260},
    {"patient_id": "P1750", "risk_score": 55, "risk_band": "Medium","adherence": 75, "persistency_months": 10, "refill_gap": 6,  "copay": 180},
    {"patient_id": "P1800", "risk_score": 25, "risk_band": "Low",   "adherence": 91, "persistency_months": 20, "refill_gap": 1,  "copay": 90},
]

FRONTEND_IDS = {p["patient_id"] for p in FRONTEND_MOCK_PATIENTS}
FRONTEND_MAP = {p["patient_id"]: p for p in FRONTEND_MOCK_PATIENTS}


# ── Helper utilities ────────────────────────────────────────────────────────

def rand_date(start_days_ago: int, end_days_ago: int = 0) -> str:
    offset = random.randint(end_days_ago, start_days_ago)
    return str(date.today() - timedelta(days=offset))


def build_top_risk_factors(risk_score: float) -> list[dict]:
    """Generate SHAP-style risk factor contributions that sum close to risk_score/100."""
    n = random.randint(2, 4)
    factors = random.sample(RISK_FACTORS_POOL, n)
    contributions = sorted([round(random.uniform(0.05, 0.45), 2) for _ in range(n)], reverse=True)
    # Normalize so they make sense
    total = sum(contributions)
    contributions = [round(c / total * (risk_score / 100), 3) for c in contributions]
    return [{"factor": f, "contribution": c} for f, c in zip(factors, contributions)]


def copay_level_from_amount(copay: float) -> str:
    if copay > 500:
        return "High"
    elif copay > 200:
        return "Medium"
    return "Low"


# ── Seed functions ──────────────────────────────────────────────────────────

def seed_patients(conn: sqlite3.Connection) -> list[str]:
    """Insert 200 patients. Returns list of all patient_ids."""
    patient_ids = [p["patient_id"] for p in FRONTEND_MOCK_PATIENTS]

    # Generate 180 additional synthetic patient IDs
    existing_nums = {int(pid[1:]) for pid in patient_ids}
    counter = 2000
    while len(patient_ids) < 200:
        pid = f"P{counter}"
        if counter not in existing_nums:
            patient_ids.append(pid)
        counter += 1

    rows = []
    for pid in patient_ids:
        is_mock = pid in FRONTEND_IDS
        mock = FRONTEND_MAP.get(pid, {})
        diabetes = 1 if (is_mock and mock.get("adherence", 80) < 65) else random.randint(0, 1)
        comorbidity_count = random.randint(1, 4) if is_mock else random.randint(0, 4)
        rows.append((
            pid,
            random.randint(30, 75),                            # age
            random.choice(GENDERS),                            # gender
            round(random.uniform(18.5, 38.0), 1),             # bmi
            random.choice(SMOKING),                            # smoking_status
            random.choice(ALCOHOL),                            # alcohol_use
            random.choice(ACTIVITY),                           # physical_activity
            random.choice(INCOMES),                            # income_range
            random.choice(EDUCATION),                          # education_level
            round(random.uniform(0.2, 1.0), 2),               # health_literacy_score
            random.choice(STATES),                             # state
            random.choice(LOCALITIES),                         # locality_type
            random.choice(CARE_SECTORS),                       # care_sector
            comorbidity_count,                                  # comorbidity_count
            diabetes,                                           # diabetes_flag
            round(random.uniform(0.5, 15.0), 1),              # disease_duration
            round(random.uniform(25, 65), 1),                  # diagnosis_age
            round(random.uniform(0.1, 0.9), 2),               # forgetfulness_propensity
            random.randint(0, 1),                              # baseline_bp_control
            random.choice(DIAGNOSES),                          # diagnosis
        ))

    conn.executemany("""
        INSERT OR IGNORE INTO PATIENT (
            patient_id, age, gender, bmi, smoking_status, alcohol_use,
            physical_activity, income_range, education_level, health_literacy_score,
            state, locality_type, care_sector, comorbidity_count, diabetes_flag,
            disease_duration, diagnosis_age, forgetfulness_propensity,
            baseline_bp_control, diagnosis
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, rows)
    conn.commit()
    print(f"  ✓ {len(rows)} patients inserted")
    return patient_ids


def seed_claims(conn: sqlite3.Connection, patient_ids: list[str]):
    rows = []
    for pid in patient_ids:
        mock = FRONTEND_MAP.get(pid, {})
        n_claims = random.randint(3, 8)
        for i in range(n_claims):
            dispense = rand_date(365, 30)
            gap = mock.get("refill_gap", random.randint(0, 30)) if i == 0 and pid in FRONTEND_IDS else random.randint(0, 25)
            missed = 1 if gap > 10 else 0
            copay = mock.get("copay", random.uniform(50, 1000)) if pid in FRONTEND_IDS else random.uniform(50, 1000)
            rows.append((
                f"CLM-{pid}-{i+1:03d}",    # claim_id
                pid,                          # patient_id
                random.choice(DRUG_IDS),      # drug_id
                dispense,                     # dispense_date
                rand_date(20, 5),             # expected_refill_date
                rand_date(30, 0),             # refill_date
                random.choice([30, 60, 90]), # days_supply
                random.randint(10, 90),       # quantity_dispensed
                gap,                          # refill_gap_days
                missed,                       # missed_refill_flag
                random.choice(["Normal", "Late", "Early", "Stockout"]),  # refill_cause
                random.randint(0, 1),         # stockout_flag
                random.choice(PHARMACIES),    # pharmacy_id
                random.choice(["Approved", "Pending", "Rejected"]),       # claim_status
                round(copay, 2),              # copay_amount_inr
                round(random.uniform(0.1, 0.9), 2),  # financial_burden
                i + 1,                        # refill_number
            ))
    conn.executemany("""
        INSERT OR IGNORE INTO PHARMACY_CLAIM (
            claim_id, patient_id, drug_id, dispense_date, expected_refill_date,
            refill_date, days_supply, quantity_dispensed, refill_gap_days,
            missed_refill_flag, refill_cause, stockout_flag, pharmacy_id,
            claim_status, copay_amount_inr, financial_burden, refill_number
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, rows)
    conn.commit()
    print(f"  ✓ {len(rows)} pharmacy claims inserted")


def seed_support_events(conn: sqlite3.Connection, patient_ids: list[str]):
    rows = []
    for pid in patient_ids:
        n = random.randint(1, 4)
        for i in range(n):
            rows.append((
                f"SUP-{pid}-{i+1:03d}",
                pid,
                rand_date(180, 1),
                random.choice(CONTACT_TYPES),
                random.choice(CHANNELS),
                random.choice(CONTACT_OUTCOMES),
                random.randint(0, 1),
                random.randint(0, 1),
                random.randint(0, 1),
                random.randint(0, 1),
                random.choice(INTERVENTION_TYPES),
                random.choice(INTERVENTION_OUTCOMES),
            ))
    conn.executemany("""
        INSERT OR IGNORE INTO SUPPORT_EVENT (
            support_id, patient_id, contact_date, contact_type, channel,
            contact_outcome, refill_reminder_sent, patient_response_flag,
            side_effect_reported, financial_assistance_flag,
            intervention_type, intervention_outcome
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    """, rows)
    conn.commit()
    print(f"  ✓ {len(rows)} support events inserted")


def seed_insurance(conn: sqlite3.Connection, patient_ids: list[str]):
    rows = []
    for pid in patient_ids:
        mock = FRONTEND_MAP.get(pid, {})
        n = random.randint(1, 2)
        for i in range(n):
            copay = mock.get("copay", random.uniform(50, 1000)) if pid in FRONTEND_IDS else random.uniform(50, 1000)
            rows.append((
                f"POL-{pid}-{i+1:03d}",
                pid,
                random.choice(VENDORS),
                random.choice(COVERAGE_TYPES),
                round(random.uniform(5000, 50000), 2),
                round(random.uniform(1000, 30000), 2),
                random.choice(["Approved", "Pending", "Settled"]),
                round(copay, 2),
                round(random.uniform(500, 10000), 2),
                random.randint(0, 1),
                random.randint(0, 1),
                round(random.uniform(15000, 150000), 2),
            ))
    conn.executemany("""
        INSERT OR IGNORE INTO INSURANCE (
            policy_id, patient_id, insurance_vendor_name, coverage_type,
            annual_contribution, claim_amount, claim_status, copay_amount,
            out_of_pocket_amount, drug_coverage_flag, prior_auth_flag, monthly_income_inr
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    """, rows)
    conn.commit()
    print(f"  ✓ {len(rows)} insurance records inserted")


def seed_ml_features(conn: sqlite3.Connection, patient_ids: list[str]):
    rows = []
    today = date.today()
    for pid in patient_ids:
        mock = FRONTEND_MAP.get(pid, {})
        adherence_pct = mock.get("adherence", random.randint(45, 95)) if pid in FRONTEND_IDS else random.randint(45, 95)
        missed_rate = round(1 - adherence_pct / 100, 3)
        avg_gap = mock.get("refill_gap", random.randint(0, 20)) if pid in FRONTEND_IDS else random.uniform(0, 20)
        rows.append((
            f"FEAT-{pid}-001",
            pid,
            str(today),
            missed_rate,
            round(avg_gap, 1),
            round(avg_gap * 1.5 + random.uniform(0, 5), 1),
            round(random.uniform(0.1, 0.8), 2),
            random.randint(1, 5),
            random.randint(1, 4),
            round(random.uniform(1.0, 5.0), 2),
            random.randint(1, 6),
            round(random.uniform(0.3, 0.9), 2),
            1 if missed_rate > 0.3 else 0,
        ))
    conn.executemany("""
        INSERT OR REPLACE INTO ML_FEATURES (
            feature_id, patient_id, prediction_date, missed_refill_rate,
            avg_refill_gap, max_refill_gap, avg_financial_burden,
            medication_count, unique_drug_classes, regimen_complexity_score,
            support_contact_count, patient_response_rate, non_persistent_next_60d
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, rows)
    conn.commit()
    print(f"  ✓ {len(rows)} ML feature records inserted")


def seed_therapy_outcomes(conn: sqlite3.Connection, patient_ids: list[str]):
    rows = []
    today = date.today()
    for pid in patient_ids:
        mock = FRONTEND_MAP.get(pid, {})
        persistence_months = mock.get("persistency_months", random.randint(2, 30)) if pid in FRONTEND_IDS else random.randint(2, 30)
        persistence_days = persistence_months * 30
        disc_flag = 1 if persistence_months < 6 else 0
        rows.append((
            f"THER-{pid}-001",
            pid,
            str(today - timedelta(days=persistence_days)),
            str(today),
            str(today + timedelta(days=60)),
            str(today + timedelta(days=180)),
            str(today - timedelta(days=10)) if disc_flag else None,
            disc_flag,
            disc_flag,
            persistence_days,
            "Event" if disc_flag else "Censored",
            1 if disc_flag else 0,
            random.randint(0, 1),
            round(random.uniform(0.3, 0.9), 2),
        ))
    conn.executemany("""
        INSERT OR IGNORE INTO THERAPY_OUTCOME (
            therapy_id, patient_id, therapy_start_date, prediction_date,
            prediction_window_end_date, followup_end_date, discontinuation_date,
            discontinuation_flag, event_observed, persistence_days,
            censoring_type, non_persistent_next_60d, side_effect_concern,
            perceived_treatment_benefit
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, rows)
    conn.commit()
    print(f"  ✓ {len(rows)} therapy outcomes inserted")


def seed_risk_scores(conn: sqlite3.Connection, patient_ids: list[str]):
    rows = []
    today = date.today()
    for pid in patient_ids:
        mock = FRONTEND_MAP.get(pid, {})
        n_scores = random.randint(1, 3)
        for i in range(n_scores):
            if i == 0 and pid in FRONTEND_IDS:
                # Latest score must match frontend mock exactly
                risk_score = float(mock["risk_score"])
                risk_band = mock["risk_band"]
            else:
                risk_score = round(random.uniform(10, 95), 1)
                risk_band = "High" if risk_score >= 70 else ("Medium" if risk_score >= 40 else "Low")

            score_date = str(today - timedelta(days=i * 30))
            top_factors = build_top_risk_factors(risk_score)
            est_days = round(max(5, 180 - risk_score * 1.5 + random.uniform(-10, 10)), 1)

            rows.append((
                f"RISK-{pid}-{i+1:03d}",
                pid,
                score_date,
                risk_score,
                risk_band,
                json.dumps(top_factors),
                est_days,
                "v1.2",
            ))

    conn.executemany("""
        INSERT OR IGNORE INTO RISK_SCORE (
            score_id, patient_id, score_date, risk_score, risk_band,
            top_risk_factors, estimated_time_to_discontinuation, model_version
        ) VALUES (?,?,?,?,?,?,?,?)
    """, rows)
    conn.commit()
    print(f"  ✓ {len(rows)} risk score records inserted")


def seed_action_rules(conn: sqlite3.Connection):
    conn.execute("DELETE FROM ACTION_RULES")
    rules = [
        ("RULE-001", "High",   "Patient-support call",
         "Complex case requiring personalized clinical counseling and nurse outreach.", "Critical"),
        ("RULE-002", "High",   "Copay Assistance",
         "High medication copay is identified as a major contributor to non-adherence risk.", "Critical"),
        ("RULE-003", "High",   "Clinical Pharmacist",
         "Comorbidities and complex polypharmacy list require clinical regimen review.", "High"),
        ("RULE-004", "Medium", "Nurse Follow-up",
         "Patient reports drug side-effects or clinical issues requiring personalized counseling.", "Medium"),
        ("RULE-005", "Medium", "SMS Reminder",
         "Daily behavioral compliance cues needed to address minor refill gaps and missed doses.", "Medium"),
        ("RULE-006", "Low",    "Routine Monitoring",
         "Patient is on track. Standard care monitoring — no immediate action required.", "Low"),
    ]
    conn.executemany("""
        INSERT INTO ACTION_RULES (rule_id, risk_band, recommended_action, reason, priority)
        VALUES (?,?,?,?,?)
    """, rules)
    conn.commit()
    print(f"  ✓ {len(rules)} action rules inserted")


def seed_model_metrics(conn: sqlite3.Connection):
    today = date.today()
    metrics = [
        ("METRIC-001", str(today - timedelta(days=60)), 0.821, 0.874, 0.812, 0.032, "v1.0", 0,
         "Baseline model evaluation"),
        ("METRIC-002", str(today - timedelta(days=30)), 0.835, 0.889, 0.828, 0.028, "v1.1", 0,
         "Monthly evaluation — performance improved"),
        ("METRIC-003", str(today),                       0.841, 0.897, 0.835, 0.021, "v1.2", 0,
         "Latest evaluation — model performing well"),
    ]
    conn.executemany("""
        INSERT OR IGNORE INTO MODEL_METRICS (
            metric_id, evaluation_date, accuracy, auc, c_index,
            drift_score, model_version, retrain_triggered, notes
        ) VALUES (?,?,?,?,?,?,?,?,?)
    """, metrics)
    conn.commit()
    print(f"  ✓ {len(metrics)} model metric records inserted")


# ── Main ────────────────────────────────────────────────────────────────────

def run():
    db_path = settings.database_url
    print(f"\n[Seed] PAPRS Seed Data Generator")
    print(f"   Target DB: {db_path}\n")

    # Ensure schema exists
    init_db(db_path)

    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON")

    try:
        print("Seeding patients...")
        patient_ids = seed_patients(conn)

        print("Seeding pharmacy claims...")
        seed_claims(conn, patient_ids)

        print("Seeding support events...")
        seed_support_events(conn, patient_ids)

        print("Seeding insurance records...")
        seed_insurance(conn, patient_ids)

        print("Seeding ML features...")
        seed_ml_features(conn, patient_ids)

        print("Seeding therapy outcomes...")
        seed_therapy_outcomes(conn, patient_ids)

        print("Seeding risk scores...")
        seed_risk_scores(conn, patient_ids)

        print("Seeding action rules...")
        seed_action_rules(conn)

        print("Seeding model metrics...")
        seed_model_metrics(conn)

        print("Seeding settings thresholds...")
        seed_settings(conn)

        print(f"\n[OK] Seed complete -- {len(patient_ids)} patients, full correlated data loaded.\n")
    finally:
        conn.close()


def seed_settings(conn: sqlite3.Connection):
    settings = [
        ("therapy_area", "Hypertension"),
        ("high_risk_threshold", "70"),
        ("med_risk_threshold", "40"),
        ("pdc_target", "80"),
        ("alerts_enabled", "true"),
        ("reminders_enabled", "true"),
        ("summary_enabled", "false"),
    ]
    cursor = conn.cursor()
    cursor.executemany(
        "INSERT INTO SETTINGS (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        settings,
    )
    conn.commit()
    print("  [OK] System settings & thresholds inserted")


if __name__ == "__main__":
    run()

"""
app/seed/backfill_therapy_outcomes.py
----------------------------------------
One-off backfill for the THERAPY_OUTCOME table, which no existing seeding
path (generate_synthetic_patients.py, import_ml_features_csv.py) ever
populates -- leaving persistency_months null everywhere it's read
(app/routers/patients.py, app/routers/dashboard.py).

Derives one THERAPY_OUTCOME row per patient from data that already exists:
  - PATIENT.enrollment_date      -> therapy_start_date
  - PATIENT.medication_status    -> event_observed / discontinuation_flag
  - latest ML_FEATURES snapshot  -> prediction_date, days_since_last_refill
                                     (used as a discontinuation-timing proxy),
                                     non_persistent_next_60d, side_effect flag

Patients with medication_status == "Discontinued" get a real event
(discontinuation_date, event_observed=1); everyone else is right-censored
at TODAY (still on therapy), matching the same TODAY anchor
generate_synthetic_patients.py used so persistence_days stays consistent
with the enrollment_date values already in PATIENT.

Run from backend/ directory:
    python -m app.seed.backfill_therapy_outcomes
"""

import sqlite3
from datetime import date, timedelta

from app.core.config import settings
from app.seed.generate_synthetic_patients import TODAY

BATCH_SIZE = 1000


def compute_outcome(patient: sqlite3.Row, latest_feature: sqlite3.Row | None) -> tuple:
    pid = patient["patient_id"]
    enrollment_date = patient["enrollment_date"]
    start = date.fromisoformat(enrollment_date) if enrollment_date else TODAY - timedelta(days=180)

    days_since_last_refill = (
        latest_feature["days_since_last_refill"]
        if latest_feature and latest_feature["days_since_last_refill"] is not None
        else 0
    )
    prediction_date = latest_feature["prediction_date"] if latest_feature else str(TODAY)
    non_persistent_next_60d = (
        latest_feature["non_persistent_next_60d"]
        if latest_feature and latest_feature["non_persistent_next_60d"] is not None
        else 0
    )
    side_effect_concern = 1 if (
        latest_feature and (latest_feature["side_effect_reported_count"] or 0) > 0
    ) else 0

    if patient["medication_status"] == "Discontinued":
        discontinuation_date = TODAY - timedelta(days=days_since_last_refill)
        if discontinuation_date < start:
            discontinuation_date = start
        persistence_days = max(1, (discontinuation_date - start).days)
        event_observed = 1
        discontinuation_flag = 1
        followup_end_date = discontinuation_date
        censoring_type = "event"
    else:
        persistence_days = max(1, (TODAY - start).days)
        event_observed = 0
        discontinuation_flag = 0
        discontinuation_date = None
        followup_end_date = TODAY
        censoring_type = "administrative"

    return (
        f"THO-{pid}", pid, str(start), prediction_date,
        None, str(followup_end_date), str(discontinuation_date) if discontinuation_date else None,
        discontinuation_flag, event_observed, persistence_days,
        censoring_type, non_persistent_next_60d, side_effect_concern,
        None,  # perceived_treatment_benefit -- not available for the synthetic cohort
    )


def run():
    db_path = settings.database_url
    print(f"[Backfill] Target DB: {db_path}")

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    existing = conn.execute("SELECT COUNT(*) FROM THERAPY_OUTCOME").fetchone()[0]
    print(f"[Backfill] THERAPY_OUTCOME currently has {existing:,} rows")

    patients = conn.execute(
        "SELECT patient_id, enrollment_date, medication_status FROM PATIENT"
    ).fetchall()
    print(f"[Backfill] {len(patients):,} patients to backfill")

    insert_sql = """
        INSERT OR IGNORE INTO THERAPY_OUTCOME (
            therapy_id, patient_id, therapy_start_date, prediction_date,
            prediction_window_end_date, followup_end_date, discontinuation_date,
            discontinuation_flag, event_observed, persistence_days,
            censoring_type, non_persistent_next_60d, side_effect_concern,
            perceived_treatment_benefit
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """

    batch = []
    inserted = 0
    discontinued_count = 0
    for i, patient in enumerate(patients, 1):
        latest_feature = conn.execute(
            """SELECT prediction_date, days_since_last_refill, non_persistent_next_60d,
                      side_effect_reported_count
               FROM ML_FEATURES WHERE patient_id = ?
               ORDER BY prediction_date DESC LIMIT 1""",
            (patient["patient_id"],),
        ).fetchone()

        row = compute_outcome(patient, latest_feature)
        if row[7] == 1:  # discontinuation_flag
            discontinued_count += 1
        batch.append(row)

        if len(batch) >= BATCH_SIZE:
            conn.executemany(insert_sql, batch)
            conn.commit()
            inserted += len(batch)
            batch.clear()
            print(f"  ... {i:,}/{len(patients):,} processed")

    if batch:
        conn.executemany(insert_sql, batch)
        conn.commit()
        inserted += len(batch)

    total = conn.execute("SELECT COUNT(*) FROM THERAPY_OUTCOME").fetchone()[0]
    conn.close()

    print(f"\n[OK] Inserted {inserted:,} THERAPY_OUTCOME rows "
          f"({discontinued_count:,} discontinued / {inserted - discontinued_count:,} still on therapy).")
    print(f"     THERAPY_OUTCOME now has {total:,} rows total.")


if __name__ == "__main__":
    run()

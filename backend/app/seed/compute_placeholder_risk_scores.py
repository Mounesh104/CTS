"""
app/seed/compute_placeholder_risk_scores.py
--------------------------------------------
Populates RISK_SCORE with a rule-based (NOT machine-learned) placeholder
score derived from each patient's latest ML_FEATURES snapshot, so the
dashboard/risk views have something to show while no real XGBoost/Cox PH
pipeline is wired up. Clearly tagged model_version="rule-based-placeholder-v1"
so it is never mistaken for genuine model output.

Run from backend/ directory:
    python -m app.seed.compute_placeholder_risk_scores
"""

import json
import sqlite3

from app.core.config import settings
from app.crud import settings as crud_settings

BATCH_SIZE = 5000

# Normalization ceilings derived from observed data ranges (see profiling run):
#   avg_refill_gap max ~31, avg_financial_burden max ~0.033, side_effect max ~3
REFILL_GAP_CEILING = 30.0
FINANCIAL_BURDEN_CEILING = 0.033
SIDE_EFFECT_CEILING = 3.0

WEIGHTS = {
    "missed_refill_rate": 0.25,
    "refill_gap": 0.15,
    "low_pdc": 0.20,
    "financial_burden": 0.10,
    "low_responsiveness": 0.10,
    "side_effects": 0.05,
    "discontinuation_signal": 0.15,
}

FACTOR_LABELS = {
    "missed_refill_rate": "Missed Refills",
    "refill_gap": "Refill Gap",
    "low_pdc": "Low Medication Adherence (PDC)",
    "financial_burden": "Financial Burden",
    "low_responsiveness": "Low Support Responsiveness",
    "side_effects": "Side Effects Reported",
    "discontinuation_signal": "Predicted Discontinuation Signal",
}


def clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))


def compute_score(row: dict) -> dict:
    components = {
        "missed_refill_rate": clamp(row["missed_refill_rate"] or 0.0),
        "refill_gap": clamp((row["avg_refill_gap"] or 0.0) / REFILL_GAP_CEILING),
        "low_pdc": clamp(1.0 - (row["pdc_all_history"] if row["pdc_all_history"] is not None else 1.0)),
        "financial_burden": clamp((row["avg_financial_burden"] or 0.0) / FINANCIAL_BURDEN_CEILING),
        "low_responsiveness": clamp(1.0 - (row["patient_response_rate"] if row["patient_response_rate"] is not None else 1.0)),
        "side_effects": clamp((row["side_effect_reported_count"] or 0) / SIDE_EFFECT_CEILING),
        "discontinuation_signal": clamp(float(row["non_persistent_next_60d"] or 0)),
    }

    weighted = {k: WEIGHTS[k] * v for k, v in components.items()}
    raw_score = clamp(sum(weighted.values()))

    top_factors = sorted(weighted.items(), key=lambda kv: kv[1], reverse=True)
    top_risk_factors = [
        {"factor": FACTOR_LABELS[k], "contribution": round(v, 3)}
        for k, v in top_factors if v > 0.01
    ][:4]

    return {
        "raw_score": raw_score,
        "top_risk_factors": top_risk_factors,
    }


def risk_band(score: float, high_thresh: float, med_thresh: float) -> str:
    if score >= high_thresh:
        return "High"
    if score >= med_thresh:
        return "Medium"
    return "Low"


def run():
    db_path = settings.database_url
    print(f"\n[RiskScore] Target DB: {db_path}")

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")

    settings_dict = crud_settings.get_all_settings(conn)
    high_thresh = float(settings_dict.get("high_risk_threshold", 70))
    med_thresh = float(settings_dict.get("med_risk_threshold", 40))
    print(f"[RiskScore] Thresholds -- High >= {high_thresh}, Medium >= {med_thresh}")

    conn.execute("DELETE FROM RISK_SCORE")
    conn.commit()

    cursor = conn.cursor()
    cursor.execute("""
        SELECT mf.patient_id, mf.prediction_date, mf.missed_refill_rate, mf.avg_refill_gap,
               mf.pdc_all_history, mf.avg_financial_burden, mf.patient_response_rate,
               mf.side_effect_reported_count, mf.non_persistent_next_60d
        FROM ML_FEATURES mf
        INNER JOIN (
            SELECT patient_id, MAX(prediction_date) as max_date
            FROM ML_FEATURES GROUP BY patient_id
        ) latest ON mf.patient_id = latest.patient_id AND mf.prediction_date = latest.max_date
    """)

    print("[RiskScore] Pass 1/2 -- computing raw weighted scores...")
    records = []
    for row in cursor:
        r = dict(row)
        result = compute_score(r)
        records.append((r["patient_id"], r["prediction_date"], result["raw_score"], result["top_risk_factors"]))

    raw_scores = [rec[2] for rec in records]
    raw_min, raw_max = min(raw_scores), max(raw_scores)
    span = raw_max - raw_min or 1.0
    print(f"[RiskScore] Raw score range: {raw_min:.3f} - {raw_max:.3f} -- rescaling to fill 0-100")

    insert_sql = """
        INSERT INTO RISK_SCORE (
            score_id, patient_id, score_date, risk_score, risk_band,
            top_risk_factors, estimated_time_to_discontinuation, model_version
        ) VALUES (?,?,?,?,?,?,?,?)
    """

    print("[RiskScore] Pass 2/2 -- rescaling, banding, and inserting...")
    batch = []
    total = 0
    band_counts = {"High": 0, "Medium": 0, "Low": 0}

    for patient_id, prediction_date, raw_score, top_risk_factors in records:
        scaled_score = round((raw_score - raw_min) / span * 100, 1)
        band = risk_band(scaled_score, high_thresh, med_thresh)
        band_counts[band] += 1
        estimated_time_to_discontinuation = round(max(7.0, 180.0 * (1 - scaled_score / 100.0)), 1)

        batch.append((
            f"RS-{patient_id}", patient_id, prediction_date,
            scaled_score, band, json.dumps(top_risk_factors),
            estimated_time_to_discontinuation, "rule-based-placeholder-v1",
        ))
        total += 1

        if len(batch) >= BATCH_SIZE:
            conn.executemany(insert_sql, batch)
            conn.commit()
            batch.clear()
            print(f"  ... {total:,} risk scores inserted")

    if batch:
        conn.executemany(insert_sql, batch)
        conn.commit()

    conn.close()
    print(f"\n[OK] Computed {total:,} placeholder risk scores.")
    print(f"     High: {band_counts['High']:,}  Medium: {band_counts['Medium']:,}  Low: {band_counts['Low']:,}\n")


if __name__ == "__main__":
    run()

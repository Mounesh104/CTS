-- =============================================================
-- PAPRS Database Schema
-- All tables use CREATE TABLE IF NOT EXISTS.
-- Foreign keys enforce ON DELETE CASCADE from PATIENT.
-- =============================================================

PRAGMA foreign_keys = ON;

-- -------------------------------------------------------------
-- 1. PATIENT (primary entity)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS PATIENT (
    patient_id              TEXT PRIMARY KEY,
    age                     INTEGER,
    gender                  TEXT,
    bmi                     REAL,
    smoking_status          TEXT,
    alcohol_use             TEXT,
    physical_activity       TEXT,
    income_range            TEXT,
    education_level         TEXT,
    health_literacy_score   REAL,
    state                   TEXT,
    locality_type           TEXT,
    care_sector             TEXT,
    comorbidity_count       INTEGER,
    diabetes_flag           INTEGER DEFAULT 0,
    disease_duration        REAL,
    diagnosis_age           REAL,
    forgetfulness_propensity REAL,
    baseline_bp_control     INTEGER DEFAULT 0,
    diagnosis               TEXT,
    enrollment_date         TEXT,
    medication_status       TEXT
);

-- -------------------------------------------------------------
-- 2. PHARMACY_CLAIM (refill history)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS PHARMACY_CLAIM (
    claim_id                TEXT PRIMARY KEY,
    patient_id              TEXT NOT NULL,
    drug_id                 TEXT,
    dispense_date           TEXT,
    expected_refill_date    TEXT,
    refill_date             TEXT,
    days_supply             INTEGER,
    quantity_dispensed      INTEGER,
    refill_gap_days         INTEGER DEFAULT 0,
    missed_refill_flag      INTEGER DEFAULT 0,
    refill_cause            TEXT,
    stockout_flag           INTEGER DEFAULT 0,
    pharmacy_id             TEXT,
    claim_status            TEXT,
    copay_amount_inr        REAL,
    financial_burden        REAL,
    refill_number           INTEGER,
    FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_claim_patient_id   ON PHARMACY_CLAIM(patient_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_claim_dispense_date ON PHARMACY_CLAIM(dispense_date);

-- -------------------------------------------------------------
-- 3. SUPPORT_EVENT (support interactions)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS SUPPORT_EVENT (
    support_id                  TEXT PRIMARY KEY,
    patient_id                  TEXT NOT NULL,
    contact_date                TEXT,
    contact_type                TEXT,
    channel                     TEXT,
    contact_outcome             TEXT,
    refill_reminder_sent        INTEGER DEFAULT 0,
    patient_response_flag       INTEGER DEFAULT 0,
    side_effect_reported        INTEGER DEFAULT 0,
    financial_assistance_flag   INTEGER DEFAULT 0,
    intervention_type           TEXT,
    intervention_outcome        TEXT,
    FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_support_event_patient_id  ON SUPPORT_EVENT(patient_id);
CREATE INDEX IF NOT EXISTS idx_support_event_contact_date ON SUPPORT_EVENT(contact_date);

-- -------------------------------------------------------------
-- 4. INSURANCE (policy / coverage)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS INSURANCE (
    policy_id               TEXT PRIMARY KEY,
    patient_id              TEXT NOT NULL,
    insurance_vendor_name   TEXT,
    coverage_type           TEXT,
    annual_contribution     REAL,
    claim_amount            REAL,
    claim_status            TEXT,
    copay_amount            REAL,
    out_of_pocket_amount    REAL,
    drug_coverage_flag      INTEGER DEFAULT 0,
    prior_auth_flag         INTEGER DEFAULT 0,
    monthly_income_inr      REAL,
    FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_insurance_patient_id ON INSURANCE(patient_id);

-- -------------------------------------------------------------
-- 5. ML_FEATURES (engineered features — written by ML pipeline)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ML_FEATURES (
    feature_id                          TEXT PRIMARY KEY,
    patient_id                          TEXT NOT NULL,
    prediction_date                     TEXT,
    perceived_treatment_benefit         REAL,
    total_refills                       INTEGER,
    missed_refills                      INTEGER,
    missed_refill_rate                  REAL,
    avg_refill_gap                      REAL,
    max_refill_gap                      REAL,
    pdc_30d                             REAL,
    pdc_60d                             REAL,
    pdc_90d                             REAL,
    pdc_all_history                     REAL,
    avg_financial_burden                REAL,
    missed_refill_rate_recent_30d       REAL,
    missed_refill_rate_previous_30d     REAL,
    missed_refill_rate_change_30d       REAL,
    avg_refill_gap_recent_30d           REAL,
    avg_refill_gap_previous_30d         REAL,
    avg_refill_gap_change_30d           REAL,
    pdc_recent_30d                      REAL,
    pdc_previous_30d                    REAL,
    pdc_change_30d                      REAL,
    pdc_trend                           REAL,
    missed_refill_rate_trend            REAL,
    avg_refill_gap_trend                REAL,
    refill_frequency_trend              REAL,
    days_since_last_refill              INTEGER,
    days_since_last_missed_refill       INTEGER,
    days_since_last_support             INTEGER,
    days_since_last_prescription        INTEGER,
    medication_count                    INTEGER,
    unique_drug_classes                 INTEGER,
    twice_daily_drug_count              INTEGER,
    regimen_complexity_score            REAL,
    treatment_change_count              INTEGER,
    days_since_treatment_change         INTEGER,
    medication_count_recent_30d         INTEGER,
    medication_count_change             INTEGER,
    drug_class_count_recent_30d         INTEGER,
    drug_class_count_change             INTEGER,
    regimen_complexity_recent_30d       REAL,
    regimen_complexity_change           REAL,
    medication_added_count              INTEGER,
    support_contact_count               INTEGER,
    support_contact_count_recent_30d    INTEGER,
    support_contact_count_previous_30d  INTEGER,
    support_contact_change              INTEGER,
    patient_response_rate               REAL,
    response_rate_recent_30d            REAL,
    response_rate_previous_30d          REAL,
    response_rate_change                REAL,
    side_effect_reported_count          INTEGER,
    financial_assistance_count          INTEGER,
    refill_reminder_count               INTEGER,
    non_persistent_next_60d             INTEGER DEFAULT 0,
    FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ml_features_patient_id    ON ML_FEATURES(patient_id);
CREATE INDEX IF NOT EXISTS idx_ml_features_prediction_date ON ML_FEATURES(prediction_date);
CREATE INDEX IF NOT EXISTS idx_ml_features_patient_date   ON ML_FEATURES(patient_id, prediction_date);

-- -------------------------------------------------------------
-- 6. THERAPY_OUTCOME (labeled outcomes — written by ML pipeline)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS THERAPY_OUTCOME (
    therapy_id                  TEXT PRIMARY KEY,
    patient_id                  TEXT NOT NULL,
    therapy_start_date          TEXT,
    prediction_date             TEXT,
    prediction_window_end_date  TEXT,
    followup_end_date           TEXT,
    discontinuation_date        TEXT,
    discontinuation_flag        INTEGER DEFAULT 0,
    event_observed              INTEGER DEFAULT 0,
    persistence_days            INTEGER,
    censoring_type              TEXT,
    non_persistent_next_60d     INTEGER DEFAULT 0,
    side_effect_concern         INTEGER DEFAULT 0,
    perceived_treatment_benefit REAL,
    FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_therapy_outcome_patient_id    ON THERAPY_OUTCOME(patient_id);
CREATE INDEX IF NOT EXISTS idx_therapy_outcome_prediction_date ON THERAPY_OUTCOME(prediction_date);

-- -------------------------------------------------------------
-- 7. RISK_SCORE (ML model outputs — written by ML pipeline)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS RISK_SCORE (
    score_id                            TEXT PRIMARY KEY,
    patient_id                          TEXT NOT NULL,
    score_date                          TEXT,
    risk_score                          REAL,
    risk_band                           TEXT,
    top_risk_factors                    TEXT,  -- JSON array string
    estimated_time_to_discontinuation   REAL,
    model_version                       TEXT,
    FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_risk_score_patient_id ON RISK_SCORE(patient_id);
CREATE INDEX IF NOT EXISTS idx_risk_score_score_date  ON RISK_SCORE(score_date);
CREATE INDEX IF NOT EXISTS idx_risk_score_patient_date ON RISK_SCORE(patient_id, score_date);

-- -------------------------------------------------------------
-- 8. ACTION_RULES (configurable risk → action mapping)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ACTION_RULES (
    rule_id             TEXT PRIMARY KEY,
    risk_band           TEXT NOT NULL,
    recommended_action  TEXT NOT NULL,
    reason              TEXT,
    priority            TEXT
);

-- -------------------------------------------------------------
-- 9. OUTCOME_LOG (intervention outcomes logged by care managers)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS OUTCOME_LOG (
    outcome_id              TEXT PRIMARY KEY,
    patient_id              TEXT NOT NULL,
    intervention_performed  TEXT,
    intervention_date       TEXT,
    intervention_channel    TEXT,
    patient_response        TEXT,
    outcome_recorded        TEXT,
    created_at              TEXT,
    FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_outcome_log_patient_id ON OUTCOME_LOG(patient_id);

-- -------------------------------------------------------------
-- 10. MODEL_METRICS (performance metrics — written by ML pipeline)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS MODEL_METRICS (
    metric_id           TEXT PRIMARY KEY,
    evaluation_date     TEXT,
    accuracy            REAL,
    auc                 REAL,
    c_index             REAL,
    drift_score         REAL,
    model_version       TEXT,
    retrain_triggered   INTEGER DEFAULT 0,
    notes               TEXT
);

-- -------------------------------------------------------------
-- 11. SETTINGS (system configuration and thresholds)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS SETTINGS (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- -------------------------------------------------------------
-- 12. USERS (care manager accounts — signup/login/profile)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS USERS (
    user_id         TEXT PRIMARY KEY,
    full_name       TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    password_salt   TEXT NOT NULL,
    organization    TEXT,
    role            TEXT,
    created_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON USERS(email);


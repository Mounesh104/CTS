"""
app/core/risk_bands.py
------------------------
Single source of truth for the 4-tier risk banding logic
(Low / Moderate / High / Critical), used by every endpoint that derives a
risk band from a risk_score so thresholds never drift out of sync between
the dashboard, patient profile, and risk-score endpoints.
"""

BANDS = ("Low", "Moderate", "High", "Critical")

DEFAULT_THRESHOLDS = {
    "moderate_risk_threshold": 38.0,
    "high_risk_threshold": 56.0,
    "critical_risk_threshold": 67.0,
}


def get_thresholds(settings_dict: dict) -> dict:
    return {
        "moderate_risk_threshold": float(settings_dict.get("moderate_risk_threshold", DEFAULT_THRESHOLDS["moderate_risk_threshold"])),
        "high_risk_threshold": float(settings_dict.get("high_risk_threshold", DEFAULT_THRESHOLDS["high_risk_threshold"])),
        "critical_risk_threshold": float(settings_dict.get("critical_risk_threshold", DEFAULT_THRESHOLDS["critical_risk_threshold"])),
    }


def band_for_score(score: float, thresholds: dict) -> str:
    if score is None:
        return None
    if score >= thresholds["critical_risk_threshold"]:
        return "Critical"
    if score >= thresholds["high_risk_threshold"]:
        return "High"
    if score >= thresholds["moderate_risk_threshold"]:
        return "Moderate"
    return "Low"

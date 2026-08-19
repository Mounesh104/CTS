"""
tests/test_actions.py
---------------------
Tests for the /actions endpoints:
  - GET /actions/{patient_id} — rule-based action lookup
  - GET /actions/rules — list all rules
  - PUT /actions/rules — replace all rules
"""
import pytest
from tests.conftest import make_patient, make_risk_score


def _setup_patient_with_risk(client, pid: str, risk_score: float, risk_band: str):
    """Helper: create patient + store a risk score."""
    client.post("/patients", json=make_patient(pid))
    client.post("/risk/scores", json=make_risk_score(
        pid, score_id=f"RS_{pid}", risk_score=risk_score, risk_band=risk_band
    ))


class TestGetPatientAction:
    def test_high_risk_patient_gets_action(self, client):
        _setup_patient_with_risk(client, "PT_ACT_HIGH", 82.0, "High")
        resp = client.get("/actions/PT_ACT_HIGH")
        assert resp.status_code == 200
        data = resp.json()
        assert data["patient_id"] == "PT_ACT_HIGH"
        assert data["risk_band"] == "High"
        assert data["recommended_action"] is not None
        assert data["reason"] is not None

    def test_medium_risk_patient_gets_action(self, client):
        _setup_patient_with_risk(client, "PT_ACT_MED", 55.0, "Medium")
        resp = client.get("/actions/PT_ACT_MED")
        assert resp.status_code == 200
        data = resp.json()
        assert data["risk_band"] == "Medium"
        assert data["recommended_action"] is not None

    def test_low_risk_patient_gets_action(self, client):
        _setup_patient_with_risk(client, "PT_ACT_LOW", 20.0, "Low")
        resp = client.get("/actions/PT_ACT_LOW")
        assert resp.status_code == 200
        data = resp.json()
        assert data["risk_band"] == "Low"
        assert data["recommended_action"] == "Routine Monitoring"

    def test_patient_not_found_returns_404(self, client):
        resp = client.get("/actions/GHOST_PATIENT")
        assert resp.status_code == 404

    def test_patient_without_risk_score_returns_404(self, client):
        client.post("/patients", json=make_patient("PT_NO_RISK"))
        resp = client.get("/actions/PT_NO_RISK")
        assert resp.status_code == 404
        assert "risk score" in resp.json()["detail"].lower()

    def test_response_has_all_required_fields(self, client):
        _setup_patient_with_risk(client, "PT_ACT_FIELDS", 75.0, "High")
        resp = client.get("/actions/PT_ACT_FIELDS")
        data = resp.json()
        for field in ["patient_id", "risk_band", "risk_score", "recommended_action", "reason", "priority"]:
            assert field in data, f"Missing field: {field}"


class TestListActionRules:
    def test_get_rules_returns_list(self, client):
        resp = client.get("/actions/rules")
        assert resp.status_code == 200
        rules = resp.json()
        assert isinstance(rules, list)
        assert len(rules) >= 3  # seeded in conftest

    def test_rules_have_required_fields(self, client):
        rules = client.get("/actions/rules").json()
        for rule in rules:
            assert "rule_id" in rule
            assert "risk_band" in rule
            assert "recommended_action" in rule

    def test_rules_cover_all_bands(self, client):
        rules = client.get("/actions/rules").json()
        bands = {r["risk_band"] for r in rules}
        assert "High" in bands
        assert "Medium" in bands
        assert "Low" in bands


class TestUpdateActionRules:
    def test_replace_rules_success(self, client):
        new_rules = {
            "rules": [
                {"rule_id": "NEW_R1", "risk_band": "High",   "recommended_action": "Emergency Call",
                 "reason": "Critical patient.",     "priority": "Critical"},
                {"rule_id": "NEW_R2", "risk_band": "Medium", "recommended_action": "WhatsApp Reminder",
                 "reason": "Moderate gaps.",        "priority": "Medium"},
                {"rule_id": "NEW_R3", "risk_band": "Low",    "recommended_action": "Monthly Check",
                 "reason": "All good.",             "priority": "Low"},
            ]
        }
        resp = client.put("/actions/rules", json=new_rules)
        assert resp.status_code == 200
        updated = resp.json()
        actions = {r["recommended_action"] for r in updated}
        assert "Emergency Call" in actions
        assert "WhatsApp Reminder" in actions

    def test_replace_rules_updates_patient_action(self, client):
        # Setup a high-risk patient
        _setup_patient_with_risk(client, "PT_RULE_CHG", 80.0, "High")

        # Change the High rule
        client.put("/actions/rules", json={"rules": [
            {"rule_id": "NEW_HIGH", "risk_band": "High",   "recommended_action": "Urgent Callback",
             "reason": "High risk.", "priority": "Critical"},
            {"rule_id": "NEW_MED",  "risk_band": "Medium", "recommended_action": "SMS",
             "reason": "Moderate.", "priority": "Medium"},
            {"rule_id": "NEW_LOW",  "risk_band": "Low",    "recommended_action": "Monitor",
             "reason": "Stable.",   "priority": "Low"},
        ]})

        # Now check that the action reflects the new rule
        resp = client.get("/actions/PT_RULE_CHG")
        assert resp.json()["recommended_action"] == "Urgent Callback"

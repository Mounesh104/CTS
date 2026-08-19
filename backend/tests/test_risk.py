"""
tests/test_risk.py
------------------
Tests for the /risk endpoints (store and retrieve ML risk scores).
"""
import pytest
from tests.conftest import make_patient, make_risk_score


class TestStoreRiskScore:
    def _setup_patient(self, client, pid="PT_RISK"):
        client.post("/patients", json=make_patient(pid))
        return pid

    def test_store_risk_score_success(self, client):
        pid = self._setup_patient(client)
        resp = client.post("/risk/scores", json=make_risk_score(pid))
        assert resp.status_code == 201
        data = resp.json()
        assert data["patient_id"] == pid
        assert data["risk_score"] == 82.0
        assert data["risk_band"] == "High"
        assert isinstance(data["top_risk_factors"], list)
        assert data["top_risk_factors"][0]["factor"] == "Refill Gap"

    def test_store_score_patient_not_found(self, client):
        resp = client.post("/risk/scores", json=make_risk_score("NONEXISTENT"))
        assert resp.status_code == 404

    def test_store_score_invalid_band(self, client):
        pid = self._setup_patient(client, "PT_RISK_BAD")
        bad = make_risk_score(pid)
        bad["risk_band"] = "Critical"  # invalid
        resp = client.post("/risk/scores", json=bad)
        assert resp.status_code == 422

    def test_store_score_invalid_score_range(self, client):
        pid = self._setup_patient(client, "PT_RISK_RANGE")
        bad = make_risk_score(pid)
        bad["risk_score"] = 150.0  # out of range
        resp = client.post("/risk/scores", json=bad)
        assert resp.status_code == 422

    def test_store_score_autosets_date(self, client):
        pid = self._setup_patient(client, "PT_RISK_DATE")
        payload = make_risk_score(pid, score_id="RS_DATE")
        del payload["score_date"]  # omit date
        resp = client.post("/risk/scores", json=payload)
        assert resp.status_code == 201
        assert resp.json()["score_date"] is not None


class TestGetLatestRiskScore:
    def test_get_latest(self, client):
        pid = "PT_RISK_LAT"
        client.post("/patients", json=make_patient(pid))
        client.post("/risk/scores", json=make_risk_score(pid, "RS_LAT_1", risk_score=60.0, risk_band="Medium"))
        client.post("/risk/scores", json=make_risk_score(pid, "RS_LAT_2", risk_score=80.0, risk_band="High"))

        resp = client.get(f"/risk/{pid}")
        assert resp.status_code == 200
        # Should return the highest-date score (latest)
        assert resp.json()["patient_id"] == pid

    def test_get_latest_no_score_404(self, client):
        client.post("/patients", json=make_patient("PT_RISK_NONE"))
        resp = client.get("/risk/PT_RISK_NONE")
        assert resp.status_code == 404

    def test_get_latest_patient_not_found(self, client):
        resp = client.get("/risk/GHOST_PATIENT")
        assert resp.status_code == 404


class TestRiskScoreHistory:
    def test_history_returns_all_scores(self, client):
        pid = "PT_RISK_HIST"
        client.post("/patients", json=make_patient(pid))
        for i in range(3):
            client.post("/risk/scores", json=make_risk_score(pid, f"RS_HIST_{i}", risk_score=50.0 + i * 10))
        resp = client.get(f"/risk/{pid}/history")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 3
        assert len(data["items"]) == 3

    def test_history_pagination(self, client):
        pid = "PT_RISK_PAGE"
        client.post("/patients", json=make_patient(pid))
        for i in range(5):
            client.post("/risk/scores", json=make_risk_score(pid, f"RS_PAGE_{i}"))
        resp = client.get(f"/risk/{pid}/history?limit=2&offset=0")
        assert resp.status_code == 200
        assert len(resp.json()["items"]) == 2


class TestBulkRiskScores:
    def test_bulk_store(self, client):
        for i in range(3):
            client.post("/patients", json=make_patient(f"PT_BULK_RISK_{i}"))

        payload = {
            "scores": [
                make_risk_score(f"PT_BULK_RISK_{i}", f"RS_BULK_{i}")
                for i in range(3)
            ]
        }
        resp = client.post("/risk/scores/bulk", json=payload)
        assert resp.status_code == 201
        assert resp.json()["inserted"] == 3

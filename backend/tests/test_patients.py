"""
tests/test_patients.py
-----------------------
Tests for PATIENT entity CRUD via the /patients endpoints.
"""
import pytest
from tests.conftest import make_patient


class TestCreatePatient:
    def test_create_success(self, client):
        resp = client.post("/patients", json=make_patient("PT001"))
        assert resp.status_code == 201
        data = resp.json()
        assert data["patient_id"] == "PT001"
        assert data["age"] == 45
        assert data["diagnosis"] == "Hypertension"

    def test_create_duplicate_returns_409(self, client):
        client.post("/patients", json=make_patient("PT001"))
        resp = client.post("/patients", json=make_patient("PT001"))
        assert resp.status_code == 409

    def test_create_minimal_patient(self, client):
        resp = client.post("/patients", json={"patient_id": "PT_MIN"})
        assert resp.status_code == 201
        assert resp.json()["patient_id"] == "PT_MIN"


class TestGetPatient:
    def test_get_existing(self, client):
        client.post("/patients", json=make_patient("PT002"))
        resp = client.get("/patients/PT002")
        assert resp.status_code == 200
        assert resp.json()["patient_id"] == "PT002"

    def test_get_missing_returns_404(self, client):
        resp = client.get("/patients/DOES_NOT_EXIST")
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()


class TestListPatients:
    def test_list_returns_all(self, client):
        client.post("/patients", json=make_patient("PT_A"))
        client.post("/patients", json=make_patient("PT_B"))
        resp = client.get("/patients?limit=10&offset=0")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 2
        assert isinstance(data["items"], list)

    def test_pagination(self, client):
        for i in range(5):
            client.post("/patients", json=make_patient(f"PT_PAG_{i}"))
        resp = client.get("/patients?limit=2&offset=0")
        assert len(resp.json()["items"]) <= 2

    def test_filter_by_diagnosis(self, client):
        p = make_patient("PT_DIAG")
        p["diagnosis"] = "Asthma"
        client.post("/patients", json=p)
        resp = client.get("/patients?diagnosis=Asthma")
        items = resp.json()["items"]
        assert all(i["diagnosis"] == "Asthma" for i in items)


class TestUpdatePatient:
    def test_put_updates_fields(self, client):
        client.post("/patients", json=make_patient("PT_UPD"))
        resp = client.put("/patients/PT_UPD", json={"age": 55, "gender": "Male"})
        assert resp.status_code == 200
        assert resp.json()["age"] == 55

    def test_patch_partial_update(self, client):
        client.post("/patients", json=make_patient("PT_PAT"))
        resp = client.patch("/patients/PT_PAT", json={"bmi": 30.0})
        assert resp.status_code == 200
        assert resp.json()["bmi"] == 30.0

    def test_update_missing_returns_404(self, client):
        resp = client.put("/patients/MISSING", json={"age": 50})
        assert resp.status_code == 404


class TestDeletePatient:
    def test_delete_success(self, client):
        client.post("/patients", json=make_patient("PT_DEL"))
        resp = client.delete("/patients/PT_DEL")
        assert resp.status_code == 204

    def test_delete_nonexistent_returns_404(self, client):
        resp = client.delete("/patients/GHOST")
        assert resp.status_code == 404


class TestBulkCreatePatients:
    def test_bulk_insert(self, client):
        patients = [make_patient(f"PT_BULK_{i}") for i in range(5)]
        resp = client.post("/patients/bulk", json=patients)
        assert resp.status_code == 201
        assert resp.json()["inserted"] >= 1


class TestFullProfile:
    def test_full_profile_returns_shape(self, client):
        # Create patient
        p = make_patient("PT_FP")
        client.post("/patients", json=p)

        # POST a risk score so profile has risk data
        client.post("/risk/scores", json={
            "score_id": "RS_FP_001",
            "patient_id": "PT_FP",
            "score_date": "2026-08-01",
            "risk_score": 75.0,
            "risk_band": "High",
            "top_risk_factors": [{"factor": "Refill Gap", "contribution": 0.31}],
            "estimated_time_to_discontinuation": 45.0,
            "model_version": "v1.2",
        })

        resp = client.get("/patients/PT_FP/full-profile")
        assert resp.status_code == 200
        data = resp.json()
        assert data["patient_id"] == "PT_FP"
        assert "risk_score" in data
        assert "top_risk_factors" in data
        assert "intervention_history" in data
        assert isinstance(data["comorbidities"], list)

    def test_full_profile_missing_patient_404(self, client):
        resp = client.get("/patients/NONEXISTENT/full-profile")
        assert resp.status_code == 404

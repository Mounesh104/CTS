"""
app/ml/run_predictions_all_patients.py
----------------------------------------
Calls POST /risk/{patient_id}/predict for every patient in the database,
row by row, so the RISK_SCORE table gets real XGBoost + Cox PH output
instead of the synthetic-v1 placeholder.

Requires the API server to already be running (does NOT call the model
in-process -- goes through the real HTTP endpoint, same as the frontend).

Run from backend/ directory (with the venv active), server running separately:
    python -m app.ml.run_predictions_all_patients
    python -m app.ml.run_predictions_all_patients --base-url http://localhost:8000 --workers 8
"""

import argparse
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

import httpx

PAGE_SIZE = 100


def fetch_all_patient_ids(client: httpx.Client) -> list[str]:
    ids = []
    offset = 0
    while True:
        resp = client.get("/patients", params={"limit": PAGE_SIZE, "offset": offset})
        resp.raise_for_status()
        data = resp.json()
        items = data["items"]
        ids.extend(item["patient_id"] for item in items)
        offset += PAGE_SIZE
        if offset >= data["total"] or not items:
            break
    return ids


def predict_one(client: httpx.Client, patient_id: str) -> tuple[str, str, str]:
    """Returns (patient_id, outcome, detail)."""
    try:
        resp = client.post(f"/risk/{patient_id}/predict")
    except httpx.HTTPError as exc:
        return patient_id, "error", str(exc)

    if resp.status_code == 201:
        model_version = resp.json().get("model_version", "unknown")
        return patient_id, "ok", model_version
    if resp.status_code == 422:
        return patient_id, "no_features", resp.text
    if resp.status_code == 404:
        return patient_id, "not_found", resp.text
    if resp.status_code == 503:
        return patient_id, "model_unavailable", resp.text
    return patient_id, "error", f"HTTP {resp.status_code}: {resp.text}"


def run(base_url: str, workers: int, timeout: float):
    with httpx.Client(base_url=base_url, timeout=timeout) as client:
        print(f"[predict-all] Fetching patient list from {base_url}/patients ...")
        patient_ids = fetch_all_patient_ids(client)
        print(f"[predict-all] {len(patient_ids):,} patients to score, {workers} workers")

        counts: dict[str, int] = {}
        model_versions: dict[str, int] = {}
        failures: list[tuple[str, str]] = []
        done = 0

        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = {
                pool.submit(predict_one, client, pid): pid for pid in patient_ids
            }
            for future in as_completed(futures):
                patient_id, outcome, detail = future.result()
                counts[outcome] = counts.get(outcome, 0) + 1
                if outcome == "ok":
                    model_versions[detail] = model_versions.get(detail, 0) + 1
                else:
                    failures.append((patient_id, f"{outcome}: {detail}"))

                done += 1
                if done % 100 == 0 or done == len(patient_ids):
                    print(f"[predict-all] {done:,}/{len(patient_ids):,} done  ({counts})")

    print("\n[predict-all] Summary")
    print("  Outcomes:", counts)
    print("  Model versions returned:", model_versions)
    if failures:
        print(f"\n  {len(failures)} failures (showing first 20):")
        for pid, msg in failures[:20]:
            print(f"    {pid}: {msg}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://localhost:8000",
                        help="Base URL of the running API server")
    parser.add_argument("--workers", type=int, default=8,
                        help="Number of concurrent requests")
    parser.add_argument("--timeout", type=float, default=30.0,
                        help="Per-request timeout in seconds")
    args = parser.parse_args()

    try:
        run(args.base_url, args.workers, args.timeout)
    except httpx.ConnectError:
        print(f"[predict-all] Could not connect to {args.base_url} -- is the API server running?")
        sys.exit(1)

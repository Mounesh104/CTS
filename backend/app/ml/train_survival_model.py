"""
app/ml/train_survival_model.py
--------------------------------
Trains the Cox PH survival model (app/ml/survival_model.py) and saves it.

Runs the same pipeline as `python -m app.ml.survival_model`, but through a
proper module entry point so PersistencySurvivalModel pickles with
__module__="app.ml.survival_model" instead of "__main__" -- required for
joblib.load() to work from any other process (e.g. the FastAPI server).

Run from backend/ directory:
    python -m app.ml.train_survival_model
"""

import os

from app.ml import survival_model as sm


def run():
    data = sm.build_dataset()
    (cph, calibrators, train_df, test_df, train_c, test_c,
     feature_cols, best_pen) = sm.fit_model(data)

    print(f"\nTrain Global C-index: {train_c:.4f}")
    print(f"Test  Global C-index: {test_c:.4f}")

    model = sm.PersistencySurvivalModel(cph, feature_cols, calibrators)
    model_path = os.path.join(sm.OUTPUT, "persistency_survival_model.joblib")
    model.save(model_path)
    print(f"Saved: {model_path}")


if __name__ == "__main__":
    run()

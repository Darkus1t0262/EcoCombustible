import os
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from train import train_model
from features import build_features


MODEL_PATH = os.getenv("MODEL_PATH", "models/tx_model.joblib")
MODEL_VERSION = os.getenv("MODEL_VERSION", "tx-risk-v1")
TRAIN_ON_START = os.getenv("TRAIN_ON_START", "true").lower() in ("1", "true", "yes")

app = FastAPI(title="EcoCombustible ML", version=MODEL_VERSION)
model = None


class TransactionPayload(BaseModel):
    liters: float = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)
    total_amount: float = Field(..., gt=0)
    capacity_liters: Optional[float] = Field(default=None, gt=0)


def load_model():
    global model
    model_path = Path(MODEL_PATH)
    if model_path.exists():
        model = joblib.load(model_path)
        return

    if not TRAIN_ON_START:
        raise RuntimeError("Model not found and TRAIN_ON_START is disabled.")

    model = train_model()
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_path)


@app.on_event("startup")
def startup():
    load_model()


@app.get("/health")
def health():
    return {"ok": True, "model_version": MODEL_VERSION}


@app.post("/predict")
def predict(payload: TransactionPayload):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    features = build_features(
        liters=payload.liters,
        unit_price=payload.unit_price,
        total_amount=payload.total_amount,
        capacity_liters=payload.capacity_liters,
    )
    vector = np.array([features], dtype=float)

    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(vector)[0][1]
        score = float(max(0.0, min(1.0, proba)))
    else:
        score = float(model.decision_function(vector)[0])
        score = float(1 / (1 + np.exp(-score)))

    if score >= 0.7:
        label = "high"
    elif score >= 0.4:
        label = "medium"
    else:
        label = "low"

    return {"risk_score": score, "risk_label": label, "model_version": MODEL_VERSION}

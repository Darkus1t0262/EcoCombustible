import argparse
from pathlib import Path

import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


def build_dataset(samples: int, seed: int):
    # Genera un dataset sintetico con patrones normales y anomalias.
    rng = np.random.default_rng(seed)
    capacity = rng.normal(95, 20, samples)
    capacity = np.clip(capacity, 40, 160)
    liters = capacity * rng.normal(0.6, 0.15, samples)
    unit_price = rng.normal(2.55, 0.08, samples)
    total_amount = liters * unit_price
    ratio = liters / capacity

    # Etiquetas iniciales por reglas simples.
    labels = (
        (ratio > 1.1)
        | (ratio < 0.15)
        | (unit_price > 2.9)
        | (unit_price < 2.2)
    ).astype(int)

    # Inyecta anomalias para balancear clases.
    anomalies = max(20, int(samples * 0.1))
    for _ in range(anomalies):
        idx = rng.integers(0, samples)
        liters[idx] = capacity[idx] * rng.uniform(1.2, 1.8)
        unit_price[idx] = rng.uniform(2.9, 3.4)
        total_amount[idx] = liters[idx] * unit_price[idx]
        ratio[idx] = liters[idx] / capacity[idx]
        labels[idx] = 1

    features = np.column_stack([liters, unit_price, total_amount, capacity, ratio])
    return features, labels


def train_model(samples: int = 600, seed: int = 42):
    # Pipeline simple: escalado + regresion logistica.
    features, labels = build_dataset(samples, seed)
    pipeline = Pipeline(
        [
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(max_iter=500, class_weight="balanced")),
        ]
    )
    pipeline.fit(features, labels)
    return pipeline


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-path", default="models/tx_model.joblib")
    parser.add_argument("--samples", type=int, default=600)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    model = train_model(samples=args.samples, seed=args.seed)
    model_path = Path(args.model_path)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")


if __name__ == "__main__":
    main()

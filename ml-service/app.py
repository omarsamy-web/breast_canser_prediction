from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import os
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Optional shared-secret: when ML_ACCESS_TOKEN is set, every request must
# present it in the X-ML-Token header. The Node backend sends it automatically.
ML_ACCESS_TOKEN = os.environ.get("ML_ACCESS_TOKEN", "")
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
DEFAULT_DATASET = PROJECT_DIR / "breast_cancer_40_features_1M.csv"
SAVED_MODELS_DIR = BASE_DIR / "saved_models"
METRICS_DIR = BASE_DIR / "models"
BEST_MODEL_PATH = SAVED_MODELS_DIR / "best_model.joblib"
METRICS_PATH = METRICS_DIR / "metrics.joblib"

# Cap training rows so the 1M-row dataset trains in minutes, not hours.
MAX_TRAIN_ROWS = int(os.environ.get("MAX_TRAIN_ROWS") or os.environ.get("MAX_TRAINING_ROWS") or "100000")

for directory in [SAVED_MODELS_DIR, METRICS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Breast Cancer Notebook ML Service", version="4.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def token_guard(request, call_next):
    # Health checks stay public for platform probes; every other route
    # requires the shared secret when ML_ACCESS_TOKEN is configured.
    if ML_ACCESS_TOKEN and request.url.path not in ("/", "/health"):
        if request.headers.get("x-ml-token") != ML_ACCESS_TOKEN:
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=401, content={"detail": "Invalid or missing X-ML-Token"})
    return await call_next(request)


class TrainRequest(BaseModel):
    algorithm: str = "all"
    datasetPath: Optional[str] = None
    hyperparameters: Dict[str, Any] = {}


class PredictRequest(BaseModel):
    features: List[float]
    model: Optional[str] = None


class AnalyzeRequest(BaseModel):
    path: Optional[str] = None


def resolve_dataset(path: Optional[str]) -> Path:
    if path:
        # Security: never allow absolute paths or traversal outside the project.
        raw = Path(path)
        if raw.is_absolute() or ".." in raw.parts:
            raise HTTPException(status_code=400, detail="Invalid dataset path")
        dataset_path = raw
        if (BASE_DIR / dataset_path).exists():
            return BASE_DIR / dataset_path
        if (PROJECT_DIR / dataset_path).exists():
            return PROJECT_DIR / dataset_path
        dataset_path = PROJECT_DIR / dataset_path
        if dataset_path.exists():
            return dataset_path

    candidates = [
        PROJECT_DIR / "breast_cancer_40_features_1M.csv",
        BASE_DIR / "breast_cancer_40_features_1M.csv",
        BASE_DIR / "datasets" / "breast_cancer_40_features_1M.csv",
        BASE_DIR / "datasets" / "breast_cancer_edited.csv",
        BASE_DIR / "breast_cancer_edited.csv",
        PROJECT_DIR / "breast_cancer_edited.csv",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate

    raise HTTPException(status_code=404, detail="Dataset file not found.")


def encode_diagnosis(series: pd.Series) -> np.ndarray:
    if pd.api.types.is_numeric_dtype(series):
        return series.astype(int).to_numpy()

    mapped = series.astype(str).str.strip().str.upper().map({"B": 0, "BENIGN": 0, "0": 0, "M": 1, "MALIGNANT": 1, "1": 1})
    if mapped.isna().any():
        raise HTTPException(status_code=400, detail="diagnosis must contain B/M, Benign/Malignant, or 0/1 values")
    return mapped.astype(int).to_numpy()


def load_training_data(path: Optional[str]):
    df = pd.read_csv(resolve_dataset(path))
    if "diagnosis" not in df.columns:
        raise HTTPException(status_code=400, detail="CSV must contain a diagnosis column")

    df = df.drop_duplicates()
    if len(df) > MAX_TRAIN_ROWS:
        df = df.sample(n=MAX_TRAIN_ROWS, random_state=42)
    x_frame = df.drop("diagnosis", axis=1).apply(pd.to_numeric, errors="coerce")
    # Drop columns that are entirely non-numeric (median imputation impossible).
    x_frame = x_frame.dropna(axis=1, how="all")
    if x_frame.shape[1] == 0:
        raise HTTPException(status_code=400, detail="No usable numeric feature columns found in the dataset")
    x_frame = x_frame.fillna(x_frame.median(numeric_only=True))
    if x_frame.isna().to_numpy().any():
        raise HTTPException(status_code=400, detail="Dataset contains columns with too many missing values")
    y = encode_diagnosis(df["diagnosis"])

    feature_names = list(x_frame.columns)
    stratify = None
    try:
        counts = pd.Series(y).value_counts()
        if (counts >= 2).all() and len(counts) > 1:
            stratify = y
    except Exception:
        stratify = None
    try:
        x_train, x_test, y_train, y_test = train_test_split(
            x_frame.to_numpy(),
            y,
            test_size=0.3,
            random_state=42,
            stratify=stratify,
        )
    except ValueError:
        x_train, x_test, y_train, y_test = train_test_split(
            x_frame.to_numpy(), y, test_size=0.3, random_state=42
        )

    scaler = StandardScaler()
    x_train = scaler.fit_transform(x_train)
    x_test = scaler.transform(x_test)
    return df, feature_names, scaler, x_train, x_test, y_train, y_test


def notebook_models():
    return {
        "knn": KNeighborsClassifier(n_neighbors=5),
        "decision_tree": DecisionTreeClassifier(random_state=42),
        "random_forest": RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
        "svm": SVC(kernel="linear", probability=True),
    }


def probabilities(model, x_data):
    if hasattr(model, "predict_proba"):
        return model.predict_proba(x_data)[:, 1]
    if hasattr(model, "decision_function"):
        scores = model.decision_function(x_data)
        return (scores - scores.min()) / (scores.max() - scores.min() + 1e-12)
    return model.predict(x_data)


def importance(model, feature_names: List[str]):
    values = None
    if hasattr(model, "feature_importances_"):
        values = model.feature_importances_
    elif hasattr(model, "coef_"):
        values = np.abs(model.coef_).ravel()
    if values is None:
        return []
    ranked = sorted(zip(feature_names, values), key=lambda item: item[1], reverse=True)[:15]
    return [{"feature": name, "importance": float(value)} for name, value in ranked]


def evaluate_model(name: str, model, x_test, y_test, feature_names: List[str]):
    y_pred = model.predict(x_test)
    y_prob = probabilities(model, x_test)
    return {
        "model_name": name,
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1_score": float(f1_score(y_test, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, y_prob)) if len(set(y_test)) > 1 else 0.0,
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "classification_report": classification_report(y_test, y_pred, output_dict=True, zero_division=0),
        "feature_importance": importance(model, feature_names),
    }


def save_bundle(name: str, model, scaler, feature_names, metrics):
    bundle = {"model": model, "scaler": scaler, "features": feature_names, "metrics": metrics}
    path = SAVED_MODELS_DIR / f"{name}.joblib"
    joblib.dump(bundle, path)
    return path


def load_bundle(model_name: Optional[str] = None):
    path = SAVED_MODELS_DIR / f"{model_name}.joblib" if model_name else BEST_MODEL_PATH
    if not path.exists():
        raise HTTPException(status_code=404, detail="No trained model found. Train models first.")
    try:
        bundle = joblib.load(path)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Model artifact is unreadable: {exc}")
    if not isinstance(bundle, dict) or not all(key in bundle for key in ("model", "scaler", "features")):
        raise HTTPException(status_code=503, detail="Model artifacts are outdated or corrupted. Retrain via POST /train.")
    return bundle


@app.get("/")
def root():
    candidates = [
        PROJECT_DIR / "breast_cancer_40_features_1M.csv",
        BASE_DIR / "breast_cancer_40_features_1M.csv",
        BASE_DIR / "datasets" / "breast_cancer_40_features_1M.csv",
        BASE_DIR / "datasets" / "breast_cancer_edited.csv",
        BASE_DIR / "breast_cancer_edited.csv",
        PROJECT_DIR / "breast_cancer_edited.csv",
    ]
    found = [str(p) for p in candidates if p.exists()]
    return {
        "status": "ok",
        "service": "ml-service",
        "version": "4.1.0",
        "ready": BEST_MODEL_PATH.exists(),
        "datasets_available": found,
        "workdir": str(BASE_DIR),
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "ml-service"}


@app.on_event("startup")
def ensure_models_trained():
    # Train in a background thread so /health answers immediately and
    # platform health checks never time out during a cold start.
    if not BEST_MODEL_PATH.exists() or not METRICS_PATH.exists():
        import threading

        def _train_background():
            print("No trained models found. Auto-training on the bundled dataset in background...")
            try:
                result = train(TrainRequest())
                print(f"Auto-training complete. Best model: {result['best_model']['model_name']} "
                      f"(accuracy {result['best_model']['accuracy']:.4f})")
            except Exception as exc:
                print(f"Auto-training failed: {exc}. Call POST /train manually once the dataset is available.")

        threading.Thread(target=_train_background, daemon=True).start()


@app.post("/train")
def train(payload: TrainRequest):
    _, feature_names, scaler, x_train, x_test, y_train, y_test = load_training_data(payload.datasetPath)
    results = []
    trained = {}

    candidates = notebook_models()
    requested = (payload.algorithm or "all").lower()
    if requested != "all":
        if requested not in candidates:
            raise HTTPException(status_code=400, detail=f"Unknown algorithm '{requested}'. Choose from: {', '.join(candidates)}")
        candidates = {requested: candidates[requested]}

    for name, model in candidates.items():
        model.fit(x_train, y_train)
        metrics = evaluate_model(name, model, x_test, y_test, feature_names)
        save_bundle(name, model, scaler, feature_names, metrics)
        trained[name] = metrics
        results.append(metrics)

    knn_acc = trained.get("knn", {}).get("accuracy")
    dt_acc = trained.get("decision_tree", {}).get("accuracy")
    rf_acc = trained.get("random_forest", {}).get("accuracy")
    svm_acc = trained.get("svm", {}).get("accuracy")

    print("\n===== MODEL COMPARISON =====")
    for name, metrics in trained.items():
        print(f"{name} Accuracy:", metrics["accuracy"])

    best_model = max(results, key=lambda item: item["accuracy"])
    best_bundle = joblib.load(SAVED_MODELS_DIR / f"{best_model['model_name']}.joblib")
    joblib.dump(best_bundle, BEST_MODEL_PATH)

    output = {
        "results": results,
        "best_model": best_model,
        "comparison": {
            "knn_acc": knn_acc,
            "dt_acc": dt_acc,
            "rf_acc": rf_acc,
            "svm_acc": svm_acc,
        },
    }
    joblib.dump(output, METRICS_PATH)
    return output


@app.post("/predict")
def predict(payload: PredictRequest):
    bundle = load_bundle(payload.model)
    feature_names = bundle["features"]
    if len(payload.features) != len(feature_names):
        raise HTTPException(status_code=400, detail=f"Expected {len(feature_names)} features")

    x = np.array(payload.features, dtype=float).reshape(1, -1)
    x = bundle["scaler"].transform(x)
    model = bundle["model"]
    probability = float(probabilities(model, x)[0])
    diagnosis = "Malignant" if probability >= 0.5 else "Benign"
    confidence = probability if diagnosis == "Malignant" else 1 - probability

    return {
        "model": (bundle.get("metrics") or {}).get("model_name") or payload.model or "best_model",
        "diagnosis": diagnosis,
        "confidence": round(confidence, 4),
        "risk_percentage": round(probability * 100, 2),
        "recommendation": (
            "High risk pattern detected. Recommend urgent specialist review and confirmatory diagnostics."
            if diagnosis == "Malignant"
            else "Low risk pattern detected. Continue routine clinical follow-up and screening."
        ),
        "insights": [{"feature": name, "value": float(value)} for name, value in zip(feature_names[:5], payload.features[:5])],
    }


@app.get("/evaluate")
def evaluate():
    if not METRICS_PATH.exists():
        raise HTTPException(status_code=404, detail="No metrics available. Train models first.")
    return joblib.load(METRICS_PATH)


@app.get("/models")
def models():
    return [
        {
            "name": file.stem,
            "path": str(file),
            "updated_at": file.stat().st_mtime,
            "is_best": file.name == BEST_MODEL_PATH.name,
        }
        for file in sorted(SAVED_MODELS_DIR.glob("*.joblib"))
    ]


@app.post("/dataset/analyze")
def analyze_dataset(payload: AnalyzeRequest):
    df = pd.read_csv(resolve_dataset(payload.path))
    numeric = df.drop(columns=["diagnosis"], errors="ignore").apply(pd.to_numeric, errors="coerce")
    diagnosis = df["diagnosis"].value_counts().to_dict() if "diagnosis" in df.columns else {}
    return {
        "rows": int(len(df)),
        "columns": int(len(df.columns)),
        "nullValues": int(df.isna().sum().sum()),
        "duplicateValues": int(df.duplicated().sum()),
        "diagnosisDistribution": {str(k): int(v) for k, v in diagnosis.items()},
        "featureStats": numeric.describe().replace({np.nan: None}).to_dict(),
        "correlation": numeric.corr(numeric_only=True).fillna(0).round(3).to_dict(),
        "preview": df.head(25).replace({np.nan: None}).to_dict(orient="records"),
    }

# Breast-Cancer-AI-System

AI-powered breast cancer prediction platform with a React dashboard, Node.js API, Python ML service, and MongoDB persistence.

## Architecture

```text
Breast-Cancer-AI-System/
├── frontend/      React + Vite + Tailwind dashboard
├── backend/       Node.js + Express REST API
├── ml-service/    FastAPI + scikit-learn model service
├── database/      MongoDB schema notes and indexes
├── docs/          Workflow, API, and deployment notes
└── README.md
```

## Quick Start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 2. ML Service

```bash
cd ml-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 5000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Default URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api
- ML Service: http://localhost:5000

## Workflow

1. Register or log in.
2. Upload a breast cancer CSV dataset.
3. Train one or more models: KNN, SVM, Decision Tree, Random Forest.
4. Compare metrics and automatically select the strongest model by `F1 + accuracy`.
5. Predict diagnoses from the medical feature form.
6. Review dashboards, history, reports, datasets, and model metrics.

## Dataset

The included `breast_cancer_40_features_1M.csv` contains the requested 40 numeric features plus `diagnosis`.

## Production Deployment

This repository is ready for 1-click or multi-service deployment on **Railway**. See the step-by-step guide in [RAILWAY_DEPLOYMENT.md](file:///d:/DOWNLOADS/breast%20canser%20project/RAILWAY_DEPLOYMENT.md).

### Production Notes:
- Use MongoDB Atlas or Railway MongoDB plugin for persistence.
- Deploy frontend, backend, and ML service as separate Railway services.
- Set strong JWT secrets, locked CORS origins, HTTPS, and provider-level rate limits.


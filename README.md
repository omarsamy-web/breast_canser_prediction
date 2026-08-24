# Breast-Cancer-AI-System

AI-powered breast cancer prediction platform with a React dashboard, Node.js API, Python ML service, and MongoDB or Supabase persistence.

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
- Backend API: http://localhost:5000/api
- ML Service: http://localhost:5000

## Workflow

1. Visit the public landing page (`/`) — features, pricing, FAQ, and medical disclaimer.
2. Register or log in (redirects to `/app`).
3. Upload a breast cancer CSV dataset.
4. Train one or more models: KNN, SVM, Decision Tree, Random Forest.
5. Compare metrics and automatically select the strongest model by `F1 + accuracy`.
6. Predict diagnoses from the medical feature form.
7. Review dashboards, history, reports, datasets, and model metrics.
8. Manage your subscription on `/app/billing` (usage bars + plan switching).

## SaaS Plans & Quotas

| Plan | Price | Predictions/mo | Trainings/mo | Datasets |
|------|-------|----------------|--------------|----------|
| Free | $0    | 20             | 2            | 1        |
| Pro  | $29   | 1,000          | 50           | 10       |
| Clinic | $99 | 20,000         | 500          | 100      |

- Plan catalog lives in `backend/src/config/plans.js`.
- Quotas are enforced server-side in `backend/src/middleware/plan.middleware.js` — exceeding a limit returns HTTP `402` with `code: "QUOTA_EXCEEDED"`.
- Billing endpoints: `GET /api/plans` (public), `GET /api/billing`, `POST /api/billing/plan` (auth required).
- Payments are in preview: `POST /api/billing/plan` switches plans directly. When going live, replace it with Stripe Checkout + webhook (see the integration point marked in `billing.controller.js`).

## Dataset

The included `breast_cancer_40_features_1M.csv` contains the requested 40 numeric features plus `diagnosis`.

## Production Deployment

This repository is ready for 1-click or multi-service deployment on **Railway**. See the step-by-step guide in [RAILWAY_DEPLOYMENT.md](file:///d:/DOWNLOADS/breast%20canser%20project/RAILWAY_DEPLOYMENT.md).

### Production Notes:
- Use MongoDB Atlas or Railway MongoDB plugin for persistence.
- Or set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ANON_KEY` in the backend to use Supabase-backed persistence.
- Deploy frontend, backend, and ML service as separate Railway services.
- Set strong JWT secrets, locked CORS origins, HTTPS, and provider-level rate limits.

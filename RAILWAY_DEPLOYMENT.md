# Deploying Breast Cancer AI System on Railway

This repository is pre-configured with **Dockerfiles**, **Procfiles**, and **`railway.toml`** configs for seamless deployment on [Railway](https://railway.app).

---

## 🏗 Architecture Overview

The system consists of **4 Railway Services** inside a single Railway project:

1. **MongoDB Database** (Railway Plugin or MongoDB Atlas)
2. **ML Service** (`ml-service/` - Python FastAPI + scikit-learn)
3. **Backend API** (`backend/` - Node.js + Express REST API)
4. **Frontend App** (`frontend/` - React + Vite + Tailwind Dashboard)

---

## 🚀 Step-by-Step Deployment Guide

### Step 1: Create a Railway Project & Provision MongoDB

1. Log in to [Railway](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. First, add the MongoDB database service:
   - Click **+ New** inside your Railway project canvas.
   - Select **Database** -> **Add MongoDB**.
   - Railway will provision a MongoDB instance and provide a `MONGO_URL` variable.

---

### Step 2: Deploy ML Service (`ml-service`)

1. Click **+ New** -> **GitHub Repo** -> select this repository.
2. In the service settings (**Settings** tab):
   - Set **Root Directory** to `ml-service`.
   - If you want Railway to use the service config file, set the config path to `/ml-service/railway.toml`.
   - Railway can also build from `ml-service/Dockerfile` directly.
3. Under **Variables**, add:
   ```env
   MAX_TRAINING_ROWS=120000
   ```
4. Under **Networking**, click **Generate Domain** (e.g. `https://ml-service-production.up.railway.app`).

---

### Step 3: Deploy Backend API (`backend`)

1. Click **+ New** -> **GitHub Repo** -> select this repository.
2. In the service settings (**Settings** tab):
   - Set **Root Directory** to `backend`.
   - If you want Railway to use the service config file, set the config path to `/backend/railway.toml`.
   - Railway can also build from `backend/Dockerfile` directly.
3. Under **Variables**, add:
   ```env
   MONGODB_URI=${{MongoDB.MONGO_URL}}
   JWT_SECRET=replace-with-a-long-secure-random-secret
   ML_SERVICE_URL=https://<your-ml-service-domain>.up.railway.app
   FRONTEND_ORIGIN=https://profound-contentment-production-a3e1.up.railway.app
   ```
   *(Note: You can update `FRONTEND_ORIGIN` after generating your frontend domain in Step 4).*

4. Under **Networking**, click **Generate Domain** (e.g. `https://backend-production.up.railway.app`).

---

### Step 4: Deploy Frontend Web App (`frontend`)

1. Click **+ New** -> **GitHub Repo** -> select this repository.
2. In the service settings (**Settings** tab):
   - Set **Root Directory** to `frontend`.
   - If you want Railway to use the service config file, set the config path to `/frontend/railway.toml`.
   - Railway can also build from `frontend/Dockerfile` directly.
3. Under **Variables**, add:
   ```env
   VITE_API_URL=https://<your-backend-domain>.up.railway.app/api
   ```
4. Under **Networking**, click **Generate Domain** (e.g. `https://frontend-production.up.railway.app`).
5. Copy your frontend public URL and update `FRONTEND_ORIGIN` in the **Backend API** service variables.
   For this project, the live frontend origin is:
   `https://profound-contentment-production-a3e1.up.railway.app`

---

## 🔍 Healthcheck Endpoints

- **Frontend**: `/` (HTTP 200)
- **Backend API**: `/api/health` (HTTP 200 `{ "status": "ok", "service": "node-api" }`)
- **ML Service**: `/` (HTTP 200 `{ "status": "ok", "service": "ml-service" }`)

---

## ⚙️ Summary of Included Configuration Files

| Service | Files Created / Pre-configured |
| :--- | :--- |
| **`ml-service`** | `Dockerfile`, `railway.toml`, `Procfile`, standalone dataset path fallback |
| **`backend`** | `Dockerfile`, `railway.toml`, `Procfile`, wildcard CORS fallback |
| **`frontend`** | `Dockerfile`, `railway.toml`, `Procfile`, `serve` SPA integration |
| **Root** | `railway.json` |

## Railway Monorepo Note

Railway's root directory and config file path are separate settings. In this repo, each service lives in its own folder, so the safest setup is:

- `backend` service -> root directory `backend`, config path `/backend/railway.toml`
- `frontend` service -> root directory `frontend`, config path `/frontend/railway.toml`
- `ml-service` service -> root directory `ml-service`, config path `/ml-service/railway.toml`

If you prefer, you can also rely on the `Dockerfile` in each service folder and skip the Railway config file entirely.

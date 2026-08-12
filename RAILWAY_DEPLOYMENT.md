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
   - Railway automatically detects `ml-service/Dockerfile` or `ml-service/railway.toml`.
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
   - Railway automatically detects `backend/Dockerfile` or `backend/railway.toml`.
3. Under **Variables**, add:
   ```env
   MONGODB_URI=${{MongoDB.MONGO_URL}}
   JWT_SECRET=replace-with-a-long-secure-random-secret
   ML_SERVICE_URL=https://<your-ml-service-domain>.up.railway.app
   FRONTEND_ORIGIN=https://<your-frontend-domain>.up.railway.app
   ```
   *(Note: You can update `FRONTEND_ORIGIN` after generating your frontend domain in Step 4).*

4. Under **Networking**, click **Generate Domain** (e.g. `https://backend-production.up.railway.app`).

---

### Step 4: Deploy Frontend Web App (`frontend`)

1. Click **+ New** -> **GitHub Repo** -> select this repository.
2. In the service settings (**Settings** tab):
   - Set **Root Directory** to `frontend`.
   - Railway automatically detects `frontend/Dockerfile` or `frontend/railway.toml`.
3. Under **Variables**, add:
   ```env
   VITE_API_URL=https://<your-backend-domain>.up.railway.app/api
   ```
4. Under **Networking**, click **Generate Domain** (e.g. `https://frontend-production.up.railway.app`).
5. Copy your frontend public URL and update `FRONTEND_ORIGIN` in the **Backend API** service variables.

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

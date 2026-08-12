# Deployment Guide

## Frontend

Deploy `frontend/` to Vercel or Netlify.

Required environment variable:

```bash
VITE_API_URL=https://your-backend.example.com/api
```

## Backend

Deploy `backend/` to Render, Railway, or a Node.js container.

Required environment variables:

```bash
PORT=4000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=long-random-secret
FRONTEND_ORIGIN=https://your-frontend.example.com
ML_SERVICE_URL=https://your-ml-service.example.com
```

## ML Service

Deploy `ml-service/` as a Python service.

Start command:

```bash
uvicorn app:app --host 0.0.0.0 --port 5000
```

For large datasets, tune:

```bash
MAX_TRAINING_ROWS=120000
```

## Security Checklist

- Use HTTPS only.
- Rotate `JWT_SECRET`.
- Restrict CORS to production frontend origin.
- Keep uploaded CSV storage private.
- Add provider-level request throttling.
- Back up MongoDB.
- Monitor ML service memory during training.

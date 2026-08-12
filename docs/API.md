# API Reference

## Backend API

Base URL: `http://localhost:5000/api`

### Auth

- `POST /auth/register`
- `POST /auth/login`

### Datasets

- `POST /dataset/upload` multipart field `file`
- `GET /dataset`
- `DELETE /dataset/:id`

### Machine Learning

- `POST /ml/train`
- `POST /ml/predict`
- `GET /ml/evaluate`
- `GET /ml/models`
- `GET /ml/history`

## ML Service

Base URL: `http://localhost:5000`

- `POST /dataset/analyze`
- `POST /train`
- `POST /predict`
- `GET /evaluate`
- `GET /models`

## Best Model Logic

The ML service trains the selected algorithms, evaluates each model, then chooses the best model by:

```text
score = f1_score + accuracy
```

The selected model is saved and used for predictions when no explicit model name is provided.

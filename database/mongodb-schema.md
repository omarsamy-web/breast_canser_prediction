# MongoDB Collections

## users

```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string unique",
  "password": "bcrypt hash",
  "role": "Admin | Doctor | Researcher",
  "created_at": "date"
}
```

Indexes:

```js
db.users.createIndex({ email: 1 }, { unique: true })
```

## datasets

```json
{
  "_id": "ObjectId",
  "filename": "string",
  "path": "string",
  "uploaded_by": "ObjectId(users)",
  "stats": {
    "rows": 0,
    "columns": 0,
    "nullValues": 0,
    "duplicateValues": 0,
    "diagnosisDistribution": {},
    "featureStats": {},
    "correlation": {}
  },
  "created_at": "date"
}
```

## predictions

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId(users)",
  "model": "random_forest",
  "result": "Benign | Malignant",
  "confidence": 0.98,
  "riskPercentage": 12.4,
  "features": [],
  "recommendation": "string",
  "created_at": "date"
}
```

## modelmetrics

```json
{
  "_id": "ObjectId",
  "model_name": "random_forest",
  "accuracy": 0.98,
  "precision": 0.97,
  "recall": 0.96,
  "f1_score": 0.97,
  "roc_auc": 0.99,
  "confusion_matrix": [[0, 0], [0, 0]],
  "classification_report": {},
  "feature_importance": [],
  "isBest": true,
  "created_at": "date"
}
```

# Breast Cancer ML Pipeline Audit

## Why the Original Results Were Suspicious

The reported scores were:

| Model | Accuracy |
|---|---:|
| KNN | 0.893 |
| SVM | 0.951 |
| Decision Tree | 0.998 |
| Random Forest | 0.998 |

Decision Tree and Random Forest accuracy near `0.998` can be valid only when the dataset is extremely easy or synthetic. In a medical classification workflow, this should be treated as a warning until the pipeline proves:

- the `diagnosis` target is never present in `X`
- imputation and scaling are fit only on training folds
- duplicate rows do not contaminate train and test sets
- highly correlated or target-like columns are flagged
- results remain stable under stratified cross-validation
- train metrics are close to test metrics

## Corrected Architecture

```text
ml-service/
├── app.py                         FastAPI wrapper
├── run_audit_training.py           CLI audit/training entrypoint
├── ml_pipeline/
│   ├── config.py                   Paths, constants, reproducibility settings
│   ├── data_audit.py               Missing values, duplicates, leakage checks
│   ├── preprocessing.py            Target removal and stratified split
│   ├── models.py                   Pipelines, models, parameter grids
│   ├── evaluation.py               Metrics and cross-validation
│   ├── visualization.py            Confusion matrix, ROC, correlation, importance plots
│   └── training.py                 Orchestration, GridSearchCV, artifact saving
├── saved_models/                   Trained models and best scaler
└── artifacts/
    ├── reports/                    JSON and CSV evaluation reports
    └── plots/                      PNG visualizations
```

## Leakage Prevention

- `diagnosis` is removed in `split_features_target()` before preprocessing.
- `train_test_split(..., stratify=y, random_state=42)` is used.
- `SimpleImputer` and `StandardScaler` live inside each scikit-learn `Pipeline`.
- `GridSearchCV` tunes the full pipeline, so preprocessing is fit independently inside each CV fold.
- The best saved artifact is the full fitted pipeline, not only the estimator.

## Dataset Quality Checks

The audit report detects:

- duplicate rows
- total and per-column missing values
- class distribution
- highly correlated feature pairs
- suspicious feature names such as target, class, label, diagnosis, outcome
- suspicious target correlations greater than `0.98`
- duplicate-like feature columns

Report output:

```text
ml-service/artifacts/reports/dataset_audit.json
```

## Overfitting Prevention

Decision Tree:

- `max_depth`
- `min_samples_split`
- `min_samples_leaf`
- `ccp_alpha` pruning
- `class_weight="balanced"`

Random Forest:

- constrained `max_depth`
- non-trivial `min_samples_leaf`
- non-trivial `min_samples_split`
- `max_features="sqrt"` or `"log2"`
- balanced bootstrap sampling

Model selection penalizes positive overfit gap:

```text
score = f1_score + accuracy - max(overfit_gap, 0)
```

## Hyperparameter Tuning

Grid search is implemented for all four models:

- `KNeighborsClassifier`
- `SVC`
- `DecisionTreeClassifier`
- `RandomForestClassifier`

Run full tuning:

```powershell
cd "D:\DOWNLOADS\breast canser project\ml-service"
.\.venv\Scripts\python.exe run_audit_training.py --models all
```

Fast conservative training:

```powershell
.\.venv\Scripts\python.exe run_audit_training.py --models random_forest --no-tune
```

## Saved Artifacts

```text
ml-service/saved_models/best_model.joblib
ml-service/saved_models/best_scaler.joblib
ml-service/saved_models/random_forest.joblib
ml-service/artifacts/reports/evaluation_report.json
ml-service/artifacts/reports/model_comparison.csv
ml-service/artifacts/reports/dataset_audit.json
ml-service/artifacts/plots/correlation_heatmap.png
ml-service/artifacts/plots/random_forest_confusion_matrix.png
ml-service/artifacts/plots/random_forest_roc_curve.png
ml-service/artifacts/plots/random_forest_feature_importance.png
```

## Smoke Training Result

The corrected Random Forest smoke run produced:

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC | CV Accuracy Mean | CV Std | Overfit Gap |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Random Forest | 0.99825 | 0.99713 | 0.99785 | 0.99749 | 0.99998 | 0.99894 | 0.00042 | 0.0018 |

The score is still extremely high. Since the overfit gap is tiny and CV is stable, this points less to classic model overfitting and more to an easy, synthetic, or highly separable dataset. The audit report should be reviewed for suspicious feature correlations before treating this as clinical-grade performance.

## Best Model Recommendation

Use Random Forest as the default production model only if:

- the leakage audit does not show target-derived columns
- duplicates are removed before splitting
- the same performance appears on a separate external validation dataset
- clinicians confirm the features are available before diagnosis

For real medical deployment, the next required step is external validation on a truly independent dataset.

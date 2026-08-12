import ModelMetric from "../models/ModelMetric.js";
import Prediction from "../models/Prediction.js";
import { hasDatabase } from "../config/database.js";
import { evaluateModels, getModels, predictDiagnosis, trainModel } from "../services/ml.service.js";
import { memory } from "../services/memory.store.js";
import { hasSupabase, supabaseStore } from "../services/supabase.store.js";
import { predictSchema, trainSchema, validate } from "../utils/validators.js";

async function persistMetrics(metrics) {
  const results = Array.isArray(metrics.results) ? metrics.results : [metrics];
  if (results.length === 0) return;

  if (hasDatabase()) await ModelMetric.updateMany({}, { isBest: false });
  else if (hasSupabase()) await supabaseStore.metrics.clearBest();
  else memory.metrics.clearBest();
  const bestName = metrics.best_model?.model_name;

  await Promise.all(
    results.map((item) =>
      hasDatabase() ? ModelMetric.create({
        model_name: item.model_name,
        accuracy: item.accuracy,
        precision: item.precision,
        recall: item.recall,
        f1_score: item.f1_score,
        roc_auc: item.roc_auc,
        confusion_matrix: item.confusion_matrix,
        classification_report: item.classification_report,
        feature_importance: item.feature_importance,
        isBest: item.model_name === bestName
      }) : hasSupabase() ? supabaseStore.metrics.create({
        model_name: item.model_name,
        accuracy: item.accuracy,
        precision: item.precision,
        recall: item.recall,
        f1_score: item.f1_score,
        roc_auc: item.roc_auc,
        confusion_matrix: item.confusion_matrix,
        classification_report: item.classification_report,
        feature_importance: item.feature_importance,
        isBest: item.model_name === bestName
      }) : memory.metrics.create({
        model_name: item.model_name,
        accuracy: item.accuracy,
        precision: item.precision,
        recall: item.recall,
        f1_score: item.f1_score,
        roc_auc: item.roc_auc,
        confusion_matrix: item.confusion_matrix,
        classification_report: item.classification_report,
        feature_importance: item.feature_importance,
        isBest: item.model_name === bestName
      })
    )
  );
}

export async function train(req, res, next) {
  try {
    const payload = validate(trainSchema, req.body);
    const result = await trainModel(payload);
    await persistMetrics(result);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function predict(req, res, next) {
  try {
    const payload = validate(predictSchema, req.body);
    const result = await predictDiagnosis(payload);
    const payloadToSave = {
      user_id: req.user._id,
      model: result.model,
      result: result.diagnosis,
      confidence: result.confidence,
      riskPercentage: result.risk_percentage,
      features: payload.features,
      recommendation: result.recommendation
    };
    if (hasDatabase()) await Prediction.create(payloadToSave);
    else if (hasSupabase()) await supabaseStore.predictions.create(payloadToSave);
    else memory.predictions.create(payloadToSave);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function evaluate(_req, res, next) {
  try {
    res.json(await evaluateModels());
  } catch (error) {
    next(error);
  }
}

export async function models(_req, res, next) {
  try {
    res.json(await getModels());
  } catch (error) {
    next(error);
  }
}

export async function history(req, res, next) {
  try {
    const [predictions, metrics] = hasDatabase()
      ? await Promise.all([
          Prediction.find({ user_id: req.user._id }).sort({ created_at: -1 }).limit(100),
          ModelMetric.find().sort({ created_at: -1 }).limit(100)
        ])
      : hasSupabase()
        ? [await supabaseStore.predictions.listByUser(req.user._id), await supabaseStore.metrics.list()]
        : [memory.predictions.listByUser(req.user._id), memory.metrics.list()];
    res.json({ predictions, metrics });
  } catch (error) {
    next(error);
  }
}

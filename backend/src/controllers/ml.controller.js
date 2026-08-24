import ModelMetric from "../models/ModelMetric.js";
import Prediction from "../models/Prediction.js";
import { hasDatabase } from "../config/database.js";
import { settlePrediction } from "./payment.controller.js";
import { analyzeBundledDataset, evaluateModels, getModels, mlServiceStatus, predictDiagnosis, trainModel } from "../services/ml.service.js";
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

    // Credit was already reserved by enforcePredictionAccess.
    // If inference fails, refund it so users never pay for failed predictions.
    let result;
    try {
      result = await predictDiagnosis(payload);
    } catch (mlError) {
      await settlePrediction(req.user, true);
      throw mlError;
    }

    const payloadToSave = {
      user_id: req.user._id,
      model: result.model,
      result: result.diagnosis,
      confidence: result.confidence,
      riskPercentage: result.risk_percentage,
      features: payload.features,
      recommendation: result.recommendation
    };

    // Bookkeeping must not turn a successful prediction into a client error.
    let warning;
    try {
      if (hasDatabase()) await Prediction.create(payloadToSave);
      else if (hasSupabase()) await supabaseStore.predictions.create(payloadToSave);
      else memory.predictions.create(payloadToSave);
    } catch (persistError) {
      warning = "history_save_failed";
      console.error("Prediction persisted to ML but history save failed:", persistError.message);
    }

    res.json({ ...result, ...(warning ? { warning } : {}) });
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

export async function analyze(req, res, next) {
  try {
    res.json(await analyzeBundledDataset());
  } catch (error) {
    next(error);
  }
}

export async function status(_req, res, next) {
  try {
    res.json(await mlServiceStatus());
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

import { hasDatabase } from "../config/database.js";
import { getPlan, DEFAULT_PLAN } from "../config/plans.js";
import Dataset from "../models/Dataset.js";
import Prediction from "../models/Prediction.js";
import { memory } from "../services/memory.store.js";
import { hasSupabase, supabaseStore } from "../services/supabase.store.js";

const trainingUsage = new Map();

function monthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export function trackTraining(userId) {
  const key = `${userId}:${new Date().getFullYear()}-${new Date().getMonth()}`;
  trainingUsage.set(key, (trainingUsage.get(key) || 0) + 1);
}

async function predictionsThisMonth(userId) {
  if (hasDatabase()) {
    return Prediction.countDocuments({ user_id: userId, created_at: { $gte: new Date(monthStart()) } });
  }
  const rows = hasSupabase()
    ? await supabaseStore.predictions.listByUser(userId)
    : memory.predictions.listByUser(userId);
  const since = new Date(monthStart()).getTime();
  return rows.filter((row) => new Date(row.created_at).getTime() >= since).length;
}

async function datasetCount(userId) {
  if (hasDatabase()) return Dataset.countDocuments({ uploaded_by: userId });
  const rows = hasSupabase() ? await supabaseStore.datasets.list() : memory.datasets.list();
  return rows.filter((row) => row.uploaded_by === userId).length;
}

export function planOf(user) {
  return getPlan(user?.plan || DEFAULT_PLAN);
}

export async function usageSummary(user) {
  const plan = planOf(user);
  const [predictions, datasets] = await Promise.all([
    predictionsThisMonth(user._id),
    datasetCount(user._id)
  ]);
  const trainKey = `${user._id}:${new Date().getFullYear()}-${new Date().getMonth()}`;
  return {
    plan: plan.id,
    quotas: plan.quotas,
    usage: {
      predictionsThisMonth: predictions,
      trainingsThisMonth: trainingUsage.get(trainKey) || 0,
      datasets
    }
  };
}

export function enforceQuota(resource) {
  return async (req, res, next) => {
    try {
      const plan = planOf(req.user);
      const quota = plan.quotas[resource === "predict" ? "predictionsPerMonth" : resource === "train" ? "trainingsPerMonth" : "maxDatasets"];
      let current;
      if (resource === "predict") current = await predictionsThisMonth(req.user._id);
      else if (resource === "train") current = trainingUsage.get(`${req.user._id}:${new Date().getFullYear()}-${new Date().getMonth()}`) || 0;
      else current = await datasetCount(req.user._id);

      if (current >= quota) {
        return res.status(402).json({
          message: `Your ${plan.name} plan limit for ${resource} has been reached (${quota}). Upgrade your plan to continue.`,
          code: "QUOTA_EXCEEDED",
          plan: plan.id,
          quota,
          used: current
        });
      }
      req.plan = plan;
      next();
    } catch (error) {
      next(error);
    }
  };
}

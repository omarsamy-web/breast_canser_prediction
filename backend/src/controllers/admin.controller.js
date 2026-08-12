import Dataset from "../models/Dataset.js";
import ModelMetric from "../models/ModelMetric.js";
import Prediction from "../models/Prediction.js";
import User from "../models/User.js";
import { hasDatabase } from "../config/database.js";
import { memory } from "../services/memory.store.js";
import { hasSupabase, supabaseStore } from "../services/supabase.store.js";

export async function overview(_req, res, next) {
  try {
    const [users, datasets, predictions, models] = hasDatabase()
      ? await Promise.all([
          User.countDocuments(),
          Dataset.countDocuments(),
          Prediction.countDocuments(),
          ModelMetric.countDocuments()
        ])
      : hasSupabase()
        ? await Promise.all([
            supabaseStore.users.count(),
            supabaseStore.datasets.count(),
            supabaseStore.predictions.count(),
            supabaseStore.metrics.count()
          ])
        : [memory.users.count(), memory.datasets.count(), memory.predictions.count(), memory.metrics.count()];
    res.json({ users, datasets, predictions, models, status: "healthy" });
  } catch (error) {
    next(error);
  }
}

export async function users(_req, res, next) {
  try {
    res.json(
      hasDatabase()
        ? await User.find().select("-password").sort({ created_at: -1 })
        : hasSupabase()
          ? await supabaseStore.users.list()
          : memory.users.list()
    );
  } catch (error) {
    next(error);
  }
}

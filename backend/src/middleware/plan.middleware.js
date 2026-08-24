import { hasDatabase } from "../config/database.js";
import { getPlan, DEFAULT_PLAN } from "../config/plans.js";
import Prediction from "../models/Prediction.js";
import { memory } from "../services/memory.store.js";
import { hasSupabase, supabaseStore } from "../services/supabase.store.js";

function monthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export function planOf(user) {
  return getPlan(user?.plan || DEFAULT_PLAN);
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

export async function usageSummary(user) {
  const plan = planOf(user);
  return {
    plan: plan.id,
    quotas: plan.quotas,
    usage: {
      predictionsThisMonth: await predictionsThisMonth(user._id)
    }
  };
}

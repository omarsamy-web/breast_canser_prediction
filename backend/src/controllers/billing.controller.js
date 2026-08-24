import { hasDatabase } from "../config/database.js";
import { getPlan, publicPlans } from "../config/plans.js";
import User from "../models/User.js";
import { memory } from "../services/memory.store.js";
import { hasSupabase, supabaseStore } from "../services/supabase.store.js";
import { usageSummary } from "../middleware/plan.middleware.js";

export async function listPlans(_req, res) {
  res.json({ plans: publicPlans() });
}

export async function getBilling(req, res, next) {
  try {
    const summary = await usageSummary(req.user);
    const plan = getPlan(summary.plan);
    res.json({ ...summary, planDetails: plan, plans: publicPlans() });
  } catch (error) {
    next(error);
  }
}

export async function changePlan(req, res, next) {
  try {
    const { plan } = req.body;
    if (!publicPlans().some((p) => p.id === plan)) {
      return res.status(400).json({ message: "Unknown plan" });
    }

    // Stripe integration point:
    // When payments go live, replace this direct switch with a Stripe Checkout
    // session + webhook (checkout.session.completed -> set user.plan).
    let updated;
    if (hasDatabase()) {
      updated = await User.findByIdAndUpdate(req.user._id, { plan }, { new: true }).select("-password");
    } else if (hasSupabase()) {
      updated = await supabaseStore.users.update(req.user._id, { plan });
    } else {
      updated = memory.users.findById(req.user._id);
      if (updated) updated.plan = plan;
    }
    res.json({
      message: `Plan switched to ${getPlan(plan).name}. Payments are in preview — no card required yet.`,
      user: { id: updated._id, name: updated.name, email: updated.email, role: updated.role, plan: updated.plan },
      ...(await usageSummary(updated))
    });
  } catch (error) {
    next(error);
  }
}

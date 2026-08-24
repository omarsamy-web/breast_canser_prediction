import { hasDatabase } from "../config/database.js";
import Prediction from "../models/Prediction.js";
import User from "../models/User.js";
import { memory } from "../services/memory.store.js";
import { hasSupabase, supabaseStore } from "../services/supabase.store.js";

export const CREDIT_PACKS = [
  { id: "single", credits: 1, price: 9, label: "1 prediction" },
  { id: "pack5", credits: 5, price: 39, label: "5 predictions", popular: true },
  { id: "pack20", credits: 20, price: 129, label: "20 predictions" }
];

export function isStaff(user) {
  return user?.role === "Admin" || user?.role === "Doctor" || user?.role === "Researcher";
}

async function lifetimePredictions(userId) {
  if (hasDatabase()) return Prediction.countDocuments({ user_id: userId });
  const rows = hasSupabase()
    ? await supabaseStore.predictions.listByUser(userId)
    : memory.predictions.listByUser(userId);
  return rows.length;
}

async function setUserFields(userId, fields) {
  if (hasDatabase()) {
    await User.findByIdAndUpdate(userId, fields);
    return User.findById(userId).select("-password");
  }
  if (hasSupabase()) return supabaseStore.users.update(userId, fields);
  const user = memory.users.findById(userId);
  if (user) Object.assign(user, fields);
  return user;
}

/**
 * Atomically reserve one credit BEFORE running inference.
 * Returns true when a credit was taken; false when the patient has none.
 * The guarded conditional update makes concurrent requests safe:
 * two parallel predictions with one credit left -> exactly one succeeds here.
 */
export async function reserveCredit(userId) {
  if (hasDatabase()) {
    const updated = await User.findOneAndUpdate(
      { _id: userId, credits: { $gte: 1 } },
      { $inc: { credits: -1 } },
      { new: true }
    );
    return Boolean(updated);
  }
  if (hasSupabase()) {
    const rows = await supabaseStore.decrementCreditsGuarded(userId);
    return Boolean(rows);
  }
  const user = memory.users.findById(userId);
  if (!user || (user.credits ?? 0) < 1) return false;
  user.credits -= 1;
  return true;
}

/** Give a reserved credit back (used when inference or persistence fails). */
export async function refundCredit(userId) {
  if (hasDatabase()) {
    await User.findByIdAndUpdate(userId, { $inc: { credits: 1 } });
    return;
  }
  if (hasSupabase()) {
    await supabaseStore.incrementCredits(userId);
    return;
  }
  const user = memory.users.findById(userId);
  if (user) user.credits = (user.credits ?? 0) + 1;
}

/**
 * Staff (Admin) can predict freely. Patients must hold paid credits —
 * their illness history stays free, but every prediction consumes one credit.
 */
export function enforcePredictionAccess() {
  return async (req, res, next) => {
    try {
      if (isStaff(req.user)) {
        req.predictionBilling = { type: "staff" };
        return next();
      }
      // Atomically reserve a credit up front; refunded if the prediction fails.
      const reserved = await reserveCredit(req.user._id);
      if (!reserved) {
        return res.status(402).json({
          message: "Predictions require credits. Buy a credit pack to continue.",
          code: "PAYMENT_REQUIRED",
          checkoutUrl: "/app/billing"
        });
      }
      req.predictionBilling = { type: "credit", reserved: true };
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Called after inference completes. The credit was already reserved before
 * the ML call, so nothing is charged here; on failure we refund so users are
 * never charged for predictions that did not happen.
 */
export async function settlePrediction(user, failed = false) {
  if (isStaff(user) || failed) {
    if (failed && !isStaff(user)) await refundCredit(user._id).catch((e) => console.error("credit refund failed:", e.message));
    return;
  }
}

export async function creditStatus(req, res, next) {
  try {
    const staff = isStaff(req.user);
    res.json({
      role: req.user.role,
      isStaff: staff,
      credits: staff ? null : req.user.credits ?? 0,
      packs: CREDIT_PACKS
    });
  } catch (error) {
    next(error);
  }
}

export async function checkout(req, res, next) {
  try {
    const pack = CREDIT_PACKS.find((p) => p.id === req.body.pack);
    if (!pack) return res.status(400).json({ message: "Unknown credit pack" });

    // Stripe integration point:
    // When payments go live, create a Checkout Session here and grant the
    // credits in the checkout.session.completed webhook instead.
    let updated;
    if (hasDatabase()) {
      updated = await User.findByIdAndUpdate(
        req.user._id,
        { $inc: { credits: pack.credits } },
        { new: true }
      ).select("-password");
    } else if (hasSupabase()) {
      await supabaseStore.incrementCredits(req.user._id, pack.credits);
      updated = await supabaseStore.users.findById(req.user._id);
    } else {
      const user = memory.users.findById(req.user._id);
      if (!user) return res.status(404).json({ message: "User not found" });
      user.credits = (user.credits ?? 0) + pack.credits;
      updated = user;
    }

    res.json({
      message: `Payment received (preview mode — no card charged). ${pack.credits} credit${pack.credits > 1 ? "s" : ""} added.`,
      credits: updated.credits ?? 0,
      paid: pack.price
    });
  } catch (error) {
    next(error);
  }
}

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
 * Patients get exactly one free prediction; afterwards each prediction
 * consumes a paid credit. Staff (Admin) are never blocked.
 */
export function enforcePredictionAccess() {
  return async (req, res, next) => {
    try {
      if (isStaff(req.user)) {
        req.predictionBilling = { type: "staff" };
        return next();
      }
      const used = req.user.freePredictionUsed ?? false;
      if (!used) {
        req.predictionBilling = { type: "free_trial" };
        return next();
      }
      const credits = req.user.credits ?? 0;
      if (credits > 0) {
        req.predictionBilling = { type: "credit" };
        return next();
      }
      return res.status(402).json({
        message: "Your free prediction has been used. Buy credits to predict again.",
        code: "PAYMENT_REQUIRED",
        checkoutUrl: "/app/billing"
      });
    } catch (error) {
      next(error);
    }
  };
}

/** Call after a prediction succeeds so failures are never charged. */
export async function settlePrediction(user) {
  if (isStaff(user)) return;
  if (!user.freePredictionUsed) {
    await setUserFields(user._id, { freePredictionUsed: true });
  } else {
    await setUserFields(user._id, { credits: Math.max(0, (user.credits ?? 0) - 1) });
  }
}

export async function creditStatus(req, res, next) {
  try {
    const staff = isStaff(req.user);
    const used = staff ? false : Boolean(req.user.freePredictionUsed);
    res.json({
      role: req.user.role,
      isStaff: staff,
      freePredictionAvailable: !staff && !used,
      freePredictionUsed: used,
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
    const updated = await setUserFields(req.user._id, {
      credits: (req.user.credits ?? 0) + pack.credits
    });

    res.json({
      message: `Payment received (preview mode — no card charged). ${pack.credits} credit${pack.credits > 1 ? "s" : ""} added.`,
      credits: updated.credits,
      paid: pack.price
    });
  } catch (error) {
    next(error);
  }
}

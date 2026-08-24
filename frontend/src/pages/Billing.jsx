import { useEffect, useState } from "react";
import { FaCheckCircle, FaCreditCard, FaExclamationTriangle, FaGift } from "react-icons/fa";
import { changePlan, checkoutCredits, getBilling, getCreditStatus } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Billing() {
  const { user, setUser } = useAuth();
  const isStaff = user?.role === "Admin" || user?.role === "Doctor" || user?.role === "Researcher";
  const [credits, setCredits] = useState(null);
  const [billing, setBilling] = useState(null);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    getCreditStatus().then(setCredits).catch(() => {});
    if (isStaff) getBilling().then(setBilling).catch(() => {});
  }, [isStaff]);

  async function buy(packId) {
    setBusy(packId);
    setMessage(null);
    try {
      const res = await checkoutCredits(packId);
      const status = await getCreditStatus();
      setCredits(status);
      setUser({ ...user, credits: res.credits });
      setMessage({ type: "success", text: res.message });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Checkout failed." });
    } finally {
      setBusy(null);
    }
  }

  async function switchPlan(planId) {
    setBusy(planId);
    setMessage(null);
    try {
      await changePlan(planId);
      setMessage({ type: "success", text: `Plan switched to ${planId}.` });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Plan switch failed." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-extrabold">{isStaff ? "Clinic Plans" : "Credits & Billing"}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Payments are in preview — no card is charged yet.
        </p>
      </header>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-xl border p-4 text-sm font-semibold ${
            message.type === "error"
              ? "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
              : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          }`}
        >
          {message.type === "error" ? <FaExclamationTriangle /> : <FaCheckCircle />} {message.text}
        </div>
      )}

      {!isStaff && (
        <>
          <section className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
            <h2 className="mb-4 flex items-center gap-2 font-bold"><FaCreditCard className="text-medical-blue" /> Your prediction balance</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Free prediction</p>
                <p className={`mt-1 text-2xl font-extrabold ${credits?.freePredictionAvailable ? "text-emerald-500" : "text-slate-400 line-through"}`}>
                  {credits?.freePredictionAvailable ? "Available" : "Used"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Paid credits left</p>
                <p className="mt-1 text-2xl font-extrabold">{credits?.credits ?? user?.credits ?? 0}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total predictions</p>
                <p className="mt-1 text-2xl font-extrabold">{(credits?.freePredictionAvailable ? 0 : 1) + (credits?.credits ?? 0)} available</p>
              </div>
            </div>
            {!credits?.freePredictionAvailable && (credits?.credits ?? 0) === 0 && (
              <p className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                <FaExclamationTriangle /> Buy a credit pack below to run your next prediction.
              </p>
            )}
          </section>

          <section className="grid gap-6 sm:grid-cols-3">
            {(credits?.packs || []).map((pack) => (
              <div key={pack.id} className={`flex flex-col rounded-2xl border p-6 shadow-sm ${pack.popular ? "border-medical-blue ring-2 ring-medical-blue" : "border-white/60 bg-white/80 dark:border-white/10 dark:bg-slate-900/70"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{pack.label}</h3>
                  {pack.popular && <span className="rounded-full bg-medical-blue px-3 py-0.5 text-xs font-bold text-white">Best value</span>}
                </div>
                <p className="mt-3"><span className="text-3xl font-extrabold">${pack.price}</span></p>
                <p className="mt-1 text-xs text-slate-500">{pack.credits} prediction credit{pack.credits > 1 ? "s" : ""} · never expires</p>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => buy(pack.id)}
                  className="btn-primary mt-5 w-full py-2.5 text-sm"
                >
                  {busy === pack.id ? "Processing…" : "Buy now"}
                </button>
              </div>
            ))}
          </section>

          <p className="flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200">
            <FaGift className="mt-0.5 shrink-0" />
            Every new account starts with one free prediction. Credits are consumed only on successful predictions.
          </p>
        </>
      )}

      {isStaff && billing && (
        <section className="grid gap-6 lg:grid-cols-3">
          {(billing.plans || []).map((plan) => {
            const current = plan.id === (user?.plan || billing.plan);
            return (
              <div key={plan.id} className={`flex flex-col rounded-2xl border p-6 shadow-sm ${current ? "border-medical-blue ring-2 ring-medical-blue" : "border-white/60 bg-white/80 dark:border-white/10 dark:bg-slate-900/70"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{plan.name}</h3>
                  {current && <span className="rounded-full bg-medical-blue px-3 py-0.5 text-xs font-bold text-white">Current</span>}
                </div>
                <p className="mt-1 min-h-8 text-xs text-slate-500 dark:text-slate-400">{plan.description}</p>
                <p className="mt-3"><span className="text-3xl font-extrabold">${plan.priceMonthly}</span><span className="text-xs text-slate-500"> /month</span></p>
                <ul className="mt-4 flex-1 space-y-2 text-xs">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2"><FaCheckCircle className="mt-0.5 shrink-0 text-emerald-500" /> {f}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={current || busy !== null}
                  onClick={() => switchPlan(plan.id)}
                  className="btn-primary mt-5 w-full py-2.5 text-sm disabled:cursor-default disabled:opacity-50"
                >
                  {current ? "Active plan" : busy === plan.id ? "Switching…" : `Switch to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

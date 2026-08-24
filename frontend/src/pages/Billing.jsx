import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaCheckCircle, FaCrown, FaExclamationTriangle } from "react-icons/fa";
import { changePlan, getBilling } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function UsageBar({ label, used, limit }) {
  const unlimited = limit === Infinity;
  const pct = unlimited ? Math.min((used / Math.max(1, 10)) * 100, 100) : Math.min((used / limit) * 100, 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm font-semibold">
        <span>{label}</span>
        <span className={pct >= 100 ? "text-red-500" : ""}>
          {used} / {unlimited ? "∞" : limit}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-medical-blue"}`}
          style={{ width: `${Math.max(pct, 3)}%` }}
        />
      </div>
    </div>
  );
}

export default function Billing() {
  const { user, setUser } = useAuth();
  const [billing, setBilling] = useState(null);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);

  async function load() {
    try {
      setBilling(await getBilling());
    } catch {
      setMessage({ type: "error", text: "Could not load billing data." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function switchPlan(planId) {
    setBusy(planId);
    setMessage(null);
    try {
      const result = await changePlan(planId);
      if (result.user) setUser(result.user);
      await load();
      setMessage({ type: "success", text: result.message });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Plan switch failed." });
    } finally {
      setBusy(null);
    }
  }

  if (!billing) {
    return <p className="text-sm text-slate-500">Loading billing…</p>;
  }

  const { planDetails, quotas, usage, plans } = billing;
  const currentPlan = planDetails?.id || user?.plan || "free";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-extrabold">Billing & Plan</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          You are on the <strong>{planDetails?.name}</strong> plan.
          Payments are in preview — switching is free for now.
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

      <section className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
        <h2 className="mb-4 flex items-center gap-2 font-bold"><FaCrown className="text-pink-500" /> This month's usage</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <UsageBar label="Predictions" used={usage.predictionsThisMonth} limit={quotas.predictionsPerMonth} />
          <UsageBar label="Trainings" used={usage.trainingsThisMonth} limit={quotas.trainingsPerMonth} />
          <UsageBar label="Datasets" used={usage.datasets} limit={quotas.maxDatasets} />
        </div>
        {(usage.predictionsThisMonth >= quotas.predictionsPerMonth ||
          usage.trainingsThisMonth >= quotas.trainingsPerMonth) && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <FaExclamationTriangle /> You have hit a plan limit this month. Upgrade below to keep predicting.
          </p>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <div
              key={plan.id}
              className={`flex flex-col rounded-2xl border p-6 shadow-sm ${
                isCurrent
                  ? "border-medical-blue ring-2 ring-medical-blue"
                  : "border-white/60 bg-white/80 dark:border-white/10 dark:bg-slate-900/70"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{plan.name}</h3>
                {isCurrent && <span className="rounded-full bg-medical-blue px-3 py-0.5 text-xs font-bold text-white">Current</span>}
              </div>
              <p className="mt-1 min-h-8 text-xs text-slate-500 dark:text-slate-400">{plan.description}</p>
              <p className="mt-3">
                <span className="text-3xl font-extrabold">${plan.priceMonthly}</span>
                <span className="text-xs text-slate-500"> /month</span>
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-xs">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <FaCheckCircle className="mt-0.5 shrink-0 text-emerald-500" /> {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={isCurrent || busy !== null}
                onClick={() => switchPlan(plan.id)}
                className={`mt-5 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  isCurrent
                    ? "cursor-default bg-slate-100 text-slate-400 dark:bg-slate-800"
                    : busy === plan.id
                      ? "bg-medical-blue/60 text-white"
                      : "bg-medical-blue text-white shadow-lg shadow-blue-500/20 hover:brightness-110"
                }`}
              >
                {isCurrent ? "Active plan" : busy === plan.id ? "Switching…" : `Switch to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </section>

      <p className="text-xs text-slate-400">
        Need higher limits or team seats? <Link to="/app/prediction" className="font-semibold text-medical-blue">Keep using the app</Link> while we finalize Stripe checkout.
      </p>
    </div>
  );
}

import { useEffect, useState } from "react";
import { FaClipboardCheck, FaCreditCard, FaFileMedical, FaFilePdf, FaGift, FaPaperPlane, FaStethoscope } from "react-icons/fa";
import { checkoutCredits, getCreditStatus, predict } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { cancerFeatures } from "../utils/features.js";

const baselineFeatures = {
  radius_mean: 13.4,
  texture_mean: 19.3,
  perimeter_mean: 87.0,
  area_mean: 560.0,
  smoothness_mean: 0.1,
  compactness_mean: 0.1,
  concavity_mean: 0.09,
  concave_points_mean: 0.05,
  symmetry_mean: 0.18,
  fractal_dimension_mean: 0.06,
  radius_se: 0.4,
  texture_se: 1.2,
  perimeter_se: 2.8,
  area_se: 40.0,
  smoothness_se: 0.007,
  compactness_se: 0.025,
  concavity_se: 0.03,
  concave_points_se: 0.012,
  symmetry_se: 0.02,
  fractal_dimension_se: 0.004,
  radius_worst: 16.2,
  texture_worst: 25.7,
  perimeter_worst: 107.0,
  area_worst: 880.0,
  smoothness_worst: 0.13,
  compactness_worst: 0.25,
  concavity_worst: 0.27,
  concave_points_worst: 0.11,
  symmetry_worst: 0.29,
  fractal_dimension_worst: 0.08,
  cell_density: 50,
  nucleus_size: 9,
  nucleus_texture: 0,
  mitosis_rate: 2,
  tumor_border_irregularity: 0.5,
  chromatin_density: 0,
  cell_variation: 0.4,
  nuclear_variation: 0.4,
  cytoplasm_ratio: 0.35,
  cell_clump_thickness: 4
};

const quickInitial = {
  lump: "no",
  pain: "no",
  skinChange: "no",
  nippleChange: "no",
  familyHistory: "no",
  ageGroup: "under40",
  mammogram: "normal",
  biopsyConcern: "none"
};

function quickRiskScore(form) {
  const points = [
    form.lump === "yes" ? 3 : 0,
    form.pain === "yes" ? 1 : 0,
    form.skinChange === "yes" ? 2 : 0,
    form.nippleChange === "yes" ? 2 : 0,
    form.familyHistory === "yes" ? 2 : 0,
    form.ageGroup === "40to55" ? 1 : form.ageGroup === "over55" ? 2 : 0,
    form.mammogram === "unclear" ? 2 : form.mammogram === "abnormal" ? 4 : 0,
    form.biopsyConcern === "mild" ? 2 : form.biopsyConcern === "high" ? 5 : 0
  ];
  return points.reduce((sum, value) => sum + value, 0);
}

function quickFormToFeatures(form) {
  const score = quickRiskScore(form);
  const multiplier = 1 + Math.min(score, 15) * 0.045;
  const shapeRisk = score / 15;

  return cancerFeatures.map((feature) => {
    const base = baselineFeatures[feature] ?? 0;
    if (feature.includes("concavity") || feature.includes("concave_points")) return base * (1 + shapeRisk * 1.8);
    if (feature.includes("worst") || feature.includes("perimeter") || feature.includes("area") || feature.includes("radius")) return base * multiplier;
    if (feature.includes("texture") || feature.includes("variation") || feature.includes("irregularity")) return base + shapeRisk * 2.5;
    if (feature === "mitosis_rate" || feature === "cell_clump_thickness") return base + score * 0.35;
    if (feature === "nucleus_size" || feature === "cell_density") return base * (1 + shapeRisk * 0.7);
    return base;
  });
}

export default function Prediction() {
  const { user, setUser } = useAuth();
  const isStaff = user?.role === "Admin" || user?.role === "Doctor" || user?.role === "Researcher";
  const [mode, setMode] = useState("quick");
  const [quick, setQuick] = useState(quickInitial);
  const [values, setValues] = useState(Object.fromEntries(cancerFeatures.map((feature) => [feature, baselineFeatures[feature] ?? ""])));
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [credits, setCredits] = useState(null);
  const [paywall, setPaywall] = useState(false);
  const [buying, setBuying] = useState(null);

  useEffect(() => {
    getCreditStatus().then(setCredits).catch(() => {});
  }, []);

  async function buy(packId) {
    setBuying(packId);
    try {
      const res = await checkoutCredits(packId);
      setCredits((prev) => ({ ...prev, credits: res.credits }));
      if (user) setUser({ ...user, credits: res.credits });
      setPaywall(false);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Checkout failed.");
    } finally {
      setBuying(null);
    }
  }

  function handlePredictionError(err) {
    if (err.response?.status === 402) {
      setPaywall(true);
      setError("");
    } else {
      setError(err.response?.data?.message || "The AI service is unavailable. Please try again later.");
    }
  }

  async function submitQuick(event) {
    event.preventDefault();
    setError("");
    try {
      const features = quickFormToFeatures(quick);
      setResult({ ...(await predict({ features })), source: "Quick risk check", quickScore: quickRiskScore(quick) });
      getCreditStatus().then(setCredits).catch(() => {});
    } catch (err) {
      handlePredictionError(err);
    }
  }

  async function submitAdvanced(event) {
    event.preventDefault();
    setError("");
    try {
      const features = cancerFeatures.map((feature) => Number(values[feature] || 0));
      setResult({ ...(await predict({ features })), source: "Clinical feature form" });
      getCreditStatus().then(setCredits).catch(() => {});
    } catch (err) {
      handlePredictionError(err);
    }
  }

  const malignant = result?.diagnosis === "Malignant";

  return (
    <div className="page-grid">
      {!isStaff && credits && (
        <section className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm font-semibold ${
          credits.freePredictionAvailable
            ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
            : (credits.credits ?? 0) > 0
              ? "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
              : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
        }`}>
          <span className="flex items-center gap-2">
            {credits.freePredictionAvailable ? (
              <><FaGift /> You have your free prediction available — no payment needed.</>
            ) : (credits.credits ?? 0) > 0 ? (
              <><FaCreditCard /> You have {credits.credits} prediction credit{(credits.credits ?? 0) > 1 ? "s" : ""} remaining.</>
            ) : (
              <><FaCreditCard /> Your free prediction is used and you have no credits left.</>
            )}
          </span>
          {!credits.freePredictionAvailable && (
            <button type="button" onClick={() => setPaywall((v) => !v)} className="btn-primary px-4 py-2 text-xs">
              Buy credits
            </button>
          )}
        </section>
      )}

      {paywall && !isStaff && (
        <section className="glass rounded-xl p-6">
          <h3 className="text-lg font-bold">Choose a credit pack</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Payments are in preview — packs are granted instantly without charging a card.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {(credits?.packs || []).map((pack) => (
              <div key={pack.id} className={`rounded-2xl border p-5 text-center ${pack.popular ? "border-medical-blue ring-2 ring-medical-blue" : "border-slate-200 dark:border-slate-700"}`}>
                <p className="text-sm font-bold">{pack.label}</p>
                <p className="mt-2 text-3xl font-extrabold">${pack.price}</p>
                {pack.popular && <p className="mt-1 text-xs font-semibold text-medical-blue">Most popular</p>}
                <button type="button" disabled={buying !== null} onClick={() => buy(pack.id)} className="btn-primary mt-4 w-full py-2.5 text-sm">
                  {buying === pack.id ? "Processing…" : `Buy ${pack.credits} credit${pack.credits > 1 ? "s" : ""}`}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="glass rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold"><FaStethoscope className="text-medical-blue" /> Easy Cancer Risk Prediction</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
              Start with a simple guided check. Use the advanced form only when you have laboratory or cytology feature values.
            </p>
          </div>
          <div className="flex rounded-lg border border-slate-200 bg-white/70 p-1 dark:border-slate-700 dark:bg-slate-900">
            <button className={`rounded-md px-4 py-2 text-sm font-semibold ${mode === "quick" ? "bg-medical-blue text-white" : "text-slate-600 dark:text-slate-300"}`} onClick={() => setMode("quick")}>Simple</button>
            <button className={`rounded-md px-4 py-2 text-sm font-semibold ${mode === "advanced" ? "bg-medical-blue text-white" : "text-slate-600 dark:text-slate-300"}`} onClick={() => setMode("advanced")}>Advanced</button>
          </div>
        </div>

        {mode === "quick" ? (
          <form onSubmit={submitQuick} className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["lump", "New breast lump or thickening?"],
              ["pain", "Persistent breast pain?"],
              ["skinChange", "Skin dimpling, redness, or swelling?"],
              ["nippleChange", "Nipple discharge or inversion?"],
              ["familyHistory", "Family history of breast cancer?"]
            ].map(([key, label]) => (
              <label key={key} className="text-sm font-medium">
                {label}
                <select className="input mt-1" value={quick[key]} onChange={(e) => setQuick({ ...quick, [key]: e.target.value })}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </label>
            ))}
            <label className="text-sm font-medium">
              Age group
              <select className="input mt-1" value={quick.ageGroup} onChange={(e) => setQuick({ ...quick, ageGroup: e.target.value })}>
                <option value="under40">Under 40</option>
                <option value="40to55">40 to 55</option>
                <option value="over55">Over 55</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Mammogram or ultrasound result
              <select className="input mt-1" value={quick.mammogram} onChange={(e) => setQuick({ ...quick, mammogram: e.target.value })}>
                <option value="normal">Normal or not available</option>
                <option value="unclear">Needs follow-up</option>
                <option value="abnormal">Abnormal finding</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Biopsy or lab concern
              <select className="input mt-1" value={quick.biopsyConcern} onChange={(e) => setQuick({ ...quick, biopsyConcern: e.target.value })}>
                <option value="none">None or not available</option>
                <option value="mild">Mild concern</option>
                <option value="high">High concern</option>
              </select>
            </label>
            <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950/40 dark:text-blue-100 xl:col-span-4">
              <p className="font-semibold">This is a decision-support estimate, not a diagnosis.</p>
              <p className="mt-1">If you have a lump, abnormal imaging, nipple discharge, or skin changes, contact a qualified doctor even if the result says low risk.</p>
            </div>
            <div className="flex items-end gap-3 xl:col-span-4">
              <button className="btn-primary" type="submit"><FaClipboardCheck /> Check Risk</button>
              <button className="btn-soft" type="button" onClick={() => setQuick(quickInitial)}>Reset</button>
            </div>
          </form>
        ) : (
          <form onSubmit={submitAdvanced} className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cancerFeatures.map((feature) => (
              <label key={feature} className="text-sm font-medium">
                {feature}
                <input className="input mt-1" type="number" step="any" value={values[feature]} onChange={(e) => setValues({ ...values, [feature]: e.target.value })} />
              </label>
            ))}
            <div className="flex items-end gap-3 xl:col-span-4">
              <button className="btn-primary" type="submit"><FaPaperPlane /> Predict Diagnosis</button>
              <button className="btn-soft" type="button"><FaFilePdf /> Export Report</button>
            </div>
          </form>
        )}
      </section>

      {error && <section className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">{error}</section>}

      {result && (
        <section className={`rounded-xl border p-6 shadow-glass ${malignant ? "border-rose-300 bg-rose-50 text-rose-950 dark:bg-rose-950/50 dark:text-rose-50" : "border-emerald-300 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-50"}`}>
          <p className="text-sm font-semibold uppercase tracking-wide">{result.source} - {result.model}</p>
          <h3 className="mt-2 flex items-center gap-3 text-3xl font-black"><FaFileMedical /> {result.diagnosis}</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div><p className="text-sm opacity-75">Confidence</p><p className="text-2xl font-bold">{Math.round(result.confidence * 100)}%</p></div>
            <div><p className="text-sm opacity-75">Risk Percentage</p><p className="text-2xl font-bold">{result.risk_percentage}%</p></div>
            {result.quickScore !== undefined && <div><p className="text-sm opacity-75">Simple Risk Score</p><p className="text-2xl font-bold">{result.quickScore}/21</p></div>}
            <div><p className="text-sm opacity-75">Recommended Action</p><p className="font-semibold">{result.recommendation}</p></div>
          </div>
        </section>
      )}
    </div>
  );
}

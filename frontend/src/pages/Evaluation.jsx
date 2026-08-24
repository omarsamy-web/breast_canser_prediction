import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard from "../components/charts/ChartCard.jsx";
import { evaluate } from "../services/api.js";

export default function Evaluation() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    evaluate().then(setData).catch(() => setError("Could not load model evaluation. Make sure the ML service is running and has trained models."));
  }, []);
  const rows = data?.results || [];
  const best = data?.best_model?.model_name;
  const matrix = data?.best_model?.confusion_matrix || [[0, 0], [0, 0]];
  const featureData = data?.best_model?.feature_importance || [];

  if (error) {
    return <section className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">{error}</section>;
  }
  if (!data) {
    return <p className="text-sm text-slate-500">Loading model evaluation…</p>;
  }
  return (
    <div className="page-grid">
      <div className="grid gap-4 md:grid-cols-5">
        {["accuracy", "precision", "recall", "f1_score", "roc_auc"].map((key) => (
          <div className="glass rounded-xl p-5" key={key}><p className="text-sm uppercase text-slate-500">{key}</p><p className="mt-2 text-2xl font-bold">{data?.best_model?.[key]?.toFixed(3) || "0.000"}</p></div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Confusion Matrix">
          <div className="grid h-full place-items-center">
            <div className="grid grid-cols-2 gap-2">
              {matrix.flat().map((value, index) => <div key={index} className="grid h-24 w-24 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-pink-500 text-2xl font-black text-white">{value}</div>)}
            </div>
          </div>
        </ChartCard>
        <ChartCard title="Feature Importance">
          <ResponsiveContainer>
            <BarChart data={featureData.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="feature" hide /><YAxis /><Tooltip />
              <Bar dataKey="importance">{featureData.slice(0, 8).map((_, i) => <Cell key={i} fill={i % 2 ? "#ec4899" : "#2563eb"} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Model Metrics (best model)">
          <ResponsiveContainer>
            <BarChart data={[
              { metric: "Accuracy", value: data?.best_model?.accuracy ?? 0 },
              { metric: "Precision", value: data?.best_model?.precision ?? 0 },
              { metric: "Recall", value: data?.best_model?.recall ?? 0 },
              { metric: "F1", value: data?.best_model?.f1_score ?? 0 },
              { metric: "ROC-AUC", value: data?.best_model?.roc_auc ?? 0 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="metric" /><YAxis domain={[0, 1]} /><Tooltip />
              <Bar dataKey="value" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <section className="glass rounded-xl p-5">
        <h3 className="mb-4 font-bold">Model Comparison</h3>
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500"><tr><th className="p-3">Model</th><th>Accuracy</th><th>Precision</th><th>Recall</th><th>F1</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.model_name} className={`border-t border-slate-200 dark:border-slate-800 ${row.model_name === best ? "bg-blue-50/80 dark:bg-blue-950/30" : ""}`}><td className="p-3 font-bold">{row.model_name}</td><td>{row.accuracy?.toFixed(3)}</td><td>{row.precision?.toFixed(3)}</td><td>{row.recall?.toFixed(3)}</td><td>{row.f1_score?.toFixed(3)}</td></tr>)}</tbody>
        </table>
      </section>
    </div>
  );
}

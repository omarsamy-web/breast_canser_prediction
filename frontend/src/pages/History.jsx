import { useEffect, useState } from "react";
import { getHistory } from "../services/api.js";

export default function History() {
  const [history, setHistory] = useState({ predictions: [], metrics: [] });
  useEffect(() => { getHistory().then(setHistory).catch(() => {}); }, []);

  return (
    <div className="page-grid">
      <section className="glass rounded-xl p-5">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <input className="input" type="date" />
          <select className="input"><option>All models</option><option>random_forest</option><option>svm</option><option>knn</option></select>
          <select className="input"><option>All results</option><option>Benign</option><option>Malignant</option></select>
        </div>
        <h2 className="mb-4 text-xl font-bold">Previous Predictions</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500"><tr><th className="p-3">Date</th><th>Model</th><th>Diagnosis</th><th>Confidence</th></tr></thead>
          <tbody>{history.predictions.map((row) => <tr className="border-t border-slate-200 dark:border-slate-800" key={row._id}><td className="p-3">{new Date(row.created_at).toLocaleString()}</td><td>{row.model}</td><td>{row.result}</td><td>{Math.round(row.confidence * 100)}%</td></tr>)}</tbody>
        </table>
      </section>
      <section className="glass rounded-xl p-5">
        <h2 className="mb-4 text-xl font-bold">Trained Models</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500"><tr><th className="p-3">Timestamp</th><th>Model</th><th>Accuracy</th><th>F1</th></tr></thead>
          <tbody>{history.metrics.map((row) => <tr className="border-t border-slate-200 dark:border-slate-800" key={row._id}><td className="p-3">{new Date(row.created_at).toLocaleString()}</td><td>{row.model_name}</td><td>{row.accuracy?.toFixed(3)}</td><td>{row.f1_score?.toFixed(3)}</td></tr>)}</tbody>
        </table>
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { getHistory } from "../services/api.js";

export default function History() {
  const [history, setHistory] = useState({ predictions: [], metrics: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ date: "", model: "all", result: "all" });

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch(() => setError("Could not load your history. Please refresh to try again."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return (history.predictions || []).filter((row) => {
      const when = new Date(row.created_at);
      if (filters.model !== "all" && row.model !== filters.model) return false;
      if (filters.result !== "all" && row.result !== filters.result) return false;
      if (filters.date && (!Number.isNaN(when.getTime()) && when.toISOString().slice(0, 10)) !== filters.date) return false;
      return true;
    });
  }, [history.predictions, filters]);

  return (
    <div className="page-grid">
      <section className="glass rounded-xl p-5">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <input className="input" type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} aria-label="Filter by date" />
          <select className="input" value={filters.model} onChange={(e) => setFilters({ ...filters, model: e.target.value })} aria-label="Filter by model">
            <option value="all">All models</option>
            <option>random_forest</option><option>svm</option><option>knn</option><option>decision_tree</option>
          </select>
          <select className="input" value={filters.result} onChange={(e) => setFilters({ ...filters, result: e.target.value })} aria-label="Filter by result">
            <option value="all">All results</option><option>Benign</option><option>Malignant</option>
          </select>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading your history…</p>
        ) : (
          <>
            <h2 className="mb-4 text-xl font-bold">Previous Predictions {filtered.length > 0 && `(${filtered.length})`}</h2>
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No predictions match these filters.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500"><tr><th className="p-3">Date</th><th>Model</th><th>Diagnosis</th><th>Confidence</th></tr></thead>
                <tbody>{filtered.map((row) => <tr className="border-t border-slate-200 dark:border-slate-800" key={row._id}><td className="p-3">{new Date(row.created_at).toLocaleString()}</td><td>{row.model}</td><td>{row.result}</td><td>{row.confidence != null ? `${Math.round(row.confidence * 100)}%` : "—"}</td></tr>)}</tbody>
              </table>
            )}
          </>
        )}
      </section>

      {!error && (
        <section className="glass rounded-xl p-5">
          <h2 className="mb-4 text-xl font-bold">Model Performance</h2>
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500"><tr><th className="p-3">Timestamp</th><th>Model</th><th>Accuracy</th><th>F1</th></tr></thead>
            <tbody>{(history.metrics || []).map((row) => <tr className="border-t border-slate-200 dark:border-slate-800" key={row._id}><td className="p-3">{new Date(row.created_at).toLocaleString()}</td><td>{row.model_name}</td><td>{row.accuracy?.toFixed(3)}</td><td>{row.f1_score?.toFixed(3)}</td></tr>)}</tbody>
          </table>
        </section>
      )}
    </div>
  );
}

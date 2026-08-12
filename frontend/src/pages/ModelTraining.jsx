import { useState } from "react";
import { FaPlay, FaSave, FaSlidersH } from "react-icons/fa";
import { trainModel } from "../services/api.js";
import { modelLabels } from "../utils/features.js";

export default function ModelTraining() {
  const [algorithm, setAlgorithm] = useState("random_forest");
  const [hp, setHp] = useState({ k: 15, max_depth: 10, n_estimators: 160, kernel: "rbf" });
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  async function train() {
    try {
      setError("");
      setProgress(15);
      setLogs(["Preparing dataset", "Applying anti-overfitting settings", `Training ${modelLabels[algorithm]}`]);
      const data = await trainModel({ algorithm, hyperparameters: hp });
      setResult(data);
      setProgress(100);
      setLogs((items) => [
        ...items,
        "Evaluation complete",
        `Best model saved: ${data.best_model.model_name}`,
        `Overfit gap: ${data.best_model.overfit_gap ?? 0}`
      ]);
    } catch (err) {
      setProgress(0);
      const message = err.response?.status === 401
        ? "Your session expired because the development backend restarted. Please log in again."
        : err.response?.data?.message || "Training failed. Make sure the ML service is running and a dataset is available.";
      setError(message);
      setLogs((items) => [...items, message]);
    }
  }

  return (
    <div className="page-grid">
      <section className="glass rounded-xl p-6">
        <div className="mb-5 flex items-center gap-2">
          <FaSlidersH className="text-medical-blue" />
          <h2 className="text-xl font-bold">Model Training</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <select className="input" value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
            {Object.entries(modelLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <input className="input" type="number" value={hp.k} onChange={(e) => setHp({ ...hp, k: Number(e.target.value) })} placeholder="K value" />
          <input className="input" type="number" value={hp.max_depth} onChange={(e) => setHp({ ...hp, max_depth: Number(e.target.value) })} placeholder="Tree depth" />
          <input className="input" type="number" value={hp.n_estimators} onChange={(e) => setHp({ ...hp, n_estimators: Number(e.target.value) })} placeholder="Estimators" />
          <select className="input" value={hp.kernel} onChange={(e) => setHp({ ...hp, kernel: e.target.value })}>
            <option value="rbf">RBF Kernel</option><option value="linear">Linear Kernel</option><option value="poly">Polynomial Kernel</option>
          </select>
        </div>
        <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full bg-gradient-to-r from-medical-blue to-medical-pink transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="btn-primary" onClick={train}><FaPlay /> Train Model</button>
          <button className="btn-soft"><FaSave /> Save Model</button>
          <button className="btn-soft" onClick={() => setAlgorithm("all")}>Compare Models</button>
        </div>
        {error && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-100">{error}</p>}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="glass rounded-xl p-5">
          <h3 className="mb-3 font-bold">Training Logs</h3>
          <div className="space-y-2 font-mono text-sm">
            {logs.map((log, index) => <p key={index} className="rounded-lg bg-slate-950 p-3 text-cyan-200">{log}</p>)}
          </div>
        </div>
        <div className="glass rounded-xl p-5">
          <h3 className="mb-3 font-bold">Latest Results</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="text-slate-500"><th className="p-2">Model</th><th>Accuracy</th><th>Precision</th><th>Recall</th><th>F1</th></tr></thead>
              <tbody>{result?.results?.map((item) => <tr className="border-t border-slate-200 dark:border-slate-800" key={item.model_name}><td className="p-2 font-semibold">{item.model_name}</td><td>{item.accuracy.toFixed(3)}</td><td>{item.precision.toFixed(3)}</td><td>{item.recall.toFixed(3)}</td><td>{item.f1_score.toFixed(3)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

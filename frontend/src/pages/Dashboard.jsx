import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaChartPie, FaCheckCircle, FaCreditCard, FaHeartbeat,
  FaHistory, FaStethoscope
} from "react-icons/fa";
import StatCard from "../components/ui/StatCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getCreditStatus, getHistory } from "../services/api.js";

function PatientDashboard() {
  const { user } = useAuth();
  const [credits, setCredits] = useState(null);
  const [history, setHistory] = useState(null);

  useEffect(() => {
    getCreditStatus().then(setCredits).catch(() => {});
    getHistory().then(setHistory).catch(() => {});
  }, []);

  const predictions = history?.predictions || [];
  const lastResult = predictions[0]?.result;

  return (
    <div className="page-grid">
      <header>
        <h2 className="text-xl font-bold">Welcome, {user?.name}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your personal screening portal. Your illness history is free forever — predictions use credits.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FaCreditCard} label="Credits Left" value={credits?.credits ?? user?.credits ?? 0} tone="pink" />
        <StatCard icon={FaHeartbeat} label="Total Predictions" value={predictions.length} />
        <StatCard icon={FaStethoscope} label="Last Result" value={lastResult || "—"} tone="amber" />
        <StatCard icon={FaCheckCircle} label="Account Role" value="Patient" tone="green" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Link to="/app/prediction" className="glass rounded-xl p-6 transition hover:shadow-lg">
          <FaStethoscope className="text-2xl text-medical-blue" />
          <h3 className="mt-3 font-bold">New Prediction</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Run an AI-assisted breast cancer risk check.</p>
        </Link>
        <Link to="/app/history" className="glass rounded-xl p-6 transition hover:shadow-lg">
          <FaHistory className="text-2xl text-pink-500" />
          <h3 className="mt-3 font-bold">My History</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review every past assessment — always free.</p>
        </Link>
        <Link to="/app/billing" className="glass rounded-xl p-6 transition hover:shadow-lg">
          <FaCreditCard className="text-2xl text-emerald-500" />
          <h3 className="mt-3 font-bold">Credits & Billing</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{(credits?.credits ?? 0) > 0 ? `${credits.credits} credits available.` : "Buy credits to predict."}</p>
        </Link>
      </div>

      <section className="glass rounded-xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-bold"><FaChartPie className="text-medical-blue" /> Recent activity</h3>
          <Link to="/app/history" className="text-sm font-semibold text-medical-blue">View all</Link>
        </div>
        {predictions.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No predictions yet. Run your first AI risk check from the New Prediction page.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500"><tr><th className="p-2">Date</th><th>Model</th><th>Result</th><th>Confidence</th></tr></thead>
            <tbody>
              {predictions.slice(0, 5).map((row) => (
                <tr key={row._id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="p-2">{new Date(row.created_at).toLocaleString()}</td>
                  <td>{row.model}</td>
                  <td className={row.result === "Malignant" ? "font-semibold text-rose-500" : "font-semibold text-emerald-600"}>{row.result}</td>
                  <td>{row.confidence != null ? `${Math.round(row.confidence * 100)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="page-grid">
      <header>
        <h2 className="text-xl font-bold">Clinical Console</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Dataset analysis, model evaluation and unlimited predictions.
        </p>
      </header>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/app/analysis" className="glass rounded-xl p-6 transition hover:shadow-lg">
          <FaChartPie className="text-2xl text-medical-blue" />
          <h3 className="mt-3 font-bold">Data Analysis</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Explore the bundled 1M-row dataset.</p>
        </Link>
        <Link to="/app/evaluation" className="glass rounded-xl p-6 transition hover:shadow-lg">
          <FaCheckCircle className="text-2xl text-emerald-500" />
          <h3 className="mt-3 font-bold">Model Evaluation</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Compare KNN, SVM, Decision Tree & Random Forest.</p>
        </Link>
        <Link to="/app/prediction" className="glass rounded-xl p-6 transition hover:shadow-lg">
          <FaStethoscope className="text-2xl text-pink-500" />
          <h3 className="mt-3 font-bold">Prediction</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Run assessments with clinical features.</p>
        </Link>
        <Link to="/app/admin" className="glass rounded-xl p-6 transition hover:shadow-lg">
          <FaHistory className="text-2xl text-amber-500" />
          <h3 className="mt-3 font-bold">Admin Panel</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Users, usage and platform health.</p>
        </Link>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isStaff = user?.role === "Admin" || user?.role === "Doctor" || user?.role === "Researcher";
  return isStaff ? <AdminDashboard /> : <PatientDashboard />;
}

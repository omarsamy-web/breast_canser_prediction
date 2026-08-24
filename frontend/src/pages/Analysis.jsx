import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FaChartBar, FaDatabase } from "react-icons/fa";
import StatCard from "../components/ui/StatCard.jsx";
import ChartCard from "../components/charts/ChartCard.jsx";
import { analyzeDataset } from "../services/api.js";

export default function Analysis() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    analyzeDataset().then(setData).catch((err) => {
      setError(err.response?.data?.message || "Could not load dataset analysis.");
    });
  }, []);

  if (error) {
    return (
      <section className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
        <p className="font-semibold">{error}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-relaxed">
          <li>Check that the ML service is deployed and healthy on Railway.</li>
          <li>On the backend service, set <code className="rounded bg-rose-100 px-1 dark:bg-rose-900">ML_SERVICE_URL</code> to the ML service's public URL.</li>
          <li>Admins can visit <code className="rounded bg-rose-100 px-1 dark:bg-rose-900">/api/ml/status</code> to see the configured URL and whether the service is reachable.</li>
        </ul>
      </section>
    );
  }

  if (!data) {
    return <p className="text-sm text-slate-500">Analyzing the bundled breast cancer dataset…</p>;
  }

  const dist = Object.entries(data.diagnosisDistribution || {}).map(([name, value]) => ({
    name: ["0", "b", "benign"].includes(name.toLowerCase()) ? "Benign" : ["1", "m", "malignant"].includes(name.toLowerCase()) ? "Malignant" : name,
    value
  }));
  const featureStats = data.featureStats || {};
  const topFeatures = Object.entries(featureStats)
    .slice(0, 12)
    .map(([name, stats]) => ({ name, mean: Number(stats.mean?.toFixed(3)) }));

  return (
    <div className="page-grid">
      <header>
        <h2 className="flex items-center gap-2 text-xl font-bold"><FaChartBar className="text-medical-blue" /> Dataset Analysis</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Permanent bundled dataset: <strong>breast_cancer_40_features_1M.csv</strong> — always used for training and analysis.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={FaDatabase} label="Rows" value={data.rows.toLocaleString()} />
        <StatCard icon={FaDatabase} label="Columns" value={data.columns} tone="pink" />
        <StatCard icon={FaDatabase} label="Null Values" value={data.nullValues.toLocaleString()} tone="amber" />
        <StatCard icon={FaDatabase} label="Duplicates" value={data.duplicateValues.toLocaleString()} />
        <StatCard icon={FaDatabase} label="Features" value={Object.keys(featureStats).length} tone="green" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Diagnosis Distribution">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={dist} dataKey="value" nameKey="name" outerRadius={100}>
                <Cell fill="#10b981" /><Cell fill="#f43f5e" />
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Feature Means (first 12 features)">
          <ResponsiveContainer>
            <BarChart data={topFeatures}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" height={90} interval={0} tick={{ fontSize: 10 }} />
              <YAxis /><Tooltip />
              <Bar dataKey="mean" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <section className="glass rounded-xl p-6">
        <h3 className="font-bold">Data Preview (first 10 rows)</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-max text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {(data.preview?.[0] ? Object.keys(data.preview[0]) : []).map((key) => (
                  <th key={key} className="px-3 py-2 font-bold">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.preview || []).slice(0, 10).map((row, index) => (
                <tr key={index} className="border-b border-slate-100 dark:border-slate-800">
                  {Object.values(row).map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-3 py-1.5">{String(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

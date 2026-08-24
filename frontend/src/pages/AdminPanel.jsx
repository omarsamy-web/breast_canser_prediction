import { useEffect, useState } from "react";
import { adminOverview, adminUsers, getMlStatus } from "../services/api.js";

function MlStatusCard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    getMlStatus()
      .then(setStatus)
      .catch(() => setStatus({ reachable: false, url: "unknown", error: "request failed" }))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const ok = status?.reachable && status?.ready;
  return (
    <section className={`rounded-xl border p-5 ${ok ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30" : "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold">ML Service Status</h3>
        <button type="button" onClick={refresh} className="btn-soft px-3 py-1.5 text-xs">Refresh</button>
      </div>
      {loading ? (
        <p className="mt-2 text-sm text-slate-500">Checking…</p>
      ) : (
        <>
          <p className={`mt-2 text-sm font-semibold ${ok ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
            {ok
              ? `Connected and ready (${status.version ?? "v?"})`
              : status?.reachable
                ? "Reachable but models are not trained yet — check ML service deploy logs."
                : "Not reachable — backend cannot contact the ML service."}
          </p>
          <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <div><dt className="font-semibold text-slate-500">Configured URL</dt><dd className="break-all">{status?.url}</dd></div>
            {status?.error && <div><dt className="font-semibold text-slate-500">Error</dt><dd>{status.error}</dd></div>}
          </dl>
          {!ok && (
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <li>In Railway, open the ml-service → Settings → Networking → copy its public domain.</li>
              <li>Backend → Variables → set <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">ML_SERVICE_URL</code> to that domain (with https://, no trailing slash).</li>
              <li>Optionally set the same <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">ML_ACCESS_TOKEN</code> value on both services.</li>
              <li>Wait for both services to redeploy, then click Refresh.</li>
            </ol>
          )}
        </>
      )}
    </section>
  );
}

export default function AdminPanel() {
  const [overview, setOverview] = useState({});
  const [users, setUsers] = useState([]);
  useEffect(() => {
    adminOverview().then(setOverview).catch(() => {});
    adminUsers().then(setUsers).catch(() => {});
  }, []);

  return (
    <div className="page-grid">
      <div className="grid gap-4 md:grid-cols-4">
        {["users", "predictions", "models", "status"].map((key) => (
          <div className="glass rounded-xl p-5" key={key}><p className="text-sm capitalize text-slate-500">{key}</p><p className="mt-2 text-2xl font-bold">{overview[key] ?? "0"}</p></div>
        ))}
      </div>

      <MlStatusCard />

      <section className="glass rounded-xl p-5">
        <h2 className="mb-4 text-xl font-bold">User Management</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500"><tr><th className="p-3">Name</th><th>Email</th><th>Role</th><th>Credits</th><th>Created</th></tr></thead>
          <tbody>{users.map((user) => <tr className="border-t border-slate-200 dark:border-slate-800" key={user._id}><td className="p-3 font-semibold">{user.name}</td><td>{user.email}</td><td>{user.role}</td><td>{user.credits ?? 0}</td><td>{new Date(user.created_at).toLocaleDateString()}</td></tr>)}</tbody>
        </table>
      </section>
    </div>
  );
}

import { useEffect, useState } from "react";
import { adminOverview, adminUsers } from "../services/api.js";

export default function AdminPanel() {
  const [overview, setOverview] = useState({});
  const [users, setUsers] = useState([]);
  useEffect(() => {
    adminOverview().then(setOverview).catch(() => {});
    adminUsers().then(setUsers).catch(() => {});
  }, []);

  return (
    <div className="page-grid">
      <div className="grid gap-4 md:grid-cols-5">
        {["users", "datasets", "predictions", "models", "status"].map((key) => (
          <div className="glass rounded-xl p-5" key={key}><p className="text-sm capitalize text-slate-500">{key}</p><p className="mt-2 text-2xl font-bold">{overview[key] ?? "0"}</p></div>
        ))}
      </div>
      <section className="glass rounded-xl p-5">
        <h2 className="mb-4 text-xl font-bold">User Management</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500"><tr><th className="p-3">Name</th><th>Email</th><th>Role</th><th>Created</th></tr></thead>
          <tbody>{users.map((user) => <tr className="border-t border-slate-200 dark:border-slate-800" key={user._id}><td className="p-3 font-semibold">{user.name}</td><td>{user.email}</td><td>{user.role}</td><td>{new Date(user.created_at).toLocaleDateString()}</td></tr>)}</tbody>
        </table>
      </section>
      <section className="grid gap-5 md:grid-cols-3">
        {["Dataset management", "Model management", "Logs and monitoring"].map((title) => (
          <div className="glass rounded-xl p-5" key={title}>
            <h3 className="font-bold">{title}</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Operational controls and audit-ready system visibility.</p>
          </div>
        ))}
      </section>
    </div>
  );
}

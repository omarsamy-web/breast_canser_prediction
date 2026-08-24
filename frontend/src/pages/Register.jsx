import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/forms/AuthShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", role: "Doctor" });
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (form.password !== form.confirm) return setError("Passwords do not match");
    setError("");
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: form.role });
      navigate("/app");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  }

  return (
    <AuthShell title={t.auth.registerTitle} subtitle={t.auth.registerSubtitle}>
      <form onSubmit={submit} className="space-y-4">
        <input className="input" placeholder={t.auth.name} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" placeholder={t.auth.email} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option>Admin</option>
          <option>Doctor</option>
          <option>Researcher</option>
        </select>
        <input className="input" placeholder={t.auth.password} type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input className="input" placeholder={t.auth.confirm} type="password" required minLength={8} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
        {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-950/40">{error}</p>}
        <button className="btn-primary w-full" type="submit">{t.auth.register}</button>
      </form>
      <p className="mt-6 text-sm text-slate-500">
        {t.auth.alreadyRegistered} <Link className="font-semibold text-medical-blue" to="/login">{t.auth.login}</Link>
      </p>
    </AuthShell>
  );
}

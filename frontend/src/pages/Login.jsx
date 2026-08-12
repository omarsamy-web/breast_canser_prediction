import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/forms/AuthShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await login({ email: form.email, password: form.password });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  }

  return (
    <AuthShell title={t.auth.welcome} subtitle={t.auth.welcomeSubtitle}>
      <form onSubmit={submit} className="space-y-4">
        <input className="input" placeholder={t.auth.email} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" placeholder={t.auth.password} type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={form.remember} onChange={(e) => setForm({ ...form, remember: e.target.checked })} />
          {t.auth.remember}
        </label>
        {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-950/40">{error}</p>}
        <button className="btn-primary w-full" type="submit">{t.auth.login}</button>
      </form>
      <p className="mt-6 text-sm text-slate-500">
        {t.auth.newHere} <Link className="font-semibold text-medical-blue" to="/register">{t.auth.createAccount}</Link>
      </p>
    </AuthShell>
  );
}

import { FaBell, FaMoon, FaSignOutAlt, FaSun } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

export default function Topbar() {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const { t, toggleLanguage } = useLanguage();

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t.commandCenter}</p>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t.appTitle}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn-soft h-10 w-10 p-0" title={t.notifications}>
          <FaBell />
        </button>
        <button className="btn-soft" onClick={toggleLanguage} title={t.switchLanguage}>
          {t.switchLanguage}
        </button>
        <button className="btn-soft h-10 w-10 p-0" onClick={toggleTheme} title={t.toggleTheme}>
          {dark ? <FaSun /> : <FaMoon />}
        </button>
        <div className="glass hidden rounded-lg px-4 py-2 text-sm md:block">
          <span className="font-semibold">{user?.name || t.clinician}</span>
          <span className="ml-2 text-slate-500 dark:text-slate-400">{user?.role}</span>
        </div>
        <button className="btn-soft h-10 w-10 p-0" onClick={logout} title={t.signOut}>
          <FaSignOutAlt />
        </button>
      </div>
    </header>
  );
}

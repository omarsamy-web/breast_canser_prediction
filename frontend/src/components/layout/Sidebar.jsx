import { NavLink } from "react-router-dom";
import { FaChartPie, FaDatabase, FaHistory, FaMicroscope, FaShieldAlt, FaStethoscope, FaVials } from "react-icons/fa";
import bahiaLogo from "../../assets/bahia-ai-logo.jpg";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function Sidebar() {
  const { t } = useLanguage();
  const links = [
    { to: "/", label: t.nav.dashboard, icon: FaChartPie },
    { to: "/datasets", label: t.nav.datasets, icon: FaDatabase },
    { to: "/training", label: t.nav.training, icon: FaVials },
    { to: "/prediction", label: t.nav.prediction, icon: FaStethoscope },
    { to: "/evaluation", label: t.nav.evaluation, icon: FaMicroscope },
    { to: "/history", label: t.nav.history, icon: FaHistory },
    { to: "/admin", label: t.nav.admin, icon: FaShieldAlt }
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/40 bg-white/60 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/50 lg:block">
      <div className="mb-8 flex items-center gap-3">
        <img src={bahiaLogo} alt="Bahia AI logo" className="h-12 w-12 rounded-xl object-cover shadow-lg shadow-pink-500/20" />
        <div>
          <p className="text-lg font-bold">Bahia AI</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.brandSubtitle}</p>
        </div>
      </div>
      <nav className="space-y-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-medical-blue text-white shadow-lg shadow-blue-500/20"
                  : "text-slate-600 hover:bg-white/70 hover:text-medical-blue dark:text-slate-300 dark:hover:bg-white/10"
              }`
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

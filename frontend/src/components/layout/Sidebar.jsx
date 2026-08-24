import { NavLink } from "react-router-dom";
import {
  FaChartPie, FaChartBar, FaCreditCard, FaHistory,
  FaMicroscope, FaShieldAlt, FaStethoscope
} from "react-icons/fa";
import bahiaLogo from "../../assets/bahia-ai-logo.jpg";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Sidebar() {
  const { user } = useAuth();
  const isStaff = user?.role === "Admin" || user?.role === "Doctor" || user?.role === "Researcher";

  const links = [
    { to: "/app", label: "Dashboard", icon: FaChartPie, end: true },
    ...(isStaff
      ? [
          { to: "/app/analysis", label: "Data Analysis", icon: FaChartBar },
          { to: "/app/evaluation", label: "Model Evaluation", icon: FaMicroscope }
        ]
      : [
          { to: "/app/prediction", label: "New Prediction", icon: FaStethoscope },
          { to: "/app/history", label: "My History", icon: FaHistory },
          { to: "/app/billing", label: "Credits & Billing", icon: FaCreditCard }
        ]),
    ...(isStaff ? [{ to: "/app/prediction", label: "Prediction", icon: FaStethoscope }, { to: "/app/admin", label: "Admin Panel", icon: FaShieldAlt }] : [])
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/40 bg-white/60 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/50 lg:block">
      <div className="mb-8 flex items-center gap-3">
        <img src={bahiaLogo} alt="Bahia AI logo" className="h-12 w-12 rounded-xl object-cover shadow-lg shadow-pink-500/20" />
        <div>
          <p className="text-lg font-bold">Bahia AI</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{isStaff ? "Clinical console" : "Patient portal"}</p>
        </div>
      </div>
      <nav className="space-y-2">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={label}
            to={to}
            end={end}
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
      {!isStaff && (
        <div className="mt-8 rounded-xl bg-blue-50 p-4 text-xs leading-relaxed text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
          Your first prediction is free. After that, predictions use paid credits — see Credits & Billing.
        </div>
      )}
    </aside>
  );
}

import { motion } from "framer-motion";
import { FaHeartbeat } from "react-icons/fa";
import bahiaLogo from "../../assets/bahia-ai-logo.jpg";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function AuthShell({ title, subtitle, children }) {
  const { t, toggleLanguage } = useLanguage();
  return (
    <div className="grid min-h-screen place-items-center bg-[linear-gradient(135deg,#eff8ff,#fff0f7)] p-4 dark:bg-[linear-gradient(135deg,#07111f,#172033)]">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="hidden p-10 lg:block">
          <div className="flex items-center gap-3">
            <img src={bahiaLogo} alt="Bahia AI logo" className="h-14 w-14 rounded-xl object-cover shadow-lg shadow-pink-500/20" />
            <div>
              <p className="text-xl font-bold">Bahia AI</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t.auth.subtitle}</p>
            </div>
          </div>
          <div className="mt-16 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-400 to-pink-400 p-1">
            <div className="rounded-2xl bg-white/20 p-10 text-white backdrop-blur">
              <img src={bahiaLogo} alt="" className="h-28 w-28 rounded-2xl bg-white object-cover shadow-xl" />
              <h2 className="mt-8 text-4xl font-black">{t.auth.heroTitle}</h2>
              <p className="mt-4 max-w-md text-white/85">
                {t.auth.heroText}
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6 md:p-10">
          <div className="mb-4 flex justify-end">
            <button className="btn-soft" onClick={toggleLanguage}>{t.switchLanguage}</button>
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  );
}

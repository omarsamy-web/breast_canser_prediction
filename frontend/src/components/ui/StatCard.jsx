import { motion } from "framer-motion";

export default function StatCard({ icon: Icon, label, value, tone = "blue" }) {
  const tones = {
    blue: "from-blue-500 to-cyan-400",
    pink: "from-pink-500 to-rose-400",
    green: "from-emerald-500 to-teal-400",
    amber: "from-amber-500 to-orange-400"
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${tones[tone]} text-white`}>
          <Icon />
        </div>
      </div>
    </motion.div>
  );
}

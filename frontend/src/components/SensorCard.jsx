import { AnimatePresence, motion } from "framer-motion";

const ACCENTS = {
  sky: "text-sky border-sky/20 shadow-[0_0_24px_-8px_rgba(56,189,248,0.5)]",
  amber: "text-amber border-amber/20 shadow-[0_0_24px_-8px_rgba(245,166,35,0.5)]",
  teal: "text-teal border-teal/20 shadow-[0_0_24px_-8px_rgba(45,212,191,0.5)]",
  coral: "text-coral border-coral/20 shadow-[0_0_24px_-8px_rgba(251,113,133,0.5)]",
};

export default function SensorCard({ icon: Icon, label, value, unit, accent = "sky", sublabel }) {
  const display = value === null || value === undefined || Number.isNaN(value) ? "—" : value;

  return (
    <div className="glass p-5 flex flex-col gap-3 animate-riseIn">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-textMuted">{label}</span>
        <div className={`h-8 w-8 rounded-lg border flex items-center justify-center ${ACCENTS[accent]}`}>
          <Icon size={15} />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 font-mono">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={display}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-3xl font-semibold text-textPrimary"
          >
            {display}
          </motion.span>
        </AnimatePresence>
        {unit && <span className="text-sm text-textMuted">{unit}</span>}
      </div>

      {sublabel && <span className="text-[11px] text-textMuted">{sublabel}</span>}
    </div>
  );
}

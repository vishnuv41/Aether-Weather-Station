import { useState } from "react";

const PRESETS = [
  { key: "1h", label: "Last 1 hour" },
  { key: "24h", label: "Last 24 hours" },
  { key: "7d", label: "Last 7 days" },
  { key: "custom", label: "Custom date" },
];

export default function DateRangeTabs({ value, onChange }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  return (
    <div className="glass p-4 flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange({ range: p.key, start, end })}
          className={`text-xs px-3.5 py-2 rounded-lg border transition-colors ${
            value.range === p.key
              ? "border-sky text-sky bg-sky/10"
              : "border-line/60 text-textMuted hover:text-textPrimary hover:border-textMuted"
          }`}
        >
          {p.label}
        </button>
      ))}

      {value.range === "custom" && (
        <div className="flex items-center gap-2 ml-1">
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="bg-panel2 border border-line/60 rounded-lg px-2 py-1.5 text-xs text-textPrimary"
          />
          <span className="text-textMuted text-xs">to</span>
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="bg-panel2 border border-line/60 rounded-lg px-2 py-1.5 text-xs text-textPrimary"
          />
          <button
            onClick={() => onChange({ range: "custom", start, end })}
            disabled={!start || !end}
            className="text-xs px-3 py-1.5 rounded-lg bg-sky text-deep font-medium disabled:opacity-40"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

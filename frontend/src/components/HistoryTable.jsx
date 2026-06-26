function fmtTime(ts) {
  return new Date(ts * 1000).toLocaleString();
}

export default function HistoryTable({ readings }) {
  const rows = [...readings].slice(-300).reverse(); // most recent first, capped for render perf

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-sm text-textPrimary">Stored Readings</h3>
        <span className="text-[11px] text-textMuted">{readings.length} total</span>
      </div>

      <div className="max-h-[420px] overflow-auto rounded-xl border border-line/60">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-panel2 text-textMuted">
            <tr>
              {["Time", "Temp °C", "Humidity %", "Pressure hPa", "Light lx", "UV", "Air", "Rain", "Wind"].map((h) => (
                <th key={h} className="text-left font-medium px-3 py-2 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={9} className="text-center text-textMuted py-6">No stored readings in this range yet.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.timestamp} className="border-t border-line/40 text-textPrimary hover:bg-panel2/60">
                <td className="px-3 py-2 whitespace-nowrap font-mono">{fmtTime(r.timestamp)}</td>
                <td className="px-3 py-2 font-mono">{r.temperature?.toFixed?.(1) ?? r.temperature}</td>
                <td className="px-3 py-2 font-mono">{r.humidity?.toFixed?.(0) ?? r.humidity}</td>
                <td className="px-3 py-2 font-mono">{r.pressure?.toFixed?.(0) ?? r.pressure}</td>
                <td className="px-3 py-2 font-mono">{r.light}</td>
                <td className="px-3 py-2 font-mono">{r.uv}</td>
                <td className="px-3 py-2 font-mono">{r.air_quality}</td>
                <td className="px-3 py-2 font-mono">{r.rain ? "Yes" : "No"}</td>
                <td className="px-3 py-2 font-mono">{r.wind_speed ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

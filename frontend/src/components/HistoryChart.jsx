import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function formatTime(ts) {
  const d = new Date(ts * 1000);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function HistoryChart({ title, readings, dataKey, color, unit = "" }) {
  const data = readings.map((r) => ({ ts: r.timestamp, value: r[dataKey] }));
  const gradientId = `hist-grad-${dataKey}`;

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-sm text-textPrimary">{title}</h3>
        <span className="text-[11px] text-textMuted">{readings.length} points</span>
      </div>

      {data.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-textMuted text-sm">
          No data in this range yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="ts"
              tickFormatter={formatTime}
              stroke="#7C8AA5"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis stroke="#7C8AA5" fontSize={11} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
            <Tooltip
              labelFormatter={(ts) => formatTime(ts)}
              formatter={(v) => [`${v}${unit}`, title]}
              contentStyle={{ background: "#111A2E", border: "1px solid #1E293B", borderRadius: 10, fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              isAnimationActive
              animationDuration={400}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

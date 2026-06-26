import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from "recharts";

/**
 * Smooth rolling-window live chart. `data` should be a capped array
 * (e.g. last 40 points) the parent keeps appending to — recharts re-renders
 * efficiently and the short animationDuration keeps new points gliding in
 * instead of popping, with no visible "breakage" between updates.
 */
export default function LiveChart({ data, color = "#38BDF8", unit = "", height = 90 }) {
  const gradientId = `grad-${color.replace("#", "")}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={["auto", "auto"]} />
        <Tooltip
          formatter={(v) => [`${v}${unit}`, ""]}
          labelFormatter={() => ""}
          contentStyle={{ background: "#111A2E", border: "1px solid #1E293B", borderRadius: 10, fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          isAnimationActive
          animationDuration={300}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

import { ArrowUp, ArrowDown, Minus, Droplet, Flame, Wind as WindIcon, CloudRain } from "lucide-react";

const TREND_ICON = { RISING: ArrowUp, FALLING: ArrowDown, FLAT: Minus };
const TREND_COLOR = { RISING: "text-teal", FALLING: "text-coral", FLAT: "text-textMuted" };

export default function MetricsSummary({ stats }) {
  const TrendIcon = TREND_ICON[stats?.pressureTrend] || Minus;

  const items = [
    {
      label: "Temp range",
      value: stats?.tempMin != null && stats?.tempMax != null ? `${stats.tempMin}° – ${stats.tempMax}°` : "—",
      sub: `avg ${stats?.tempAvg ?? "—"}°C`,
      icon: Flame,
      accent: "amber",
    },
    {
      label: "Dew point",
      value: stats?.dewPoint != null ? `${stats.dewPoint}°C` : "—",
      sub: "condensation threshold",
      icon: Droplet,
      accent: "sky",
    },
    {
      label: "Heat index",
      value: stats?.heatIndex != null ? `${stats.heatIndex}°C` : "—",
      sub: "feels-like temperature",
      icon: Flame,
      accent: "coral",
    },
    {
      label: "Pressure trend",
      value: stats?.pressureTrend || "—",
      sub: `avg ${stats?.pressureAvg ?? "—"} hPa`,
      icon: TrendIcon,
      accent: TREND_COLOR[stats?.pressureTrend] === "text-coral" ? "coral" : "teal",
    },
    {
      label: "Air quality",
      value: stats?.airLabel || "—",
      sub: `avg reading ${stats?.airAvg ?? "—"}`,
      icon: WindIcon,
      accent: stats?.airLabel === "POOR" ? "coral" : stats?.airLabel === "MODERATE" ? "amber" : "teal",
    },
    {
      label: "Rain events",
      value: stats?.rainEvents ?? "—",
      sub: `out of ${stats?.count ?? 0} readings`,
      icon: CloudRain,
      accent: "sky",
    },
  ];

  const ACCENT_TEXT = { sky: "text-sky", amber: "text-amber", teal: "text-teal", coral: "text-coral" };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map(({ label, value, sub, icon: Icon, accent }) => (
        <div key={label} className="glass p-4 flex flex-col gap-1.5">
          <Icon size={14} className={ACCENT_TEXT[accent] || "text-sky"} />
          <span className="text-[11px] text-textMuted">{label}</span>
          <span className="text-lg font-display font-semibold text-textPrimary">{value}</span>
          <span className="text-[10px] text-textMuted">{sub}</span>
        </div>
      ))}
    </div>
  );
}

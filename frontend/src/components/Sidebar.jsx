import { NavLink } from "react-router-dom";
import { Activity, History, Settings, CloudRain } from "lucide-react";

const links = [
  { to: "/", label: "Live Data", icon: Activity },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col gap-8 px-5 py-6 border-r border-line/60">
      <div className="flex items-center gap-2 px-1">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky to-teal flex items-center justify-center shadow-glow">
          <CloudRain size={18} className="text-deep" />
        </div>
        <div>
          <p className="font-display font-semibold text-textPrimary leading-tight">Aether</p>
          <p className="text-[11px] text-textMuted leading-tight">Weather Station</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActive
                  ? "bg-panel text-textPrimary shadow-glass border border-line/60"
                  : "text-textMuted hover:text-textPrimary hover:bg-panel/50"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto text-[11px] text-textMuted px-1 leading-relaxed">
        DHT11 · BMP280 · BH1750 · MQ135
        <br />
        GUVA-UV · Rain · Anemometer
      </div>
    </aside>
  );
}

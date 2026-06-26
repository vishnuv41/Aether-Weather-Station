import { Thermometer, Gauge, Sun, Wind, CloudRain, Eye, Droplets } from "lucide-react";

function deriveSensors(reading, status) {
  const online = !!status?.online;
  const sensors = status?.sensors || {};
  const has = (v) => typeof v === "number" && !Number.isNaN(v);

  return [
    { key: "dht11", label: "DHT11 — Temp/Humidity", icon: Droplets, ok: online && has(reading?.humidity) },
    { key: "bmp280", label: "BMP280 — Pressure", icon: Gauge, ok: sensors.bmp280 !== undefined ? sensors.bmp280 && online : online && has(reading?.pressure) },
    { key: "bh1750", label: "BH1750 — Light", icon: Sun, ok: sensors.bh1750 !== undefined ? sensors.bh1750 && online : online && has(reading?.light) },
    { key: "mq135", label: "MQ135 — Air Quality", icon: Eye, ok: online && has(reading?.air_quality) },
    { key: "uv", label: "GUVA — UV Index", icon: Sun, ok: online && has(reading?.uv) },
    { key: "rain", label: "Rain Sensor", icon: CloudRain, ok: online && reading?.rain !== undefined && reading?.rain !== null },
    { key: "wind", label: "Anemometer — Wind", icon: Wind, ok: online && has(reading?.wind_speed) },
    { key: "aws", label: "AWS IoT Link", icon: Thermometer, ok: !!status?.awsIotConnected },
  ];
}

export default function SensorStatusPanel({ reading, status }) {
  const sensors = deriveSensors(reading, status);

  return (
    <div className="glass p-5">
      <h3 className="font-display text-sm text-textPrimary mb-4">Sensor Health</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {sensors.map(({ key, label, icon: Icon, ok }) => (
          <div key={key} className="flex flex-col gap-2 p-3 rounded-xl border border-line/60 bg-panel2/40">
            <div className="flex items-center justify-between">
              <Icon size={14} className={ok ? "text-teal" : "text-textMuted"} />
              <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-teal animate-pulseDot" : "bg-coral"}`} />
            </div>
            <span className="text-[11px] text-textMuted leading-tight">{label}</span>
            <span className={`text-xs font-medium ${ok ? "text-teal" : "text-coral"}`}>
              {ok ? "Online" : "Offline"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

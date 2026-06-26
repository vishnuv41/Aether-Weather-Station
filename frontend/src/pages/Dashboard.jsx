import { useEffect, useRef, useState } from "react";
import { Thermometer, Droplets, Gauge, Sun, ShieldAlert, CloudRain, Wind, Eye } from "lucide-react";
import { useConnection } from "../context/ConnectionContext";
import { getLive, getHistory } from "../api/endpoints";
import ConnectionBadge from "../components/ConnectionBadge";
import SensorCard from "../components/SensorCard";
import LiveChart from "../components/LiveChart";
import SensorStatusPanel from "../components/SensorStatusPanel";
import MetricsSummary from "../components/MetricsSummary";
import ControlCard from "../components/ControlCard";
import ExportPanel from "../components/ExportPanel";
import Loader from "../components/Loader";

const MAX_POINTS = 40;
const POLL_MS = 3000;

function pushPoint(buffer, value) {
  const next = [...buffer, { value }];
  return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next;
}

function tempHue(temp) {
  if (temp === null || temp === undefined || Number.isNaN(temp)) return 200;
  const hue = 210 - temp * 5;
  return Math.max(0, Math.min(210, hue));
}

export default function Dashboard() {
  const conn = useConnection();
  const [reading, setReading] = useState(null);
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [tempBuf, setTempBuf] = useState([]);
  const [humBuf, setHumBuf] = useState([]);
  const [pressBuf, setPressBuf] = useState([]);
  const [airBuf, setAirBuf] = useState([]);

  const pollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const live = await getLive(conn);
        if (cancelled) return;
        setReading(live.reading);
        setStatus(live.status);
        setErrorMsg(null);

        if (live.reading) {
          setTempBuf((b) => pushPoint(b, live.reading.temperature));
          setHumBuf((b) => pushPoint(b, live.reading.humidity));
          setPressBuf((b) => pushPoint(b, live.reading.pressure));
          setAirBuf((b) => pushPoint(b, live.reading.air_quality));
        }
      } catch (e) {
        if (!cancelled) setErrorMsg("Couldn't fetch live data — check your connection in Settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    tick();
    pollRef.current = setInterval(tick, POLL_MS);
    return () => { cancelled = true; clearInterval(pollRef.current); };
  }, [conn.mode, conn.backendUrl, conn.esp32Ip]);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const hist = await getHistory(conn, { range: "24h" });
        if (!cancelled) setStats(hist.stats);
      } catch { /* non-fatal */ }
    }
    loadStats();
    const id = setInterval(loadStats, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, [conn.mode, conn.backendUrl, conn.esp32Ip]);

  if (loading) {
    return (
      <div className="p-8">
        <Loader label="Connecting to weather station…" />
      </div>
    );
  }

  const hue = tempHue(reading?.temperature);

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl text-textPrimary">Live Weather</h1>
          <p className="text-textMuted text-sm">{reading?.device_id || "ESP32_Weather"}</p>
        </div>
        <ConnectionBadge online={!!status?.online} />
      </div>

      {errorMsg && (
        <div className="glass border border-coral/30 px-4 py-3 text-coral text-sm flex items-center gap-2">
          <ShieldAlert size={15} /> {errorMsg}
        </div>
      )}

      {/* ---- Hero reading with signature atmospheric pulse ---- */}
      <div className="relative overflow-hidden glass p-8" style={{ "--temp-hue": hue }}>
        <div className="atmos-pulse" />
        <div className="relative z-10 flex items-end gap-4">
          <span className="font-display font-semibold text-6xl text-textPrimary font-mono">
            {reading?.temperature != null ? reading.temperature.toFixed(1) : "—"}
          </span>
          <span className="text-2xl text-textMuted mb-2">°C</span>
          <div className="ml-6 flex flex-col text-xs text-textMuted gap-1">
            <span>Humidity {reading?.humidity != null ? `${reading.humidity.toFixed(0)}%` : "—"}</span>
            <span>Pressure {reading?.pressure != null ? `${reading.pressure.toFixed(0)} hPa` : "—"}</span>
          </div>
        </div>
      </div>

      {/* ---- Sensor cards ---- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SensorCard icon={Thermometer} label="Temperature" value={reading?.temperature?.toFixed?.(1)} unit="°C" accent="amber" />
        <SensorCard icon={Droplets} label="Humidity" value={reading?.humidity?.toFixed?.(0)} unit="%" accent="sky" />
        <SensorCard icon={Gauge} label="Pressure" value={reading?.pressure?.toFixed?.(0)} unit="hPa" accent="teal" />
        <SensorCard icon={Sun} label="Light" value={reading?.light?.toFixed?.(0)} unit="lux" accent="amber" />
        <SensorCard icon={Eye} label="UV Index" value={reading?.uv} accent="amber" />
        <SensorCard
          icon={ShieldAlert}
          label="Air Quality"
          value={reading?.air_quality}
          accent={reading?.air_quality > 1500 ? "coral" : reading?.air_quality > 800 ? "amber" : "teal"}
          sublabel={reading?.air_quality != null ? (reading.air_quality < 800 ? "GOOD" : reading.air_quality < 1500 ? "MODERATE" : "POOR") : null}
        />
        <SensorCard icon={CloudRain} label="Rain" value={reading?.rain ? "YES" : "NO"} accent={reading?.rain ? "sky" : "teal"} />
        <SensorCard icon={Wind} label="Wind Speed" value={reading?.wind_speed} unit="km/h" accent="sky" />
      </div>

      {/* ---- Live trend mini-charts ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-4">
          <p className="text-xs text-textMuted mb-1">Temperature vs Time</p>
          <LiveChart data={tempBuf} color="#F5A623" unit="°C" />
        </div>
        <div className="glass p-4">
          <p className="text-xs text-textMuted mb-1">Humidity vs Time</p>
          <LiveChart data={humBuf} color="#38BDF8" unit="%" />
        </div>
        <div className="glass p-4">
          <p className="text-xs text-textMuted mb-1">Pressure Trend</p>
          <LiveChart data={pressBuf} color="#2DD4BF" unit=" hPa" />
        </div>
        <div className="glass p-4">
          <p className="text-xs text-textMuted mb-1">Air Quality Trend</p>
          <LiveChart data={airBuf} color="#FB7185" unit="" />
        </div>
      </div>

      {/* ---- Calculated insights ---- */}
      <MetricsSummary stats={stats} />

      {/* ---- Status + control + export ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1"><SensorStatusPanel reading={reading} status={status} /></div>
        <div className="lg:col-span-1"><ControlCard status={status} /></div>
        <div className="lg:col-span-1"><ExportPanel range={{ range: "24h" }} /></div>
      </div>
    </div>
  );
}

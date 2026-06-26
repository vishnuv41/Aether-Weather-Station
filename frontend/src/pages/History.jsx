import { useEffect, useState } from "react";
import { useConnection } from "../context/ConnectionContext";
import { getHistory } from "../api/endpoints";
import DateRangeTabs from "../components/DateRangeTabs";
import HistoryChart from "../components/HistoryChart";
import MetricsSummary from "../components/MetricsSummary";
import HistoryTable from "../components/HistoryTable";
import ExportPanel from "../components/ExportPanel";
import Loader from "../components/Loader";

export default function History() {
  const conn = useConnection();
  const [range, setRange] = useState({ range: "24h" });
  const [data, setData] = useState({ readings: [], stats: null, unsupported: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await getHistory(conn, range);
        if (!cancelled) setData(res);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [conn.mode, conn.backendUrl, conn.esp32Ip, range.range, range.start, range.end]);

  return (
    <div className="p-8 flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl text-textPrimary">History</h1>
        <p className="text-textMuted text-sm">Stored readings pulled from DynamoDB via the backend API.</p>
      </div>

      <DateRangeTabs value={range} onChange={setRange} />

      {data.unsupported && (
        <div className="glass border border-amber/30 px-4 py-3 text-amber text-sm">
          You're in Local mode — the ESP32 doesn't store past readings itself.
          Switch to Cloud mode in Settings to see history, export CSV, or generate PDF reports.
        </div>
      )}

      {loading ? (
        <Loader label="Loading history…" />
      ) : (
        <>
          <MetricsSummary stats={data.stats} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <HistoryChart title="Temperature vs Time" readings={data.readings} dataKey="temperature" color="#F5A623" unit="°C" />
            <HistoryChart title="Humidity vs Time" readings={data.readings} dataKey="humidity" color="#38BDF8" unit="%" />
            <HistoryChart title="Pressure Trend" readings={data.readings} dataKey="pressure" color="#2DD4BF" unit=" hPa" />
            <HistoryChart title="Air Quality Trend" readings={data.readings} dataKey="air_quality" color="#FB7185" unit="" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2"><HistoryTable readings={data.readings} /></div>
            <div className="lg:col-span-1"><ExportPanel range={range} /></div>
          </div>
        </>
      )}
    </div>
  );
}

import { useState } from "react";
import { Settings2, CheckCircle2, XCircle } from "lucide-react";
import { useConnection } from "../context/ConnectionContext";
import { setUploadInterval } from "../api/endpoints";

const PRESETS = [
  { label: "5 sec", ms: 5000 },
  { label: "10 sec", ms: 10000 },
  { label: "30 sec", ms: 30000 },
  { label: "1 min", ms: 60000 },
];

function formatInterval(ms) {
  if (!ms) return "—";
  return ms >= 60000 ? `${ms / 60000} min` : `${ms / 1000} sec`;
}

function formatTimestamp(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function ControlCard({ status }) {
  const conn = useConnection();
  const [selected, setSelected] = useState(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { ok, message }

  async function handleUpdate() {
    if (!selected) return;
    setSending(true);
    setResult(null);
    try {
      const res = await setUploadInterval(conn, selected);
      setResult({ ok: res.ok !== false, message: res.status || "Command sent ✅" });
    } catch (e) {
      setResult({ ok: false, message: "Could not reach the device/backend." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="glass p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Settings2 size={16} className="text-sky" />
        <h3 className="font-display text-sm text-textPrimary">Device Control</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl border border-line/60 p-3">
          <p className="text-textMuted">Current Interval</p>
          <p className="text-textPrimary font-mono text-base mt-1">{formatInterval(status?.currentIntervalMs)}</p>
        </div>
        <div className="rounded-xl border border-line/60 p-3">
          <p className="text-textMuted">Total Packets</p>
          <p className="text-textPrimary font-mono text-base mt-1">{status?.packetsReceived ?? 0}</p>
        </div>
        <div className="rounded-xl border border-line/60 p-3 col-span-2">
          <p className="text-textMuted">Last Data Received</p>
          <p className="text-textPrimary font-mono text-sm mt-1">{formatTimestamp(status?.lastReceivedAt)}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-textMuted mb-2">Change Upload Interval</p>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.ms}
              onClick={() => setSelected(p.ms)}
              className={`text-xs py-2 rounded-lg border transition-colors ${
                selected === p.ms
                  ? "border-sky text-sky bg-sky/10"
                  : "border-line/60 text-textMuted hover:text-textPrimary hover:border-textMuted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleUpdate}
        disabled={!selected || sending}
        className="w-full py-2.5 rounded-xl bg-sky text-deep font-medium text-sm disabled:opacity-40 hover:brightness-110 transition"
      >
        {sending ? "Sending…" : "Update"}
      </button>

      {result && (
        <div className={`flex items-center gap-2 text-xs ${result.ok ? "text-teal" : "text-coral"}`}>
          {result.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          {result.message}
        </div>
      )}
    </div>
  );
}

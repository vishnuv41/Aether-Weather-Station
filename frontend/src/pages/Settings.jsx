import { useState } from "react";
import { Cloud, Radio, CheckCircle2, XCircle, Server } from "lucide-react";
import { useConnection } from "../context/ConnectionContext";

export default function Settings() {
  const conn = useConnection();
  const [ipInput, setIpInput] = useState(conn.esp32Ip);
  const [backendInput, setBackendInput] = useState(conn.backendUrl);

  async function handleConnectLocal() {
    await conn.connectToEsp32(ipInput.trim());
  }

  function handleSaveBackend() {
    conn.setBackendUrl(backendInput.trim());
    conn.switchToCloud();
  }

  return (
    <div className="p-8 flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="font-display text-xl text-textPrimary">Settings</h1>
        <p className="text-textMuted text-sm">Choose how this dashboard talks to your weather station.</p>
      </div>

      {/* ---- Mode selector ---- */}
      <div className="glass p-5">
        <h3 className="font-display text-sm text-textPrimary mb-4">Connection Mode</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={conn.switchToCloud}
            className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-colors ${
              conn.mode === "cloud" ? "border-sky bg-sky/10" : "border-line/60 hover:border-textMuted"
            }`}
          >
            <Cloud size={18} className="text-sky" />
            <span className="text-sm font-medium text-textPrimary">Cloud</span>
            <span className="text-[11px] text-textMuted leading-relaxed">
              ESP32 → AWS IoT → DynamoDB → React. Works from anywhere, keeps full history.
            </span>
          </button>

          <button
            onClick={() => conn.setMode("local")}
            className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-colors ${
              conn.mode === "local" ? "border-teal bg-teal/10" : "border-line/60 hover:border-textMuted"
            }`}
          >
            <Radio size={18} className="text-teal" />
            <span className="text-sm font-medium text-textPrimary">Local</span>
            <span className="text-[11px] text-textMuted leading-relaxed">
              Browser → ESP32 IP directly. Live values only, same WiFi network required.
            </span>
          </button>
        </div>
      </div>

      {/* ---- Local IP connect ---- */}
      <div className="glass p-5">
        <h3 className="font-display text-sm text-textPrimary mb-1">Connect via Local IP</h3>
        <p className="text-[11px] text-textMuted mb-4">
          Find this on the ESP32's serial monitor at boot, e.g. <span className="font-mono">192.168.1.42</span>.
        </p>
        <div className="flex items-center gap-3">
          <input
            value={ipInput}
            onChange={(e) => setIpInput(e.target.value)}
            placeholder="192.168.1.42"
            className="flex-1 bg-panel2 border border-line/60 rounded-xl px-4 py-2.5 text-sm font-mono text-textPrimary placeholder:text-textMuted/50"
          />
          <button
            onClick={handleConnectLocal}
            disabled={conn.checking || !ipInput}
            className="px-5 py-2.5 rounded-xl bg-teal text-deep text-sm font-medium disabled:opacity-40 hover:brightness-110 transition"
          >
            {conn.checking ? "Connecting…" : "Connect"}
          </button>
        </div>

        {conn.esp32Connected && conn.mode === "local" && (
          <div className="flex items-center gap-2 text-teal text-xs mt-3">
            <CheckCircle2 size={14} /> Connected to {conn.esp32Ip} — switched to Local mode.
          </div>
        )}
        {conn.esp32Error && (
          <div className="flex items-center gap-2 text-coral text-xs mt-3">
            <XCircle size={14} /> {conn.esp32Error}
          </div>
        )}
      </div>

      {/* ---- Backend URL (Cloud mode) ---- */}
      <div className="glass p-5">
        <div className="flex items-center gap-2 mb-1">
          <Server size={15} className="text-sky" />
          <h3 className="font-display text-sm text-textPrimary">Cloud Backend URL</h3>
        </div>
        <p className="text-[11px] text-textMuted mb-4">
          The Node/Express API from <span className="font-mono">backend/</span> (defaults to
          <span className="font-mono"> http://localhost:5000</span>).
        </p>
        <div className="flex items-center gap-3">
          <input
            value={backendInput}
            onChange={(e) => setBackendInput(e.target.value)}
            placeholder="http://localhost:5000"
            className="flex-1 bg-panel2 border border-line/60 rounded-xl px-4 py-2.5 text-sm font-mono text-textPrimary"
          />
          <button
            onClick={handleSaveBackend}
            className="px-5 py-2.5 rounded-xl bg-sky text-deep text-sm font-medium hover:brightness-110 transition"
          >
            Save & Use Cloud
          </button>
        </div>
      </div>
    </div>
  );
}

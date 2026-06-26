// src/api/endpoints.js
// Single abstraction over "Cloud" (Node backend -> DynamoDB) vs "Local" (direct ESP32 IP).
// Every function takes the connection object from ConnectionContext as its first arg.
import { http } from "./client";

function emptyStats() {
  return {
    count: 0, tempMin: null, tempMax: null, tempAvg: null, humidityAvg: null,
    pressureAvg: null, pressureTrend: "FLAT", airAvg: null, airLabel: "UNKNOWN",
    rainEvents: 0, dewPoint: null, heatIndex: null,
  };
}

/** Normalize the ESP32's /data shape into the same shape /api/live returns. */
function normalizeLocalReading(d) {
  return {
    reading: {
      device_id: d.device_id,
      timestamp: d.timestamp,
      temperature: d.temperature,
      humidity: d.humidity,
      pressure: d.pressure,
      light: d.light,
      uv: d.uv,
      air_quality: d.air_quality,
      rain: d.rain,
      wind_speed: d.wind_speed,
    },
    status: {
      online: true,
      lastReceivedAt: new Date().toISOString(),
      packetsReceived: d.packets_sent,
      currentIntervalMs: d.upload_interval_ms,
      lastCommandStatus: null,
      awsIotConnected: d.aws_connected,
      sensors: d.sensors,
    },
  };
}

export async function getLive(conn) {
  if (conn.mode === "local") {
    if (!conn.esp32Ip) return { reading: null, status: { online: false } };
    const { data } = await http.get(`http://${conn.esp32Ip}/data`, { timeout: 4000 });
    return normalizeLocalReading(data);
  }
  const { data } = await http.get(`${conn.backendUrl}/api/live`);
  return data;
}

export async function getStatus(conn) {
  if (conn.mode === "local") {
    const live = await getLive(conn);
    return live.status;
  }
  const { data } = await http.get(`${conn.backendUrl}/api/status`);
  return data;
}

export async function getHistory(conn, { range = "24h", start, end } = {}) {
  if (conn.mode === "local") {
    // The ESP32 itself stores no history — only the cloud path persists to DynamoDB.
    return { range, readings: [], stats: emptyStats(), unsupported: true };
  }
  const params = { range };
  if (range === "custom") { params.start = start; params.end = end; }
  const { data } = await http.get(`${conn.backendUrl}/api/history`, { params });
  return data;
}

export async function setUploadInterval(conn, intervalMs) {
  if (conn.mode === "local") {
    if (!conn.esp32Ip) throw new Error("Not connected to a device IP");
    await http.post(`http://${conn.esp32Ip}/setInterval`, { interval: intervalMs }, { timeout: 4000 });
    return { ok: true, interval: intervalMs, status: "Command sent directly to device ✅" };
  }
  const { data } = await http.post(`${conn.backendUrl}/api/control/interval`, { interval: intervalMs });
  return data;
}

export function exportCsvUrl(conn, { range = "24h", start, end } = {}) {
  if (conn.mode === "local") return null; // unsupported locally
  const params = new URLSearchParams({ range });
  if (range === "custom") { params.set("start", start); params.set("end", end); }
  return `${conn.backendUrl}/api/export/csv?${params.toString()}`;
}

export function exportPdfUrl(conn, { range = "24h", start, end } = {}) {
  if (conn.mode === "local") return null; // unsupported locally
  const params = new URLSearchParams({ range });
  if (range === "custom") { params.set("start", start); params.set("end", end); }
  return `${conn.backendUrl}/api/export/pdf?${params.toString()}`;
}

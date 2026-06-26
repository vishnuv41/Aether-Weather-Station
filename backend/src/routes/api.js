// src/routes/api.js
const express = require("express");
const router = express.Router();

const { getHistory, getLatestFromDB, DEVICE_ID } = require("../dynamo");
const { state: iotState, publishControl } = require("../awsIot");
const { summarize } = require("../utils/stats");
const { toCSV } = require("../utils/csv");
const { buildReportPDF } = require("../utils/pdf");

const OFFLINE_MS = Number(process.env.DEVICE_OFFLINE_THRESHOLD_MS || 90000);

/** Turn ?range=1h|24h|7d|custom&start=&end= into epoch-second bounds. */
function resolveRange(query) {
  const now = Math.floor(Date.now() / 1000);
  const range = query.range || "24h";

  if (range === "custom" && query.start && query.end) {
    return {
      start: Math.floor(new Date(query.start).getTime() / 1000),
      end: Math.floor(new Date(query.end).getTime() / 1000),
      label: `${query.start} → ${query.end}`,
    };
  }
  const map = { "1h": 3600, "24h": 86400, "7d": 604800 };
  const seconds = map[range] || map["24h"];
  return { start: now - seconds, end: now, label: range };
}

function isOnline() {
  if (!iotState.lastReceivedAt) return false;
  return Date.now() - iotState.lastReceivedAt.getTime() < OFFLINE_MS;
}

// ---------------------------------------------------------------------------
// GET /api/live — current reading + device status, served from memory (fast)
// ---------------------------------------------------------------------------
router.get("/live", async (req, res) => {
  let latest = iotState.latest;

  // Fall back to DynamoDB if we haven't received an MQTT message since boot
  if (!latest) {
    try {
      latest = await getLatestFromDB();
    } catch (e) {
      // ignore — we'll just return null below
    }
  }

  res.json({
    reading: latest,
    status: {
      online: isOnline(),
      lastReceivedAt: iotState.lastReceivedAt,
      packetsReceived: iotState.packetsReceived,
      currentIntervalMs: iotState.currentIntervalMs,
      lastCommandStatus: iotState.lastCommandStatus,
      awsIotConnected: iotState.connected,
    },
  });
});

// ---------------------------------------------------------------------------
// GET /api/status — device/control status only (used by the Control card)
// ---------------------------------------------------------------------------
router.get("/status", (req, res) => {
  res.json({
    online: isOnline(),
    lastReceivedAt: iotState.lastReceivedAt,
    packetsReceived: iotState.packetsReceived,
    currentIntervalMs: iotState.currentIntervalMs,
    lastCommandStatus: iotState.lastCommandStatus,
    awsIotConnected: iotState.connected,
  });
});

// ---------------------------------------------------------------------------
// GET /api/history — readings + computed stats for a time range
// ---------------------------------------------------------------------------
router.get("/history", async (req, res) => {
  try {
    const { start, end, label } = resolveRange(req.query);
    const readings = await getHistory({ start, end });
    res.json({
      range: label,
      start,
      end,
      readings,
      stats: summarize(readings),
    });
  } catch (e) {
    console.error("[api] /history error:", e);
    res.status(500).json({ error: "Could not load history. Check DynamoDB credentials/table." });
  }
});

// ---------------------------------------------------------------------------
// GET /api/export/csv — download readings for a range as CSV
// ---------------------------------------------------------------------------
router.get("/export/csv", async (req, res) => {
  try {
    const { start, end } = resolveRange(req.query);
    const readings = await getHistory({ start, end });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="weather-data-${start}-${end}.csv"`);
    res.send(toCSV(readings));
  } catch (e) {
    console.error("[api] /export/csv error:", e);
    res.status(500).json({ error: "Could not export CSV." });
  }
});

// ---------------------------------------------------------------------------
// GET /api/export/pdf — generate a PDF report for a range
// ---------------------------------------------------------------------------
router.get("/export/pdf", async (req, res) => {
  try {
    const { start, end, label } = resolveRange(req.query);
    const readings = await getHistory({ start, end });
    const stats = summarize(readings);
    buildReportPDF({ res, readings, stats, rangeLabel: label, deviceId: DEVICE_ID });
  } catch (e) {
    console.error("[api] /export/pdf error:", e);
    res.status(500).json({ error: "Could not generate PDF report." });
  }
});

// ---------------------------------------------------------------------------
// POST /api/control/interval — { interval: ms } -> published to AWS IoT control topic
// ---------------------------------------------------------------------------
router.post("/control/interval", async (req, res) => {
  const interval = Number(req.body?.interval);
  if (!interval || interval < 1000) {
    return res.status(400).json({ error: "interval must be a number of ms >= 1000" });
  }
  const ok = await publishControl(interval);
  res.json({
    ok,
    interval,
    status: iotState.lastCommandStatus,
  });
});

module.exports = router;

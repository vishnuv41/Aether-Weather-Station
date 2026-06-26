// src/awsIot.js
// Bridges AWS IoT Core (MQTT/TLS) <-> this backend.
// - Subscribes to AWS_IOT_DATA_TOPIC, persists each reading to DynamoDB, updates the
//   in-memory "live" cache that /api/live serves instantly (no DB round trip needed).
// - Exposes publishControl() so /api/control/interval can push a new interval to the ESP32.
require("dotenv").config();
const path = require("path");
const awsIot = require("aws-iot-device-sdk");
const { saveReading } = require("./dynamo");

const DATA_TOPIC = process.env.AWS_IOT_DATA_TOPIC || "weatherStation/data";
const CONTROL_TOPIC = process.env.AWS_IOT_CONTROL_TOPIC || "weatherStation/control";

// Shared in-memory state, read by routes/api.js
const state = {
  latest: null,            // last reading object received
  connected: false,        // AWS IoT connection state
  lastReceivedAt: null,    // JS Date of last message
  packetsReceived: 0,
  currentIntervalMs: 30000, // last interval we told the device to use
  lastCommandStatus: null,  // "Command Sent ✅" / "Send failed" / null
};

let deviceClient = null;

function start() {
  const certDir = path.resolve(__dirname, "..");
  const caPath = path.resolve(certDir, process.env.AWS_IOT_CA_PATH || "./certs/AmazonRootCA1.pem");
  const certPath = path.resolve(certDir, process.env.AWS_IOT_CERT_PATH || "./certs/device-cert.pem.crt");
  const keyPath = path.resolve(certDir, process.env.AWS_IOT_KEY_PATH || "./certs/private.pem.key");

  try {
    deviceClient = awsIot.device({
      keyPath,
      certPath,
      caPath,
      clientId: "backend_" + Math.random().toString(16).slice(2, 10),
      host: process.env.AWS_IOT_ENDPOINT,
    });
  } catch (e) {
    console.error("[awsIot] Could not initialise IoT device client:", e.message);
    console.error("[awsIot] Cloud live/control features will be unavailable until certs are in place.");
    return;
  }

  deviceClient.on("connect", () => {
    state.connected = true;
    console.log("[awsIot] connected to AWS IoT Core");
    deviceClient.subscribe(DATA_TOPIC);
  });

  deviceClient.on("close", () => {
    state.connected = false;
    console.log("[awsIot] connection closed");
  });

  deviceClient.on("error", (err) => {
    console.error("[awsIot] error:", err.message);
  });

  deviceClient.on("message", async (topic, payload) => {
    if (topic !== DATA_TOPIC) return;
    let reading;
    try {
      reading = JSON.parse(payload.toString());
    } catch (e) {
      console.error("[awsIot] bad JSON payload:", e.message);
      return;
    }

    state.latest = reading;
    state.lastReceivedAt = new Date();
    state.packetsReceived += 1;

    try {
      await saveReading(reading);
    } catch (e) {
      console.error("[awsIot] failed to persist reading to DynamoDB:", e.message);
    }
  });
}

/** Publish a new upload interval (ms) to the ESP32 over the control topic. */
function publishControl(intervalMs) {
  return new Promise((resolve) => {
    if (!deviceClient || !state.connected) {
      state.lastCommandStatus = "Send failed — AWS IoT not connected";
      resolve(false);
      return;
    }
    const payload = JSON.stringify({ interval: intervalMs });
    deviceClient.publish(CONTROL_TOPIC, payload, {}, (err) => {
      if (err) {
        state.lastCommandStatus = "Send failed";
        resolve(false);
      } else {
        state.currentIntervalMs = intervalMs;
        state.lastCommandStatus = "Command Sent ✅";
        resolve(true);
      }
    });
  });
}

module.exports = { start, publishControl, state };

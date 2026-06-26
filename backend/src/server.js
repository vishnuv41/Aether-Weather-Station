// src/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const apiRoutes = require("./routes/api");
const awsIot = require("./awsIot");

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

app.use(cors({ origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN.split(",") }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ service: "weather-station-backend", status: "ok" });
});

app.use("/api", apiRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Start the AWS IoT MQTT bridge (subscribes to sensor data, enables control publishing)
awsIot.start();

app.listen(PORT, () => {
  console.log(`Weather backend listening on http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/api/live`);
});

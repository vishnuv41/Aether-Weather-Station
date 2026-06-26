# Aether — ESP32 Weather Station Dashboard

A full-stack weather station: ESP32 firmware, an Express/AWS IoT/DynamoDB
backend, and a premium animated React dashboard that works in two modes —
**Cloud** (ESP32 → AWS IoT → DynamoDB → React) and **Local** (Browser → ESP32
IP directly, live values only).

```
weather-station/
├── esp32/        WeatherStation.ino — firmware (non-blocking, controllable interval)
├── backend/      Node/Express API: AWS IoT bridge + DynamoDB + CSV/PDF export
└── frontend/     React + Vite dashboard (Cloud/Local switch, live + history)
```

## ⚠️ Rotate your credentials first

Earlier in this conversation you pasted, in plain text:
- Your real WiFi password
- An AWS IoT device certificate **and its private key**
- An AWS IAM access key + secret

All three must be treated as compromised — anyone with access to this chat
log now has them too. Before deploying any of this code:

1. **AWS IoT Core** console → Security → Certificates → deactivate & delete
   the old certificate → create a new one → attach your policy → download
   the new CA/cert/key into `backend/certs/` and paste the new cert/key into
   `esp32/WeatherStation.ino`.
2. **AWS IAM** console → deactivate & delete the old access key → create a
   new one → put it in `backend/.env` (ideally scoped to only
   `dynamodb:PutItem`/`dynamodb:Query` on the `WeatherData` table — see
   `backend/README.md` for the exact policy).
3. Change your WiFi password and update it in the firmware.

None of the generated code below contains your real secrets — everything
uses placeholders you fill in after rotating.

## How it fits together

```
Sensors → ESP32 ──┬─→ AWS IoT Core (MQTT/TLS, 8883) → Rule → DynamoDB → backend → React (Cloud mode)
                   └─→ ESP32 Web Server (port 80, /data JSON) → React (Local mode, live only)
```

- **Cloud mode** gets you history, CSV/PDF export, and the Device Control
  card (changes the ESP32's upload interval over MQTT).
- **Local mode** needs no AWS account at all — just the ESP32's IP — but
  only shows the current live reading, since the device itself stores no
  history.

## Quick start

1. **Firmware**: open `esp32/WeatherStation.ino` in Arduino IDE, fill in
   WiFi + rotated AWS IoT details, flash it. Note the IP it prints on boot.
2. **Backend**: `cd backend && cp .env.example .env` (fill in AWS keys, IoT
   endpoint, cert paths) → `npm install && npm start`.
3. **Frontend**: `cd frontend && cp .env.example .env` → `npm install && npm run dev`
   → open the printed URL.
4. In the dashboard's **Settings** page, either:
   - leave it on **Cloud** (uses the backend you just started), or
   - switch to **Local** and type in the ESP32's IP, then **Connect**.

See `backend/README.md` and `frontend/README.md` for full details
(DynamoDB table schema, IAM policy, API reference, etc).

## What's inside the dashboard

- **Live Data** — hero temperature reading with a color that drifts warmer/
  cooler with the live value, 8 sensor cards, 4 smoothly-updating live
  trend charts (Temp/Humidity/Pressure/Air Quality), a Sensor Health panel,
  Device Control (upload interval), and Export shortcuts.
- **History** — date-range picker (1h / 24h / 7d / custom), 4 full history
  graphs, calculated insight cards (dew point, heat index, pressure trend,
  air quality, rain events), a stored-readings table, and CSV/PDF export.
- **Settings** — switch Cloud ⇄ Local, enter the ESP32 IP and connect, or
  point at a different backend URL.

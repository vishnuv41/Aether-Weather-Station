# Weather Station Frontend

React + Vite dashboard. Premium dark theme ("Aether"), live polling charts,
history with date ranges, CSV/PDF export, device control, and a Settings page
to switch between **Cloud** (backend → DynamoDB) and **Local** (direct ESP32 IP).

## Setup

```bash
cp .env.example .env   # set VITE_BACKEND_URL if your backend isn't on localhost:5000
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`).

## How connection modes work

- **Cloud** (default): every page calls the backend's `/api/*` routes
  (`backend/`), which reads/writes DynamoDB and bridges AWS IoT.
- **Local**: set in Settings by entering the ESP32's IP (printed on its serial
  monitor at boot) and clicking **Connect**. The dashboard then talks straight
  to `http://<esp32-ip>/data` and `/setInterval` — no backend or AWS needed,
  but only *live* values are available (the ESP32 itself doesn't store
  history), so History/Export are disabled in this mode.

The chosen mode, backend URL, and ESP32 IP are remembered in the browser
(`localStorage`) between visits.

## Build for production

```bash
npm run build
```
Output goes to `dist/` — serve it with any static host (the backend's CORS
origin should then point at that host instead of localhost).

// src/utils/csv.js — tiny CSV serializer (no extra dependency needed)
function toCSV(rows) {
  if (!rows || rows.length === 0) {
    return "timestamp,date_time,temperature,humidity,pressure,light,uv,air_quality,rain,wind_speed\n";
  }
  const cols = ["timestamp", "temperature", "humidity", "pressure", "light", "uv", "air_quality", "rain", "wind_speed"];
  const header = ["timestamp", "date_time", ...cols.slice(1)].join(",");
  const lines = rows.map((r) => {
    const iso = new Date(r.timestamp * 1000).toISOString();
    return [r.timestamp, iso, ...cols.slice(1).map((c) => (r[c] ?? ""))].join(",");
  });
  return header + "\n" + lines.join("\n") + "\n";
}

module.exports = { toCSV };

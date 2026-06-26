// src/utils/pdf.js — builds a "Weather Report" PDF from a set of readings + computed stats.
const PDFDocument = require("pdfkit");

function buildReportPDF({ res, readings, stats, rangeLabel, deviceId }) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="weather-report-${Date.now()}.pdf"`);
  doc.pipe(res);

  // ---- Header ----
  doc.fontSize(22).fillColor("#0f172a").text("Weather Station Report", { align: "left" });
  doc.moveDown(0.2);
  doc.fontSize(11).fillColor("#475569").text(`Device: ${deviceId}    Range: ${rangeLabel}    Generated: ${new Date().toLocaleString()}`);
  doc.moveDown(1);
  doc.strokeColor("#cbd5e1").moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);

  // ---- Summary cards ----
  doc.fontSize(14).fillColor("#0f172a").text("Summary");
  doc.moveDown(0.5);

  const summaryRows = [
    ["Readings in range", stats.count],
    ["Temperature avg / min / max (°C)", `${stats.tempAvg ?? "-"} / ${stats.tempMin ?? "-"} / ${stats.tempMax ?? "-"}`],
    ["Humidity avg (%)", stats.humidityAvg ?? "-"],
    ["Pressure avg (hPa)", stats.pressureAvg ?? "-"],
    ["Pressure trend", stats.pressureTrend],
    ["Air quality avg / status", `${stats.airAvg ?? "-"} / ${stats.airLabel}`],
    ["Rain events", stats.rainEvents],
    ["Dew point (°C)", stats.dewPoint ?? "-"],
    ["Heat index (°C)", stats.heatIndex ?? "-"],
  ];

  doc.fontSize(10).fillColor("#1e293b");
  summaryRows.forEach(([label, value]) => {
    doc.text(`${label}:`, 50, doc.y, { continued: true, width: 260 });
    doc.text(`  ${value}`, { align: "left" });
  });

  doc.moveDown(1);
  doc.strokeColor("#cbd5e1").moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);

  // ---- Table of readings (most recent 200 to keep the PDF a sane size) ----
  doc.fontSize(14).fillColor("#0f172a").text("Readings");
  doc.moveDown(0.5);

  const rows = readings.slice(-200);
  const colX = [50, 140, 215, 285, 350, 400, 455, 500];
  const headers = ["Time", "Temp°C", "Hum%", "Press hPa", "Light", "UV", "Air", "Rain"];

  doc.fontSize(9).fillColor("#475569");
  headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: 80, continued: i < headers.length - 1 }));
  doc.moveDown(0.3);
  doc.strokeColor("#e2e8f0").moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.2);

  doc.fontSize(8).fillColor("#1e293b");
  rows.forEach((r) => {
    if (doc.y > 760) { doc.addPage(); doc.fontSize(8); }
    const time = new Date(r.timestamp * 1000).toLocaleString();
    const vals = [
      time,
      r.temperature?.toFixed?.(1) ?? r.temperature,
      r.humidity?.toFixed?.(0) ?? r.humidity,
      r.pressure?.toFixed?.(0) ?? r.pressure,
      r.light,
      r.uv,
      r.air_quality,
      r.rain ? "Yes" : "No",
    ];
    const y = doc.y;
    vals.forEach((v, i) => doc.text(String(v ?? "-"), colX[i], y, { width: 80 }));
    doc.moveDown(0.9);
  });

  doc.end();
}

module.exports = { buildReportPDF };

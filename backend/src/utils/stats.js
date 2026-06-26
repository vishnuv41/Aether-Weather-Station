// src/utils/stats.js — derived/calculated metrics used by the dashboard's "key insights" cards
function round(n, d = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return null;
  const p = 10 ** d;
  return Math.round(n * p) / p;
}

/** Dew point (Magnus formula), °C. */
function dewPoint(tempC, rh) {
  if (tempC == null || rh == null) return null;
  const a = 17.27, b = 237.7;
  const alpha = (a * tempC) / (b + tempC) + Math.log(rh / 100);
  return round((b * alpha) / (a - alpha));
}

/** Simple heat index approximation, °C (valid mainly above ~27°C). */
function heatIndex(tempC, rh) {
  if (tempC == null || rh == null) return null;
  const T = tempC * 1.8 + 32; // to F
  if (T < 80) return round(tempC); // not meaningfully different below 80F
  const R = rh;
  const HI =
    -42.379 + 2.04901523 * T + 10.14333127 * R - 0.22475541 * T * R -
    0.00683783 * T * T - 0.05481717 * R * R + 0.00122874 * T * T * R +
    0.00085282 * T * R * R - 0.00000199 * T * T * R * R;
  return round((HI - 32) / 1.8);
}

function airQualityLabel(value) {
  if (value == null) return "UNKNOWN";
  if (value < 800) return "GOOD";
  if (value < 1500) return "MODERATE";
  return "POOR";
}

/** Aggregate stats over an array of readings (output of dynamo.getHistory). */
function summarize(readings) {
  if (!readings || readings.length === 0) {
    return {
      count: 0, tempMin: null, tempMax: null, tempAvg: null,
      humidityAvg: null, pressureAvg: null, pressureTrend: "FLAT",
      airAvg: null, airLabel: "UNKNOWN", rainEvents: 0,
      dewPoint: null, heatIndex: null,
    };
  }
  const n = readings.length;
  const temps = readings.map((r) => r.temperature).filter((v) => typeof v === "number" && !Number.isNaN(v));
  const hums = readings.map((r) => r.humidity).filter((v) => typeof v === "number" && !Number.isNaN(v));
  const press = readings.map((r) => r.pressure).filter((v) => typeof v === "number" && !Number.isNaN(v));
  const air = readings.map((r) => r.air_quality).filter((v) => typeof v === "number" && !Number.isNaN(v));
  const rainEvents = readings.filter((r) => r.rain).length;

  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  const tempAvg = avg(temps);
  const humidityAvg = avg(hums);
  const pressureAvg = avg(press);
  const airAvg = avg(air);

  // pressure trend: compare avg of first third vs last third of the window
  let pressureTrend = "FLAT";
  if (press.length >= 6) {
    const third = Math.floor(press.length / 3);
    const startAvg = avg(press.slice(0, third));
    const endAvg = avg(press.slice(-third));
    const delta = endAvg - startAvg;
    if (delta > 1) pressureTrend = "RISING";
    else if (delta < -1) pressureTrend = "FALLING";
  }

  return {
    count: n,
    tempMin: temps.length ? round(Math.min(...temps)) : null,
    tempMax: temps.length ? round(Math.max(...temps)) : null,
    tempAvg: round(tempAvg),
    humidityAvg: round(humidityAvg),
    pressureAvg: round(pressureAvg),
    pressureTrend,
    airAvg: round(airAvg, 0),
    airLabel: airQualityLabel(airAvg),
    rainEvents,
    dewPoint: dewPoint(tempAvg, humidityAvg),
    heatIndex: heatIndex(tempAvg, humidityAvg),
  };
}

module.exports = { summarize, dewPoint, heatIndex, airQualityLabel, round };

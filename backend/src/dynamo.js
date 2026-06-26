// src/dynamo.js
// Thin wrapper around DynamoDB for the WeatherData table.
// Schema assumed: partition key `device_id` (String), sort key `timestamp` (Number, epoch seconds)
require("dotenv").config();
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const doc = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || "WeatherData";
const DEVICE_ID = process.env.DEVICE_ID || "ESP32_Weather";

/** Save one sensor reading. `reading.timestamp` must be epoch seconds (Number). */
async function saveReading(reading) {
  const item = {
    device_id: reading.device_id || DEVICE_ID,
    timestamp: Number(reading.timestamp) || Math.floor(Date.now() / 1000),
    temperature: reading.temperature,
    humidity: reading.humidity,
    pressure: reading.pressure,
    light: reading.light,
    uv: reading.uv,
    air_quality: reading.air_quality,
    rain: reading.rain ? 1 : 0,
    wind_speed: reading.wind_speed || 0,
  };
  await doc.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

/**
 * Query readings for a device between two epoch-second timestamps (inclusive).
 * Paginates internally so large ranges (e.g. 7 days at a fast interval) all come back.
 */
async function getHistory({ deviceId = DEVICE_ID, start, end, limit = 5000 }) {
  const items = [];
  let lastKey;

  do {
    const res = await doc.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression:
          "device_id = :id AND #ts BETWEEN :start AND :end",
        ExpressionAttributeNames: { "#ts": "timestamp" },
        ExpressionAttributeValues: {
          ":id": deviceId,
          ":start": start,
          ":end": end,
        },
        ExclusiveStartKey: lastKey,
        Limit: 1000,
        ScanIndexForward: true,
      })
    );
    items.push(...(res.Items || []));
    lastKey = res.LastEvaluatedKey;
  } while (lastKey && items.length < limit);

  return items.slice(0, limit);
}

/** Latest single reading for a device (last 24h scan, most recent first). */
async function getLatestFromDB(deviceId = DEVICE_ID) {
  const now = Math.floor(Date.now() / 1000);
  const res = await doc.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "device_id = :id AND #ts BETWEEN :start AND :end",
      ExpressionAttributeNames: { "#ts": "timestamp" },
      ExpressionAttributeValues: {
        ":id": deviceId,
        ":start": now - 86400,
        ":end": now + 60,
      },
      ScanIndexForward: false,
      Limit: 1,
    })
  );
  return (res.Items && res.Items[0]) || null;
}

module.exports = { saveReading, getHistory, getLatestFromDB, TABLE_NAME, DEVICE_ID };

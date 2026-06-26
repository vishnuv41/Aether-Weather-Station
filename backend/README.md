# Weather Station Backend

Express API that:
- Subscribes to AWS IoT Core (`weatherStation/data`) and writes every reading into DynamoDB
- Serves `/api/live`, `/api/history`, `/api/export/csv`, `/api/export/pdf`, `/api/status`
- Publishes upload-interval changes to `weatherStation/control` for the **Device Control** card

## ⚠️ Before anything else

The certs, IAM keys and WiFi password originally shared in chat are **compromised**
(they were posted in a conversation). Rotate all of them in AWS before using this
project for real:

1. **AWS IoT Core** → Security → Certificates → deactivate/delete the old one →
   create a new certificate + download `AmazonRootCA1.pem`, `xxx-certificate.pem.crt`,
   `xxx-private.pem.key`. Attach the same IoT policy to the new certificate.
2. **AWS IAM** → Users → your user → Security credentials → deactivate/delete the
   old access key → create a new one.
3. Change your WiFi password and update the ESP32 firmware.

Recommended IAM policy for the backend's key — scope it down instead of using a
broad/admin key:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:PutItem", "dynamodb:Query"],
      "Resource": "arn:aws:dynamodb:us-east-1:<account-id>:table/WeatherData"
    }
  ]
}
```
(AWS IoT publish/subscribe uses the certificate's IoT policy, not this IAM key —
the IAM key here is only for DynamoDB.)

## 1. DynamoDB table

Create a table named `WeatherData` (or whatever you set `TABLE_NAME` to):
- Partition key: `device_id` (String)
- Sort key: `timestamp` (Number)

Via AWS CLI:
```bash
aws dynamodb create-table \
  --table-name WeatherData \
  --attribute-definitions AttributeName=device_id,AttributeType=S AttributeName=timestamp,AttributeType=N \
  --key-schema AttributeName=device_id,KeyType=HASH AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
```

## 2. Certificates

Put your **rotated** AWS IoT cert files into `certs/`:
```
certs/AmazonRootCA1.pem
certs/device-cert.pem.crt
certs/private.pem.key
```

## 3. Configure environment

```bash
cp .env.example .env
# edit .env: AWS keys, IoT endpoint, table name, cert paths, CORS_ORIGIN
```

## 4. Install & run

```bash
npm install
npm start
```

Server starts on `http://localhost:5000`. Check it's alive:
```bash
curl http://localhost:5000/api/status
```

## API reference

| Method | Path                     | Purpose                                              |
|--------|---------------------------|-------------------------------------------------------|
| GET    | `/api/live`               | Latest reading + device status                       |
| GET    | `/api/status`              | Device online/offline, interval, packet count         |
| GET    | `/api/history?range=1h\|24h\|7d\|custom&start=&end=` | Readings + computed stats for a window |
| GET    | `/api/export/csv?range=...`   | Download CSV for a range                          |
| GET    | `/api/export/pdf?range=...`   | Download a generated PDF report for a range        |
| POST   | `/api/control/interval` `{ "interval": 10000 }` | Push new upload interval to the ESP32 |

## Notes

- If AWS IoT certs aren't in place yet, the server still starts — `/api/live` and
  `/api/history` will work against whatever's already in DynamoDB, but live MQTT
  data and the Control card won't until certs are configured.
- `DEVICE_OFFLINE_THRESHOLD_MS` controls how long without a reading before the
  dashboard shows the device as OFFLINE.

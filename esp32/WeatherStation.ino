/*
  /*
  ESP32 Weather Station — Firmware
  ---------------------------------
  - Publishes sensor data to AWS IoT Core (MQTT/TLS) every `uploadInterval` ms
  - Subscribes to a control topic so the dashboard can change upload interval live
  - Runs a local web server with a JSON API (for the React dashboard's "Local" mode)
    AND the original HTML dashboard (for quick browser checks)
  - LCD page rotation is now non-blocking (no delay() calls), so MQTT/web server
    keep running smoothly instead of freezing for 9s every loop like before

  ⚠️ SECURITY — READ THIS FIRST
  ------------------------------
  You pasted your real WiFi password, AWS IoT certificate, AWS IoT private key,
  and an AWS IAM access key/secret in chat. Treat all of those as already
  compromised:
    1. In AWS IoT Core console: deactivate/delete that certificate, generate a
       new one, attach your policy to the new cert, and re-download CA/cert/key.
    2. In AWS IAM console: deactivate/delete that access key, create a new one
       (and ideally don't put long-lived IAM keys in a backend at all — see
       backend/README.md for a scoped-down alternative).
    3. Change your WiFi password.
  Then paste ONLY the new values below / into backend/.env. Never commit real
  certs/keys to git — backend/.gitignore already excludes backend/certs/*.pem
  and backend/.env for you.

*/

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <WebServer.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Adafruit_BMP280.h>
#include <BH1750.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ====================== WIFI ======================
const char* ssid     = "OnePlus Nord CE5";
const char* password = "vishnuvvv";

// ====================== AWS ======================
const char* endpoint = "a1aeo707ow9mdv-ats.iot.us-east-1.amazonaws.com";
const char* dataTopic    = "weatherStation/data";
const char* controlTopic = "weatherStation/control";
const char* deviceId     = "ESP32_Weather";

// PASTE *NEW* CERTIFICATES HERE (after rotating the ones you pasted in chat)
const char AWS_CERT_CA[] PROGMEM = R"EOF(-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6
b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL
MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv
b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj
ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM
9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw
IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6
VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L
93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm
jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC
AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA
A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI
U5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs
N+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv
o/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU
5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy
rqXRfboQnoZsG4q5WTP468SQvvG5
-----END CERTIFICATE-----
)EOF";

const char AWS_CERT_CRT[] PROGMEM = R"KEY(-----BEGIN CERTIFICATE-----
MIIDWTCCAkGgAwIBAgIUQUjyILjznfbIQ2+14uY9TkgJ/vIwDQYJKoZIhvcNAQEL
BQAwTTFLMEkGA1UECwxCQW1hem9uIFdlYiBTZXJ2aWNlcyBPPUFtYXpvbi5jb20g
SW5jLiBMPVNlYXR0bGUgU1Q9V2FzaGluZ3RvbiBDPVVTMB4XDTI2MDYyNDE0MjIy
NloXDTQ5MTIzMTIzNTk1OVowHjEcMBoGA1UEAwwTQVdTIElvVCBDZXJ0aWZpY2F0
ZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALIWZNGJsIJvgCWpExRZ
WYyAlKR9qIkPVWbW/eDiojoLQOTJBqhpjzV8QNO6cAaZ3mUQrhbnLQPk3hMIhP6q
R7rPgmb4bQOoP78V4C3BTQ07SVcnJ9WisNGnehMbOs6IlyQA7w3KbBwz5nXKObi9
4XEKhXsIwIcP56+VAGUjljXaRW83jGb81yPHNeDv6LipBDuj4xT7kFKoMP/b9R1K
jQGHuSTEHIV/1SX3OV5M489z0nx7J40m6JVU3YSMu1NoXRTERbKGbEskfTWWcovU
0JqmEZTtMNU/AUTNrCkUtn1WzkwPdMQaA4jnahFzy5M+L6G1IFFYEEU7pbzXjjWc
qzMCAwEAAaNgMF4wHwYDVR0jBBgwFoAUnHq3zXIfZPpQwAzqYc+S2idd2SMwHQYD
VR0OBBYEFLbX9vjRvs5ZQOTbu8xsidK26XW+MAwGA1UdEwEB/wQCMAAwDgYDVR0P
AQH/BAQDAgeAMA0GCSqGSIb3DQEBCwUAA4IBAQB6yf1dwSd3zj0/QWZOQtboEfq+
OJzqYtvStfsP1ds0IS76iZABEubNodeoQEZbscwQcFVa3+ZU0kditpI09IYVot0G
UxKB+tfoBV4Oi2FuhQE4BMX1ll2wjwt48Er0/40eQQpQm7uhTS7D34o+Ym3IVZY3
pvqrDsyOL7IpoIDF0tfJhdZWv09Jnc2CXnjLfNHW8e28VxlqdeeT2XymaD+Oyt1G
lq9Uu1m2zC4/nYulnyBTp+rl49WoVZVgCF0NB7zrD+6+DzDdEn4B9pZHWXAnatBR
u1YOY8KvwVnG0QTFYKm4Wm9/I63zJsHXWenOfJdQfT5KzaUQIJ+TVbH2qs8o
-----END CERTIFICATE-----
)KEY";

const char AWS_CERT_PRIVATE[] PROGMEM = R"KEY(-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAshZk0Ymwgm+AJakTFFlZjICUpH2oiQ9VZtb94OKiOgtA5MkG
qGmPNXxA07pwBpneZRCuFuctA+TeEwiE/qpHus+CZvhtA6g/vxXgLcFNDTtJVycn
1aKw0ad6Exs6zoiXJADvDcpsHDPmdco5uL3hcQqFewjAhw/nr5UAZSOWNdpFbzeM
ZvzXI8c14O/ouKkEO6PjFPuQUqgw/9v1HUqNAYe5JMQchX/VJfc5Xkzjz3PSfHsn
jSbolVTdhIy7U2hdFMRFsoZsSyR9NZZyi9TQmqYRlO0w1T8BRM2sKRS2fVbOTA90
xBoDiOdqEXPLkz4vobUgUVgQRTulvNeONZyrMwIDAQABAoIBAEoa5XMID6oHSdTi
CS1zjL7ZloDoRSRbfBciKVzWEdmDa0qImDumSVBhVvyD3S/yAUge68JeCi5Po1Va
OzVZmCWVSdcdUwetkHEsYi/H+w8hd4BLq9jLLTbgsPyYXR0qW3JA7TjY3anSsvia
4PAOG2yVizvKRYsuRCOdJh/v8gaQDavQdgc1DBdQUXJYRxnsg90ZtBbaeCaZuuHL
qaxaINoESCcqKRAHFEQmYtI/9AnCEf1d2fq9JXacMLUdT07f0zUjWFZ8kAlBkk51
0iESBO5uGJKGOlmH3C5jyjKekLfhutbhaLQfE5OGh1mmD5VEH/Nv+nt9V5qVooRc
AeobHNkCgYEA7GG6ROe/sIwf0sR0eNfezQcs3fA28+p2Jiu5Y7x/51ioZqJmMyVT
ndmb/E13772AZ4aBmnUVCbGi/tyvFJbTAwEWgmiGsFO3aJATasFSvYUmKJvcjDsP
CbZP3J7kL1G4yIiM8A2uTmt8Nsb4rOHoaKbW8I1q1qcvbeZYbOrTIf8CgYEAwN4e
uQ7Ok02Jn1VtiikYHPY2cX7cmGqxkE+BtneOvFaB3HNrXIcGd5IY/i8UaJjOpnjT
SRGBxjjUxMNGxnknSROu1oGg+W02NPKi6dZaeqPZCsVHAXtsYHKQissFLKnhkQSb
sIb/lBW6xv9x19WoOToetLtDjKhj51BioLRRjs0CgYA2zWl79Cay7amrGbTPF20m
J5W1Vq3G2wLNUrHGd7tHjXxtXxVGok7Cd+L8GZHG2S5d0gdWIfLgrnhVkiBdK6J8
PdJUJZukYaRR76UwyOU/3xC7tXbqY/7Wh5f4VDYe6llm1JGoTeOtdqnzoSmiGzXg
nV2To5WzcktCtXamucJ9TQKBgQCqIMUVFLygL1tgk2jG4K0GjyFDSFaqlCMBW0De
heQAuoZewelIe0r3Goa1YS4tfe1750TpRWomQmddEaxS0vgWfChTy5EFtJKGbinK
/2xclj+UQqT557eX9DcQVzm/RjNVSq1TMCIurGRPuXDgpPV5VY1Ue4OAheFqX/xA
Kg9vWQKBgQCAhdziOTzeJqAYmDmQVyw4RFPvL82mv3c4Gb51ZCSw7Hl2U8gFWjLf
sXR1T4WSLbHQWPG5AoJ9WBMhJCDcxkOUi0dX3GUUSvoFKmIHSMG7fQL9DyhI+Ful
EAFS/5hnHoAxeX383RVqm3T5XiHyZSnXpBad/Hdu0O2jciGsGq99+w==
-----END RSA PRIVATE KEY-----
)KEY";

WiFiClientSecure net;
PubSubClient client(net);
WebServer server(80);
LiquidCrystal_I2C lcd(0x27, 16, 2);
Adafruit_BMP280 bmp;
BH1750 lightMeter;

#define DHTPIN 4
#define DHTTYPE DHT11
#define MQ135_PIN 32
#define RAIN_PIN  34
#define UV_PIN    35
#define WIND_PIN  33   // anemometer (analog) — wire when available, else stays 0

DHT dht(DHTPIN, DHTTYPE);

// ---------------- live sensor values (shared with web server) ----------------
float temp, humidity, pressure, light;
int   uv, air, rain, windSpeed;
bool  sensorOk_bmp = false, sensorOk_bh1750 = false;

// ---------------- timing / control state ----------------
unsigned long uploadInterval = 30000;   // ms — changeable live via MQTT or local API
unsigned long lastUpload = 0;
unsigned long packetsSent = 0;
unsigned long lastUploadTimestamp = 0;  // epoch seconds of last successful publish

unsigned long lcdPageStart = 0;
int lcdPage = 0;
const unsigned long LCD_PAGE_MS = 3000;

String airStatus(int value) {
  if (value < 800) return "GOOD";
  if (value < 1500) return "MOD";
  return "BAD";
}

// ====================== CORS helper for local API ======================
void sendCORS() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ====================== /data — JSON for the React dashboard (Local mode) ======================
void handleData()
{
  sendCORS();

  StaticJsonDocument<768> doc;

  JsonObject reading = doc.createNestedObject("reading");

  reading["device_id"] = deviceId;
  reading["timestamp"] = time(nullptr);

  reading["temperature"] = temp;
  reading["humidity"] = humidity;
  reading["pressure"] = pressure;
  reading["light"] = light;
  reading["uv"] = uv;
  reading["air_quality"] = air;
  reading["rain"] = rain;
  reading["wind_speed"] = windSpeed;


  JsonObject status = doc.createNestedObject("status");

  status["online"] = true;
  status["currentIntervalMs"] = uploadInterval;
  status["packetsSent"] = packetsSent;
  status["awsIotConnected"] = client.connected();


  String json;

  serializeJson(doc,json);

  server.send(200,"application/json",json);
}

// ====================== /setInterval — local control (no AWS needed) ======================
void handleSetInterval() {
  sendCORS();
  if (server.method() == HTTP_OPTIONS) { server.send(204); return; }

  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"missing body\"}");
    return;
  }
  StaticJsonDocument<128> doc;
  DeserializationError err = deserializeJson(doc, server.arg("plain"));
  if (err || !doc["interval"]) {
    server.send(400, "application/json", "{\"error\":\"expected {interval: ms}\"}");
    return;
  }
  uploadInterval = doc["interval"];
  Serial.print("NEW INTERVAL (local) : ");
  Serial.println(uploadInterval);
  server.send(200, "application/json", "{\"ok\":true,\"interval\":" + String(uploadInterval) + "}");
}

// ====================== original HTML dashboard (kept for quick browser checks) ======================
void handleDashboard() {
  sendCORS();
  String html =
    "<html><head><meta http-equiv='refresh' content='5'>"
    "<style>body{background:#0f172a;color:white;font-family:Arial;text-align:center;}"
    ".card{background:#1e293b;margin:15px;padding:20px;border-radius:15px;font-size:22px;}</style>"
    "</head><body><h1>ESP32 Weather Station</h1>"
    "<div class='card'>Temperature : " + String(temp) + " C</div>"
    "<div class='card'>Humidity : " + String(humidity) + " %</div>"
    "<div class='card'>Pressure : " + String(pressure) + " hPa</div>"
    "<div class='card'>Light : " + String(light) + " Lux</div>"
    "<div class='card'>UV : " + String(uv) + "</div>"
    "<div class='card'>Air Quality : " + airStatus(air) + "</div>"
    "<div class='card'>Rain : " + String(rain ? "YES" : "NO") + "</div>"
    "<div class='card'>AWS : " + String(client.connected() ? "ONLINE" : "OFFLINE") + "</div>"
    "</body></html>";
  server.send(200, "text/html", html);
}

void setClock() {
  configTime(0, 0, "pool.ntp.org");
  Serial.print("Time");
  while (time(nullptr) < 100000) { delay(500); Serial.print("."); }
  Serial.println(" OK");
}

// ====================== MQTT control callback ======================
void controlCallback(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (err) return;

  if (doc["interval"]) {
    uploadInterval = doc["interval"];
    Serial.print("NEW INTERVAL (cloud) : ");
    Serial.println(uploadInterval);
  }
}

void connectAWS() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.begin(ssid, password);
    Serial.print("WiFi");
    while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
    Serial.println(" OK");
    Serial.println();
    Serial.println("----- ESP32 NETWORK -----");
    Serial.print("Dashboard : http://"); Serial.println(WiFi.localIP());
    Serial.print("WiFi : "); Serial.println(WiFi.SSID());
    Serial.print("Signal : "); Serial.print(WiFi.RSSI()); Serial.println(" dBm");
    Serial.println("-------------------------");
    Serial.println();
  }

  setClock();

  net.setCACert(AWS_CERT_CA);
  net.setCertificate(AWS_CERT_CRT);
  net.setPrivateKey(AWS_CERT_PRIVATE);

  client.setServer(endpoint, 8883);
  client.setCallback(controlCallback);

  Serial.println("AWS Connecting");
  if (client.connect(deviceId)) {
    Serial.println("AWS OK");
    client.subscribe(controlTopic);
  } else {
    Serial.print("AWS ERROR:");
    Serial.println(client.state());
  }
}

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);

  lcd.init();
  lcd.backlight();
  lcd.print("Weather Start");
  delay(1500);
  lcd.clear();

  sensorOk_bmp = bmp.begin(0x76);
  Serial.println(sensorOk_bmp ? "BMP OK" : "BMP FAIL");

  sensorOk_bh1750 = lightMeter.begin();
  Serial.println(sensorOk_bh1750 ? "BH1750 OK" : "BH FAIL");

  dht.begin();

  connectAWS();

  // ---- local web server routes ----
  server.on("/", handleDashboard);
  server.on("/data", HTTP_GET, handleData);
  server.on("/setInterval", HTTP_POST, handleSetInterval);
  server.on("/setInterval", HTTP_OPTIONS, handleSetInterval); // CORS preflight
  server.begin();
  Serial.println("LOCAL WEB SERVER OK (routes: /, /data, /setInterval)");

  lcdPageStart = millis();
  lastUpload = millis() - uploadInterval; // publish immediately on boot
}

void readSensors() {
  temp      = bmp.readTemperature();
  humidity  = dht.readHumidity();
  pressure  = bmp.readPressure() / 100.0F;
  light     = lightMeter.readLightLevel();
  uv        = analogRead(UV_PIN);
  air       = analogRead(MQ135_PIN);
  rain      = analogRead(RAIN_PIN) < 2000;
  windSpeed = 0; // wire WIND_PIN + add your anemometer's pulse->speed formula here
}

void publishReading() {
  StaticJsonDocument<512> doc;
  doc["device_id"]   = deviceId;
  doc["timestamp"]   = time(nullptr);
  doc["temperature"] = temp;
  doc["humidity"]    = humidity;
  doc["pressure"]    = pressure;
  doc["light"]       = light;
  doc["uv"]          = uv;
  doc["air_quality"] = air;
  doc["rain"]        = rain;
  doc["wind_speed"]  = windSpeed;

  char json[512];
  serializeJson(doc, json);
  Serial.println(json);

  if (client.connected()) {
    client.publish(dataTopic, json);
    packetsSent++;
    lastUploadTimestamp = time(nullptr);
    Serial.println("AWS SENT");
  } else {
    Serial.println("AWS OFFLINE");
  }
}

void updateLCD() {
  unsigned long elapsed = millis() - lcdPageStart;
  if (elapsed < LCD_PAGE_MS) return; // not time to flip page yet

  lcdPageStart = millis();
  lcdPage = (lcdPage + 1) % 3;
  lcd.clear();

  if (lcdPage == 0) {
    lcd.setCursor(0, 0);
    lcd.print("T:"); lcd.print(temp, 1);
    lcd.print(" H:"); lcd.print(humidity, 0);
    lcd.setCursor(0, 1);
    lcd.print("P:"); lcd.print(pressure, 0); lcd.print("hPa");
  } else if (lcdPage == 1) {
    lcd.setCursor(0, 0);
    lcd.print("L:"); lcd.print(light, 0);
    lcd.print(" UV:"); lcd.print(uv);
    lcd.setCursor(0, 1);
    lcd.print("AIR:"); lcd.print(airStatus(air));
  } else {
    lcd.setCursor(0, 0);
    lcd.print(rain ? "RAIN:YES" : "RAIN:NO");
    lcd.setCursor(0, 1);
    lcd.print(client.connected() ? "AWS:ONLINE" : "AWS:OFFLINE");
  }
}

void loop() {
  server.handleClient();

  if (!client.connected()) connectAWS();
  client.loop();

  if (millis() - lastUpload >= uploadInterval) {
    lastUpload = millis();
    readSensors();
    publishReading();
  }

  updateLCD(); // non-blocking — flips page every 3s without delay()
}

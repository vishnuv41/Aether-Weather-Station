<div align="center">

# 🌦️ Aether Weather Station

### Intelligent Cloud-Based IoT Weather Monitoring System

**ESP32 • AWS IoT Core • DynamoDB • Express.js • React • Vite • Render • Vercel**

Real-time environmental monitoring with dual connectivity (Cloud + Local), historical analytics, remote device control, and a professional dashboard.

<br>

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![ESP32](https://img.shields.io/badge/ESP32-IoT-red)
![AWS IoT](https://img.shields.io/badge/AWS-IoT%20Core-orange)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Express](https://img.shields.io/badge/Express.js-Backend-green)
![DynamoDB](https://img.shields.io/badge/DynamoDB-NoSQL-4053D6?logo=amazondynamodb)
![Render](https://img.shields.io/badge/Render-Deployed-5B44F3)
![Vercel](https://img.shields.io/badge/Vercel-Live-black?logo=vercel)

</div>
📌 Overview

Aether Weather Station is a professional IoT-based environmental monitoring platform that combines an ESP32 weather station with AWS cloud services and a modern React dashboard.

The system continuously collects sensor data, securely publishes it to AWS IoT Core using MQTT, stores readings in DynamoDB, and visualizes them through an interactive web dashboard.

It also supports Local Wi-Fi Mode for direct communication with the ESP32 without relying on cloud services.

---

✨ Features

☁ Cloud Mode

- AWS IoT Core integration
- MQTT communication
- DynamoDB data storage
- Historical weather data
- Remote monitoring from anywhere
- Device status monitoring

📡 Local Mode

- Direct ESP32 communication
- No internet required
- Same Wi-Fi network access
- Low latency live updates

📊 Dashboard

- Live sensor readings
- Temperature trends
- Humidity trends
- Pressure trends
- Air quality monitoring
- Rain detection
- UV Index
- Light intensity
- Wind speed
- Sensor health status
- CSV Export
- PDF Report Generation
- Historical data viewer

⚙ Device Control

- Change upload interval
- Device connectivity monitoring
- Online/Offline detection
- Packet statistics

---

🛠 Hardware

- ESP32 DevKit V1
- DHT11
- BMP280
- BH1750
- MQ135
- GUVA UV Sensor
- Rain Sensor
- Anemometer

---

💻 Software Stack

Frontend

- React
- Vite
- Chart.js
- CSS

Backend

- Node.js
- Express.js
- AWS SDK
- MQTT
- REST API

Cloud

- AWS IoT Core
- Amazon DynamoDB
- Render
- Vercel

---

🏗 System Architecture

Sensors
   │
   ▼
ESP32
   │
   ├──────── Local HTTP API
   │              │
   │              ▼
   │        React Dashboard
   │
   └──────── MQTT
             │
             ▼
        AWS IoT Core
             │
             ▼
         DynamoDB
             │
             ▼
      Express Backend
             │
             ▼
      React Dashboard

---

📁 Project Structure

Aether-Weather-Station/

├── backend/
│   ├── src/
│   ├── certs/
│   └── package.json
│
├── esp32/
│   └── WeatherStation.ino
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
└── README.md

---

🚀 Deployment

Frontend

Vercel

Backend

Render

Cloud Services

AWS IoT Core

Amazon DynamoDB

---

📈 Live Dashboard

Features include:

- Live Weather
- Historical Analytics
- Cloud Mode
- Local Mode
- Device Control
- Sensor Health
- Export CSV
- Generate PDF Reports

---

🔒 Security

- MQTT over TLS
- AWS Certificates
- Private Keys
- Secure Cloud Communication
- Environment Variables
- CORS Protection

---

🎯 Future Enhancements

- AI Weather Prediction
- Mobile Application
- Weather Forecast API
- Push Notifications
- OTA Firmware Updates
- Multi-device Support
- GPS Integration
- Solar Power Monitoring

---

👨‍💻 Author

Vishnu Varman

Electronics & Communication Engineering

IoT | Embedded Systems | Full Stack Development | Cloud Computing

GitHub:
https://github.com/vishnuv41

---

⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.

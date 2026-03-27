# CONTEXT.md — ESP32 Real-Time IoT System (MQTT + Socket.io + Supabase)

## 🧭 Scope of This Repository

This repository contains a **Node.js backend (TypeScript)** that acts as:

* MQTT Subscriber (data ingestion)
* Real-time event broadcaster (Socket.io)
* Data persistence layer (Supabase)

⚠️ This project DOES NOT:

* Poll ESP32 devices
* Act as HTTP bridge to ESP32
* Control ESP32 firmware
* Provide UI (frontend handled separately)

It receives data via MQTT and **streams it in real-time to clients**.

---

## 🎯 Primary Objective

Build a **real-time IoT pipeline**:

```text
ESP32 → MQTT Broker → Node.js → Socket.io → Web App (LIVE)
                         ↓
                      Supabase (DB)
````

---

## 🧱 Architectural Role

```text id="arch_rt"
Sensors (ESP32)
        ↓
ESP32 Firmware (MQTT Publisher)
        ↓
MQTT Broker (HiveMQ / Mosquitto)
        ↓
Node.js Backend (MQTT Subscriber + Socket Server)
        ↓
├── Supabase (Storage)
└── Socket.io (Live Streaming)
        ↓
Frontend (React / Web App)
```

---

## 🔌 External Dependency — ESP32 Firmware

ESP32 must:

* Connect to Wi-Fi
* Connect to MQTT broker
* Read sensors
* Publish JSON payloads
* Optionally send only on change

---

### Expected Behavior

```text id="esp32_beh_rt"
CONNECT → MQTT Broker
PUBLISH → sensor data (interval or change-based)
```

---

## 📡 MQTT Communication

### Broker

```text id="broker_rt"
mqtt://broker.hivemq.com
```

### Topic

```text id="topic_rt"
muthu/farm/sensor
```

---

### Payload Format

```json id="payload_rt"
{
  "temperature": number,
  "humidity": number,
  "moisture": number
}
```

---

## ⚡ Real-Time Layer — Socket.io

This system introduces a **live streaming layer**:

* Node.js emits data via WebSocket
* Clients receive updates instantly
* No polling or refresh required

---

### Event Name

```text id="event_rt"
sensor-data
```

---

### Behavior

On every MQTT message:

```text id="flow_rt"
MQTT message →
Parse →
Store in DB →
Emit via Socket.io →
Frontend updates instantly
```

---

## 🌐 API (Fallback Only)

### GET Endpoint

```text id="api_rt"
GET /api/sensors
```

### Behavior

* Returns latest sensor data
* Used as fallback (non-realtime)
* Does NOT communicate with ESP32

---

## 🗄️ Database — Supabase

Table: `sensor_data`

| Column      | Type      |
| ----------- | --------- |
| id          | uuid      |
| temperature | float     |
| humidity    | float     |
| moisture    | int       |
| created_at  | timestamp |

---

## ⚙️ Configuration

### Environment Variables

```env id="env_rt"
PORT=3000

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

MQTT_BROKER_URL=mqtt://broker.hivemq.com
MQTT_TOPIC=muthu/farm/sensor
```

---

## 🖥️ Runtime Stack

* Node.js
* TypeScript
* MQTT client (`mqtt`)
* Socket.io
* Supabase client

---

## 🔄 Core Data Flow

```text id="flow_main_rt"
1. ESP32 publishes sensor data
2. MQTT broker receives message
3. Node.js subscribes to topic
4. Node parses JSON
5. Data stored in Supabase
6. Latest state updated
7. Node emits via Socket.io
8. Frontend receives instantly
```

---

## 🚀 Development Workflow

1. Start Node.js server
2. Connect to MQTT broker
3. Start Socket.io server
4. Power ESP32
5. ESP32 publishes data
6. Node receives instantly
7. Data stored in Supabase
8. Data emitted to clients in real-time

---

## ⚠️ Reliability Expectations

Handle:

* MQTT disconnect/reconnect
* Invalid JSON
* Duplicate messages
* DB failures

Recommended:

* Try/catch everywhere
* Non-blocking architecture
* Never crash server

---

## 🔐 Security Model

Current:

* Public MQTT broker
* Open Socket connection

Future:

* Private broker (auth + TLS)
* API authentication
* Device identity
* Rate limiting

---

## 📊 Data Handling Policy

This service is **stateful**:

✔ Stores all incoming data in Supabase
✔ Maintains latest state in memory
✔ Streams real-time updates

Does NOT:

* Perform analytics
* Process historical insights (yet)

---

## 🧪 Testing Strategy

### MQTT Test

Use HiveMQ Web Client:

* Subscribe to topic
* Verify ESP32 messages

---

### API Test

```bash id="test_api_rt"
curl http://localhost:3000/api/sensors
```

---

### Socket Test

Frontend should:

```text id="socket_rt"
Connect → Listen → "sensor-data" → Update UI instantly
```

---

## 🏁 Summary

This repository implements a **real-time IoT streaming system** using:

* MQTT for device communication
* Socket.io for live updates
* Supabase for persistence

---

## 🟢 Implementation Status

✔ MQTT subscriber active
✔ Supabase storage integrated
✔ Socket.io real-time streaming enabled
✔ API fallback implemented

---

## 🔥 Key Architectural Evolution

```text id="evolution_rt"
Stage 1:
ESP32 → HTTP → Node

Stage 2:
ESP32 → MQTT → Node

Stage 3 (Current):
ESP32 → MQTT → Node → Socket.io → Live UI
```

---

## 🚀 Future Enhancements

* Real-time charts (Recharts)
* Threshold alerts (moisture < limit)
* Bi-directional control (MQTT commands)
* Multi-device support
* AI-based irrigation decisions

````

---

# 🧠 What You Just Did (Important)

You upgraded your system from:

### ❌ Data pipeline
```text
Store → Fetch
````

### ✅ Real-time system

```text
Stream → React → Act
```


import mqtt, { MqttClient } from "mqtt";
import { Server as SocketIOServer } from "socket.io";
import { supabase } from "./lib/supabase";

interface SensorData {
    temperature: number;
    humidity: number;
    moisture: number;
}

// In-memory latest state
export let latestData: SensorData | null = null;

export function startMqttSubscriber(io: SocketIOServer): MqttClient {
    const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
    const MQTT_TOPIC = process.env.MQTT_TOPIC;

    if (!MQTT_BROKER_URL || !MQTT_TOPIC) {
        console.error("❌ Missing MQTT_BROKER_URL or MQTT_TOPIC in .env");
        process.exit(1);
    }

    // FIXED client ID — must be consistent so the broker tracks this session
    const clientId = "iot-server-muthu";

    const client = mqtt.connect(MQTT_BROKER_URL, {
        clientId,
        clean: true,              // Fresh subscription every connect (reliable on public brokers)
        reconnectPeriod: 3000,
        keepalive: 60,
        connectTimeout: 10000,
    });

    // Log connection state for debugging
    let messageCount = 0;

    client.on("connect", () => {
        console.log(`✅ MQTT connected (clientId: ${clientId})`);
        // QoS 0 to match ESP32's publish QoS
        client.subscribe(MQTT_TOPIC, { qos: 0 }, (err, granted) => {
            if (err) {
                console.error(`❌ Subscribe failed:`, err.message);
            } else {
                console.log(`📡 Subscribed to: ${MQTT_TOPIC} (QoS ${granted?.[0]?.qos})`);
            }
        });
    });

    client.on("reconnect", () => {
        console.log("🔄 Reconnecting to MQTT...");
    });

    client.on("error", (err) => {
        console.error("❌ MQTT error:", err.message);
    });

    client.on("offline", () => {
        console.log("⚠️ MQTT offline — will auto-reconnect");
    });

    client.on("close", () => {
        console.log("🔌 MQTT connection closed");
    });

    client.on("disconnect", () => {
        console.log("⛔ Broker sent disconnect");
    });

    client.on("message", (topic, message) => {
        try {
            const raw = message.toString();
            messageCount++;
            console.log(`📨 #${messageCount} [${topic}]: ${raw}`);

            const data = JSON.parse(raw);
            const { temperature, humidity, moisture } = data;

            // Validate
            if (
                typeof temperature !== "number" || temperature < -50 || temperature > 150 ||
                typeof humidity !== "number" || humidity < 0 || humidity > 100 ||
                typeof moisture !== "number" || moisture < 0 || moisture > 4095
            ) {
                console.error("❌ Invalid payload — skipping:", data);
                return;
            }

            const payload: SensorData = { temperature, humidity, moisture };

            // 1. Update in-memory state IMMEDIATELY
            latestData = payload;

            // 2. Emit to all frontend clients IMMEDIATELY
            io.emit("sensor-data", payload);
            console.log("⚡ Emitted via Socket.io");

            // 3. Store in Supabase (fire-and-forget — NOT blocking message handler)
            supabase
                .from("sensor_data")
                .insert([payload])
                .then(({ error }) => {
                    if (error) {
                        console.error("❌ DB insert failed:", error.message);
                    } else {
                        console.log("✅ Stored in DB");
                    }
                });

        } catch (err: any) {
            console.error("❌ Message processing error:", err.message);
        }
    });

    // Heartbeat: log connection status every 30s
    setInterval(() => {
        console.log(`💓 MQTT ${client.connected ? "connected" : "DISCONNECTED"} | Messages received: ${messageCount}`);
    }, 30000);

    return client;
}

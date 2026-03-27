import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { startMqttSubscriber, latestData } from "./mqttSubscriber";

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = new SocketIOServer(server, {
    cors: {
        origin: "*",
    },
});

app.use(express.json());

const PORT = parseInt(process.env.PORT || "3000", 10);

// ==========================================
// 📤 API Fallback Endpoint
// ==========================================
app.get("/api/sensors", (req: Request, res: Response) => {
    if (!latestData) {
        res.status(404).json({ error: "No data yet" });
        return;
    }
    res.json(latestData);
});

// ==========================================
// ⚡ Socket.io Connection Handling
// ==========================================
io.on("connection", (socket) => {
    console.log("🟢 Client connected:", socket.id);

    // Send latest data immediately on connect
    if (latestData) {
        socket.emit("sensor-data", latestData);
    }

    socket.on("disconnect", () => {
        console.log("🔴 Client disconnected:", socket.id);
    });
});

// ==========================================
// 🚀 Start MQTT + Server
// ==========================================
startMqttSubscriber(io);

server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running with Socket.io on port ${PORT}`);
});

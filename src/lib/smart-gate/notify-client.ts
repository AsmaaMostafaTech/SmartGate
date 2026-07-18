// Internal socket.io client used by the Next.js scan API to push real-time
// notifications to parents through the notification mini-service (port 3003).
// Kept as a module-level singleton so the connection persists across requests.

import { io, Socket } from "socket.io-client";

const NOTIFY_URL = "http://localhost:3003";
const NOTIFY_PATH = "/";

let socket: Socket | null = null;

export function getNotifySocket(): Socket {
  if (socket) return socket;
  socket = io(NOTIFY_URL, {
    path: NOTIFY_PATH,
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    timeout: 5000,
    autoConnect: true,
  });
  socket.on("connect", () => {
    console.log("[notify-client] connected to notification service");
  });
  socket.on("connect_error", (err) => {
    console.error("[notify-client] connect error:", err.message);
  });
  return socket;
}

export interface NotifyPayload {
  studentId: string;
  studentName: string;
  grade: string;
  studentNumber: string;
  type: "ENTRY" | "EXIT";
  message: string;
  parentName?: string | null;
  parentPhone?: string | null;
  logId: string;
  createdAt: string;
}

export function pushNotification(payload: NotifyPayload) {
  try {
    const s = getNotifySocket();
    if (s.connected) {
      s.emit("gate-scan", payload);
    } else {
      // buffer: emit once connected
      s.once("connect", () => s.emit("gate-scan", payload));
    }
  } catch (e) {
    console.error("[notify-client] pushNotification failed:", e);
  }
}

import { WebSocketServer } from "ws";
import http from "http";

const PORT = process.env.PORT || 10000;

// Создаём обычный HTTP сервер
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("✅ WebSocket server is running");
});

const wss = new WebSocketServer({ server });
console.log(`✅ WebSocket сервер запускается на порту ${PORT}`);

const clients = new Map();

wss.on("connection", (ws) => {
  console.log("🟢 Новый пользователь подключился");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "join") {
        clients.set(ws, data.room);
        console.log(`👥 Пользователь присоединился к комнате: ${data.room}`);
        return;
      }

      const room = clients.get(ws);
      wss.clients.forEach((client) => {
        if (
          client.readyState === client.OPEN &&
          clients.get(client) === room
        ) {
          client.send(JSON.stringify(data));
        }
      });
    } catch (err) {
      console.error("❌ Ошибка при обработке:", err);
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("🔴 Пользователь отключился");
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Сервер запущен и слушает порт ${PORT}`);
});

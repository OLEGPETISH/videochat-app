import { WebSocketServer } from "ws";
import http from "http";

// Render или любой другой хостинг передаёт порт через process.env.PORT
const PORT = process.env.PORT || 8080;

const server = http.createServer();
const wss = new WebSocketServer({ server });

console.log(`✅ WebSocket сервер запускается на порту ${PORT}`);

// Храним соответствие клиентов и комнат
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

      // Рассылаем сообщения только участникам комнаты
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

server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на ws://localhost:${PORT}`);
});

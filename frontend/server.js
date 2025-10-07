import { WebSocketServer } from "ws";

const socket = new WebSocket(
  window.location.origin.replace(/^http/, "ws")
);

const clients = new Map();

wss.on("connection", (ws) => {
  console.log("🟢 Новый пользователь подключился");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      // Пользователь присоединяется к комнате
      if (data.type === "join") {
        clients.set(ws, data.room);
        console.log(`👥 Пользователь присоединился к комнате: ${data.room}`);
        return;
      }

      const room = clients.get(ws);
      if (!room) return;

      // Рассылаем сообщение всем пользователям этой комнаты, кроме отправителя
      wss.clients.forEach((client) => {
        if (
          client !== ws &&
          client.readyState === client.OPEN &&
          clients.get(client) === room
        ) {
          client.send(JSON.stringify(data));
        }
      });
    } catch (err) {
      console.error("❌ Ошибка при обработке сообщения:", err);
    }
  });

  ws.on("close", () => {
    console.log("🔴 Пользователь отключился");
    clients.delete(ws);
  });
});

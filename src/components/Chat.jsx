import React, { useState, useEffect } from "react";

export default function Chat({ ws }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!ws) return;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "chat") {
          setMessages((prev) => [...prev, msg]);
        }
      } catch (e) {
        console.error("Ошибка при разборе сообщения:", e);
      }
    };
  }, [ws]);

  const sendMessage = () => {
    if (!ws || !input.trim()) return;
    const msg = { type: "chat", text: input };
    ws.send(JSON.stringify(msg));
    setInput("");
  };

  const sendFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const msg = {
        type: "chat",
        text: file.name,
        file: reader.result, // base64-данные
        isImage: file.type.startsWith("image/"),
      };
      ws.send(JSON.stringify(msg));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      style={{
        width: "320px",
        background: "#222",
        color: "#fff",
        padding: "10px",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3>💬 Чат</h3>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "#333",
          padding: "8px",
          borderRadius: "6px",
          marginBottom: "10px",
          maxHeight: "250px",
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: "10px" }}>
            {msg.isImage ? (
              <div>
                <strong>{msg.text}</strong>
                <br />
                <img
                  src={msg.file}
                  alt={msg.text}
                  style={{
                    maxWidth: "100%",
                    borderRadius: "6px",
                    marginTop: "5px",
                  }}
                />
              </div>
            ) : (
              <div>{msg.text}</div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "5px" }}>
        <input
          type="text"
          placeholder="Сообщение..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1, padding: "6px" }}
        />
        <button onClick={sendMessage}>➤</button>
      </div>

      <div style={{ marginTop: "5px" }}>
        <label style={{ cursor: "pointer" }}>
          📎 Прикрепить
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={sendFile}
          />
        </label>
      </div>
    </div>
  );
}

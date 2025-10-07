import React, { useState } from "react";
import VideoRoom from "./components/VideoRoom";

function App() {
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleJoin = () => {
    if (inputValue.trim()) {
      setRoomId(inputValue);
      setJoined(true);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Форма для комнаты */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Введите ID комнаты"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{ padding: "8px", marginRight: "10px" }}
        />
        <button onClick={handleJoin}>Войти</button>
      </div>

      {/* Видео и чат показываются только после входа */}
      {joined && <VideoRoom roomId={roomId} />}
    </div>
  );
}

export default App;

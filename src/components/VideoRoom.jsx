import React, { useEffect, useRef, useState } from "react";
import Chat from "./Chat";
import { motion, AnimatePresence } from "framer-motion";
import { Video, VideoOff, Mic, MicOff, PhoneOff } from "lucide-react";

const VideoRoom = ({ roomId, onLeave }) => {
  const [ws, setWs] = useState(null);
  const [peers, setPeers] = useState({});
  const [showChat, setShowChat] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    const newWs = new WebSocket("ws://localhost:8080");
    setWs(newWs);

    newWs.onopen = async () => {
      console.log("✅ Connected to WebSocket");
      newWs.send(JSON.stringify({ type: "join", room: roomId }));

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Ошибка доступа к камере:", err);
      }
    };

    newWs.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "offer") {
        const pc = createPeerConnection(newWs, data.from);
        setPeers((prev) => ({ ...prev, [data.from]: pc }));
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

        const stream = localStreamRef.current;
        if (stream) stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        newWs.send(
          JSON.stringify({ type: "answer", answer, room: roomId, to: data.from })
        );
      } else if (data.type === "answer") {
        const pc = peers[data.from];
        if (pc)
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      } else if (data.type === "candidate") {
        const pc = peers[data.from];
        if (pc && data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      }
    };

    return () => newWs.close();
  }, [roomId]);

  const createPeerConnection = (ws, peerId) => {
    const pc = new RTCPeerConnection();

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(
          JSON.stringify({
            type: "candidate",
            candidate: event.candidate,
            to: peerId,
            room: roomId,
          })
        );
      }
    };

    pc.ontrack = (event) => {
      setPeers((prev) => ({
        ...prev,
        [peerId]: { ...prev[peerId], stream: event.streams[0] },
      }));
    };

    return pc;
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current
      .getTracks()
      .find((t) => t.kind === "video");
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCameraEnabled(videoTrack.enabled);
    }
  };

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current
      .getTracks()
      .find((t) => t.kind === "audio");
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicEnabled(audioTrack.enabled);
    }
  };

  const leaveCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    ws?.close();
    if (onLeave) onLeave();
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 w-full h-screen bg-gray-100 relative overflow-hidden">
      {/* Видео участников */}
      <div
        className={`grid gap-4 flex-1 overflow-auto transition-all duration-500 ${
          showChat ? "md:pr-[33%]" : ""
        } grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`}
      >
        <div className="relative bg-black rounded-xl overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded">
            Вы
          </span>
        </div>

        {Object.entries(peers).map(([id, peer]) => (
          <div key={id} className="relative bg-black rounded-xl overflow-hidden">
            <video
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              ref={(el) => {
                if (el && peer.stream && el.srcObject !== peer.stream) {
                  el.srcObject = peer.stream;
                }
              }}
            />
            <span className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded">
              Участник {id.slice(0, 4)}
            </span>
          </div>
        ))}
      </div>

      {/* Кнопка чата */}
      <button
        onClick={() => setShowChat((p) => !p)}
        className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition"
      >
        {showChat ? "Закрыть чат" : "Открыть чат"}
      </button>

      {/* Панель управления */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-6 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full shadow-lg">
        <button
          onClick={toggleMic}
          className={`p-3 rounded-full ${
            micEnabled ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {micEnabled ? (
            <Mic className="text-white" size={22} />
          ) : (
            <MicOff className="text-white" size={22} />
          )}
        </button>

        <button
          onClick={toggleCamera}
          className={`p-3 rounded-full ${
            cameraEnabled ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {cameraEnabled ? (
            <Video className="text-white" size={22} />
          ) : (
            <VideoOff className="text-white" size={22} />
          )}
        </button>

        <button
          onClick={leaveCall}
          className="p-3 rounded-full bg-red-700 hover:bg-red-800"
        >
          <PhoneOff className="text-white" size={22} />
        </button>
      </div>

      {/* Анимированный чат */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="absolute right-0 top-0 h-full w-full md:w-1/3 bg-white shadow-xl border-l rounded-l-2xl overflow-hidden z-20"
          >
            {ws && <Chat ws={ws} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoRoom;

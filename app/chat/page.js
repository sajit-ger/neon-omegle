"use client";

import { useEffect, useRef, useState } from "react";

export default function ChatPage() {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);

  const wsRef = useRef(null);
  const pcRef = useRef(null);

  const [status, setStatus] = useState("Waiting for a stranger…");

  // 🔐 CONNECT TO SECURE WSS
  const connectWebSocket = () => {
    const host = window.location.hostname;
    const wsURL = `wss://${host}:8081`;

    console.log("🔌 Connecting:", wsURL);

    const ws = new WebSocket(wsURL);
    wsRef.current = ws;

    ws.onopen = () => console.log("✅ WSS connected");

    ws.onmessage = async (ev) => {
      const data = JSON.parse(ev.data);

      if (!pcRef.current) return;

      if (data.type === "paired") {
        setStatus("Connected!");
        startWebRTC(true);
      }

      if (data.type === "offer") {
        await pcRef.current.setRemoteDescription(data.offer);
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: "answer", answer }));
      }

      if (data.type === "answer") {
        await pcRef.current.setRemoteDescription(data.answer);
      }

      if (data.type === "candidate") {
        await pcRef.current.addIceCandidate(data.candidate);
      }

      if (data.type === "partnerDisconnected") {
        setStatus("Stranger left. Waiting…");
        remoteVideo.current.srcObject = null;
      }
    };
  };

  // START CAMERA
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localVideo.current.srcObject = stream;
    createPeerConnection(stream);
  };

  // PEER CONNECTION
  const createPeerConnection = (stream) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate)
        wsRef.current.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
    };

    pc.ontrack = (event) => {
      remoteVideo.current.srcObject = event.streams[0];
    };

    pcRef.current = pc;
  };

  // WEBRTC START
  const startWebRTC = async (isCaller) => {
    if (!isCaller) return;
    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    wsRef.current.send(JSON.stringify({ type: "offer", offer }));
  };

  useEffect(() => {
    connectWebSocket();
    startCamera();
  }, []);

  return (
    <div style={{ background: "#000", minHeight: "100vh", color: "white", padding: 30 }}>
      <h1 style={{ fontSize: 50 }}>🎧 Neon Stranger Chat</h1>
      <p>{status}</p>

      <div style={{ display: "flex", gap: 40, marginTop: 20 }}>
        <div>
          <h2>Your Camera</h2>
          <video
            ref={localVideo}
            autoPlay
            muted
            playsInline
            style={{ width: 350, borderRadius: 10 }}
          />
        </div>

        <div>
          <h2>Stranger</h2>
          <video
            ref={remoteVideo}
            autoPlay
            playsInline
            style={{ width: 350, borderRadius: 10, background: "black" }}
          />
        </div>
      </div>
    </div>
  );
}

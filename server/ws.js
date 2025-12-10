// server/ws.js

const WebSocket = require("ws");

const wss = new WebSocket.Server({
  port: 8080,
  host: "0.0.0.0",   // IMPORTANT for iPad / LAN access
});

console.log("🔌 WebSocket server running on ws://0.0.0.0:8080");

let waitingClient = null;

wss.on("connection", (socket) => {
  console.log("🟢 New client connected");

  socket.partner = null;

  if (waitingClient && waitingClient.readyState === WebSocket.OPEN) {
    console.log("🤝 Two clients paired!");

    socket.partner = waitingClient;
    waitingClient.partner = socket;

    socket.send(JSON.stringify({ type: "paired" }));
    waitingClient.send(JSON.stringify({ type: "paired" }));

    waitingClient = null;
  } else {
    waitingClient = socket;
    console.log("⏳ Client waiting for partner…");
  }

  socket.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      if (socket.partner && socket.partner.readyState === WebSocket.OPEN) {
        socket.partner.send(JSON.stringify(data));
      }
    } catch (err) {
      console.log("❌ WS parse error:", err);
    }
  });

  socket.on("close", () => {
    console.log("🔴 Client disconnected");

    if (waitingClient === socket) {
      waitingClient = null;
      return;
    }
    if (socket.partner && socket.partner.readyState === WebSocket.OPEN) {
      socket.partner.send(JSON.stringify({ type: "partnerDisconnected" }));
      socket.partner.partner = null;
      waitingClient = socket.partner;
      console.log("↩ Stranger returned to queue");
    }
  });
});

// server/ws-secure.js

const fs = require("fs");
const https = require("https");
const WebSocket = require("ws");

// Load same certificates as the Next.js server
const ssl = {
  key: fs.readFileSync("./localhost-key.pem"),
  cert: fs.readFileSync("./localhost.pem"),
};

// Start HTTPS server ONLY for WebSocket
const server = https.createServer(ssl);

// Create Secure WebSocket server
const wss = new WebSocket.Server({ server });

console.log("🔐 WSS Running on: wss://localhost:8081");

// Waiting queue
let waitingClient = null;

wss.on("connection", (socket) => {
  console.log("⚡ Client connected");
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
    console.log("⏳ Waiting for another user...");
  }

  socket.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (socket.partner && socket.partner.readyState === WebSocket.OPEN) {
        socket.partner.send(JSON.stringify(data));
      }
    } catch {}
  });

  socket.on("close", () => {
    console.log("❌ Client disconnected");

    if (waitingClient === socket) {
      waitingClient = null;
      return;
    }

    if (socket.partner && socket.partner.readyState === WebSocket.OPEN) {
      socket.partner.send(JSON.stringify({ type: "partnerDisconnected" }));
      socket.partner.partner = null;
      waitingClient = socket.partner;
    }
  });
});

server.listen(8081, "0.0.0.0", () => {
  console.log("🚀 Secure WebSocket listening on WSS port 8081");
});

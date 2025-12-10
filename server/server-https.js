// server/server-https.js

const https = require("https");
const fs = require("fs");
const next = require("next");

const app = next({ dev: true });
const handle = app.getRequestHandler();

const ssl = {
  key: fs.readFileSync("./localhost-key.pem"),
  cert: fs.readFileSync("./localhost.pem"),
};

app.prepare().then(() => {
  const server = https.createServer(ssl, (req, res) => handle(req, res));

  server.listen(3000, "0.0.0.0", () => {
    console.log("===============================================");
    console.log("🚀 HTTPS READY");
    console.log("🔗 https://localhost:3000");
    console.log("📱 https://YOUR-LAN-IP:3000  (Open on iPhone/iPad)");
    console.log("===============================================");
  });
});

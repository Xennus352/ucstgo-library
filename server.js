/* eslint-disable @typescript-eslint/no-require-imports */
// Load .env in development (Next.js does this itself in production)
try {
  require("dotenv/config");
} catch {
  // dotenv is a devDependency — production servers use real env vars
}
const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");
const { trackRequest, isBlocked, logIssue } = require("./lib/monitor");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handler = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
  // Create HTTP server with Next.js handler
  // engine.io's attach() saves this handler internally and wraps it,
  // so socket.io requests are intercepted and non-socket.io requests
  // still reach Next.js.
  const httpServer = createServer((req, res) => {
    if (isBlocked(req)) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("Forbidden");
      return;
    }
    trackRequest(req);
    const start = Date.now();
    handler(req, res);
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (res.statusCode >= 500) {
        logIssue({
          source: "http",
          endpoint: req.url,
          method: req.method,
          severity: res.statusCode >= 500 ? "error" : "warning",
          message: `Request failed with HTTP ${res.statusCode}`,
          ip: req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || null,
        });
      } else if (duration > 8000) {
        logIssue({
          source: "http",
          endpoint: req.url,
          method: req.method,
          severity: "warning",
          message: `Slow response (${Math.round(duration)}ms)`,
          ip: req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || null,
        });
      }
    });
  });

  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("[socket] User connected:", socket.id);

    socket.on("join", (userId) => {
      if (userId) socket.join(userId);
    });

    socket.on("disconnect", () => {
      console.log("[socket] User disconnected:", socket.id);
    });
  });

  global.io = io;
  console.log("[socket] Socket.IO server initialized and exposed globally");

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});

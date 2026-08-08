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
const { logger, createRequestLogger } = require("./lib/logger");

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
    const requestId = req.headers["x-request-id"] || crypto.randomUUID();
    const log = createRequestLogger(requestId, req.headers["x-forwarded-for"]?.split(",")[0]?.trim());
    
    log.info({ method: req.method, url: req.url }, "Request started");
    
    handler(req, res);
    res.on("finish", () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
      log[level]({ statusCode: res.statusCode, durationMs: duration }, "Request completed");
      
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
    logger.info({ socketId: socket.id }, "User connected");

    socket.on("join", (userId) => {
      if (userId) {
        socket.join(userId);
        logger.debug({ socketId: socket.id, userId }, "Socket joined user room");
      }
    });

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "User disconnected");
    });
  });

  global.io = io;
  logger.info("Socket.IO server initialized and exposed globally");

  httpServer.listen(PORT, () => {
    logger.info({ port: PORT }, `🚀 Server running on port ${PORT}`);
  });
});

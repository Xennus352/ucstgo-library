const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

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
    handler(req, res);
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

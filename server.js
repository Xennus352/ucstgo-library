const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handler = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

let io;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handler(req, res);
  });

  io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (userId) => {
      if (userId) {
        socket.join(userId);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // expose globally (IMPORTANT for API routes)
  global.io = io;

  httpServer.listen(3000, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});

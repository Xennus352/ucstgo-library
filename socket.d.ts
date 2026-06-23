import { Server } from "socket.io";

declare global {
  // This extends the global/globalThis object
  var io: Server | undefined;
}

export {};
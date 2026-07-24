import { Server } from "socket.io";

export const setIO = (io: Server) => {
  global.io = io;
};

export const getIO = () => {
  return global.io as Server | undefined;
};

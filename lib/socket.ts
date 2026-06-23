import { Server } from "socket.io";

export const getIO = () => {
  return global.io as Server | undefined;
};

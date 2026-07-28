"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io({
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("[socket] Connected:", socket?.id);
    });

    socket.on("connect_error", (err) => {
      console.error("[socket] Connection error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("[socket] Disconnected:", reason);
    });
  }
  return socket;
}

export function getSocketInstance(): Socket {
  return getSocket();
}

export function useSocketEvent(
  event: string,
  callback: (...args: unknown[]) => void,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const s = getSocket();
    const handler = (...args: unknown[]) => callbackRef.current(...args);
    s.on(event, handler);
    return () => {
      s.off(event, handler);
    };
  }, [event]);
}

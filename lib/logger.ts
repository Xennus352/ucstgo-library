import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  transport: isDev ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss Z", ignore: "pid,hostname" } } : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    service: "ucstgo-library",
    env: process.env.NODE_ENV,
  },
  redact: {
    paths: [
      "*.password",
      "*.secret",
      "*.token",
      "*.authorization",
      "*.cookie",
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
    ],
    censor: "[REDACTED]",
  },
});

export function createRequestLogger(requestId: string, ip?: string) {
  return logger.child({ requestId, ip });
}

export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
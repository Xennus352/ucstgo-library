import { NextResponse } from "next/server";

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  BODY_TOO_LARGE: "BODY_TOO_LARGE",
  INTERNAL: "INTERNAL_ERROR",
} as const;

export function toNextResponse(error: unknown) {
  if (error instanceof AppError) {
    // Surface business-rule failures (validation, conflicts) as
    // warning issues, but skip auth/not-found noise
    if (
      error.status >= 400 &&
      error.status < 500 &&
      ![401, 403, 404, 429].includes(error.status)
    ) {
      void import("@/lib/log-error").then(({ logSystemError }) =>
        logSystemError({
          source: "api",
          message: error.message.slice(0, 1000),
          severity: "warning",
        }),
      );
    }
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: error.status },
    );
  }
  console.error("Unhandled error:", error);
  const message =
    error instanceof Error ? error.message : "Internal server error";
  const stack = error instanceof Error ? error.stack ?? null : null;
  void import("@/lib/log-error").then(({ logSystemError }) =>
    logSystemError({
      source: "api",
      message: message.slice(0, 1000),
      stack,
      severity: "error",
    }),
  );
  return NextResponse.json(
    { error: "Internal server error", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}

export function unauthorized(message = "Unauthorized") {
  return new AppError(message, ErrorCodes.UNAUTHORIZED, 401);
}

export function forbidden(message = "Forbidden") {
  return new AppError(message, ErrorCodes.FORBIDDEN, 403);
}

export function notFound(entity = "Resource") {
  return new AppError(`${entity} not found`, ErrorCodes.NOT_FOUND, 404);
}

export function validation(message: string, details?: unknown) {
  return new AppError(message, ErrorCodes.VALIDATION_ERROR, 400, details);
}

export function conflict(message: string) {
  return new AppError(message, ErrorCodes.CONFLICT, 409);
}

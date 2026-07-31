-- Add system error/issue tracking table
CREATE TABLE "error_log" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "source" VARCHAR(20) NOT NULL DEFAULT 'http',
    "endpoint" VARCHAR(500),
    "method" VARCHAR(10),
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'error',
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "count" INTEGER NOT NULL DEFAULT 1,
    "firstSeen" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "lastSeen" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "ip" VARCHAR(64)
);

CREATE INDEX "error_log_status_idx" ON "error_log" ("status");
CREATE INDEX "error_log_source_idx" ON "error_log" ("source");
CREATE INDEX "error_log_last_seen_idx" ON "error_log" ("lastSeen");

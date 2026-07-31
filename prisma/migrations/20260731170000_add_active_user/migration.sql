-- Active users heartbeat (who is online right now)
CREATE TABLE "active_user" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "studentId" TEXT,
    "role" TEXT,
    "path" TEXT,
    "lastSeenAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "active_user_last_seen_idx" ON "active_user" ("lastSeenAt");

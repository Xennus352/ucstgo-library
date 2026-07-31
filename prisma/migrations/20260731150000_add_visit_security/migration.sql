-- CreateTable
CREATE TABLE "visit_log" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visit_log_visitedAt_idx" ON "visit_log"("visitedAt");

-- CreateIndex
CREATE INDEX "visit_log_path_idx" ON "visit_log"("path");

-- CreateIndex
CREATE INDEX "visit_log_ip_idx" ON "visit_log"("ip");

-- CreateTable
CREATE TABLE "security_event" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "path" TEXT,
    "userAgent" TEXT,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "security_event_createdAt_idx" ON "security_event"("createdAt");

-- CreateIndex
CREATE INDEX "security_event_ip_idx" ON "security_event"("ip");

-- CreateTable
CREATE TABLE "blocked_ip" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_ip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blocked_ip_ip_key" ON "blocked_ip"("ip");

-- CreateIndex
CREATE INDEX "blocked_ip_ip_idx" ON "blocked_ip"("ip");

/**
 * Lightweight request monitoring for the UCSTGO Digital Library server.
 *
 * - Logs page visits into `visit_log` (skips assets/API calls).
 * - Detects common scans/probes: scanner user agents (nmap, sqlmap,
 *   masscan, ...), suspicious path probing, and request rate bursts.
 * - Maintains a blocklist of IPs persisted in `blocked_ip`.
 *
 * Runs inside `server.js` so it sees every request, including probes
 * that never match a Next.js route.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const crypto = require("crypto");
const { Pool } = require("pg");

// Reuse a single pool across HMR re-imports in dev
if (!globalThis.__monitorPool) {
  globalThis.__monitorPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
  });
}
const pool = globalThis.__monitorPool;

// ---------------------------------------------------------------
// Threat signatures
// ---------------------------------------------------------------
const SCANNER_UA_RE =
  /nmap|masscan|sqlmap|nikto|zgrab|wpscan|dirbuster|gobuster|fimap|jigsaw|w3af|hydra|burpsuite|acunetix|nessus|openvas|fscan|goby|radar|curl\/|wget\/|libwww|python-requests|go-http-client|scrapy|httpx|headlesschrome|phantomjs/i;

const SUSPICIOUS_PATH_RE =
  /(^|\/)(\.env|\.git|\.aws|\.svn|\.hg|\.ssh|\.github|\.docker|wp-admin|wp-login|wp-content|wp-includes|xmlrpc\.php|phpmyadmin|adminer|actuator|server-status|server-info|cgi-bin|config\.php|config\.ini|\.htaccess|id_rsa|passwd|shadow|backup|dump|\.sql$|\.bak$|\.old$|\.swp$|\.log$|\.php$|\.asp|\.jsp|\.aspx)|(%00|\.\.\/|union select|select.*from|insert into|alter table|exec\(|cmd=|eval=|base64_|\/proc\/|\/sys\/|\/etc\/|\/var\/)/i;

// ---------------------------------------------------------------
// In-memory rate tracking per IP
// ---------------------------------------------------------------
const ipWindows = new Map(); // ip -> { start, count, lastEventAt }
const RATE_WINDOW_MS = 15000;
const RATE_LIMIT = 40; // requests per window before flagging
const RATE_EVENT_COOLDOWN_MS = 60000;

// ---------------------------------------------------------------
// Blocklist cache
// ---------------------------------------------------------------
let blockedIps = new Set();

// ---------------------------------------------------------------
// System issue log (error_log table) with in-memory buffer so
// failures are not lost while the DB is temporarily unreachable.
// ---------------------------------------------------------------
const issueBuffer = [];

function logIssue(input) {
  const row = {
    source: String(input.source ?? "http").slice(0, 20),
    endpoint: (input.endpoint ?? null),
    method: (input.method ?? null),
    message: String(input.message ?? "Unknown issue").slice(0, 1000),
    stack: (input.stack ?? null)?.slice(0, 4000) ?? null,
    severity: String(input.severity ?? "error").slice(0, 20),
    ip: input.ip ?? null,
  };

  const insert = () =>
    pool
      .query(
        `UPDATE error_log SET count = count + 1, "lastSeen" = NOW()
         WHERE source = $1 AND endpoint IS NOT DISTINCT FROM $2
           AND message = $3 AND "lastSeen" >= NOW() - INTERVAL '10 minutes'
         RETURNING id`,
        [row.source, row.endpoint, row.message],
      )
      .then((res) => {
        if (res.rowCount === 0) {
          return pool.query(
            `INSERT INTO error_log (id, source, endpoint, method, message, stack, severity, ip)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              crypto.randomUUID(),
              row.source,
              row.endpoint,
              row.method,
              row.message,
              row.stack,
              row.severity,
              row.ip,
            ],
          );
        }
      });

  insert().catch(() => {
    issueBuffer.push(row);
    if (issueBuffer.length > 200) issueBuffer.shift();
  });
}

function flushIssueBuffer() {
  if (issueBuffer.length === 0) return;
  const batch = issueBuffer.splice(0, issueBuffer.length);
  Promise.all(
    batch.map((row) =>
      pool
        .query(
          `UPDATE error_log SET count = count + 1, "lastSeen" = NOW()
           WHERE source = $1 AND endpoint IS NOT DISTINCT FROM $2
             AND message = $3 AND "lastSeen" >= NOW() - INTERVAL '10 minutes'
           RETURNING id`,
          [row.source, row.endpoint, row.message],
        )
        .then((res) => {
          if (res.rowCount === 0) {
            return pool.query(
              `INSERT INTO error_log (id, source, endpoint, method, message, stack, severity, ip)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                crypto.randomUUID(),
                row.source,
                row.endpoint,
                row.method,
                row.message,
                row.stack,
                row.severity,
                row.ip,
              ],
            );
          }
        }),
    ),
  ).catch(() => {
    issueBuffer.unshift(...batch);
  });
}

pool.on("error", (err) => {
  console.error("[monitor] DB pool error:", err?.message);
  logIssue({
    source: "db",
    severity: "critical",
    message: `Database pool error: ${err?.message ?? "unknown"}`,
  });
});

async function refreshBlockedIps() {
  try {
    const res = await pool.query("SELECT ip FROM blocked_ip");
    blockedIps = new Set(res.rows.map((r) => r.ip));
    flushIssueBuffer();
  } catch (err) {
    console.error("[monitor] Failed to refresh blocked IPs:", err?.message);
    logIssue({
      source: "db",
      severity: "warning",
      message: `Database unreachable: ${err?.message ?? "unknown"}`,
    });
  }
}

// ---------------------------------------------------------------
// Daily log retention cleanup (auto-delete old rows)
//   30 days:  visit_log
//   90 days:  security_event, error_log
//   24 hours: active_user (stale heartbeats)
// ---------------------------------------------------------------
let lastCleanupAt = 0;

async function runDailyCleanup() {
  try {
    await pool.query(`DELETE FROM visit_log WHERE "visitedAt" < NOW() - INTERVAL '30 days'`);
    await pool.query(
      `DELETE FROM security_event WHERE "createdAt" < NOW() - INTERVAL '90 days'`,
    );
    await pool.query(`DELETE FROM error_log WHERE "lastSeen" < NOW() - INTERVAL '90 days'`);
    await pool.query(`DELETE FROM active_user WHERE "lastSeenAt" < NOW() - INTERVAL '24 hours'`);
    console.log("[monitor] Daily log cleanup completed");
  } catch (err) {
    console.error("[monitor] Log cleanup failed:", err?.message);
    logIssue({
      source: "db",
      severity: "warning",
      message: `Log retention cleanup failed: ${err?.message ?? "unknown"}`,
    });
  }
}

setInterval(() => {
  const now = Date.now();
  if (now - lastCleanupAt > 24 * 60 * 60 * 1000) {
    lastCleanupAt = now;
    runDailyCleanup();
  }
}, 30 * 60 * 1000).unref();

refreshBlockedIps();
setInterval(refreshBlockedIps, 30000).unref();

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  const realIp = req.headers["x-real-ip"];
  if (realIp) return String(realIp).trim();
  return req.socket?.remoteAddress || null;
}

function isStaticAsset(path) {
  return (
    path.startsWith("/_next") ||
    path.startsWith("/__nextjs") ||
    path.startsWith("/api") ||
    path.startsWith("/images") ||
    path.startsWith("/files") ||
    path.startsWith("/favicon") ||
    /\.(js|css|png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|eot|map|json|txt|xml|webmanifest)$/i.test(
      path,
    )
  );
}

function detectThreat(path, ua) {
  if (SCANNER_UA_RE.test(ua)) return "SCANNER_UA";
  if (SUSPICIOUS_PATH_RE.test(path)) return "PATH_PROBE";
  return null;
}

// ---------------------------------------------------------------
// DB writers (fire-and-forget, never block the request)
// ---------------------------------------------------------------
function logVisit(req, path) {
  const ip = getClientIp(req);
  pool
    .query(
      `INSERT INTO visit_log (id, path, ip, "userAgent", referrer, "visitedAt")
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        crypto.randomUUID(),
        path,
        ip,
        req.headers["user-agent"] || null,
        req.headers.referer || null,
      ],
    )
    .catch(() => {});
}

function logEvent(eventType, ip, path, ua) {
  pool
    .query(
      `INSERT INTO security_event (id, "eventType", ip, path, "userAgent", count, "createdAt")
       VALUES ($1, $2, $3, $4, $5, 1, NOW())`,
      [crypto.randomUUID(), eventType, ip, path || null, ua || null],
    )
    .catch(() => {});
}

// ---------------------------------------------------------------
// Public API
// ---------------------------------------------------------------
function trackRequest(req) {
  try {
    const url = new URL(req.url, "http://localhost");
    const path = url.pathname;
    const ua = req.headers["user-agent"] || "";
    const ip = getClientIp(req);
    const now = Date.now();

    // Rate-burst tracking
    if (ip) {
      let win = ipWindows.get(ip);
      if (!win || now - win.start > RATE_WINDOW_MS) {
        win = { start: now, count: 0, lastEventAt: 0 };
        ipWindows.set(ip, win);
      }
      win.count += 1;
      if (
        win.count >= RATE_LIMIT &&
        now - win.lastEventAt > RATE_EVENT_COOLDOWN_MS
      ) {
        win.lastEventAt = now;
        logEvent("RATE_BURST", ip, path, ua);
      }
    }

    // Scan / probe detection
    let threat = null;
    if (req.method === "GET" || req.method === "HEAD" || req.method === "POST") {
      threat = detectThreat(path, ua);
      if (threat) logEvent(threat, ip, path, ua);
    }

    // Visit logging (page views only — skip assets and detected probes)
    if (req.method === "GET" && !isStaticAsset(path) && !threat) {
      logVisit(req, path);
    }
  } catch (err) {
    console.error("[monitor] trackRequest error:", err?.message);
  }
}

function isBlocked(req) {
  const ip = getClientIp(req);
  return !!ip && blockedIps.has(ip);
}

module.exports = { trackRequest, isBlocked, refreshBlockedIps, logIssue };

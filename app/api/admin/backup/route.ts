import { Pool } from "pg";
import { NextResponse } from "next/server";
import JSZip from "jszip";
import { requireRole, ALLOWED_ADMIN_ROLES } from "@/lib/services/auth.service";

const databaseUrl = process.env.DATABASE_URL;
const cleanUrl = databaseUrl?.replace(/[&?]pgbouncer=true/, "");

const pool = new Pool({
  connectionString: cleanUrl,
  ssl: { rejectUnauthorized: false },
  max: 2,
  idleTimeoutMillis: 30000,
});

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5-minute maximum execution timeout

/**
 * Escapes values according to RFC 4180 CSV standard:
 * - Null/Undefined -> empty string
 * - Objects/Arrays -> JSON stringified
 * - Strings with quotes, commas, or newlines -> wrapped in double quotes, with internal quotes doubled.
 */
function formatCsvValue(val: any): string {
  if (val === null || val === undefined) {
    return "";
  }

  let strVal: string;
  if (val instanceof Date) {
    strVal = val.toISOString();
  } else if (typeof val === "object") {
    strVal = JSON.stringify(val);
  } else {
    strVal = String(val);
  }

  if (
    strVal.includes('"') ||
    strVal.includes(",") ||
    strVal.includes("\n") ||
    strVal.includes("\r")
  ) {
    return `"${strVal.replace(/"/g, '""')}"`;
  }

  return strVal;
}

export async function POST(req: Request) {
  try {
    await requireRole(req.headers, ALLOWED_ADMIN_ROLES);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Unauthorized" },
      { status: err.status ?? 401 }
    );
  }

  if (!databaseUrl) {
    return NextResponse.json(
      { error: "DATABASE_URL environment variable is not set" },
      { status: 500 }
    );
  }

  let client;
  try {
    client = await pool.connect();
    const zip = new JSZip();

    // 1. Fetch all base table names in 'public' schema
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables: string[] = tablesResult.rows.map((r) => r.table_name);

    // 2. Export each table to CSV
    for (const table of tables) {
      // Get table columns
      const columnsResult = await client.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`,
        [table]
      );

      const columns: string[] = columnsResult.rows.map((c) => c.column_name);

      let csvContent = "";

      // Add Header Row
      const headerRow = columns.map((col) => formatCsvValue(col)).join(",");
      csvContent += headerRow + "\n";

      // Fetch data in batches to keep memory footprints low
      const BATCH_SIZE = 2000;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const dataResult = await client.query(
          `SELECT * FROM public."${table}" LIMIT $1 OFFSET $2`,
          [BATCH_SIZE, offset]
        );

        const rows = dataResult.rows;
        if (rows.length === 0) break;

        for (const row of rows) {
          const rowValues = columns.map((col) => formatCsvValue(row[col]));
          csvContent += rowValues.join(",") + "\n";
        }

        offset += BATCH_SIZE;
        if (rows.length < BATCH_SIZE) {
          hasMore = false;
        }
      }

      // Add table CSV file into the ZIP archive
      zip.file(`${table}.csv`, csvContent);
    }

    // 3. Generate ZIP as ArrayBuffer (Resolves TypeScript BodyInit error)
    const arrayBuffer = await zip.generateAsync({
      type: "arraybuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

    // Return downloadable .zip response containing all CSVs
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="ucstgo-csv-backup-${timestamp}.zip"`,
        "Content-Length": String(arrayBuffer.byteLength),
      },
    });
  } catch (err: any) {
    console.error("Database CSV backup error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to generate CSV backup" },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
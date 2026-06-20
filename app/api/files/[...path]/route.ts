
import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import mime from "mime-types";

// Notice the explicit Promise type inside Route Handlers
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    // Await the params Promise before using destructuring
    const { path: filePathArray } = await params;

    if (!filePathArray || filePathArray.length === 0) {
      return new NextResponse("Bad Request: Missing path", { status: 400 });
    }

    const relativePath = path.join(...filePathArray);
    const baseStorageDir = path.resolve(
      process.cwd(),
      "..",
      "ucstgo-library-storage",
    );
    const safeAbsoluteTarget = path.resolve(baseStorageDir, relativePath);

    // Guardrail validation check
    if (!safeAbsoluteTarget.startsWith(baseStorageDir)) {
      return new NextResponse("Forbidden: Access Denied", { status: 403 });
    }

    let fileStat;
    try {
      fileStat = await stat(safeAbsoluteTarget);
    } catch {
      return new NextResponse("File Not Found", { status: 404 });
    }

    const contentType =
      mime.lookup(safeAbsoluteTarget) || "application/octet-stream";
    const nodeStream = createReadStream(safeAbsoluteTarget);
    const webStream = nodeStream as unknown as ReadableStream;

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileStat.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("File Serving Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

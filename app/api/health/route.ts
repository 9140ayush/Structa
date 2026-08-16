import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

/**
 * GET /api/health
 *
 * Lightweight health & uptime endpoint for production monitoring (Vercel, UptimeRobot, etc.).
 * Returns operational status without leaking any secrets, credentials, or internal configuration.
 */
export async function GET() {
  const startTime = Date.now();
  let dbStatus = "disconnected";

  try {
    const mongoose = await connectToDatabase();
    if (mongoose.connection.readyState === 1) {
      dbStatus = "connected";
    } else {
      dbStatus = `state_${mongoose.connection.readyState}`;
    }
  } catch {
    dbStatus = "error";
  }

  const responseTimeMs = Date.now() - startTime;
  const isHealthy = dbStatus === "connected";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      latencyMs: responseTimeMs,
      services: {
        database: dbStatus,
      },
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}

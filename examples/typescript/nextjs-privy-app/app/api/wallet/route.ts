/**
 * Wallet Info Endpoint - Proxy to Express Server
 *
 * This endpoint proxies requests to the Express server that handles
 * Privy SDK operations (avoids Next.js webpack bundling issues)
 */

import { NextRequest, NextResponse } from "next/server";

const SERVER_URL = process.env.PRIVY_SERVER_URL || "http://localhost:3002";

export async function GET(req: NextRequest) {
  try {
    const response = await fetch(`${SERVER_URL}/api/wallet`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching wallet info:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        help: "Make sure the Privy server is running on port 3001 (cd server && pnpm dev)",
      },
      { status: 500 }
    );
  }
}

/**
 * Paid Data Endpoint - Proxy to Express Server
 *
 * This endpoint proxies paid requests to the Express server that handles
 * Privy SDK operations and X402 payments
 */

import { NextRequest, NextResponse } from "next/server";

const SERVER_URL = process.env.PRIVY_SERVER_URL || "http://localhost:3002";

export async function GET(req: NextRequest) {
  try {
    const targetUrl = req.nextUrl.searchParams.get("url");
    const url = new URL(`${SERVER_URL}/api/paid/data`);
    if (targetUrl) {
      url.searchParams.set("url", targetUrl);
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error in paid data proxy:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        help: "Make sure the Privy server is running on port 3001",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await fetch(`${SERVER_URL}/api/paid/data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error in paid data proxy:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

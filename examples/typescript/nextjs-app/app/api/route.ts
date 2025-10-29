/**
 * Root API Route - Information about available endpoints
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Welcome to X402 Demo API (Next.js)",
    documentation: "/api/docs",
    free_endpoint: "/api/free-data",
    paid_endpoints: [
      "/api/premium-data",
      "/api/expensive-data",
      "/api/tiered-data/[tier]",
    ],
  });
}

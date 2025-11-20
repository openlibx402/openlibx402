/**
 * API Root Endpoint
 *
 * Provides information about available API endpoints
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    name: "Next.js + Privy + X402 Example API",
    version: "1.0.0",
    description: "Example API demonstrating Privy server wallet integration with X402 payment protocol",
    endpoints: {
      "/api/wallet": {
        method: "GET",
        description: "Get Privy server wallet information and balance",
      },
      "/api/paid/data": {
        method: "GET",
        description: "Make a paid request to an X402-protected endpoint",
        query: {
          url: "Optional target URL (defaults to X402_API_URL env var)",
        },
      },
      "/api/paid/data": {
        method: "POST",
        description: "Make a paid POST request to an X402-protected endpoint",
        body: {
          url: "Optional target URL",
          data: "Data to send in the request",
        },
      },
    },
    features: [
      "Server-side wallet management with Privy",
      "Automatic payment handling for X402 endpoints",
      "No private keys in code - delegated to Privy",
      "Configurable payment limits",
      "Solana devnet support",
    ],
  });
}

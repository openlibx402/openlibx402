/**
 * Data Processing Endpoint - Requires 0.25 USDC payment
 * Demonstrates POST requests with payment requirements
 */

import { NextRequest, NextResponse } from "next/server";
import { withPayment } from "@openlibx402/nextjs";
import "../config"; // Initialize X402 config

export const POST = withPayment(
  {
    amount: "0.25",
    description: "Data processing service",
  },
  async (req: NextRequest, context) => {
    const body = await req.json();
    const { data } = body;

    return NextResponse.json({
      status: "processed",
      input_length: data?.length || 0,
      processed_at: new Date().toISOString(),
      result: `Processed: ${data}`,
    });
  }
);

/**
 * Premium Data Endpoint - Requires 0.10 USDC payment
 */

import { NextRequest, NextResponse } from "next/server";
import { withPayment } from "@openlibx402/nextjs";
import "../config"; // Initialize X402 config

export const GET = withPayment(
  {
    amount: "0.10",
    description: "Access to premium market data",
  },
  async (req: NextRequest, context) => {
    return NextResponse.json({
      data: "This is premium content",
      market_data: {
        price: 100.5,
        volume: 1_000_000,
        timestamp: new Date().toISOString(),
      },
      price_paid: "0.10",
      access: "premium",
      payment_id: context.payment?.paymentId,
    });
  }
);

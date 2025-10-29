/**
 * Tiered Data Endpoint - Requires 0.05 USDC payment
 * Demonstrates dynamic routes with payment requirements
 */

import { NextRequest, NextResponse } from "next/server";
import { withPayment } from "@openlibx402/nextjs";
import "../../config"; // Initialize X402 config

export const GET = withPayment(
  {
    amount: "0.05",
    description: "Tiered data access",
  },
  async (req: NextRequest, context) => {
    // Extract tier from URL
    const url = new URL(req.url);
    const tier = url.pathname.split("/").pop();

    const tierData: Record<string, any> = {
      basic: { quality: "720p", ads: true },
      standard: { quality: "1080p", ads: false },
      premium: { quality: "4K", ads: false, offline: true },
    };

    return NextResponse.json({
      tier,
      data: tierData[tier || "basic"] || tierData.basic,
      price_paid: "0.05",
    });
  }
);

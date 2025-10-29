/**
 * Expensive Data Endpoint - Requires 1.00 USDC payment
 * Demonstrates accessing payment details
 */

import { NextRequest, NextResponse } from "next/server";
import { withPayment } from "@openlibx402/nextjs";
import "../config"; // Initialize X402 config

export const GET = withPayment(
  {
    amount: "1.00",
    description: "Access to expensive AI model inference",
  },
  async (req: NextRequest, context) => {
    const payment = context.payment;

    return NextResponse.json({
      data: "This is very expensive AI-generated content",
      model: "gpt-5-turbo",
      result: "The meaning of life is 42, according to our advanced AI",
      payment_id: payment?.paymentId,
      amount_paid: payment?.actualAmount,
      transaction_hash: payment?.transactionHash,
      access: "premium-plus",
    });
  }
);

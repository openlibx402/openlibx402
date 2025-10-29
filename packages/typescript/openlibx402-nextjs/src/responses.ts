/**
 * Response Builder for X402 Payment Requests
 *
 * Utility functions for building 402 Payment Required responses.
 */

import type { PaymentRequestData } from "@openlibx402/core";
import { NextResponse } from "next/server";

export interface Build402ResponseOptions {
  amount: string;
  paymentAddress: string;
  tokenMint: string;
  network: string;
  resource: string;
  description?: string;
  expiresIn?: number; // seconds
}

export function build402Response(
  options: Build402ResponseOptions
): NextResponse {
  const expiresIn = options.expiresIn || 300; // 5 minutes default
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  const paymentRequest: PaymentRequestData = {
    max_amount_required: options.amount,
    asset_type: "SPL",
    asset_address: options.tokenMint,
    payment_address: options.paymentAddress,
    network: options.network,
    expires_at: expiresAt,
    nonce: generateNonce(),
    payment_id: generatePaymentId(),
    resource: options.resource,
    description: options.description,
  };

  return NextResponse.json(paymentRequest, {
    status: 402,
    headers: {
      "Content-Type": "application/json",
      "WWW-Authenticate": `X402 amount=${options.amount} asset=${options.tokenMint}`,
    },
  });
}

function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15);
}

function generatePaymentId(): string {
  return `pay_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

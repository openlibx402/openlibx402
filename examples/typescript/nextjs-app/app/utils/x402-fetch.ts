/**
 * X402 Fetch Utility
 *
 * Implements the X402 payment protocol for browser-based requests.
 * Handles 402 Payment Required responses and payment retry flow.
 */

import type { PaymentRequestData } from "@openlibx402/core";

export interface X402FetchOptions extends RequestInit {
  maxRetries?: number;
  onPaymentRequired?: (paymentRequest: PaymentRequestData) => Promise<string>;
}

/**
 * Fetch with automatic X402 payment handling
 *
 * 1. First request: Try without payment
 * 2. If 402: Get payment request details
 * 3. Call onPaymentRequired callback (user implements payment)
 * 4. Retry: Request with payment authorization header
 */
export async function x402Fetch(
  url: string,
  options: X402FetchOptions = {}
): Promise<Response> {
  const { maxRetries = 1, onPaymentRequired, ...fetchOptions } = options;

  let retries = 0;

  while (retries <= maxRetries) {
    try {
      const response = await fetch(url, fetchOptions);

      // If successful, return response
      if (response.ok) {
        return response;
      }

      // If 402 Payment Required
      if (response.status === 402) {
        // If we've already retried or no payment handler, return 402
        if (retries > 0 || !onPaymentRequired) {
          return response;
        }

        // Parse payment request
        const paymentRequest: PaymentRequestData = await response.json();

        console.log("💳 Payment Required (402)");
        console.log(`   Amount: ${paymentRequest.max_amount_required} ${paymentRequest.asset_type}`);
        console.log(`   Recipient: ${paymentRequest.payment_address}`);
        console.log(`   Network: ${paymentRequest.network}`);

        try {
          // Call the payment handler to get authorization
          console.log("🔄 Processing payment...");
          const authorizationHeader = await onPaymentRequired(paymentRequest);

          // Retry with payment header
          console.log("🔁 Retrying request with payment...");
          retries++;

          const retryOptions = {
            ...fetchOptions,
            headers: {
              ...fetchOptions.headers,
              "x-payment-authorization": authorizationHeader,
            },
          };

          const retryResponse = await fetch(url, retryOptions);

          if (retryResponse.ok) {
            console.log("✅ Payment successful!");
            return retryResponse;
          }

          // If retry failed, return the failed response
          return retryResponse;
        } catch (paymentError) {
          console.error("❌ Payment failed:", paymentError);
          throw new Error(
            `Payment processing failed: ${paymentError instanceof Error ? paymentError.message : String(paymentError)}`
          );
        }
      }

      // For other status codes, return the response
      return response;
    } catch (error) {
      if (retries >= maxRetries) {
        throw error;
      }
      retries++;
    }
  }

  // This shouldn't be reached, but satisfy TypeScript
  const response = await fetch(url, fetchOptions);
  return response;
}

/**
 * Parse X402 error response
 */
export function parseX402Error(error: any): string {
  if (error?.response?.status === 402) {
    return "Payment Required";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

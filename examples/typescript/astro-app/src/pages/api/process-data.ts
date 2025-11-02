/**
 * Process Data Endpoint - Requires 0.25 USDC payment (POST request)
 */

import { withPayment } from '../../utils/x402-config';

export async function POST({ request }: { request: Request }) {
  const result = await withPayment(
    request,
    {
      amount: '0.25',
      description: 'Process data with payment requirement',
    },
    async (req, context) => {
      // Parse request body
      let requestData = {};
      try {
        requestData = await req.json();
      } catch (e) {
        // Ignore parsing errors
      }

      return {
        data: 'Data processed successfully',
        input: requestData,
        processed_at: new Date().toISOString(),
        price_paid: '0.25',
        access: 'processing',
        payment_id: context.payment?.paymentId,
      };
    }
  );

  // Return 402 or 403 with payment request if needed
  if (result.status === 402 || result.status === 403) {
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Return successful response
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

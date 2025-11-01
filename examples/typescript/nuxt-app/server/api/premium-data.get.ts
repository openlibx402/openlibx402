/**
 * Premium Data Endpoint - Requires 0.10 USDC payment
 */

export default defineEventHandler(async (event) => {
  return await withPayment(
    event,
    {
      amount: '0.10',
      description: 'Access to premium market data',
    },
    async (event, context) => {
      return {
        data: 'This is premium content',
        market_data: {
          price: 100.5,
          volume: 1_000_000,
          timestamp: new Date().toISOString(),
        },
        price_paid: '0.10',
        access: 'premium',
        payment_id: context.payment?.paymentId,
      }
    }
  )
})

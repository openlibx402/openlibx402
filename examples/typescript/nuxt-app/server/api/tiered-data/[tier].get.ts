/**
 * Tiered Data Endpoint - Requires 0.05 USDC payment
 * Dynamic route that returns content based on tier parameter
 */

export default defineEventHandler(async (event) => {
  const tier = getRouterParam(event, 'tier') || 'basic'
  
  return await withPayment(
    event,
    {
      amount: '0.05',
      description: `Access to ${tier} tier content`,
    },
    async (event, context) => {
      const tierContent: Record<string, any> = {
        basic: {
          quality: 'SD',
          resolution: '480p',
          features: ['Basic analytics', 'Standard support'],
        },
        premium: {
          quality: 'HD',
          resolution: '1080p',
          features: ['Advanced analytics', 'Priority support', 'API access'],
        },
        enterprise: {
          quality: '4K',
          resolution: '2160p',
          features: [
            'Full analytics suite',
            '24/7 support',
            'Unlimited API access',
            'Custom integrations',
          ],
        },
      }
      
      return {
        tier,
        content: tierContent[tier] || tierContent.basic,
        price_paid: '0.05',
        access: 'tiered',
        payment_id: context.payment?.paymentId,
      }
    }
  )
})

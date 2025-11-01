/**
 * Root API Endpoint - Provides API information
 */

export default defineEventHandler(async (event) => {
  return {
    message: 'X402 Nuxt.js API',
    version: '1.0.0',
    endpoints: {
      free: '/api/free-data',
      premium: '/api/premium-data',
      expensive: '/api/expensive-data',
      tiered: '/api/tiered-data/[tier]',
      process: '/api/process-data',
    },
    documentation: 'https://openlib.xyz',
  }
})

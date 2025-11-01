/**
 * Free Data Endpoint - No payment required
 */

export default defineEventHandler(async (event) => {
  return {
    data: 'This is free content available to everyone',
    price: 0,
    access: 'public',
  }
})

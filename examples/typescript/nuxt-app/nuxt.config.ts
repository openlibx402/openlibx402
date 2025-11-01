// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  modules: ['@nuxtjs/tailwindcss'],
  
  css: ['~/assets/css/main.css'],
  
  app: {
    head: {
      title: 'X402 Nuxt.js Demo',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Demonstration of X402 payment protocol in Nuxt.js' }
      ]
    }
  },
  
  runtimeConfig: {
    // Server-side environment variables
    paymentWalletAddress: process.env.PAYMENT_WALLET_ADDRESS || 'DEMO_WALLET_ADDRESS',
    usdcMintAddress: process.env.USDC_MINT_ADDRESS || 'DEMO_USDC_MINT',
    solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    
    // Public environment variables (exposed to client)
    public: {
      solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      network: 'solana-devnet'
    }
  }
})

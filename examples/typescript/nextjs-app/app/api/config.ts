/**
 * X402 Configuration for Next.js API Routes
 */

import { X402Config, initX402 } from "@openlibx402/nextjs";

// Initialize X402 configuration
const config = new X402Config({
  paymentAddress: process.env.PAYMENT_WALLET_ADDRESS || "DEMO_WALLET_ADDRESS",
  tokenMint: process.env.USDC_MINT_ADDRESS || "DEMO_USDC_MINT",
  network: "solana-devnet",
  rpcUrl: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  // Disable on-chain verification for demo purposes
  // In production, keep autoVerify: true to verify payments on-chain
  autoVerify: process.env.NODE_ENV === "production",
});

initX402(config);

export { config };

/**
 * Privy X402 Client Demo
 *
 * NOTE: Due to Next.js webpack bundling issues with @privy-io/server-auth's
 * dynamic requires, this is a demonstration of how to use the Privy SDK.
 *
 * For production use, consider:
 * 1. Using Next.js API routes with serverless functions (edge runtime doesn't support all Node APIs)
 * 2. Running a separate Express/Node server that handles Privy operations
 * 3. Using next.config.js serverComponentsExternalPackages to exclude Privy
 * 4. Or use a custom Next.js server (next dev with custom server)
 */

import { PrivyX402Client, PrivyX402Config } from "@openlibx402/privy";

/**
 * This function demonstrates how you would initialize the Privy client
 * in a Node.js environment (Express, standalone script, etc.)
 */
export async function createPrivyClient(): Promise<PrivyX402Client> {
  // Validate environment variables
  const { PRIVY_APP_ID, PRIVY_APP_SECRET, PRIVY_WALLET_ID } = process.env;

  if (!PRIVY_APP_ID || !PRIVY_APP_SECRET || !PRIVY_WALLET_ID) {
    throw new Error(
      "Missing required Privy environment variables. Please set PRIVY_APP_ID, PRIVY_APP_SECRET, and PRIVY_WALLET_ID."
    );
  }

  // Create configuration
  const config = new PrivyX402Config({
    appId: PRIVY_APP_ID,
    appSecret: PRIVY_APP_SECRET,
    walletId: PRIVY_WALLET_ID,
    network: process.env.X402_NETWORK || "solana-devnet",
    rpcUrl: process.env.X402_RPC_URL,
    maxPaymentAmount: process.env.X402_MAX_PAYMENT || "10.0",
  });

  // Create and initialize client
  const client = new PrivyX402Client(config);
  await client.initialize();

  return client;
}

/**
 * Example usage in a standalone Node.js script or Express server:
 *
 * ```typescript
 * import { createPrivyClient } from './privy-client-demo';
 *
 * async function main() {
 *   const client = await createPrivyClient();
 *
 *   // Make a paid request
 *   const response = await client.get('https://api.example.com/premium-data');
 *   console.log(response.data);
 *
 *   await client.close();
 * }
 *
 * main().catch(console.error);
 * ```
 */

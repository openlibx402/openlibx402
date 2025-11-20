/**
 * Privy X402 Client Singleton
 *
 * This module provides a singleton instance of the PrivyX402Client
 * that can be reused across API routes.
 */

import { PrivyX402Client, PrivyX402Config } from "@openlibx402/privy";

let privyClient: PrivyX402Client | null = null;

/**
 * Get or create the Privy X402 client
 */
export async function getPrivyClient(): Promise<PrivyX402Client> {
  if (privyClient) {
    return privyClient;
  }

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
  privyClient = new PrivyX402Client(config);
  await privyClient.initialize();

  console.log(`Privy client initialized with wallet: ${privyClient.getWalletAddress()}`);

  return privyClient;
}

/**
 * Close the Privy client (for cleanup)
 */
export async function closePrivyClient(): Promise<void> {
  if (privyClient) {
    await privyClient.close();
    privyClient = null;
  }
}

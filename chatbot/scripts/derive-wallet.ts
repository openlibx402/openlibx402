/**
 * Load wallet public key from environment
 */

import { load } from 'dotenv';

// Load .env file
await load({ export: true, envPath: "../.env" });

// Read public key directly from environment
const publicKey = Deno.env.get("X402_WALLET_ADDRESS");

if (!publicKey) {
  console.error("Error: X402_WALLET_ADDRESS not found in environment");
  Deno.exit(1);
}

console.log("Wallet Public Key (X402_WALLET_ADDRESS):");
console.log(publicKey);

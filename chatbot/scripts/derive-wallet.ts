/**
 * Derive public key from secret key for X402 wallet
 */

import { load } from 'https://deno.land/std@0.224.0/dotenv/mod.ts';
import { Keypair } from 'npm:@solana/web3.js@^1.87.6';

// Load .env file
await load({ export: true, envPath: '../.env' });

// Read secret key from environment
const secretKeyStr = Deno.env.get('X402_WALLET_SECRET_KEY');

if (!secretKeyStr) {
  console.error('Error: X402_WALLET_SECRET_KEY not found in environment');
  Deno.exit(1);
}

try {
  // Parse secret key array
  const secretKey = JSON.parse(secretKeyStr);

  // Create keypair from secret key
  const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));

  // Get public key
  const publicKey = keypair.publicKey.toString();

  console.log('Wallet Public Key (X402_WALLET_ADDRESS):');
  console.log(publicKey);
  console.log('\nAdd this to your .env file:');
  console.log(`X402_WALLET_ADDRESS=${publicKey}`);

} catch (error) {
  console.error('Error deriving wallet:', error);
  Deno.exit(1);
}

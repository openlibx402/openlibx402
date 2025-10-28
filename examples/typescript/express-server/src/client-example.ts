/**
 * Example X402 Client Application
 *
 * Demonstrates how to use the X402AutoClient to access paid API endpoints.
 */

import { Keypair } from "@solana/web3.js";
import { X402AutoClient, X402Client } from "@openlibx402/client";
import * as fs from "fs";
import * as path from "path";

// Example 1: Using X402AutoClient (Automatic Payment Handling)
async function exampleAutoClient() {
  console.log("\n=== Example 1: Auto Client (Automatic Payments) ===\n");

  // Load wallet keypair (in production, load from secure storage)
  // For this example, you would need to create a keypair
  // const keypair = Keypair.fromSecretKey(
  //   Uint8Array.from(JSON.parse(fs.readFileSync('wallet.json', 'utf-8')))
  // );

  // For demo purposes, generate a random keypair
  const keypair = Keypair.generate();
  console.log("Wallet Address:", keypair.publicKey.toString());

  // Create auto client
  const client = new X402AutoClient(keypair, "https://api.devnet.solana.com", {
    maxPaymentAmount: "5.0", // Safety limit
  });

  try {
    // Access free endpoint (no payment required)
    console.log("Fetching free data...");
    const freeResponse = await client.get("http://localhost:3000/free-data");
    console.log("Free data:", freeResponse.data);

    // Access premium endpoint (payment required)
    // Note: This will fail without real funds in the wallet
    console.log("\nFetching premium data (requires payment)...");
    try {
      const premiumResponse = await client.get(
        "http://localhost:3000/premium-data"
      );
      console.log("Premium data:", premiumResponse.data);
    } catch (error) {
      console.log(
        "Payment failed (expected without funds):",
        (error as Error).message
      );
    }
  } finally {
    await client.close();
  }
}

// Example 2: Using X402Client (Manual Payment Control)
async function exampleManualClient() {
  console.log(
    "\n=== Example 2: Manual Client (Explicit Payment Control) ===\n"
  );

  const keypair = Keypair.generate();
  console.log("Wallet Address:", keypair.publicKey.toString());

  const client = new X402Client(keypair, "https://api.devnet.solana.com");

  try {
    // Initial request
    console.log("Making initial request to premium endpoint...");
    let response = await client.get("http://localhost:3000/premium-data");

    // Check if payment is required
    if (client.paymentRequired(response)) {
      console.log("Payment required!");

      // Parse payment request
      const paymentRequest = client.parsePaymentRequest(response);
      console.log("Payment details:");
      console.log("  Amount:", paymentRequest.maxAmountRequired, "USDC");
      console.log("  Recipient:", paymentRequest.paymentAddress);
      console.log("  Expires:", paymentRequest.expiresAt);

      try {
        // Create payment
        console.log("\nCreating payment...");
        const authorization = await client.createPayment(paymentRequest);
        console.log("Payment created:", authorization.transactionHash);

        // Retry with payment
        console.log("Retrying request with payment...");
        response = await client.get("http://localhost:3000/premium-data", {
          payment: authorization,
        });
        console.log("Success! Response:", response.data);
      } catch (error) {
        console.log(
          "Payment failed (expected without funds):",
          (error as Error).message
        );
      }
    } else {
      console.log("No payment required");
      console.log("Response:", response.data);
    }
  } finally {
    await client.close();
  }
}

// Example 3: Accessing Different Endpoints
async function exampleMultipleEndpoints() {
  console.log("\n=== Example 3: Multiple Endpoints ===\n");

  const keypair = Keypair.generate();
  const client = new X402AutoClient(keypair, "https://api.devnet.solana.com");

  try {
    // Root endpoint
    const root = await client.get("http://localhost:3000/");
    console.log("API Info:", root.data);

    // Free endpoint
    const free = await client.get("http://localhost:3000/free-data");
    console.log("\nFree Data:", free.data);

    // Tiered endpoint
    try {
      const tiered = await client.get(
        "http://localhost:3000/tiered-data/premium"
      );
      console.log("\nTiered Data:", tiered.data);
    } catch (error) {
      console.log(
        "\nTiered endpoint (payment required):",
        (error as Error).message
      );
    }
  } finally {
    await client.close();
  }
}

// Main execution
async function main() {
  console.log("X402 Client Examples");
  console.log("=".repeat(60));
  console.log(
    "Make sure the Express server is running on http://localhost:3000"
  );
  console.log("=".repeat(60));

  try {
    await exampleAutoClient();
    await exampleManualClient();
    await exampleMultipleEndpoints();

    console.log("\n" + "=".repeat(60));
    console.log("Examples completed!");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

/**
 * Example LangGraph.js Workflow with X402 Payment Support
 *
 * This example demonstrates how to use payment nodes from @openlibx402/langgraph
 * for accessing paid APIs in workflows.
 *
 * Note: This is a simplified example showing the payment node functionality.
 * For production workflows, integrate these nodes into your LangGraph StateGraph.
 */

import {
  PaymentState,
  fetchWithPaymentNode,
  paymentNode,
} from "@openlibx402/langgraph";
import { X402AutoClient } from "@openlibx402/client";
import { Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

function loadWalletKeypair(walletPath: string = "wallet.json"): Keypair {
  /**
   * Load wallet keypair from JSON file
   */
  if (!fs.existsSync(walletPath)) {
    console.log(`\n⚠️  Wallet file not found at ${walletPath}`);
    console.log("Creating a new wallet...");

    const keypair = Keypair.generate();

    // Save wallet
    const walletData = Array.from(keypair.secretKey);
    fs.writeFileSync(walletPath, JSON.stringify(walletData));

    console.log(`✅ New wallet created and saved to ${walletPath}`);
    console.log(`📍 Wallet address: ${keypair.publicKey.toString()}`);

    return keypair;
  }

  // Load existing wallet
  const walletData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(new Uint8Array(walletData));

  console.log(`✅ Wallet loaded from ${walletPath}`);
  console.log(`📍 Wallet address: ${keypair.publicKey.toString()}`);

  return keypair;
}

async function example1SimpleFetchWithPayment() {
  /**
   * Example 1: Using fetchWithPaymentNode directly
   *
   * This is the simplest way to access a paid API - the node handles
   * everything including payment if required.
   */
  console.log("\n" + "=".repeat(60));
  console.log("📝 Example 1: Simple Fetch with Payment");
  console.log("=".repeat(60));

  // Load wallet
  const keypair = loadWalletKeypair();

  // Create state
  const state: PaymentState = {
    wallet_keypair: keypair,
    api_url: "http://localhost:3000/premium-data",
    max_payment_amount: "1.0",
  };

  console.log("\n🔄 Fetching API with automatic payment handling...");
  console.log(`   URL: ${state.api_url}`);

  try {
    // Call the payment node directly
    const result = await fetchWithPaymentNode(state);

    console.log(`\n✅ Fetch completed!`);
    console.log(`   Payment completed: ${result.payment_completed || false}`);

    if (result.payment_error) {
      console.log(`   Payment error: ${result.payment_error}`);
    }

    if (result.api_response) {
      const preview = result.api_response.substring(0, 150);
      console.log(`   Response preview: ${preview}...`);
    }
  } catch (error) {
    console.log(`\n❌ Error: ${error}`);
  }
}

async function example2ManualPaymentFlow() {
  /**
   * Example 2: Manual payment flow with paymentNode
   *
   * This shows how to use the payment node when you've already detected
   * a 402 response and want to handle payment separately.
   */
  console.log("\n" + "=".repeat(60));
  console.log("📝 Example 2: Manual Payment Flow");
  console.log("=".repeat(60));

  // Load wallet
  const keypair = loadWalletKeypair();

  console.log("\n🌐 Step 1: Attempting API fetch without payment...");

  // Try to fetch without payment first
  const client = new X402AutoClient(keypair, undefined, {
    autoRetry: false, // Don't auto-pay
  });

  const apiUrl = "http://localhost:3000/premium-data";

  try {
    const response = await client.get(apiUrl);
    await client.close();

    console.log("✅ API accessible without payment!");
    console.log(
      `   Response: ${JSON.stringify(response.data).substring(0, 100)}...`
    );
  } catch (error: any) {
    await client.close();

    if (
      error.response?.status === 402 ||
      error.message?.includes("402") ||
      error.message?.includes("Payment is required")
    ) {
      console.log("\n❌ Error: Payment is required to access this resource");
      console.log("💳 Payment required detected!");
      console.log("\n🔄 Step 2: Using payment node to make payment...");

      // Use payment node
      const state: PaymentState = {
        wallet_keypair: keypair,
        api_url: apiUrl,
        payment_required: true,
      };

      try {
        const result = await paymentNode(state);

        console.log(`\n✅ Payment node completed!`);
        console.log(
          `   Payment completed: ${result.payment_completed || false}`
        );

        if (result.payment_error) {
          console.log(`   Payment error: ${result.payment_error}`);
        }

        if (result.api_response) {
          const preview = result.api_response.substring(0, 150);
          console.log(`   Response: ${preview}...`);
        }
      } catch (paymentError) {
        console.log(`\n❌ Payment error: ${paymentError}`);
      }
    } else {
      console.log(`\n❌ Error: ${error.message}`);
    }
  }
}

async function example3MultipleAPIs() {
  /**
   * Example 3: Accessing multiple paid APIs
   *
   * This demonstrates using the payment nodes to access multiple
   * paid APIs in sequence.
   */
  console.log("\n" + "=".repeat(60));
  console.log("📝 Example 3: Multiple APIs with Payments");
  console.log("=".repeat(60));

  // Load wallet
  const keypair = loadWalletKeypair();

  const apis = [
    "http://localhost:3000/premium-data",
    "http://localhost:3000/tiered-data/premium",
  ];

  console.log(`\n🔄 Accessing ${apis.length} APIs sequentially...`);

  const results: Array<{ api: string; success: boolean; preview?: string }> =
    [];

  for (let i = 0; i < apis.length; i++) {
    const api = apis[i];
    console.log(`\n   [${i + 1}/${apis.length}] Fetching: ${api}`);

    const state: PaymentState = {
      wallet_keypair: keypair,
      api_url: api,
      max_payment_amount: "5.0",
    };

    try {
      const result = await fetchWithPaymentNode(state);

      if (result.api_response) {
        const preview = result.api_response.substring(0, 100);
        results.push({ api, success: true, preview });
        console.log(`   ✅ Success! Preview: ${preview}...`);
      } else {
        results.push({ api, success: false });
        console.log(`   ⚠️  No response received`);
      }
    } catch (error) {
      results.push({ api, success: false });
      console.log(`   ❌ Error: ${error}`);
    }
  }

  console.log(`\n✅ All APIs processed!`);
  console.log(
    `   Successful: ${results.filter((r) => r.success).length}/${results.length}`
  );

  results.forEach((result, i) => {
    const status = result.success ? "✅" : "❌";
    console.log(`   ${status} ${i + 1}. ${result.api}`);
  });
}

async function example4CustomBehavior() {
  /**
   * Example 4: Custom payment behavior
   *
   * Shows how to customize payment handling with different settings.
   */
  console.log("\n" + "=".repeat(60));
  console.log("📝 Example 4: Custom Payment Behavior");
  console.log("=".repeat(60));

  // Load wallet
  const keypair = loadWalletKeypair();

  // Custom state with specific payment limit
  const state: PaymentState = {
    wallet_keypair: keypair,
    api_url: "http://localhost:3000/expensive-data",
    max_payment_amount: "2.0", // Higher limit for expensive endpoint
  };

  console.log("\n🔄 Accessing expensive endpoint...");
  console.log(`   URL: ${state.api_url}`);
  console.log(`   Max payment: ${state.max_payment_amount} USDC`);

  try {
    const result = await fetchWithPaymentNode(state);

    console.log(`\n✅ Fetch completed!`);
    console.log(`   Payment completed: ${result.payment_completed || false}`);

    if (result.payment_error) {
      console.log(`   Payment error: ${result.payment_error}`);
    }

    if (result.api_response) {
      const preview = result.api_response.substring(0, 150);
      console.log(`   Response preview: ${preview}...`);
    }
  } catch (error) {
    console.log(`\n❌ Error: ${error}`);
  }
}

async function main() {
  /**
   * Run all examples
   */
  console.log("\n" + "=".repeat(70));
  console.log("🚀 OpenLibX402 LangGraph.js Payment Node Examples");
  console.log("=".repeat(70));
  console.log("\nThese examples demonstrate how to use payment nodes from");
  console.log("@openlibx402/langgraph for accessing paid APIs.");
  console.log("\n⚠️  Prerequisites:");
  console.log("   1. Express.js server running (see express-server example)");
  console.log("   2. Wallet funded with SOL and USDC on Solana devnet");
  console.log(
    "\n💡 Note: If you see payment errors, make sure your wallet is funded:"
  );
  console.log(
    "   - SOL for transaction fees: solana airdrop 1 <ADDRESS> --url devnet"
  );
  console.log("   - USDC for payments (you'll need devnet USDC tokens)");
  console.log("\n💡 These examples show the payment nodes in isolation.");
  console.log(
    "   In production, integrate them into your LangGraph StateGraph workflows."
  );
  console.log("=".repeat(70));

  // Run examples
  try {
    await example1SimpleFetchWithPayment();

    console.log("\n\nPress Enter to continue to Example 2...");
    await new Promise((resolve) => {
      process.stdin.once("data", () => resolve(null));
    });

    await example2ManualPaymentFlow();

    console.log("\n\nPress Enter to continue to Example 3...");
    await new Promise((resolve) => {
      process.stdin.once("data", () => resolve(null));
    });

    await example3MultipleAPIs();

    console.log("\n\nPress Enter to continue to Example 4...");
    await new Promise((resolve) => {
      process.stdin.once("data", () => resolve(null));
    });

    await example4CustomBehavior();
  } catch (error) {
    if (error instanceof Error && error.message === "interrupted") {
      console.log("\n\n👋 Examples interrupted by user");
    } else {
      console.log(`\n\n❌ Unexpected error: ${error}`);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("✅ Examples completed!");
  console.log("=".repeat(70) + "\n");
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

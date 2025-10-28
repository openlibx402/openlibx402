/**
 * Example LangChain.js Agent with X402 Payment Support
 *
 * This example demonstrates how to create an AI agent that can autonomously
 * pay for API access using the X402 protocol.
 */

import { createX402PaymentTool } from "@openlibx402/langchain";
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
    console.log(
      "\n⚠️  Important: Fund this wallet with SOL and USDC on devnet!"
    );
    console.log(
      `   Run: solana airdrop 1 ${keypair.publicKey.toString()} --url devnet`
    );

    return keypair;
  }

  // Load existing wallet
  const walletData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(new Uint8Array(walletData));

  console.log(`✅ Wallet loaded from ${walletPath}`);
  console.log(`📍 Wallet address: ${keypair.publicKey.toString()}`);

  return keypair;
}

async function example1SimpleTool() {
  /**
   * Example 1: Simple X402 payment tool usage
   *
   * This shows how to use the X402 payment tool to access paid APIs.
   * In a full agent, this tool would be used autonomously by an LLM.
   */
  console.log("\n" + "=".repeat(60));
  console.log("📝 Example 1: Simple X402 Payment Tool");
  console.log("=".repeat(60));

  // Load wallet
  const keypair = loadWalletKeypair();

  // Create X402 payment tool
  const paymentTool = createX402PaymentTool({
    walletKeypair: keypair,
    maxPayment: "5.0",
    name: "x402_payment",
    description: "Make an X402 payment to access a paid API endpoint.",
  });

  // Use the tool directly
  console.log("\n🔄 Using payment tool to access API...");
  console.log("   URL: http://localhost:3000/premium-data");

  try {
    const result = await paymentTool.invoke({
      url: "http://localhost:3000/premium-data",
      method: "GET",
    });

    console.log(`\n✅ Success!`);
    const preview = result.substring(0, 150);
    console.log(`   Response: ${preview}...`);
  } catch (error) {
    console.log(`\n❌ Error: ${error}`);
    console.log(
      "   Make sure the Express.js server is running (see express-server example)"
    );
  }
}

async function example2MultipleAPIs() {
  /**
   * Example 2: Accessing multiple paid APIs
   *
   * This demonstrates making multiple payments to different APIs.
   */
  console.log("\n" + "=".repeat(60));
  console.log("📝 Example 2: Multiple API Access");
  console.log("=".repeat(60));

  // Load wallet
  const keypair = loadWalletKeypair();

  // Create X402 payment tool with higher limit
  const paymentTool = createX402PaymentTool({
    walletKeypair: keypair,
    maxPayment: "10.0", // Higher limit for multiple payments
    name: "pay_for_api",
    description: "Make payment to access premium API data",
  });

  const apis = [
    "http://localhost:3000/premium-data",
    "http://localhost:3000/tiered-data/premium",
  ];

  console.log(`\n🔄 Accessing ${apis.length} APIs...`);

  for (let i = 0; i < apis.length; i++) {
    const api = apis[i];
    console.log(`\n   [${i + 1}/${apis.length}] ${api}`);

    try {
      const result = await paymentTool.invoke({
        url: api,
        method: "GET",
      });

      const preview = result.substring(0, 100);
      console.log(`   ✅ Success: ${preview}...`);
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
  }

  console.log(`\n✅ All APIs processed!`);
}

async function example3CustomBehavior() {
  /**
   * Example 3: Custom payment behavior
   *
   * This shows how to customize the payment tool with specific settings.
   */
  console.log("\n" + "=".repeat(60));
  console.log("📝 Example 3: Custom Payment Behavior");
  console.log("=".repeat(60));

  // Load wallet
  const keypair = loadWalletKeypair();

  // Create payment tool with custom settings
  const paymentTool = createX402PaymentTool({
    walletKeypair: keypair,
    rpcUrl: "https://api.devnet.solana.com",
    maxPayment: "2.0",
    name: "fetch_paid_data",
    description:
      "Fetch data from a paid API endpoint by making an X402 payment.",
  });

  console.log("\n🔄 Accessing expensive endpoint...");
  console.log("   URL: http://localhost:3000/expensive-data");
  console.log("   Max payment: 2.0 USDC");

  try {
    const result = await paymentTool.invoke({
      url: "http://localhost:3000/expensive-data",
      method: "GET",
    });

    console.log(`\n✅ Success!`);
    const preview = result.substring(0, 150);
    console.log(`   Response: ${preview}...`);
  } catch (error) {
    console.log(`\n❌ Error: ${error}`);
  }
}

async function main() {
  /**
   * Run all examples
   */
  console.log("\n" + "=".repeat(70));
  console.log("🚀 OpenLibx402 LangChain.js Payment Tool Examples");
  console.log("=".repeat(70));
  console.log(
    "\nThese examples demonstrate the X402 payment tool for LangChain.js."
  );
  console.log(
    "This tool can be integrated with LangChain agents to enable autonomous"
  );
  console.log("payment for API access.");
  console.log("\n⚠️  Prerequisites:");
  console.log("   1. Express.js server running (see express-server example)");
  console.log("   2. Wallet funded with SOL and USDC on Solana devnet");
  console.log("\n💡 Note: These examples show direct tool usage.");
  console.log(
    "   In production, integrate this tool with LangChain agents for"
  );
  console.log("   autonomous AI payment capabilities.");
  console.log("=".repeat(70));

  // Run examples
  try {
    await example1SimpleTool();

    // Wait for user input
    console.log("\n\nPress Enter to continue to Example 2...");
    await new Promise((resolve) => {
      process.stdin.once("data", () => resolve(null));
    });

    await example2MultipleAPIs();

    console.log("\n\nPress Enter to continue to Example 3...");
    await new Promise((resolve) => {
      process.stdin.once("data", () => resolve(null));
    });

    await example3CustomBehavior();
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

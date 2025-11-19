import { PrivyX402Client, PrivyX402Config } from "@openlibx402/privy";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("=".repeat(60));
  console.log("Privy + x402 Agentic Payments Example");
  console.log("=".repeat(60));

  // Validate environment variables
  const { PRIVY_APP_ID, PRIVY_APP_SECRET, PRIVY_WALLET_ID } = process.env;

  if (!PRIVY_APP_ID || !PRIVY_APP_SECRET || !PRIVY_WALLET_ID) {
    console.error("Error: Missing required environment variables.");
    console.error(
      "Please copy .env.example to .env and fill in your Privy credentials."
    );
    process.exit(1);
  }

  // Create Privy x402 client configuration
  const config = new PrivyX402Config({
    appId: PRIVY_APP_ID,
    appSecret: PRIVY_APP_SECRET,
    walletId: PRIVY_WALLET_ID,
    network: process.env.X402_NETWORK || "solana-devnet",
    rpcUrl: process.env.X402_RPC_URL,
    maxPaymentAmount: process.env.X402_MAX_PAYMENT || "5.0",
  });

  const client = new PrivyX402Client(config);

  try {
    // Initialize (fetches wallet details from Privy)
    console.log("\nInitializing Privy client...");
    await client.initialize();
    console.log(`Wallet address: ${client.getWalletAddress()}`);

    // Check balances
    const solBalance = await client.getSolBalance();
    console.log(`SOL Balance: ${solBalance.toFixed(4)} SOL`);

    // Example: Make a paid API request
    // Replace this URL with an actual x402-enabled endpoint
    const apiUrl = process.env.API_URL || "http://localhost:8000/premium-data";

    console.log(`\nAccessing paid API endpoint: ${apiUrl}`);

    try {
      const response = await client.get(apiUrl);
      console.log("\nResponse status:", response.status);
      console.log("Response data:", JSON.stringify(response.data, null, 2));
    } catch (error) {
      if (error instanceof Error) {
        console.log("\nAPI request failed:", error.message);
        console.log("(This is expected if no x402 server is running)");
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("\nClient closed.");
  }
}

main().catch(console.error);

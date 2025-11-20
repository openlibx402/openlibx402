/**
 * Express Server with Privy X402 Integration
 *
 * This server provides API endpoints that use the Privy SDK to make
 * automatic X402 payments. The Next.js frontend calls these endpoints.
 */

import express, { Request, Response } from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { PrivyX402Client, PrivyX402Config } from "@openlibx402/privy";

dotenv.config({ path: "../.env" }); // Load from parent directory

const app = express();
const PORT = process.env.SERVER_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Privy client singleton
let privyClient: PrivyX402Client | null = null;

async function getPrivyClient(): Promise<PrivyX402Client> {
  if (privyClient) {
    return privyClient;
  }

  const { PRIVY_APP_ID, PRIVY_APP_SECRET, PRIVY_WALLET_ID } = process.env;

  if (!PRIVY_APP_ID || !PRIVY_APP_SECRET || !PRIVY_WALLET_ID) {
    throw new Error(
      "Missing Privy credentials. Set PRIVY_APP_ID, PRIVY_APP_SECRET, and PRIVY_WALLET_ID"
    );
  }

  const config = new PrivyX402Config({
    appId: PRIVY_APP_ID,
    appSecret: PRIVY_APP_SECRET,
    walletId: PRIVY_WALLET_ID,
    network: process.env.X402_NETWORK || "solana-devnet",
    rpcUrl: process.env.X402_RPC_URL,
    maxPaymentAmount: process.env.X402_MAX_PAYMENT || "10.0",
  });

  privyClient = new PrivyX402Client(config);
  await privyClient.initialize();

  console.log(`Privy client initialized: ${privyClient.getWalletAddress()}`);

  return privyClient;
}

// Routes

/**
 * GET /api/wallet
 * Returns Privy wallet information
 */
app.get("/api/wallet", async (req: Request, res: Response) => {
  try {
    const client = await getPrivyClient();

    const walletAddress = client.getWalletAddress();
    const solBalance = await client.getSolBalance();

    res.json({
      success: true,
      wallet: {
        address: walletAddress,
        network: process.env.X402_NETWORK || "solana-devnet",
        balances: {
          sol: solBalance,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching wallet info:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/paid/data
 * Makes a paid request to an X402-protected endpoint
 */
app.get("/api/paid/data", async (req: Request, res: Response) => {
  try {
    const targetUrl =
      (req.query.url as string) ||
      process.env.X402_API_URL ||
      "http://localhost:8000/premium-data";

    console.log(`Making paid request to: ${targetUrl}`);

    const client = await getPrivyClient();
    const response = await client.get(targetUrl);

    res.json({
      success: true,
      message: "Successfully accessed paid endpoint",
      data: response.data,
      status: response.status,
    });
  } catch (error) {
    console.error("Error accessing paid endpoint:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isPaymentError =
      errorMessage.includes("402") ||
      errorMessage.includes("payment") ||
      errorMessage.includes("insufficient");

    res.status(isPaymentError ? 402 : 500).json({
      success: false,
      error: errorMessage,
      type: isPaymentError ? "payment_error" : "request_error",
      help: isPaymentError
        ? "Make sure your Privy wallet has sufficient funds"
        : "Check that the target API is running and accessible",
    });
  }
});

/**
 * POST /api/paid/data
 * Makes a paid POST request to an X402-protected endpoint
 */
app.post("/api/paid/data", async (req: Request, res: Response) => {
  try {
    const { url, data } = req.body;
    const targetUrl = url || process.env.X402_API_URL || "http://localhost:8000/process-data";

    console.log(`Making paid POST request to: ${targetUrl}`);

    const client = await getPrivyClient();
    const response = await client.post(targetUrl, data || {});

    res.json({
      success: true,
      message: "Successfully accessed paid endpoint",
      data: response.data,
      status: response.status,
    });
  } catch (error) {
    console.error("Error accessing paid endpoint:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isPaymentError =
      errorMessage.includes("402") ||
      errorMessage.includes("payment") ||
      errorMessage.includes("insufficient");

    res.status(isPaymentError ? 402 : 500).json({
      success: false,
      error: errorMessage,
      type: isPaymentError ? "payment_error" : "request_error",
    });
  }
});

/**
 * GET /api
 * API documentation
 */
app.get("/api", (req: Request, res: Response) => {
  res.json({
    name: "Privy X402 Server",
    version: "1.0.0",
    description: "Express server with Privy wallet integration for X402 payments",
    endpoints: [
      {
        path: "/api/wallet",
        method: "GET",
        description: "Get Privy server wallet information",
      },
      {
        path: "/api/paid/data",
        method: "GET",
        description: "Make a paid GET request",
        query: { url: "Target URL (optional)" },
      },
      {
        path: "/api/paid/data",
        method: "POST",
        description: "Make a paid POST request",
        body: { url: "Target URL (optional)", data: "Request data" },
      },
    ],
  });
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log(`Privy X402 Server running on http://localhost:${PORT}`);
  console.log("=".repeat(60));
  console.log("\nEndpoints:");
  console.log(`  GET  http://localhost:${PORT}/api/wallet`);
  console.log(`  GET  http://localhost:${PORT}/api/paid/data`);
  console.log(`  POST http://localhost:${PORT}/api/paid/data`);
  console.log("\nPress Ctrl+C to stop");
});

// Cleanup on shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  if (privyClient) {
    await privyClient.close();
  }
  process.exit(0);
});

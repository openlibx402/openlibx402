/**
 * Example Express.js Server with X402 Payment Support
 *
 * This example demonstrates how to add payment requirements to API endpoints.
 */

import express, { Request, Response } from "express";
import dotenv from "dotenv";
import {
  X402Config,
  initX402,
  paymentRequired,
  X402Request,
} from "@openlibx402/express";

dotenv.config();

// Initialize X402 configuration
const config = new X402Config({
  paymentAddress: process.env.PAYMENT_WALLET_ADDRESS || "DEMO_WALLET_ADDRESS",
  tokenMint: process.env.USDC_MINT_ADDRESS || "DEMO_USDC_MINT",
  network: "solana-devnet",
  rpcUrl: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
});

initX402(config);

const app = express();
app.use(express.json());

// Root endpoint - public (no payment required)
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to X402 Demo API (Express.js)",
    documentation: "/docs",
    free_endpoint: "/free-data",
    paid_endpoints: ["/premium-data", "/expensive-data", "/tiered-data/:tier"],
  });
});

// Free data endpoint - no payment required
app.get("/free-data", (req: Request, res: Response) => {
  res.json({
    data: "This is free content available to everyone",
    price: 0,
    access: "public",
  });
});

// Premium data endpoint - requires 0.10 USDC payment
app.get(
  "/premium-data",
  paymentRequired({
    amount: "0.10",
    description: "Access to premium market data",
  }),
  (req: Request, res: Response) => {
    res.json({
      data: "This is premium content",
      market_data: {
        price: 100.5,
        volume: 1_000_000,
        timestamp: "2025-01-01T10:00:00Z",
      },
      price_paid: "0.10",
      access: "premium",
    });
  }
);

// Expensive endpoint - requires 1.00 USDC payment
// This also demonstrates accessing payment details
app.get(
  "/expensive-data",
  paymentRequired({
    amount: "1.00",
    description: "Access to expensive AI model inference",
  }),
  (req: X402Request, res: Response) => {
    const payment = req.payment;

    res.json({
      data: "This is very expensive AI-generated content",
      model: "gpt-5-turbo",
      result: "The meaning of life is 42, according to our advanced AI",
      payment_id: payment?.paymentId,
      amount_paid: payment?.actualAmount,
      transaction_hash: payment?.transactionHash,
      access: "premium-plus",
    });
  }
);

// Tiered endpoint with path parameter - requires 0.05 USDC payment
app.get(
  "/tiered-data/:tier",
  paymentRequired({
    amount: "0.05",
    description: "Tiered data access",
  }),
  (req: Request, res: Response) => {
    const { tier } = req.params;

    const tierData: Record<string, any> = {
      basic: { quality: "720p", ads: true },
      standard: { quality: "1080p", ads: false },
      premium: { quality: "4K", ads: false, offline: true },
    };

    res.json({
      tier,
      data: tierData[tier] || tierData.basic,
      price_paid: "0.05",
    });
  }
);

// Dynamic pricing endpoint - demonstrates custom pricing logic
app.post(
  "/process-data",
  paymentRequired({
    amount: "0.25",
    description: "Data processing service",
  }),
  (req: Request, res: Response) => {
    const { data } = req.body;

    res.json({
      status: "processed",
      input_length: data?.length || 0,
      processed_at: new Date().toISOString(),
      result: `Processed: ${data}`,
    });
  }
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 Starting X402 Demo API Server (Express.js)");
  console.log("=".repeat(60));
  console.log(`Payment Address: ${config.paymentAddress}`);
  console.log(`Token Mint: ${config.tokenMint}`);
  console.log(`Network: ${config.network}`);
  console.log("\nEndpoints:");
  console.log("  - GET /              - API information (free)");
  console.log("  - GET /free-data     - Free data (free)");
  console.log("  - GET /premium-data  - Premium data (0.10 USDC)");
  console.log("  - GET /expensive-data - AI inference (1.00 USDC)");
  console.log("  - GET /tiered-data/:tier - Tiered access (0.05 USDC)");
  console.log("  - POST /process-data - Data processing (0.25 USDC)");
  console.log(`\n📖 Server running at: http://localhost:${PORT}`);
  console.log("=".repeat(60) + "\n");
});

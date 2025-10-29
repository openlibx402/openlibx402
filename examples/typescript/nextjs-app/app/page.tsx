"use client";

import { useMemo } from "react";
import { useX402Client } from "./components/X402ClientProvider";
import WalletButton from "./components/WalletButton";
import EndpointCard from "./components/EndpointCard";
import X402EndpointCard from "./components/X402EndpointCard";
import { x402Fetch } from "./utils/x402-fetch";

export default function Home() {
  const { client, walletAddress, isConnected, isReady } = useX402Client();

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  const baseUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    // Ensure we have protocol and host
    const url = new URL(window.location.href);
    return `${url.protocol}//${url.host}`;
  }, []);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">X402 Next.js Demo</h1>
              <p className="text-gray-600">
                Demonstration of X402 payment protocol with Solana wallet
              </p>
            </div>
            <WalletButton />
          </div>

          {!isConnected ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <div className="text-yellow-800 mb-4">
                <svg
                  className="w-12 h-12 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <h2 className="text-xl font-semibold mb-2">
                  Connect Your Wallet
                </h2>
                <p className="text-sm">
                  Please connect your Phantom or Solflare wallet to interact
                  with X402 payment-protected endpoints.
                </p>
              </div>
              <p className="text-xs text-yellow-700 mt-4">
                Don't have a wallet?{" "}
                <a
                  href="https://phantom.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-yellow-900"
                >
                  Install Phantom
                </a>
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm text-green-800 font-medium">
                    Wallet Connected
                  </p>
                  <code className="text-xs text-green-700">
                    {walletAddress}
                  </code>
                </div>
              </div>
              <p className="text-xs text-green-700 mt-2">
                <strong>Note:</strong> Make sure you have USDC tokens on Solana
                Devnet to test payments. Endpoints will work but payments will
                fail without funds.
              </p>
            </div>
          )}
        </div>

        {/* Endpoints Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">API Endpoints</h2>

          {!isConnected && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 text-center">
                Connect your wallet above to try the endpoints
              </p>
            </div>
          )}

          {/* Free Endpoint */}
          <EndpointCard
            title="Free Data"
            description="Public endpoint accessible to everyone without payment"
            endpoint="/api/free-data"
            method="GET"
            price="0"
            onFetch={async () => {
              // For free endpoint, use direct fetch to avoid client issues
              const response = await fetch(`${baseUrl}/api/free-data`);
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              return await response.json();
            }}
          />

          {/* Premium Endpoint */}
          <X402EndpointCard
            title="Premium Data"
            description="Access to premium market data with payment"
            endpoint="/api/premium-data"
            method="GET"
            price="0.10"
            onFetch={async (authHeader) => {
              const headers: Record<string, string> = {};
              if (authHeader) {
                headers["x-payment-authorization"] = authHeader;
              }

              const response = await fetch(`${baseUrl}/api/premium-data`, {
                headers,
              });

              if (response.status === 402) {
                const paymentRequest = await response.json();
                throw new Error(
                  `Payment Required: ${JSON.stringify(paymentRequest)}`
                );
              }

              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }

              return await response.json();
            }}
          />

          {/* Expensive Endpoint */}
          <X402EndpointCard
            title="Expensive AI Inference"
            description="AI model inference with high payment requirement"
            endpoint="/api/expensive-data"
            method="GET"
            price="1.00"
            onFetch={async (authHeader) => {
              const headers: Record<string, string> = {};
              if (authHeader) {
                headers["x-payment-authorization"] = authHeader;
              }

              const response = await fetch(`${baseUrl}/api/expensive-data`, {
                headers,
              });

              if (response.status === 402) {
                const paymentRequest = await response.json();
                throw new Error(
                  `Payment Required: ${JSON.stringify(paymentRequest)}`
                );
              }

              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }

              return await response.json();
            }}
          />

          {/* Tiered Endpoint */}
          <X402EndpointCard
            title="Tiered Content"
            description="Access tiered content with different quality levels"
            endpoint="/api/tiered-data/premium"
            method="GET"
            price="0.05"
            onFetch={async (authHeader) => {
              const headers: Record<string, string> = {};
              if (authHeader) {
                headers["x-payment-authorization"] = authHeader;
              }

              const response = await fetch(`${baseUrl}/api/tiered-data/premium`, {
                headers,
              });

              if (response.status === 402) {
                const paymentRequest = await response.json();
                throw new Error(
                  `Payment Required: ${JSON.stringify(paymentRequest)}`
                );
              }

              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }

              return await response.json();
            }}
          />

          {/* Process Data Endpoint */}
          <X402EndpointCard
            title="Data Processing"
            description="Process data with payment requirement (POST request)"
            endpoint="/api/process-data"
            method="POST"
            price="0.25"
            onFetch={async (authHeader) => {
              const headers: Record<string, string> = {
                "Content-Type": "application/json",
              };
              if (authHeader) {
                headers["x-payment-authorization"] = authHeader;
              }

              const response = await fetch(`${baseUrl}/api/process-data`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                  data: "Hello, X402!",
                }),
              });

              if (response.status === 402) {
                const paymentRequest = await response.json();
                throw new Error(
                  `Payment Required: ${JSON.stringify(paymentRequest)}`
                );
              }

              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }

              return await response.json();
            }}
          />
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-600 text-sm">
            Learn more about{" "}
            <a
              href="https://openlib.xyz"
              className="text-blue-600 hover:underline"
            >
              X402 Protocol
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

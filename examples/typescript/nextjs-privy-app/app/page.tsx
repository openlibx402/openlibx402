"use client";

import WalletDisplay from "./components/WalletDisplay";
import ApiTestCard from "./components/ApiTestCard";

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            X402 + Privy Next.js Demo
          </h1>
          <p className="text-gray-600">
            Server-side wallet management with automatic X402 payment handling
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-blue-900 font-semibold mb-2">
                How This Works
              </h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>
                  • This demo uses Privy to manage a server-side Solana wallet
                </li>
                <li>
                  • API routes automatically handle X402 payments when accessing
                  paid endpoints
                </li>
                <li>
                  • No private keys in your code - signing is delegated to
                  Privy's secure infrastructure
                </li>
                <li>
                  • Perfect for AI agents and backend services that need to make
                  autonomous payments
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Wallet Display */}
        <div className="mb-8">
          <WalletDisplay />
        </div>

        {/* API Endpoints */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Test API Endpoints
          </h2>

          <div className="grid grid-cols-1 gap-6">
            <ApiTestCard
              title="Wallet Information"
              description="Get information about the Privy server wallet including address and balance"
              endpoint="/api/wallet"
              method="GET"
            />

            <ApiTestCard
              title="Paid Data Request"
              description="Make a paid request to an X402-protected endpoint. The server will automatically handle the payment using Privy."
              endpoint="/api/paid/data"
              method="GET"
            />
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-yellow-900 font-semibold mb-2">
              Testing Paid Endpoints
            </h3>
            <div className="text-yellow-800 text-sm space-y-2">
              <p>
                To test the paid endpoints, you'll need an X402-enabled API
                running. You can:
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>
                  Start the example Express server from{" "}
                  <code className="bg-yellow-100 px-1 rounded">
                    examples/typescript/express-server
                  </code>
                </li>
                <li>
                  Set the <code className="bg-yellow-100 px-1 rounded">X402_API_URL</code>{" "}
                  environment variable to point to your API
                </li>
                <li>
                  Ensure your Privy wallet has sufficient SOL (for gas) and USDC
                  (for payments)
                </li>
              </ol>
              <p className="mt-3 text-xs">
                If no X402 API is available, the requests will fail with a
                connection error. This is expected behavior.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-300">
          <div className="text-center text-gray-600 text-sm space-y-2">
            <p>
              Learn more about{" "}
              <a
                href="https://openlib.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                X402 Protocol
              </a>{" "}
              and{" "}
              <a
                href="https://privy.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Privy
              </a>
            </p>
            <p className="text-xs text-gray-500">
              View the source code in{" "}
              <code className="bg-gray-200 px-1 rounded">
                examples/typescript/nextjs-privy-app
              </code>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

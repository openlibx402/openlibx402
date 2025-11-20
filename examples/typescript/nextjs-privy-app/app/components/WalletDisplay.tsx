"use client";

import { useEffect, useState } from "react";

interface WalletInfo {
  address: string;
  network: string;
  balances: {
    sol: number;
  };
}

export default function WalletDisplay() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/wallet");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch wallet info");
      }

      setWallet(data.wallet);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletInfo();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-red-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-red-800 font-semibold mb-1">
              Failed to Load Wallet
            </h3>
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={fetchWalletInfo}
              className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Privy Server Wallet
        </h2>
        <button
          onClick={fetchWalletInfo}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
          <code className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded block overflow-x-auto">
            {wallet.address}
          </code>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Network</p>
          <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
            {wallet.network}
          </span>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">SOL Balance</p>
          <p className="text-lg font-semibold text-gray-900">
            {wallet.balances.sol.toFixed(4)} SOL
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          This wallet is managed by Privy and used for automatic X402 payments.
          No private keys are stored in your application.
        </p>
      </div>
    </div>
  );
}

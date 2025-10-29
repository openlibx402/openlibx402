"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function WalletButton() {
  const { connected, publicKey } = useWallet();

  return (
    <div className="wallet-button-container">
      <WalletMultiButton />
      {connected && publicKey && (
        <div className="mt-2 text-sm text-gray-600">
          Connected: {publicKey.toString().slice(0, 4)}...
          {publicKey.toString().slice(-4)}
        </div>
      )}
    </div>
  );
}

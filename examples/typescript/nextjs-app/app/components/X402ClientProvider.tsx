"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Keypair } from "@solana/web3.js";
import { X402AutoClient } from "@openlibx402/client";

interface X402ClientContextType {
  client: X402AutoClient | null;
  walletAddress: string | null;
  isConnected: boolean;
  isReady: boolean;
}

const X402ClientContext = createContext<X402ClientContextType>({
  client: null,
  walletAddress: null,
  isConnected: false,
  isReady: false,
});

export function X402ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { publicKey, wallet, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [client, setClient] = useState<X402AutoClient | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Clean up previous client
    if (client) {
      client.close();
      setClient(null);
    }

    // If wallet is connected, create a client
    if (publicKey && wallet && signTransaction) {
      try {
        // Create a wallet adapter wrapper for X402Client
        // For now, we'll create a temporary keypair for demo
        // In production, you'd want to integrate wallet adapter's signTransaction

        // TODO: This is a simplified approach - create a demo keypair
        // In a real app, you'd want to use the wallet's signTransaction method
        const demoKeypair = Keypair.generate();

        const rpcUrl = connection.rpcEndpoint;
        const newClient = new X402AutoClient(demoKeypair, rpcUrl, {
          maxPaymentAmount: "5.0",
        });

        setClient(newClient);
        setIsReady(true);
      } catch (error) {
        console.error("Failed to create X402 client:", error);
        setIsReady(false);
      }
    } else {
      setIsReady(true); // Ready but not connected
    }

    return () => {
      if (client) {
        client.close();
      }
    };
  }, [publicKey, wallet, signTransaction, connection]);

  return (
    <X402ClientContext.Provider
      value={{
        client,
        walletAddress: publicKey?.toString() || null,
        isConnected: !!publicKey,
        isReady,
      }}
    >
      {children}
    </X402ClientContext.Provider>
  );
}

export function useX402Client() {
  const context = useContext(X402ClientContext);
  if (!context) {
    throw new Error("useX402Client must be used within X402ClientProvider");
  }
  return context;
}

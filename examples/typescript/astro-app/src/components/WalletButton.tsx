import { useState, useEffect } from 'react';

export default function WalletButton() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window !== 'undefined' && (window as any).phantom?.solana) {
        try {
          const response = await (window as any).phantom.solana.connect({
            onlyIfTrusted: true,
          });
          setWalletAddress(response.publicKey.toString());
          setIsConnected(true);
        } catch (err) {
          // Wallet not connected yet
        }
      }
    };
    checkWallet();
  }, []);

  const connectWallet = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).phantom?.solana) {
        const response = await (window as any).phantom.solana.connect();
        const address = response.publicKey.toString();
        setWalletAddress(address);
        setIsConnected(true);
      } else {
        alert('Please install Phantom wallet from https://phantom.app/');
      }
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).phantom?.solana) {
        await (window as any).phantom.solana.disconnect();
        setWalletAddress(null);
        setIsConnected(false);
      }
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
    }
  };

  return (
    <div>
      {!isConnected ? (
        <button
          onClick={connectWallet}
          disabled={loading}
          className="bg-purple-600 text-white py-2 px-6 rounded hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <div className="text-gray-600">Connected:</div>
            <code className="text-xs bg-gray-200 px-2 py-1 rounded">
              {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-4)}
            </code>
          </div>
          <button
            onClick={disconnectWallet}
            className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors text-sm"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

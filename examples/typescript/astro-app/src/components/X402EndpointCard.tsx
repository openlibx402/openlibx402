import { useState } from 'react';
import type { PaymentRequestData } from '@openlibx402/core';
import { generateMockPaymentAuthorization } from '../utils/mock-payment';
import { createPaymentTransaction, transactionToAuthHeader, getPhantomProvider } from '../utils/real-payment';

interface Props {
  title: string;
  description: string;
  endpoint: string;
  method?: string;
  price: string;
}

export default function X402EndpointCard({
  title,
  description,
  endpoint,
  method = 'GET',
  price,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentRequired, setPaymentRequired] = useState<PaymentRequestData | null>(null);

  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : '';

  const handleFetch = async (authHeader?: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setPaymentRequired(null);

    try {
      const headers: Record<string, string> = {};
      if (authHeader) {
        headers['x-payment-authorization'] = authHeader;
      }

      const fetchOptions: RequestInit = {
        method,
        headers,
      };

      if (method === 'POST') {
        headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify({ data: 'Hello, X402!' });
      }

      const response = await fetch(baseUrl + endpoint, fetchOptions);

      if (response.status === 402) {
        const paymentData = await response.json();
        setPaymentRequired(paymentData);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!paymentRequired) return;

    const mockAuth = generateMockPaymentAuthorization(paymentRequired);
    await handleFetch(mockAuth);
  };

  const handleRealPayment = async () => {
    if (!paymentRequired) return;

    setLoading(true);
    setError(null);

    try {
      const phantomProvider = getPhantomProvider();
      if (!phantomProvider) {
        throw new Error('Phantom wallet not connected. Please connect your wallet first.');
      }

      // Create real payment transaction
      const txResult = await createPaymentTransaction(paymentRequired, phantomProvider);

      // Convert transaction to auth header
      const authHeader = transactionToAuthHeader(txResult);

      // Retry endpoint with real payment
      await handleFetch(authHeader);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Real payment failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-gray-600 mb-2">{description}</p>
          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
            {method} {endpoint}
          </code>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Price</div>
          <div className="text-lg font-bold">
            {price === '0' ? 'FREE' : `${price} USDC`}
          </div>
        </div>
      </div>

      {!paymentRequired && (
        <button
          onClick={() => handleFetch()}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Loading...' : 'Try Endpoint'}
        </button>
      )}

      {paymentRequired && (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <div className="text-sm font-semibold text-yellow-800 mb-2">
              💳 Payment Required
            </div>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>
                <strong>Amount:</strong> {paymentRequired.max_amount_required}{' '}
                {paymentRequired.asset_type}
              </p>
              <p>
                <strong>Recipient:</strong>{' '}
                <code className="text-xs bg-yellow-100 px-1 py-0.5 rounded">
                  {paymentRequired.payment_address.slice(0, 8)}...
                  {paymentRequired.payment_address.slice(-4)}
                </code>
              </p>
              <p>
                <strong>Network:</strong> {paymentRequired.network}
              </p>
              <p>
                <strong>Expires:</strong>{' '}
                {new Date(paymentRequired.expires_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleRealPayment}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {loading ? 'Processing...' : '💰 Pay with Phantom Wallet'}
            </button>
            <button
              onClick={handleSimulatePayment}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : 'Simulate Payment & Retry'}
            </button>
            <button
              onClick={() => {
                setPaymentRequired(null);
                setError(null);
              }}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-700 space-y-2">
            <p className="font-semibold">ℹ️ About X402 Payment Demo:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Payment request generated by server (402 response)</li>
              <li>"Simulate Payment" creates mock authorization</li>
              <li>Request retried with payment authorization header</li>
              <li>Server validates and returns protected content</li>
            </ul>
            <p className="pt-1 border-t border-blue-200 mt-2">
              <strong>Production flow:</strong> Uses Phantom wallet to sign actual
              USDC transfer on Solana
            </p>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <div className="text-sm font-semibold text-green-800 mb-2">
            ✅ Response:
          </div>
          <pre className="text-xs overflow-auto max-h-48">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <div className="text-sm font-semibold text-red-800 mb-2">
            ❌ Error:
          </div>
          <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-48">
            {error}
          </pre>
        </div>
      )}
    </div>
  );
}

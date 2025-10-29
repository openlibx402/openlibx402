"use client";

import { useState } from "react";

interface EndpointCardProps {
  title: string;
  description: string;
  endpoint: string;
  method?: string;
  price: string;
  onFetch: () => Promise<any>;
}

export default function EndpointCard({
  title,
  description,
  endpoint,
  method = "GET",
  price,
  onFetch,
}: EndpointCardProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await onFetch();
      setResult(data);
    } catch (err) {
      console.error("Endpoint error:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : "";
      setError(`${errorMsg}${stack ? `\n\nStack: ${stack}` : ""}`);
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
            {price === "0" ? "FREE" : `${price} USDC`}
          </div>
        </div>
      </div>

      <button
        onClick={handleFetch}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Loading..." : "Try Endpoint"}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <div className="text-sm font-semibold text-green-800 mb-2">
            Response:
          </div>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <div className="text-sm font-semibold text-red-800 mb-2">Error:</div>
          <pre className="text-xs text-red-700">{error}</pre>
        </div>
      )}
    </div>
  );
}

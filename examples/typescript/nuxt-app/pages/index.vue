<template>
  <main class="min-h-screen p-8">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-12">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-4xl font-bold mb-2">X402 Nuxt.js Demo</h1>
            <p class="text-gray-600">
              Demonstration of X402 payment protocol with Solana wallet
            </p>
          </div>
          <WalletButton />
        </div>

        <div v-if="!connected" class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div class="text-yellow-800 mb-4">
            <h2 class="text-xl font-semibold mb-2">
              Connect Your Wallet
            </h2>
            <p class="text-sm">
              Please connect your Phantom or Solflare wallet to interact
              with X402 payment-protected endpoints.
            </p>
          </div>
        </div>

        <div v-else class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-center gap-2">
            <div>
              <p class="text-sm text-green-800 font-medium">
                Wallet Connected
              </p>
              <code class="text-xs text-green-700">
                {{ walletAddress }}
              </code>
            </div>
          </div>
        </div>
      </div>

      <!-- Endpoints Grid -->
      <div class="space-y-6">
        <h2 class="text-2xl font-bold mb-4">API Endpoints</h2>

        <!-- Free Endpoint -->
        <EndpointCard
          title="Free Data"
          description="Public endpoint accessible to everyone without payment"
          endpoint="/api/free-data"
          method="GET"
          price="0"
          :on-fetch="fetchFreeData"
        />

        <!-- Premium Endpoint -->
        <X402EndpointCard
          title="Premium Data"
          description="Access to premium market data with payment"
          endpoint="/api/premium-data"
          method="GET"
          price="0.10"
          :on-fetch="fetchPremiumData"
        />

        <!-- Expensive Endpoint -->
        <X402EndpointCard
          title="Expensive AI Inference"
          description="AI model inference with high payment requirement"
          endpoint="/api/expensive-data"
          method="GET"
          price="1.00"
          :on-fetch="fetchExpensiveData"
        />

        <!-- Tiered Endpoint -->
        <X402EndpointCard
          title="Tiered Content"
          description="Access tiered content with different quality levels"
          endpoint="/api/tiered-data/premium"
          method="GET"
          price="0.05"
          :on-fetch="fetchTieredData"
        />

        <!-- Process Data Endpoint -->
        <X402EndpointCard
          title="Data Processing"
          description="Process data with payment requirement (POST request)"
          endpoint="/api/process-data"
          method="POST"
          price="0.25"
          :on-fetch="fetchProcessData"
        />
      </div>

      <!-- Footer -->
      <div class="mt-12 pt-8 border-t border-gray-200">
        <p class="text-center text-gray-600 text-sm">
          Learn more about
          <a
            href="https://openlib.xyz"
            class="text-blue-600 hover:underline"
          >
            X402 Protocol
          </a>
        </p>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
const { connected, walletAddress } = useWallet()

const createPaymentError = (data: any) => {
  return new Error('Payment Required: ' + JSON.stringify(data))
}

// Fetch functions for each endpoint
const fetchFreeData = async () => {
  const response = await fetch('/api/free-data')
  if (!response.ok) {
    throw new Error('HTTP ' + response.status + ': ' + response.statusText)
  }
  return await response.json()
}

const fetchPremiumData = async (authHeader?: string) => {
  const headers: Record<string, string> = {}
  if (authHeader) {
    headers['x-payment-authorization'] = authHeader
  }

  const response = await fetch('/api/premium-data', { headers })

  if (response.status === 402) {
    const paymentRequest = await response.json()
    throw createPaymentError(paymentRequest)
  }

  if (!response.ok) {
    throw new Error('HTTP ' + response.status + ': ' + response.statusText)
  }

  return await response.json()
}

const fetchExpensiveData = async (authHeader?: string) => {
  const headers: Record<string, string> = {}
  if (authHeader) {
    headers['x-payment-authorization'] = authHeader
  }

  const response = await fetch('/api/expensive-data', { headers })

  if (response.status === 402) {
    const paymentRequest = await response.json()
    throw createPaymentError(paymentRequest)
  }

  if (!response.ok) {
    throw new Error('HTTP ' + response.status + ': ' + response.statusText)
  }

  return await response.json()
}

const fetchTieredData = async (authHeader?: string) => {
  const headers: Record<string, string> = {}
  if (authHeader) {
    headers['x-payment-authorization'] = authHeader
  }

  const response = await fetch('/api/tiered-data/premium', { headers })

  if (response.status === 402) {
    const paymentRequest = await response.json()
    throw createPaymentError(paymentRequest)
  }

  if (!response.ok) {
    throw new Error('HTTP ' + response.status + ': ' + response.statusText)
  }

  return await response.json()
}

const fetchProcessData = async (authHeader?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (authHeader) {
    headers['x-payment-authorization'] = authHeader
  }

  const response = await fetch('/api/process-data', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      data: 'Hello, X402!',
    }),
  })

  if (response.status === 402) {
    const paymentRequest = await response.json()
    throw createPaymentError(paymentRequest)
  }

  if (!response.ok) {
    throw new Error('HTTP ' + response.status + ': ' + response.statusText)
  }

  return await response.json()
}
</script>

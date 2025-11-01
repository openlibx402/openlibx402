<template>
  <div class="wallet-button-container">
    <button
      v-if="!connected"
      @click="handleConnect"
      :disabled="connecting"
      class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
    >
      {{ connecting ? 'Connecting...' : 'Connect Wallet' }}
    </button>
    <div v-else class="flex items-center gap-2">
      <span class="text-sm bg-green-100 text-green-800 px-3 py-2 rounded">
        {{ walletAddress?.slice(0, 4) }}...{{ walletAddress?.slice(-4) }}
      </span>
      <button
        @click="handleDisconnect"
        class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
      >
        Disconnect
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWallet } from '@/composables/useWallet'

const { connect, disconnect, connected, connecting, walletAddress } = useWallet()

const handleConnect = async () => {
  try {
    await connect()
  } catch (error) {
    console.error('Failed to connect wallet:', error)
  }
}

const handleDisconnect = async () => {
  try {
    await disconnect()
  } catch (error) {
    console.error('Failed to disconnect wallet:', error)
  }
}
</script>

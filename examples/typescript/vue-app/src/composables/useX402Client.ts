import { ref, computed, watch, onUnmounted } from 'vue'
import { Keypair } from '@solana/web3.js'
import { X402AutoClient } from '@openlibx402/client'
import { useWallet } from './useWallet'

const SOLANA_RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com'

export function useX402Client() {
  const { publicKey, connected } = useWallet()
  
  const client = ref<X402AutoClient | null>(null)
  const isReady = ref(false)

  // Watch for wallet changes and create/destroy client
  watch([publicKey, connected], ([newPublicKey, newConnected]) => {
    // Clean up previous client
    if (client.value) {
      try {
        client.value.close()
      } catch (error) {
        console.error('Error closing client:', error)
      }
      client.value = null
    }

    // If wallet is connected, create a new client
    if (newConnected && newPublicKey) {
      try {
        // TODO: In production, integrate with wallet's signTransaction method
        // For demo purposes, we create a temporary keypair
        const demoKeypair = Keypair.generate()
        
        const newClient = new X402AutoClient(demoKeypair, SOLANA_RPC_URL, {
          maxPaymentAmount: '5.0',
        })

        client.value = newClient
        isReady.value = true
      } catch (error) {
        console.error('Failed to create X402 client:', error)
        isReady.value = false
      }
    } else {
      isReady.value = true // Ready but not connected
    }
  }, { immediate: true })

  // Cleanup on unmount
  onUnmounted(() => {
    if (client.value) {
      try {
        client.value.close()
      } catch (error) {
        console.error('Error closing client on unmount:', error)
      }
    }
  })

  return {
    client: computed(() => client.value),
    isReady: computed(() => isReady.value),
  }
}

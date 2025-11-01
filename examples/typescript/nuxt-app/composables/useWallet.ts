import { ref, computed } from 'vue'
import { Keypair, PublicKey, Connection } from '@solana/web3.js'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import type { WalletAdapter } from '@solana/wallet-adapter-base'

export function useWallet() {
  const config = useRuntimeConfig()
  const wallet = ref<WalletAdapter | null>(null)
  const publicKey = ref<PublicKey | null>(null)
  const connected = ref(false)
  const connecting = ref(false)
  const wallets = ref<WalletAdapter[]>([])

  // Initialize available wallets
  const initWallets = () => {
    try {
      wallets.value = [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
      ]
    } catch (error) {
      console.error('Failed to initialize wallets:', error)
    }
  }

  const connect = async (walletName?: string) => {
    if (connecting.value) return
    
    connecting.value = true
    try {
      // Initialize wallets if not done yet
      if (wallets.value.length === 0) {
        initWallets()
      }

      // Find wallet
      let selectedWallet = wallets.value[0] // Default to first wallet
      if (walletName) {
        const found = wallets.value.find(w => w.name.toLowerCase().includes(walletName.toLowerCase()))
        if (found) selectedWallet = found
      }

      if (!selectedWallet) {
        throw new Error('No wallet adapter found')
      }

      wallet.value = selectedWallet
      await selectedWallet.connect()
      publicKey.value = selectedWallet.publicKey
      connected.value = true
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      connected.value = false
      wallet.value = null
      publicKey.value = null
    } finally {
      connecting.value = false
    }
  }

  const disconnect = async () => {
    if (wallet.value) {
      await wallet.value.disconnect()
      wallet.value = null
      publicKey.value = null
      connected.value = false
    }
  }

  const walletAddress = computed(() => publicKey.value?.toString() || null)

  return {
    wallet,
    publicKey,
    walletAddress,
    connected,
    connecting,
    wallets,
    connect,
    disconnect,
    initWallets
  }
}

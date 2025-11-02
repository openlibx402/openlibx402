# Real Payment Support

This Astro X402 demo now supports **both simulated and real wallet payments**.

## Quick Start: Simulated Payments (Demo Mode)

No setup needed! Just:
1. Click "Try Endpoint" on any paid endpoint
2. Click "Simulate Payment & Retry" to complete the demo flow
3. See the protected content returned

**Transactions won't appear on Solscan** because they're simulated locally.

## Production: Real Wallet Payments

To create **actual Solana transactions** that appear on Solscan:

### 1. Install Phantom Wallet

Download and install [Phantom Wallet](https://phantom.app/) browser extension.

### 2. Create a Devnet Account

1. Open Phantom
2. Click "Create a new wallet" or import existing
3. Switch network to **Solana Devnet** in settings
4. Copy your wallet address

### 3. Fund Your Wallet

Get free SOL and USDC on devnet:

```bash
# Request SOL from faucet
pnpm run get-devnet-sol [YOUR_WALLET_ADDRESS]

# Or use:
# - https://solfaucet.com/ - Free SOL
# - https://solana.fm - Devnet faucet UI
```

### 4. Use Real Payments

1. Click **"Connect Wallet"** button in the app
2. Approve the connection in Phantom
3. Click **"Try Endpoint"** on any paid endpoint
4. Click **"💰 Pay with Phantom Wallet"** (instead of simulate)
5. Approve the transaction in Phantom
6. **Check Solscan** - transaction appears at: `https://solscan.io/tx/[SIGNATURE]?cluster=devnet`

## How It Works

### Payment Flow Diagram

```
┌─────────────────┐
│  Connect Wallet │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ Request endpoint    │
│ (no auth)           │
└────────┬────────────┘
         │
         ▼
┌──────────────────────┐
│ Server returns 402   │
│ (payment request)    │
└────────┬─────────────┘
         │
         ▼
   ┌─────────────┐
   │ Two Options │
   └──┬──────┬──┘
      │      │
      ▼      ▼
   REAL   SIMULATE
   │         │
   ▼         ▼
[Phantom] [Mock Auth]
[Signs TX]  Header
   │         │
   ▼         ▼
[Broadcast] [Retry]
   │         │
   ├─────────┤
      │
      ▼
┌──────────────────────┐
│ Server verifies      │
│ & returns 200 data   │
└──────────────────────┘
```

### Real Payment Implementation

Located in `src/utils/real-payment.ts`:

1. **createPaymentTransaction()** - Signs with Phantom wallet
2. **transactionToAuthHeader()** - Converts tx to X402 auth header
3. **getPhantomProvider()** - Accesses Phantom's Solana provider

The transaction details are included in the authorization header:
- Transaction hash
- Wallet signature
- Public key
- Payment amount and timestamp

## Configuration

Set your payment wallet address in `.env`:

```env
PAYMENT_WALLET_ADDRESS=your_devnet_address_here
```

This is where payments will be sent. Update this to your actual wallet for testing.

## Viewing Transactions on Solscan

After paying with Phantom:

1. Get the transaction signature from the UI response
2. Visit: `https://solscan.io/tx/[SIGNATURE]?cluster=devnet`
3. See:
   - Transaction status
   - Signer (your wallet)
   - Recipient (payment wallet)
   - Amount and timestamp
   - Full transaction details

## Important Notes

### Devnet Only

- This demo uses **Solana Devnet** only
- Transactions are **free** (devnet has no real value)
- Perfect for testing without risking real funds

### Production Considerations

For mainnet deployment:

1. Use real Solana addresses
2. Implement proper USDC token transfers (SPL Token program)
3. Add slippage protection
4. Implement transaction retry logic
5. Store transaction receipts in database
6. Add rate limiting and fraud detection

### Current Limitations

The demo uses simple SOL transfers instead of USDC SPL token transfers. For production:

```typescript
// Use SPL Token Program for USDC transfers:
import { transferChecked } from '@solana/spl-token';

// Instead of SystemProgram.transfer()
```

## Troubleshooting

### "Phantom wallet not connected"
- Click "Connect Wallet" button first
- Check browser extensions are enabled
- Ensure Phantom is installed

### Transaction fails
- Confirm you have SOL/USDC on devnet
- Try the free endpoint first (no payment needed)
- Check devnet RPC is available

### Transaction doesn't appear on Solscan
- Ensure you used "Pay with Phantom Wallet" (not simulate)
- Wait 30 seconds for confirmation
- Check correct cluster: `?cluster=devnet`
- Paste transaction signature directly in Solscan

## Switching Between Demo and Real Payments

### Use Demo (Simulate)
- No wallet needed
- Instant
- Good for development

### Use Real (Phantom)
- Requires connected wallet with funds
- Creates actual blockchain transactions
- Can verify on Solscan
- Good for testing integration

Both options are always available when payment is needed!

## Resources

- [Phantom Wallet Docs](https://docs.phantom.app/)
- [Solana Devnet Faucet](https://solfaucet.com/)
- [Solscan Block Explorer](https://solscan.io/?cluster=devnet)
- [Solana Web3.js Docs](https://docs.solana.com/developers/clients/javascript-reference)
- [SPL Token Program](https://spl.solana.com/token)

## Support

For issues with wallet integration:
1. Check browser console for errors
2. Verify Phantom is connected to Devnet
3. Ensure you have SOL/USDC funds
4. Review transaction status on Solscan

Enjoy testing the X402 payment protocol! 🚀

# Payment System (USDC on Solana)

The chatbot uses Solana blockchain and USDC tokens to handle payments for additional queries. This document explains how the payment system works and how to use it.

## Payment Flow

### User Perspective

1. **Rate Limit Reached**: User exhausts their 3 free daily queries
2. **Payment Modal**: System displays payment interface with interactive slider
3. **Amount Selection**: User selects amount between 0.01 and 1.00 USDC using slider
4. **Wallet Connection**: User clicks "Connect Phantom & Pay X USDC"
5. **Approval**: Phantom wallet displays transaction for user to confirm
6. **Confirmation**: User approves transaction in wallet
7. **Waiting**: Frontend waits 5+ seconds for blockchain confirmation
8. **Verification**: Backend verifies USDC transfer on blockchain
9. **Success**: Queries are granted and chat resumes

### Technical Flow

```
Frontend                    Backend                     Solana
  |                            |                          |
  |-- Payment Request -------> |                          |
  |                            |                          |
  |<-- Payment Info ---------- |                          |
  |                            |                          |
  |-- Sign & Send TX --------> Phantom Wallet            |
  |                            |                          |
  |<-- Signature -------------- |                          |
  |                            |                          |
  |-- Verify Payment --------> |-- Get Transaction -----> |
  |                            |<-- TX Details ---------- |
  |                            |                          |
  |                            |-- Verify Balances -----> |
  |                            |<-- Balance Changes ----- |
  |                            |                          |
  |<-- Grant Queries --------- |-- Store Used TX         |
  |                            |-- Grant Credits in KV   |
  |                            |                          |
  Chat Resumes
```

## Pricing Model

### Query Pricing

| Amount | Queries | Cost per Query |
|--------|---------|----------------|
| 0.01 USDC | 10 | $0.001 |
| 0.05 USDC | 50 | $0.001 |
| 0.10 USDC | 100 | $0.001 |
| 0.50 USDC | 500 | $0.001 |
| 1.00 USDC | 1000 | $0.001 |

**Formula**: `queries = amount * 1000`

## Transaction Verification

### USDC Token Transfer Verification

The backend verifies USDC transfers by:

1. **Fetching Transaction**: Gets transaction details from Solana RPC
2. **Checking Status**: Ensures transaction succeeded (no errors)
3. **Examining Balances**: Checks `preTokenBalances` and `postTokenBalances`
4. **Validating Amount**: Confirms correct USDC amount received
5. **Validating Recipient**: Ensures tokens sent to configured wallet address
6. **Deduplicating**: Checks transaction hasn't been used before

### Verification Code

See [solana.ts](../../chatbot/src/services/solana.ts) for implementation details.

Key validation points:

```typescript
// 1. Transaction must exist and be confirmed
if (!transaction) return false;

// 2. Transaction must not have errors
if (transaction.meta?.err) return false;

// 3. Token account must belong to recipient
if (postBalance.owner !== recipientAddress.toBase58()) return false;

// 4. Amount must match (with 1% tolerance)
if (recipientReceived < minAmount) return false;
```

## Blockchain Details

### Solana Network

- **Devnet**: Development/testing network
  - USDC Mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
  - RPC: `https://api.devnet.solana.com`
  - Get test tokens: https://spl-token-faucet.com/

- **Mainnet**: Production network
  - USDC Mint: `EPjFWaYCh7QFMZWWB2BHXZPE6q8bZvWfNvwsKqVDTLST`
  - RPC: `https://api.mainnet-beta.solana.com`
  - Real USDC tokens required

### SPL Token Transfer

The payment system uses the SPL Token Program's `TransferChecked` instruction:

- **Program ID**: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`
- **Instruction Discriminator**: `12`
- **Parameters**:
  - Source token account (user's USDC account)
  - USDC mint address
  - Destination token account (chatbot's USDC account)
  - Token owner (user)
  - Amount (in base units, with 6 decimals)
  - Decimals (always 6 for USDC)

### Associated Token Accounts

USDC tokens are stored in Associated Token Accounts (ATAs) derived from:

```
PDA = hash(wallet_address || token_program_id || token_mint_address)
```

The system automatically derives the correct token account addresses for both sender and recipient.

## Payment Handler API

### Request

**Endpoint**: `POST /api/payment`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "signature": "3xMqyz4fTVaVPpZxbMCuKgf2PQ2hLzpvgLFAkf6fV5zR3FVFBsG9U8k3VzZgPRbmm6U3K3uKZT2",
  "amount": 0.01,
  "token": "USDC"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `signature` | string | Transaction signature from Phantom |
| `amount` | number | Amount in USDC (0.01 - 1.00) |
| `token` | string | Token symbol (always "USDC") |

### Response (Success)

**Status**: `200 OK`

```json
{
  "success": true,
  "message": "Payment accepted. You have been granted 10 additional queries.",
  "signature": "3xMqyz4fTVaVPpZxbMCuKgf2PQ2hLzpvgLFAkf6fV5zR3FVFBsG9U8k3VzZgPRbmm6U3K3uKZT2",
  "queriesGranted": 10,
  "rateLimit": {
    "remaining": 10,
    "resetAt": 1730851200000,
    "requiresPayment": false
  }
}
```

### Response (Error)

**Status**: `400 Bad Request`

```json
{
  "error": "Invalid or unconfirmed transaction. Please ensure you sent 0.01 USDC (not SOL) to the recipient address.",
  "details": "Transaction verification failed. Check that: 1) You sent USDC tokens (not SOL), 2) Amount is 0.01 USDC, 3) Sent to the correct recipient address, 4) Transaction has been confirmed on the blockchain (wait 30-60 seconds)"
}
```

Common errors:

- **Invalid amount**: Amount outside 0.01-1.00 USDC range
- **Transaction not found**: Transaction not yet on blockchain
- **Transaction not confirmed**: Wait longer for confirmation
- **Wrong token**: Sent SOL or different token instead of USDC
- **Wrong recipient**: Sent to wrong wallet address
- **Insufficient amount**: Sent less than expected amount
- **Already used**: Transaction signature already used before

## Payment Info Endpoint

### Request

**Endpoint**: `GET /api/payment/info`

Returns payment configuration information.

### Response

```json
{
  "amount": 0.01,
  "token": "USDC",
  "network": "devnet",
  "recipient": "HMYDGuLTCL6r5pGL8yUbj27i4pyafpomfhZLq3psxm7L",
  "usdcMint": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  "instructions": [
    "Send the specified amount of USDC to the recipient address",
    "Submit the transaction signature to the /api/payment endpoint",
    "You will receive 1 additional query after successful verification"
  ]
}
```

## Testing Payments

### Devnet Testing

1. **Get Devnet SOL**: Use faucet at https://faucet.solana.com/

2. **Get Devnet USDC**: Use faucet at https://spl-token-faucet.com/
   - Select network: Devnet
   - Paste wallet address
   - Select USDC token

3. **Connect Phantom to Devnet**:
   - Click wallet address in top-right
   - Click Settings
   - Change network to Devnet

4. **Make Test Payment**:
   - Open chatbot
   - Use 3 free queries
   - Click "Pay with Solana"
   - Select 0.01 USDC (10 queries)
   - Confirm in Phantom

### Monitoring Payments

Check the server logs for transaction verification:

```
[INFO] [RAGBOT] Verifying USDC transaction: 3xMqyz4f..., expected amount: 0.01 USDC
[INFO] [RAGBOT] Pre-token balances: [...]
[INFO] [RAGBOT] Post-token balances: [...]
[INFO] [RAGBOT] ✓ Found recipient account with 10000 tokens received (0.01 USDC)
[INFO] [RAGBOT] USDC transaction verified successfully: 3xMqyz4f... (0.01 USDC received)
[INFO] [RAGBOT] Granting 10 queries to user:127.0.0.1
```

## Security Considerations

### Transaction Deduplication

Used transaction signatures are stored in Deno KV for 30 days to prevent reuse:

```typescript
const key = ['used_transactions', signature];
await kv.set(key, true, { expireIn: 30 * 24 * 60 * 60 * 1000 });
```

### Balance Verification

The system verifies:
- ✅ Transaction exists on blockchain
- ✅ Transaction succeeded (no errors)
- ✅ Correct token (USDC mint address)
- ✅ Correct recipient (wallet address)
- ✅ Correct amount (within 1% tolerance for rounding)
- ✅ Transaction not used before

### Rate Limiting on Payments

Payment endpoint is not explicitly rate-limited but:
- Frontend waits 5 seconds before verification
- Backend verifies transaction on blockchain (prevents duplicates)
- Used transactions tracked for 30 days

## Troubleshooting

### Payment Verification Fails

**Error**: "Invalid or unconfirmed transaction"

**Solutions**:
1. **Wait for confirmation**: Transaction may not be confirmed yet. Wait 30-60 seconds and try again.
2. **Check amount**: Ensure you sent exactly the amount specified (0.01, 0.05, 0.1, 0.5, or 1.0 USDC).
3. **Check token**: Ensure you sent USDC tokens, not SOL.
4. **Check recipient**: Verify you sent to the correct recipient wallet address.
5. **Check network**: If on devnet, use devnet tokens from https://spl-token-faucet.com/

### Transaction Already Used

**Error**: "This transaction has already been used"

**Solution**: Each transaction signature can only be used once. Make a new payment with a different transaction.

### No Token Balances Found

**Error**: "No token account found for recipient"

**Causes**:
1. Sent to wrong wallet address
2. Sent a different token (not USDC)
3. Transaction not confirmed yet

**Solutions**:
- Verify recipient wallet address in payment modal
- Confirm you're sending USDC (not SOL or other tokens)
- Wait longer for blockchain confirmation

### Phantom Wallet Issues

**Can't connect wallet**:
- Make sure Phantom is installed and unlocked
- Check correct network is selected (devnet or mainnet)

**Transaction rejected**:
- Ensure wallet has SOL for transaction fees
- Check you have USDC tokens to send
- Try again with smaller amount

## Future Enhancements

- [ ] Support for other tokens (SOL, USDT)
- [ ] Subscription plans with recurring payments
- [ ] Withdrawal mechanism for collected payments
- [ ] Multi-signature payment verification
- [ ] Payment history and analytics
- [ ] Refund mechanism for failed transactions

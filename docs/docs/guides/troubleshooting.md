# Troubleshooting Guide

Common issues and solutions when working with OpenLibx402.

## Quick Diagnostics

Run these checks first:

```bash
# Check Solana RPC connectivity
curl -X POST https://api.devnet.solana.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# Check wallet balance
solana balance <YOUR_WALLET> --url devnet

# Check USDC balance
spl-token balance <USDC_MINT> --owner <YOUR_WALLET> --url devnet
```

---

## Payment Errors

### "Payment Required" (402) Not Triggering

**Symptoms:**
- Endpoint returns 200 instead of 402
- Missing payment requirement headers

**Causes & Solutions:**

1. **Decorator not applied correctly**
   ```python
   # Wrong order
   @payment_required(amount="0.10", ...)
   @app.get("/premium")  # This won't work

   # Correct order
   @app.get("/premium")
   @payment_required(amount="0.10", ...)
   async def premium_endpoint():
       ...
   ```

2. **X402 not initialized**
   ```python
   # Add before route definitions
   config = X402Config(...)
   init_x402(config)
   ```

3. **Middleware not registered**
   ```typescript
   // Express - ensure middleware is added
   app.use(paymentRequired({ amount: '0.10' }));
   ```

### "Insufficient Funds" Error

**Symptoms:**
```
InsufficientFundsError: Wallet has 0.05 USDC, need 0.10 USDC
```

**Solutions:**

1. **Check wallet balance**
   ```bash
   # Check SOL balance (for fees)
   solana balance YOUR_WALLET --url devnet

   # Check USDC balance
   spl-token balance USDC_MINT --owner YOUR_WALLET --url devnet
   ```

2. **Get devnet tokens**
   ```bash
   # Airdrop SOL
   solana airdrop 1 YOUR_WALLET --url devnet

   # For USDC, use faucet or test mint
   ```

3. **Verify correct token mint**
   ```python
   # Devnet USDC mint (example)
   USDC_DEVNET = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"

   # Mainnet USDC
   USDC_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
   ```

### "Payment Verification Failed"

**Symptoms:**
- Transaction confirmed on-chain but verification fails
- Server returns 402 even with valid payment

**Debugging:**

1. **Check transaction on explorer**
   ```bash
   # Devnet
   https://explorer.solana.com/tx/<TX_HASH>?cluster=devnet

   # Mainnet
   https://explorer.solana.com/tx/<TX_HASH>
   ```

2. **Verify transaction details match**
   ```python
   # Enable debug logging
   import logging
   logging.basicConfig(level=logging.DEBUG)

   # Check what's being verified
   logger.debug(f"Verifying: recipient={expected_recipient}, "
                f"amount={expected_amount}, mint={expected_mint}")
   ```

3. **Common mismatches:**
   - Wrong recipient address
   - Amount precision issues (USDC has 6 decimals)
   - Wrong token mint address
   - Network mismatch (devnet vs mainnet)

4. **Check RPC response**
   ```python
   async def debug_verify(tx_hash):
       response = await client.get_transaction(tx_hash)
       print(json.dumps(response, indent=2))
   ```

### "Payment Expired"

**Symptoms:**
```
PaymentExpiredError: Payment request expired at 2025-11-10T16:00:00Z
```

**Solutions:**

1. **Increase expiration time**
   ```python
   @payment_required(
       amount="0.10",
       expires_in=600,  # 10 minutes instead of default 5
       ...
   )
   ```

2. **Handle expired payments on client**
   ```python
   try:
       response = await client.fetch(url)
   except PaymentExpiredError:
       # Request new payment authorization
       response = await client.fetch(url)
   ```

---

## RPC Connection Issues

### "Connection Refused" / "Timeout"

**Symptoms:**
- RPC requests hang or timeout
- Cannot connect to Solana network

**Solutions:**

1. **Check RPC endpoint**
   ```bash
   # Test connectivity
   curl -X POST YOUR_RPC_URL \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
   ```

2. **Use alternative RPC endpoints**
   ```python
   # Try multiple endpoints
   RPC_ENDPOINTS = [
       "https://api.devnet.solana.com",
       "https://api.devnet.solana.com",
       "https://devnet.genesysgo.net",
   ]

   for rpc_url in RPC_ENDPOINTS:
       try:
           client = AsyncClient(rpc_url)
           # Test connection
           await client.get_latest_blockhash()
           break
       except Exception as e:
           print(f"Failed {rpc_url}: {e}")
   ```

3. **Check rate limits**
   ```
   # Public RPC endpoints have rate limits
   # Solution: Use paid RPC provider or run your own node
   ```

### "RPC Rate Limit Exceeded"

**Symptoms:**
```
429 Too Many Requests
```

**Solutions:**

1. **Implement request caching**
   ```python
   from functools import lru_cache
   from datetime import datetime, timedelta

   @lru_cache(maxsize=1000)
   def get_transaction_cached(tx_hash, timestamp):
       return get_transaction(tx_hash)

   # Use with 1-minute cache
   result = get_transaction_cached(
       tx_hash,
       datetime.now().replace(second=0, microsecond=0)
   )
   ```

2. **Use paid RPC provider**
   - Helius
   - QuickNode
   - Alchemy
   - Run your own validator

3. **Implement retry with backoff**
   ```python
   from tenacity import retry, wait_exponential, stop_after_attempt

   @retry(
       wait=wait_exponential(multiplier=1, min=4, max=10),
       stop=stop_after_attempt(5)
   )
   async def verify_with_retry(tx_hash):
       return await processor.verify_transaction(tx_hash)
   ```

---

## Import & Installation Errors

### Module Not Found

**Symptoms:**
```python
ModuleNotFoundError: No module named 'openlibx402_core'
```

**Solutions:**

1. **Check installation**
   ```bash
   pip list | grep openlibx402
   ```

2. **Reinstall package**
   ```bash
   pip uninstall openlibx402-core
   pip install openlibx402-core
   ```

3. **Check Python version**
   ```bash
   python --version  # Requires 3.8+
   ```

4. **Verify virtual environment**
   ```bash
   which python  # Should point to venv
   source venv/bin/activate  # Activate venv
   ```

### TypeScript Type Errors

**Symptoms:**
```
Cannot find module '@openlibx402/core' or its corresponding type declarations
```

**Solutions:**

1. **Install types**
   ```bash
   npm install @openlibx402/core --save
   ```

2. **Check tsconfig.json**
   ```json
   {
     "compilerOptions": {
       "moduleResolution": "node",
       "esModuleInterop": true
     }
   }
   ```

3. **Clear node_modules**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## Transaction Issues

### Transaction Not Confirming

**Symptoms:**
- Transaction sent but never confirms
- Stuck in "pending" state

**Debugging:**

1. **Check transaction status**
   ```python
   async def check_tx_status(signature):
       statuses = await client.get_signature_statuses([signature])
       print(statuses)
   ```

2. **Increase confirmation level**
   ```python
   # Wait for finalized confirmation
   await client.confirm_transaction(
       signature,
       commitment="finalized"  # Instead of "processed"
   )
   ```

3. **Check for errors**
   ```python
   tx_response = await client.get_transaction(signature)
   if tx_response.value.meta.err:
       print(f"Transaction failed: {tx_response.value.meta.err}")
   ```

### "Blockhash Not Found"

**Symptoms:**
```
Error: Blockhash not found
```

**Solutions:**

1. **Get recent blockhash**
   ```python
   # Always get fresh blockhash
   blockhash = await client.get_latest_blockhash()
   transaction.recent_blockhash = blockhash.value.blockhash
   ```

2. **Send transaction quickly**
   ```python
   # Blockhash expires after ~60 seconds
   # Create and send transaction immediately
   ```

---

## Network-Specific Issues

### Wrong Network Configuration

**Symptoms:**
- Transactions fail silently
- Balance shows 0 on explorer

**Solutions:**

1. **Verify network consistency**
   ```python
   # Ensure all components use same network
   RPC_URL = "https://api.devnet.solana.com"  # devnet
   USDC_MINT = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"  # devnet USDC

   # NOT this (mixing networks):
   RPC_URL = "https://api.mainnet-beta.solana.com"  # mainnet
   USDC_MINT = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"  # devnet USDC ❌
   ```

2. **Check wallet on correct network**
   ```bash
   # Devnet
   solana balance YOUR_WALLET --url devnet

   # Mainnet
   solana balance YOUR_WALLET --url mainnet-beta
   ```

---

## Framework-Specific Issues

### FastAPI: 402 Response Not Showing

**Issue:**
FastAPI returns 200 instead of 402

**Solution:**
```python
# Ensure decorator order is correct
@app.get("/premium")
@payment_required(amount="0.10", ...)  # Decorator AFTER route
async def endpoint():
    ...

# NOT this:
@payment_required(amount="0.10", ...)
@app.get("/premium")  # Won't work
```

### Express: Middleware Not Executing

**Issue:**
Payment middleware doesn't run

**Solution:**
```typescript
// Ensure middleware is before route handler
app.get('/premium',
  paymentRequired({ amount: '0.10' }),  // Middleware first
  (req, res) => { ... }  // Handler second
);

// Check middleware is actually imported
import { paymentRequired } from '@openlibx402/express';
```

### Next.js: API Routes 402 Not Working

**Issue:**
Next.js API route returns 200

**Solution:**
```typescript
// Use withPayment HOF correctly
export default withPayment({
  amount: '0.10',
  paymentAddress: process.env.PAYMENT_WALLET!,
  tokenMint: process.env.USDC_MINT!,
})(async (req, res) => {
  // Handler code
});
```

---

## Debugging Tips

### Enable Debug Logging

**Python:**
```python
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# For specific logger
logger = logging.getLogger('openlibx402')
logger.setLevel(logging.DEBUG)
```

**TypeScript:**
```typescript
// Set environment variable
process.env.DEBUG = 'openlibx402:*';

// Or use console
console.log('Payment request:', JSON.stringify(paymentRequest, null, 2));
```

### Inspect HTTP Traffic

```bash
# Use mitmproxy to inspect HTTP requests
mitmproxy -p 8080

# Configure client to use proxy
export HTTP_PROXY=http://localhost:8080
export HTTPS_PROXY=http://localhost:8080
```

### Test in Isolation

```python
# Test payment verification separately
async def test_verification():
    processor = SolanaPaymentProcessor(rpc_url)

    # Use known transaction
    tx_hash = "KNOWN_VALID_TX_HASH"

    result = await processor.verify_transaction(
        tx_hash,
        expected_recipient="...",
        expected_amount="0.10",
        expected_token_mint="..."
    )

    print(f"Verification result: {result}")
```

---

## Getting Help

### 1. Check Logs

```bash
# Application logs
tail -f /var/log/app.log

# System logs
journalctl -u your-service -f

# Docker logs
docker logs -f container_name
```

### 2. Gather Information

When reporting issues, include:
- OpenLibx402 version
- Language/framework version
- Network (devnet/mainnet)
- Error message (full stack trace)
- Minimal reproduction code
- Transaction hash (if applicable)

### 3. Resources

- **GitHub Issues**: https://github.com/openlibx402/openlibx402/issues
- **Documentation**: https://docs.openlibx402.org
- **Discord**: Coming soon
- **Email**: x402@openlib.xyz

---

## Common Error Reference

| Error | Cause | Solution |
|-------|-------|----------|
| `InsufficientFundsError` | Low wallet balance | Add funds to wallet |
| `PaymentExpiredError` | Request expired | Increase `expires_in` parameter |
| `PaymentVerificationError` | Transaction verification failed | Check tx on explorer, verify params |
| `TransactionBroadcastError` | RPC issue | Check RPC connectivity, try backup |
| `InvalidPaymentRequestError` | Malformed 402 response | Check server implementation |
| `Connection refused` | RPC offline | Try alternative RPC endpoint |
| `429 Too Many Requests` | Rate limited | Use paid RPC or add caching |
| `Blockhash not found` | Stale blockhash | Get fresh blockhash before sending |
| `Module not found` | Package not installed | Install package, check venv |

---

## See Also

- [Testing Guide](testing.md)
- [Production Deployment Guide](production.md)
- [Technical Specification](../openlibx402-technical-spec.md)

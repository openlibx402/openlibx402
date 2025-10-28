# openlibx402-client

HTTP client library for the X402 payment protocol with automatic payment handling.

## Overview

The `openlibx402-client` package provides HTTP client libraries that automatically handle X402 payment requirements. When accessing payment-protected APIs, the client can automatically detect payment requirements, process payments, and retry requests with payment authorization.

## Features

- Automatic detection of payment-required responses (402 status)
- Seamless payment processing and request retry
- Support for both automatic and explicit payment flows
- Wallet management and transaction handling
- Built on top of `httpx` for modern async/sync HTTP support

## Installation

```bash
pip install openlibx402-client
```

## Usage

### X402AutoClient - Automatic Payment Handling

The `X402AutoClient` automatically handles payment requirements transparently:

```python
from openlibx402_client import X402AutoClient
from solders.keypair import Keypair
import asyncio

# Load your wallet keypair
keypair = Keypair()  # Or load from file

# Create client with automatic payment handling
client = X402AutoClient(
    wallet_keypair=keypair,
    max_payment="5.0",  # Maximum payment amount (safety limit)
    auto_retry=True,    # Automatically retry after payment
)

async def fetch_data():
    # Client automatically handles payment if required
    response = await client.fetch("https://api.example.com/premium-data")
    print(response.text)

    await client.close()

asyncio.run(fetch_data())
```

### X402Client - Explicit Payment Control

For more control over the payment process:

```python
from openlibx402_client import X402Client
from solders.keypair import Keypair
import asyncio

keypair = Keypair()
client = X402Client(wallet_keypair=keypair)

async def fetch_with_explicit_payment():
    try:
        # First request (may return 402 Payment Required)
        response = await client.fetch("https://api.example.com/premium-data")
        print(response.text)
    except Exception as e:
        if "402" in str(e):
            # Handle payment explicitly
            print("Payment required - processing...")
            # The client provides methods for explicit payment handling

    await client.close()

asyncio.run(fetch_with_explicit_payment())
```

### Loading Wallet from File

```python
import json
from solders.keypair import Keypair

# Load wallet from Solana CLI format
with open("wallet.json") as f:
    wallet_data = json.load(f)
    keypair = Keypair.from_bytes(bytes(wallet_data))
```

## Configuration

Key parameters for `X402AutoClient`:

- `wallet_keypair`: Your Solana wallet keypair for payments
- `max_payment`: Maximum payment amount (in tokens) - safety limit
- `auto_retry`: Whether to automatically retry after payment (default: True)
- `rpc_url`: Solana RPC endpoint (default: devnet)
- `timeout`: HTTP request timeout

## Example: Integration with Existing Code

```python
from openlibx402_client import X402AutoClient
from solders.keypair import Keypair

# Minimal changes to add payment support
keypair = Keypair()
client = X402AutoClient(wallet_keypair=keypair, max_payment="10.0")

# Use like a normal HTTP client
response = await client.fetch("https://api.example.com/data")
data = response.json()
```

## Documentation

For complete API reference and guides, see:
- [Documentation](https://docs.openlibx402.org)
- [GitHub Repository](https://github.com/openlibx402/openlibx402)
- [Examples](https://github.com/openlibx402/openlibx402/tree/main/examples/python)

## Testing

```bash
pytest tests/
```

## License

MIT License - See [LICENSE](LICENSE) file for details.

# OpenLibx402 Client

HTTP client library for making X402-enabled API calls with automatic payment handling.

## Installation

```bash
pip install openlibx402-client
```

## Features

- **Explicit Client**: Manual control over payment flow
- **Implicit Client**: Automatic payment handling with configurable retries
- Support for all HTTP methods (GET, POST, PUT, DELETE)
- Safety limits with `max_payment_amount`
- URL validation and SSRF protection
- Local development support with `allow_local`
- Proper connection cleanup and security

## Usage

### Explicit Client (Manual Control)

```python
from openlibx402_client import X402Client
from solders.keypair import Keypair

# Load wallet
keypair = Keypair()

# Create client
client = X402Client(wallet_keypair=keypair)

# Make request
response = await client.get("https://api.example.com/data")

# Check if payment required
if client.payment_required(response):
    payment_request = client.parse_payment_request(response)

    # Create payment
    authorization = await client.create_payment(payment_request)

    # Retry with payment
    response = await client.get(
        "https://api.example.com/data",
        payment=authorization
    )

data = response.json()

# Always cleanup
await client.close()
```

#### Local Development

For local development with localhost URLs:

```python
# Enable allow_local for localhost/private IPs
client = X402Client(wallet_keypair=keypair, allow_local=True)

response = await client.get("http://localhost:3000/api/data")

if client.payment_required(response):
    payment_request = client.parse_payment_request(response)
    authorization = await client.create_payment(payment_request)
    response = await client.get(
        "http://localhost:3000/api/data",
        payment=authorization
    )

await client.close()
```

### Implicit Client (Auto-Payment)

```python
from openlibx402_client import X402AutoClient
from solders.keypair import Keypair

# Create auto-client with safety limits
client = X402AutoClient(
    wallet_keypair=keypair,
    max_payment_amount="5.0",  # Safety limit
    max_retries=1
)

# Automatically handles 402 and pays
response = await client.fetch("https://api.example.com/data")
data = response.json()

# Cleanup
await client.close()
```

#### Disable Auto-Retry

```python
# Disable auto-retry for specific request
try:
    response = await client.fetch(
        "https://api.example.com/data",
        auto_retry=False
    )
except PaymentRequiredError as e:
    print(f"Payment required: {e.payment_request.max_amount_required}")
```

## Security Notes

- Always call `close()` when done to properly cleanup connections and sensitive data
- Private keys are held in memory - ensure proper disposal
- Only use URLs from trusted sources to prevent SSRF attacks
- Default RPC URL is devnet - use mainnet URL for production
- Set `allow_local=True` for local development (localhost URLs)
- **NEVER** use `allow_local=True` in production deployments

## API Reference

### X402Client

- `get(url, payment=None, **kwargs)` - GET request
- `post(url, payment=None, **kwargs)` - POST request
- `put(url, payment=None, **kwargs)` - PUT request
- `delete(url, payment=None, **kwargs)` - DELETE request
- `request(method, url, payment=None, **kwargs)` - Generic HTTP request
- `payment_required(response)` - Check if response requires payment
- `parse_payment_request(response)` - Parse payment request from 402 response
- `create_payment(request, amount=None)` - Create and broadcast payment
- `close()` - Cleanup connections and sensitive data

### X402AutoClient

- `fetch(url, method="GET", auto_retry=None, **kwargs)` - Request with auto-payment
- `get(url, auto_retry=None, **kwargs)` - GET with auto-payment
- `post(url, auto_retry=None, **kwargs)` - POST with auto-payment
- `put(url, auto_retry=None, **kwargs)` - PUT with auto-payment
- `delete(url, auto_retry=None, **kwargs)` - DELETE with auto-payment
- `close()` - Cleanup connections

## License

MIT

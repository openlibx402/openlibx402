# OpenLibX402 Client

HTTP client library for making X402-enabled API calls with automatic payment handling.

## Installation

```bash
pip install openlibx402-client
```

## Features

- **Explicit Client**: Manual control over payment flow
- **Implicit Client**: Automatic payment handling
- Support for all HTTP methods (GET, POST, PUT, DELETE)
- Safety limits with `max_payment_amount`
- Configurable retry behavior

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
```

### Implicit Client (Auto-Payment)

```python
from openlibx402_client import X402AutoClient
from solders.keypair import Keypair

# Create auto-client
client = X402AutoClient(
    wallet_keypair=keypair,
    max_payment_amount="5.0"  # Safety limit
)

# Automatically handles 402 and pays
response = await client.fetch("https://api.example.com/data")
data = response.json()
```

### Disable Auto-Retry

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

## License

MIT
# OpenLibx402 Core

Core implementation of the X402 payment protocol for autonomous AI agent payments.

## Installation

```bash
pip install openlibx402-core
```

## Features

- Payment request and authorization data structures
- Solana blockchain integration
- Comprehensive error handling
- Testing utilities with mock implementations

## Usage

```python
from openlibx402_core import PaymentRequest, PaymentAuthorization, SolanaPaymentProcessor

# Create payment processor
processor = SolanaPaymentProcessor("https://api.devnet.solana.com")

# Parse payment request from 402 response
request = PaymentRequest.from_dict(response_data)

# Create and send payment
transaction = await processor.create_payment_transaction(request, "0.10", keypair)
tx_hash = await processor.sign_and_send_transaction(transaction, keypair)

# Verify transaction
verified = await processor.verify_transaction(
    tx_hash,
    request.payment_address,
    "0.10",
    request.asset_address
)
```

## Testing

```python
from openlibx402_core.testing import MockSolanaPaymentProcessor, create_mock_payment_request

# Use mock processor in tests
processor = MockSolanaPaymentProcessor()
processor.balance = 100.0

request = create_mock_payment_request(amount="0.10")
```

## License

MIT
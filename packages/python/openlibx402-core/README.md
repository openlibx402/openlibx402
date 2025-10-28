# openlibx402-core

Core Python implementation of the X402 payment protocol for autonomous AI agent payments.

## Overview

The `openlibx402-core` package provides the fundamental building blocks for implementing the X402 payment protocol. This package handles payment processing on the Solana blockchain, including transaction creation, verification, and error handling.

## Features

- Payment request and authorization models
- Solana blockchain payment processing
- Comprehensive error handling for payment workflows
- Protocol primitives and data structures
- Transaction verification and validation

## Installation

```bash
pip install openlibx402-core
```

## Core Components

### Payment Models

```python
from openlibx402_core import PaymentRequest, PaymentAuthorization

# PaymentRequest: Represents a payment requirement
# PaymentAuthorization: Represents completed payment details
```

### Payment Processor

```python
from openlibx402_core import SolanaPaymentProcessor
from solders.keypair import Keypair

# Initialize payment processor
keypair = Keypair()  # Your wallet keypair
processor = SolanaPaymentProcessor(
    wallet_keypair=keypair,
    rpc_url="https://api.devnet.solana.com"
)

# Process payments (typically used by higher-level packages)
```

### Error Handling

```python
from openlibx402_core import (
    X402Error,
    PaymentRequiredError,
    PaymentExpiredError,
    InsufficientFundsError,
    PaymentVerificationError,
    TransactionBroadcastError,
    InvalidPaymentRequestError,
)

try:
    # Payment operations
    pass
except PaymentRequiredError as e:
    print(f"Payment required: {e}")
except InsufficientFundsError as e:
    print(f"Insufficient funds: {e}")
```

## Usage

This package is typically used as a dependency by higher-level packages like:

- **openlibx402-client**: HTTP client with automatic payment handling
- **openlibx402-fastapi**: FastAPI middleware for payment-required endpoints
- **openlibx402-langchain**: LangChain agent integration
- **openlibx402-langgraph**: LangGraph workflow integration

For most use cases, you'll want to use one of these higher-level packages rather than using `openlibx402-core` directly.

## Documentation

For complete API reference and guides, see:
- [Documentation](https://openlibx402.github.io/docs)
- [GitHub Repository](https://github.com/openlibx402/openlibx402)

## Testing

```bash
pytest tests/
```

## License

MIT License - See [LICENSE](LICENSE) file for details.

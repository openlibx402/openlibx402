# OpenLibX402 FastAPI

FastAPI middleware and decorators for X402 payment protocol.

## Installation

```bash
pip install openlibx402-fastapi
```

## Features

- Simple decorator for adding payment requirements
- Dependency injection pattern for FastAPI
- Global configuration management
- Automatic payment verification
- 402 response builders

## Usage

### Decorator Approach

```python
from fastapi import FastAPI
from openlibx402_fastapi import payment_required

app = FastAPI()

@app.get("/premium-data")
@payment_required(
    amount="0.10",
    payment_address="YOUR_WALLET_ADDRESS",
    token_mint="USDC_MINT_ADDRESS",
    description="Access to premium market data"
)
async def get_premium_data():
    return {"data": "Premium content"}
```

### Dependency Injection

```python
from fastapi import FastAPI, Depends
from openlibx402_fastapi import verify_payment_factory, PaymentAuthorization

app = FastAPI()

@app.get("/expensive-data")
async def get_expensive_data(
    payment: PaymentAuthorization = Depends(
        verify_payment_factory(
            amount="1.00",
            payment_address="YOUR_WALLET_ADDRESS",
            token_mint="USDC_MINT_ADDRESS"
        )
    )
):
    return {
        "data": "Very expensive content",
        "payment_id": payment.payment_id
    }
```

### Global Configuration

```python
from openlibx402_fastapi import X402Config, init_x402

config = X402Config(
    payment_address="YOUR_WALLET_ADDRESS",
    token_mint="USDC_MINT_ADDRESS",
    network="solana-devnet"
)
init_x402(config)

@app.get("/data")
@payment_required(amount="0.05")  # Uses global config
async def get_data():
    return {"data": "content"}
```

## License

MIT

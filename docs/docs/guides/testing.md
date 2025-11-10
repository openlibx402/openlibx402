# Testing Guide

Comprehensive guide for testing X402-enabled applications across all languages and frameworks.

## Overview

Testing X402 payment flows requires mocking blockchain interactions to avoid real transactions during development. This guide covers testing strategies for all OpenLibx402 packages.

## Testing Strategies

### 1. Mock Payment Processors
### 2. Test Servers
### 3. Integration Testing
### 4. End-to-End Testing

---

## Python Testing

### Mock Payment Processor

```python
# tests/test_payment_flow.py
import pytest
from openlibx402_core.testing import MockSolanaPaymentProcessor
from openlibx402_client import X402AutoClient
from solders.keypair import Keypair

@pytest.fixture
def mock_processor():
    processor = MockSolanaPaymentProcessor()
    processor.balance = 100.0  # Set mock balance
    return processor

@pytest.fixture
def test_keypair():
    return Keypair()

@pytest.fixture
def test_client(test_keypair, mock_processor):
    client = X402AutoClient(wallet_keypair=test_keypair)
    client.client.processor = mock_processor
    return client

@pytest.mark.asyncio
async def test_auto_payment_flow(test_client, mock_processor):
    """Test automatic payment handling"""
    response = await test_client.fetch("http://localhost:8402/premium-data")

    assert response.status_code == 200
    assert len(mock_processor.transactions) == 1
    assert mock_processor.transactions[0].startswith("mock_tx_")

@pytest.mark.asyncio
async def test_insufficient_funds(test_client, mock_processor):
    """Test insufficient funds error"""
    mock_processor.balance = 0.01  # Not enough for payment

    with pytest.raises(InsufficientFundsError) as exc_info:
        await test_client.fetch("http://localhost:8402/premium-data")

    assert "insufficient" in str(exc_info.value).lower()
```

### Testing FastAPI Endpoints

```python
# tests/test_fastapi_server.py
from fastapi.testclient import TestClient
from openlibx402_fastapi import payment_required, X402Config, init_x402
from fastapi import FastAPI

@pytest.fixture
def app():
    app = FastAPI()

    config = X402Config(
        payment_address="TEST_WALLET",
        token_mint="TEST_USDC",
        network="solana-devnet"
    )
    init_x402(config)

    @app.get("/premium")
    @payment_required(
        amount="0.10",
        payment_address="TEST_WALLET",
        token_mint="TEST_USDC"
    )
    async def premium_endpoint():
        return {"data": "premium"}

    return app

def test_payment_required_response(app):
    """Test 402 response for unpaid request"""
    client = TestClient(app)
    response = client.get("/premium")

    assert response.status_code == 402
    assert response.headers["X-Payment-Required"] == "true"
    assert "maxAmountRequired" in response.json()

def test_paid_request(app):
    """Test successful request with payment"""
    client = TestClient(app)

    # Mock payment authorization header
    headers = {
        "X-Payment-Authorization": "transactionHash=mock_tx_123;..."
    }

    response = client.get("/premium", headers=headers)
    assert response.status_code == 200
    assert response.json()["data"] == "premium"
```

---

## TypeScript Testing

### Jest Configuration

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ]
};
```

### Mock Payment Processor

```typescript
// tests/mocks/MockPaymentProcessor.ts
import { PaymentRequest, PaymentAuthorization } from '@openlibx402/core';

export class MockSolanaPaymentProcessor {
  public balance = 100.0;
  public transactions: string[] = [];

  async createPaymentTransaction(): Promise<any> {
    return { mock: true };
  }

  async signAndSendTransaction(): Promise<string> {
    const txHash = `mock_tx_${this.transactions.length}`;
    this.transactions.push(txHash);
    return txHash;
  }

  async verifyTransaction(): Promise<boolean> {
    return true;
  }

  async getTokenBalance(): Promise<number> {
    return this.balance;
  }
}
```

### Testing Express Middleware

```typescript
// tests/express.test.ts
import request from 'supertest';
import express from 'express';
import { paymentRequired, initX402, X402Config } from '@openlibx402/express';

describe('Express X402 Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();

    initX402(new X402Config({
      paymentAddress: 'TEST_WALLET',
      tokenMint: 'TEST_USDC',
      network: 'solana-devnet'
    }));

    app.get('/premium',
      paymentRequired({ amount: '0.10' }),
      (req, res) => res.json({ data: 'premium' })
    );
  });

  it('should return 402 without payment', async () => {
    const response = await request(app).get('/premium');

    expect(response.status).toBe(402);
    expect(response.headers['x-payment-required']).toBe('true');
    expect(response.body).toHaveProperty('maxAmountRequired');
  });

  it('should return 200 with valid payment', async () => {
    const response = await request(app)
      .get('/premium')
      .set('X-Payment-Authorization', 'transactionHash=mock_tx_123');

    expect(response.status).toBe(200);
    expect(response.body.data).toBe('premium');
  });
});
```

### Testing Auto Client

```typescript
// tests/client.test.ts
import { X402AutoClient } from '@openlibx402/client';
import { Keypair } from '@solana/web3.js';
import { MockSolanaPaymentProcessor } from './mocks/MockPaymentProcessor';

describe('X402AutoClient', () => {
  let client: X402AutoClient;
  let mockProcessor: MockSolanaPaymentProcessor;

  beforeEach(() => {
    const keypair = Keypair.generate();
    client = new X402AutoClient(keypair);

    mockProcessor = new MockSolanaPaymentProcessor();
    // Inject mock processor
    (client as any).processor = mockProcessor;
  });

  it('should handle payment automatically', async () => {
    const response = await client.get('http://localhost:8000/premium');

    expect(response.status).toBe(200);
    expect(mockProcessor.transactions.length).toBe(1);
  });

  it('should throw on insufficient funds', async () => {
    mockProcessor.balance = 0.01;

    await expect(
      client.get('http://localhost:8000/premium')
    ).rejects.toThrow('insufficient');
  });
});
```

---

## Go Testing

### Mock Processor

```go
// testing/mock_processor.go
package testing

type MockPaymentProcessor struct {
    Balance      float64
    Transactions []string
}

func NewMockPaymentProcessor() *MockPaymentProcessor {
    return &MockPaymentProcessor{
        Balance:      100.0,
        Transactions: make([]string, 0),
    }
}

func (m *MockPaymentProcessor) CreatePaymentTransaction(req PaymentRequest) (*Transaction, error) {
    return &Transaction{Hash: "mock_tx"}, nil
}

func (m *MockPaymentProcessor) SignAndSendTransaction(tx *Transaction) (string, error) {
    txHash := fmt.Sprintf("mock_tx_%d", len(m.Transactions))
    m.Transactions = append(m.Transactions, txHash)
    return txHash, nil
}

func (m *MockPaymentProcessor) VerifyTransaction(hash string) (bool, error) {
    return true, nil
}

func (m *MockPaymentProcessor) GetTokenBalance() (float64, error) {
    return m.Balance, nil
}
```

### Testing HTTP Handler

```go
// handler_test.go
package main

import (
    "net/http"
    "net/http/httptest"
    "testing"
    "github.com/stretchr/testify/assert"
)

func TestPremiumEndpoint(t *testing.T) {
    handler := setupHandler()

    t.Run("Returns 402 without payment", func(t *testing.T) {
        req := httptest.NewRequest("GET", "/premium", nil)
        w := httptest.NewRecorder()

        handler.ServeHTTP(w, req)

        assert.Equal(t, http.StatusPaymentRequired, w.Code)
        assert.Equal(t, "true", w.Header().Get("X-Payment-Required"))
    })

    t.Run("Returns 200 with payment", func(t *testing.T) {
        req := httptest.NewRequest("GET", "/premium", nil)
        req.Header.Set("X-Payment-Authorization", "transactionHash=mock_tx")
        w := httptest.NewRecorder()

        handler.ServeHTTP(w, req)

        assert.Equal(t, http.StatusOK, w.Code)
    })
}
```

---

## Rust Testing

### Mock Processor

```rust
// src/testing/mock_processor.rs
pub struct MockPaymentProcessor {
    pub balance: f64,
    pub transactions: Vec<String>,
}

impl MockPaymentProcessor {
    pub fn new() -> Self {
        Self {
            balance: 100.0,
            transactions: Vec::new(),
        }
    }
}

impl PaymentProcessor for MockPaymentProcessor {
    async fn verify_transaction(&self, _hash: &str) -> Result<bool> {
        Ok(true)
    }

    async fn get_token_balance(&self) -> Result<f64> {
        Ok(self.balance)
    }
}
```

### Testing Rocket Routes

```rust
// tests/rocket_test.rs
#[cfg(test)]
mod tests {
    use rocket::local::blocking::Client;
    use rocket::http::Status;

    #[test]
    fn test_premium_endpoint_no_payment() {
        let client = Client::tracked(rocket()).unwrap();
        let response = client.get("/premium").dispatch();

        assert_eq!(response.status(), Status::PaymentRequired);
        assert_eq!(
            response.headers().get_one("X-Payment-Required"),
            Some("true")
        );
    }

    #[test]
    fn test_premium_endpoint_with_payment() {
        let client = Client::tracked(rocket()).unwrap();
        let response = client
            .get("/premium")
            .header(Header::new(
                "X-Payment-Authorization",
                "transactionHash=mock_tx"
            ))
            .dispatch();

        assert_eq!(response.status(), Status::Ok);
    }
}
```

---

## Best Practices

### 1. Isolated Tests

```python
# Good: Each test is independent
def test_payment_success():
    processor = MockSolanaPaymentProcessor()
    # Test logic

def test_payment_failure():
    processor = MockSolanaPaymentProcessor()
    # Test logic

# Bad: Shared state between tests
processor = MockSolanaPaymentProcessor()  # Global

def test_payment_success():
    # Uses global processor

def test_payment_failure():
    # Uses same global processor
```

### 2. Test Coverage

Ensure you test:
- ✅ 402 response format
- ✅ Payment verification
- ✅ Error handling (insufficient funds, expired requests, etc.)
- ✅ Transaction verification
- ✅ Edge cases (invalid headers, malformed requests)

### 3. Integration Tests

```python
@pytest.mark.integration
async def test_full_payment_flow():
    """Test complete flow from 402 to successful payment"""
    # 1. Start test server
    server = TestServer()
    server.start(port=8402)

    # 2. Create client with mock processor
    client = X402AutoClient(keypair)
    client.client.processor = MockSolanaPaymentProcessor()

    # 3. Make request
    response = await client.fetch("http://localhost:8402/premium")

    # 4. Verify
    assert response.status_code == 200
    assert "data" in response.json()

    # 5. Cleanup
    server.stop()
```

### 4. CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -e ".[dev]"

      - name: Run tests
        run: |
          pytest tests/ -v --cov=openlibx402_core

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Common Testing Patterns

### Mocking RPC Responses

```python
import responses

@responses.activate
def test_transaction_verification():
    # Mock Solana RPC response
    responses.add(
        responses.POST,
        "https://api.devnet.solana.com",
        json={
            "result": {
                "meta": {"err": None},
                "transaction": {...}
            }
        },
        status=200
    )

    # Test verification
    processor = SolanaPaymentProcessor(rpc_url="...")
    is_valid = await processor.verify_transaction("tx_hash")
    assert is_valid
```

### Parameterized Tests

```python
@pytest.mark.parametrize("amount,expected", [
    ("0.10", True),
    ("1.00", True),
    ("0.001", True),
    ("invalid", False),
])
def test_payment_amounts(amount, expected):
    result = validate_amount(amount)
    assert result == expected
```

---

## See Also

- [Production Deployment Guide](production.md)
- [Troubleshooting Guide](troubleshooting.md)
- [Technical Specification](../openlibx402-technical-spec.md)

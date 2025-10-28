# Implementation Guide: OpenLibX402

## Project Context

You are building **OpenLibX402**, a library ecosystem that implements the X402 payment protocol. X402 enables AI agents and web services to autonomously pay for API access using HTTP 402 "Payment Required" status code and Solana blockchain for instant, low-cost micropayments.

**Key Protocol Concepts:**
1. API returns HTTP 402 with payment details when request lacks payment
2. Client creates and broadcasts Solana transaction
3. Client retries request with payment authorization header
4. Server verifies payment and returns requested data

**Your Task:** Implement the complete OpenLibX402 library ecosystem as specified in the [Technical Specification](openlibx402-technical-spec.md).

---

## Phase 1 Implementation Priority

Build in this order:

1. **openlibx402-core** (Python)
2. **openlibx402-fastapi** (Python)  
3. **openlibx402-client** (Python)
4. **openlibx402-langchain** (Python)
5. **openlibx402-langgraph** (Python)
6. **Example implementations**

Then repeat for TypeScript equivalents.

---

## Project Structure

Create the following directory structure:

```
openlibx402/
├── README.md
├── LICENSE
├── .gitignore
├── docs/
│   └── (documentation files)
├── packages/
│   ├── python/
│   │   ├── openlibx402-core/
│   │   │   ├── pyproject.toml
│   │   │   ├── README.md
│   │   │   ├── openlibx402_core/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── models.py              # PaymentRequest, PaymentAuthorization
│   │   │   │   ├── solana_processor.py    # SolanaPaymentProcessor
│   │   │   │   ├── errors.py              # All exception classes
│   │   │   │   └── utils.py               # Helper functions
│   │   │   └── tests/
│   │   │       ├── __init__.py
│   │   │       ├── test_models.py
│   │   │       ├── test_solana.py
│   │   │       └── test_integration.py
│   │   │
│   │   ├── openlibx402-fastapi/
│   │   │   ├── pyproject.toml
│   │   │   ├── README.md
│   │   │   ├── openlibx402_fastapi/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── middleware.py          # X402PaymentMiddleware
│   │   │   │   ├── decorators.py          # @payment_required decorator
│   │   │   │   ├── dependencies.py        # verify_payment dependency
│   │   │   │   ├── config.py              # X402Config
│   │   │   │   └── responses.py           # build_402_response
│   │   │   └── tests/
│   │   │       ├── __init__.py
│   │   │       └── test_middleware.py
│   │   │
│   │   ├── openlibx402-client/
│   │   │   ├── pyproject.toml
│   │   │   ├── README.md
│   │   │   ├── openlibx402_client/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── explicit.py            # X402Client (explicit control)
│   │   │   │   ├── implicit.py            # X402AutoClient (auto-payment)
│   │   │   │   └── retry.py               # RetryConfig, retry logic
│   │   │   └── tests/
│   │   │
│   │   ├── openlibx402-langchain/
│   │   │   ├── pyproject.toml
│   │   │   ├── README.md
│   │   │   ├── openlibx402_langchain/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── tools.py               # X402PaymentTool
│   │   │   │   ├── requests.py            # X402RequestsWrapper
│   │   │   │   └── utils.py               # create_x402_agent
│   │   │   └── tests/
│   │   │
│   │   └── openlibx402-langgraph/
│   │       ├── pyproject.toml
│   │       ├── README.md
│   │       ├── openlibx402_langgraph/
│   │       │   ├── __init__.py
│   │       │   ├── nodes.py               # payment_node
│   │       │   ├── edges.py               # check_payment_required
│   │       │   └── utils.py               # helper functions
│   │       └── tests/
│   │
│   └── typescript/
│       └── (similar structure for TS packages)
│
└── examples/
    ├── python/
    │   ├── fastapi-server/
    │   │   ├── main.py
    │   │   ├── requirements.txt
    │   │   └── README.md
    │   ├── langchain-agent/
    │   │   ├── main.py
    │   │   ├── requirements.txt
    │   │   └── README.md
    │   └── langgraph-workflow/
    │       ├── main.py
    │       ├── requirements.txt
    │       └── README.md
    └── typescript/
        └── (TS examples)
```

---

## Implementation Guidelines

### 1. Core Dependencies

**Python packages:**
```toml
# openlibx402-core
dependencies = [
    "solana>=0.34.0",
    "solders>=0.21.0",
    "httpx>=0.24.0",
    "pydantic>=2.0.0",
]

# openlibx402-fastapi
dependencies = [
    "openlibx402-core>=0.1.0",
    "fastapi>=0.100.0",
]

# openlibx402-client
dependencies = [
    "openlibx402-core>=0.1.0",
    "httpx>=0.24.0",
]

# openlibx402-langchain
dependencies = [
    "openlibx402-core>=0.1.0",
    "openlibx402-client>=0.1.0",
    "langchain>=0.1.0",
]

# openlibx402-langgraph
dependencies = [
    "openlibx402-core>=0.1.0",
    "openlibx402-client>=0.1.0",
    "langgraph>=0.0.20",
]
```

**TypeScript packages:**
```json
{
  "dependencies": {
    "@solana/web3.js": "^1.87.0",
    "@solana/spl-token": "^0.4.0",
    "axios": "^1.6.0"
  }
}
```

### 2. Solana Integration Details

**Key Solana Concepts:**
- Use `solana-py` library for Python, `@solana/web3.js` for TypeScript
- Connect to Solana RPC: `https://api.devnet.solana.com` (devnet) or `https://api.mainnet-beta.solana.com` (mainnet)
- Use SPL Token program for token transfers (USDC is an SPL token)
- Transaction structure:
  1. Get recent blockhash
  2. Create transfer instruction
  3. Build transaction with instructions
  4. Sign with keypair
  5. Send and confirm

**Python Example (Reference):**
```python
from solana.rpc.async_api import AsyncClient
from solana.transaction import Transaction
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.system_program import TransferParams, transfer
from spl.token.instructions import (
    get_associated_token_address,
    transfer_checked,
    TransferCheckedParams,
)
from spl.token.constants import TOKEN_PROGRAM_ID

async def create_spl_transfer(
    client: AsyncClient,
    sender_keypair: Keypair,
    recipient: str,
    token_mint: str,
    amount: int,  # in smallest units (lamports for SOL, micro-USDC for USDC)
    decimals: int = 6,  # USDC has 6 decimals
) -> Transaction:
    """Create SPL token transfer transaction"""
    
    # Get associated token accounts
    sender_ata = get_associated_token_address(
        sender_keypair.pubkey(),
        Pubkey.from_string(token_mint)
    )
    recipient_ata = get_associated_token_address(
        Pubkey.from_string(recipient),
        Pubkey.from_string(token_mint)
    )
    
    # Create transfer instruction
    transfer_ix = transfer_checked(
        TransferCheckedParams(
            program_id=TOKEN_PROGRAM_ID,
            source=sender_ata,
            mint=Pubkey.from_string(token_mint),
            dest=recipient_ata,
            owner=sender_keypair.pubkey(),
            amount=amount,
            decimals=decimals,
        )
    )
    
    # Get recent blockhash
    recent_blockhash = (await client.get_latest_blockhash()).value.blockhash
    
    # Build transaction
    tx = Transaction()
    tx.add(transfer_ix)
    tx.recent_blockhash = recent_blockhash
    tx.fee_payer = sender_keypair.pubkey()
    
    return tx
```

**Important Notes:**
- USDC on Solana has 6 decimals (1 USDC = 1,000,000 micro-USDC)
- Always check wallet has associated token account (ATA) before transfer
- Use `get_associated_token_address` to derive ATA addresses
- Transaction fees are paid in SOL (lamports)
- Always verify transaction success after sending

**Devnet USDC Mint Address:** Use `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` for testing

### 3. HTTP 402 Response Format

The 402 response should follow this exact structure:

```json
{
  "maxAmountRequired": "0.10",
  "assetType": "SPL",
  "assetAddress": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  "paymentAddress": "FPxxx...xxxxx",
  "network": "solana-devnet",
  "expiresAt": "2025-05-06T10:10:00Z",
  "nonce": "random_nonce_string",
  "paymentId": "payment_id_string",
  "resource": "/api/premium-data",
  "description": "Access to premium market data"
}
```

**Response Headers:**
```
HTTP/1.1 402 Payment Required
Content-Type: application/json
X-Payment-Required: true
X-Payment-Protocol: x402
```

### 4. Payment Authorization Header

When retrying with payment, client includes:

```
X-Payment-Authorization: eyJwYXltZW50SWQiOi...base64_encoded_json...
```

**Decoded content:**
```json
{
  "paymentId": "payment_id_from_402_response",
  "actualAmount": "0.10",
  "paymentAddress": "FPxxx...xxxxx",
  "assetAddress": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  "network": "solana-devnet",
  "timestamp": "2025-05-06T10:05:00Z",
  "signature": "solana_transaction_signature",
  "publicKey": "payer_public_key",
  "transactionHash": "solana_tx_hash"
}
```

### 5. Error Handling Best Practices

**Always handle these scenarios:**
- Wallet has insufficient funds → `InsufficientFundsError`
- Payment request expired → `PaymentExpiredError`
- Network/RPC errors → `TransactionBroadcastError`
- Invalid payment format → `InvalidPaymentRequestError`
- Transaction verification failed → `PaymentVerificationError`

**Error response structure:**
```python
class X402Error(Exception):
    def __init__(self, message: str, code: str, details: dict = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)
    
    def to_dict(self) -> dict:
        return {
            "error": self.code,
            "message": self.message,
            "details": self.details,
        }
```

### 6. Testing Guidelines

**Unit Tests:**
- Test payment request parsing
- Test payment authorization creation
- Test error handling
- Mock Solana RPC calls

**Integration Tests:**
- Test full payment flow with mock blockchain
- Test FastAPI middleware with test server
- Test LangChain integration with mock APIs

**Example Test Structure:**
```python
import pytest
from unittest.mock import AsyncMock, MagicMock
from openlibx402_core import PaymentRequest, SolanaPaymentProcessor

@pytest.mark.asyncio
async def test_payment_request_parsing():
    """Test parsing 402 response"""
    response_data = {
        "maxAmountRequired": "0.10",
        "assetType": "SPL",
        "assetAddress": "token_mint_address",
        "paymentAddress": "recipient_address",
        "network": "solana-devnet",
        "expiresAt": "2025-05-06T10:10:00Z",
        "nonce": "test_nonce",
        "paymentId": "test_payment_id",
        "resource": "/test",
    }
    
    request = PaymentRequest.from_dict(response_data)
    assert request.max_amount_required == "0.10"
    assert request.network == "solana-devnet"
    assert not request.is_expired()

@pytest.mark.asyncio
async def test_insufficient_funds():
    """Test insufficient funds error"""
    processor = SolanaPaymentProcessor("https://api.devnet.solana.com")
    processor.get_token_balance = AsyncMock(return_value=0.05)
    
    # Should raise InsufficientFundsError when trying to pay 0.10
    # with only 0.05 balance
```

### 7. Documentation Requirements

Each package must have:

**README.md with:**
- Brief description
- Installation instructions
- Quick start example
- API reference link
- Link to full documentation

**Docstrings:**
- Use Google-style docstrings for Python
- Use TSDoc for TypeScript
- Document all public classes, methods, and functions
- Include examples in docstrings

**Example Python docstring:**
```python
async def create_payment(
    self,
    request: PaymentRequest,
    amount: Optional[str] = None,
) -> PaymentAuthorization:
    """
    Create and broadcast payment for a payment request.
    
    Args:
        request: Payment request from 402 response
        amount: Optional custom amount (defaults to max_amount_required)
    
    Returns:
        PaymentAuthorization with transaction hash
    
    Raises:
        PaymentExpiredError: If payment request has expired
        InsufficientFundsError: If wallet lacks sufficient funds
        TransactionBroadcastError: If transaction broadcast fails
    
    Example:
        >>> client = X402Client(wallet_keypair)
        >>> response = await client.get("https://api.example.com/data")
        >>> if client.payment_required(response):
        ...     payment_request = client.parse_payment_request(response)
        ...     auth = await client.create_payment(payment_request)
        ...     response = await client.get(url, payment=auth)
    """
```

### 8. Code Quality Standards

**Python:**
- Use type hints everywhere
- Follow PEP 8 style guide
- Use Black for formatting
- Use mypy for type checking
- Maximum line length: 88 characters (Black default)
- Use async/await for I/O operations

**TypeScript:**
- Use strict TypeScript mode
- Follow ESLint rules
- Use Prettier for formatting
- Export all public interfaces
- Use async/await for promises

### 9. Security Considerations

**Critical Security Rules:**

1. **Never log private keys or keypair data**
   ```python
   # BAD
   logger.info(f"Using keypair: {keypair}")
   
   # GOOD
   logger.info(f"Using wallet: {keypair.pubkey()}")
   ```

2. **Validate all payment fields**
   ```python
   def verify_payment(auth: PaymentAuthorization, request: PaymentRequest) -> bool:
       # Check payment_id matches
       if auth.payment_id != request.payment_id:
           return False
       
       # Check amount is sufficient
       if float(auth.actual_amount) < float(request.max_amount_required):
           return False
       
       # Check not expired
       if request.is_expired():
           return False
       
       # Verify on-chain transaction
       return await verify_transaction_on_chain(auth.transaction_hash)
   ```

3. **Implement nonce/replay protection**
   - Store used payment_ids in cache (Redis)
   - Reject duplicate payment_ids
   - Set reasonable expiration (5-10 minutes)

4. **Use HTTPS in production**
   - Never send payment data over HTTP
   - Validate SSL certificates

### 10. Example Implementation Requirements

**FastAPI Server Example (`examples/python/fastapi-server/main.py`):**
- Demonstrate decorator approach
- Demonstrate dependency injection approach
- Include at least 2 different payment amounts
- Show error handling
- Include README with setup instructions

**LangChain Agent Example (`examples/python/langchain-agent/main.py`):**
- Use X402PaymentTool
- Use X402RequestsWrapper
- Show agent making multiple API calls
- Include conversation flow example

**LangGraph Workflow Example (`examples/python/langgraph-workflow/main.py`):**
- Use payment_node
- Show conditional edges based on payment status
- Include error handling paths
- Demonstrate retry logic

**Each example must include:**
- `requirements.txt` with all dependencies
- `README.md` with:
  - Prerequisites (wallet setup, devnet SOL)
  - Step-by-step setup instructions
  - How to run the example
  - Expected output
- `.env.example` for configuration
- Wallet setup instructions

---

## Development Workflow

### Step-by-Step Implementation

**Step 1: Core Package**
```bash
cd packages/python/openlibx402-core
```

1. Implement `models.py`:
   - PaymentRequest dataclass with all fields
   - PaymentAuthorization dataclass
   - from_dict/to_dict methods
   - is_expired() method

2. Implement `errors.py`:
   - All exception classes
   - ERROR_CODES dictionary

3. Implement `solana_processor.py`:
   - SolanaPaymentProcessor class
   - create_payment_transaction()
   - sign_and_send_transaction()
   - verify_transaction()
   - get_token_balance()

4. Write tests in `tests/`

5. Create `pyproject.toml` with dependencies

6. Test installation: `pip install -e .`

**Step 2: FastAPI Package**
```bash
cd packages/python/openlibx402-fastapi
```

1. Implement `middleware.py`:
   - X402PaymentMiddleware class
   - Request interception logic
   - 402 response generation

2. Implement `decorators.py`:
   - @payment_required decorator
   - Integration with FastAPI routes

3. Implement `dependencies.py`:
   - verify_payment() function
   - verify_payment_factory()

4. Implement `responses.py`:
   - build_402_response()

5. Implement `config.py`:
   - X402Config model
   - init_x402() / get_config()

6. Write tests

7. Test with example server

**Step 3: Client Package**
```bash
cd packages/python/openlibx402-client
```

1. Implement `explicit.py`:
   - X402Client class
   - get/post/put/delete methods
   - payment_required() check
   - parse_payment_request()
   - create_payment()

2. Implement `implicit.py`:
   - X402AutoClient class
   - fetch() with auto-retry
   - _make_request() internal method

3. Implement `retry.py`:
   - RetryConfig class
   - Retry logic

4. Write tests

**Step 4: LangChain Package**

1. Implement `tools.py`:
   - X402PaymentTool class
   - _run() and _arun() methods

2. Implement `requests.py`:
   - X402RequestsWrapper class
   - Override get/post methods

3. Implement `utils.py`:
   - create_x402_agent() helper

4. Write tests

**Step 5: LangGraph Package**

1. Implement `nodes.py`:
   - payment_node()
   - fetch_with_payment_node()

2. Implement `edges.py`:
   - check_payment_required()

3. Implement `utils.py`:
   - Helper functions

4. Write tests

**Step 6: Examples**

1. Create FastAPI server example
2. Create LangChain agent example
3. Create LangGraph workflow example
4. Test all examples end-to-end

**Step 7: Documentation**

1. Write comprehensive README.md for each package
2. Create docs/ folder with guides
3. Generate API reference documentation
4. Create getting-started guide

---

## Common Pitfalls to Avoid

1. **Don't hardcode RPC URLs** - Make them configurable
2. **Don't ignore transaction confirmation** - Always wait for confirmation
3. **Don't skip error handling** - Every async call can fail
4. **Don't forget type hints** - They're required for Python packages
5. **Don't use sync code for I/O** - Use async/await
6. **Don't skip input validation** - Validate all payment fields
7. **Don't log sensitive data** - Never log private keys
8. **Don't forget expiration checks** - Always validate timestamps
9. **Don't assume ATAs exist** - Check/create associated token accounts
10. **Don't skip testing** - Write tests as you build

---

## Verification Checklist

Before considering implementation complete:

- [ ] All packages install successfully
- [ ] All tests pass
- [ ] Examples run without errors
- [ ] Documentation is complete
- [ ] Type checking passes (mypy for Python, tsc for TypeScript)
- [ ] Linting passes (black, eslint)
- [ ] No hardcoded secrets or private keys
- [ ] Error messages are clear and helpful
- [ ] README files are comprehensive
- [ ] All public APIs have docstrings
- [ ] Integration tests pass end-to-end
- [ ] Code follows style guidelines
- [ ] Dependencies are properly declared
- [ ] Version numbers are consistent

---

## Getting Help

Reference these resources:
- **Solana Python Docs:** https://michaelhly.github.io/solana-py/
- **Solana Web3.js Docs:** https://solana-labs.github.io/solana-web3.js/
- **SPL Token Python:** https://spl.solana.com/token
- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **LangChain Docs:** https://python.langchain.com/
- **LangGraph Docs:** https://langchain-ai.github.io/langgraph/

---

## Final Notes

This is a production-quality library that will be used by developers to build AI agents and APIs with X402 payment capabilities. Focus on:

1. **Reliability** - Handle errors gracefully
2. **Security** - Protect private keys and validate all inputs
3. **Developer Experience** - Make it easy to use with clear docs
4. **Performance** - Use async operations efficiently
5. **Testing** - Comprehensive test coverage

The goal is to make X402 payments as easy as adding one decorator or one line of code to existing APIs and agents.

Good luck building! 🚀

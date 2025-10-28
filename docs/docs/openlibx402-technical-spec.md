# OpenLibx402 Technical Specification

## Project Overview

OpenLibx402 is a library ecosystem that implements the X402 protocol for enabling autonomous, frictionless payments in AI agents and web APIs. The protocol leverages HTTP 402 "Payment Required" status code and Solana blockchain for instant, low-cost transactions.

## Core Principles

1. **Machine-Native Payments**: Enable AI agents to autonomously pay for API access without human intervention
2. **Pay-Per-Use**: Support micropayments with near-zero transaction costs
3. **Developer-Friendly**: Simple integration with one-line middleware
4. **Blockchain-Agnostic Design**: Start with Solana, architect for future chain support
5. **Dual API Approach**: Support both explicit and implicit payment handling

---

## Project Structure

```
openlibx402/
├── packages/
│   ├── core/                      # Core protocol implementation
│   │   ├── python/
│   │   │   └── openlibx402-core/
│   │   └── typescript/
│   │       └── @openlibx402/core
│   │
│   ├── server/                    # Server-side libraries
│   │   ├── python/
│   │   │   └── openlibx402-fastapi/
│   │   └── typescript/
│   │       ├── @openlibx402/express
│   │       ├── @openlibx402/nextjs
│   │       └── @openlibx402/hono
│   │
│   ├── client/                    # Client-side libraries
│   │   ├── python/
│   │   │   └── openlibx402-client/
│   │   └── typescript/
│   │       └── @openlibx402/client
│   │
│   └── integrations/              # Framework integrations
│       ├── python/
│       │   ├── openlibx402-langchain/
│       │   └── openlibx402-langgraph/
│       └── typescript/
│           ├── @openlibx402/langchain
│           └── @openlibx402/langgraph
│
├── examples/                      # Example implementations
│   ├── fastapi-server/
│   ├── langchain-agent/
│   ├── langgraph-workflow/
│   └── fullstack-demo/
│
└── docs/
    ├── getting-started.md
    ├── api-reference.md
    └── integration-guides/
```

---

## 1. Core Protocol Implementation

### Package: `openlibx402-core` (Python) / `@openlibx402/core` (TypeScript)

#### Purpose
Core protocol logic for X402 payment flow, independent of any framework.

#### Key Components

##### 1.1 Payment Request Structure

```python
# Python
from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class PaymentRequest:
    """Represents an X402 payment request (402 response)"""
    max_amount_required: str           # Amount in token units (e.g., "0.10")
    asset_type: str                    # "SPL" for Solana tokens
    asset_address: str                 # Token mint address
    payment_address: str               # Recipient's wallet address
    network: str                       # "solana-devnet" | "solana-mainnet"
    expires_at: datetime               # Expiration timestamp
    nonce: str                         # Unique identifier for replay protection
    payment_id: str                    # Unique payment request ID
    resource: str                      # API endpoint being accessed
    description: Optional[str] = None  # Human-readable description
    
    def to_dict(self) -> dict:
        """Convert to JSON-serializable dict"""
        pass
    
    @classmethod
    def from_dict(cls, data: dict) -> 'PaymentRequest':
        """Parse from 402 response JSON"""
        pass
    
    def is_expired(self) -> bool:
        """Check if payment request has expired"""
        pass
```

```typescript
// TypeScript
export interface PaymentRequest {
  maxAmountRequired: string;
  assetType: string;
  assetAddress: string;
  paymentAddress: string;
  network: string;
  expiresAt: Date;
  nonce: string;
  paymentId: string;
  resource: string;
  description?: string;
}

export class PaymentRequestParser {
  static parse(response: Response): PaymentRequest;
  static isExpired(request: PaymentRequest): boolean;
  static toJSON(request: PaymentRequest): string;
}
```

##### 1.2 Payment Authorization

```python
@dataclass
class PaymentAuthorization:
    """Signed payment authorization to be sent with retry request"""
    payment_id: str                    # From payment request
    actual_amount: str                 # Amount being paid (≤ max_amount_required)
    payment_address: str               # Recipient address
    asset_address: str                 # Token mint address
    network: str                       # Blockchain network
    timestamp: datetime                # Authorization timestamp
    signature: str                     # Solana signature
    public_key: str                    # Payer's public key
    transaction_hash: Optional[str]    # On-chain tx hash (after broadcast)
    
    def to_header_value(self) -> str:
        """Encode as X-Payment-Authorization header value"""
        pass
    
    @classmethod
    def from_header(cls, header_value: str) -> 'PaymentAuthorization':
        """Parse from request header"""
        pass
```

```typescript
export interface PaymentAuthorization {
  paymentId: string;
  actualAmount: string;
  paymentAddress: string;
  assetAddress: string;
  network: string;
  timestamp: Date;
  signature: string;
  publicKey: string;
  transactionHash?: string;
}

export class PaymentAuthorizationHandler {
  static toHeader(auth: PaymentAuthorization): string;
  static fromHeader(headerValue: string): PaymentAuthorization;
  static verify(auth: PaymentAuthorization, request: PaymentRequest): boolean;
}
```

##### 1.3 Solana Integration

```python
from solana.rpc.async_api import AsyncClient
from solana.transaction import Transaction
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from spl.token.instructions import transfer_checked, TransferCheckedParams

class SolanaPaymentProcessor:
    """Handles Solana blockchain operations"""
    
    def __init__(self, rpc_url: str, keypair: Optional[Keypair] = None):
        self.client = AsyncClient(rpc_url)
        self.keypair = keypair
    
    async def create_payment_transaction(
        self,
        request: PaymentRequest,
        amount: str,
        payer_keypair: Keypair
    ) -> Transaction:
        """Create a Solana transaction for the payment"""
        pass
    
    async def sign_and_send_transaction(
        self,
        transaction: Transaction,
        keypair: Keypair
    ) -> str:
        """Sign and broadcast transaction, return tx hash"""
        pass
    
    async def verify_transaction(
        self,
        transaction_hash: str,
        expected_recipient: str,
        expected_amount: str,
        expected_token_mint: str
    ) -> bool:
        """Verify a transaction was successful and matches expectations"""
        pass
    
    async def get_token_balance(
        self,
        wallet_address: str,
        token_mint: str
    ) -> float:
        """Get token balance for a wallet"""
        pass
```

```typescript
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferCheckedInstruction } from '@solana/spl-token';

export class SolanaPaymentProcessor {
  private connection: Connection;
  private keypair?: Keypair;
  
  constructor(rpcUrl: string, keypair?: Keypair);
  
  async createPaymentTransaction(
    request: PaymentRequest,
    amount: string,
    payerKeypair: Keypair
  ): Promise<Transaction>;
  
  async signAndSendTransaction(
    transaction: Transaction,
    keypair: Keypair
  ): Promise<string>;
  
  async verifyTransaction(
    transactionHash: string,
    expectedRecipient: string,
    expectedAmount: string,
    expectedTokenMint: string
  ): Promise<boolean>;
  
  async getTokenBalance(
    walletAddress: string,
    tokenMint: string
  ): Promise<number>;
}
```

##### 1.4 Error Handling

```python
class X402Error(Exception):
    """Base exception for X402 protocol errors"""
    code: str
    message: str
    details: Optional[dict]

class PaymentRequiredError(X402Error):
    """Raised when 402 response received"""
    code = "PAYMENT_REQUIRED"
    payment_request: PaymentRequest

class PaymentExpiredError(X402Error):
    """Payment request has expired"""
    code = "PAYMENT_EXPIRED"

class InsufficientFundsError(X402Error):
    """Wallet has insufficient funds"""
    code = "INSUFFICIENT_FUNDS"
    required_amount: str
    available_amount: str

class PaymentVerificationError(X402Error):
    """Payment verification failed"""
    code = "PAYMENT_VERIFICATION_FAILED"

class TransactionBroadcastError(X402Error):
    """Failed to broadcast transaction"""
    code = "TRANSACTION_BROADCAST_FAILED"

class InvalidPaymentRequestError(X402Error):
    """Payment request format is invalid"""
    code = "INVALID_PAYMENT_REQUEST"
```

```typescript
export class X402Error extends Error {
  code: string;
  details?: Record<string, any>;
  constructor(message: string, code: string, details?: Record<string, any>);
}

export class PaymentRequiredError extends X402Error {
  paymentRequest: PaymentRequest;
  constructor(paymentRequest: PaymentRequest);
}

export class PaymentExpiredError extends X402Error {
  constructor(paymentRequest: PaymentRequest);
}

export class InsufficientFundsError extends X402Error {
  requiredAmount: string;
  availableAmount: string;
  constructor(required: string, available: string);
}

export class PaymentVerificationError extends X402Error {
  constructor(reason: string);
}

export class TransactionBroadcastError extends X402Error {
  constructor(reason: string);
}

export class InvalidPaymentRequestError extends X402Error {
  constructor(reason: string);
}
```

---

## 2. Server-Side Implementation

### Package: `openlibx402-fastapi` (Python)

#### Purpose
FastAPI middleware for accepting X402 payments on API endpoints.

#### Key Components

##### 2.1 Middleware

```python
from fastapi import Request, Response
from typing import Callable, Optional
from datetime import datetime, timedelta
import secrets

class X402PaymentMiddleware:
    """FastAPI middleware for X402 payment handling"""
    
    def __init__(
        self,
        payment_address: str,           # Recipient wallet address
        token_mint: str,                # SPL token mint address (USDC)
        network: str = "solana-devnet", # Network identifier
        rpc_url: str = None,            # Solana RPC endpoint
        payment_timeout: int = 300,     # Payment validity in seconds
        auto_verify: bool = True,       # Auto-verify payments
    ):
        self.payment_address = payment_address
        self.token_mint = token_mint
        self.network = network
        self.rpc_url = rpc_url or self._default_rpc_url(network)
        self.payment_timeout = payment_timeout
        self.auto_verify = auto_verify
        self.processor = SolanaPaymentProcessor(self.rpc_url)
    
    async def __call__(
        self,
        request: Request,
        call_next: Callable,
    ) -> Response:
        """Process request, check for payment, return 402 if needed"""
        pass

def payment_required(
    amount: str,
    payment_address: str,
    token_mint: str,
    network: str = "solana-devnet",
    description: Optional[str] = None,
    expires_in: int = 300,
):
    """
    Decorator for FastAPI endpoints requiring payment
    
    Usage:
        @app.get("/premium-data")
        @payment_required(
            amount="0.10",
            payment_address="FPxxx...",
            token_mint="USDC_MINT_ADDRESS"
        )
        async def get_premium_data():
            return {"data": "Premium content"}
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Check for payment authorization header
            # If missing, return 402 response
            # If present, verify payment
            # If valid, call original function
            pass
        return wrapper
    return decorator
```

##### 2.2 Dependency Injection Pattern

```python
from fastapi import Depends, HTTPException

async def verify_payment(
    request: Request,
    required_amount: str,
    payment_address: str,
    token_mint: str,
) -> PaymentAuthorization:
    """
    FastAPI dependency for payment verification
    
    Usage:
        @app.get("/premium-data")
        async def get_premium_data(
            payment: PaymentAuthorization = Depends(
                verify_payment_factory("0.10", WALLET, TOKEN)
            )
        ):
            return {"data": "Premium content"}
    """
    pass

def verify_payment_factory(
    amount: str,
    payment_address: str,
    token_mint: str,
    network: str = "solana-devnet",
):
    """Factory for creating payment verification dependency"""
    async def _verify(request: Request) -> PaymentAuthorization:
        return await verify_payment(
            request, amount, payment_address, token_mint
        )
    return _verify
```

##### 2.3 Configuration

```python
from pydantic import BaseModel

class X402Config(BaseModel):
    """Global X402 configuration"""
    payment_address: str
    token_mint: str
    network: str = "solana-devnet"
    rpc_url: Optional[str] = None
    default_amount: str = "0.01"
    payment_timeout: int = 300
    auto_verify: bool = True
    
    class Config:
        env_prefix = "X402_"  # Load from X402_* environment variables

# Singleton configuration
_config: Optional[X402Config] = None

def init_x402(config: X402Config):
    """Initialize global X402 configuration"""
    global _config
    _config = config

def get_config() -> X402Config:
    """Get global X402 configuration"""
    if _config is None:
        raise RuntimeError("X402 not initialized. Call init_x402() first.")
    return _config
```

##### 2.4 Response Builder

```python
from fastapi.responses import JSONResponse

def build_402_response(
    amount: str,
    payment_address: str,
    token_mint: str,
    network: str,
    resource: str,
    description: Optional[str] = None,
    expires_in: int = 300,
) -> JSONResponse:
    """Build a properly formatted 402 Payment Required response"""
    
    payment_request = PaymentRequest(
        max_amount_required=amount,
        asset_type="SPL",
        asset_address=token_mint,
        payment_address=payment_address,
        network=network,
        expires_at=datetime.utcnow() + timedelta(seconds=expires_in),
        nonce=secrets.token_urlsafe(32),
        payment_id=secrets.token_urlsafe(16),
        resource=resource,
        description=description,
    )
    
    return JSONResponse(
        status_code=402,
        content=payment_request.to_dict(),
        headers={
            "X-Payment-Required": "true",
            "X-Payment-Protocol": "x402",
        }
    )
```

---

## 3. Client-Side Implementation

### Package: `openlibx402-client` (Python) / `@openlibx402/client` (TypeScript)

#### Purpose
Client libraries for making X402-enabled API calls with automatic payment handling.

#### Key Components

##### 3.1 Explicit Client (Manual Payment Control)

```python
from typing import Optional, Dict, Any
import httpx

class X402Client:
    """
    Explicit X402 client - developer controls payment flow
    
    Usage:
        client = X402Client(wallet_keypair)
        
        # Check if payment required
        response = await client.get("https://api.example.com/data")
        
        if client.payment_required(response):
            payment_request = client.parse_payment_request(response)
            
            # Make payment
            authorization = await client.create_payment(payment_request)
            
            # Retry with payment
            response = await client.get(
                "https://api.example.com/data",
                payment=authorization
            )
    """
    
    def __init__(
        self,
        wallet_keypair: Keypair,
        rpc_url: Optional[str] = None,
        http_client: Optional[httpx.AsyncClient] = None,
    ):
        self.wallet_keypair = wallet_keypair
        self.http_client = http_client or httpx.AsyncClient()
        self.processor = SolanaPaymentProcessor(
            rpc_url or "https://api.devnet.solana.com"
        )
    
    async def get(
        self,
        url: str,
        payment: Optional[PaymentAuthorization] = None,
        **kwargs
    ) -> httpx.Response:
        """Make GET request with optional payment"""
        headers = kwargs.get("headers", {})
        if payment:
            headers["X-Payment-Authorization"] = payment.to_header_value()
        kwargs["headers"] = headers
        return await self.http_client.get(url, **kwargs)
    
    async def post(
        self,
        url: str,
        payment: Optional[PaymentAuthorization] = None,
        **kwargs
    ) -> httpx.Response:
        """Make POST request with optional payment"""
        pass
    
    def payment_required(self, response: httpx.Response) -> bool:
        """Check if response requires payment"""
        return response.status_code == 402
    
    def parse_payment_request(
        self,
        response: httpx.Response
    ) -> PaymentRequest:
        """Parse payment request from 402 response"""
        if not self.payment_required(response):
            raise ValueError("Response does not require payment")
        return PaymentRequest.from_dict(response.json())
    
    async def create_payment(
        self,
        request: PaymentRequest,
        amount: Optional[str] = None,
    ) -> PaymentAuthorization:
        """
        Create and broadcast payment for a payment request
        
        Args:
            request: Payment request from 402 response
            amount: Optional custom amount (defaults to max_amount_required)
        
        Returns:
            PaymentAuthorization with transaction hash
        """
        # Validate request not expired
        if request.is_expired():
            raise PaymentExpiredError(request)
        
        # Use provided amount or max required
        pay_amount = amount or request.max_amount_required
        
        # Check sufficient balance
        balance = await self.processor.get_token_balance(
            str(self.wallet_keypair.pubkey()),
            request.asset_address
        )
        if balance < float(pay_amount):
            raise InsufficientFundsError(pay_amount, str(balance))
        
        # Create transaction
        tx = await self.processor.create_payment_transaction(
            request, pay_amount, self.wallet_keypair
        )
        
        # Sign and broadcast
        tx_hash = await self.processor.sign_and_send_transaction(
            tx, self.wallet_keypair
        )
        
        # Create authorization
        return PaymentAuthorization(
            payment_id=request.payment_id,
            actual_amount=pay_amount,
            payment_address=request.payment_address,
            asset_address=request.asset_address,
            network=request.network,
            timestamp=datetime.utcnow(),
            signature="",  # Solana signature
            public_key=str(self.wallet_keypair.pubkey()),
            transaction_hash=tx_hash,
        )
```

##### 3.2 Implicit Client (Automatic Payment)

```python
class X402AutoClient:
    """
    Implicit X402 client - automatically handles payment flow
    
    Usage:
        client = X402AutoClient(wallet_keypair)
        
        # Automatically detects 402 and pays
        response = await client.fetch("https://api.example.com/data")
        data = response.json()
    """
    
    def __init__(
        self,
        wallet_keypair: Keypair,
        rpc_url: Optional[str] = None,
        max_retries: int = 1,
        auto_retry: bool = True,
        max_payment_amount: Optional[str] = None,  # Safety limit
    ):
        self.client = X402Client(wallet_keypair, rpc_url)
        self.max_retries = max_retries
        self.auto_retry = auto_retry
        self.max_payment_amount = max_payment_amount
    
    async def fetch(
        self,
        url: str,
        method: str = "GET",
        auto_retry: Optional[bool] = None,
        **kwargs
    ) -> httpx.Response:
        """
        Make HTTP request with automatic payment handling
        
        Args:
            url: Request URL
            method: HTTP method
            auto_retry: Override instance auto_retry setting
            **kwargs: Additional arguments for httpx request
        
        Returns:
            Response after payment (if required)
        
        Raises:
            PaymentRequiredError: If auto_retry is False and 402 received
            InsufficientFundsError: If wallet lacks funds
            PaymentExpiredError: If payment request expired
        """
        should_retry = auto_retry if auto_retry is not None else self.auto_retry
        
        # Initial request
        response = await self._make_request(method, url, **kwargs)
        
        # Check if payment required
        if self.client.payment_required(response):
            if not should_retry:
                raise PaymentRequiredError(
                    self.client.parse_payment_request(response)
                )
            
            # Parse payment request
            payment_request = self.client.parse_payment_request(response)
            
            # Safety check
            if self.max_payment_amount:
                if float(payment_request.max_amount_required) > float(self.max_payment_amount):
                    raise ValueError(
                        f"Payment amount {payment_request.max_amount_required} "
                        f"exceeds max allowed {self.max_payment_amount}"
                    )
            
            # Create payment
            authorization = await self.client.create_payment(payment_request)
            
            # Retry with payment
            response = await self._make_request(
                method, url, payment=authorization, **kwargs
            )
        
        return response
    
    async def _make_request(
        self,
        method: str,
        url: str,
        payment: Optional[PaymentAuthorization] = None,
        **kwargs
    ) -> httpx.Response:
        """Internal method to make HTTP request"""
        if method.upper() == "GET":
            return await self.client.get(url, payment=payment, **kwargs)
        elif method.upper() == "POST":
            return await self.client.post(url, payment=payment, **kwargs)
        # ... other methods
    
    async def get(self, url: str, **kwargs) -> httpx.Response:
        """GET request with auto-payment"""
        return await self.fetch(url, method="GET", **kwargs)
    
    async def post(self, url: str, **kwargs) -> httpx.Response:
        """POST request with auto-payment"""
        return await self.fetch(url, method="POST", **kwargs)
```

```typescript
// TypeScript versions with similar structure

export class X402Client {
  // Explicit client implementation
}

export class X402AutoClient {
  // Implicit auto-payment client implementation
}
```

---

## 4. LangChain Integration

### Package: `openlibx402-langchain` (Python) / `@openlibx402/langchain` (TypeScript)

#### Purpose
Integrate X402 payments into LangChain agents via Tools and HTTP request middleware.

#### Key Components

##### 4.1 X402 Tool (For Agents)

```python
from langchain.tools import BaseTool
from pydantic import Field
from typing import Optional

class X402PaymentTool(BaseTool):
    """
    LangChain tool that allows agents to make payments for API access
    
    Usage:
        wallet_keypair = load_keypair()
        
        payment_tool = X402PaymentTool(
            wallet_keypair=wallet_keypair,
            name="pay_for_api",
            description="Make payment to access premium API data"
        )
        
        agent = initialize_agent(
            tools=[payment_tool, ...],
            llm=llm,
        )
    """
    
    name: str = "x402_payment"
    description: str = (
        "Make an X402 payment to access a paid API endpoint. "
        "Input should be a JSON string with 'url' and optional 'amount'. "
        "Returns the API response after successful payment."
    )
    
    wallet_keypair: Keypair = Field(exclude=True)
    rpc_url: Optional[str] = Field(default=None, exclude=True)
    max_payment: Optional[str] = Field(default="1.0", exclude=True)
    
    def _run(
        self,
        url: str,
        amount: Optional[str] = None,
        method: str = "GET",
        **kwargs
    ) -> str:
        """Synchronous run (calls async version)"""
        import asyncio
        return asyncio.run(self._arun(url, amount, method, **kwargs))
    
    async def _arun(
        self,
        url: str,
        amount: Optional[str] = None,
        method: str = "GET",
        **kwargs
    ) -> str:
        """
        Make paid API request
        
        Args:
            url: API endpoint URL
            amount: Optional payment amount override
            method: HTTP method
            **kwargs: Additional request parameters
        
        Returns:
            API response as string
        """
        client = X402AutoClient(
            wallet_keypair=self.wallet_keypair,
            rpc_url=self.rpc_url,
            max_payment_amount=self.max_payment,
        )
        
        try:
            response = await client.fetch(url, method=method, **kwargs)
            return response.text
        except X402Error as e:
            return f"Payment error: {e.code} - {e.message}"
```

##### 4.2 Request Middleware (Intercept All API Calls)

```python
from langchain.requests import RequestsWrapper
from typing import Dict, Any, Optional

class X402RequestsWrapper(RequestsWrapper):
    """
    Drop-in replacement for LangChain's RequestsWrapper with X402 support
    
    Usage:
        from langchain.agents import load_tools
        
        wallet_keypair = load_keypair()
        
        requests_wrapper = X402RequestsWrapper(
            wallet_keypair=wallet_keypair
        )
        
        # Use with LangChain tools that make HTTP requests
        tools = load_tools(
            ["requests_all"],
            llm=llm,
            requests_wrapper=requests_wrapper
        )
    """
    
    def __init__(
        self,
        wallet_keypair: Keypair,
        rpc_url: Optional[str] = None,
        max_payment: Optional[str] = "1.0",
        **kwargs
    ):
        super().__init__(**kwargs)
        self.client = X402AutoClient(
            wallet_keypair=wallet_keypair,
            rpc_url=rpc_url,
            max_payment_amount=max_payment,
        )
    
    async def aget(self, url: str, **kwargs) -> str:
        """Async GET with X402 support"""
        response = await self.client.get(url, **kwargs)
        return response.text
    
    async def apost(self, url: str, **kwargs) -> str:
        """Async POST with X402 support"""
        response = await self.client.post(url, **kwargs)
        return response.text
    
    def get(self, url: str, **kwargs) -> str:
        """Sync GET with X402 support"""
        import asyncio
        return asyncio.run(self.aget(url, **kwargs))
    
    def post(self, url: str, **kwargs) -> str:
        """Sync POST with X402 support"""
        import asyncio
        return asyncio.run(self.apost(url, **kwargs))
```

##### 4.3 Integration Utilities

```python
from langchain.chat_models import ChatOpenAI
from langchain.agents import initialize_agent, AgentType

def create_x402_agent(
    wallet_keypair: Keypair,
    llm: Optional[Any] = None,
    tools: Optional[list] = None,
    rpc_url: Optional[str] = None,
    max_payment: str = "1.0",
    **agent_kwargs
):
    """
    Convenience function to create LangChain agent with X402 support
    
    Usage:
        agent = create_x402_agent(
            wallet_keypair=my_keypair,
            llm=ChatOpenAI(),
            tools=[custom_tool_1, custom_tool_2],
            max_payment="5.0"
        )
        
        response = agent.run("Get me premium market data from api.example.com")
    """
    from langchain.agents import load_tools
    
    # Create X402-enabled requests wrapper
    requests_wrapper = X402RequestsWrapper(
        wallet_keypair=wallet_keypair,
        rpc_url=rpc_url,
        max_payment=max_payment,
    )
    
    # Load standard tools with X402 wrapper
    x402_tools = load_tools(
        ["requests_all"],
        llm=llm,
        requests_wrapper=requests_wrapper
    )
    
    # Add custom tools
    if tools:
        x402_tools.extend(tools)
    
    # Create agent
    agent = initialize_agent(
        tools=x402_tools,
        llm=llm or ChatOpenAI(),
        agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
        **agent_kwargs
    )
    
    return agent
```

---

## 5. LangGraph Integration

### Package: `openlibx402-langgraph` (Python) / `@openlibx402/langgraph` (TypeScript)

#### Purpose
Integrate X402 payments into LangGraph workflows as nodes and conditional edges.

#### Recommended Patterns

##### 5.1 Payment Node

```python
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from solders.keypair import Keypair

class AgentState(TypedDict):
    """State for LangGraph agent with payment support"""
    messages: list
    api_url: str
    api_response: str
    payment_required: bool
    payment_completed: bool
    payment_error: Optional[str]
    wallet_keypair: Keypair

def payment_node(state: AgentState) -> AgentState:
    """
    LangGraph node that handles X402 payment
    
    Usage in graph:
        workflow = StateGraph(AgentState)
        workflow.add_node("fetch_api", fetch_api_node)
        workflow.add_node("make_payment", payment_node)
        workflow.add_node("process_response", process_response_node)
        
        workflow.add_conditional_edges(
            "fetch_api",
            check_payment_required,
            {
                "payment_required": "make_payment",
                "success": "process_response"
            }
        )
    """
    client = X402AutoClient(
        wallet_keypair=state["wallet_keypair"],
        auto_retry=True,
    )
    
    try:
        response = asyncio.run(
            client.fetch(state["api_url"])
        )
        state["api_response"] = response.text
        state["payment_completed"] = True
        state["payment_error"] = None
    except X402Error as e:
        state["payment_error"] = f"{e.code}: {e.message}"
        state["payment_completed"] = False
    
    return state

def check_payment_required(state: AgentState) -> str:
    """Conditional edge function"""
    if state.get("payment_required"):
        return "payment_required"
    elif state.get("api_response"):
        return "success"
    else:
        return "error"
```

##### 5.2 Payment-Aware API Node

```python
async def fetch_with_payment_node(state: AgentState) -> AgentState:
    """
    Combined node that fetches API and handles payment automatically
    
    This is simpler than separate nodes but gives less control
    """
    client = X402AutoClient(
        wallet_keypair=state["wallet_keypair"],
        max_payment_amount="1.0",
    )
    
    try:
        response = await client.fetch(
            state["api_url"],
            method="GET"
        )
        state["api_response"] = response.text
        state["payment_completed"] = True
    except InsufficientFundsError as e:
        state["payment_error"] = f"Insufficient funds: need {e.required_amount}"
    except X402Error as e:
        state["payment_error"] = f"{e.code}: {e.message}"
    
    return state
```

##### 5.3 Example Workflow

```python
from langgraph.graph import StateGraph, END

def create_x402_workflow(wallet_keypair: Keypair) -> StateGraph:
    """
    Create a LangGraph workflow with X402 payment support
    
    Workflow:
        1. Determine what API to call
        2. Check if payment required
        3. Make payment if needed
        4. Process response
    """
    
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("plan", planning_node)
    workflow.add_node("fetch_api", fetch_api_node)
    workflow.add_node("make_payment", payment_node)
    workflow.add_node("process", process_response_node)
    
    # Set entry point
    workflow.set_entry_point("plan")
    
    # Add edges
    workflow.add_edge("plan", "fetch_api")
    
    workflow.add_conditional_edges(
        "fetch_api",
        check_payment_required,
        {
            "payment_required": "make_payment",
            "success": "process",
            "error": END
        }
    )
    
    workflow.add_edge("make_payment", "fetch_api")  # Retry after payment
    workflow.add_edge("process", END)
    
    return workflow.compile()
```

##### 5.4 Helper Functions

```python
def create_payment_capable_graph(
    state_schema: type,
    wallet_keypair: Keypair,
    rpc_url: Optional[str] = None,
) -> StateGraph:
    """
    Create a StateGraph with X402 payment capabilities built-in
    
    Automatically adds wallet_keypair to state and provides helper methods
    """
    pass

def add_payment_node(
    graph: StateGraph,
    node_name: str = "x402_payment",
    max_payment: str = "1.0",
) -> StateGraph:
    """Add a payment node to existing graph"""
    pass
```

---

## 6. Error Handling & Retry Logic

### Automatic Retry Configuration

```python
from dataclasses import dataclass

@dataclass
class RetryConfig:
    """Configuration for automatic retry behavior"""
    enabled: bool = True
    max_retries: int = 1  # For payment, 1 retry is usually sufficient
    retry_on_402: bool = True  # Retry when 402 received
    retry_on_network_error: bool = True
    exponential_backoff: bool = False  # Usually not needed for 402
    
class X402ClientWithRetry:
    """Client with configurable retry logic"""
    
    def __init__(
        self,
        wallet_keypair: Keypair,
        retry_config: Optional[RetryConfig] = None,
    ):
        self.wallet_keypair = wallet_keypair
        self.retry_config = retry_config or RetryConfig()
        self.client = X402AutoClient(
            wallet_keypair=wallet_keypair,
            auto_retry=retry_config.enabled if retry_config else True,
        )
```

### Error Code Reference

```python
ERROR_CODES = {
    "PAYMENT_REQUIRED": {
        "code": "PAYMENT_REQUIRED",
        "message": "Payment is required to access this resource",
        "retry": True,
        "user_action": "Ensure wallet has sufficient funds and retry"
    },
    "PAYMENT_EXPIRED": {
        "code": "PAYMENT_EXPIRED",
        "message": "Payment request has expired",
        "retry": True,
        "user_action": "Request a new payment authorization"
    },
    "INSUFFICIENT_FUNDS": {
        "code": "INSUFFICIENT_FUNDS",
        "message": "Wallet has insufficient token balance",
        "retry": False,
        "user_action": "Add funds to wallet"
    },
    "PAYMENT_VERIFICATION_FAILED": {
        "code": "PAYMENT_VERIFICATION_FAILED",
        "message": "Server could not verify payment",
        "retry": True,
        "user_action": "Contact API provider if issue persists"
    },
    "TRANSACTION_BROADCAST_FAILED": {
        "code": "TRANSACTION_BROADCAST_FAILED",
        "message": "Failed to broadcast transaction to blockchain",
        "retry": True,
        "user_action": "Check network connection and RPC endpoint"
    },
    "INVALID_PAYMENT_REQUEST": {
        "code": "INVALID_PAYMENT_REQUEST",
        "message": "Payment request format is invalid",
        "retry": False,
        "user_action": "Contact API provider"
    },
}
```

---

## 7. Testing & Development

### Test Utilities

```python
# In openlibx402-core

class MockSolanaPaymentProcessor(SolanaPaymentProcessor):
    """Mock processor for testing without real blockchain"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.transactions: list = []
        self.balance = 100.0  # Mock balance
    
    async def create_payment_transaction(self, *args, **kwargs):
        """Return mock transaction"""
        return MockTransaction()
    
    async def sign_and_send_transaction(self, *args, **kwargs):
        """Return mock tx hash"""
        tx_hash = f"mock_tx_{len(self.transactions)}"
        self.transactions.append(tx_hash)
        return tx_hash
    
    async def verify_transaction(self, *args, **kwargs):
        """Always verify successfully"""
        return True
    
    async def get_token_balance(self, *args, **kwargs):
        """Return mock balance"""
        return self.balance

class TestServer:
    """Mock X402 server for testing"""
    
    def __init__(self, payment_address: str, token_mint: str):
        self.payment_address = payment_address
        self.token_mint = token_mint
        self.payments_received: list = []
    
    def require_payment(self, amount: str, resource: str):
        """Decorator that adds payment requirement"""
        pass
    
    def start(self, port: int = 8402):
        """Start test server"""
        pass
```

### Example Test

```python
import pytest
from openlibx402_core.testing import MockSolanaPaymentProcessor, TestServer

@pytest.mark.asyncio
async def test_payment_flow():
    """Test complete payment flow"""
    # Setup test server
    server = TestServer(
        payment_address="mock_address",
        token_mint="mock_usdc"
    )
    server.start(port=8402)
    
    # Create client with mock processor
    keypair = Keypair()  # Generate test keypair
    client = X402AutoClient(wallet_keypair=keypair)
    client.client.processor = MockSolanaPaymentProcessor()
    
    # Make request to paywalled endpoint
    response = await client.fetch("http://localhost:8402/premium-data")
    
    # Verify payment was made
    assert response.status_code == 200
    assert len(client.client.processor.transactions) == 1
    
    # Cleanup
    server.stop()
```

---

## 8. Example Implementations

### 8.1 FastAPI Server Example

```python
# examples/fastapi-server/main.py

from fastapi import FastAPI, Depends
from openlibx402_fastapi import payment_required, X402Config, init_x402
from solders.keypair import Keypair
import os

# Initialize X402
config = X402Config(
    payment_address=os.getenv("PAYMENT_WALLET_ADDRESS"),
    token_mint=os.getenv("USDC_MINT_ADDRESS"),
    network="solana-devnet",
)
init_x402(config)

app = FastAPI()

# Simple decorator approach
@app.get("/premium-data")
@payment_required(
    amount="0.10",
    payment_address=config.payment_address,
    token_mint=config.token_mint,
    description="Access to premium market data"
)
async def get_premium_data():
    return {
        "data": "This is premium content",
        "price": 100.50,
        "timestamp": "2025-05-06T10:00:00Z"
    }

# Dependency injection approach
from openlibx402_fastapi import verify_payment_factory

@app.get("/expensive-data")
async def get_expensive_data(
    payment = Depends(
        verify_payment_factory(
            amount="1.00",
            payment_address=config.payment_address,
            token_mint=config.token_mint,
        )
    )
):
    return {
        "data": "Very expensive content",
        "payment_id": payment.payment_id,
        "amount_paid": payment.actual_amount,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 8.2 LangChain Agent Example

```python
# examples/langchain-agent/main.py

from langchain.chat_models import ChatOpenAI
from langchain.agents import initialize_agent, AgentType
from openlibx402_langchain import X402PaymentTool, X402RequestsWrapper
from solders.keypair import Keypair
import os
import json

# Load wallet
with open("wallet.json") as f:
    wallet_data = json.load(f)
    keypair = Keypair.from_bytes(bytes(wallet_data))

# Create X402-enabled tools
payment_tool = X402PaymentTool(
    wallet_keypair=keypair,
    max_payment="5.0",
    rpc_url="https://api.devnet.solana.com"
)

# Create requests wrapper for automatic payment handling
requests_wrapper = X402RequestsWrapper(
    wallet_keypair=keypair,
    max_payment="1.0"
)

# Load LangChain tools with X402 support
from langchain.agents import load_tools
tools = load_tools(
    ["requests_all"],
    llm=ChatOpenAI(),
    requests_wrapper=requests_wrapper
)
tools.append(payment_tool)

# Create agent
agent = initialize_agent(
    tools=tools,
    llm=ChatOpenAI(temperature=0),
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True
)

# Run agent
response = agent.run(
    "Get me the premium market data from http://localhost:8000/premium-data "
    "and tell me the current price"
)

print(response)
```

### 8.3 LangGraph Workflow Example

```python
# examples/langgraph-workflow/main.py

from typing import TypedDict, Annotated, Optional
from langgraph.graph import StateGraph, END
from openlibx402_langgraph import payment_node, check_payment_required
from openlibx402_client import X402AutoClient
from solders.keypair import Keypair
import json
import asyncio

# Define state
class ResearchState(TypedDict):
    query: str
    api_url: str
    api_response: Optional[str]
    payment_required: bool
    payment_completed: bool
    payment_error: Optional[str]
    wallet_keypair: Keypair
    final_answer: Optional[str]

# Load wallet
with open("wallet.json") as f:
    wallet_data = json.load(f)
    keypair = Keypair.from_bytes(bytes(wallet_data))

# Define nodes
def plan_node(state: ResearchState) -> ResearchState:
    """Determine which API to call"""
    state["api_url"] = "http://localhost:8000/premium-data"
    state["payment_required"] = False
    return state

async def fetch_api_node(state: ResearchState) -> ResearchState:
    """Fetch from API"""
    client = X402AutoClient(
        wallet_keypair=state["wallet_keypair"],
        auto_retry=False,  # We'll handle retry via graph
    )
    
    try:
        response = await client.fetch(state["api_url"])
        state["api_response"] = response.text
        state["payment_required"] = False
    except Exception as e:
        if "402" in str(e):
            state["payment_required"] = True
        else:
            state["payment_error"] = str(e)
    
    return state

def process_node(state: ResearchState) -> ResearchState:
    """Process API response"""
    if state["api_response"]:
        # Parse and format response
        state["final_answer"] = f"Retrieved data: {state['api_response']}"
    return state

# Build workflow
workflow = StateGraph(ResearchState)

workflow.add_node("plan", plan_node)
workflow.add_node("fetch", fetch_api_node)
workflow.add_node("payment", payment_node)  # From openlibx402-langgraph
workflow.add_node("process", process_node)

workflow.set_entry_point("plan")
workflow.add_edge("plan", "fetch")

workflow.add_conditional_edges(
    "fetch",
    check_payment_required,  # From openlibx402-langgraph
    {
        "payment_required": "payment",
        "success": "process",
        "error": END
    }
)

workflow.add_edge("payment", "fetch")  # Retry after payment
workflow.add_edge("process", END)

# Compile and run
app = workflow.compile()

# Execute
result = app.invoke({
    "query": "Get premium market data",
    "wallet_keypair": keypair,
})

print(result["final_answer"])
```

---

## 9. Package Metadata & Publishing

### Python Packages (PyPI)

```toml
# pyproject.toml example for openlibx402-core

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "openlibx402-core"
version = "0.1.1"
description = "Core implementation of X402 payment protocol"
authors = [
    {name = "OpenLibx402 Contributors", email = "hello@openlibx402.org"},
]
readme = "README.md"
license = {text = "MIT"}
requires-python = ">=3.8"
dependencies = [
    "solana>=0.30.0",
    "solders>=0.18.0",
    "httpx>=0.24.0",
    "pydantic>=2.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "pytest-asyncio>=0.21.0",
    "black>=23.0.0",
    "mypy>=1.0.0",
]

[project.urls]
Homepage = "https://openlib.xyz"
Documentation = "https://openlibx402.github.io/docs"
Repository = "https://github.com/openlibx402/openlibx402"
```

### TypeScript Packages (npm)

```json
// package.json example for @openlibx402/core

{
  "name": "@openlibx402/core",
  "version": "0.1.0",
  "description": "Core implementation of X402 payment protocol",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "keywords": ["x402", "payments", "solana", "ai-agents", "web3"],
  "author": "OpenLibx402 Contributors",
  "license": "MIT",
  "dependencies": {
    "@solana/web3.js": "^1.87.0",
    "@solana/spl-token": "^0.3.9",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "eslint": "^8.0.0"
  }
}
```

---

## 10. Documentation Structure

```
docs/
├── getting-started/
│   ├── installation.md
│   ├── quickstart-server.md
│   ├── quickstart-client.md
│   └── quickstart-agent.md
├── guides/
│   ├── fastapi-integration.md
│   ├── langchain-integration.md
│   ├── langgraph-integration.md
│   ├── wallet-setup.md
│   └── testing-locally.md
├── api-reference/
│   ├── core/
│   ├── server/
│   ├── client/
│   └── integrations/
├── examples/
│   ├── basic-api-server.md
│   ├── autonomous-agent.md
│   ├── multi-agent-workflow.md
│   └── error-handling.md
└── advanced/
    ├── custom-settlement.md
    ├── performance-optimization.md
    └── security-best-practices.md
```

---

## 11. Development Roadmap

### Phase 1: Core & FastAPI 
- ✅ Core protocol implementation (Python + TypeScript)
- ✅ Solana blockchain integration
- ✅ FastAPI server middleware
- ✅ Basic client (explicit & implicit)
- ✅ Error handling
- ✅ Testing utilities
- ✅ Example implementations

### Phase 2: AI Agent Integrations
- ✅ LangChain tool & middleware
- ✅ LangGraph nodes & helpers
- 🔲 Additional agent framework support (AutoGPT, CrewAI)

### Phase 3: Additional Frameworks
- 🔲 Express.js middleware (TypeScript)
- 🔲 Next.js API routes helper
- 🔲 Flask middleware (Python)
- 🔲 Django middleware (Python)
- 🔲 Hono middleware (TypeScript)

### Phase 4: Enhanced Features
- 🔲 Payment batching
- 🔲 Subscription management
- 🔲 Usage analytics
- 🔲 Multi-chain support (Ethereum, Base L2)
- 🔲 Alternative tokens (beyond USDC)

### Phase 5: Ecosystem
- 🔲 CLI tools
- 🔲 Admin dashboard
- 🔲 Wallet UI components
- 🔲 Browser extension
- 🔲 Zapier/Make.com integrations

---

## 12. Security Considerations

### Wallet Security
- Never log private keys
- Use environment variables for sensitive data
- Recommend hardware wallets for production
- Implement rate limiting on payment endpoints

### Transaction Verification
- Always verify transactions on-chain
- Check recipient, amount, and token mint
- Implement replay attack protection via nonce
- Set reasonable expiration times (5-10 minutes)

### API Security
- Implement CORS properly
- Use HTTPS in production
- Rate limit payment requests
- Validate all payment authorization fields

---

## 13. Performance Optimization

### Client-Side
- Reuse HTTP connections (connection pooling)
- Cache payment authorizations (with expiry)
- Batch multiple API calls where possible
- Use WebSocket for high-frequency payments

### Server-Side
- Async transaction verification
- Cache verified payments (Redis)
- Background transaction confirmation
- Load balancing for RPC calls

---

## 14. Monitoring & Observability

### Metrics to Track
- Payment success rate
- Transaction confirmation time
- RPC endpoint latency
- Token balance (for auto-replenishment alerts)
- Error rates by type

### Logging
```python
import logging

logger = logging.getLogger("openlibx402")

# Log payment requests
logger.info(f"Payment required: {amount} for {resource}")

# Log successful payments
logger.info(f"Payment verified: tx_hash={tx_hash}")

# Log errors with context
logger.error(
    f"Payment failed: {error_code}",
    extra={
        "payment_id": payment_id,
        "wallet": wallet_address,
        "amount": amount,
    }
)
```

---

## End of Technical Specification

This specification provides a comprehensive blueprint for implementing the OpenLibx402 library ecosystem. The architecture is modular, allowing for incremental development and easy addition of new framework integrations.

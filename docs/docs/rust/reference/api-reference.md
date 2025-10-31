# API Reference

Complete API reference for all Rust packages.

## openlibx402-core

### PaymentRequest

```rust
pub struct PaymentRequest {
    pub max_amount_required: String,
    pub asset_type: String,
    pub asset_address: String,
    pub payment_address: String,
    pub network: String,
    pub expires_at: DateTime<Utc>,
    pub nonce: String,
    pub payment_id: String,
    pub resource: String,
    pub description: Option<String>,
}
```

#### Methods

```rust
impl PaymentRequest {
    pub fn new(
        max_amount_required: String,
        asset_address: String,
        payment_address: String,
        network: String,
        expires_at: DateTime<Utc>,
        nonce: String,
        payment_id: String,
        resource: String,
    ) -> Self

    pub fn with_description(self, description: String) -> Self
    pub fn is_expired(&self) -> bool
    pub fn from_json(json: &str) -> X402Result<Self>
    pub fn to_json(&self) -> X402Result<String>
    pub fn to_base64(&self) -> X402Result<String>
    pub fn from_base64(encoded: &str) -> X402Result<Self>
}
```

### PaymentAuthorization

```rust
pub struct PaymentAuthorization {
    pub payment_id: String,
    pub actual_amount: String,
    pub payment_address: String,
    pub asset_address: String,
    pub network: String,
    pub timestamp: DateTime<Utc>,
    pub signature: String,
    pub public_key: String,
    pub transaction_hash: Option<String>,
}
```

#### Methods

```rust
impl PaymentAuthorization {
    pub fn new(
        payment_id: String,
        actual_amount: String,
        payment_address: String,
        asset_address: String,
        network: String,
        signature: String,
        public_key: String,
    ) -> Self

    pub fn from_json(json: &str) -> X402Result<Self>
    pub fn to_json(&self) -> X402Result<String>
    pub fn to_header_value(&self) -> X402Result<String>
    pub fn from_header_value(encoded: &str) -> X402Result<Self>
}
```

### SolanaPaymentProcessor

```rust
pub struct SolanaPaymentProcessor {
    // fields are private
}
```

#### Methods

```rust
impl SolanaPaymentProcessor {
    pub fn new(rpc_url: &str, commitment: Option<CommitmentConfig>) -> Self

    pub fn default_rpc_url(network: &str) -> &'static str

    pub async fn create_payment(
        &self,
        request: &PaymentRequest,
        payer: &Keypair,
    ) -> X402Result<PaymentAuthorization>

    pub async fn verify_payment(
        &self,
        authorization: &PaymentAuthorization,
        expected_amount: &str,
    ) -> X402Result<bool>

    pub async fn get_token_balance(&self, token_account: &Pubkey) -> X402Result<u64>
}
```

### X402Error

```rust
pub enum X402Error {
    PaymentRequired(String),
    PaymentExpired(String),
    InsufficientFunds(String),
    PaymentVerification(String),
    TransactionBroadcast(String),
    InvalidPaymentRequest(String),
    InvalidPaymentAuthorization(String),
    Configuration(String),
    Network(String),
    Blockchain(String),
    Serialization(String),
}
```

#### Methods

```rust
impl X402Error {
    pub fn code(&self) -> &'static str
    pub fn message(&self) -> String
}
```

### Type Aliases

```rust
pub type X402Result<T> = Result<T, X402Error>;
```

### Constants

```rust
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
```

---

## openlibx402-client

### X402Client

```rust
pub struct X402Client {
    // fields are private
}
```

#### Methods

```rust
impl X402Client {
    pub fn new(keypair: Keypair, rpc_url: Option<&str>) -> Self

    pub async fn get(&self, url: &str) -> X402Result<Response>

    pub async fn get_with_auth(
        &self,
        url: &str,
        authorization: &PaymentAuthorization,
    ) -> X402Result<Response>

    pub async fn post(&self, url: &str, body: Option<String>) -> X402Result<Response>

    pub async fn post_with_auth(
        &self,
        url: &str,
        body: Option<String>,
        authorization: &PaymentAuthorization,
    ) -> X402Result<Response>

    pub fn is_payment_required(&self, response: &Response) -> bool

    pub async fn parse_payment_request(&self, response: Response) -> X402Result<PaymentRequest>

    pub async fn create_payment(
        &self,
        request: &PaymentRequest,
    ) -> X402Result<PaymentAuthorization>

    pub async fn verify_payment(
        &self,
        authorization: &PaymentAuthorization,
        expected_amount: &str,
    ) -> X402Result<bool>
}
```

### X402AutoClient

```rust
pub struct X402AutoClient {
    // fields are private
}
```

#### Methods

```rust
impl X402AutoClient {
    pub fn new(
        keypair: Keypair,
        rpc_url: Option<&str>,
        options: Option<AutoClientOptions>,
    ) -> Self

    pub async fn get(&self, url: &str) -> X402Result<Response>

    pub async fn post(&self, url: &str, body: Option<String>) -> X402Result<Response>

    pub fn client(&self) -> &X402Client

    pub fn options(&self) -> &AutoClientOptions
}
```

### AutoClientOptions

```rust
#[derive(Debug, Clone)]
pub struct AutoClientOptions {
    pub max_payment_amount: String,
    pub auto_retry: bool,
    pub max_retries: u32,
}
```

#### Methods

```rust
impl Default for AutoClientOptions {
    fn default() -> Self {
        Self {
            max_payment_amount: "10.0".to_string(),
            auto_retry: true,
            max_retries: 3,
        }
    }
}
```

---

## openlibx402-rocket

### X402Config

```rust
#[derive(Debug, Clone)]
pub struct X402Config {
    pub payment_address: String,
    pub token_mint: String,
    pub network: String,
    pub rpc_url: Option<String>,
    pub auto_verify: bool,
}
```

### PaymentRequirement

```rust
#[derive(Debug, Clone)]
pub struct PaymentRequirement {
    pub amount: String,
    pub description: Option<String>,
    pub expires_in: i64,
}
```

#### Methods

```rust
impl PaymentRequirement {
    pub fn new(amount: &str) -> Self
    pub fn with_description(self, description: &str) -> Self
    pub fn with_expires_in(self, seconds: i64) -> Self
}
```

### PaymentGuard

```rust
pub struct PaymentGuard {
    pub authorization: PaymentAuthorization,
}
```

Implements `FromRequest` for automatic extraction from HTTP requests.

### PaymentRequiredResponse

```rust
pub struct PaymentRequiredResponse {
    pub payment_request: PaymentRequest,
}
```

Implements `Responder` to return 402 status with JSON body.

### Functions

```rust
pub fn create_payment_request(
    config: &X402Config,
    requirement: &PaymentRequirement,
    resource: &str,
) -> PaymentRequest
```

---

## openlibx402-actix

### X402Config

```rust
#[derive(Debug, Clone)]
pub struct X402Config {
    pub payment_address: String,
    pub token_mint: String,
    pub network: String,
    pub rpc_url: Option<String>,
    pub auto_verify: bool,
}
```

### X402State

```rust
#[derive(Debug, Clone)]
pub struct X402State {
    pub config: X402Config,
}
```

### PaymentRequirement

```rust
#[derive(Debug, Clone)]
pub struct PaymentRequirement {
    pub amount: String,
    pub description: Option<String>,
    pub expires_in: i64,
}
```

#### Methods

```rust
impl PaymentRequirement {
    pub fn new(amount: &str) -> Self
    pub fn with_description(self, description: &str) -> Self
    pub fn with_expires_in(self, seconds: i64) -> Self
}
```

### PaymentExtractor

```rust
pub struct PaymentExtractor {
    pub authorization: PaymentAuthorization,
}
```

Implements `FromRequest` for automatic extraction from HTTP requests.

### PaymentError

```rust
pub enum PaymentError {
    Required,
    InvalidHeader,
    InvalidAuthorization(String),
}
```

Implements `ResponseError` for automatic HTTP error responses.

### Functions

```rust
pub fn create_payment_request(
    config: &X402Config,
    requirement: &PaymentRequirement,
    resource: &str,
) -> PaymentRequest

pub fn payment_required_response(payment_request: PaymentRequest) -> HttpResponse
```

---

## Usage Examples

### Core

```rust
use openlibx402_core::{PaymentRequest, PaymentAuthorization, SolanaPaymentProcessor};

// Create payment processor
let processor = SolanaPaymentProcessor::new("https://api.devnet.solana.com", None);

// Create payment
let authorization = processor.create_payment(&payment_request, &keypair).await?;

// Verify payment
let verified = processor.verify_payment(&authorization, "0.10").await?;
```

### Client

```rust
use openlibx402_client::{X402AutoClient, AutoClientOptions};

let options = AutoClientOptions {
    max_payment_amount: "5.0".to_string(),
    auto_retry: true,
    max_retries: 3,
};

let client = X402AutoClient::new(keypair, None, Some(options));
let response = client.get("http://localhost:8000/premium").await?;
```

### Rocket

```rust
use openlibx402_rocket::{PaymentGuard, X402Config};

#[get("/premium")]
fn premium(auth: PaymentGuard) -> String {
    format!("Payment ID: {}", auth.authorization.payment_id)
}
```

### Actix Web

```rust
use openlibx402_actix::{PaymentExtractor, X402State};

#[get("/premium")]
async fn premium(auth: PaymentExtractor) -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "payment_id": auth.authorization.payment_id
    }))
}
```

## See Also

- [Configuration Reference](configuration.md)
- [Error Handling](errors.md)
- [Core Library](../libraries/core.md)
- [Client Library](../libraries/client.md)

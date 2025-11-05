# OpenLibX402 Core Library (Java)

The `openlibx402-core` package provides the fundamental payment protocol components for Java applications.

## Installation

```xml
<dependency>
    <groupId>org.openlibx402</groupId>
    <artifactId>openlibx402-core</artifactId>
    <version>0.1.0</version>
</dependency>
```

## Package Structure

```
org.openlibx402.core/
├── models/
│   ├── PaymentRequest
│   └── PaymentAuthorization
├── errors/
│   ├── X402Error
│   ├── PaymentRequiredError
│   ├── PaymentExpiredError
│   ├── InsufficientFundsError
│   ├── PaymentVerificationError
│   ├── TransactionBroadcastError
│   └── InvalidPaymentRequestError
├── blockchain/
│   └── SolanaPaymentProcessor
└── util/
    └── ErrorCodes
```

## Models

### PaymentRequest

Represents a 402 payment request from a server.

```java
import org.openlibx402.core.models.PaymentRequest;

// Parse from JSON
PaymentRequest request = PaymentRequest.fromJson(jsonString);

// Access fields
String amount = request.getMaxAmountRequired();
String paymentAddress = request.getPaymentAddress();
Instant expiresAt = request.getExpiresAt();

// Check expiration
boolean expired = request.isExpired();

// Convert to JSON
String json = request.toJson();

// Convert to Map
Map<String, Object> map = request.toMap();
```

**Fields:**
- `maxAmountRequired` - Maximum payment amount (decimal string)
- `assetType` - Asset type (e.g., "SPL")
- `assetAddress` - Token mint address
- `paymentAddress` - Recipient wallet address
- `network` - Blockchain network (e.g., "solana-devnet")
- `expiresAt` - Expiration timestamp
- `nonce` - Unique nonce for replay protection
- `paymentId` - Unique payment identifier
- `resource` - API resource endpoint
- `description` - Optional description

### PaymentAuthorization

Represents proof of payment for accessing protected resources.

```java
import org.openlibx402.core.models.PaymentAuthorization;

// Create authorization
PaymentAuthorization auth = new PaymentAuthorization(
    paymentId,
    actualAmount,
    paymentAddress,
    assetAddress,
    network,
    timestamp,
    signature,
    publicKey,
    transactionHash
);

// Convert to header value (base64-encoded JSON)
String headerValue = auth.toHeaderValue();

// Parse from header
PaymentAuthorization parsed = PaymentAuthorization.fromHeader(headerValue);

// Parse from JSON
PaymentAuthorization fromJson = PaymentAuthorization.fromJson(jsonString);
```

**Fields:**
- `paymentId` - Payment identifier from request
- `actualAmount` - Amount paid
- `paymentAddress` - Recipient address
- `assetAddress` - Token mint address
- `network` - Network identifier
- `timestamp` - Authorization timestamp
- `signature` - Transaction signature
- `publicKey` - Payer's public key
- `transactionHash` - Transaction hash

## Error Handling

### X402Error

Base exception class for all payment errors.

```java
import org.openlibx402.core.errors.*;

try {
    // Payment operation
} catch (X402Error e) {
    String code = e.getCode();
    String message = e.getMessage();
    Map<String, Object> details = e.getDetails();
}
```

### Specific Error Types

**PaymentRequiredError**
```java
catch (PaymentRequiredError e) {
    PaymentRequest request = e.getPaymentRequest();
    // Code: PAYMENT_REQUIRED
    // Retry: true
}
```

**InsufficientFundsError**
```java
catch (InsufficientFundsError e) {
    String required = e.getRequiredAmount();
    String available = e.getAvailableAmount();
    // Code: INSUFFICIENT_FUNDS
    // Retry: false
}
```

**PaymentExpiredError**
```java
catch (PaymentExpiredError e) {
    PaymentRequest request = e.getPaymentRequest();
    // Code: PAYMENT_EXPIRED
    // Retry: true
}
```

**PaymentVerificationError**
```java
catch (PaymentVerificationError e) {
    String reason = e.getReason();
    // Code: PAYMENT_VERIFICATION_FAILED
    // Retry: true
}
```

**TransactionBroadcastError**
```java
catch (TransactionBroadcastError e) {
    String reason = e.getReason();
    // Code: TRANSACTION_BROADCAST_FAILED
    // Retry: true
}
```

**InvalidPaymentRequestError**
```java
catch (InvalidPaymentRequestError e) {
    String reason = e.getReason();
    // Code: INVALID_PAYMENT_REQUEST
    // Retry: false
}
```

## Blockchain Integration

### SolanaPaymentProcessor

Handles Solana blockchain operations.

```java
import org.openlibx402.core.blockchain.SolanaPaymentProcessor;
import org.p2p.solanaj.core.Account;

// Create processor
SolanaPaymentProcessor processor = new SolanaPaymentProcessor(
    "https://api.devnet.solana.com"
);

try (processor) {
    // Create payment
    Account account = new Account(secretKey);
    PaymentAuthorization auth = processor.createPayment(
        paymentRequest,
        account,
        "0.10"  // Optional amount
    );

    // Check balance
    PublicKey pubkey = new PublicKey("...");
    double balance = processor.getBalance(pubkey);

    // Verify transaction
    boolean valid = processor.verifyTransaction(
        txHash,
        recipientAddress,
        amount,
        tokenMint
    );
}
```

**Methods:**
- `createPayment(request, account, amount)` - Create and broadcast payment
- `getBalance(publicKey)` - Get SOL balance
- `getTokenBalance(address, mint)` - Get SPL token balance
- `verifyTransaction(hash, recipient, amount, mint)` - Verify on-chain transaction
- `close()` - Clean up resources

## Error Codes

### ErrorCodes Utility

Access error metadata and retry information.

```java
import org.openlibx402.core.util.ErrorCodes;

// Get error info
ErrorCodes.ErrorCodeInfo info = ErrorCodes.getInfo("PAYMENT_REQUIRED");
String message = info.getMessage();
boolean retryable = info.isRetry();
String userAction = info.getUserAction();

// Check if retryable
boolean canRetry = ErrorCodes.isRetryable("INSUFFICIENT_FUNDS");  // false

// Get all codes
Map<String, ErrorCodes.ErrorCodeInfo> allCodes = ErrorCodes.getAllCodes();
```

**Available Error Codes:**
- `PAYMENT_REQUIRED` - Payment required (retry: true)
- `PAYMENT_EXPIRED` - Payment expired (retry: true)
- `INSUFFICIENT_FUNDS` - Insufficient balance (retry: false)
- `PAYMENT_VERIFICATION_FAILED` - Verification failed (retry: true)
- `TRANSACTION_BROADCAST_FAILED` - Broadcast failed (retry: true)
- `INVALID_PAYMENT_REQUEST` - Invalid request (retry: false)

## Thread Safety

All core classes are thread-safe:
- Models are immutable
- SolanaPaymentProcessor uses thread-safe RPC client
- Error instances are immutable

## Resource Management

Use try-with-resources for proper cleanup:

```java
try (SolanaPaymentProcessor processor = new SolanaPaymentProcessor(rpcUrl)) {
    // Use processor
}  // Automatically closed
```

## Next Steps

- [Client Library](client.md)
- [Getting Started](../getting-started/installation.md)
- [Examples](../examples/basic-usage.md)

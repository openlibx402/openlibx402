# Java API Reference

Complete API reference for the OpenLibX402 Java SDK.

## Package: org.openlibx402.client

### X402Client

Manual payment control HTTP client.

#### Constructor

```java
public X402Client(
    Account walletAccount,
    String rpcUrl,
    boolean allowLocal
)
```

**Parameters:**
- `walletAccount` (Account): Solana account for signing transactions
- `rpcUrl` (String): Solana RPC endpoint URL (null for devnet default)
- `allowLocal` (boolean): Allow localhost URLs (false for production)

#### HTTP Methods

##### get()

```java
public Response get(String url) throws IOException, X402Error
public Response get(String url, PaymentAuthorization payment) throws IOException, X402Error
```

Performs a GET request.

**Returns:** OkHttp Response object

**Throws:**
- `PaymentRequiredError` - 402 response received
- `IOException` - Network error

##### post()

```java
public Response post(String url, String body) throws IOException, X402Error
public Response post(String url, String body, PaymentAuthorization payment) throws IOException, X402Error
```

Performs a POST request with JSON body.

##### put()

```java
public Response put(String url, String body) throws IOException, X402Error
public Response put(String url, String body, PaymentAuthorization payment) throws IOException, X402Error
```

Performs a PUT request with JSON body.

##### delete()

```java
public Response delete(String url) throws IOException, X402Error
public Response delete(String url, PaymentAuthorization payment) throws IOException, X402Error
```

Performs a DELETE request.

#### Payment Methods

##### createPayment()

```java
public PaymentAuthorization createPayment(PaymentRequest request, String amount)
    throws X402Error
```

Creates a payment for a payment request.

**Parameters:**
- `request` (PaymentRequest): The payment request
- `amount` (String): Specific amount (null for max amount)

**Returns:** PaymentAuthorization to include in retry request

**Throws:**
- `InsufficientFundsError` - Not enough funds
- `PaymentExpiredError` - Request expired
- `TransactionBroadcastError` - Broadcast failed

##### parsePaymentRequest()

```java
public PaymentRequest parsePaymentRequest(Response response)
    throws InvalidPaymentRequestError
```

Parses payment request from 402 response.

##### paymentRequired()

```java
public boolean paymentRequired(Response response)
```

Checks if response indicates payment is required.

#### Access Methods

##### getProcessor()

```java
public SolanaPaymentProcessor getProcessor()
```

Gets the underlying payment processor.

##### isClosed()

```java
public boolean isClosed()
```

Checks if client has been closed.

##### close()

```java
public void close()
```

Closes the client and releases resources.

---

### X402AutoClient

Automatic payment handling HTTP client with Builder pattern.

#### Builder

```java
X402AutoClient.Builder builder = new X402AutoClient.Builder(account);
builder.rpcUrl(String)
       .maxPaymentAmount(String)
       .maxRetries(int)
       .allowLocal(boolean)
       .httpClient(OkHttpClient);
X402AutoClient client = builder.build();
```

**Builder Methods:**

| Method | Parameter | Description | Default |
|--------|-----------|-------------|---------|
| `rpcUrl(String)` | RPC URL | Solana RPC endpoint | Devnet |
| `maxPaymentAmount(String)` | Amount | Maximum payment per request | "1.0" |
| `maxRetries(int)` | Count | Maximum retry attempts | 3 |
| `allowLocal(boolean)` | Allow | Allow localhost URLs | false |
| `httpClient(OkHttpClient)` | Client | Custom HTTP client | Default |

#### HTTP Methods

Same as X402Client, but automatically handles 402 responses:

```java
public Response get(String url) throws IOException, X402Error
public Response post(String url, String body) throws IOException, X402Error
public Response put(String url, String body) throws IOException, X402Error
public Response delete(String url) throws IOException, X402Error
```

#### Access Methods

```java
public X402Client getBaseClient()
public SolanaPaymentProcessor getProcessor()
public void close()
```

---

## Package: org.openlibx402.core.models

### PaymentRequest

Payment request details from 402 response.

#### Fields

```java
private final String maxAmountRequired;
private final String assetType;
private final String assetAddress;
private final String paymentAddress;
private final String network;
private final String expiresAt;
private final String nonce;
private final String paymentId;
private final String resource;
private final String description;
```

#### Methods

##### fromJson()

```java
public static PaymentRequest fromJson(String json)
```

Parses PaymentRequest from JSON string.

##### toJson()

```java
public String toJson()
```

Serializes to JSON string.

##### isExpired()

```java
public boolean isExpired()
```

Checks if payment request has expired.

#### Getters

```java
public String getMaxAmountRequired()
public String getAssetType()
public String getAssetAddress()
public String getPaymentAddress()
public String getNetwork()
public String getExpiresAt()
public String getNonce()
public String getPaymentId()
public String getResource()
public String getDescription()
```

---

### PaymentAuthorization

Payment authorization to include in requests.

#### Fields

```java
private final String signature;
private final String payerPublicKey;
private final String paymentAddress;
private final String amount;
private final String timestamp;
private final String nonce;
```

#### Methods

##### toHeaderValue()

```java
public String toHeaderValue()
```

Converts to base64-encoded header value for `X-Payment-Authorization`.

##### fromHeader()

```java
public static PaymentAuthorization fromHeader(String headerValue)
```

Parses from header value.

#### Getters

```java
public String getSignature()
public String getPayerPublicKey()
public String getPaymentAddress()
public String getAmount()
public String getTimestamp()
public String getNonce()
```

---

## Package: org.openlibx402.core.blockchain

### SolanaPaymentProcessor

Handles Solana blockchain payment operations.

#### Constructor

```java
public SolanaPaymentProcessor(String rpcUrl)
```

**Parameters:**
- `rpcUrl` (String): Solana RPC endpoint URL

#### Methods

##### createPayment()

```java
public PaymentAuthorization createPayment(
    PaymentRequest request,
    Account payerAccount,
    String amount
) throws X402Error
```

Creates and broadcasts a payment transaction.

**Returns:** PaymentAuthorization with transaction signature

**Throws:**
- `InsufficientFundsError` - Not enough funds
- `TransactionBroadcastError` - Broadcast failed
- `PaymentVerificationError` - Verification failed

##### getBalance()

```java
public String getBalance(PublicKey publicKey) throws Exception
```

Gets USDC balance for a public key.

**Returns:** Balance as string (e.g., "10.50")

##### verifyTransaction()

```java
public boolean verifyTransaction(String signature) throws Exception
```

Verifies a transaction has been confirmed.

**Returns:** true if confirmed, false otherwise

##### close()

```java
public void close()
```

Closes RPC connection and releases resources.

---

## Package: org.openlibx402.core.errors

### X402Error (Base Class)

Base exception for all X402 errors.

```java
public class X402Error extends Exception {
    private final String code;
    private final Map<String, Object> details;

    public String getCode()
    public Map<String, Object> getDetails()
}
```

### PaymentRequiredError

Thrown when 402 Payment Required response received.

```java
public class PaymentRequiredError extends X402Error {
    private final PaymentRequest paymentRequest;

    public PaymentRequest getPaymentRequest()
}
```

**Error Code:** `PAYMENT_REQUIRED`

### InsufficientFundsError

Thrown when account has insufficient funds.

```java
public class InsufficientFundsError extends X402Error {
    private final String requiredAmount;
    private final String availableAmount;

    public String getRequiredAmount()
    public String getAvailableAmount()
}
```

**Error Code:** `INSUFFICIENT_FUNDS`

### PaymentExpiredError

Thrown when payment request has expired.

```java
public class PaymentExpiredError extends X402Error {
    private final PaymentRequest paymentRequest;

    public PaymentRequest getPaymentRequest()
}
```

**Error Code:** `PAYMENT_EXPIRED`

### PaymentVerificationError

Thrown when payment verification fails.

```java
public class PaymentVerificationError extends X402Error {
    // Standard X402Error methods
}
```

**Error Code:** `PAYMENT_VERIFICATION_FAILED`

### TransactionBroadcastError

Thrown when transaction broadcast fails.

```java
public class TransactionBroadcastError extends X402Error {
    // Standard X402Error methods
}
```

**Error Code:** `TRANSACTION_BROADCAST_FAILED`

### InvalidPaymentRequestError

Thrown when payment request is invalid or malformed.

```java
public class InvalidPaymentRequestError extends X402Error {
    // Standard X402Error methods
}
```

**Error Code:** `INVALID_PAYMENT_REQUEST`

---

## Error Codes

All error codes are defined in `ErrorCodes` utility class:

```java
public class ErrorCodes {
    public static final String PAYMENT_REQUIRED = "PAYMENT_REQUIRED";
    public static final String INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS";
    public static final String PAYMENT_EXPIRED = "PAYMENT_EXPIRED";
    public static final String PAYMENT_VERIFICATION_FAILED = "PAYMENT_VERIFICATION_FAILED";
    public static final String TRANSACTION_BROADCAST_FAILED = "TRANSACTION_BROADCAST_FAILED";
    public static final String INVALID_PAYMENT_REQUEST = "INVALID_PAYMENT_REQUEST";

    public static Map<String, Object> getErrorMetadata(String code)
}
```

---

## Usage Examples

### Creating a Client

```java
Account account = new Account(secretKey);
X402Client client = new X402Client(
    account,
    "https://api.devnet.solana.com",
    false
);
```

### Making a Request

```java
try {
    Response response = client.get("https://api.example.com/data");
} catch (PaymentRequiredError e) {
    PaymentRequest request = e.getPaymentRequest();
    PaymentAuthorization auth = client.createPayment(request, null);
    Response retry = client.get("https://api.example.com/data", auth);
}
```

### Using Auto Client

```java
X402AutoClient client = new X402AutoClient.Builder(account)
    .maxPaymentAmount("5.0")
    .build();

Response response = client.get("https://api.example.com/data");
```

### Checking Balance

```java
SolanaPaymentProcessor processor = client.getProcessor();
String balance = processor.getBalance(account.getPublicKey());
System.out.println("Balance: " + balance + " USDC");
```

---

## Thread Safety

- **X402Client**: Not thread-safe. Create separate instances per thread.
- **X402AutoClient**: Not thread-safe. Create separate instances per thread.
- **SolanaPaymentProcessor**: Not thread-safe.
- **PaymentRequest**: Immutable, thread-safe.
- **PaymentAuthorization**: Immutable, thread-safe.

---

## Resource Management

All client classes implement `AutoCloseable`:

```java
try (X402Client client = new X402Client(account, null, false)) {
    // Use client
} // Automatically closed
```

Or manual cleanup:

```java
X402Client client = new X402Client(account, null, false);
try {
    // Use client
} finally {
    client.close();
}
```

---

## Related Documentation

- [Client Library Guide](../libraries/client.md)
- [Core Library Guide](../libraries/core.md)
- [Error Handling](errors.md)
- [Examples](../examples/basic-usage.md)

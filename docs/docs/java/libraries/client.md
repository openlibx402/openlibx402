# Java Client Library

The `openlibx402-client` package provides HTTP client implementations for making X402 payment-enabled requests in Java applications.

## Overview

The client library offers two main classes:

- **X402Client**: Manual payment control for maximum flexibility
- **X402AutoClient**: Automatic payment handling for convenience

## Installation

Add to your `pom.xml`:

```xml
<dependency>
    <groupId>org.openlibx402</groupId>
    <artifactId>openlibx402-client</artifactId>
    <version>0.1.0</version>
</dependency>
```

Or with Gradle:

```groovy
implementation 'org.openlibx402:openlibx402-client:0.1.0'
```

## X402Client

Manual payment control client for explicit payment flow management.

### Features

- Manual payment request handling
- Full control over payment decisions
- Support for GET, POST, PUT, DELETE methods
- SSRF protection (blocks localhost and private IPs)
- Resource management with `AutoCloseable`

### Basic Usage

```java
import org.openlibx402.client.X402Client;
import org.openlibx402.core.errors.*;
import org.openlibx402.core.models.*;
import org.p2p.solanaj.core.Account;
import okhttp3.Response;

// Initialize client
Account account = new Account(secretKey);
X402Client client = new X402Client(
    account,
    "https://api.devnet.solana.com",
    true  // allowLocal for development only
);

try {
    // Make request
    Response response = client.get("https://api.example.com/premium-data");
    System.out.println(response.body().string());

} catch (PaymentRequiredError e) {
    // Handle 402 Payment Required
    PaymentRequest request = e.getPaymentRequest();

    // Create payment
    PaymentAuthorization auth = client.createPayment(request);

    // Retry with payment
    Response retryResponse = client.get("https://api.example.com/premium-data", auth);
    System.out.println(retryResponse.body().string());

} finally {
    client.close();
}
```

### Constructor Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `walletAccount` | `Account` | Solana account for signing transactions | Required |
| `rpcUrl` | `String` | Solana RPC endpoint URL | `null` (uses devnet) |
| `allowLocal` | `boolean` | Allow localhost URLs (development only) | `false` |

### HTTP Methods

#### GET Request

```java
Response response = client.get(url);
Response response = client.get(url, paymentAuth);
```

#### POST Request

```java
String jsonBody = "{\"key\": \"value\"}";
Response response = client.post(url, jsonBody);
Response response = client.post(url, jsonBody, paymentAuth);
```

#### PUT Request

```java
String jsonBody = "{\"key\": \"updated\"}";
Response response = client.put(url, jsonBody);
Response response = client.put(url, jsonBody, paymentAuth);
```

#### DELETE Request

```java
Response response = client.delete(url);
Response response = client.delete(url, paymentAuth);
```

### Payment Methods

#### Create Payment

```java
PaymentAuthorization auth = client.createPayment(paymentRequest);
PaymentAuthorization auth = client.createPayment(paymentRequest, "0.05"); // specific amount
```

#### Parse Payment Request

```java
Response response = client.get(url);
if (client.paymentRequired(response)) {
    PaymentRequest request = client.parsePaymentRequest(response);
    // ... handle payment
}
```

#### Access Processor

```java
SolanaPaymentProcessor processor = client.getProcessor();
String balance = processor.getBalance(account.getPublicKey());
```

### Error Handling

```java
try {
    Response response = client.get(url);
} catch (PaymentRequiredError e) {
    // 402 Payment Required
    PaymentRequest request = e.getPaymentRequest();
} catch (InsufficientFundsError e) {
    // Not enough funds for payment
    System.err.println("Need: " + e.getRequiredAmount());
    System.err.println("Have: " + e.getAvailableAmount());
} catch (PaymentExpiredError e) {
    // Payment request expired
    System.err.println("Request expired at: " + e.getPaymentRequest().getExpiresAt());
} catch (X402Error e) {
    // Other X402 errors
    System.err.println("Error: " + e.getMessage());
} catch (IOException e) {
    // Network or HTTP errors
    System.err.println("Network error: " + e.getMessage());
}
```

### SSRF Protection

By default, the client blocks requests to:
- `localhost`, `127.0.0.1`, `::1`
- Private IP ranges (10.x.x.x, 172.16.x.x, 192.168.x.x)

```java
// Development mode - allows local URLs
X402Client devClient = new X402Client(account, null, true);

// Production mode - blocks local URLs (default)
X402Client prodClient = new X402Client(account, null, false);
```

!!! warning "Security"
    Never use `allowLocal=true` in production environments. This protection prevents Server-Side Request Forgery (SSRF) attacks.

## X402AutoClient

Automatic payment handling client with retry logic and payment limits.

### Features

- Automatic 402 detection and payment
- Configurable payment limits
- Automatic retry on payment
- Builder pattern for configuration
- Built on top of X402Client

### Basic Usage

```java
import org.openlibx402.client.X402AutoClient;

// Build client with configuration
X402AutoClient client = new X402AutoClient.Builder(account)
    .rpcUrl("https://api.devnet.solana.com")
    .maxPaymentAmount("1.0")      // Max 1 USDC per request
    .maxRetries(3)                 // Retry up to 3 times
    .allowLocal(true)              // Development only
    .build();

try {
    // Automatically handles 402 and retries
    Response response = client.get("https://api.example.com/premium-data");
    System.out.println(response.body().string());
} finally {
    client.close();
}
```

### Builder Configuration

| Method | Parameter | Description | Default |
|--------|-----------|-------------|---------|
| `rpcUrl(String)` | RPC endpoint | Solana RPC URL | Devnet |
| `maxPaymentAmount(String)` | Amount | Maximum payment per request | `"1.0"` |
| `maxRetries(int)` | Count | Maximum retry attempts | `3` |
| `allowLocal(boolean)` | Allow local | Allow localhost URLs | `false` |
| `httpClient(OkHttpClient)` | Client | Custom HTTP client | Default |

### Example: Custom Configuration

```java
import okhttp3.OkHttpClient;
import java.util.concurrent.TimeUnit;

// Custom HTTP client
OkHttpClient httpClient = new OkHttpClient.Builder()
    .connectTimeout(60, TimeUnit.SECONDS)
    .readTimeout(60, TimeUnit.SECONDS)
    .build();

// Build auto client
X402AutoClient client = new X402AutoClient.Builder(account)
    .rpcUrl("https://api.mainnet-beta.solana.com")
    .maxPaymentAmount("5.0")
    .maxRetries(2)
    .httpClient(httpClient)
    .build();
```

### Automatic Payment Flow

```java
try {
    // 1. Makes initial request
    // 2. Receives 402 Payment Required
    // 3. Automatically creates payment
    // 4. Retries request with authorization
    // 5. Returns successful response
    Response response = client.post(
        "https://api.example.com/data",
        "{\"query\": \"process this\"}"
    );

    System.out.println("Success: " + response.body().string());

} catch (InsufficientFundsError e) {
    System.err.println("Payment failed: not enough funds");
} catch (PaymentRequiredError e) {
    // Only thrown if max retries exceeded
    System.err.println("Payment required but max retries exceeded");
}
```

### Payment Limits

The client enforces payment limits to prevent excessive charges:

```java
// This will throw an error if payment exceeds 1.0 USDC
X402AutoClient client = new X402AutoClient.Builder(account)
    .maxPaymentAmount("1.0")
    .build();

try {
    Response response = client.get(url);
} catch (PaymentRequiredError e) {
    PaymentRequest request = e.getPaymentRequest();
    if (request.getMaxAmountRequired().compareTo("1.0") > 0) {
        System.err.println("Payment exceeds limit: " + request.getMaxAmountRequired());
    }
}
```

### Access Underlying Client

```java
// Access the base X402Client
X402Client baseClient = autoClient.getBaseClient();

// Access the processor
SolanaPaymentProcessor processor = autoClient.getProcessor();
String balance = processor.getBalance(account.getPublicKey());
```

## Comparison: Manual vs Automatic

| Feature | X402Client | X402AutoClient |
|---------|------------|----------------|
| Payment Control | Manual | Automatic |
| Retry Logic | Manual | Automatic |
| Payment Limits | Manual | Built-in |
| Use Case | Maximum control | Convenience |
| Error Handling | Explicit | Simplified |
| Configuration | Constructor | Builder |

### When to Use Each

**Use X402Client when you need:**
- Fine-grained control over payments
- Custom payment decision logic
- Explicit user approval for payments
- Complex payment workflows
- Integration with existing payment systems

**Use X402AutoClient when you need:**
- Quick integration with automatic payments
- Simplified error handling
- Built-in retry logic
- Payment limit enforcement
- Reduced boilerplate code

## Thread Safety

Both clients are **not thread-safe**. Create separate instances for concurrent requests:

```java
// Thread-safe usage
ExecutorService executor = Executors.newFixedThreadPool(10);

for (int i = 0; i < 10; i++) {
    executor.submit(() -> {
        // Each thread gets its own client
        try (X402Client client = new X402Client(account, null, false)) {
            Response response = client.get("https://api.example.com/data");
            // ... process response
        } catch (Exception e) {
            e.printStackTrace();
        }
    });
}
```

## Resource Management

Both clients implement `AutoCloseable` for proper resource cleanup:

```java
// Try-with-resources (recommended)
try (X402Client client = new X402Client(account)) {
    Response response = client.get(url);
    // Client automatically closed
}

// Manual cleanup
X402Client client = new X402Client(account);
try {
    Response response = client.get(url);
} finally {
    client.close();  // Must call close
}
```

## Best Practices

1. **Use try-with-resources**: Ensures proper cleanup
2. **Don't share clients**: Create separate instances for threads
3. **Set reasonable timeouts**: Configure HTTP client timeouts
4. **Handle all errors**: Catch specific X402Error types
5. **Never use allowLocal in production**: Security risk
6. **Close responses**: Call `response.close()` or use try-with-resources
7. **Validate payment amounts**: Check before creating payments
8. **Log payment activities**: Track payments for auditing

## Example: Production Setup

```java
import org.openlibx402.client.X402AutoClient;
import org.openlibx402.core.errors.*;
import org.p2p.solanaj.core.Account;
import okhttp3.Response;
import java.util.logging.Logger;

public class ProductionExample {
    private static final Logger logger = Logger.getLogger(ProductionExample.class.getName());

    public static void main(String[] args) {
        // Load account securely
        Account account = loadAccountFromSecureStorage();

        // Configure production client
        X402AutoClient client = new X402AutoClient.Builder(account)
            .rpcUrl("https://api.mainnet-beta.solana.com")
            .maxPaymentAmount("10.0")
            .maxRetries(2)
            .allowLocal(false)  // Production security
            .build();

        try {
            logger.info("Making payment-enabled request");

            Response response = client.get("https://api.production.com/premium-data");
            String data = response.body().string();

            logger.info("Request successful: " + data);

        } catch (InsufficientFundsError e) {
            logger.severe("Insufficient funds: " + e.getMessage());
            // Alert user to add funds

        } catch (PaymentRequiredError e) {
            logger.severe("Payment failed after retries");
            // Escalate to support

        } catch (X402Error e) {
            logger.severe("X402 error: " + e.getCode() + " - " + e.getMessage());

        } catch (Exception e) {
            logger.severe("Unexpected error: " + e.getMessage());

        } finally {
            client.close();
        }
    }

    private static Account loadAccountFromSecureStorage() {
        // Load from environment, key vault, etc.
        String secretKey = System.getenv("SOLANA_SECRET_KEY");
        return new Account(decodeSecretKey(secretKey));
    }

    private static byte[] decodeSecretKey(String key) {
        // Implement secure key decoding
        return java.util.Base64.getDecoder().decode(key);
    }
}
```

## Related Documentation

- [Core Library](core.md) - Payment models and blockchain integration
- [API Reference](../reference/api-reference.md) - Complete API documentation
- [Error Handling](../reference/errors.md) - Error types and handling
- [Examples](../examples/basic-usage.md) - More usage examples

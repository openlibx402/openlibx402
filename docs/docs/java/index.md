# OpenLibX402 Java SDK

Welcome to the OpenLibX402 Java SDK documentation. This SDK provides a complete implementation of the X402 payment protocol for Java applications.

## Overview

The Java SDK consists of two main packages:

- **`openlibx402-core`**: Core payment protocol implementation with blockchain integration
- **`openlibx402-client`**: HTTP client libraries with manual and automatic payment handling

## Key Features

- ☕ **Java 11+ Compatible**: Works with modern Java versions
- 🔒 **AutoCloseable Resources**: Proper resource management with try-with-resources
- 🔄 **Sync & Async Support**: CompletableFuture-ready architecture
- 🛡️ **SSRF Protection**: Built-in security against server-side request forgery
- 📦 **Maven Integration**: Standard Maven project structure
- 📚 **Comprehensive JavaDoc**: Complete API documentation

## Quick Start

### Installation

Add to your `pom.xml`:

```xml
<dependencies>
    <dependency>
        <groupId>org.openlibx402</groupId>
        <artifactId>openlibx402-core</artifactId>
        <version>0.1.0</version>
    </dependency>

    <dependency>
        <groupId>org.openlibx402</groupId>
        <artifactId>openlibx402-client</artifactId>
        <version>0.1.0</version>
    </dependency>
</dependencies>
```

### Simple Example

```java
import org.openlibx402.client.X402AutoClient;
import org.p2p.solanaj.core.Account;
import okhttp3.Response;

public class Example {
    public static void main(String[] args) throws Exception {
        Account account = new Account(secretKeyBytes);

        X402AutoClient client = new X402AutoClient.Builder(account)
            .rpcUrl("https://api.devnet.solana.com")
            .maxPaymentAmount("1.0")
            .build();

        try (client) {
            Response response = client.get("https://api.example.com/data");
            System.out.println(response.body().string());
        }
    }
}
```

## Architecture

### Two-Package Design

The Java SDK follows a modular architecture:

```
openlibx402-core/
├── models/           # PaymentRequest, PaymentAuthorization
├── errors/           # Exception hierarchy
├── blockchain/       # SolanaPaymentProcessor
└── util/             # ErrorCodes and utilities

openlibx402-client/
├── X402Client        # Manual payment control
└── X402AutoClient    # Automatic payment handling
```

### Payment Flow

```
Client Request → 402 Response → Payment Creation →
Transaction Broadcast → Payment Verification → Retry with Auth →
200 Response
```

## Client Types

### X402Client (Explicit Control)

For applications that need manual control over the payment flow:

```java
X402Client client = new X402Client(account, rpcUrl, true);

try {
    Response response = client.get(url);
} catch (PaymentRequiredError e) {
    PaymentRequest request = e.getPaymentRequest();
    PaymentAuthorization auth = client.createPayment(request, null);
    Response retryResponse = client.get(url, auth);
}
```

### X402AutoClient (Automatic Handling)

For seamless automatic payment processing:

```java
X402AutoClient client = new X402AutoClient.Builder(account)
    .maxPaymentAmount("5.0")
    .maxRetries(2)
    .build();

Response response = client.get(url);  // Automatically handles payments
```

## Error Handling

All errors extend `X402Error`:

```java
try {
    Response response = client.get(url);
} catch (PaymentRequiredError e) {
    // Handle 402 payment required
} catch (InsufficientFundsError e) {
    // Handle low balance
    System.out.println("Need: " + e.getRequiredAmount());
} catch (X402Error e) {
    // Handle other payment errors
    System.out.println("Error: " + e.getCode());
}
```

## Security

- **SSRF Protection**: Blocks localhost and private IP addresses by default
- **Payment Limits**: Set maximum payment amounts to prevent overspending
- **Key Management**: Private keys handled securely with proper cleanup
- **Resource Cleanup**: AutoCloseable ensures proper resource release

## Next Steps

- [Installation Guide](getting-started/installation.md)
- [Core Library Reference](libraries/core.md)
- [Client Library Reference](libraries/client.md)
- [Examples](examples/basic-usage.md)
- [API Reference](reference/api-reference.md)

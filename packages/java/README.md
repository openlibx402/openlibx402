# OpenLibX402 Java SDK

Java implementation of the X402 payment protocol with Solana blockchain integration.

## Features

- **Two-package architecture**: Separate `core` and `client` packages for flexibility
- **Explicit and automatic payment modes**: Choose manual control or automatic payment handling
- **Type-safe models**: Strong typing for payment requests and authorizations
- **SSRF protection**: Built-in security against server-side request forgery
- **Comprehensive error handling**: Detailed error hierarchy with retry guidance
- **Blockchain integration**: Full Solana transaction support

## Installation

### Maven

Add to your `pom.xml`:

```xml
<dependencies>
    <!-- Core package -->
    <dependency>
        <groupId>org.openlibx402</groupId>
        <artifactId>openlibx402-core</artifactId>
        <version>0.1.0</version>
    </dependency>

    <!-- Client package -->
    <dependency>
        <groupId>org.openlibx402</groupId>
        <artifactId>openlibx402-client</artifactId>
        <version>0.1.0</version>
    </dependency>
</dependencies>
```

### Gradle

Add to your `build.gradle`:

```gradle
dependencies {
    implementation 'org.openlibx402:openlibx402-core:0.1.0'
    implementation 'org.openlibx402:openlibx402-client:0.1.0'
}
```

## Quick Start

### Automatic Payment Client (Recommended)

The `X402AutoClient` automatically handles payment requests:

```java
import org.openlibx402.client.X402AutoClient;
import org.p2p.solanaj.core.Account;
import okhttp3.Response;

// Create account from private key
Account account = new Account(secretKeyBytes);

// Build auto client with configuration
X402AutoClient client = new X402AutoClient.Builder(account)
    .rpcUrl("https://api.devnet.solana.com")
    .maxPaymentAmount("1.0")  // Safety limit
    .maxRetries(2)
    .allowLocal(true)  // Development only!
    .build();

try {
    // Make request - payments handled automatically
    Response response = client.get("https://api.example.com/premium-data");
    System.out.println(response.body().string());
} finally {
    client.close();
}
```

### Manual Payment Client

The `X402Client` gives you full control over payments:

```java
import org.openlibx402.client.X402Client;
import org.openlibx402.core.errors.PaymentRequiredError;
import org.openlibx402.core.models.*;
import org.p2p.solanaj.core.Account;
import okhttp3.Response;

Account account = new Account(secretKeyBytes);
X402Client client = new X402Client(account, "https://api.devnet.solana.com", true);

try {
    // Initial request
    Response response = client.get("https://api.example.com/premium-data");
    System.out.println(response.body().string());

} catch (PaymentRequiredError e) {
    // Get payment request details
    PaymentRequest request = e.getPaymentRequest();
    System.out.println("Payment required: " + request.getMaxAmountRequired());

    // Create and submit payment
    PaymentAuthorization auth = client.createPayment(request, null);

    // Retry request with payment
    Response retryResponse = client.get("https://api.example.com/premium-data", auth);
    System.out.println(retryResponse.body().string());

} finally {
    client.close();
}
```

## Architecture

### Core Package (`openlibx402-core`)

Contains the fundamental payment protocol components:

- **Models**: `PaymentRequest`, `PaymentAuthorization`
- **Errors**: Complete error hierarchy (`X402Error`, `PaymentRequiredError`, etc.)
- **Blockchain**: `SolanaPaymentProcessor` for Solana transactions
- **Utilities**: Error codes and helper functions

### Client Package (`openlibx402-client`)

Provides HTTP clients with payment integration:

- **X402Client**: Manual payment control
- **X402AutoClient**: Automatic payment handling

## Security

### SSRF Protection

By default, both clients block requests to:
- `localhost`, `127.0.0.1`, `::1`
- Private IP ranges (10.0.0.0/8, 192.168.0.0/16, 172.16.0.0/12)

**⚠️ Development Mode**: Set `allowLocal=true` only for local testing. Never use in production!

```java
// Development only!
X402Client client = new X402Client(account, rpcUrl, true);
```

### Payment Safety

Use `maxPaymentAmount` to prevent excessive spending:

```java
X402AutoClient client = new X402AutoClient.Builder(account)
    .maxPaymentAmount("5.0")  // Maximum 5 tokens per payment
    .build();
```

## Error Handling

All errors extend `X402Error` with specific error codes:

```java
import org.openlibx402.core.errors.*;

try {
    Response response = client.get(url);
} catch (PaymentRequiredError e) {
    // Handle 402 payment required
    PaymentRequest request = e.getPaymentRequest();
} catch (InsufficientFundsError e) {
    // Handle low balance
    System.err.println("Need: " + e.getRequiredAmount());
    System.err.println("Have: " + e.getAvailableAmount());
} catch (PaymentExpiredError e) {
    // Handle expired payment request
} catch (X402Error e) {
    // Handle other payment errors
    System.err.println("Error code: " + e.getCode());
}
```

## Building from Source

```bash
cd sdks/java

# Build core package
cd openlibx402-core
mvn clean install

# Build client package
cd ../openlibx402-client
mvn clean install
```

## Testing

```bash
# Run tests for core
cd openlibx402-core
mvn test

# Run tests for client
cd openlibx402-client
mvn test
```

## Requirements

- Java 11 or higher
- Maven 3.6+ or Gradle 7.0+
- Solana wallet with devnet/mainnet access

## API Documentation

Generate JavaDoc:

```bash
mvn javadoc:javadoc
```

View at `target/site/apidocs/index.html`

## Examples

See the `examples/` directory for complete working examples:

- Basic usage
- Error handling
- Custom configuration
- Testing patterns

## License

MIT License - see LICENSE file for details

## Support

- Issues: [GitHub Issues](https://github.com/your-org/openlibx402/issues)
- Documentation: [Full Docs](https://docs.openlibx402.org)

## Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

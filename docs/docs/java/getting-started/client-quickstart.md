# Java Client Quickstart

Get started with the OpenLibX402 Java client in 5 minutes.

## Prerequisites

- Java 11 or higher installed
- Maven or Gradle configured
- OpenLibX402 packages added to your project

See [Installation Guide](installation.md) if you haven't set these up yet.

## Step 1: Create a Solana Account

```java
import org.p2p.solanaj.core.Account;

// For development: generate a new account
Account account = new Account();
System.out.println("Public Key: " + account.getPublicKey());
System.out.println("Secret Key (save this!): " +
    java.util.Base64.getEncoder().encodeToString(account.getSecretKey()));
```

For production, load from secure storage:

```java
// Load from environment variable
String keyEnv = System.getenv("SOLANA_SECRET_KEY");
byte[] secretKey = java.util.Base64.getDecoder().decode(keyEnv);
Account account = new Account(secretKey);
```

## Step 2: Choose Your Client Type

### Option A: Automatic Client (Recommended for Beginners)

Best for quick integration with automatic payment handling.

```java
import org.openlibx402.client.X402AutoClient;
import okhttp3.Response;

// Create client with automatic payment handling
X402AutoClient client = new X402AutoClient.Builder(account)
    .rpcUrl("https://api.devnet.solana.com")
    .maxPaymentAmount("1.0")      // Max 1 USDC per request
    .maxRetries(3)                 // Retry up to 3 times
    .allowLocal(true)              // Development only
    .build();

try {
    // Automatically handles 402 and retries with payment
    Response response = client.get("https://api.example.com/premium-data");
    System.out.println(response.body().string());
} finally {
    client.close();
}
```

### Option B: Manual Client

Best when you need explicit control over payments.

```java
import org.openlibx402.client.X402Client;
import org.openlibx402.core.errors.PaymentRequiredError;
import org.openlibx402.core.models.PaymentAuthorization;
import okhttp3.Response;

// Create client with manual payment control
X402Client client = new X402Client(
    account,
    "https://api.devnet.solana.com",
    true  // allowLocal for development
);

try {
    // Make initial request
    Response response = client.get("https://api.example.com/premium-data");
    System.out.println(response.body().string());

} catch (PaymentRequiredError e) {
    // Handle 402: create payment manually
    PaymentAuthorization auth = client.createPayment(e.getPaymentRequest());

    // Retry with payment
    Response retryResponse = client.get("https://api.example.com/premium-data", auth);
    System.out.println(retryResponse.body().string());

} finally {
    client.close();
}
```

## Step 3: Make Payment-Enabled Requests

### GET Request

```java
Response response = client.get("https://api.example.com/data");
System.out.println(response.body().string());
```

### POST Request with JSON

```java
String jsonBody = "{\"query\": \"process this\"}";
Response response = client.post("https://api.example.com/process", jsonBody);
System.out.println(response.body().string());
```

### PUT Request

```java
String jsonBody = "{\"id\": 123, \"data\": \"updated\"}";
Response response = client.put("https://api.example.com/update", jsonBody);
```

### DELETE Request

```java
Response response = client.delete("https://api.example.com/resource/123");
```

## Step 4: Handle Errors

```java
import org.openlibx402.core.errors.*;

try {
    Response response = client.get(url);
    System.out.println(response.body().string());

} catch (InsufficientFundsError e) {
    System.err.println("Not enough funds!");
    System.err.println("Required: " + e.getRequiredAmount());
    System.err.println("Available: " + e.getAvailableAmount());

} catch (PaymentExpiredError e) {
    System.err.println("Payment request expired, retry...");

} catch (PaymentVerificationError e) {
    System.err.println("Payment not accepted: " + e.getMessage());

} catch (X402Error e) {
    System.err.println("X402 Error: " + e.getCode());

} catch (Exception e) {
    e.printStackTrace();
}
```

## Complete Example

Here's a complete working example:

```java
package com.example;

import org.openlibx402.client.X402AutoClient;
import org.openlibx402.core.errors.*;
import org.p2p.solanaj.core.Account;
import okhttp3.Response;

public class QuickStart {
    public static void main(String[] args) {
        // Load or create account
        Account account = getAccount();

        // Create auto client
        try (X402AutoClient client = new X402AutoClient.Builder(account)
            .rpcUrl("https://api.devnet.solana.com")
            .maxPaymentAmount("1.0")
            .maxRetries(3)
            .allowLocal(true)  // Development only
            .build()
        ) {
            // Make payment-enabled request
            String url = "https://api.example.com/premium-data";
            Response response = client.get(url);

            // Process response
            String data = response.body().string();
            System.out.println("Success! Data: " + data);

        } catch (InsufficientFundsError e) {
            System.err.println("Insufficient funds!");
            System.err.println("Please add funds to: " + account.getPublicKey());

        } catch (PaymentRequiredError e) {
            System.err.println("Payment required but max retries exceeded");

        } catch (X402Error e) {
            System.err.println("X402 Error: " + e.getMessage());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static Account getAccount() {
        // Try loading from environment
        String keyEnv = System.getenv("SOLANA_SECRET_KEY");
        if (keyEnv != null) {
            byte[] secretKey = java.util.Base64.getDecoder().decode(keyEnv);
            return new Account(secretKey);
        }

        // Development: generate new account
        System.out.println("⚠️  Using random account for demo");
        return new Account();
    }
}
```

## Running the Example

### Maven

```bash
# Add to pom.xml
<build>
    <plugins>
        <plugin>
            <groupId>org.codehaus.mojo</groupId>
            <artifactId>exec-maven-plugin</artifactId>
            <version>3.1.0</version>
            <configuration>
                <mainClass>com.example.QuickStart</mainClass>
            </configuration>
        </plugin>
    </plugins>
</build>

# Run
mvn clean compile exec:java
```

### Gradle

```bash
# Add to build.gradle
application {
    mainClass = 'com.example.QuickStart'
}

# Run
gradle run
```

### With Environment Variable

```bash
export SOLANA_SECRET_KEY="your-base64-encoded-key"
mvn exec:java
```

## Next Steps

### 1. Learn More Patterns

Explore [Basic Usage Examples](../examples/basic-usage.md) for:
- Error handling patterns
- Multi-threaded usage
- Custom HTTP configuration
- Balance checking

### 2. Understand the API

Read the [Client Library Reference](../libraries/client.md) for:
- Complete API documentation
- All available methods
- Configuration options
- Best practices

### 3. Set Up for Production

See [Error Handling Guide](../reference/errors.md) for:
- Comprehensive error handling
- Production deployment
- Security considerations
- Monitoring and logging

## Common Issues

### "PaymentRequiredError: Payment Required"

**Cause:** API requires payment, but automatic payment failed.

**Solutions:**
1. Check balance: `processor.getBalance(account.getPublicKey())`
2. Increase `maxRetries` in builder
3. Increase `maxPaymentAmount` if payment exceeds limit

### "InsufficientFundsError"

**Cause:** Not enough USDC in your account.

**Solution:** Add funds to your Solana account:
```bash
# Get your public key
System.out.println(account.getPublicKey());

# Fund on devnet (development)
# Use Solana faucet or transfer USDC to this address
```

### "IllegalArgumentException: Requests to localhost are blocked"

**Cause:** SSRF protection blocking local URLs.

**Solution:** For development only, use `allowLocal(true)`:
```java
.allowLocal(true)  // Only for development!
```

### "IOException: Connection timeout"

**Cause:** Network issues or slow RPC endpoint.

**Solution:** Use custom HTTP client with longer timeouts:
```java
OkHttpClient httpClient = new OkHttpClient.Builder()
    .connectTimeout(60, TimeUnit.SECONDS)
    .readTimeout(60, TimeUnit.SECONDS)
    .build();

X402AutoClient client = new X402AutoClient.Builder(account)
    .httpClient(httpClient)
    .build();
```

## Tips for Success

1. **Start with AutoClient**: Use `X402AutoClient` for quick integration
2. **Use try-with-resources**: Ensures proper cleanup
3. **Development mode**: Use `allowLocal(true)` and devnet for testing
4. **Production mode**: Use mainnet RPC and `allowLocal(false)`
5. **Handle errors**: Always catch `InsufficientFundsError` and other exceptions
6. **Set limits**: Configure `maxPaymentAmount` to prevent overspending
7. **Secure keys**: Never hardcode secret keys, use environment variables
8. **Check balance**: Verify funds before making many requests

## Resources

- [Full Example Application](https://github.com/openlibx402/openlibx402/tree/main/examples/java/simple-client)
- [Client Library Documentation](../libraries/client.md)
- [Core Library Documentation](../libraries/core.md)
- [API Reference](../reference/api-reference.md)
- [Error Handling](../reference/errors.md)

## Support

Need help?

- Check [GitHub Issues](https://github.com/openlibx402/openlibx402/issues)
- Read [Full Documentation](https://docs.openlibx402.org)
- See [More Examples](../examples/basic-usage.md)

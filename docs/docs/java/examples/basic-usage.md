# Java Basic Usage Examples

This guide provides practical examples of using the OpenLibX402 Java SDK.

## Prerequisites

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

## Example 1: Manual Payment Handling

This example demonstrates explicit control over the payment flow using `X402Client`.

```java
import org.openlibx402.client.X402Client;
import org.openlibx402.core.errors.*;
import org.openlibx402.core.models.*;
import org.p2p.solanaj.core.Account;
import okhttp3.Response;

public class ManualPaymentExample {
    public static void main(String[] args) {
        // Load Solana account (securely in production!)
        byte[] secretKey = loadSecretKey();
        Account account = new Account(secretKey);

        // Create client
        try (X402Client client = new X402Client(
            account,
            "https://api.devnet.solana.com",
            true  // allowLocal for development only
        )) {
            String url = "https://api.example.com/premium-data";

            // Make initial request
            try {
                Response response = client.get(url);
                System.out.println("Success: " + response.body().string());

            } catch (PaymentRequiredError e) {
                System.out.println("Payment required!");

                // Get payment request details
                PaymentRequest request = e.getPaymentRequest();
                System.out.println("Amount: " + request.getMaxAmountRequired());
                System.out.println("Asset: " + request.getAssetType());
                System.out.println("Description: " + request.getDescription());

                // Create payment
                PaymentAuthorization auth = client.createPayment(request);
                System.out.println("Payment created: " + auth.getSignature());

                // Retry request with payment authorization
                Response retryResponse = client.get(url, auth);
                System.out.println("Success: " + retryResponse.body().string());
            }

        } catch (InsufficientFundsError e) {
            System.err.println("Insufficient funds!");
            System.err.println("Required: " + e.getRequiredAmount());
            System.err.println("Available: " + e.getAvailableAmount());

        } catch (X402Error e) {
            System.err.println("X402 Error: " + e.getCode());
            System.err.println("Message: " + e.getMessage());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static byte[] loadSecretKey() {
        // In production, load from secure storage
        String keyEnv = System.getenv("SOLANA_SECRET_KEY");
        if (keyEnv != null) {
            return java.util.Base64.getDecoder().decode(keyEnv);
        }

        // For demo: generate random account
        System.out.println("⚠️  Using random account for demo");
        return new Account().getSecretKey();
    }
}
```

## Example 2: Automatic Payment Handling

This example shows automatic payment handling using `X402AutoClient`.

```java
import org.openlibx402.client.X402AutoClient;
import org.openlibx402.core.errors.*;
import org.p2p.solanaj.core.Account;
import okhttp3.Response;

public class AutoPaymentExample {
    public static void main(String[] args) {
        byte[] secretKey = loadSecretKey();
        Account account = new Account(secretKey);

        // Build auto-client with payment limits
        try (X402AutoClient client = new X402AutoClient.Builder(account)
            .rpcUrl("https://api.devnet.solana.com")
            .maxPaymentAmount("1.0")      // Max 1 USDC per request
            .maxRetries(3)                 // Retry up to 3 times
            .allowLocal(true)              // Development only
            .build()
        ) {
            // Client automatically handles 402 and retries
            String url = "https://api.example.com/premium-data";
            Response response = client.get(url);

            System.out.println("Success: " + response.body().string());

        } catch (InsufficientFundsError e) {
            System.err.println("Insufficient funds for payment");

        } catch (PaymentRequiredError e) {
            System.err.println("Payment required but max retries exceeded");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static byte[] loadSecretKey() {
        String keyEnv = System.getenv("SOLANA_SECRET_KEY");
        if (keyEnv != null) {
            return java.util.Base64.getDecoder().decode(keyEnv);
        }
        return new Account().getSecretKey();
    }
}
```

## Example 3: POST Requests with JSON

Making POST requests with JSON body.

```java
import org.openlibx402.client.X402Client;
import org.p2p.solanaj.core.Account;
import okhttp3.Response;

public class PostRequestExample {
    public static void main(String[] args) {
        Account account = new Account(loadSecretKey());

        try (X402Client client = new X402Client(account, null, true)) {
            String url = "https://api.example.com/process";

            // JSON request body
            String jsonBody = "{"
                + "\"query\": \"Analyze this data\","
                + "\"options\": {\"format\": \"json\"}"
                + "}";

            try {
                // Make POST request
                Response response = client.post(url, jsonBody);
                System.out.println("Result: " + response.body().string());

            } catch (PaymentRequiredError e) {
                // Handle payment
                PaymentAuthorization auth = client.createPayment(e.getPaymentRequest());

                // Retry with payment
                Response retryResponse = client.post(url, jsonBody, auth);
                System.out.println("Result: " + retryResponse.body().string());
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static byte[] loadSecretKey() {
        return new Account().getSecretKey();
    }
}
```

## Example 4: Error Handling Patterns

Comprehensive error handling for production applications.

```java
import org.openlibx402.client.X402Client;
import org.openlibx402.core.errors.*;
import org.p2p.solanaj.core.Account;
import okhttp3.Response;
import java.io.IOException;
import java.util.logging.Logger;

public class ErrorHandlingExample {
    private static final Logger logger = Logger.getLogger(ErrorHandlingExample.class.getName());

    public static void main(String[] args) {
        Account account = new Account(loadSecretKey());

        try (X402Client client = new X402Client(account, null, false)) {
            Response response = makePaymentEnabledRequest(client, "https://api.example.com/data");
            logger.info("Success: " + response.body().string());

        } catch (Exception e) {
            logger.severe("Fatal error: " + e.getMessage());
        }
    }

    private static Response makePaymentEnabledRequest(X402Client client, String url) throws Exception {
        try {
            return client.get(url);

        } catch (PaymentRequiredError e) {
            logger.info("Payment required, creating payment...");
            return handlePayment(client, url, e.getPaymentRequest());

        } catch (InsufficientFundsError e) {
            logger.severe("Insufficient funds!");
            logger.severe("Required: " + e.getRequiredAmount());
            logger.severe("Available: " + e.getAvailableAmount());
            throw new RuntimeException("Cannot complete payment", e);

        } catch (PaymentExpiredError e) {
            logger.warning("Payment request expired");
            // Retry to get new payment request
            return makePaymentEnabledRequest(client, url);

        } catch (PaymentVerificationError e) {
            logger.severe("Payment verification failed: " + e.getMessage());
            throw new RuntimeException("Payment not accepted", e);

        } catch (TransactionBroadcastError e) {
            logger.severe("Transaction broadcast failed: " + e.getMessage());
            throw new RuntimeException("Cannot broadcast payment", e);

        } catch (InvalidPaymentRequestError e) {
            logger.severe("Invalid payment request: " + e.getMessage());
            throw new RuntimeException("Server sent invalid payment request", e);

        } catch (IOException e) {
            logger.severe("Network error: " + e.getMessage());
            throw new RuntimeException("Network communication failed", e);
        }
    }

    private static Response handlePayment(X402Client client, String url, PaymentRequest request) throws Exception {
        // Check if expired
        if (request.isExpired()) {
            logger.warning("Payment request already expired");
            throw new PaymentExpiredError(request);
        }

        // Validate amount
        double amount = Double.parseDouble(request.getMaxAmountRequired());
        if (amount > 10.0) {
            logger.warning("Payment exceeds maximum allowed amount");
            throw new RuntimeException("Payment too high: " + amount);
        }

        // Create payment
        PaymentAuthorization auth = client.createPayment(request);
        logger.info("Payment created: " + auth.getSignature());

        // Retry request
        return client.get(url, auth);
    }

    private static byte[] loadSecretKey() {
        return new Account().getSecretKey();
    }
}
```

## Example 5: Custom HTTP Configuration

Using a custom OkHttp client with specific configuration.

```java
import org.openlibx402.client.X402AutoClient;
import org.p2p.solanaj.core.Account;
import okhttp3.OkHttpClient;
import okhttp3.Response;
import java.util.concurrent.TimeUnit;

public class CustomHttpExample {
    public static void main(String[] args) {
        Account account = new Account(loadSecretKey());

        // Custom HTTP client with longer timeouts
        OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(60, TimeUnit.SECONDS)
            .readTimeout(120, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build();

        // Use custom client
        try (X402AutoClient client = new X402AutoClient.Builder(account)
            .rpcUrl("https://api.mainnet-beta.solana.com")
            .maxPaymentAmount("5.0")
            .httpClient(httpClient)
            .build()
        ) {
            Response response = client.get("https://api.example.com/slow-endpoint");
            System.out.println("Success: " + response.body().string());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static byte[] loadSecretKey() {
        return new Account().getSecretKey();
    }
}
```

## Example 6: Checking Balance Before Payment

Verify sufficient funds before attempting payment.

```java
import org.openlibx402.client.X402Client;
import org.openlibx402.core.blockchain.SolanaPaymentProcessor;
import org.openlibx402.core.models.*;
import org.p2p.solanaj.core.Account;
import okhttp3.Response;

public class BalanceCheckExample {
    public static void main(String[] args) {
        Account account = new Account(loadSecretKey());

        try (X402Client client = new X402Client(account, null, true)) {
            // Check balance first
            SolanaPaymentProcessor processor = client.getProcessor();
            String balance = processor.getBalance(account.getPublicKey());
            System.out.println("Current balance: " + balance + " USDC");

            // Make request
            try {
                Response response = client.get("https://api.example.com/premium-data");
                System.out.println("Success: " + response.body().string());

            } catch (PaymentRequiredError e) {
                PaymentRequest request = e.getPaymentRequest();
                double required = Double.parseDouble(request.getMaxAmountRequired());
                double available = Double.parseDouble(balance);

                if (available < required) {
                    System.err.println("Insufficient funds!");
                    System.err.println("Required: " + required);
                    System.err.println("Available: " + available);
                    System.err.println("Please add " + (required - available) + " USDC");
                    return;
                }

                // Create payment
                PaymentAuthorization auth = client.createPayment(request);

                // Retry
                Response retryResponse = client.get("https://api.example.com/premium-data", auth);
                System.out.println("Success: " + retryResponse.body().string());

                // Check new balance
                String newBalance = processor.getBalance(account.getPublicKey());
                System.out.println("New balance: " + newBalance + " USDC");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static byte[] loadSecretKey() {
        return new Account().getSecretKey();
    }
}
```

## Example 7: Multi-threaded Usage

Using clients in a multi-threaded environment.

```java
import org.openlibx402.client.X402AutoClient;
import org.p2p.solanaj.core.Account;
import okhttp3.Response;
import java.util.concurrent.*;

public class MultiThreadedExample {
    public static void main(String[] args) throws InterruptedException {
        Account account = new Account(loadSecretKey());
        ExecutorService executor = Executors.newFixedThreadPool(5);

        // Submit multiple concurrent requests
        for (int i = 0; i < 10; i++) {
            final int taskId = i;
            executor.submit(() -> makeRequest(account, taskId));
        }

        executor.shutdown();
        executor.awaitTermination(5, TimeUnit.MINUTES);
    }

    private static void makeRequest(Account account, int taskId) {
        // Each thread gets its own client
        try (X402AutoClient client = new X402AutoClient.Builder(account)
            .rpcUrl("https://api.devnet.solana.com")
            .maxPaymentAmount("1.0")
            .build()
        ) {
            String url = "https://api.example.com/data?id=" + taskId;
            Response response = client.get(url);

            System.out.println("Task " + taskId + ": " + response.body().string());

        } catch (Exception e) {
            System.err.println("Task " + taskId + " failed: " + e.getMessage());
        }
    }

    private static byte[] loadSecretKey() {
        return new Account().getSecretKey();
    }
}
```

## Complete Example Application

For a complete working example, see the [simple-client example](https://github.com/openlibx402/openlibx402/tree/main/examples/java/simple-client) in the repository.

```bash
# Clone repository
git clone https://github.com/openlibx402/openlibx402.git
cd openlibx402/examples/java/simple-client

# Run example
mvn clean compile exec:java
```

## Best Practices

1. **Secure Key Management**: Never hardcode secret keys
2. **Use Try-with-Resources**: Ensures proper cleanup
3. **Handle All Errors**: Catch specific exception types
4. **Check Balances**: Verify funds before payments
5. **Set Payment Limits**: Use `maxPaymentAmount` in production
6. **Production Security**: Never use `allowLocal=true` in production
7. **Thread Safety**: Create separate clients for each thread
8. **Logging**: Log payment activities for auditing

## Related Documentation

- [Installation Guide](../getting-started/installation.md)
- [Client Quickstart](../getting-started/client-quickstart.md)
- [Client Library Reference](../libraries/client.md)
- [Error Handling](../reference/errors.md)

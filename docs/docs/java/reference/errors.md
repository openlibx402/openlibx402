# Java Error Handling

Comprehensive guide to error handling in the OpenLibX402 Java SDK.

## Error Hierarchy

All X402 errors extend the base `X402Error` class:

```
X402Error (extends Exception)
├── PaymentRequiredError
├── InsufficientFundsError
├── PaymentExpiredError
├── PaymentVerificationError
├── TransactionBroadcastError
└── InvalidPaymentRequestError
```

## Base Error Class

### X402Error

Base exception for all X402-related errors.

```java
public class X402Error extends Exception {
    private final String code;
    private final Map<String, Object> details;

    public String getCode() { return code; }
    public Map<String, Object> getDetails() { return details; }
    public String getMessage() { return message; }
}
```

**Common Fields:**
- `code`: Error code string (e.g., "PAYMENT_REQUIRED")
- `message`: Human-readable error message
- `details`: Additional error context

## Error Types

### PaymentRequiredError

Thrown when server returns 402 Payment Required.

```java
public class PaymentRequiredError extends X402Error {
    private final PaymentRequest paymentRequest;

    public PaymentRequest getPaymentRequest() { return paymentRequest; }
}
```

**Error Code:** `PAYMENT_REQUIRED`

**When Thrown:**
- Server responds with HTTP 402
- Payment is required to access resource

**How to Handle:**
```java
try {
    Response response = client.get(url);
} catch (PaymentRequiredError e) {
    PaymentRequest request = e.getPaymentRequest();
    System.out.println("Payment required: " + request.getMaxAmountRequired());

    // Create payment and retry
    PaymentAuthorization auth = client.createPayment(request);
    Response retry = client.get(url, auth);
}
```

---

### InsufficientFundsError

Thrown when account doesn't have enough funds for payment.

```java
public class InsufficientFundsError extends X402Error {
    private final String requiredAmount;
    private final String availableAmount;

    public String getRequiredAmount() { return requiredAmount; }
    public String getAvailableAmount() { return availableAmount; }
}
```

**Error Code:** `INSUFFICIENT_FUNDS`

**When Thrown:**
- Account balance is less than required payment
- Attempting to create payment without sufficient funds

**How to Handle:**
```java
try {
    PaymentAuthorization auth = client.createPayment(request);
} catch (InsufficientFundsError e) {
    System.err.println("Insufficient funds!");
    System.err.println("Required: " + e.getRequiredAmount() + " USDC");
    System.err.println("Available: " + e.getAvailableAmount() + " USDC");
    System.err.println("Shortfall: " +
        (Double.parseDouble(e.getRequiredAmount()) -
         Double.parseDouble(e.getAvailableAmount())) + " USDC");

    // Prompt user to add funds
    alertUserToAddFunds(account.getPublicKey());
}
```

---

### PaymentExpiredError

Thrown when payment request has expired.

```java
public class PaymentExpiredError extends X402Error {
    private final PaymentRequest paymentRequest;

    public PaymentRequest getPaymentRequest() { return paymentRequest; }
}
```

**Error Code:** `PAYMENT_EXPIRED`

**When Thrown:**
- Payment request's `expiresAt` timestamp has passed
- Attempting to create payment for expired request

**How to Handle:**
```java
try {
    PaymentAuthorization auth = client.createPayment(request);
} catch (PaymentExpiredError e) {
    System.out.println("Payment request expired, retrying...");

    // Make new request to get fresh payment details
    try {
        Response response = client.get(url);
    } catch (PaymentRequiredError e2) {
        // Handle new payment request
        PaymentRequest newRequest = e2.getPaymentRequest();
        PaymentAuthorization auth = client.createPayment(newRequest);
        Response retry = client.get(url, auth);
    }
}
```

---

### PaymentVerificationError

Thrown when payment cannot be verified on blockchain.

```java
public class PaymentVerificationError extends X402Error {
    // Standard X402Error methods
}
```

**Error Code:** `PAYMENT_VERIFICATION_FAILED`

**When Thrown:**
- Transaction not found on blockchain
- Transaction failed or was not confirmed
- Server rejected payment proof

**How to Handle:**
```java
try {
    PaymentAuthorization auth = client.createPayment(request);
    Response response = client.get(url, auth);
} catch (PaymentVerificationError e) {
    System.err.println("Payment verification failed: " + e.getMessage());

    // Check transaction status
    SolanaPaymentProcessor processor = client.getProcessor();
    boolean confirmed = processor.verifyTransaction(auth.getSignature());

    if (!confirmed) {
        System.err.println("Transaction not confirmed, wait and retry");
        Thread.sleep(5000);
        // Retry verification
    } else {
        System.err.println("Transaction confirmed but server rejected it");
        // Contact support
    }
}
```

---

### TransactionBroadcastError

Thrown when transaction cannot be broadcast to blockchain.

```java
public class TransactionBroadcastError extends X402Error {
    // Standard X402Error methods
}
```

**Error Code:** `TRANSACTION_BROADCAST_FAILED`

**When Thrown:**
- Network error during transaction broadcast
- RPC endpoint unavailable
- Transaction rejected by blockchain

**How to Handle:**
```java
try {
    PaymentAuthorization auth = client.createPayment(request);
} catch (TransactionBroadcastError e) {
    System.err.println("Failed to broadcast transaction: " + e.getMessage());

    // Check if it's a network issue
    Map<String, Object> details = e.getDetails();
    if (details.containsKey("networkError")) {
        System.err.println("Network error, retrying...");
        Thread.sleep(2000);
        // Retry payment creation
    } else {
        System.err.println("Transaction rejected");
        // Log and alert
    }
}
```

---

### InvalidPaymentRequestError

Thrown when payment request format is invalid.

```java
public class InvalidPaymentRequestError extends X402Error {
    // Standard X402Error methods
}
```

**Error Code:** `INVALID_PAYMENT_REQUEST`

**When Thrown:**
- 402 response has invalid JSON format
- Required fields missing from payment request
- Payment request has invalid values

**How to Handle:**
```java
try {
    PaymentRequest request = client.parsePaymentRequest(response);
} catch (InvalidPaymentRequestError e) {
    System.err.println("Invalid payment request: " + e.getMessage());
    System.err.println("Server sent malformed payment request");

    // Log for debugging
    logger.error("Invalid payment request from: " + url);
    logger.error("Response body: " + response.body().string());

    // Contact API provider
    throw new RuntimeException("API sent invalid payment request", e);
}
```

---

## Comprehensive Error Handling Pattern

### Pattern 1: Explicit Error Handling

Handle each error type explicitly:

```java
public Response makePaymentEnabledRequest(X402Client client, String url) {
    try {
        // Attempt request
        return client.get(url);

    } catch (PaymentRequiredError e) {
        // Handle 402: create payment and retry
        try {
            PaymentRequest request = e.getPaymentRequest();
            PaymentAuthorization auth = client.createPayment(request);
            return client.get(url, auth);
        } catch (X402Error nested) {
            throw new RuntimeException("Payment failed", nested);
        }

    } catch (InsufficientFundsError e) {
        // Alert user to add funds
        logger.error("Insufficient funds: need " + e.getRequiredAmount());
        throw new RuntimeException("Cannot complete payment: insufficient funds", e);

    } catch (PaymentExpiredError e) {
        // Retry to get fresh payment request
        logger.warn("Payment expired, retrying...");
        return makePaymentEnabledRequest(client, url);

    } catch (PaymentVerificationError e) {
        // Payment created but not accepted
        logger.error("Payment verification failed: " + e.getMessage());
        throw new RuntimeException("Payment not accepted", e);

    } catch (TransactionBroadcastError e) {
        // Network or broadcast issue
        logger.error("Transaction broadcast failed: " + e.getMessage());
        throw new RuntimeException("Cannot broadcast payment", e);

    } catch (InvalidPaymentRequestError e) {
        // Server sent invalid payment request
        logger.error("Invalid payment request: " + e.getMessage());
        throw new RuntimeException("API error: invalid payment request", e);

    } catch (IOException e) {
        // Network error
        logger.error("Network error: " + e.getMessage());
        throw new RuntimeException("Network communication failed", e);

    } catch (Exception e) {
        // Unexpected error
        logger.error("Unexpected error: " + e.getMessage(), e);
        throw new RuntimeException("Unexpected error", e);
    }
}
```

### Pattern 2: Error Recovery with Retries

Implement retry logic with exponential backoff:

```java
public Response makeRequestWithRetry(X402Client client, String url, int maxRetries) {
    int attempt = 0;
    long backoffMs = 1000;

    while (attempt < maxRetries) {
        try {
            return client.get(url);

        } catch (PaymentRequiredError e) {
            // Handle payment
            PaymentAuthorization auth = client.createPayment(e.getPaymentRequest());
            return client.get(url, auth);

        } catch (PaymentExpiredError e) {
            // Retry immediately for expired requests
            logger.warn("Payment expired, retrying...");
            attempt++;
            continue;

        } catch (TransactionBroadcastError e) {
            // Retry with backoff for broadcast errors
            if (attempt < maxRetries - 1) {
                logger.warn("Broadcast failed, retrying in " + backoffMs + "ms");
                Thread.sleep(backoffMs);
                backoffMs *= 2;
                attempt++;
                continue;
            }
            throw new RuntimeException("Max retries exceeded", e);

        } catch (X402Error | IOException e) {
            throw new RuntimeException("Request failed", e);
        }
    }

    throw new RuntimeException("Max retries exceeded");
}
```

### Pattern 3: User-Friendly Error Messages

Convert technical errors to user-friendly messages:

```java
public String getUserFriendlyErrorMessage(Exception e) {
    if (e instanceof InsufficientFundsError) {
        InsufficientFundsError err = (InsufficientFundsError) e;
        return String.format(
            "You don't have enough funds. Required: %s USDC, Available: %s USDC. " +
            "Please add funds to continue.",
            err.getRequiredAmount(),
            err.getAvailableAmount()
        );

    } else if (e instanceof PaymentRequiredError) {
        PaymentRequiredError err = (PaymentRequiredError) e;
        return String.format(
            "This resource requires a payment of %s USDC. Would you like to proceed?",
            err.getPaymentRequest().getMaxAmountRequired()
        );

    } else if (e instanceof PaymentExpiredError) {
        return "The payment request expired. Please try again.";

    } else if (e instanceof PaymentVerificationError) {
        return "Your payment couldn't be verified. Please contact support if this persists.";

    } else if (e instanceof TransactionBroadcastError) {
        return "There was a problem processing your payment. Please check your connection and try again.";

    } else if (e instanceof InvalidPaymentRequestError) {
        return "The server sent an invalid payment request. Please contact the API provider.";

    } else if (e instanceof IOException) {
        return "Network error. Please check your internet connection and try again.";

    } else {
        return "An unexpected error occurred. Please try again later.";
    }
}
```

### Pattern 4: Logging and Monitoring

Implement comprehensive logging:

```java
import java.util.logging.Logger;
import java.util.logging.Level;

public class PaymentLogger {
    private static final Logger logger = Logger.getLogger(PaymentLogger.class.getName());

    public static void logPaymentAttempt(PaymentRequest request) {
        logger.info(String.format(
            "Payment attempt - Amount: %s, Address: %s, ID: %s",
            request.getMaxAmountRequired(),
            request.getPaymentAddress(),
            request.getPaymentId()
        ));
    }

    public static void logPaymentSuccess(PaymentAuthorization auth) {
        logger.info(String.format(
            "Payment successful - Signature: %s, Amount: %s",
            auth.getSignature(),
            auth.getAmount()
        ));
    }

    public static void logPaymentError(X402Error error, PaymentRequest request) {
        logger.log(Level.SEVERE, String.format(
            "Payment failed - Code: %s, Message: %s, Payment ID: %s",
            error.getCode(),
            error.getMessage(),
            request != null ? request.getPaymentId() : "N/A"
        ), error);

        // Send to monitoring service
        sendToMonitoring(error);
    }

    private static void sendToMonitoring(X402Error error) {
        // Integrate with monitoring service (Datadog, New Relic, etc.)
    }
}
```

## Production Best Practices

### 1. Always Handle Insufficient Funds

```java
try {
    Response response = autoClient.get(url);
} catch (InsufficientFundsError e) {
    // Alert user immediately
    notifyUser("Please add funds to your account");

    // Log for monitoring
    logger.error("Insufficient funds for user: " + userId);

    // Send alert to admin dashboard
    alertDashboard("User " + userId + " has insufficient funds");
}
```

### 2. Set Payment Limits

```java
X402AutoClient client = new X402AutoClient.Builder(account)
    .maxPaymentAmount("10.0")  // Never pay more than 10 USDC
    .build();
```

### 3. Validate Before Payment

```java
PaymentRequest request = e.getPaymentRequest();

// Check amount
double amount = Double.parseDouble(request.getMaxAmountRequired());
if (amount > MAX_ALLOWED_PAYMENT) {
    throw new RuntimeException("Payment exceeds maximum allowed: " + amount);
}

// Check expiration
if (request.isExpired()) {
    throw new PaymentExpiredError(request);
}

// Check balance
String balance = processor.getBalance(account.getPublicKey());
if (Double.parseDouble(balance) < amount) {
    throw new InsufficientFundsError(
        request.getMaxAmountRequired(),
        balance,
        "Insufficient funds"
    );
}

// Proceed with payment
PaymentAuthorization auth = client.createPayment(request);
```

### 4. Implement Circuit Breaker

```java
public class CircuitBreaker {
    private int failureCount = 0;
    private static final int FAILURE_THRESHOLD = 5;
    private static final long COOLDOWN_MS = 60000;
    private long lastFailureTime = 0;

    public boolean shouldAttemptPayment() {
        if (failureCount >= FAILURE_THRESHOLD) {
            if (System.currentTimeMillis() - lastFailureTime < COOLDOWN_MS) {
                return false;  // Circuit open
            } else {
                reset();  // Try again after cooldown
            }
        }
        return true;
    }

    public void recordFailure() {
        failureCount++;
        lastFailureTime = System.currentTimeMillis();
    }

    public void recordSuccess() {
        reset();
    }

    private void reset() {
        failureCount = 0;
    }
}
```

### 5. Audit Trail

```java
public class PaymentAuditor {
    public static void logPaymentActivity(
        String userId,
        PaymentRequest request,
        PaymentAuthorization auth,
        boolean success,
        Exception error
    ) {
        Map<String, Object> auditEntry = new HashMap<>();
        auditEntry.put("timestamp", Instant.now().toString());
        auditEntry.put("userId", userId);
        auditEntry.put("paymentId", request.getPaymentId());
        auditEntry.put("amount", request.getMaxAmountRequired());
        auditEntry.put("paymentAddress", request.getPaymentAddress());
        auditEntry.put("success", success);

        if (auth != null) {
            auditEntry.put("signature", auth.getSignature());
        }

        if (error != null) {
            auditEntry.put("errorCode", ((X402Error) error).getCode());
            auditEntry.put("errorMessage", error.getMessage());
        }

        // Save to audit log
        saveToAuditLog(auditEntry);
    }

    private static void saveToAuditLog(Map<String, Object> entry) {
        // Persist to database, file, or logging service
    }
}
```

## Testing Error Handling

### Unit Tests

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class ErrorHandlingTest {

    @Test
    public void testInsufficientFundsError() {
        InsufficientFundsError error = new InsufficientFundsError(
            "1.0",
            "0.5",
            "Insufficient funds"
        );

        assertEquals("INSUFFICIENT_FUNDS", error.getCode());
        assertEquals("1.0", error.getRequiredAmount());
        assertEquals("0.5", error.getAvailableAmount());
    }

    @Test
    public void testPaymentExpired() {
        PaymentRequest request = createExpiredPaymentRequest();
        assertTrue(request.isExpired());

        PaymentExpiredError error = new PaymentExpiredError(request);
        assertEquals("PAYMENT_EXPIRED", error.getCode());
        assertEquals(request, error.getPaymentRequest());
    }
}
```

## Related Documentation

- [API Reference](api-reference.md)
- [Client Library](../libraries/client.md)
- [Examples](../examples/basic-usage.md)

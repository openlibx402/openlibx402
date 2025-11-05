# Kotlin Error Handling

Comprehensive guide to error handling in the OpenLibX402 Kotlin SDK using sealed classes and when expressions.

## Error Hierarchy

All X402 errors are part of a sealed class hierarchy, enabling type-safe, exhaustive error handling:

```
X402Error (sealed class, extends Exception)
├── PaymentRequired (data class)
├── InsufficientFunds (data class)
├── PaymentExpired (data class)
├── PaymentVerificationFailed (data class)
├── TransactionBroadcastFailed (data class)
├── InvalidPaymentRequest (data class)
└── Generic (data class)
```

## Base Sealed Class

### X402Error

Base sealed class for all X402-related errors.

```kotlin
sealed class X402Error(
    override val message: String,
    val code: String,
    val details: Map<String, Any> = emptyMap()
) : Exception(message)
```

**Common Properties:**
- `message` (String): Human-readable error message
- `code` (String): Error code string (e.g., "PAYMENT_REQUIRED")
- `details` (Map<String, Any>): Additional error context

**Benefits of Sealed Classes:**
- Exhaustive when expressions (compiler checks all cases)
- Type-safe error handling
- No need for catch-all branches
- IDE support for autocomplete

## Error Types

### PaymentRequired

Thrown when server returns 402 Payment Required.

```kotlin
data class PaymentRequired(
    val paymentRequest: PaymentRequest,
    override val message: String = "Payment required to access this resource"
) : X402Error(
    message = message,
    code = "PAYMENT_REQUIRED",
    details = mapOf("payment_request" to paymentRequest.toMap())
)
```

**Error Code:** `PAYMENT_REQUIRED`

**When Thrown:**
- Server responds with HTTP 402
- Payment is required to access resource

**How to Handle:**
```kotlin
suspend fun handlePaymentRequired() {
    try {
        val response = client.get(url)
    } catch (e: X402Error.PaymentRequired) {
        val request = e.paymentRequest
        println("Payment required: ${request.maxAmountRequired} ${request.assetType}")

        // Create payment and retry
        val auth = client.createPayment(request)
        val retry = client.get(url, auth)
    }
}
```

---

### InsufficientFunds

Thrown when account doesn't have enough funds for payment.

```kotlin
data class InsufficientFunds(
    val requiredAmount: String,
    val availableAmount: String,
    override val message: String = "Insufficient funds: required $requiredAmount, available $availableAmount"
) : X402Error(
    message = message,
    code = "INSUFFICIENT_FUNDS",
    details = mapOf(
        "required_amount" to requiredAmount,
        "available_amount" to availableAmount
    )
)
```

**Error Code:** `INSUFFICIENT_FUNDS`

**When Thrown:**
- Account balance is less than required payment
- Attempting to create payment without sufficient funds

**How to Handle:**
```kotlin
try {
    val auth = client.createPayment(request)
} catch (e: X402Error.InsufficientFunds) {
    println("Insufficient funds!")
    println("Required: ${e.requiredAmount} USDC")
    println("Available: ${e.availableAmount} USDC")

    val shortfall = e.requiredAmount.toDouble() - e.availableAmount.toDouble()
    println("Need to add: $shortfall USDC")

    // Prompt user to add funds
    alertUserToAddFunds(account.publicKey, shortfall)
}
```

---

### PaymentExpired

Thrown when payment request has expired.

```kotlin
data class PaymentExpired(
    val paymentRequest: PaymentRequest,
    override val message: String = "Payment request has expired"
) : X402Error(
    message = message,
    code = "PAYMENT_EXPIRED",
    details = mapOf(
        "payment_request" to paymentRequest.toMap(),
        "expires_at" to paymentRequest.expiresAt.toString()
    )
)
```

**Error Code:** `PAYMENT_EXPIRED`

**When Thrown:**
- Payment request's `expiresAt` timestamp has passed
- Attempting to create payment for expired request

**How to Handle:**
```kotlin
suspend fun handleExpiredPayment() {
    try {
        val auth = client.createPayment(request)
    } catch (e: X402Error.PaymentExpired) {
        println("Payment request expired at: ${e.paymentRequest.expiresAt}")
        println("Retrying to get fresh payment request...")

        // Make new request to get fresh payment details
        try {
            val response = client.get(url)
        } catch (e2: X402Error.PaymentRequired) {
            // Handle new payment request
            val newRequest = e2.paymentRequest
            val auth = client.createPayment(newRequest)
            val retry = client.get(url, auth)
        }
    }
}
```

---

### PaymentVerificationFailed

Thrown when payment cannot be verified on blockchain.

```kotlin
data class PaymentVerificationFailed(
    val reason: String,
    override val message: String = "Payment verification failed: $reason"
) : X402Error(
    message = message,
    code = "PAYMENT_VERIFICATION_FAILED",
    details = mapOf("reason" to reason)
)
```

**Error Code:** `PAYMENT_VERIFICATION_FAILED`

**When Thrown:**
- Transaction not found on blockchain
- Transaction failed or was not confirmed
- Server rejected payment proof

**How to Handle:**
```kotlin
import kotlinx.coroutines.delay

suspend fun handleVerificationFailure() {
    try {
        val auth = client.createPayment(request)
        val response = client.get(url, auth)
    } catch (e: X402Error.PaymentVerificationFailed) {
        println("Payment verification failed: ${e.reason}")

        // Check transaction status
        val processor = client.getProcessor()
        val confirmed = processor.verifyTransaction(auth.signature)

        if (!confirmed) {
            println("Transaction not confirmed, waiting...")
            delay(5000)
            // Retry verification
        } else {
            println("Transaction confirmed but server rejected it")
            // Contact support
        }
    }
}
```

---

### TransactionBroadcastFailed

Thrown when transaction cannot be broadcast to blockchain.

```kotlin
data class TransactionBroadcastFailed(
    val reason: String,
    override val message: String = "Transaction broadcast failed: $reason",
    override val cause: Throwable? = null
) : X402Error(
    message = message,
    code = "TRANSACTION_BROADCAST_FAILED",
    details = mapOf("reason" to reason)
) {
    init {
        cause?.let { initCause(it) }
    }
}
```

**Error Code:** `TRANSACTION_BROADCAST_FAILED`

**When Thrown:**
- Network error during transaction broadcast
- RPC endpoint unavailable
- Transaction rejected by blockchain

**How to Handle:**
```kotlin
import kotlinx.coroutines.delay

suspend fun handleBroadcastFailure() {
    var retries = 0
    val maxRetries = 3

    while (retries < maxRetries) {
        try {
            val auth = client.createPayment(request)
            break
        } catch (e: X402Error.TransactionBroadcastFailed) {
            println("Failed to broadcast transaction: ${e.reason}")

            // Check if it's a network issue
            if (e.details["networkError"] == true) {
                println("Network error, retrying...")
                delay(2000 * (retries + 1))  // Exponential backoff
                retries++
            } else {
                println("Transaction rejected: ${e.reason}")
                throw e
            }
        }
    }
}
```

---

### InvalidPaymentRequest

Thrown when payment request format is invalid.

```kotlin
data class InvalidPaymentRequest(
    val reason: String,
    override val message: String = "Invalid payment request: $reason",
    override val cause: Throwable? = null
) : X402Error(
    message = message,
    code = "INVALID_PAYMENT_REQUEST",
    details = mapOf("reason" to reason)
) {
    init {
        cause?.let { initCause(it) }
    }
}
```

**Error Code:** `INVALID_PAYMENT_REQUEST`

**When Thrown:**
- 402 response has invalid JSON format
- Required fields missing from payment request
- Payment request has invalid values

**How to Handle:**
```kotlin
try {
    val request = client.parsePaymentRequest(response)
} catch (e: X402Error.InvalidPaymentRequest) {
    println("Invalid payment request: ${e.reason}")
    println("Server sent malformed payment request")

    // Log for debugging
    logger.error { "Invalid payment request from: $url" }
    logger.error { "Reason: ${e.reason}" }
    logger.error { "Cause: ${e.cause}" }

    // Contact API provider
    throw RuntimeException("API sent invalid payment request", e)
}
```

---

### Generic

Generic error for cases not covered by specific error types.

```kotlin
data class Generic(
    val customCode: String,
    override val message: String,
    val customDetails: Map<String, Any> = emptyMap()
) : X402Error(
    message = message,
    code = customCode,
    details = customDetails
)
```

**Example:**
```kotlin
throw X402Error.Generic(
    customCode = "PAYMENT_LIMIT_EXCEEDED",
    message = "Payment amount exceeds configured limit",
    customDetails = mapOf("limit" to "1.0", "requested" to "5.0")
)
```

---

## Exhaustive When Expressions

Sealed classes enable exhaustive when expressions. The Kotlin compiler ensures all cases are handled:

### Pattern 1: Exhaustive Error Handling

```kotlin
suspend fun makeRequestWithExhaustiveHandling(url: String) {
    try {
        val response = client.get(url)
        println(response.body?.string())

    } catch (e: X402Error) {
        when (e) {
            is X402Error.PaymentRequired -> {
                val request = e.paymentRequest
                val auth = client.createPayment(request)
                client.get(url, auth)
            }
            is X402Error.InsufficientFunds -> {
                println("Need: ${e.requiredAmount}, Have: ${e.availableAmount}")
                throw RuntimeException("Cannot complete payment", e)
            }
            is X402Error.PaymentExpired -> {
                println("Payment expired, retrying...")
                makeRequestWithExhaustiveHandling(url)  // Recursive retry
            }
            is X402Error.PaymentVerificationFailed -> {
                println("Verification failed: ${e.reason}")
                throw RuntimeException("Payment not accepted", e)
            }
            is X402Error.TransactionBroadcastFailed -> {
                println("Broadcast failed: ${e.reason}")
                throw RuntimeException("Cannot broadcast payment", e)
            }
            is X402Error.InvalidPaymentRequest -> {
                println("Invalid request: ${e.reason}")
                throw RuntimeException("API error", e)
            }
            is X402Error.Generic -> {
                println("Error ${e.code}: ${e.message}")
                throw RuntimeException("Generic error", e)
            }
        }
        // No need for 'else' - compiler knows all cases are covered!
    }
}
```

### Pattern 2: Grouped Error Handling

```kotlin
suspend fun handleErrorsGrouped(url: String) {
    try {
        val response = client.get(url)
    } catch (e: X402Error) {
        when (e) {
            // Retryable errors
            is X402Error.PaymentExpired,
            is X402Error.TransactionBroadcastFailed -> {
                println("Retryable error: ${e.message}")
                // Implement retry logic
            }

            // User action required
            is X402Error.InsufficientFunds -> {
                alertUser("Please add ${e.requiredAmount} USDC")
            }

            // Automatic handling
            is X402Error.PaymentRequired -> {
                val auth = client.createPayment(e.paymentRequest)
                client.get(url, auth)
            }

            // Fatal errors
            is X402Error.PaymentVerificationFailed,
            is X402Error.InvalidPaymentRequest,
            is X402Error.Generic -> {
                logger.error(e) { "Fatal error: ${e.code}" }
                throw e
            }
        }
    }
}
```

### Pattern 3: Result-Based Error Handling

```kotlin
import kotlin.Result

suspend fun makeRequestWithResult(url: String): Result<String> = try {
    val response = client.get(url)
    Result.success(response.body?.string() ?: "")
} catch (e: X402Error) {
    when (e) {
        is X402Error.PaymentRequired -> {
            // Try payment recovery
            try {
                val auth = client.createPayment(e.paymentRequest)
                val retry = client.get(url, auth)
                Result.success(retry.body?.string() ?: "")
            } catch (paymentError: X402Error) {
                Result.failure(paymentError)
            }
        }
        else -> Result.failure(e)
    }
}

// Usage
val result = makeRequestWithResult(url)
result.onSuccess { data ->
    println("Success: $data")
}.onFailure { error ->
    println("Failed: ${error.message}")
}
```

### Pattern 4: Retry Logic with Sealed Classes

```kotlin
import kotlinx.coroutines.delay

suspend fun makeRequestWithRetry(
    url: String,
    maxRetries: Int = 3
): Response {
    var attempt = 0
    var lastError: X402Error? = null

    while (attempt < maxRetries) {
        try {
            return client.get(url)

        } catch (e: X402Error) {
            lastError = e
            val shouldRetry = when (e) {
                is X402Error.PaymentRequired -> {
                    val auth = client.createPayment(e.paymentRequest)
                    return client.get(url, auth)
                }
                is X402Error.PaymentExpired -> true
                is X402Error.TransactionBroadcastFailed -> true
                is X402Error.InsufficientFunds -> false
                is X402Error.PaymentVerificationFailed -> false
                is X402Error.InvalidPaymentRequest -> false
                is X402Error.Generic -> X402Error.isRetryable(e.code)
            }

            if (shouldRetry && attempt < maxRetries - 1) {
                delay(1000L * (attempt + 1))  // Exponential backoff
                attempt++
            } else {
                throw e
            }
        }
    }

    throw lastError ?: X402Error.Generic("MAX_RETRIES", "Max retries exceeded")
}
```

## User-Friendly Error Messages

Convert technical errors to user-friendly messages:

```kotlin
fun getUserFriendlyErrorMessage(e: X402Error): String = when (e) {
    is X402Error.InsufficientFunds -> {
        val shortfall = e.requiredAmount.toDouble() - e.availableAmount.toDouble()
        "You don't have enough funds. Required: ${e.requiredAmount} USDC, " +
        "Available: ${e.availableAmount} USDC. " +
        "Please add $shortfall USDC to continue."
    }
    is X402Error.PaymentRequired -> {
        "This resource requires a payment of ${e.paymentRequest.maxAmountRequired} USDC. " +
        "Would you like to proceed?"
    }
    is X402Error.PaymentExpired -> {
        "The payment request expired. Please try again."
    }
    is X402Error.PaymentVerificationFailed -> {
        "Your payment couldn't be verified. ${e.reason}. " +
        "Please contact support if this persists."
    }
    is X402Error.TransactionBroadcastFailed -> {
        "There was a problem processing your payment. ${e.reason}. " +
        "Please check your connection and try again."
    }
    is X402Error.InvalidPaymentRequest -> {
        "The server sent an invalid payment request. ${e.reason}. " +
        "Please contact the API provider."
    }
    is X402Error.Generic -> {
        when (e.code) {
            "PAYMENT_LIMIT_EXCEEDED" -> "Payment amount exceeds your configured limit."
            "MAX_RETRIES_EXCEEDED" -> "Maximum retry attempts exceeded. Please try again later."
            else -> "An error occurred: ${e.message}"
        }
    }
}

// Usage
try {
    val response = client.get(url)
} catch (e: X402Error) {
    showUserMessage(getUserFriendlyErrorMessage(e))
}
```

## Logging and Monitoring

Implement comprehensive logging with sealed classes:

```kotlin
import mu.KotlinLogging

private val logger = KotlinLogging.logger {}

fun logPaymentError(error: X402Error, context: Map<String, Any> = emptyMap()) {
    val logData = mutableMapOf<String, Any>()
    logData.putAll(context)
    logData["error_code"] = error.code
    logData["error_message"] = error.message
    logData.putAll(error.details)

    when (error) {
        is X402Error.PaymentRequired -> {
            logger.info { "Payment required: ${error.paymentRequest.paymentId}" }
            logData["payment_id"] = error.paymentRequest.paymentId
            logData["amount"] = error.paymentRequest.maxAmountRequired
        }
        is X402Error.InsufficientFunds -> {
            logger.error { "Insufficient funds: ${error.message}" }
            logData["shortfall"] = error.requiredAmount.toDouble() - error.availableAmount.toDouble()
        }
        is X402Error.PaymentExpired -> {
            logger.warn { "Payment expired: ${error.paymentRequest.paymentId}" }
        }
        is X402Error.PaymentVerificationFailed -> {
            logger.error { "Verification failed: ${error.reason}" }
            logData["failure_reason"] = error.reason
        }
        is X402Error.TransactionBroadcastFailed -> {
            logger.error(error) { "Broadcast failed: ${error.reason}" }
            logData["failure_reason"] = error.reason
            error.cause?.let { logData["cause"] = it.message ?: "" }
        }
        is X402Error.InvalidPaymentRequest -> {
            logger.error(error) { "Invalid payment request: ${error.reason}" }
            logData["invalid_reason"] = error.reason
        }
        is X402Error.Generic -> {
            logger.error { "Generic error: ${error.code}" }
            logData.putAll(error.customDetails)
        }
    }

    // Send to monitoring service
    sendToMonitoring(logData)
}

private fun sendToMonitoring(data: Map<String, Any>) {
    // Integrate with Datadog, New Relic, etc.
}
```

## Extension Functions for Error Handling

Create domain-specific extension functions:

```kotlin
// Extension to check if error is retryable
fun X402Error.isRetryable(): Boolean = when (this) {
    is X402Error.PaymentExpired -> true
    is X402Error.TransactionBroadcastFailed -> true
    is X402Error.PaymentVerificationFailed -> false
    is X402Error.InsufficientFunds -> false
    is X402Error.PaymentRequired -> false
    is X402Error.InvalidPaymentRequest -> false
    is X402Error.Generic -> X402Error.isRetryable(this.code)
}

// Extension to get suggested wait time before retry
fun X402Error.getRetryDelay(): Long? = when (this) {
    is X402Error.PaymentExpired -> 0L  // Retry immediately
    is X402Error.TransactionBroadcastFailed -> 2000L  // Wait 2 seconds
    else -> null  // Don't retry
}

// Extension to check if user action is needed
fun X402Error.requiresUserAction(): Boolean = when (this) {
    is X402Error.InsufficientFunds -> true
    is X402Error.PaymentRequired -> true  // If not auto-handled
    else -> false
}

// Usage
try {
    val response = client.get(url)
} catch (e: X402Error) {
    if (e.requiresUserAction()) {
        alertUser(getUserFriendlyErrorMessage(e))
    } else if (e.isRetryable()) {
        e.getRetryDelay()?.let { delay ->
            delay(delay)
            // Retry
        }
    }
}
```

## Production Best Practices

### 1. Always Handle Insufficient Funds

```kotlin
suspend fun handlePayment(url: String) {
    try {
        val response = autoClient.get(url)
    } catch (e: X402Error.InsufficientFunds) {
        // Alert user immediately
        notifyUser("Please add funds to your account")

        // Log for monitoring
        logger.error { "Insufficient funds for user: $userId" }

        // Send alert to admin dashboard
        alertDashboard("User $userId has insufficient funds")
    }
}
```

### 2. Set Payment Limits

```kotlin
val client = X402AutoClient(account) {
    maxPaymentAmount = "10.0"  // Never pay more than 10 USDC
}
```

### 3. Validate Before Payment

```kotlin
suspend fun validateAndPay(request: PaymentRequest) {
    // Check amount
    val amount = request.maxAmountRequired.toDouble()
    require(amount <= MAX_ALLOWED_PAYMENT) {
        "Payment exceeds maximum: $amount"
    }

    // Check expiration
    require(!request.isExpired()) {
        "Payment request already expired"
    }

    // Check balance
    val processor = client.getProcessor()
    val balance = processor.getBalance(account.publicKey).toDouble()
    if (balance < amount) {
        throw X402Error.InsufficientFunds(
            requiredAmount = amount.toString(),
            availableAmount = balance.toString()
        )
    }

    // Proceed with payment
    val auth = client.createPayment(request)
}
```

### 4. Implement Circuit Breaker

```kotlin
class CircuitBreaker {
    private var failureCount = 0
    private val failureThreshold = 5
    private val cooldownMs = 60000L
    private var lastFailureTime = 0L

    suspend fun shouldAttemptPayment(): Boolean {
        if (failureCount >= failureThreshold) {
            if (System.currentTimeMillis() - lastFailureTime < cooldownMs) {
                return false  // Circuit open
            } else {
                reset()  // Try again after cooldown
            }
        }
        return true
    }

    fun recordFailure() {
        failureCount++
        lastFailureTime = System.currentTimeMillis()
    }

    fun recordSuccess() {
        reset()
    }

    private fun reset() {
        failureCount = 0
    }
}

// Usage
val circuitBreaker = CircuitBreaker()

suspend fun makePaymentWithCircuitBreaker(request: PaymentRequest) {
    if (!circuitBreaker.shouldAttemptPayment()) {
        throw X402Error.Generic(
            "CIRCUIT_OPEN",
            "Too many payment failures, circuit breaker is open"
        )
    }

    try {
        val auth = client.createPayment(request)
        circuitBreaker.recordSuccess()
    } catch (e: X402Error) {
        circuitBreaker.recordFailure()
        throw e
    }
}
```

### 5. Audit Trail with Data Classes

```kotlin
import kotlinx.datetime.Clock
import kotlinx.serialization.Serializable

@Serializable
data class PaymentAuditEntry(
    val timestamp: String,
    val userId: String,
    val paymentId: String,
    val amount: String,
    val paymentAddress: String,
    val success: Boolean,
    val signature: String? = null,
    val errorCode: String? = null,
    val errorMessage: String? = null
)

suspend fun logPaymentActivity(
    userId: String,
    request: PaymentRequest,
    auth: PaymentAuthorization?,
    success: Boolean,
    error: X402Error?
) {
    val auditEntry = PaymentAuditEntry(
        timestamp = Clock.System.now().toString(),
        userId = userId,
        paymentId = request.paymentId,
        amount = request.maxAmountRequired,
        paymentAddress = request.paymentAddress,
        success = success,
        signature = auth?.signature,
        errorCode = error?.code,
        errorMessage = error?.message
    )

    // Save to audit log
    saveToAuditLog(auditEntry)
}
```

## Testing Error Handling

### Unit Tests with Sealed Classes

```kotlin
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ErrorHandlingTest {

    @Test
    fun testInsufficientFundsError() {
        val error = X402Error.InsufficientFunds(
            requiredAmount = "1.0",
            availableAmount = "0.5"
        )

        assertEquals("INSUFFICIENT_FUNDS", error.code)
        assertEquals("1.0", error.requiredAmount)
        assertEquals("0.5", error.availableAmount)
        assertTrue(error.message.contains("Insufficient funds"))
    }

    @Test
    fun testPaymentExpired() {
        val request = createExpiredPaymentRequest()
        assertTrue(request.isExpired())

        val error = X402Error.PaymentExpired(request)
        assertEquals("PAYMENT_EXPIRED", error.code)
        assertEquals(request, error.paymentRequest)
    }

    @Test
    fun testExhaustiveWhenExpression() {
        val errors = listOf(
            X402Error.PaymentRequired(createPaymentRequest()),
            X402Error.InsufficientFunds("1.0", "0.5"),
            X402Error.PaymentExpired(createPaymentRequest()),
            X402Error.PaymentVerificationFailed("Invalid signature"),
            X402Error.TransactionBroadcastFailed("Network error"),
            X402Error.InvalidPaymentRequest("Missing field"),
            X402Error.Generic("CUSTOM", "Custom error")
        )

        errors.forEach { error ->
            val handled = when (error) {
                is X402Error.PaymentRequired -> "payment_required"
                is X402Error.InsufficientFunds -> "insufficient_funds"
                is X402Error.PaymentExpired -> "expired"
                is X402Error.PaymentVerificationFailed -> "verification_failed"
                is X402Error.TransactionBroadcastFailed -> "broadcast_failed"
                is X402Error.InvalidPaymentRequest -> "invalid_request"
                is X402Error.Generic -> "generic"
            }
            assertTrue(handled.isNotEmpty())
        }
    }
}
```

## Companion Object Utilities

The X402Error companion object provides utility methods:

```kotlin
// Get error information
val info = X402Error.getInfo("PAYMENT_REQUIRED")
println("Message: ${info?.message}")
println("Retryable: ${info?.retry}")
println("User action: ${info?.userAction}")

// Check if retryable
val isRetryable = X402Error.isRetryable("PAYMENT_EXPIRED")

// Get all error codes
val allCodes = X402Error.getAllCodes()
allCodes.forEach { (code, info) ->
    println("$code: ${info.message}")
}
```

## Related Documentation

- [API Reference](api-reference.md)
- [Client Library](../libraries/client.md)
- [Examples](../examples/basic-usage.md)
- [Installation](../getting-started/installation.md)

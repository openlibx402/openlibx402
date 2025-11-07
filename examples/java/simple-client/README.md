# OpenLibX402 Java Simple Client Example

This example demonstrates how to use the OpenLibX402 Java SDK for making HTTP requests with automatic payment handling.

## Overview

The example shows two approaches:

1. **Manual Payment Control** (`X402Client`) - Explicitly handle 402 responses and payments
2. **Automatic Payment Handling** (`X402AutoClient`) - Automatically detect and process payments

## Prerequisites

- Java 11 or higher
- Maven 3.6+
- Solana wallet with devnet tokens (for testing)

## Installation

### 1. Build the OpenLibX402 packages

First, build and install the core and client packages:

```bash
# Build core package
cd ../../../packages/java/openlibx402-core
mvn clean install

# Build client package
cd ../openlibx402-client
mvn clean install
```

### 2. Build the example

```bash
cd examples/java/simple-client
mvn clean package
```

## Running the Example

### Basic Usage

```bash
mvn exec:java
```

### With Custom Solana Secret Key

```bash
export SOLANA_SECRET_KEY="your-base58-encoded-secret-key"
mvn exec:java
```

## Code Overview

### Manual Payment Handling

```java
X402Client client = new X402Client(account, rpcUrl, allowLocal);

try {
    Response response = client.get(url);
    System.out.println(response.body().string());
} catch (PaymentRequiredError e) {
    PaymentRequest request = e.getPaymentRequest();
    PaymentAuthorization auth = client.createPayment(request, null);
    Response retryResponse = client.get(url, auth);
}
```

### Automatic Payment Handling

```java
X402AutoClient client = new X402AutoClient.Builder(account)
    .rpcUrl("https://api.devnet.solana.com")
    .maxPaymentAmount("5.0")
    .maxRetries(2)
    .build();

Response response = client.get(url);  // Automatically handles payments!
```

## Configuration Options

### X402Client Options

- `walletAccount` - Solana account for signing transactions
- `rpcUrl` - Solana RPC endpoint (optional, defaults to devnet)
- `allowLocal` - Allow localhost URLs (default: false, use true for development)

### X402AutoClient Options

- `walletAccount` - Solana account for signing transactions
- `rpcUrl` - Solana RPC endpoint
- `maxPaymentAmount` - Maximum amount to spend per payment (safety limit)
- `maxRetries` - Maximum number of retry attempts (default: 1)
- `autoRetry` - Enable automatic retry (default: true)
- `allowLocal` - Allow localhost URLs

## Error Handling

The SDK provides specific error types for different scenarios:

```java
try {
    Response response = client.get(url);
} catch (PaymentRequiredError e) {
    // 402 Payment Required
} catch (InsufficientFundsError e) {
    // Wallet lacks funds
    System.out.println("Need: " + e.getRequiredAmount());
} catch (PaymentExpiredError e) {
    // Payment request expired
} catch (X402Error e) {
    // Other payment errors
    System.out.println("Code: " + e.getCode());
}
```

## Security Notes

- **Never commit secret keys** to version control
- Use environment variables or secure key vaults for production
- Set `allowLocal=false` in production environments
- Configure `maxPaymentAmount` to prevent excessive spending
- Monitor wallet balance and payment activity

## Testing with Mock Server

For testing without real payments, you can use a mock server:

```java
// Start mock server (separate terminal)
cd test-server
npm install
npm start

// Run example against local server
export API_URL=http://localhost:3000
mvn exec:java
```

## Troubleshooting

### "Unable to locate a Java Runtime"
Install Java 11 or higher:
```bash
# macOS
brew install openjdk@11

# Ubuntu/Debian
sudo apt-get install openjdk-11-jdk
```

### "Package org.openlibx402 does not exist"
Build and install the core packages first:
```bash
cd ../../../packages/java
mvn clean install -DskipTests
```

### "Insufficient funds" error
Fund your devnet wallet:
```bash
# Get devnet SOL
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet

# Get devnet USDC (use Solana faucet)
```

## Next Steps

- [Full Java SDK Documentation](../../../packages/java/README.md)
- [API Reference](../../../docs/docs/java/reference/api-reference.md)
- [Error Handling Guide](../../../docs/docs/java/reference/errors.md)
- [More Examples](../../../docs/docs/java/examples/)

## License

MIT License - see [LICENSE](../../../LICENSE) for details

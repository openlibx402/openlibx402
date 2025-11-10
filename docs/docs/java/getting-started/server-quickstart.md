# Server Quickstart (Java)

This guide will help you build a payment-protected REST API server using Java and OpenLibx402.

## Prerequisites

- Java 11 or higher
- Maven 3.6+ or Gradle 7+
- Basic understanding of Java web frameworks
- Solana wallet with some SOL (for transaction fees)

## Overview

While the Java implementation currently focuses on client-side functionality, you can build payment-protected servers using popular Java frameworks with custom middleware. This guide shows you how to integrate X402 payment verification into your Java server.

## Project Setup

### Using Maven

Create a new Maven project:

```xml
<!-- pom.xml -->
<project>
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId>x402-server</artifactId>
    <version>1.0-SNAPSHOT</version>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
    </properties>

    <dependencies>
        <!-- OpenLibx402 Core -->
        <dependency>
            <groupId>xyz.openlib</groupId>
            <artifactId>openlibx402-core</artifactId>
            <version>0.1.0</version>
        </dependency>

        <!-- Web Framework (Spring Boot example) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
            <version>3.1.0</version>
        </dependency>

        <!-- Solana Java SDK -->
        <dependency>
            <groupId>com.mmorrell</groupId>
            <artifactId>solanaj</artifactId>
            <version>1.17.0</version>
        </dependency>

        <!-- JSON Processing -->
        <dependency>
            <groupId>com.google.code.gson</groupId>
            <artifactId>gson</artifactId>
            <version>2.10.1</version>
        </dependency>
    </dependencies>
</project>
```

### Using Gradle

```gradle
// build.gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.1.0'
}

group = 'com.example'
version = '1.0-SNAPSHOT'
sourceCompatibility = '11'

repositories {
    mavenCentral()
}

dependencies {
    implementation 'xyz.openlib:openlibx402-core:0.1.0'
    implementation 'org.springframework.boot:spring-boot-starter-web:3.1.0'
    implementation 'com.mmorrell:solanaj:1.17.0'
    implementation 'com.google.code.gson:gson:2.10.1'
}
```

## Spring Boot Server Example

### 1. Payment Request Model

```java
package com.example.x402.model;

import java.time.Instant;

public class PaymentRequest {
    private String maxAmountRequired;
    private String assetType;
    private String assetAddress;
    private String paymentAddress;
    private String network;
    private Instant expiresAt;
    private String nonce;
    private String paymentId;
    private String resource;
    private String description;

    // Constructors
    public PaymentRequest() {}

    public PaymentRequest(String amount, String paymentAddress,
                         String tokenMint, String network,
                         String resource, String description) {
        this.maxAmountRequired = amount;
        this.assetType = "SPL";
        this.assetAddress = tokenMint;
        this.paymentAddress = paymentAddress;
        this.network = network;
        this.expiresAt = Instant.now().plusSeconds(300);
        this.nonce = java.util.UUID.randomUUID().toString();
        this.paymentId = java.util.UUID.randomUUID().toString();
        this.resource = resource;
        this.description = description;
    }

    // Getters and setters
    public String getMaxAmountRequired() { return maxAmountRequired; }
    public void setMaxAmountRequired(String maxAmountRequired) {
        this.maxAmountRequired = maxAmountRequired;
    }

    public String getAssetType() { return assetType; }
    public void setAssetType(String assetType) { this.assetType = assetType; }

    public String getAssetAddress() { return assetAddress; }
    public void setAssetAddress(String assetAddress) {
        this.assetAddress = assetAddress;
    }

    public String getPaymentAddress() { return paymentAddress; }
    public void setPaymentAddress(String paymentAddress) {
        this.paymentAddress = paymentAddress;
    }

    public String getNetwork() { return network; }
    public void setNetwork(String network) { this.network = network; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public String getNonce() { return nonce; }
    public void setNonce(String nonce) { this.nonce = nonce; }

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public String getResource() { return resource; }
    public void setResource(String resource) { this.resource = resource; }

    public String getDescription() { return description; }
    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }
}
```

### 2. Payment Verification Service

```java
package com.example.x402.service;

import com.google.gson.Gson;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import java.util.Base64;

@Service
public class PaymentVerificationService {

    @Value("${solana.rpc.url}")
    private String rpcUrl;

    @Value("${x402.payment.address}")
    private String paymentAddress;

    @Value("${x402.token.mint}")
    private String tokenMint;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final Gson gson = new Gson();

    public boolean verifyPayment(String transactionHash,
                                String expectedAmount,
                                String expectedRecipient) {
        try {
            // Get transaction from Solana RPC
            String requestBody = String.format(
                "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getTransaction\"," +
                "\"params\":[\"%s\",{\"encoding\":\"json\"}]}",
                transactionHash
            );

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(rpcUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

            HttpResponse<String> response = httpClient.send(request,
                HttpResponse.BodyHandlers.ofString());

            // Parse and verify transaction
            // (Simplified - add proper JSON parsing and verification)
            TransactionResponse txResponse = gson.fromJson(
                response.body(),
                TransactionResponse.class
            );

            if (txResponse.getResult() == null) {
                return false;
            }

            // Verify:
            // 1. Transaction is confirmed
            // 2. Recipient matches
            // 3. Amount matches
            // 4. Token mint matches
            return verifyTransactionDetails(txResponse,
                expectedAmount, expectedRecipient);

        } catch (Exception e) {
            System.err.println("Payment verification failed: " +
                e.getMessage());
            return false;
        }
    }

    private boolean verifyTransactionDetails(TransactionResponse tx,
                                            String expectedAmount,
                                            String expectedRecipient) {
        // Implement detailed verification logic
        // Check transaction instructions, amounts, addresses
        return tx.getResult() != null &&
               tx.getResult().getMeta() != null &&
               tx.getResult().getMeta().getErr() == null;
    }

    // Inner classes for RPC response parsing
    static class TransactionResponse {
        private Result result;
        public Result getResult() { return result; }

        static class Result {
            private Meta meta;
            public Meta getMeta() { return meta; }

            static class Meta {
                private Object err;
                public Object getErr() { return err; }
            }
        }
    }
}
```

### 3. Payment Controller

```java
package com.example.x402.controller;

import com.example.x402.model.PaymentRequest;
import com.example.x402.service.PaymentVerificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PremiumDataController {

    @Value("${x402.payment.address}")
    private String paymentAddress;

    @Value("${x402.token.mint}")
    private String tokenMint;

    @Value("${x402.network}")
    private String network;

    @Autowired
    private PaymentVerificationService paymentService;

    @GetMapping("/free-data")
    public ResponseEntity<Map<String, Object>> getFreeData() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "This is free data");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/premium-data")
    public ResponseEntity<?> getPremiumData(
            @RequestHeader(value = "X-Payment-Authorization", required = false)
            String paymentAuth) {

        // Check if payment authorization provided
        if (paymentAuth == null || paymentAuth.isEmpty()) {
            // Return 402 Payment Required
            PaymentRequest paymentRequest = new PaymentRequest(
                "0.10", // amount in USDC
                paymentAddress,
                tokenMint,
                network,
                "/api/premium-data",
                "Access to premium market data"
            );

            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                .header("X-Payment-Required", "true")
                .header("X-Payment-Protocol", "x402")
                .body(paymentRequest);
        }

        // Verify payment
        // Parse payment authorization header
        // Extract transaction hash and verify
        try {
            String txHash = extractTransactionHash(paymentAuth);
            boolean isValid = paymentService.verifyPayment(
                txHash,
                "0.10",
                paymentAddress
            );

            if (!isValid) {
                return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                    .body(Map.of("error", "Payment verification failed"));
            }

            // Payment verified - return premium data
            Map<String, Object> response = new HashMap<>();
            response.put("data", "Premium content");
            response.put("price", 100.50);
            response.put("timestamp", System.currentTimeMillis());
            response.put("paymentVerified", true);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Invalid payment authorization"));
        }
    }

    private String extractTransactionHash(String paymentAuth) {
        // Parse payment authorization header
        // Format: "signature=<tx-hash>;..."
        String[] parts = paymentAuth.split(";");
        for (String part : parts) {
            if (part.startsWith("transactionHash=")) {
                return part.substring("transactionHash=".length());
            }
        }
        throw new IllegalArgumentException("No transaction hash found");
    }
}
```

### 4. Application Configuration

```java
// src/main/java/com/example/x402/Application.java
package com.example.x402;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

```properties
# src/main/resources/application.properties
server.port=8080

# Solana Configuration
solana.rpc.url=https://api.devnet.solana.com
x402.payment.address=YOUR_WALLET_ADDRESS
x402.token.mint=USDC_MINT_ADDRESS_DEVNET
x402.network=solana-devnet

# Server Configuration
spring.application.name=x402-server
```

## Running the Server

```bash
# Using Maven
mvn clean install
mvn spring-boot:run

# Using Gradle
gradle clean build
gradle bootRun
```

The server will start on `http://localhost:8080`.

## Testing the Server

### Test Free Endpoint

```bash
curl http://localhost:8080/api/free-data
```

**Response:**
```json
{
  "message": "This is free data",
  "timestamp": 1699545600000
}
```

### Test Premium Endpoint (No Payment)

```bash
curl -i http://localhost:8080/api/premium-data
```

**Response:**
```
HTTP/1.1 402 Payment Required
X-Payment-Required: true
X-Payment-Protocol: x402

{
  "maxAmountRequired": "0.10",
  "assetType": "SPL",
  "assetAddress": "USDC_MINT_ADDRESS",
  "paymentAddress": "YOUR_WALLET_ADDRESS",
  "network": "solana-devnet",
  "expiresAt": "2025-11-10T17:00:00Z",
  "nonce": "...",
  "paymentId": "...",
  "resource": "/api/premium-data",
  "description": "Access to premium market data"
}
```

### Test Premium Endpoint (With Payment)

```bash
curl -H "X-Payment-Authorization: transactionHash=TX_HASH_HERE" \
  http://localhost:8080/api/premium-data
```

**Response:**
```json
{
  "data": "Premium content",
  "price": 100.50,
  "timestamp": 1699545600000,
  "paymentVerified": true
}
```

## Alternative Frameworks

### Micronaut Example

```java
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.Header;

@Controller("/api")
public class PremiumController {

    @Get("/premium-data")
    public HttpResponse<?> getPremiumData(
            @Header(value = "X-Payment-Authorization", defaultValue = "")
            String paymentAuth) {

        if (paymentAuth.isEmpty()) {
            PaymentRequest request = new PaymentRequest(/*...*/);
            return HttpResponse.status(HttpStatus.PAYMENT_REQUIRED)
                .body(request);
        }

        // Verify payment and return data
        return HttpResponse.ok(getPremiumContent());
    }
}
```

### Quarkus Example

```java
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.Path;
import javax.ws.rs.core.Response;

@Path("/api")
public class PremiumResource {

    @GET
    @Path("/premium-data")
    public Response getPremiumData(
            @HeaderParam("X-Payment-Authorization") String paymentAuth) {

        if (paymentAuth == null || paymentAuth.isEmpty()) {
            PaymentRequest request = new PaymentRequest(/*...*/);
            return Response.status(402)
                .entity(request)
                .build();
        }

        // Verify payment and return data
        return Response.ok(getPremiumContent()).build();
    }
}
```

## Next Steps

- **Learn about client usage:** [Client Quickstart](client-quickstart.md)
- **Explore API reference:** [API Reference](../reference/api-reference.md)
- **Understand error handling:** [Error Reference](../reference/errors.md)
- **See complete examples:** [Examples](../examples/basic-usage.md)

## Notes

- The Java implementation currently focuses on client-side X402 functionality
- Server middleware is implemented as custom Spring Boot controllers
- For production use, consider implementing:
  - Payment caching to avoid repeated verification
  - Redis for distributed payment state
  - Webhook support for async payment confirmation
  - Rate limiting per client

## See Also

- [Kotlin Server Quickstart](../../kotlin/getting-started/server-quickstart.md) - Similar guide for Kotlin
- [Go Server Quickstart](../../go/getting-started/server-quickstart.md) - Go implementation with middleware
- [Python FastAPI Guide](../../packages/python/openlibx402-fastapi.md) - Python server implementation
- [TypeScript Express Guide](../../packages/typescript/openlibx402-express.md) - TypeScript server implementation

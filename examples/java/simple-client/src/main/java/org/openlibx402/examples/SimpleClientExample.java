package org.openlibx402.examples;

import okhttp3.Response;
import org.openlibx402.client.X402AutoClient;
import org.openlibx402.client.X402Client;
import org.openlibx402.core.errors.PaymentRequiredError;
import org.openlibx402.core.errors.X402Error;
import org.openlibx402.core.models.PaymentAuthorization;
import org.openlibx402.core.models.PaymentRequest;
import org.p2p.solanaj.core.Account;

import java.io.IOException;

/**
 * Simple example demonstrating OpenLibX402 Java SDK usage.
 *
 * This example shows both manual (X402Client) and automatic (X402AutoClient)
 * payment handling approaches.
 */
public class SimpleClientExample {

    public static void main(String[] args) {
        System.out.println("OpenLibX402 Java SDK Example");
        System.out.println("============================\n");

        // Example 1: Manual Payment Handling
        System.out.println("Example 1: Manual Payment Handling (X402Client)");
        manualPaymentExample();

        System.out.println("\n" + "=".repeat(50) + "\n");

        // Example 2: Automatic Payment Handling
        System.out.println("Example 2: Automatic Payment Handling (X402AutoClient)");
        automaticPaymentExample();
    }

    /**
     * Demonstrates manual payment control with X402Client.
     * Developer explicitly handles 402 responses and creates payments.
     */
    private static void manualPaymentExample() {
        // Create Solana account (in production, load from secure storage)
        byte[] secretKey = loadSecretKey();
        Account account = new Account(secretKey);

        // Create X402Client with manual payment control
        X402Client client = new X402Client(
            account,
            "https://api.devnet.solana.com",  // Solana RPC URL
            true  // allowLocal = true for development
        );

        try {
            String url = "https://api.example.com/premium-data";
            System.out.println("Making initial request to: " + url);

            // Make initial request
            Response response = client.get(url);
            System.out.println("Response: " + response.code());
            System.out.println("Body: " + response.body().string());

        } catch (PaymentRequiredError e) {
            System.out.println("Payment required!");

            // Get payment request details
            PaymentRequest request = e.getPaymentRequest();
            System.out.println("Amount required: " + request.getMaxAmountRequired());
            System.out.println("Payment address: " + request.getPaymentAddress());
            System.out.println("Asset: " + request.getAssetType());
            System.out.println("Expires at: " + request.getExpiresAt());

            try {
                // Create payment
                System.out.println("\nCreating payment...");
                PaymentAuthorization auth = client.createPayment(request, null);
                System.out.println("Payment created!");
                System.out.println("Transaction signature: " + auth.getSignature());

                // Retry request with payment authorization
                System.out.println("\nRetrying request with payment...");
                String url = "https://api.example.com/premium-data";
                Response retryResponse = client.get(url, auth);
                System.out.println("Success! Response: " + retryResponse.code());
                System.out.println("Body: " + retryResponse.body().string());

            } catch (X402Error | IOException ex) {
                System.err.println("Payment failed: " + ex.getMessage());
            }

        } catch (IOException | X402Error e) {
            System.err.println("Request failed: " + e.getMessage());
        } finally {
            client.close();
        }
    }

    /**
     * Demonstrates automatic payment handling with X402AutoClient.
     * Client automatically detects 402 responses and handles payments.
     */
    private static void automaticPaymentExample() {
        // Create Solana account
        byte[] secretKey = loadSecretKey();
        Account account = new Account(secretKey);

        // Build auto client with configuration
        X402AutoClient client = new X402AutoClient.Builder(account)
            .rpcUrl("https://api.devnet.solana.com")
            .maxPaymentAmount("5.0")  // Safety limit: max 5 tokens per payment
            .maxRetries(2)            // Retry up to 2 times
            .allowLocal(true)         // Allow localhost for development
            .build();

        try {
            String url = "https://api.example.com/premium-data";
            System.out.println("Making request to: " + url);
            System.out.println("(Payments will be handled automatically)");

            // Make request - payments handled automatically!
            Response response = client.get(url);
            System.out.println("\nSuccess! Response: " + response.code());
            System.out.println("Body: " + response.body().string());

        } catch (IOException | X402Error e) {
            System.err.println("Request failed: " + e.getMessage());

            // Handle specific error types
            if (e instanceof X402Error) {
                X402Error x402Error = (X402Error) e;
                System.err.println("Error code: " + x402Error.getCode());
                System.err.println("Details: " + x402Error.getDetails());
            }
        } finally {
            client.close();
        }
    }

    /**
     * Loads Solana secret key from environment or configuration.
     * In production, use secure key management systems.
     *
     * @return Secret key bytes
     */
    private static byte[] loadSecretKey() {
        // For demo purposes, return dummy key
        // In production:
        // - Load from environment variable
        // - Use hardware wallet
        // - Load from secure key vault
        // - Use key derivation from mnemonic

        String secretKeyEnv = System.getenv("SOLANA_SECRET_KEY");
        if (secretKeyEnv != null) {
            // Parse from base58 or JSON array format
            // return Base58.decode(secretKeyEnv);
        }

        // Demo: Create new random account
        System.out.println("⚠️  Using random account for demo purposes");
        System.out.println("⚠️  In production, load from secure storage!\n");
        Account demoAccount = new Account();
        return demoAccount.getSecretKey();
    }

    /**
     * Additional example: Error handling patterns
     */
    @SuppressWarnings("unused")
    private static void errorHandlingExample() {
        byte[] secretKey = loadSecretKey();
        Account account = new Account(secretKey);
        X402Client client = new X402Client(account, null, true);

        try {
            Response response = client.get("https://api.example.com/data");
            // Process response
        } catch (PaymentRequiredError e) {
            // Handle 402 payment required
            System.out.println("Payment required");
            PaymentRequest request = e.getPaymentRequest();
            // Process payment...
        } catch (org.openlibx402.core.errors.InsufficientFundsError e) {
            // Handle insufficient balance
            System.out.println("Insufficient funds!");
            System.out.println("Required: " + e.getRequiredAmount());
            System.out.println("Available: " + e.getAvailableAmount());
        } catch (org.openlibx402.core.errors.PaymentExpiredError e) {
            // Handle expired payment request
            System.out.println("Payment request expired");
        } catch (X402Error e) {
            // Handle other payment errors
            System.out.println("Payment error: " + e.getCode());
        } catch (IOException e) {
            // Handle network errors
            System.out.println("Network error: " + e.getMessage());
        } finally {
            client.close();
        }
    }
}

use openlibx402_rocket::{
    create_payment_request, PaymentGuard, PaymentRequirement, PaymentRequiredResponse, X402Config,
};
use rocket::{get, routes, serde::json::Json, State};
use serde::{Deserialize, Serialize};

/// Example data structure for premium content
#[derive(Debug, Serialize, Deserialize)]
struct PremiumData {
    message: String,
    data: Vec<String>,
    tier: String,
}

/// Example data structure for basic content
#[derive(Debug, Serialize, Deserialize)]
struct BasicData {
    message: String,
}

/// Free endpoint - no payment required
#[get("/")]
fn index() -> Json<BasicData> {
    Json(BasicData {
        message: "Welcome to the X402 Rocket example server!".to_string(),
    })
}

/// Basic tier endpoint - requires $0.01 payment
#[get("/basic")]
fn basic_tier(config: &State<X402Config>, _auth: Option<PaymentGuard>) -> Result<Json<PremiumData>, PaymentRequiredResponse> {
    match _auth {
        Some(_) => {
            // Payment verified
            Ok(Json(PremiumData {
                message: "Access granted to basic tier".to_string(),
                data: vec![
                    "Basic data point 1".to_string(),
                    "Basic data point 2".to_string(),
                ],
                tier: "basic".to_string(),
            }))
        }
        None => {
            // No payment, return 402
            let requirement = PaymentRequirement::new("0.01")
                .with_description("Access to basic tier data");
            let payment_request = create_payment_request(config, &requirement, "/basic");
            Err(PaymentRequiredResponse { payment_request })
        }
    }
}

/// Premium tier endpoint - requires $0.10 payment
#[get("/premium")]
fn premium_tier(config: &State<X402Config>, _auth: Option<PaymentGuard>) -> Result<Json<PremiumData>, PaymentRequiredResponse> {
    match _auth {
        Some(_) => {
            // Payment verified
            Ok(Json(PremiumData {
                message: "Access granted to premium tier".to_string(),
                data: vec![
                    "Premium insight 1".to_string(),
                    "Premium insight 2".to_string(),
                    "Premium insight 3".to_string(),
                    "Exclusive data point".to_string(),
                ],
                tier: "premium".to_string(),
            }))
        }
        None => {
            // No payment, return 402
            let requirement = PaymentRequirement::new("0.10")
                .with_description("Access to premium tier data")
                .with_expires_in(600);
            let payment_request = create_payment_request(config, &requirement, "/premium");
            Err(PaymentRequiredResponse { payment_request })
        }
    }
}

/// Enterprise tier endpoint - requires $1.00 payment
#[get("/enterprise")]
fn enterprise_tier(config: &State<X402Config>, _auth: Option<PaymentGuard>) -> Result<Json<PremiumData>, PaymentRequiredResponse> {
    match _auth {
        Some(_) => {
            // Payment verified
            Ok(Json(PremiumData {
                message: "Access granted to enterprise tier".to_string(),
                data: vec![
                    "Enterprise analytics 1".to_string(),
                    "Enterprise analytics 2".to_string(),
                    "Enterprise analytics 3".to_string(),
                    "Enterprise analytics 4".to_string(),
                    "Confidential market data".to_string(),
                    "Advanced predictions".to_string(),
                ],
                tier: "enterprise".to_string(),
            }))
        }
        None => {
            // No payment, return 402
            let requirement = PaymentRequirement::new("1.00")
                .with_description("Access to enterprise tier data and analytics");
            let payment_request = create_payment_request(config, &requirement, "/enterprise");
            Err(PaymentRequiredResponse { payment_request })
        }
    }
}

/// Health check endpoint
#[get("/health")]
fn health() -> &'static str {
    "OK"
}

#[rocket::main]
async fn main() -> Result<(), rocket::Error> {
    // Configure X402
    // NOTE: Replace these with your actual Solana wallet addresses
    let config = X402Config {
        payment_address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string(),
        token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(), // USDC on Devnet
        network: "solana-devnet".to_string(),
        rpc_url: None,
        auto_verify: true,
    };

    println!("\n🚀 Starting Rocket X402 Example Server");
    println!("=====================================");
    println!("Payment Address: {}", config.payment_address);
    println!("Token Mint: {}", config.token_mint);
    println!("Network: {}", config.network);
    println!("\nEndpoints:");
    println!("  - GET  /          : Free endpoint (no payment)");
    println!("  - GET  /basic     : Basic tier ($0.01)");
    println!("  - GET  /premium   : Premium tier ($0.10)");
    println!("  - GET  /enterprise: Enterprise tier ($1.00)");
    println!("  - GET  /health    : Health check\n");

    let _rocket = rocket::build()
        .manage(config)
        .mount("/", routes![index, basic_tier, premium_tier, enterprise_tier, health])
        .launch()
        .await?;

    Ok(())
}

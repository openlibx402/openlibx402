use actix_web::{get, web, App, HttpResponse, HttpServer};
use openlibx402_actix::{
    create_payment_request, payment_required_response, PaymentExtractor, PaymentRequirement,
    X402Config, X402State,
};
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
async fn index() -> HttpResponse {
    HttpResponse::Ok().json(BasicData {
        message: "Welcome to the X402 Actix Web example server!".to_string(),
    })
}

/// Basic tier endpoint - requires $0.01 payment
#[get("/basic")]
async fn basic_tier(
    state: web::Data<X402State>,
    auth: Option<PaymentExtractor>,
) -> HttpResponse {
    match auth {
        Some(_) => {
            // Payment verified
            HttpResponse::Ok().json(PremiumData {
                message: "Access granted to basic tier".to_string(),
                data: vec![
                    "Basic data point 1".to_string(),
                    "Basic data point 2".to_string(),
                ],
                tier: "basic".to_string(),
            })
        }
        None => {
            // No payment, return 402
            let requirement =
                PaymentRequirement::new("0.01").with_description("Access to basic tier data");
            let payment_request = create_payment_request(&state.config, &requirement, "/basic");
            payment_required_response(payment_request)
        }
    }
}

/// Premium tier endpoint - requires $0.10 payment
#[get("/premium")]
async fn premium_tier(
    state: web::Data<X402State>,
    auth: Option<PaymentExtractor>,
) -> HttpResponse {
    match auth {
        Some(_) => {
            // Payment verified
            HttpResponse::Ok().json(PremiumData {
                message: "Access granted to premium tier".to_string(),
                data: vec![
                    "Premium insight 1".to_string(),
                    "Premium insight 2".to_string(),
                    "Premium insight 3".to_string(),
                    "Exclusive data point".to_string(),
                ],
                tier: "premium".to_string(),
            })
        }
        None => {
            // No payment, return 402
            let requirement = PaymentRequirement::new("0.10")
                .with_description("Access to premium tier data")
                .with_expires_in(600);
            let payment_request = create_payment_request(&state.config, &requirement, "/premium");
            payment_required_response(payment_request)
        }
    }
}

/// Enterprise tier endpoint - requires $1.00 payment
#[get("/enterprise")]
async fn enterprise_tier(
    state: web::Data<X402State>,
    auth: Option<PaymentExtractor>,
) -> HttpResponse {
    match auth {
        Some(_) => {
            // Payment verified
            HttpResponse::Ok().json(PremiumData {
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
            })
        }
        None => {
            // No payment, return 402
            let requirement = PaymentRequirement::new("1.00")
                .with_description("Access to enterprise tier data and analytics");
            let payment_request =
                create_payment_request(&state.config, &requirement, "/enterprise");
            payment_required_response(payment_request)
        }
    }
}

/// Health check endpoint
#[get("/health")]
async fn health() -> &'static str {
    "OK"
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Configure X402
    // NOTE: Replace these with your actual Solana wallet addresses
    let config = X402Config {
        payment_address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string(),
        token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(), // USDC on Devnet
        network: "solana-devnet".to_string(),
        rpc_url: None,
        auto_verify: true,
    };

    let state = web::Data::new(X402State {
        config: config.clone(),
    });

    println!("\n🌐 Starting Actix Web X402 Example Server");
    println!("=========================================");
    println!("Payment Address: {}", config.payment_address);
    println!("Token Mint: {}", config.token_mint);
    println!("Network: {}", config.network);
    println!("\nEndpoints:");
    println!("  - GET  /          : Free endpoint (no payment)");
    println!("  - GET  /basic     : Basic tier ($0.01)");
    println!("  - GET  /premium   : Premium tier ($0.10)");
    println!("  - GET  /enterprise: Enterprise tier ($1.00)");
    println!("  - GET  /health    : Health check");
    println!("\nServer running at http://127.0.0.1:8080\n");

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .service(index)
            .service(basic_tier)
            .service(premium_tier)
            .service(enterprise_tier)
            .service(health)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}

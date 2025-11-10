# Production Deployment Guide

Complete guide for deploying X402-enabled applications to production environments.

## Pre-Deployment Checklist

### Security
- [ ] Use mainnet RPC URLs
- [ ] Use real USDC mint address
- [ ] Never log private keys or sensitive data
- [ ] Use HTTPS for all API endpoints
- [ ] Implement rate limiting
- [ ] Set up monitoring and alerting
- [ ] Configure reasonable payment timeouts
- [ ] Implement proper error handling
- [ ] Use environment variables for all secrets
- [ ] Test with small amounts first
- [ ] Set maximum payment limits
- [ ] Implement wallet balance monitoring
- [ ] Enable CORS properly
- [ ] Use hardware wallets for hot wallets (if applicable)

### Infrastructure
- [ ] Set up load balancing
- [ ] Configure auto-scaling
- [ ] Implement health checks
- [ ] Set up logging aggregation
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Configure CDN (if applicable)
- [ ] Set up database backups (if applicable)

---

## Environment Configuration

### Production Environment Variables

```bash
# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PAYMENT_WALLET_ADDRESS=<your-mainnet-wallet>
USDC_MINT_ADDRESS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
X402_NETWORK=solana-mainnet

# API Configuration
NODE_ENV=production
PORT=8080
LOG_LEVEL=info

# Security
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
SENTRY_DSN=<your-sentry-dsn>
```

### Mainnet Addresses

```bash
# Solana Mainnet
USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
USDC_DECIMALS=6

# RPC Endpoints (use multiple for redundancy)
PRIMARY_RPC=https://api.mainnet-beta.solana.com
BACKUP_RPC=https://solana-api.projectserum.com
```

---

## Deployment Platforms

### 1. Vercel (TypeScript/Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add SOLANA_RPC_URL
vercel env add PAYMENT_WALLET_ADDRESS
# ... add all required env vars
```

**vercel.json:**
```json
{
  "env": {
    "SOLANA_RPC_URL": "@solana_rpc_url",
    "PAYMENT_WALLET_ADDRESS": "@payment_wallet"
  },
  "regions": ["iad1"],
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

### 2. Fly.io (Python/FastAPI)

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Initialize
flyctl launch

# Set secrets
flyctl secrets set SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
flyctl secrets set PAYMENT_WALLET_ADDRESS=your_wallet
flyctl secrets set USDC_MINT_ADDRESS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# Deploy
flyctl deploy
```

**fly.toml:**
```toml
app = "x402-api"
primary_region = "iad"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "8080"
  WORKERS = "4"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

[[services.http_checks]]
  interval = "10s"
  timeout = "2s"
  grace_period = "5s"
  method = "GET"
  path = "/health"
```

### 3. Railway (Node.js/Deno)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Set variables
railway variables set SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Deploy
railway up
```

### 4. AWS (Docker/ECS)

**Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

**Deploy to ECS:**
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker build -t x402-api .
docker tag x402-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/x402-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/x402-api:latest

# Deploy via ECS
aws ecs update-service --cluster x402-cluster --service x402-service --force-new-deployment
```

### 5. Google Cloud Run

```bash
# Build container
gcloud builds submit --tag gcr.io/PROJECT-ID/x402-api

# Deploy
gcloud run deploy x402-api \
  --image gcr.io/PROJECT-ID/x402-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars SOLANA_RPC_URL=https://api.mainnet-beta.solana.com,PAYMENT_WALLET_ADDRESS=your_wallet
```

---

## High Availability Setup

### Load Balancing

```nginx
# nginx.conf
upstream x402_backend {
    least_conn;
    server backend1:8080 max_fails=3 fail_timeout=30s;
    server backend2:8080 max_fails=3 fail_timeout=30s;
    server backend3:8080 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    location / {
        proxy_pass http://x402_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
    }
}
```

### Redis Caching for Payment Verification

```python
import redis
import json

class CachedPaymentService:
    def __init__(self, payment_service, redis_url):
        self.payment_service = payment_service
        self.redis = redis.from_url(redis_url)
        self.cache_ttl = 3600  # 1 hour

    async def verify_payment(self, tx_hash, amount, recipient):
        # Check cache
        cache_key = f"payment:{tx_hash}"
        cached = self.redis.get(cache_key)

        if cached:
            return json.loads(cached)

        # Verify payment
        is_valid = await self.payment_service.verify_payment(
            tx_hash, amount, recipient
        )

        # Cache result
        self.redis.setex(
            cache_key,
            self.cache_ttl,
            json.dumps(is_valid)
        )

        return is_valid
```

---

## Monitoring & Observability

### Health Checks

```python
# health.py
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@router.get("/health/ready")
async def readiness_check():
    # Check dependencies
    try:
        await check_rpc_connection()
        await check_database_connection()
        return {"status": "ready"}
    except Exception as e:
        return {"status": "not ready", "error": str(e)}, 503
```

### Logging

```python
import logging
import json

# Structured logging
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
        }
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)

# Configure logger
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger = logging.getLogger("x402")
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Usage
logger.info("Payment verified", extra={
    "tx_hash": tx_hash,
    "amount": amount,
    "recipient": recipient
})
```

### Metrics (Prometheus)

```python
from prometheus_client import Counter, Histogram, generate_latest

# Define metrics
payment_requests = Counter(
    'x402_payment_requests_total',
    'Total payment requests',
    ['status']
)

payment_verification_duration = Histogram(
    'x402_payment_verification_seconds',
    'Payment verification duration'
)

# Use metrics
@payment_verification_duration.time()
async def verify_payment(tx_hash):
    try:
        result = await processor.verify_transaction(tx_hash)
        payment_requests.labels(status='success').inc()
        return result
    except Exception as e:
        payment_requests.labels(status='error').inc()
        raise

# Expose metrics
@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

---

## Security Best Practices

### 1. Rate Limiting

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/premium")
@limiter.limit("10/minute")
async def premium_endpoint(request: Request):
    # ...
```

### 2. CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Specific origins only
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["X-Payment-Authorization"],
)
```

### 3. Secrets Management

```python
# Use environment variables
import os
from pathlib import Path

def load_secrets():
    # For local development
    if Path(".env").exists():
        from dotenv import load_dotenv
        load_dotenv()

    # For production, use secrets manager
    if os.getenv("ENV") == "production":
        # AWS Secrets Manager
        import boto3
        client = boto3.client('secretsmanager')
        secret = client.get_secret_value(SecretId='x402/production')
        # Parse and set secrets

    return {
        "rpc_url": os.getenv("SOLANA_RPC_URL"),
        "wallet": os.getenv("PAYMENT_WALLET_ADDRESS"),
        # Never log these values
    }
```

---

## Database Considerations

### Payment State Management

```sql
-- PostgreSQL schema for payment tracking
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_hash VARCHAR(255) UNIQUE NOT NULL,
    payer_address VARCHAR(255) NOT NULL,
    recipient_address VARCHAR(255) NOT NULL,
    amount DECIMAL(20, 6) NOT NULL,
    token_mint VARCHAR(255) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_tx_hash (transaction_hash),
    INDEX idx_payer (payer_address)
);

-- Payment requests tracking
CREATE TABLE payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id VARCHAR(255) UNIQUE NOT NULL,
    resource VARCHAR(255) NOT NULL,
    amount DECIMAL(20, 6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    fulfilled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_payment_id (payment_id)
);
```

---

## Backup & Disaster Recovery

### Database Backups

```bash
# Automated PostgreSQL backup
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

pg_dump -U postgres x402_db | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

# Upload to S3
aws s3 cp "$BACKUP_DIR/backup_$DATE.sql.gz" s3://x402-backups/

# Cleanup old backups (keep last 30 days)
find $BACKUP_DIR -type f -mtime +30 -delete
```

### Wallet Backup

```bash
# CRITICAL: Store wallet keys securely
# 1. Use hardware wallet for hot wallet
# 2. Store backup phrase in secure location
# 3. Use multi-signature for large amounts
# 4. Regular security audits
```

---

## Performance Optimization

### Connection Pooling

```python
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600,
)
```

### RPC Request Optimization

```python
class OptimizedRPCClient:
    def __init__(self, primary_url, backup_urls):
        self.primary = primary_url
        self.backups = backup_urls
        self.current_index = 0

    async def request(self, method, params):
        urls = [self.primary] + self.backups

        for url in urls:
            try:
                return await self._make_request(url, method, params)
            except Exception as e:
                logger.warning(f"RPC request failed on {url}: {e}")
                continue

        raise Exception("All RPC endpoints failed")
```

---

## Scaling Strategies

### Horizontal Scaling

```yaml
# Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: x402-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: x402-api
  template:
    metadata:
      labels:
        app: x402-api
    spec:
      containers:
      - name: x402-api
        image: x402-api:latest
        ports:
        - containerPort: 8080
        env:
        - name: SOLANA_RPC_URL
          valueFrom:
            secretKeyRef:
              name: x402-secrets
              key: rpc-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## Cost Optimization

### RPC Cost Management

```python
# Use caching to reduce RPC calls
class CachedRPCClient:
    def __init__(self, rpc_url, cache_ttl=60):
        self.client = AsyncClient(rpc_url)
        self.cache = {}
        self.cache_ttl = cache_ttl

    async def get_transaction(self, tx_hash):
        if tx_hash in self.cache:
            cached_time, result = self.cache[tx_hash]
            if time.time() - cached_time < self.cache_ttl:
                return result

        result = await self.client.get_transaction(tx_hash)
        self.cache[tx_hash] = (time.time(), result)
        return result
```

---

## See Also

- [Testing Guide](testing.md)
- [Troubleshooting Guide](troubleshooting.md)
- [Technical Specification](../openlibx402-technical-spec.md)

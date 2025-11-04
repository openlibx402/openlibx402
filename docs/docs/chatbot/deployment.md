# Deployment Guide

Complete guide for deploying the OpenLibx402 RAG Chatbot to production.

## Prerequisites

- Deno 1.x+ installed
- OpenAI API key
- Pinecone account and index
- Solana devnet or mainnet wallet
- USDC tokens (for testing on devnet)
- A web server running mkdocs documentation

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Client Browser                    │
│                 (MkDocs Docs Site)                  │
│                                                     │
│  ┌────────────────────────────────────────────┐   │
│  │  Chatbot Widget (JavaScript)                │   │
│  │  - Chat UI                                  │   │
│  │  - Rate limit display                       │   │
│  │  - Payment modal                            │   │
│  │  - Phantom wallet integration               │   │
│  └────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
           ↓ (REST API calls)
┌─────────────────────────────────────────────────────┐
│          Chatbot Backend (Deno Server)              │
│          http://localhost:3000                      │
│                                                     │
│  ┌────────────────────────────────────────────┐   │
│  │  Routes                                    │   │
│  │  - POST /api/chat                          │   │
│  │  - GET /api/status                         │   │
│  │  - GET /api/payment/info                   │   │
│  │  - POST /api/payment                       │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
│  ┌────────────────────────────────────────────┐   │
│  │  Services                                  │   │
│  │  - OpenAI (GPT-5 nano)                     │   │
│  │  - Pinecone (Vector DB)                    │   │
│  │  - Solana (Payment verification)           │   │
│  │  - Deno KV (Rate limiting & transactions)  │   │
│  └────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
     ↓ (API calls)        ↓ (Vector queries)    ↓
┌──────────────┐    ┌─────────────────┐    ┌──────────┐
│  OpenAI API  │    │  Pinecone API   │    │  Solana  │
│              │    │                 │    │  RPC     │
└──────────────┘    └─────────────────┘    └──────────┘
```

## Step-by-Step Deployment

### Phase 1: Development Setup

#### 1.1 Clone and Install

```bash
git clone https://github.com/your-org/openlibx402.git
cd openlibx402/chatbot
deno cache --reload src/main.ts
```

#### 1.2 Configure Environment

Create `.env` file in `chatbot/` directory:

```env
OPENAI_API_KEY=sk-proj-your-key-here
PINECONE_API_KEY=pcsk_your-key-here
PINECONE_INDEX_NAME=openlibx402-docs
X402_WALLET_ADDRESS=your-devnet-wallet
X402_WALLET_SECRET_KEY=[your,secret,key,bytes]
SOLANA_NETWORK=devnet
USDC_MINT_ADDRESS=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
RATE_LIMIT_FREE_QUERIES=3
PORT=3000
ALLOWED_ORIGINS=http://localhost:8000,http://localhost:3000
```

#### 1.3 Test Locally

```bash
deno run --allow-net --allow-env --allow-read --allow-ffi main.ts
```

Expected output:
```
[INFO] [RAGBOT] Starting OpenLibx402 RAG Chatbot server...
[INFO] [RAGBOT] OpenAI API configured
[INFO] [RAGBOT] Pinecone index connected: openlibx402-docs
[INFO] [RAGBOT] Rate limiter initialized with Deno KV
[INFO] [RAGBOT] CORS enabled for origins: http://localhost:8000, http://localhost:3000
[INFO] [RAGBOT] Server listening on http://localhost:3000
```

### Phase 2: Testing

#### 2.1 Test Chat Endpoint

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is OpenLibx402?"}'
```

#### 2.2 Test Status Endpoint

```bash
curl http://localhost:3000/api/status
```

#### 2.3 Manual Payment Testing

1. Get devnet tokens: https://spl-token-faucet.com/
2. Open browser devtools
3. Open chatbot widget
4. Use 3 free queries
5. Click "Pay with Solana"
6. Complete payment flow
7. Verify queries are granted

### Phase 3: Production Preparation

#### 3.1 Update Configuration

Create `chatbot/.env.production`:

```env
OPENAI_API_KEY=sk-proj-your-production-key
PINECONE_API_KEY=pcsk_your-production-key
PINECONE_INDEX_NAME=openlibx402-docs-prod
X402_WALLET_ADDRESS=your-mainnet-wallet
X402_WALLET_SECRET_KEY=[your,production,secret,key]
SOLANA_NETWORK=mainnet-beta
USDC_MINT_ADDRESS=EPjFWaYCh7QFMZWWB2BHXZPE6q8bZvWfNvwsKqVDTLST
RATE_LIMIT_FREE_QUERIES=5
PORT=3000
ALLOWED_ORIGINS=https://docs.openlibx402.com,https://openlibx402.github.io
```

#### 3.2 Update Frontend Configuration

Update `docs/overrides/main.html`:

```html
<script>
  window.CHATBOT_API_URL = 'https://api.chatbot.openlibx402.com';
</script>
<script src="/assets/javascripts/chatbot.js"></script>
```

#### 3.3 Build MkDocs

```bash
cd docs
mkdocs build -c
```

### Phase 4: Deployment Options

#### Option A: Docker Container

Create `chatbot/Dockerfile`:

```dockerfile
FROM denoland/deno:latest

WORKDIR /app
COPY . .

RUN deno cache src/main.ts

CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--allow-ffi", "src/main.ts"]
```

Build and deploy:

```bash
docker build -t openlibx402-chatbot .
docker run -p 3000:3000 --env-file .env.production openlibx402-chatbot
```

#### Option B: Deno Deploy (Cloud)

1. Create account at https://deno.com/deploy
2. Connect GitHub repository
3. Create new project
4. Set environment variables in project settings
5. Deploy main branch

`.deployrc.json`:
```json
{
  "include": ["src/"],
  "exclude": [],
  "entrypoint": "src/main.ts"
}
```

#### Option C: Traditional VPS

1. Set up VPS (Ubuntu 22.04+)
2. Install Deno: `curl -fsSL https://deno.land/x/install/install.sh | sh`
3. Create systemd service
4. Set up reverse proxy (Nginx)
5. Configure SSL/TLS

**System Service** (`/etc/systemd/system/chatbot.service`):

```ini
[Unit]
Description=OpenLibx402 RAG Chatbot
After=network.target

[Service]
Type=simple
User=chatbot
WorkingDirectory=/opt/chatbot
EnvironmentFile=/opt/chatbot/.env.production
ExecStart=/home/user/.deno/bin/deno run --allow-net --allow-env --allow-read --allow-ffi src/main.ts
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Nginx Reverse Proxy**:

```nginx
upstream chatbot {
    server localhost:3000;
}

server {
    listen 443 ssl http2;
    server_name api.chatbot.openlibx402.com;

    ssl_certificate /etc/letsencrypt/live/chatbot.openlibx402.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chatbot.openlibx402.com/privkey.pem;

    location / {
        proxy_pass http://chatbot;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

### Phase 5: Integration with MkDocs

#### 5.1 Update MkDocs Config

`docs/mkdocs.yml`:

```yaml
site_name: OpenLibx402 Documentation
theme:
  name: material

nav:
  - Home: index.md
  - Getting Started: getting-started.md
  - API Reference: api.md

plugins:
  - search
  - offline

extra:
  chatbot:
    enabled: true
    api_url: https://api.chatbot.openlibx402.com
```

#### 5.2 Update HTML Template

`docs/overrides/main.html`:

```html
{% extends "base.html" %}

{% block scripts %}
  {{ super() }}
  <script>
    window.CHATBOT_API_URL = '{{ config.extra.chatbot.api_url }}';
    window.CHATBOT_DISABLED = !{{ config.extra.chatbot.enabled|lower }};
  </script>
  <script src="{{ 'assets/javascripts/chatbot.js'|url }}"></script>
{% endblock %}
```

#### 5.3 Deploy Documentation

```bash
cd docs
mkdocs gh-deploy  # For GitHub Pages
# OR
mkdocs build && aws s3 sync site/ s3://your-bucket/docs/
```

### Phase 6: Monitoring and Maintenance

#### 6.1 Health Checks

Set up monitoring for `/api/status` endpoint:

```bash
# Monitoring script
curl -f http://localhost:3000/api/status || echo "Chatbot down"
```

#### 6.2 Log Monitoring

Monitor server logs:

```bash
journalctl -u chatbot -f
# or
tail -f /var/log/chatbot.log
```

#### 6.3 Cost Monitoring

Track spending on:
- OpenAI API (view at https://platform.openai.com/account/billing/overview)
- Pinecone (view at https://app.pinecone.io/organizations)
- Solana RPC (if using paid tier)

#### 6.4 Backup Strategy

Back up critical data:

```bash
# Backup Deno KV data
deno eval "const kv = await Deno.openKv(); const iter = kv.list({}); for await (const entry of iter) { console.log(JSON.stringify(entry)); }" > kv-backup.jsonl

# Backup environment
cp .env.production .env.production.backup
```

## Production Checklist

- [ ] Update all API keys to production values
- [ ] Set `SOLANA_NETWORK=mainnet-beta`
- [ ] Use mainnet USDC mint address
- [ ] Configure production CORS origins
- [ ] Update frontend API URL
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up monitoring and alerting
- [ ] Test full payment flow end-to-end
- [ ] Load test with simulated users
- [ ] Plan for scaling (if needed)
- [ ] Document runbooks for operations
- [ ] Set up automated backups

## Scaling Considerations

### Horizontal Scaling

For high traffic, run multiple chatbot instances:

```bash
# Instance 1
PORT=3001 deno run --allow-net --allow-env --allow-read --allow-ffi src/main.ts

# Instance 2
PORT=3002 deno run --allow-net --allow-env --allow-read --allow-ffi src/main.ts

# Load balancer routes to both
```

**Nginx Load Balancer**:

```nginx
upstream chatbot_backend {
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

server {
    listen 443 ssl http2;
    server_name api.chatbot.openlibx402.com;

    location / {
        proxy_pass http://chatbot_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Rate Limiting at Proxy Level

```nginx
limit_req_zone $binary_remote_addr zone=chatbot:10m rate=10r/s;

location /api/chat {
    limit_req zone=chatbot burst=20 nodelay;
    proxy_pass http://chatbot_backend;
}
```

### Caching Strategy

```nginx
# Cache payment info endpoint
location /api/payment/info {
    proxy_pass http://chatbot_backend;
    proxy_cache_valid 200 1h;
    add_header X-Cache-Status $upstream_cache_status;
}
```

## Troubleshooting

### Server Won't Start

```bash
# Check Deno is installed
deno --version

# Check port is available
lsof -i :3000

# Check environment variables
echo $OPENAI_API_KEY
```

### API Errors in Logs

```bash
# Check OpenAI API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# Check Pinecone connection
deno eval "const pc = await fetch('https://api.pinecone.io/v1/indexes'); console.log(await pc.json());"
```

### Payment Verification Failures

See [Payment System Troubleshooting](payments.md#troubleshooting)

### High Memory Usage

```bash
# Monitor memory
watch -n 1 'ps aux | grep deno'

# Reduce cache size or restart service
systemctl restart chatbot
```

## Rolling Updates

Zero-downtime deployment:

```bash
# 1. Build new version
deno cache --reload src/main.ts

# 2. Start new instance on different port
PORT=3001 deno run --allow-net --allow-env --allow-read --allow-ffi src/main.ts

# 3. Health check new instance
curl http://localhost:3001/api/status

# 4. Update load balancer to new instance
# (modify nginx upstream)
nginx -s reload

# 5. Stop old instance
kill $OLD_PID
```

## Security Hardening

### Firewall Rules

```bash
# Allow HTTPS only
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp  # Redirect to HTTPS
sudo ufw deny 3000     # Block direct access

# SSH access
sudo ufw allow 22/tcp from 1.2.3.4  # Your IP only
```

### DDoS Protection

```nginx
# Cloudflare or similar
# - Rate limiting
# - Bot detection
# - WAF rules
# - DDoS mitigation
```

### Secret Management

```bash
# Use environment variable management
# Never hardcode secrets
# Rotate API keys regularly
# Use different keys per environment
```

## Success Indicators

✅ Chatbot responding to queries in production
✅ Rate limiting working correctly
✅ Payments being processed and verified
✅ Documentation loading without errors
✅ API response time < 2 seconds
✅ 99.9% uptime
✅ Zero failed transactions

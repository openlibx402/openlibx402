# FastAPI Server Example

Example FastAPI server with X402 payment requirements.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your wallet address and token mint
```

3. Run the server:
```bash
python main.py
```

4. Visit http://localhost:8000/docs for API documentation

## Testing

### Get free data:
```bash
curl http://localhost:8000/free-data
```

### Try premium endpoint (will return 402):
```bash
curl http://localhost:8000/premium-data
```

### With payment client:
See the langchain-agent example for how to make payments automatically.

## Endpoints

- `GET /` - API information (free)
- `GET /free-data` - Free data (no payment)
- `GET /premium-data` - Premium data (0.10 USDC)
- `GET /expensive-data` - Expensive AI data (1.00 USDC)
- `GET /tiered-data/{tier}` - Tiered access (0.05 USDC)
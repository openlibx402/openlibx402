# Architecture: Next.js + Express + Privy

## The Issue

The `@privy-io/server-auth` package uses dynamic `require()` statements that are incompatible with Next.js's webpack bundling. This is a common issue with packages designed for Node.js servers.

## The Solution

This example uses a **two-server architecture**:

```
┌─────────────────────┐
│   Next.js Frontend  │  (Port 3000)
│   - UI Components   │
│   - Client-side code│
└──────────┬──────────┘
           │ HTTP calls
           ▼
┌─────────────────────┐
│  Express Backend    │  (Port 3001)
│  - Privy SDK        │
│  - X402 payments    │
│  - Wallet management│
└──────────┬──────────┘
           │
           ├─► Privy API (signing)
           │
           └─► X402 APIs (paid endpoints)
```

## Running the Application

### Terminal 1: Express Server (Privy)
```bash
cd server
pnpm install
pnpm dev
```
Server runs on `http://localhost:3001`

### Terminal 2: Next.js Frontend
```bash
pnpm dev
```
Frontend runs on `http://localhost:3000`

##Benefits of This Approach

1. **✅ Full Privy SDK Support** - Express has no webpack issues
2. **✅ Separation of Concerns** - Frontend and blockchain logic separated
3. **✅ Scalable** - Can deploy servers independently
4. **✅ Secure** - Privy credentials only in backend
5. **✅ Flexible** - Can add authentication, rate limiting, etc.

## Alternative Approaches

### 1. Standalone Express Server Only
Skip Next.js, use Express for everything:
```bash
cd server
pnpm dev
```
Access API directly at `http://localhost:3001/api/*`

### 2. Custom Next.js Server
Use Next.js with a custom server (not recommended by Vercel):
```javascript
// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const app = next({ dev: true });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  }).listen(3000);
});
```

### 3. Separate Deployment
- Deploy Next.js to Vercel
- Deploy Express to Heroku/Railway/Fly.io
- Configure PRIVY_SERVER_URL environment variable

## Files Structure

```
nextjs-privy-app/
├── app/                    # Next.js frontend
│   ├── components/
│   ├── api/               # Proxy routes (optional)
│   └── page.tsx
├── server/                 # Express backend ⭐
│   ├── src/
│   │   └── index.ts       # Privy integration here
│   ├── package.json
│   └── tsconfig.json
├── package.json            # Next.js dependencies
└── .env                    # Shared environment variables
```

## Environment Variables

Single `.env` file at root:
```bash
# Privy (used by Express server)
PRIVY_APP_ID=...
PRIVY_APP_SECRET=...
PRIVY_WALLET_ID=...

# Optional
X402_NETWORK=solana-devnet
X402_MAX_PAYMENT=10.0
X402_API_URL=http://localhost:8000/premium-data

# Server config
SERVER_PORT=3001
PRIVY_SERVER_URL=http://localhost:3001
```

## Production Deployment

### Option A: Vercel + Separate Backend

1. **Frontend (Vercel)**:
   ```bash
   vercel --prod
   ```
   Set `PRIVY_SERVER_URL` to your backend URL

2. **Backend (Railway/Fly.io)**:
   ```bash
   cd server
   fly deploy
   ```

### Option B: Single Server (Docker)

```dockerfile
FROM node:18

# Install dependencies
WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm install
RUN cd server && npm install

# Build
COPY . .
RUN npm run build
RUN cd server && npm run build

# Start both servers
CMD npm run start & cd server && npm start
```

## Why Not Next.js API Routes for Privy?

Next.js API routes use:
- **Edge Runtime** - Limited Node.js APIs
- **Serverless Functions** - Cold starts, timeouts
- **Webpack Bundling** - Incompatible with Privy's dynamic requires

Express provides:
- **Full Node.js** - All APIs available
- **Long-running** - Persistent connections
- **No bundling** - Direct require() support

## Recommendations

For this specific use case (Privy + X402):
- ✅ Use Express server for Privy operations
- ✅ Use Next.js for beautiful UI
- ✅ Keep them separate (microservices pattern)
- ✅ Communicate via HTTP/REST

This is the industry-standard pattern for integrating Node.js-specific SDKs with modern frontends.

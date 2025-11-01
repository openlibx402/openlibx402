/**
 * Express API Server for Vue.js X402 Example
 *
 * This server provides API endpoints with X402 payment requirements.
 */

import express, { Request, Response } from 'express'
import {
  X402Config,
  initX402,
  paymentRequired,
  X402Request,
} from '@openlibx402/express'
import * as dotenv from 'dotenv'

dotenv.config()

// Initialize X402 configuration
const config = new X402Config({
  paymentAddress: process.env.PAYMENT_WALLET_ADDRESS || 'DEMO_WALLET_ADDRESS',
  tokenMint: process.env.USDC_MINT_ADDRESS || 'DEMO_USDC_MINT',
  network: 'solana-devnet',
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  autoVerify: process.env.NODE_ENV === 'production',
})

initX402(config)

const app = express()
app.use(express.json())

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-payment-authorization')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// Root endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'X402 Vue.js Demo API',
    version: '1.0.0',
    endpoints: {
      free: '/api/free-data',
      premium: '/api/premium-data',
      expensive: '/api/expensive-data',
      tiered: '/api/tiered-data/:tier',
      process: '/api/process-data',
    },
    documentation: 'https://openlib.xyz',
  })
})

// Free data endpoint
app.get('/api/free-data', (req: Request, res: Response) => {
  res.json({
    data: 'This is free content available to everyone',
    price: 0,
    access: 'public',
  })
})

// Premium data endpoint - requires 0.10 USDC payment
app.get(
  '/api/premium-data',
  paymentRequired({
    amount: '0.10',
    description: 'Access to premium market data',
  }),
  (req: X402Request, res: Response) => {
    res.json({
      data: 'This is premium content',
      market_data: {
        price: 100.5,
        volume: 1_000_000,
        timestamp: new Date().toISOString(),
      },
      price_paid: '0.10',
      access: 'premium',
      payment_id: req.payment?.paymentId,
    })
  }
)

// Expensive AI inference endpoint - requires 1.00 USDC payment
app.get(
  '/api/expensive-data',
  paymentRequired({
    amount: '1.00',
    description: 'AI model inference with high computational cost',
  }),
  (req: X402Request, res: Response) => {
    res.json({
      data: 'AI-generated response',
      model: 'gpt-4',
      inference_result: {
        prompt: 'What is the meaning of life?',
        response: '42',
        tokens_used: 150,
        processing_time_ms: 234,
      },
      price_paid: '1.00',
      access: 'expensive',
      payment_id: req.payment?.paymentId,
    })
  }
)

// Tiered data endpoint - requires 0.05 USDC payment
app.get(
  '/api/tiered-data/:tier',
  paymentRequired({
    amount: '0.05',
    description: 'Access to tiered content',
  }),
  (req: X402Request, res: Response) => {
    const tier = req.params.tier || 'basic'
    
    const tierContent: Record<string, any> = {
      basic: {
        quality: 'SD',
        resolution: '480p',
        features: ['Basic analytics', 'Standard support'],
      },
      premium: {
        quality: 'HD',
        resolution: '1080p',
        features: ['Advanced analytics', 'Priority support', 'API access'],
      },
      enterprise: {
        quality: '4K',
        resolution: '2160p',
        features: [
          'Full analytics suite',
          '24/7 support',
          'Unlimited API access',
          'Custom integrations',
        ],
      },
    }
    
    res.json({
      tier,
      content: tierContent[tier] || tierContent.basic,
      price_paid: '0.05',
      access: 'tiered',
      payment_id: req.payment?.paymentId,
    })
  }
)

// Process data endpoint - requires 0.25 USDC payment (POST)
app.post(
  '/api/process-data',
  paymentRequired({
    amount: '0.25',
    description: 'Data processing service',
  }),
  (req: X402Request, res: Response) => {
    const data = req.body.data || ''
    
    res.json({
      processed_data: data.toUpperCase(),
      processing_steps: [
        'Received data',
        'Validated format',
        'Applied transformations',
        'Returned result',
      ],
      price_paid: '0.25',
      access: 'process',
      payment_id: req.payment?.paymentId,
      timestamp: new Date().toISOString(),
    })
  }
)

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`✅ X402 Express API server running on http://localhost:${PORT}`)
  console.log(`📡 Network: ${config.network}`)
  console.log(`💰 Payment Address: ${config.paymentAddress}`)
  console.log(`🔒 Auto-verify: ${config.autoVerify}`)
})

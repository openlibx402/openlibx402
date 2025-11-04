/**
 * OpenLibx402 RAG Chatbot API
 * A documentation chatbot with RAG, rate limiting, and payment support
 */

import { load } from 'dotenv';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadConfig } from './src/utils/config.ts';
import { logger } from './src/utils/logger.ts';
import { RAGService } from './src/services/rag.ts';
import { LLMService } from './src/services/llm.ts';
import { RateLimiter } from './src/middleware/rateLimit.ts';
import { handleChat, handleChatNoStream } from './src/handlers/chat.ts';
import { handlePayment, getPaymentInfo } from './src/handlers/payment.ts';
import { handleHealth, handleStatus } from './src/handlers/health.ts';

// Load environment variables from .env file
await load({ export: true });

// Load configuration
const config = loadConfig();
logger.info('Configuration loaded');

// Initialize services
const ragService = new RAGService(config);
const llmService = new LLMService(config);
const rateLimiter = new RateLimiter(config);

// Initialize Deno KV for rate limiting
await rateLimiter.init();
logger.info('Services initialized');

// Create Hono app
const app = new Hono();

// CORS middleware - Allow requests from MkDocs and other origins
app.use('/*', cors({
  origin: config.cors.allowedOrigins,
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['Content-Type'],
  maxAge: 86400,
}));

// Health check (no rate limiting)
app.get('/api/health', handleHealth);

// Apply rate limiting middleware to protected routes
app.use('/api/chat', rateLimiter.middleware());
app.use('/api/chat-stream', rateLimiter.middleware());
app.use('/api/status', rateLimiter.middleware());

// Chat endpoints
app.post('/api/chat-stream', (c) => handleChat(c, ragService, llmService, rateLimiter));
app.post('/api/chat', (c) => handleChatNoStream(c, ragService, llmService, rateLimiter));

// Status endpoint
app.get('/api/status', handleStatus);

// Payment endpoints
app.post('/api/payment', (c) => handlePayment(c, rateLimiter));
app.get('/api/payment/info', getPaymentInfo);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    service: 'OpenLibx402 RAG Chatbot',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      status: 'GET /api/status',
      chat: 'POST /api/chat',
      chatStream: 'POST /api/chat-stream',
      payment: 'POST /api/payment',
      paymentInfo: 'GET /api/payment/info',
    },
    documentation: 'https://github.com/openlibx402/openlibx402',
  });
});

// Error handling
app.onError((err, c) => {
  logger.error('Unhandled error', err);
  return c.json(
    {
      error: 'Internal server error',
      message: err.message,
    },
    500
  );
});

// Start server
const port = config.server.port;
logger.info(`Starting server on port ${port}`);

Deno.serve({ port }, app.fetch);

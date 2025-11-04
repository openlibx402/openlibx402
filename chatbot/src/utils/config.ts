/**
 * Configuration utilities
 * Loads and validates environment variables
 */

export interface Config {
  openai: {
    apiKey: string;
    model: string;
    embeddingModel: string;
  };
  pinecone: {
    apiKey: string;
    indexName: string;
  };
  x402: {
    walletSecretKey: string;
    paymentAmount: number;
    paymentToken: string;
  };
  rateLimit: {
    freeQueries: number;
  };
  server: {
    port: number;
  };
  cors: {
    allowedOrigins: string[];
  };
}

function getEnv(key: string, defaultValue?: string): string {
  const value = Deno.env.get(key);
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue!;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = Deno.env.get(key);
  return value ? parseInt(value, 10) : defaultValue;
}

export function loadConfig(): Config {
  return {
    openai: {
      apiKey: getEnv('OPENAI_API_KEY'),
      model: getEnv('OPENAI_MODEL', 'gpt-4o-mini'),
      embeddingModel: getEnv('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
    },
    pinecone: {
      apiKey: getEnv('PINECONE_API_KEY'),
      indexName: getEnv('PINECONE_INDEX_NAME', 'openlibx402-docs'),
    },
    x402: {
      walletSecretKey: getEnv('X402_WALLET_SECRET_KEY', ''),
      paymentAmount: getEnvNumber('X402_PAYMENT_AMOUNT', 0.1),
      paymentToken: getEnv('X402_PAYMENT_TOKEN', 'USDC'),
    },
    rateLimit: {
      freeQueries: getEnvNumber('RATE_LIMIT_FREE_QUERIES', 3),
    },
    server: {
      port: getEnvNumber('PORT', 8000),
    },
    cors: {
      allowedOrigins: getEnv('ALLOWED_ORIGINS', '*').split(','),
    },
  };
}

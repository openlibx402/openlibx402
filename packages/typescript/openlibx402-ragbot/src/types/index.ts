/**
 * RAG Bot Types
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface RAGQuery {
  query: string;
  topK?: number;
  minScore?: number;
}

export interface RAGResult {
  content: string;
  metadata: {
    source: string;
    section?: string;
    score: number;
  };
}

export interface RAGContext {
  results: RAGResult[];
  query: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  userId?: string;
}

export interface ChatResponse {
  message: string;
  sources: Array<{
    file: string;
    section?: string;
    relevance: number;
  }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  requiresPayment: boolean;
}

export interface EmbeddingConfig {
  model: string;
  dimensions: number;
}

export interface PineconeConfig {
  apiKey: string;
  environment?: string;
  indexName: string;
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  embeddingModel: string;
  temperature?: number;
  maxTokens?: number;
}

export interface RAGBotConfig {
  openai: OpenAIConfig;
  pinecone: PineconeConfig;
  rateLimit: {
    freeQueriesPerDay: number;
    paymentAmount: number;
    paymentToken: string;
  };
}

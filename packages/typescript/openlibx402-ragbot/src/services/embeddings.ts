/**
 * Embeddings Service
 * Handles text embedding generation using OpenAI
 */

import OpenAI from 'openai';
import type { EmbeddingConfig } from '../types/index';

export class EmbeddingsService {
  private client: OpenAI;
  private config: EmbeddingConfig;

  constructor(apiKey: string, config?: Partial<EmbeddingConfig>) {
    this.client = new OpenAI({ apiKey });
    this.config = {
      model: config?.model || 'text-embedding-3-small',
      dimensions: config?.dimensions || 1536,
    };
  }

  /**
   * Generate embeddings for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.config.model,
      input: text,
      dimensions: this.config.dimensions,
    });

    return response.data[0].embedding;
  }

  /**
   * Generate embeddings for multiple texts (batch processing)
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: this.config.model,
      input: texts,
      dimensions: this.config.dimensions,
    });

    return response.data.map((item) => item.embedding);
  }

  /**
   * Get embedding dimensions
   */
  getDimensions(): number {
    return this.config.dimensions;
  }

  /**
   * Get embedding model name
   */
  getModel(): string {
    return this.config.model;
  }
}

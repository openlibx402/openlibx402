/**
 * Vector Store Service
 * Handles interactions with Pinecone vector database
 */

import { Pinecone } from '@pinecone-database/pinecone';
import type { PineconeConfig, RAGQuery, RAGResult } from '../types/index';

export interface VectorRecord {
  id: string;
  values: number[];
  metadata: Record<string, string | number | boolean | string[]> & {
    text: string;
    source: string;
    section?: string;
  };
}

export class VectorStoreService {
  private client: Pinecone;
  private indexName: string;

  constructor(config: PineconeConfig) {
    this.client = new Pinecone({
      apiKey: config.apiKey,
    });
    this.indexName = config.indexName;
  }

  /**
   * Upsert vectors to Pinecone index
   */
  async upsert(vectors: VectorRecord[]): Promise<void> {
    const index = this.client.index(this.indexName);

    // Pinecone recommends batches of 100
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
    }
  }

  /**
   * Query similar vectors
   */
  async query(params: RAGQuery & { vector: number[] }): Promise<RAGResult[]> {
    const index = this.client.index(this.indexName);

    const queryResponse = await index.query({
      vector: params.vector,
      topK: params.topK || 5,
      includeMetadata: true,
    });

    const results: RAGResult[] = [];

    for (const match of queryResponse.matches || []) {
      if (params.minScore && match.score && match.score < params.minScore) {
        continue;
      }

      const metadata = match.metadata as VectorRecord['metadata'];

      results.push({
        content: metadata.text,
        metadata: {
          source: metadata.source,
          section: metadata.section,
          score: match.score || 0,
        },
      });
    }

    return results;
  }

  /**
   * Delete all vectors from index
   */
  async deleteAll(): Promise<void> {
    const index = this.client.index(this.indexName);
    await index.deleteAll();
  }

  /**
   * Delete vectors by IDs
   */
  async deleteByIds(ids: string[]): Promise<void> {
    const index = this.client.index(this.indexName);
    await index.deleteMany(ids);
  }

  /**
   * Get index statistics
   */
  async getStats(): Promise<{
    totalVectors: number;
    dimension: number;
  }> {
    const index = this.client.index(this.indexName);
    const stats = await index.describeIndexStats();

    return {
      totalVectors: stats.totalRecordCount || 0,
      dimension: stats.dimension || 0,
    };
  }
}

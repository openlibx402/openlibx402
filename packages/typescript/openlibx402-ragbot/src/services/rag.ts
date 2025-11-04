/**
 * RAG (Retrieval-Augmented Generation) Service
 * Orchestrates the RAG pipeline: query -> embed -> search -> retrieve
 */

import { EmbeddingsService } from './embeddings';
import { VectorStoreService } from './vectorstore';
import type { RAGQuery, RAGResult, RAGContext } from '../types/index';

export class RAGService {
  constructor(
    private embeddingsService: EmbeddingsService,
    private vectorStore: VectorStoreService
  ) {}

  /**
   * Retrieve relevant documents for a query
   */
  async retrieve(query: string, options?: Partial<RAGQuery>): Promise<RAGContext> {
    // Generate embedding for the query
    const queryEmbedding = await this.embeddingsService.generateEmbedding(query);

    // Search for similar documents in vector store
    const results = await this.vectorStore.query({
      query,
      vector: queryEmbedding,
      topK: options?.topK || 5,
      minScore: options?.minScore || 0.7,
    });

    return {
      results,
      query,
    };
  }

  /**
   * Format RAG context for LLM prompt
   */
  formatContext(context: RAGContext): string {
    if (context.results.length === 0) {
      return 'No relevant documentation found for this query.';
    }

    const formattedResults = context.results
      .map((result, idx) => {
        const source = result.metadata.section
          ? `${result.metadata.source} (${result.metadata.section})`
          : result.metadata.source;

        return `[${idx + 1}] Source: ${source}\nContent: ${result.content}\n`;
      })
      .join('\n---\n\n');

    return `Here are the most relevant documentation sections:\n\n${formattedResults}`;
  }

  /**
   * Get sources from RAG context for citation
   */
  getSources(context: RAGContext) {
    return context.results.map((result) => ({
      file: result.metadata.source,
      section: result.metadata.section,
      relevance: result.metadata.score,
    }));
  }
}

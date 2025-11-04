/**
 * RAG Service for chatbot
 * Handles document retrieval and context generation
 */

import { Pinecone } from 'pinecone';
import OpenAI from 'openai';
import type { Config } from '../utils/config.ts';

export interface RAGResult {
  content: string;
  source: string;
  section?: string;
  score: number;
}

export interface RAGContext {
  results: RAGResult[];
  formattedContext: string;
}

export class RAGService {
  private openai: OpenAI;
  private pinecone: Pinecone;
  private indexName: string;

  constructor(config: Config) {
    this.openai = new OpenAI({ apiKey: config.openai.apiKey });
    this.pinecone = new Pinecone({ apiKey: config.pinecone.apiKey });
    this.indexName = config.pinecone.indexName;
  }

  /**
   * Retrieve relevant documents for a query
   */
  async retrieve(query: string, topK: number = 5): Promise<RAGContext> {
    // Generate query embedding
    const embeddingResponse = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      dimensions: 1536,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Query Pinecone
    const index = this.pinecone.index(this.indexName);
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });

    // Process results
    const results: RAGResult[] = [];
    for (const match of queryResponse.matches || []) {
      const metadata = match.metadata as {
        text: string;
        source: string;
        section?: string;
      };

      // Filter by relevance score
      if (match.score && match.score >= 0.7) {
        results.push({
          content: metadata.text,
          source: metadata.source,
          section: metadata.section,
          score: match.score,
        });
      }
    }

    // Format context for LLM
    const formattedContext = this.formatContext(results);

    return {
      results,
      formattedContext,
    };
  }

  /**
   * Format results into context for LLM
   */
  private formatContext(results: RAGResult[]): string {
    if (results.length === 0) {
      return 'No relevant documentation found.';
    }

    const sections = results.map((result, idx) => {
      const source = result.section
        ? `${result.source} (${result.section})`
        : result.source;

      return `[Source ${idx + 1}] ${source}\n${result.content}`;
    });

    return `Relevant documentation:\n\n${sections.join('\n\n---\n\n')}`;
  }

  /**
   * Get sources for citation
   */
  getSources(context: RAGContext) {
    return context.results.map((result) => ({
      file: result.source,
      section: result.section,
      relevance: Math.round(result.score * 100) / 100,
    }));
  }
}

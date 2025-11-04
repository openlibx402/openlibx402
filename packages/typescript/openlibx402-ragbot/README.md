# @openlibx402/ragbot

RAG (Retrieval-Augmented Generation) bot utilities for OpenLibx402.

## Features

- 🤖 **RAG Pipeline**: Complete retrieval-augmented generation workflow
- 📚 **Document Chunking**: Intelligent markdown document splitting
- 🔍 **Vector Search**: Pinecone integration for semantic search
- 💬 **LLM Integration**: OpenAI chat completions with streaming support
- 🎯 **Type Safe**: Full TypeScript support

## Installation

```bash
pnpm add @openlibx402/ragbot
```

## Quick Start

```typescript
import {
  EmbeddingsService,
  VectorStoreService,
  RAGService,
  LLMService,
} from '@openlibx402/ragbot';

// Initialize services
const embeddings = new EmbeddingsService(process.env.OPENAI_API_KEY);
const vectorStore = new VectorStoreService({
  apiKey: process.env.PINECONE_API_KEY,
  indexName: 'your-index',
});

const rag = new RAGService(embeddings, vectorStore);
const llm = new LLMService({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini',
  embeddingModel: 'text-embedding-3-small',
});

// Retrieve relevant context
const context = await rag.retrieve('How do I use OpenLibx402?');
const formattedContext = rag.formatContext(context);

// Generate response
const response = await llm.complete(
  [{ role: 'user', content: 'How do I use OpenLibx402?' }],
  formattedContext
);

console.log(response.message);
```

## API Reference

### EmbeddingsService

Generate text embeddings using OpenAI.

```typescript
const embeddings = new EmbeddingsService(apiKey, {
  model: 'text-embedding-3-small',
  dimensions: 1536,
});

const vector = await embeddings.generateEmbedding('Hello world');
```

### VectorStoreService

Interact with Pinecone vector database.

```typescript
const vectorStore = new VectorStoreService({
  apiKey: 'your-pinecone-api-key',
  indexName: 'your-index',
});

// Upsert vectors
await vectorStore.upsert([
  {
    id: 'doc-1',
    values: [0.1, 0.2, ...],
    metadata: {
      text: 'Document content',
      source: 'docs/intro.md',
    },
  },
]);

// Query
const results = await vectorStore.query({
  query: 'search query',
  vector: [0.1, 0.2, ...],
  topK: 5,
  minScore: 0.7,
});
```

### RAGService

Orchestrate the RAG pipeline.

```typescript
const rag = new RAGService(embeddingsService, vectorStoreService);

const context = await rag.retrieve('user query', {
  topK: 5,
  minScore: 0.7,
});

const formatted = rag.formatContext(context);
const sources = rag.getSources(context);
```

### LLMService

Generate chat completions with OpenAI.

```typescript
const llm = new LLMService({
  apiKey: 'your-openai-api-key',
  model: 'gpt-4o-mini',
  embeddingModel: 'text-embedding-3-small',
  temperature: 0.7,
  maxTokens: 1000,
});

// Non-streaming
const response = await llm.complete(messages, context);

// Streaming
for await (const chunk of llm.stream(messages, context)) {
  process.stdout.write(chunk);
}
```

### DocumentChunker

Split markdown documents intelligently.

```typescript
import { DocumentChunker } from '@openlibx402/ragbot';

const chunker = new DocumentChunker({
  maxChunkSize: 1000,
  chunkOverlap: 200,
  preserveCodeBlocks: true,
});

const chunks = chunker.chunk(markdownText);
const sections = chunker.chunkBySection(markdownText);
```

## License

MIT

# @openlibx402/ragbot

RAG (Retrieval-Augmented Generation) bot utilities for building AI-powered question-answering systems with OpenLibx402.

## Overview

The `@openlibx402/ragbot` package provides a complete toolkit for implementing Retrieval-Augmented Generation (RAG) pipelines. It includes services for document processing, vector embeddings, semantic search, and LLM-powered question answering.

This package powers the [OpenLibx402 RAG Chatbot](../../chatbot/index.md) and can be used to build your own intelligent chatbots and Q&A systems.

## Features

- 🤖 **Complete RAG Pipeline**: End-to-end retrieval-augmented generation workflow
- 📚 **Document Chunking**: Intelligent markdown document splitting with section awareness
- 🔍 **Vector Search**: Pinecone integration for high-performance semantic search
- 💬 **LLM Integration**: OpenAI chat completions with streaming support
- 🎯 **Type Safe**: Full TypeScript support with comprehensive type definitions
- ⚡ **Production Ready**: Battle-tested in the OpenLibx402 chatbot

## Installation

```bash
# Using pnpm (recommended)
pnpm add @openlibx402/ragbot

# Using npm
npm install @openlibx402/ragbot

# Using yarn
yarn add @openlibx402/ragbot
```

## Quick Start

### Basic RAG Pipeline

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
  apiKey: process.env.PINECONE_API_KEY!,
  indexName: 'openlibx402-docs',
});

// Create RAG service
const rag = new RAGService(embeddings, vectorStore);

// Create LLM service
const llm = new LLMService({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini',
  temperature: 0.7,
});

// Process a user query
async function answerQuestion(query: string) {
  // 1. Retrieve relevant context from vector database
  const context = await rag.retrieve(query, {
    topK: 5,
    minScore: 0.7,
  });

  // 2. Format context for LLM
  const formattedContext = rag.formatContext(context);

  // 3. Generate response
  const messages = [
    { role: 'user' as const, content: query },
  ];

  const response = await llm.complete(messages, formattedContext);

  // 4. Return answer with sources
  return {
    answer: response.message,
    sources: rag.getSources(context),
    model: response.model,
    tokensUsed: response.usage?.total_tokens,
  };
}

// Usage
const result = await answerQuestion('How do I use OpenLibx402 with Express?');
console.log(result.answer);
console.log('Sources:', result.sources);
```

### Streaming Responses

```typescript
import { LLMService } from '@openlibx402/ragbot';

const llm = new LLMService({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini',
});

async function streamAnswer(query: string, context: string) {
  const messages = [{ role: 'user' as const, content: query }];

  // Stream response chunks
  for await (const chunk of llm.stream(messages, context)) {
    process.stdout.write(chunk);
  }
}
```

## API Reference

### EmbeddingsService

Generate text embeddings using OpenAI's embedding models.

#### Constructor

```typescript
new EmbeddingsService(apiKey: string, options?: {
  model?: string;
  dimensions?: number;
})
```

**Parameters:**
- `apiKey`: OpenAI API key
- `options.model`: Embedding model to use (default: `'text-embedding-3-small'`)
- `options.dimensions`: Embedding dimensions (default: `1536`)

#### Methods

##### generateEmbedding()

Generate embedding for a single text.

```typescript
async generateEmbedding(text: string): Promise<number[]>
```

**Example:**

```typescript
const embeddings = new EmbeddingsService(apiKey);
const vector = await embeddings.generateEmbedding('Hello, world!');
console.log(vector.length); // 1536
```

##### generateBatchEmbeddings()

Generate embeddings for multiple texts.

```typescript
async generateBatchEmbeddings(texts: string[]): Promise<number[][]>
```

**Example:**

```typescript
const vectors = await embeddings.generateBatchEmbeddings([
  'First document',
  'Second document',
  'Third document',
]);
```

---

### VectorStoreService

Interact with Pinecone vector database for semantic search.

#### Constructor

```typescript
new VectorStoreService(config: {
  apiKey: string;
  indexName: string;
  namespace?: string;
})
```

**Parameters:**
- `apiKey`: Pinecone API key
- `indexName`: Name of the Pinecone index
- `namespace`: Optional namespace for organizing vectors

#### Methods

##### upsert()

Insert or update vectors in the index.

```typescript
async upsert(vectors: Array<{
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}>): Promise<void>
```

**Example:**

```typescript
const vectorStore = new VectorStoreService({
  apiKey: process.env.PINECONE_API_KEY!,
  indexName: 'my-index',
});

await vectorStore.upsert([
  {
    id: 'doc-1',
    values: await embeddings.generateEmbedding('Document content'),
    metadata: {
      text: 'Document content',
      source: 'docs/intro.md',
      title: 'Introduction',
    },
  },
]);
```

##### query()

Search for similar vectors.

```typescript
async query(params: {
  query?: string;
  vector?: number[];
  topK?: number;
  minScore?: number;
  filter?: Record<string, any>;
}): Promise<Array<{
  id: string;
  score: number;
  metadata?: Record<string, any>;
}>>
```

**Parameters:**
- `query`: Text query (automatically converted to vector)
- `vector`: Pre-computed query vector
- `topK`: Number of results to return (default: 5)
- `minScore`: Minimum similarity score (0-1, default: 0.7)
- `filter`: Metadata filter for results

**Example:**

```typescript
const results = await vectorStore.query({
  query: 'How to install OpenLibx402?',
  topK: 5,
  minScore: 0.75,
});

for (const result of results) {
  console.log(`Score: ${result.score}`);
  console.log(`Text: ${result.metadata?.text}`);
}
```

##### deleteAll()

Delete all vectors from the index.

```typescript
async deleteAll(): Promise<void>
```

---

### RAGService

Orchestrate the complete RAG pipeline.

#### Constructor

```typescript
new RAGService(
  embeddingsService: EmbeddingsService,
  vectorStoreService: VectorStoreService
)
```

#### Methods

##### retrieve()

Retrieve relevant context for a query.

```typescript
async retrieve(query: string, options?: {
  topK?: number;
  minScore?: number;
}): Promise<Array<{
  id: string;
  score: number;
  metadata?: Record<string, any>;
}>>
```

**Example:**

```typescript
const rag = new RAGService(embeddings, vectorStore);
const context = await rag.retrieve('What is X402 protocol?', {
  topK: 5,
  minScore: 0.7,
});
```

##### formatContext()

Format retrieved results into a context string for the LLM.

```typescript
formatContext(results: Array<{
  metadata?: { text?: string };
}>): string
```

**Example:**

```typescript
const formatted = rag.formatContext(context);
// Returns: "Context 1:\n[text]\n\nContext 2:\n[text]\n\n..."
```

##### getSources()

Extract source references from retrieved results.

```typescript
getSources(results: Array<{
  metadata?: { source?: string; title?: string };
}>): Array<{ source: string; title?: string }>
```

**Example:**

```typescript
const sources = rag.getSources(context);
// Returns: [{ source: 'docs/intro.md', title: 'Introduction' }, ...]
```

---

### LLMService

Generate chat completions using OpenAI's language models.

#### Constructor

```typescript
new LLMService(config: {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  embeddingModel?: string;
})
```

**Parameters:**
- `apiKey`: OpenAI API key
- `model`: Chat model to use (default: `'gpt-4o-mini'`)
- `temperature`: Sampling temperature 0-2 (default: `0.7`)
- `maxTokens`: Maximum tokens to generate (default: `1000`)
- `embeddingModel`: Embedding model (default: `'text-embedding-3-small'`)

#### Methods

##### complete()

Generate a completion (non-streaming).

```typescript
async complete(
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>,
  context?: string
): Promise<{
  message: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}>
```

**Example:**

```typescript
const llm = new LLMService({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini',
  temperature: 0.7,
});

const response = await llm.complete(
  [{ role: 'user', content: 'Explain OpenLibx402' }],
  'OpenLibx402 is a library ecosystem...'
);

console.log(response.message);
console.log('Tokens used:', response.usage?.total_tokens);
```

##### stream()

Generate a streaming completion.

```typescript
async *stream(
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>,
  context?: string
): AsyncGenerator<string>
```

**Example:**

```typescript
for await (const chunk of llm.stream(messages, context)) {
  process.stdout.write(chunk);
}
console.log('\n'); // New line after stream completes
```

---

### DocumentChunker

Split markdown documents intelligently while preserving structure.

#### Constructor

```typescript
new DocumentChunker(options?: {
  maxChunkSize?: number;
  chunkOverlap?: number;
  preserveCodeBlocks?: boolean;
})
```

**Parameters:**
- `maxChunkSize`: Maximum characters per chunk (default: `1000`)
- `chunkOverlap`: Overlap between chunks (default: `200`)
- `preserveCodeBlocks`: Keep code blocks intact (default: `true`)

#### Methods

##### chunk()

Split document into chunks with overlap.

```typescript
chunk(text: string): Array<{
  content: string;
  start: number;
  end: number;
}>
```

**Example:**

```typescript
import { DocumentChunker } from '@openlibx402/ragbot';

const chunker = new DocumentChunker({
  maxChunkSize: 1000,
  chunkOverlap: 200,
});

const chunks = chunker.chunk(markdownText);
for (const chunk of chunks) {
  console.log(chunk.content);
}
```

##### chunkBySection()

Split document by markdown sections (headings).

```typescript
chunkBySection(text: string): Array<{
  section: string;
  level: number;
  content: string;
}>
```

**Example:**

```typescript
const sections = chunker.chunkBySection(markdownText);
for (const section of sections) {
  console.log(`## ${section.section} (Level ${section.level})`);
  console.log(section.content);
}
```

## Complete Example: Building a RAG Chatbot

Here's a complete example of building a RAG-powered chatbot:

```typescript
import {
  EmbeddingsService,
  VectorStoreService,
  RAGService,
  LLMService,
  DocumentChunker,
} from '@openlibx402/ragbot';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

class RAGChatbot {
  private rag: RAGService;
  private llm: LLMService;

  constructor(
    openaiKey: string,
    pineconeKey: string,
    indexName: string
  ) {
    const embeddings = new EmbeddingsService(openaiKey);
    const vectorStore = new VectorStoreService({
      apiKey: pineconeKey,
      indexName,
    });

    this.rag = new RAGService(embeddings, vectorStore);
    this.llm = new LLMService({
      apiKey: openaiKey,
      model: 'gpt-4o-mini',
      temperature: 0.7,
    });
  }

  // Index documentation files
  async indexDocuments(docsDir: string) {
    const chunker = new DocumentChunker({
      maxChunkSize: 1000,
      chunkOverlap: 200,
    });

    const files = readdirSync(docsDir).filter(f => f.endsWith('.md'));

    for (const file of files) {
      const content = readFileSync(join(docsDir, file), 'utf-8');
      const chunks = chunker.chunk(content);

      // Generate embeddings for each chunk
      const chunkContents = chunks.map(chunk => chunk.content);
      const embeddingsArr = await this.rag['embeddingsService'].generateBatchEmbeddings(chunkContents);

      const vectors = chunks.map((chunk, i) => ({
        id: `${file}-chunk-${i}`,
        values: embeddingsArr[i],
        metadata: {
          text: chunk.content,
          source: file,
          title: file.replace('.md', ''),
        },
      }));

      // Upsert to vector database
      await this.rag['vectorStoreService'].upsert(vectors);
    }
  }

  // Answer a question
  async ask(question: string): Promise<{
    answer: string;
    sources: string[];
    tokensUsed: number;
  }> {
    // Retrieve relevant context
    const context = await this.rag.retrieve(question, {
      topK: 5,
      minScore: 0.7,
    });

    // Format context
    const formattedContext = this.rag.formatContext(context);

    // Generate response
    const response = await this.llm.complete(
      [{ role: 'user', content: question }],
      formattedContext
    );

    // Extract sources
    const sources = this.rag.getSources(context).map(s => s.source);

    return {
      answer: response.message,
      sources,
      tokensUsed: response.usage?.total_tokens ?? 0,
    };
  }

  // Stream an answer
  async *askStream(question: string) {
    const context = await this.rag.retrieve(question);
    const formattedContext = this.rag.formatContext(context);

    const messages = [{ role: 'user' as const, content: question }];

    for await (const chunk of this.llm.stream(messages, formattedContext)) {
      yield chunk;
    }
  }
}

// Usage
const chatbot = new RAGChatbot(
  process.env.OPENAI_API_KEY!,
  process.env.PINECONE_API_KEY!,
  'openlibx402-docs'
);

// Index documentation
await chatbot.indexDocuments('./docs');

// Ask questions
const result = await chatbot.ask('How do I install OpenLibx402?');
console.log(result.answer);
console.log('Sources:', result.sources);
```

## Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=pcsk_...

# Optional
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
PINECONE_INDEX_NAME=my-index
```

## Best Practices

### 1. Chunk Size Optimization

```typescript
// For technical documentation: smaller chunks
const chunker = new DocumentChunker({
  maxChunkSize: 800,
  chunkOverlap: 150,
});

// For narrative content: larger chunks
const chunker = new DocumentChunker({
  maxChunkSize: 1500,
  chunkOverlap: 300,
});
```

### 2. Similarity Score Thresholds

```typescript
// High precision (fewer but more relevant results)
const context = await rag.retrieve(query, {
  topK: 3,
  minScore: 0.85,
});

// High recall (more results, potentially less relevant)
const context = await rag.retrieve(query, {
  topK: 10,
  minScore: 0.65,
});
```

### 3. Context Length Management

```typescript
// Limit context to avoid token limits
const formatLimitedContext = (results: any[], maxLength: number = 3000) => {
  const formatted = rag.formatContext(results);
  return formatted.length > maxLength
    ? formatted.substring(0, maxLength) + '...'
    : formatted;
};
```

### 4. Error Handling

```typescript
try {
  const response = await llm.complete(messages, context);
  return response.message;
} catch (error) {
  if (error.code === 'insufficient_quota') {
    // Handle quota exceeded
  } else if (error.code === 'context_length_exceeded') {
    // Reduce context length
  }
  throw error;
}
```

## Integration with X402 Protocol

The RAGBot package is designed to work seamlessly with X402 payment-protected APIs:

```typescript
import { X402AutoClient } from '@openlibx402/client';
import { RAGService, LLMService } from '@openlibx402/ragbot';

// Create X402 client with payment support
const client = new X402AutoClient(keypair);

// Fetch data from payment-protected API
async function answerWithPaidData(query: string) {
  // Retrieve from local vector database
  const context = await rag.retrieve(query);

  // Fetch additional data from paid API
  const paidData = await client.get('https://api.example.com/premium-data');

  // Combine contexts
  const combinedContext = rag.formatContext(context) + '\n\n' + paidData.data;

  // Generate response
  return await llm.complete(
    [{ role: 'user', content: query }],
    combinedContext
  );
}
```

## Related Documentation

- [RAG Chatbot Overview](../../chatbot/overview.md) - Complete chatbot implementation
- [Chatbot Architecture](../../chatbot/architecture.md) - System design details
- [Chatbot API Reference](../../chatbot/api.md) - REST API documentation
- [@openlibx402/client](openlibx402-client.md) - X402 HTTP client
- [@openlibx402/langchain](openlibx402-langchain.md) - LangChain integration

## License

MIT

/**
 * Document Indexing Script
 * Reads markdown docs and indexes them in Pinecone
 */

import { load } from 'dotenv';
import { Pinecone } from 'pinecone';
import OpenAI from 'openai';
import { walk } from 'https://deno.land/std@0.224.0/fs/walk.ts';
import { relative, join } from 'https://deno.land/std@0.224.0/path/mod.ts';

// Load environment variables from .env file
await load({ export: true });

// Configuration
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const PINECONE_API_KEY = Deno.env.get('PINECONE_API_KEY');
const PINECONE_INDEX_NAME = Deno.env.get('PINECONE_INDEX_NAME') || 'openlibx402-docs';
const DOCS_DIR = '../docs/docs'; // Relative to chatbot folder
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

if (!OPENAI_API_KEY || !PINECONE_API_KEY) {
  console.error('Error: Missing required environment variables');
  console.error('Please set OPENAI_API_KEY and PINECONE_API_KEY');
  Deno.exit(1);
}

// Initialize clients
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });

interface Chunk {
  text: string;
  metadata: {
    source: string;
    section?: string;
    startLine: number;
    endLine: number;
  };
}

/**
 * Extract section from markdown header
 */
function extractSection(text: string): string | undefined {
  const lines = text.split('\n');
  for (const line of lines) {
    const match = line.match(/^#{1,6}\s+(.+)$/);
    if (match) {
      return match[1].trim();
    }
  }
  return undefined;
}

/**
 * Chunk markdown content
 */
function chunkMarkdown(content: string, source: string): Chunk[] {
  const lines = content.split('\n');
  const chunks: Chunk[] = [];
  let currentChunk: string[] = [];
  let currentSize = 0;
  let startLine = 0;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track code blocks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }

    currentChunk.push(line);
    currentSize += line.length + 1;

    // Don't split in the middle of code blocks
    if (inCodeBlock) {
      continue;
    }

    // Check if chunk is large enough
    if (currentSize >= CHUNK_SIZE) {
      const text = currentChunk.join('\n').trim();
      if (text.length > 0) {
        chunks.push({
          text,
          metadata: {
            source,
            section: extractSection(text),
            startLine,
            endLine: i,
          },
        });
      }

      // Create overlap
      const overlapLines: string[] = [];
      let overlapSize = 0;
      for (let j = currentChunk.length - 1; j >= 0; j--) {
        const overlapLine = currentChunk[j];
        if (overlapSize + overlapLine.length > CHUNK_OVERLAP) break;
        overlapLines.unshift(overlapLine);
        overlapSize += overlapLine.length + 1;
      }

      currentChunk = overlapLines;
      currentSize = overlapSize;
      startLine = i - overlapLines.length + 1;
    }
  }

  // Add remaining chunk
  if (currentChunk.length > 0) {
    const text = currentChunk.join('\n').trim();
    if (text.length > 0) {
      chunks.push({
        text,
        metadata: {
          source,
          section: extractSection(text),
          startLine,
          endLine: lines.length - 1,
        },
      });
    }
  }

  return chunks;
}

/**
 * Generate embeddings for chunks
 */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  console.log(`Generating embeddings for ${texts.length} chunks...`);

  const batchSize = 100;
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
      dimensions: 1536,
    });

    embeddings.push(...response.data.map((d) => d.embedding));
    console.log(`  Processed ${Math.min(i + batchSize, texts.length)}/${texts.length}`);
  }

  return embeddings;
}

/**
 * Main indexing function
 */
async function indexDocuments() {
  console.log('Starting document indexing...\n');

  // Get absolute path to docs directory
  const docsPath = join(Deno.cwd(), DOCS_DIR);
  console.log(`Reading markdown files from: ${docsPath}\n`);

  // Collect all markdown files
  const markdownFiles: string[] = [];
  for await (const entry of walk(docsPath, { exts: ['.md'] })) {
    if (entry.isFile) {
      markdownFiles.push(entry.path);
    }
  }

  console.log(`Found ${markdownFiles.length} markdown files\n`);

  // Process all files and create chunks
  const allChunks: Array<Chunk & { id: string }> = [];
  let chunkId = 0;

  for (const filePath of markdownFiles) {
    const content = await Deno.readTextFile(filePath);
    const relativePath = relative(docsPath, filePath);

    console.log(`Processing: ${relativePath}`);
    const chunks = chunkMarkdown(content, relativePath);
    console.log(`  Created ${chunks.length} chunks`);

    for (const chunk of chunks) {
      allChunks.push({
        ...chunk,
        id: `doc-${chunkId++}`,
      });
    }
  }

  console.log(`\nTotal chunks: ${allChunks.length}\n`);

  // Generate embeddings
  const embeddings = await generateEmbeddings(allChunks.map((c) => c.text));

  // Prepare vectors for Pinecone
  const vectors = allChunks.map((chunk, idx) => ({
    id: chunk.id,
    values: embeddings[idx],
    metadata: {
      text: chunk.text,
      source: chunk.metadata.source,
      section: chunk.metadata.section,
      startLine: chunk.metadata.startLine,
      endLine: chunk.metadata.endLine,
    },
  }));

  // Upsert to Pinecone
  console.log('\nUpserting vectors to Pinecone...');
  const index = pinecone.index(PINECONE_INDEX_NAME);

  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.upsert(batch);
    console.log(`  Uploaded ${Math.min(i + batchSize, vectors.length)}/${vectors.length}`);
  }

  console.log('\nIndexing complete! ✓');

  // Show stats
  const stats = await index.describeIndexStats();
  console.log(`\nIndex stats:`);
  console.log(`  Total vectors: ${stats.totalRecordCount}`);
  console.log(`  Dimensions: ${stats.dimension}`);
}

// Run the indexing
if (import.meta.main) {
  try {
    await indexDocuments();
  } catch (error) {
    console.error('Error during indexing:', error);
    Deno.exit(1);
  }
}

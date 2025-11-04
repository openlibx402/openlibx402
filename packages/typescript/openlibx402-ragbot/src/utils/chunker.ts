/**
 * Document Chunking Utilities
 * Intelligently split markdown documents while preserving structure
 */

export interface Chunk {
  text: string;
  metadata: {
    startLine: number;
    endLine: number;
    section?: string;
  };
}

export interface ChunkingOptions {
  maxChunkSize: number;
  chunkOverlap: number;
  preserveCodeBlocks: boolean;
}

export class DocumentChunker {
  private options: ChunkingOptions;

  constructor(options?: Partial<ChunkingOptions>) {
    this.options = {
      maxChunkSize: options?.maxChunkSize || 1000,
      chunkOverlap: options?.chunkOverlap || 200,
      preserveCodeBlocks: options?.preserveCodeBlocks ?? true,
    };
  }

  /**
   * Split text into chunks
   */
  chunk(text: string, metadata?: { source?: string }): Chunk[] {
    const lines = text.split('\n');
    const chunks: Chunk[] = [];
    let currentChunk: string[] = [];
    let currentSize = 0;
    let startLine = 0;
    let currentSection: string | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect section headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        currentSection = headerMatch[2].trim();
      }

      // Check if we're in a code block
      const isCodeBlockStart = line.trim().startsWith('```');

      if (isCodeBlockStart && this.options.preserveCodeBlocks) {
        // If we have content, save it first
        if (currentChunk.length > 0) {
          chunks.push({
            text: currentChunk.join('\n'),
            metadata: {
              startLine,
              endLine: i - 1,
              section: currentSection,
            },
          });
          currentChunk = [];
          currentSize = 0;
        }

        // Find the end of code block
        const codeBlockLines = [line];
        let j = i + 1;
        while (j < lines.length) {
          codeBlockLines.push(lines[j]);
          if (lines[j].trim().startsWith('```')) {
            break;
          }
          j++;
        }

        // Add code block as a single chunk
        chunks.push({
          text: codeBlockLines.join('\n'),
          metadata: {
            startLine: i,
            endLine: j,
            section: currentSection,
          },
        });

        i = j; // Skip past code block
        startLine = j + 1;
        continue;
      }

      // Add line to current chunk
      currentChunk.push(line);
      currentSize += line.length + 1; // +1 for newline

      // Check if chunk is full
      if (currentSize >= this.options.maxChunkSize) {
        chunks.push({
          text: currentChunk.join('\n'),
          metadata: {
            startLine,
            endLine: i,
            section: currentSection,
          },
        });

        // Create overlap
        const overlapLines = this.getOverlapLines(
          currentChunk,
          this.options.chunkOverlap
        );
        currentChunk = overlapLines;
        currentSize = overlapLines.reduce((sum, l) => sum + l.length + 1, 0);
        startLine = i - overlapLines.length + 1;
      }
    }

    // Add remaining chunk
    if (currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.join('\n'),
        metadata: {
          startLine,
          endLine: lines.length - 1,
          section: currentSection,
        },
      });
    }

    return chunks;
  }

  /**
   * Get lines for overlap
   */
  private getOverlapLines(lines: string[], overlapSize: number): string[] {
    const overlap: string[] = [];
    let size = 0;

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (size + line.length + 1 > overlapSize) {
        break;
      }
      overlap.unshift(line);
      size += line.length + 1;
    }

    return overlap;
  }

  /**
   * Chunk by sections (based on markdown headers)
   */
  chunkBySection(text: string): Array<{ section: string; content: string }> {
    const lines = text.split('\n');
    const sections: Array<{ section: string; content: string }> = [];
    let currentSection = 'Introduction';
    let currentContent: string[] = [];

    for (const line of lines) {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headerMatch) {
        // Save previous section
        if (currentContent.length > 0) {
          sections.push({
            section: currentSection,
            content: currentContent.join('\n').trim(),
          });
        }

        // Start new section
        currentSection = headerMatch[2].trim();
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentContent.length > 0) {
      sections.push({
        section: currentSection,
        content: currentContent.join('\n').trim(),
      });
    }

    return sections;
  }
}

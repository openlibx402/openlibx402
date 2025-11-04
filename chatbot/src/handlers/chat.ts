/**
 * Chat Handler
 * Handles chat requests with RAG and streaming responses
 */

import type { Context } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { RAGService } from '../services/rag.ts';
import type { LLMService } from '../services/llm.ts';
import type { RateLimiter } from '../middleware/rateLimit.ts';
import type { ChatMessage } from '../services/llm.ts';
import { logger } from '../utils/logger.ts';

interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
}

/**
 * Handle chat requests with streaming response
 */
export async function handleChat(
  c: Context,
  ragService: RAGService,
  llmService: LLMService,
  rateLimiter: RateLimiter
) {
  try {
    // Parse request body
    const body: ChatRequest = await c.req.json();
    const { message, conversationHistory = [] } = body;

    if (!message || message.trim().length === 0) {
      return c.json({ error: 'Message is required' }, 400);
    }

    logger.info('Chat request received', { message: message.substring(0, 100) });

    // Retrieve relevant documentation
    logger.info('Retrieving relevant documentation...');
    const ragContext = await ragService.retrieve(message);
    const sources = ragService.getSources(ragContext);

    logger.info(`Found ${sources.length} relevant sources`);

    // Increment usage after successful retrieval
    const userId = c.get('userId') || 'unknown';
    await rateLimiter.incrementUsage(userId);

    // Stream the response using SSE
    return streamSSE(c, async (stream) => {
      try {
        // Send sources first
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'sources',
            sources,
          }),
          event: 'sources',
        });

        // Stream the LLM response
        let fullResponse = '';
        for await (const chunk of llmService.stream(
          message,
          conversationHistory,
          ragContext.formattedContext
        )) {
          fullResponse += chunk;
          await stream.writeSSE({
            data: chunk,
            event: 'message',
          });
        }

        // Send completion event
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'done',
            message: fullResponse,
          }),
          event: 'done',
        });

        logger.info('Chat response completed');
      } catch (error) {
        logger.error('Error during streaming', error);
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'error',
            error: 'An error occurred while generating the response',
          }),
          event: 'error',
        });
      }
    });
  } catch (error) {
    logger.error('Chat handler error', error);
    return c.json(
      {
        error: 'Failed to process chat request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
}

/**
 * Handle non-streaming chat (fallback)
 */
export async function handleChatNoStream(
  c: Context,
  ragService: RAGService,
  llmService: LLMService,
  rateLimiter: RateLimiter
) {
  try {
    const body: ChatRequest = await c.req.json();
    const { message, conversationHistory = [] } = body;

    if (!message || message.trim().length === 0) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Retrieve relevant documentation
    const ragContext = await ragService.retrieve(message);
    const sources = ragService.getSources(ragContext);

    // Increment usage
    const userId = c.get('userId') || 'unknown';
    await rateLimiter.incrementUsage(userId);

    // Collect full response
    let fullResponse = '';
    for await (const chunk of llmService.stream(
      message,
      conversationHistory,
      ragContext.formattedContext
    )) {
      fullResponse += chunk;
    }

    return c.json({
      message: fullResponse,
      sources,
    });
  } catch (error) {
    logger.error('Chat handler error', error);
    return c.json(
      {
        error: 'Failed to process chat request',
      },
      500
    );
  }
}

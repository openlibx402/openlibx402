/**
 * LLM Service
 * Handles interactions with OpenAI for chat completions
 */

import OpenAI from 'openai';
import type { ChatMessage, OpenAIConfig } from '../types/index';

export class LLMService {
  private client: OpenAI;
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.config = config;
  }

  /**
   * Generate system prompt for RAG chatbot
   */
  private getSystemPrompt(): string {
    return `You are a helpful documentation assistant for OpenLibx402, a library for implementing HTTP 402 "Payment Required" protocol with AI agents.

Your role is to:
1. Answer questions based ONLY on the provided documentation context
2. Be concise and accurate
3. Cite sources when possible by referencing the document sections
4. If the answer is not in the provided context, clearly state that
5. Guide users to relevant documentation sections
6. Be friendly and professional

Important:
- Do NOT make up information not in the documentation
- Do NOT provide code examples unless they are in the documentation
- If unsure, ask for clarification or suggest searching specific topics`;
  }

  /**
   * Create chat completion (non-streaming)
   */
  async complete(
    messages: ChatMessage[],
    context?: string
  ): Promise<{
    message: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }> {
    const systemMessage: ChatMessage = {
      role: 'system',
      content: this.getSystemPrompt(),
    };

    const contextMessage: ChatMessage | undefined = context
      ? {
          role: 'system',
          content: `Documentation Context:\n\n${context}`,
        }
      : undefined;

    const allMessages = [
      systemMessage,
      ...(contextMessage ? [contextMessage] : []),
      ...messages,
    ];

    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: allMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: this.config.temperature || 0.7,
      max_tokens: this.config.maxTokens || 1000,
    });

    const choice = response.choices[0];
    if (!choice.message.content) {
      throw new Error('No response from LLM');
    }

    return {
      message: choice.message.content,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  }

  /**
   * Create streaming chat completion
   */
  async *stream(
    messages: ChatMessage[],
    context?: string
  ): AsyncGenerator<string, void, unknown> {
    const systemMessage: ChatMessage = {
      role: 'system',
      content: this.getSystemPrompt(),
    };

    const contextMessage: ChatMessage | undefined = context
      ? {
          role: 'system',
          content: `Documentation Context:\n\n${context}`,
        }
      : undefined;

    const allMessages = [
      systemMessage,
      ...(contextMessage ? [contextMessage] : []),
      ...messages,
    ];

    const stream = await this.client.chat.completions.create({
      model: this.config.model,
      messages: allMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: this.config.temperature || 0.7,
      max_tokens: this.config.maxTokens || 1000,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}

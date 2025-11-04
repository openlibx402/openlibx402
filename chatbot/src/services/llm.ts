/**
 * LLM Service for chatbot
 * Handles OpenAI chat completions with streaming
 */

import OpenAI from 'openai';
import type { Config } from '../utils/config.ts';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class LLMService {
  private client: OpenAI;
  private model: string;

  constructor(config: Config) {
    this.client = new OpenAI({ apiKey: config.openai.apiKey });
    this.model = config.openai.model;
  }

  /**
   * System prompt for the documentation chatbot
   */
  private getSystemPrompt(): string {
    return `You are a helpful documentation assistant for OpenLibx402, a library that implements the HTTP 402 "Payment Required" protocol to enable AI agents to autonomously pay for API access using Solana blockchain.

Your role:
- Answer questions based ONLY on the provided documentation context
- Be concise, accurate, and helpful
- Cite sources by mentioning the document sections when relevant
- If information is not in the context, clearly state that
- Guide users to relevant documentation sections
- Provide code examples ONLY if they appear in the documentation

Important guidelines:
- Never make up information not present in the documentation
- Never provide code examples unless they're from the docs
- If unsure, ask for clarification or suggest specific topics to search
- Be friendly and professional

OpenLibx402 supports:
- Multiple languages: Python, TypeScript, Go, Rust
- Frameworks: FastAPI, Express, Next.js, and more
- LangChain and LangGraph integrations
- Solana blockchain payments with USDC`;
  }

  /**
   * Stream chat completion
   */
  async *stream(
    userMessage: string,
    conversationHistory: ChatMessage[],
    context: string
  ): AsyncGenerator<string, void, unknown> {
    const messages: ChatMessage[] = [
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'system', content: `Documentation Context:\n\n${context}` },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.7,
      max_tokens: 1000,
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

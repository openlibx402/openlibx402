# @openlibx402/langchain

LangChain.js integration for X402 payment protocol.

## Installation

```bash
npm install @openlibx402/langchain
```

## Features

- LangChain tools for X402 payments
- AI agent payment handling
- Automatic payment workflows
- TypeScript support

## Usage

```typescript
import { X402PaymentTool } from '@openlibx402/langchain';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { initializeAgent } from 'langchain/agents';

const paymentTool = new X402PaymentTool({
  wallet: keypair,
  maxPayment: '5.0'
});

const agent = await initializeAgent({
  tools: [paymentTool],
  llm: new ChatOpenAI()
});

const response = await agent.call({ input: 'Get premium data from API' });
```

## License

MIT
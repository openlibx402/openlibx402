# @openlibx402/langchain

LangChain.js integration for the X402 payment protocol, enabling AI agents to autonomously access paid resources.

## Overview

This package provides LangChain tools that allow AI agents to make HTTP requests to X402-protected resources with automatic payment handling. Built on top of `@openlibx402/client`, it seamlessly integrates blockchain payments into LangChain workflows.

## Features

- **X402PaymentTool**: LangChain tool for fetching paid resources
- **Automatic Payment**: AI agents handle payments autonomously
- **Schema Validation**: Built-in Zod schema validation for inputs
- **Solana Integration**: Native support for Solana wallet payments
- **Agent-Ready**: Designed specifically for autonomous AI agent workflows

## Installation

```bash
npm install @openlibx402/langchain
# or
pnpm add @openlibx402/langchain
# or
yarn add @openlibx402/langchain
```

## Usage

### Basic Tool Setup

```typescript
import { createX402PaymentTool } from '@openlibx402/langchain';
import { Keypair } from '@solana/web3.js';

// Load your AI agent's wallet
const walletKeypair = Keypair.fromSecretKey(secretKeyBytes);

// Create the X402 payment tool
const paymentTool = createX402PaymentTool({
  walletKeypair,
  rpcUrl: 'https://api.devnet.solana.com',
  maxPaymentAmount: '10000000' // Optional safety limit
});

// Use with LangChain agent
const tools = [paymentTool, /* other tools */];
```

### Using with LangChain Agent

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { pull } from 'langchain/hub';
import { createX402PaymentTool } from '@openlibx402/langchain';
import { Keypair } from '@solana/web3.js';

// Setup
const walletKeypair = Keypair.fromSecretKey(secretKeyBytes);
const model = new ChatOpenAI({ temperature: 0 });
const prompt = await pull('hwchase17/openai-functions-agent');

// Create tool
const x402Tool = createX402PaymentTool({
  walletKeypair,
  rpcUrl: 'https://api.devnet.solana.com',
  maxPaymentAmount: '10000000'
});

// Create agent
const agent = await createOpenAIFunctionsAgent({
  llm: model,
  tools: [x402Tool],
  prompt
});

const agentExecutor = new AgentExecutor({
  agent,
  tools: [x402Tool]
});

// Agent can now autonomously fetch paid resources
const result = await agentExecutor.invoke({
  input: 'Fetch the premium data from https://api.example.com/premium-data'
});

console.log(result.output);
```

### Custom Tool Configuration

```typescript
import { X402PaymentTool } from '@openlibx402/langchain';
import { Keypair } from '@solana/web3.js';

const walletKeypair = Keypair.fromSecretKey(secretKeyBytes);

const tool = new X402PaymentTool({
  walletKeypair,
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  maxRetries: 2,
  autoRetry: true,
  maxPaymentAmount: '5000000'
});

// Use directly
const result = await tool._call(JSON.stringify({
  url: 'https://api.example.com/data',
  method: 'GET'
}));

console.log(result);
```

### POST Requests with Data

```typescript
// Agent can make POST requests with payment
const result = await agentExecutor.invoke({
  input: `
    Make a POST request to https://api.example.com/process with the following data:
    {
      "input": "some data to process"
    }
  `
});
```

### Tool Input Schema

The X402PaymentTool accepts inputs with the following schema:

```typescript
{
  url: string;          // Required: URL to fetch
  method?: string;      // Optional: HTTP method (default: 'GET')
  body?: object;        // Optional: Request body for POST/PUT
  headers?: object;     // Optional: Additional headers
}
```

### Safety Features

```typescript
import { createX402PaymentTool } from '@openlibx402/langchain';

const tool = createX402PaymentTool({
  walletKeypair,
  rpcUrl: 'https://api.devnet.solana.com',
  maxPaymentAmount: '10000000', // Maximum amount agent can spend per request
  maxRetries: 1,                 // Limit retry attempts
  autoRetry: true               // Enable automatic payment retry
});
```

## API Reference

### Functions

#### `createX402PaymentTool(options: X402PaymentToolOptions)`

Factory function to create an X402PaymentTool instance.

Options:
```typescript
{
  walletKeypair: Keypair;       // Solana wallet keypair
  rpcUrl?: string;               // Solana RPC URL
  maxRetries?: number;           // Max retry attempts (default: 1)
  autoRetry?: boolean;           // Enable auto-retry (default: true)
  maxPaymentAmount?: string;     // Maximum payment amount per request
}
```

### Classes

#### `X402PaymentTool`

LangChain tool class for making X402 payments.

Constructor:
```typescript
constructor(options: X402PaymentToolOptions)
```

Methods:
- `_call(input: string)` - Execute tool with JSON input string
- Tool is automatically cleaned up when agent completes

### Re-exports

- `X402AutoClient` - Re-exported from `@openlibx402/client` for convenience

## Example: Multi-Tool Agent

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { Calculator } from 'langchain/tools/calculator';
import { createX402PaymentTool } from '@openlibx402/langchain';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';

const walletKeypair = Keypair.fromSecretKey(secretKeyBytes);

// Create multiple tools including X402
const tools = [
  createX402PaymentTool({
    walletKeypair,
    rpcUrl: 'https://api.devnet.solana.com'
  }),
  new Calculator()
];

const agent = await createOpenAIFunctionsAgent({
  llm: new ChatOpenAI({ temperature: 0 }),
  tools,
  prompt: await pull('hwchase17/openai-functions-agent')
});

const executor = new AgentExecutor({ agent, tools });

// Agent can now use both calculation and paid API access
const result = await executor.invoke({
  input: 'Fetch premium data and calculate the average of the values'
});
```

## Documentation

For complete API documentation and guides, visit [openlibx402.github.io](https://openlibx402.github.io/docs/packages/typescript/openlibx402-langchain/)

## Testing

```bash
pnpm test
```

## Contributing

See [CONTRIBUTING.md](https://github.com/openlibx402/openlibx402/blob/main/CONTRIBUTING.md)

## License

MIT - See [LICENSE](https://github.com/openlibx402/openlibx402/blob/main/LICENSE)

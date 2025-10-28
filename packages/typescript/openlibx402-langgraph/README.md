# @openlibx402/langgraph

LangGraph.js integration for the X402 payment protocol, enabling complex AI agent workflows with autonomous payment capabilities.

## Overview

This package provides LangGraph nodes and utilities for building stateful AI agent workflows that can autonomously handle X402 payments. It includes pre-built nodes for payment handling, conditional routing based on payment status, and seamless integration with LangGraph state machines.

## Features

- **Payment Nodes**: Pre-built nodes for payment processing and resource fetching
- **Conditional Routing**: Built-in functions for payment-based workflow routing
- **State Management**: Full integration with LangGraph's state management
- **Automatic Payment**: Nodes automatically handle payment when encountering 402 responses
- **Workflow Composition**: Easily compose complex payment workflows

## Installation

```bash
npm install @openlibx402/langgraph
# or
pnpm add @openlibx402/langgraph
# or
yarn add @openlibx402/langgraph
```

## Usage

### Basic Payment Workflow

```typescript
import { StateGraph } from '@langchain/langgraph';
import {
  paymentNode,
  fetchWithPaymentNode,
  checkPaymentRequired,
  checkPaymentCompleted,
  PaymentState
} from '@openlibx402/langgraph';
import { Keypair } from '@solana/web3.js';

// Define your graph state
interface AgentState extends PaymentState {
  url: string;
  data?: any;
  error?: string;
}

// Load wallet
const walletKeypair = Keypair.fromSecretKey(secretKeyBytes);

// Create workflow
const workflow = new StateGraph<AgentState>({
  channels: {
    url: null,
    data: null,
    error: null,
    paymentRequired: null,
    paymentRequest: null,
    paymentCompleted: null
  }
});

// Add nodes
workflow.addNode('fetch', fetchWithPaymentNode(walletKeypair));
workflow.addNode('process', processDataNode);

// Add edges with conditions
workflow.addEdge('__start__', 'fetch');
workflow.addConditionalEdges(
  'fetch',
  checkPaymentCompleted,
  {
    completed: 'process',
    failed: '__end__'
  }
);
workflow.addEdge('process', '__end__');

// Compile and run
const app = workflow.compile();
const result = await app.invoke({
  url: 'https://api.example.com/premium-data'
});

console.log(result.data);
```

### Manual Payment Flow

```typescript
import {
  StateGraph,
  END
} from '@langchain/langgraph';
import {
  paymentNode,
  checkPaymentRequired,
  PaymentState
} from '@openlibx402/langgraph';
import { Keypair } from '@solana/web3.js';

interface AgentState extends PaymentState {
  url: string;
  response?: any;
}

const walletKeypair = Keypair.fromSecretKey(secretKeyBytes);

const workflow = new StateGraph<AgentState>({
  channels: {
    url: null,
    response: null,
    paymentRequired: null,
    paymentRequest: null,
    paymentCompleted: null
  }
});

// Custom fetch node
async function fetchNode(state: AgentState) {
  const response = await fetch(state.url);

  if (response.status === 402) {
    const paymentRequest = await response.json();
    return {
      paymentRequired: true,
      paymentRequest
    };
  }

  return {
    response: await response.json(),
    paymentRequired: false
  };
}

// Add nodes
workflow.addNode('fetch', fetchNode);
workflow.addNode('pay', paymentNode(walletKeypair));
workflow.addNode('retry', fetchNode);

// Add routing
workflow.addEdge('__start__', 'fetch');
workflow.addConditionalEdges(
  'fetch',
  checkPaymentRequired,
  {
    required: 'pay',
    not_required: END
  }
);
workflow.addEdge('pay', 'retry');
workflow.addEdge('retry', END);

const app = workflow.compile();
const result = await app.invoke({
  url: 'https://api.example.com/data'
});
```

### Multi-Step Workflow with Payments

```typescript
import { StateGraph } from '@langchain/langgraph';
import {
  fetchWithPaymentNode,
  checkPaymentCompleted,
  PaymentState
} from '@openlibx402/langgraph';
import { Keypair } from '@solana/web3.js';

interface MultiStepState extends PaymentState {
  step: number;
  urls: string[];
  results: any[];
}

const walletKeypair = Keypair.fromSecretKey(secretKeyBytes);

const workflow = new StateGraph<MultiStepState>({
  channels: {
    step: null,
    urls: null,
    results: null,
    paymentRequired: null,
    paymentRequest: null,
    paymentCompleted: null
  }
});

// Fetch current URL
async function fetchCurrentUrl(state: MultiStepState) {
  const currentUrl = state.urls[state.step];
  const client = new X402AutoClient(walletKeypair);

  try {
    const response = await client.fetch(currentUrl);
    return {
      results: [...state.results, response.data],
      paymentCompleted: true
    };
  } catch (error) {
    return {
      paymentCompleted: false,
      error: error.message
    };
  } finally {
    await client.close();
  }
}

// Check if more URLs to process
function shouldContinue(state: MultiStepState) {
  return state.step < state.urls.length - 1 ? 'next' : 'done';
}

// Increment step
function nextStep(state: MultiStepState) {
  return { step: state.step + 1 };
}

workflow.addNode('fetch', fetchCurrentUrl);
workflow.addNode('next', nextStep);

workflow.addEdge('__start__', 'fetch');
workflow.addConditionalEdges('fetch', shouldContinue, {
  next: 'next',
  done: '__end__'
});
workflow.addEdge('next', 'fetch');

const app = workflow.compile();
const result = await app.invoke({
  step: 0,
  urls: [
    'https://api.example.com/data1',
    'https://api.example.com/data2',
    'https://api.example.com/data3'
  ],
  results: []
});

console.log(result.results); // All fetched data
```

## API Reference

### State Interface

#### `PaymentState`

Base state interface for payment workflows:

```typescript
interface PaymentState {
  paymentRequired?: boolean;
  paymentRequest?: any;
  paymentCompleted?: boolean;
  error?: string;
}
```

### Nodes

#### `paymentNode(walletKeypair: Keypair, rpcUrl?: string)`

Node that processes a payment based on `paymentRequest` in state.

Returns updated state with `paymentCompleted` status.

#### `fetchWithPaymentNode(walletKeypair: Keypair, rpcUrl?: string, options?)`

Node that fetches a URL from state and automatically handles payments.

Expects state to have a `url` field.

Options:
```typescript
{
  maxRetries?: number;
  autoRetry?: boolean;
  maxPaymentAmount?: string;
}
```

### Conditional Functions

#### `checkPaymentRequired(state: PaymentState)`

Returns routing key based on payment requirement status:
- `'required'` if payment is required
- `'not_required'` if payment is not required

#### `checkPaymentCompleted(state: PaymentState)`

Returns routing key based on payment completion status:
- `'completed'` if payment completed successfully
- `'failed'` if payment failed or not completed

### Re-exports

- `X402AutoClient` - Re-exported from `@openlibx402/client` for convenience

## Advanced Examples

### Error Handling

```typescript
import { StateGraph } from '@langchain/langgraph';
import { fetchWithPaymentNode, PaymentState } from '@openlibx402/langgraph';

interface ErrorHandlingState extends PaymentState {
  url: string;
  retryCount: number;
  maxRetries: number;
}

function checkRetry(state: ErrorHandlingState) {
  if (state.paymentCompleted) {
    return 'success';
  }

  if (state.retryCount < state.maxRetries) {
    return 'retry';
  }

  return 'failed';
}

const workflow = new StateGraph<ErrorHandlingState>({...});
workflow.addNode('fetch', fetchWithPaymentNode(walletKeypair));
workflow.addNode('incrementRetry', (state) => ({
  retryCount: state.retryCount + 1
}));

workflow.addConditionalEdges('fetch', checkRetry, {
  success: '__end__',
  retry: 'incrementRetry',
  failed: '__end__'
});
workflow.addEdge('incrementRetry', 'fetch');
```

## Documentation

For complete API documentation and guides, visit [openlibx402.github.io](https://openlibx402.github.io/docs/packages/typescript/openlibx402-langgraph/)

## Testing

```bash
pnpm test
```

## Contributing

See [CONTRIBUTING.md](https://github.com/openlibx402/openlibx402/blob/main/CONTRIBUTING.md)

## License

MIT - See [LICENSE](https://github.com/openlibx402/openlibx402/blob/main/LICENSE)

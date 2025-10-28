# @openlibx402/langgraph

LangGraph.js integration for X402 payment protocol.

## Installation

```bash
npm install @openlibx402/langgraph
```

## Features

- LangGraph nodes for payments
- Workflow integration
- AI agent payment workflows
- TypeScript support

## Usage

```typescript
import { paymentNode } from '@openlibx402/langgraph';
import { StateGraph } from '@langchain/langgraph';

const workflow = new StateGraph();

workflow.addNode('pay', paymentNode);
workflow.addNode('fetch', fetchNode);

workflow.addEdge('pay', 'fetch');

const app = workflow.compile();
```

## License

MIT
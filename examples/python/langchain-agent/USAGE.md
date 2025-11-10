# Usage Guide

## Running with Different Verbosity Levels

### Minimal Output (Default)
```bash
python main.py
```

**Output Example:**
```
# Usage Guide

## Running with Different Verbosity Levels

### Minimal Output (Default)
```bash
python main.py
```

**Features in Simple Mode:**
- Clean, concise output
- Shows X402 payment activity (💳) when payments occur
- Shows data preview (📊) when API data is received
- Final results only
- No decorative separators
- No interactive pauses

**Output Example:**
```text
🚀 OpenLibx402 LangChain Agent Examples
   (Run with -v or --verbose for detailed output)

[Example 1: Simple X402 Agent]
✅ New wallet created: wallet.json
Running agent...
  💳 Making X402 payment to access: http://localhost:8000/premium-data
  📊 Received data: {"status":"success","data":{"market_price":42.50,"currency":"USD","timestamp":"2025-...
✅ Agent response: The market price is $42.50

[Example 2: Agent with Custom Tools]
Running agent...
  💳 Making X402 payment to access: http://localhost:8000/premium-data
  📊 Received data: {"status":"success","data":{"market_price":42.50,"currency":"USD","timestamp":"2025-...
✅ Agent response: [response content]

[Example 3: Multi-API Agent]
Running agent...
  💳 Making X402 payment to access: http://localhost:8000/premium-data
  � Received data: {"status":"success","data":{"market_price":42.50,"currency":"USD","timestamp":"2025-...
  �💳 Making X402 payment to access: http://localhost:8000/tiered-data/prem...
  📊 Received data: {"tier":"premium","data":{"value":98.75},"features":["real-time","analytics"],"acc...
✅ Agent response: [comparison results]

✅ All examples completed!
```

### Verbose Output
```bash
python main.py -v
# or
python main.py --verbose
```

**Features in Verbose Mode:**
- Full decorative output with separators
- Wallet addresses displayed
- Debug information from agents
- Detailed X402 payment flow
- Interactive pauses between examples
- Comprehensive error messages with hints

**Output Example:**
```
======================================================================
🚀 OpenLibx402 LangChain Agent Examples
======================================================================

These examples demonstrate how AI agents can autonomously
pay for API access using the X402 protocol.

⚠️  Prerequisites:
   1. FastAPI server running (see fastapi-server example)
   2. Wallet funded with SOL and USDC on Solana devnet
   3. OpenAI API key set in environment (OPENAI_API_KEY)
======================================================================

============================================================
📝 Example 1: Simple X402 Agent
============================================================
✅ Wallet loaded from wallet.json
📍 Wallet address: [address]

🤖 Running agent with autonomous payment capability...
   Asking: 'Get the premium data from http://localhost:8000/premium-data'
   
✅ Agent response: [detailed response]

Press Enter to continue to Example 2...

============================================================
📝 Example 2: Agent with Custom Tools
============================================================
✅ Wallet loaded from wallet.json
📍 Wallet address: [address]

🤖 Running agent with custom tools...
✅ Agent response: [detailed response]

Press Enter to continue to Example 3...

============================================================
📝 Example 3: Multi-API Agent
============================================================
✅ Wallet loaded from wallet.json
📍 Wallet address: [address]

🤖 Running agent with multi-API access...
✅ Agent response: [detailed response]

======================================================================
✅ Examples completed!
======================================================================
```

### Get Help
```bash
python main.py --help
```

## Changes Made

1. **Added CLI argument parsing** with `argparse`
   - `-v` or `--verbose` flag for detailed output
   - Help text with usage examples

2. **Default mode**: Minimal, clean output for production use
   - Simple section headers `[Example N: Name]`
   - Removed decorative separators in normal mode
   - Hidden wallet addresses unless verbose
   - No interactive pauses between examples

3. **X402 Payment Visibility** (NEW!)
   - **In simple mode**: 
     - Shows `💳 Making X402 payment to access: <URL>` for each payment
     - Shows `📊 Received data: <preview>` when API data is received (first 100 chars)
   - **In verbose mode**: Full debug output from X402 client
   - Users always know when payments are happening and what data is received
   - Long URLs and responses automatically truncated for readability

4. **Verbose mode** preserves original behavior:
   - Full decorative elements
   - Wallet addresses displayed
   - Interactive pauses between examples
   - Debug mode enabled for agents
   - Detailed error messages with hints

5. **Smart conditionals**:
   - `debug=VERBOSE` passed to agent creation
   - Payment activity monitoring via tool call inspection
   - Error hints only shown in verbose mode

## Key Benefits

- **Transparency**: Users always know when payments are being made
- **Progress visibility**: See data as it's received from APIs in real-time
- **Clean output**: Minimal clutter in production mode with smart previews
- **No surprises**: Payment and data activity visible without verbose API dumps
- **Context**: See both the URL being accessed and a preview of the data received
- **Debugging**: Full details still available with `-v` flag
- **No blind spots**: Payment activity and data preview visible in both modes, just with different detail levels
```

### Verbose Output
```bash
python main.py -v
# or
python main.py --verbose
```

**Output Example:**
```
======================================================================
🚀 OpenLibx402 LangChain Agent Examples
======================================================================

These examples demonstrate how AI agents can autonomously
pay for API access using the X402 protocol.

⚠️  Prerequisites:
   1. FastAPI server running (see fastapi-server example)
   2. Wallet funded with SOL and USDC on Solana devnet
   3. OpenAI API key set in environment (OPENAI_API_KEY)
======================================================================

============================================================
📝 Example 1: Simple X402 Agent
============================================================
✅ Wallet loaded from wallet.json
📍 Wallet address: [address]

🤖 Running agent with autonomous payment capability...
   Asking: 'Get the premium data from http://localhost:8000/premium-data'
   
✅ Agent response: [detailed response]

Press Enter to continue to Example 2...

============================================================
📝 Example 2: Agent with Custom Tools
============================================================
✅ Wallet loaded from wallet.json
📍 Wallet address: [address]

🤖 Running agent with custom tools...
✅ Agent response: [detailed response]

Press Enter to continue to Example 3...

============================================================
📝 Example 3: Multi-API Agent
============================================================
✅ Wallet loaded from wallet.json
📍 Wallet address: [address]

🤖 Running agent with multi-API access...
✅ Agent response: [detailed response]

======================================================================
✅ Examples completed!
======================================================================
```

### Get Help
```bash
python main.py --help
```

## Changes Made

1. **Added CLI argument parsing** with `argparse`
2. **Default mode**: Minimal, clean output for production use
3. **Verbose mode** (`-v` or `--verbose`): Full detailed output with:
   - Decorative separators
   - Wallet addresses
   - Debug information from agents
   - Interactive pauses between examples
   - Detailed error messages
4. **Debug flag**: Automatically passed to agent creation based on verbosity
5. **Conditional output**: All decorative elements and verbose messages only show in verbose mode

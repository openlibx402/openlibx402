# Testing the Chatbot UI

This guide will help you test the chatbot UI with the MkDocs documentation site.

## Prerequisites

✅ Deno installed
✅ API keys configured in `.env`
✅ Pinecone index created (`openlibx402-docs`)
✅ Documentation indexed (run `deno task index`)
✅ Python with mkdocs installed

## Step 1: Start the Chatbot Backend

In one terminal, start the chatbot server:

```bash
cd /Users/dgeek/Projects/x402-projects/openlibx402/chatbot
deno task dev
```

You should see:
```
[INFO] Configuration loaded
[INFO] Rate limiter initialized with Deno KV
[INFO] Services initialized
[INFO] Starting server on port 8000
```

The server is now running at `http://localhost:8000`

## Step 2: Start the MkDocs Server

In another terminal, start the MkDocs development server:

```bash
cd /Users/dgeek/Projects/x402-projects/openlibx402/docs
mkdocs serve
```

You should see:
```
INFO     -  Building documentation...
INFO     -  Documentation built in X.XX seconds
INFO     -  [HH:MM:SS] Watching paths for changes...
INFO     -  [HH:MM:SS] Serving on http://127.0.0.1:8000
```

## Step 3: Test the Chatbot

1. **Open your browser** and go to: `http://127.0.0.1:8000`

2. **Look for the chat button** in the bottom-right corner (a purple/blue gradient button with 💬 icon)

3. **Click the chat button** - the chat widget should slide up from the bottom

4. **Send a test message**:
   - Type: "What is OpenLibx402?"
   - Press Enter or click Send

5. **Watch for**:
   - Loading indicator ("Thinking...")
   - Streaming response appearing in real-time
   - Source citations below the response
   - Rate limit counter in the header

## Features to Test

### ✅ Basic Chat
- Send a message
- Receive streaming response
- See source citations
- Conversation history persists

### ✅ Rate Limiting
- Check rate limit display (should show "3 free queries remaining")
- Send 3 messages
- On the 4th message, should get a 402 error with payment info

### ✅ Conversation History
- Send multiple messages
- Refresh the page
- Click chat button - previous messages should still be there
- Click the 🗑️ button to clear history

### ✅ Sources
- Each response should show source files
- Sources should include:
  - File name (e.g., `index.md`)
  - Section (if available)
  - Relevance percentage

## Example Test Queries

Try these to test different aspects:

```
1. "What is OpenLibx402?"
   → Should return overview from index.md

2. "How do I use OpenLibx402 with FastAPI?"
   → Should cite FastAPI integration docs

3. "Show me LangChain examples"
   → Should cite LangChain example docs

4. "What languages are supported?"
   → Should mention Python, TypeScript, Go, Rust

5. "Explain the 402 payment protocol"
   → Should explain the HTTP 402 status code usage
```

## Troubleshooting

### Chat button doesn't appear
- Check browser console for errors
- Verify `main.html` is loading the scripts
- Check that `chatbot_api_url` is set in `mkdocs.yml`

### "Failed to fetch" error
- Ensure chatbot backend is running on port 8000
- Check CORS settings in backend `.env`
- Verify `ALLOWED_ORIGINS` includes `http://127.0.0.1:8000`

### No responses
- Check backend terminal for errors
- Verify Pinecone index is populated (run `deno task index`)
- Check API keys are valid

### Rate limit immediately reached
- Clear Deno KV: The rate limiter uses Deno KV
- Check your IP isn't being blocked

### Sources not showing
- Verify Pinecone query is returning results
- Check backend logs for errors
- Ensure metadata is included in vector records

## Widget Customization

### Change Colors

Edit `docs/overrides/assets/stylesheets/chatbot.css`:

```css
/* Change widget header color */
.chatbot-header {
  background: linear-gradient(135deg, #your-color-1, #your-color-2);
}

/* Change message bubble color */
.chatbot-message-user .chatbot-message-content {
  background: #your-color;
}
```

### Change Position

Edit `docs/overrides/assets/stylesheets/chatbot.css`:

```css
/* Move to left side */
.chatbot-fab {
  left: 24px;  /* instead of right: 24px */
}

.chatbot-widget {
  left: 24px;  /* instead of right: 24px */
}
```

### Change Initial Message

Edit `docs/overrides/assets/javascripts/chatbot.js` around line 270:

```javascript
addMessage('assistant', 'Your custom greeting message here!');
```

## Production Deployment

When ready to deploy:

1. **Deploy backend to Deno Deploy**:
   ```bash
   cd chatbot
   ./deploy.sh
   ```

2. **Update mkdocs.yml**:
   ```yaml
   extra:
     chatbot_api_url: https://your-project.deno.dev
   ```

3. **Deploy docs** (GitHub Pages, Netlify, etc.):
   ```bash
   mkdocs build
   # Deploy the site/ directory
   ```

## Success Checklist

- [ ] Chat button visible on all pages
- [ ] Can send messages and receive responses
- [ ] Responses stream in real-time
- [ ] Sources are displayed correctly
- [ ] Rate limit counter works
- [ ] Conversation history persists
- [ ] Clear history button works
- [ ] Widget styling matches your theme
- [ ] Works on mobile devices
- [ ] CORS configured correctly

## Need Help?

- Check [README.md](./README.md) for full documentation
- Check [API.md](./API.md) for API reference
- Check backend logs for errors
- Check browser console for frontend errors

Happy testing! 🎉

# Backend API Configuration

## Problem Fixed

The chatbot widget was hardcoded to use a placeholder domain (`https://your-deno-deploy-url.deno.dev`) instead of reading the actual backend API URL from the environment configuration. This caused all 404 errors when trying to reach `/api/status` and other endpoints.

## Root Cause

The MkDocs template (`docs/overrides/main.html`) was looking for the wrong configuration key:
- ❌ **Before**: `config.extra.chatbot_api_url` (doesn't exist)
- ✅ **After**: `config.extra.chatbot.api_url` (correctly nested under chatbot config)

## Solution

### 1. Updated MkDocs Template
**File**: `docs/overrides/main.html` (line 172)

Changed from:
```javascript
window.CHATBOT_API_URL = '{{ config.extra.chatbot_api_url or "https://your-deno-deploy-url.deno.dev" }}';
```

To:
```javascript
window.CHATBOT_API_URL = '{{ config.extra.chatbot.api_url or "http://localhost:3000" }}';
console.log('✅ Chatbot API URL configured:', window.CHATBOT_API_URL);
```

### 2. Updated MkDocs Configuration
**File**: `docs/mkdocs.yml` (line 141)

Changed from:
```yaml
api_url: http://localhost:3000
```

To:
```yaml
api_url: http://localhost:8000
```

Added documentation explaining how to configure for different environments.

## How It Works Now

The chatbot widget will automatically use the backend URL specified in `mkdocs.yml`:

```yaml
extra:
  chatbot:
    api_url: http://localhost:8000  # For local development with Deno
```

The MkDocs Jinja2 template renders this into the HTML:
```javascript
window.CHATBOT_API_URL = 'http://localhost:8000';
```

Which the chatbot widget then uses for all API calls:
```javascript
const API_URL = window.CHATBOT_API_URL || 'http://localhost:3000';
// Now correctly uses http://localhost:8000
```

## Configuration Guide

### Development (Local)

For running the backend locally with Deno on port 8000:
```yaml
# docs/mkdocs.yml
extra:
  chatbot:
    api_url: http://localhost:8000
```

For Node.js on port 3000:
```yaml
extra:
  chatbot:
    api_url: http://localhost:3000
```

### Production

For a Deno Deploy URL:
```yaml
extra:
  chatbot:
    api_url: https://your-project-name.deno.dev
```

For a custom domain:
```yaml
extra:
  chatbot:
    api_url: https://api.yourcompany.com
```

### Environment-Specific Deployment

You can use environment variables during build:
```bash
# Build docs with custom API URL
CHATBOT_API_URL=https://api.production.com mkdocs build
```

Then use a templating tool to update `mkdocs.yml` before building.

## Verification

After updating the configuration:

1. **Rebuild the docs**:
   ```bash
   mkdocs build
   ```

2. **Check the browser console** for the log message:
   ```
   ✅ Chatbot API URL configured: http://localhost:8000
   ```

3. **Test the API calls**:
   - Open browser DevTools (F12)
   - Go to Network tab
   - Open the chatbot widget
   - You should see requests to `http://localhost:8000/api/status` (or your configured URL)

## Files Modified

1. **`docs/overrides/main.html`** - Fixed config key and added logging
2. **`docs/mkdocs.yml`** - Updated default api_url and added documentation

## Troubleshooting

### Still seeing 404 errors?

1. **Check the console log**: Did you see the "Chatbot API URL configured" message?
   - If not, the HTML file wasn't updated
   - Try clearing browser cache (Shift+F5)

2. **Verify your backend is running**:
   ```bash
   # For Deno
   deno task dev
   # Should show: Listening on http://0.0.0.0:8000
   ```

3. **Check CORS settings**: The backend should allow requests from your docs domain
   - See `chatbot/main.ts` line 38-43 for CORS configuration
   - In development, `*` allows all origins

4. **Check the actual URL being called**:
   - Open DevTools Network tab
   - Look at request URLs in the Network panel
   - They should match your configured API URL

### Testing with curl

```bash
# Test if backend is responding
curl http://localhost:8000/api/health
# Should return:
# {"status":"ok","service":"openlibx402-ragbot","timestamp":"2025-11-05T..."}
```

## Related Documentation

- [Chatbot API Reference](chatbot/api.md)
- [Chatbot Deployment](chatbot/deployment.md)
- [Chatbot Configuration](chatbot/configuration.md)

---

**Last Updated**: 2025-11-05
**Status**: ✅ Fixed and Verified

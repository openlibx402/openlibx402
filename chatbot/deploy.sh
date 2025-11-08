#!/bin/bash
# Deploy to Deno Deploy using deployctl

set -e

echo "🚀 Deploying OpenLibx402 RAG Chatbot to Deno Deploy..."

# Check if deployctl is installed
if ! command -v deployctl &> /dev/null; then
    echo "❌ deployctl is not installed. Install it with:"
    echo "   deno install -Arf https://deno.land/x/deploy/deployctl.ts"
    exit 1
fi

# Check for required environment variables
if [ -z "$DENO_DEPLOY_TOKEN" ]; then
    echo "❌ DENO_DEPLOY_TOKEN environment variable is not set"
    echo "   Get your token from: https://dash.deno.com/account#access-tokens"
    exit 1
fi

# Project name
PROJECT_NAME="${DENO_PROJECT_NAME:-sama}"

echo "📦 Project: $PROJECT_NAME"
echo "📄 Entry point: main.ts"

# Deploy to Deno Deploy
deployctl deploy \
  --project="$PROJECT_NAME" \
  --token="$DENO_DEPLOY_TOKEN" \
  --include=main.ts,src,deno.json \
  --exclude=scripts,*.md,.env*,node_modules,.git \
  main.ts

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Set environment variables in Deno Deploy dashboard"
echo "2. Configure OPENAI_API_KEY"
echo "3. Configure PINECONE_API_KEY and PINECONE_INDEX_NAME"
echo "4. Run the indexing script to populate Pinecone"
echo "5. Update mkdocs.yml with your Deno Deploy URL"
echo ""
echo "Dashboard: https://dash.deno.com/projects/$PROJECT_NAME"

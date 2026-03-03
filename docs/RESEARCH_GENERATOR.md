# Research Content Generator API

## Overview

The Research Generator API uses OpenAI to automatically generate SEO-optimized research reports based on real token analytics data. All generated content is stored in Vercel KV (Redis) and automatically served by existing research pages.

## Environment Variables

Add these to your Vercel project or `.env.local`:

\`\`\`bash
# Required
OPENAI_API_KEY=sk-...
RESEARCH_GENERATE_SECRET=your-secret-here

# Vercel KV (auto-added by Vercel KV integration)
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
\`\`\`

## API Endpoint

**POST** `/api/research/generate`

### Authentication

Include the secret in request headers:

\`\`\`bash
x-research-secret: your-secret-here
\`\`\`

### Request Body

\`\`\`json
{
  "mode": "daily" | "token" | "guide",
  "date": "YYYY-MM-DD",
  "token": "TOKEN_SYMBOL",  // Required for token mode
  "kind": "trending" | "safety" | "wallet",  // Required for token mode
  "slug": "guide-slug"  // Required for guide mode
}
\`\`\`

## Usage Examples

### Generate Daily Market Report

\`\`\`bash
curl -X POST https://solrad.io/api/research/generate \
  -H "Content-Type: application/json" \
  -H "x-research-secret: your-secret-here" \
  -d '{
    "mode": "daily",
    "date": "2025-01-27"
  }'
\`\`\`

### Generate Token Trending Analysis

\`\`\`bash
curl -X POST https://solrad.io/api/research/generate \
  -H "Content-Type: application/json" \
  -H "x-research-secret: your-secret-here" \
  -d '{
    "mode": "token",
    "date": "2025-01-27",
    "token": "BONK",
    "kind": "trending"
  }'
\`\`\`

### Generate Token Safety Report

\`\`\`bash
curl -X POST https://solrad.io/api/research/generate \
  -H "Content-Type: application/json" \
  -H "x-research-secret: your-secret-here" \
  -d '{
    "mode": "token",
    "date": "2025-01-27",
    "token": "WIF",
    "kind": "safety"
  }'
\`\`\`

### Generate Wallet Behavior Analysis

\`\`\`bash
curl -X POST https://solrad.io/api/research/generate \
  -H "Content-Type: application/json" \
  -H "x-research-secret: your-secret-here" \
  -d '{
    "mode": "token",
    "date": "2025-01-27",
    "token": "POPCAT",
    "kind": "wallet"
  }'
\`\`\`

## Response

### Success (200)

\`\`\`json
{
  "success": true,
  "key": "research:daily:2025-01-27",
  "report": {
    "title": "Solana Market Intelligence - January 27, 2025",
    "date": "2025-01-27",
    "type": "daily",
    "summary": "Market overview summary...",
    "sections": [
      {
        "heading": "Market Overview",
        "bullets": ["Point 1", "Point 2", ...]
      }
    ],
    "faqs": [
      {
        "q": "Question?",
        "a": "Answer..."
      }
    ],
    "relatedTokens": ["BONK", "WIF", "POPCAT"],
    "tags": ["solana", "market-intelligence", ...]
  }
}
\`\`\`

### Error Responses

**401 Unauthorized** - Invalid or missing secret
**400 Bad Request** - Missing required fields
**500 Internal Server Error** - Generation or storage failed

## Storage

Generated content is stored in Vercel KV with 30-day TTL:

- Daily reports: `research:daily:YYYY-MM-DD`
- Token reports: `research:token:SYMBOL:YYYY-MM-DD:KIND`
- Guides: `research:guide:slug`

## Automatic Rendering

No code changes needed! Research pages automatically:
1. Check KV storage first
2. Fall back to local JSON files if not found
3. Render content using existing UI components

## Automation Ideas

### Daily Cron Job

\`\`\`bash
# Generate daily report every morning
0 6 * * * curl -X POST https://solrad.io/api/research/generate \
  -H "x-research-secret: $SECRET" \
  -d '{"mode":"daily","date":"'$(date +%Y-%m-%d)'"}'
\`\`\`

### Token Analysis on Trending

When a token starts trending, automatically generate all 3 reports:

\`\`\`bash
TOKEN="BONK"
DATE=$(date +%Y-%m-%d)

for KIND in trending safety wallet; do
  curl -X POST https://solrad.io/api/research/generate \
    -H "x-research-secret: $SECRET" \
    -d "{\"mode\":\"token\",\"date\":\"$DATE\",\"token\":\"$TOKEN\",\"kind\":\"$KIND\"}"
done
\`\`\`

## Security

- Secret validation on every request
- Server-side only (never exposed to client)
- Rate limiting recommended (use Vercel Edge Config or KV)
- OpenAI temperature set to 0.3 for consistent, factual output
- Strict JSON validation before storage
- No user input directly passed to OpenAI (all data from internal APIs)

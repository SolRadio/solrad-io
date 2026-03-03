# Research Lab - Vercel Blob Storage

## Overview
Research Lab reports are stored in Vercel Blob for dynamic publishing and served to production users. Local JSON files in `/content/research` serve as fallback for development.

## Blob Structure

\`\`\`
research/
├── index.json              # Master index (last 30 reports)
├── daily/
│   └── YYYY-MM-DD.json    # Daily market reports
├── weekly/
│   └── YYYY-Www.json      # Weekly insights
└── token/
    └── TOKEN/
        └── YYYY-MM-DD.json # Token analysis reports
\`\`\`

## API Endpoints

### POST /api/research/publish
Publish a research report to Blob storage and update index.

**Request:**
\`\`\`json
{
  "report": {
    "title": "string",
    "date": "YYYY-MM-DD",
    "type": "daily" | "weekly" | "token",
    "slug": "identifier",
    "summary": "string",
    "sections": [...],
    "relatedTokens": [...],
    "tags": [...]
  },
  "secret": "RESEARCH_GENERATE_SECRET"
}
\`\`\`

### POST /api/research/generate
Generate research content with OpenAI and publish to both KV and Blob.

**Request:**
\`\`\`json
{
  "mode": "daily" | "token" | "guide",
  "date": "YYYY-MM-DD",
  "token": "TOKEN_SYMBOL",  // For token mode
  "kind": "trending" | "safety" | "wallet",  // For token mode
  "slug": "guide-slug"  // For guide mode
}
\`\`\`

**Headers:**
\`\`\`
x-research-secret: RESEARCH_GENERATE_SECRET
\`\`\`

## Vercel Cron Jobs

Two cron jobs auto-generate research:

1. **Daily Reports**: 6:00 AM UTC daily
   - Path: `/api/research/generate?type=daily`
   - Generates market overview

2. **Weekly Insights**: 7:00 AM UTC every Monday
   - Path: `/api/research/generate?type=weekly`
   - Generates weekly aggregation

## Loading Priority

Research pages check storage in this order:
1. **Vercel Blob** (production, public access)
2. **Local JSON files** (development fallback)

## Environment Variables

Required:
- `RESEARCH_GENERATE_SECRET` - Auth for generation endpoints
- `OPENAI_API_KEY` - OpenAI content generation
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob access (auto-configured)

## Manual Publishing

Generate a report:
\`\`\`bash
curl -X POST https://solrad.io/api/research/generate \
  -H "x-research-secret: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "daily",
    "date": "2025-01-27"
  }'
\`\`\`

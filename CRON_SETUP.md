# Cron Job Setup for SOLRAD

This document explains how to set up automated token data ingestion for SOLRAD.

## Vercel Cron Jobs (Recommended)

SOLRAD includes a `vercel.json` configuration that automatically runs token ingestion every 5 minutes.

### Configuration

The cron job is defined in `vercel.json`:

\`\`\`json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "*/5 * * * *"
    }
  ]
}
\`\`\`

### Schedule Options

You can adjust the schedule in `vercel.json`:

- `*/5 * * * *` - Every 5 minutes (default)
- `*/10 * * * *` - Every 10 minutes
- `*/15 * * * *` - Every 15 minutes
- `0 * * * *` - Every hour
- `0 */2 * * *` - Every 2 hours

## Manual Triggers

You can also trigger ingestion manually via API:

\`\`\`bash
curl -X POST https://your-domain.com/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"force": false}'
\`\`\`

### Via Cron Endpoint

\`\`\`bash
curl https://your-domain.com/api/cron
\`\`\`

## External Cron Services

If you prefer to use an external cron service instead of Vercel Crons:

### Cron-job.org

1. Go to https://cron-job.org
2. Create a new cron job
3. Set URL: `https://your-domain.com/api/cron`
4. Set schedule (e.g., every 5 minutes)

### EasyCron

1. Go to https://www.easycron.com
2. Create a new cron job
3. Set URL: `https://your-domain.com/api/cron`
4. Set schedule

### GitHub Actions

Create `.github/workflows/cron.yml`:

\`\`\`yaml
name: Token Ingestion Cron

on:
  schedule:
    - cron: '*/5 * * * *'
  workflow_dispatch:

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Ingestion
        run: |
          curl https://your-domain.com/api/cron
\`\`\`

## Monitoring

Check cron job execution:

1. View Vercel logs in your dashboard
2. Monitor the application logs for `[v0] Cron:` messages
3. Use the `/api/health` endpoint to check system status

## Troubleshooting

### Cron not running

- Ensure your Vercel project is on a Pro plan (required for cron jobs)
- Verify `vercel.json` is in the root directory
- Check the Vercel dashboard for cron job logs

### Ingestion failures

- Check API rate limits for data sources
- Verify HELIUS_API_KEY is set for Solana data
- Review application logs for specific errors

# Intelligence Command Center

## Overview

The Intelligence Command Center is an admin-only feature that generates daily tweet threads and Telegram content packets from existing tracked token data using deterministic templates (no AI/LLM). It automatically sends intel drops to the same Telegram channel used by the alerts system.

## Architecture

### Files Added

**Generator & Storage:**
- `/lib/intel/generator.ts` - Deterministic template-based intel report generator
- `/lib/intel/storage.ts` - Storage helper for intel reports (uses existing KV/storage)

**Admin APIs (Protected by x-ops-password):**
- `/app/api/admin/intel/latest/route.ts` - GET latest stored report
- `/app/api/admin/intel/generate/route.ts` - POST to generate new report
- `/app/api/admin/intel/send/route.ts` - POST to send report to Telegram

**Cron Route (Protected by CRON_SECRET):**
- `/app/api/intel/generate/daily/route.ts` - Daily auto-generation + send

**Admin UI:**
- `/app/admin/intel/page.tsx` - Full admin interface for managing intel drops

### Configuration

**vercel.json:**
\`\`\`json
{
  "path": "/api/intel/generate/daily",
  "schedule": "0 8 * * *"
}
\`\`\`
Runs daily at 8:00 AM UTC (after research generation at 6 AM).

## Environment Variables

**Required:**
- `OPS_PASSWORD` - Admin authentication for manual operations
- `CRON_SECRET` - Vercel cron job authentication
- `TELEGRAM_BOT_TOKEN` - Telegram bot token (already configured)
- `TELEGRAM_ALERTS_CHAT_ID` - Telegram channel ID (already configured)

**Optional:**
- `KV_REST_API_URL` + `KV_REST_API_TOKEN` - Vercel KV storage
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis

No new environment variables are required if the existing setup is complete.

## Data Flow

1. **Data Source:** Uses `getTrackedTokens()` from existing pipeline (same as /api/tokens)
2. **Generator:** Applies deterministic scoring/selection logic
3. **Storage:** Saves to KV with keys:
   - `intel:daily:YYYY-MM-DD` (30 day TTL)
   - `intel:latest` (30 day TTL)
4. **Telegram:** Sends using existing `sendTelegramMessage()` helper

## Generator Logic

### Candidate Selection

1. **Filter:** Liquidity > $25,000 (avoid dust tokens)
2. **Sort:** 
   - Primary: Score (descending)
   - Secondary: Volume change proxy (descending)
   - Tertiary: |Price change 24h| (descending)
3. **Top 5:** Select top 5 candidates for report

### Rotation Proxy Detection

Tokens showing rotation characteristics:
- Volume change >= +30% (proxy: abs(priceChange24h) * 2)
- Liquidity > 0 and present (not collapsing)

### Reason Tags (Max 3 per token)

- **"Momentum ↑"** - Volume change > 0
- **"Liquidity: stable"** - Liquidity >= $100k
- **"Quality signal"** - Score >= 80
- **"Buy pressure"** - 24h price change > 0

### Tweet Thread Structure

1. **Market Signal** - Rotation count + positioning advice
2. **Alpha Alert** - Top candidate with score, 24h%, liquidity, reasons, link
3. **Engagement** - A/B poll question for community
4. **CTA** - Feature highlights + link to dashboard
5. **Trust Signal** - Value props (no AI, deterministic, live data)
6. **Authority Close** - Follow CTA + bookmark link

### Telegram Packet Format

\`\`\`
📡 SOLRAD INTEL DROP — YYYY-MM-DD

What we're seeing:
• X high-quality candidates on radar
• Top score: XX/100
• Avg liquidity: $X.XXM

Top radar candidates:
1. $SYMBOL (XX/100) - Reason
2. $SYMBOL (XX/100) - Reason
3. $SYMBOL (XX/100) - Reason

Tweet Thread Draft:
[First 3 tweets included for preview]

📊 Full dashboard: https://www.solrad.io
\`\`\`

## Usage

### Admin Panel Access

1. Navigate to: `https://www.solrad.io/admin/intel`
2. Enter OPS_PASSWORD
3. Click "Access Panel"

### Manual Operations

**Generate Report:**
- Click "Regenerate" button
- Fetches latest tracked tokens
- Generates new intel drop
- Saves to storage
- Displays in UI

**Send to Telegram:**
- Click "Send to Telegram" button
- Sends latest report's Telegram packet
- Uses existing alerts channel

**Refresh Display:**
- Click "Refresh" button
- Fetches latest report from storage
- Updates UI

**Copy Content:**
- Each tweet has a "Copy" button
- Telegram packet has a "Copy" button
- One-click clipboard copy for manual posting

### Automated Daily Run

**Cron Schedule:** 8:00 AM UTC daily

**Behavior:**
1. Fetches tracked tokens
2. Generates intel report
3. Saves to storage
4. Auto-sends to Telegram
5. Logs success/failure

**Monitoring:**
- Check Vercel cron logs
- Telegram channel for successful sends
- Admin panel shows latest report timestamp

## API Reference

### GET /api/admin/intel/latest

**Auth:** `x-ops-password` header

**Response:**
\`\`\`json
{
  "ok": true,
  "report": {
    "generatedAt": 1234567890,
    "date": "2026-01-28",
    "signals": {
      "topCandidates": 5,
      "rotationProxies": 3,
      "avgScore": 85
    },
    "tweetDrafts": ["...", "...", "..."],
    "telegramPacket": "...",
    "candidates": [
      {
        "symbol": "SOL",
        "mint": "So11...",
        "score": 95,
        "priceChange24h": 12.5,
        "liquidity": 5000000,
        "volume24h": 10000000,
        "volumeChange24h": 45,
        "reasonTags": ["Momentum ↑", "Quality signal", "Buy pressure"]
      }
    ]
  }
}
\`\`\`

### POST /api/admin/intel/generate

**Auth:** `x-ops-password` header

**Response:**
\`\`\`json
{
  "ok": true,
  "report": { /* same as above */ }
}
\`\`\`

### POST /api/admin/intel/send

**Auth:** `x-ops-password` header

**Response:**
\`\`\`json
{
  "ok": true,
  "sent": true,
  "date": "2026-01-28"
}
\`\`\`

### GET /api/intel/generate/daily

**Auth:** `Authorization: Bearer <CRON_SECRET>` header

**Response:**
\`\`\`json
{
  "ok": true,
  "generated": true,
  "sent": true,
  "date": "2026-01-28",
  "candidates": 5,
  "durationMs": 1234
}
\`\`\`

## Storage Keys

- `intel:daily:YYYY-MM-DD` - Daily report (30 day TTL)
- `intel:latest` - Latest report pointer (30 day TTL)

Uses existing `storage` adapter from `/lib/storage.ts` (Vercel KV, Upstash, or memory fallback).

## Error Handling

**No tracked tokens:**
- Returns error: "No tracked tokens available"
- Does not send to Telegram
- Admin sees "No data available"

**Auth failures:**
- Returns 401 Unauthorized
- User prompted to re-enter password

**Telegram send failures:**
- Report still generated and saved
- Error logged but not blocking
- Admin can retry send manually

**Storage failures:**
- Falls back to memory cache (development)
- Logs warning but doesn't block generation

## Security

- All admin APIs protected by OPS_PASSWORD via `x-ops-password` header
- Cron route protected by CRON_SECRET via `Authorization: Bearer` header
- Password stored in sessionStorage (client-side)
- Telegram token never exposed to client
- Uses existing `verifyOpsPasswordFromHeader()` helper

## Testing

**Manual Test Flow:**
1. Access `/admin/intel`
2. Enter OPS_PASSWORD
3. Click "Regenerate" - should generate report
4. Verify tweet drafts and Telegram packet display
5. Click "Send to Telegram" - should send to channel
6. Check Telegram channel for message
7. Click "Copy" buttons - should copy to clipboard

**Cron Test:**
\`\`\`bash
curl -X GET https://www.solrad.io/api/intel/generate/daily \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
\`\`\`

## Maintenance

**Updating Tweet Templates:**
- Edit `/lib/intel/generator.ts`
- Modify `generateTweetDrafts()` function
- No database migrations needed

**Updating Selection Logic:**
- Edit `/lib/intel/generator.ts`
- Modify `generateIntelReport()` function
- Adjust filters, sorting, or scoring

**Adding New Reason Tags:**
- Edit `/lib/intel/generator.ts`
- Modify `generateReasonTags()` function
- Add new conditions based on TokenScore fields

## Integration Points

**Uses Existing Systems:**
- `getTrackedTokens()` - Token data pipeline
- `sendTelegramMessage()` - Telegram integration
- `storage` - KV/Redis/memory adapter
- `verifyOpsPasswordFromHeader()` - Auth helper

**Does NOT Modify:**
- Token ingestion logic
- Scoring logic
- Public UI/routes
- Existing admin pages
- Existing API routes

## Deployment Checklist

- [ ] Verify OPS_PASSWORD is set in Vercel
- [ ] Verify CRON_SECRET is set in Vercel
- [ ] Verify TELEGRAM_BOT_TOKEN is set
- [ ] Verify TELEGRAM_ALERTS_CHAT_ID is set
- [ ] Deploy to production
- [ ] Test manual generation via admin panel
- [ ] Test manual send to Telegram
- [ ] Wait for 8 AM UTC for auto-run
- [ ] Verify cron logs in Vercel
- [ ] Verify message in Telegram channel

## Troubleshooting

**"No report available":**
- Click "Regenerate" to create first report
- Check if tracked tokens pipeline is working

**"Unauthorized":**
- Verify OPS_PASSWORD is correct
- Check sessionStorage has valid password
- Re-login to admin panel

**"Failed to send to Telegram":**
- Verify TELEGRAM_BOT_TOKEN is set
- Verify TELEGRAM_ALERTS_CHAT_ID is correct
- Check bot has admin access to channel
- Check Telegram API status

**Cron not running:**
- Verify vercel.json cron entry exists
- Check Vercel cron logs for errors
- Verify CRON_SECRET is set correctly
- Check function execution limits (120s max duration)

**Empty candidate list:**
- Check if any tokens have liquidity > $25k
- Verify getTrackedTokens() returns data
- Check token ingestion is working

## Future Enhancements

**Possible Additions (if needed):**
- Historical report archive view
- Customizable tweet templates via admin UI
- A/B testing different message formats
- Performance analytics (engagement tracking)
- Multi-channel support (Discord, etc.)
- Scheduled send time configuration

**NOT Planned:**
- AI/LLM integration (by design - deterministic only)
- External API dependencies
- Complex ML models
- Real-time sentiment analysis

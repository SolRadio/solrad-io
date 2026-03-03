# Lead-Time Proof Engine - QA Testing Guide

## Quick Start

To visually verify the Lead-Time Proof feature:

1. **Enable QA Seed Mode:**
   Set the environment variable:
   ```bash
   LEAD_TIME_QA_SEED=1
   ```

2. **Test Mints:**
   The following mints will return mocked lead-time data:
   - `JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN` (Jupiter)
   - `So11111111111111111111111111111111111111112` (Wrapped SOL)
   - `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (USDC)

3. **What to Look For:**

   **Token Cards (Main Page):**
   - Lead-time badge (+18s or +14s) appears next to risk badge
   - Badge shows green (HIGH) or amber (MEDIUM) confidence colors
   - Hover tooltip shows block count and time advantage

   **Token Detail Drawer:**
   - Lead-Time Proof panel appears above Safety Snapshot
   - Shows "Observed" event (e.g., "wallet accumulation spike")
   - Shows "Market Reaction" event (e.g., "volume increased 3.5x")
   - Displays confidence badge and stats

   **Lead-Time Page (`/lead-time-proof`):**
   - Accessible via footer link "Lead-Time"
   - Shows explanation of lead-time proofs
   - Displays methodology and trust-first language

## Production Behavior

When `LEAD_TIME_QA_SEED` is not set (or set to anything other than "1"):
- API routes return empty arrays (no proofs)
- Badge does not appear on token cards
- Panel does not render in drawer
- No visual changes to existing UI

## Architecture

- **API Routes:**
  - `GET /api/lead-time/[mint]` - Returns proofs and stats for a mint
  - `GET /api/lead-time/recent` - Returns recent proofs across all mints

- **Components:**
  - `LeadTimeBadge` - Small badge for token cards
  - `LeadTimeProofPanel` - Detailed panel for token drawer
  - `LeadTimeProofPage` - Explanation page at `/lead-time-proof`

- **Types:**
  - `LeadTimeProof` - Individual proof with observation/reaction events
  - `LeadTimeStats` - Aggregated statistics for a token

## TypeScript Safety

All lead-time fields on `TokenScore` are optional:
- `_leadTimeBlocks?: number`
- `_leadTimeConfidence?: "LOW" | "MEDIUM" | "HIGH"`

Components render-gate on data presence - no assumptions made.

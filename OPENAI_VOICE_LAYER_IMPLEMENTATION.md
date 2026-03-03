# OpenAI Voice Layer Implementation

## Overview
Added optional OpenAI-powered "Voice Layer" to the admin-only Intelligence Command Center that rewrites deterministic intel into natural, non-bot tweets and Telegram messages while maintaining strict fact-checking.

## Files Changed/Added

### New Files
1. `/lib/intel/openaiVoice.ts` (259 lines)
   - `rewriteIntelWithOpenAI()` - Main function to call OpenAI with structured outputs
   - `generateDailySeed()` - Creates deterministic daily seed for consistency
   - `buildSystemPrompt()` - Builds strict constraint prompts
   - `buildUserPrompt()` - Formats Truth Pack for OpenAI
   - Uses JSON Schema enforcement for structured outputs
   - Includes forbidden phrase validation

### Modified Files
1. `/lib/intel/generator.tsx`
   - Made `generateIntelReport()` async and added optional params: `aiVoice`, `seedOverride`
   - Added `buildTruthPack()` function to create fact-only data structure
   - Implements fail-safe fallback: if OpenAI fails, uses deterministic templates
   - Added `aiVoiceUsed` flag to IntelReport type

2. `/app/api/admin/intel/generate/route.ts`
   - Updated POST handler to accept body params: `aiVoice`, `seedOverride`, `preview`
   - `preview=true` generates without saving to storage
   - Passes options to `generateIntelReport()`

3. `/app/admin/intel/page.tsx`
   - Added AI Voice Mode toggle (Switch component)
   - Added "Shuffle" button that generates preview with new seed
   - Added "Save Preview" button to persist preview as current report
   - Added "Share to X" buttons per tweet
   - Added "Share Thread to X" button (shares first 3 tweets)
   - Preview mode warning banner
   - Shows "(AI Voice)" or "(Preview)" labels in UI
   - All functionality respects preview vs. saved state

## Required Environment Variables

### Required for AI Voice Mode
\`\`\`env
OPENAI_API_KEY=sk-proj-...
\`\`\`

### Already Required (existing)
\`\`\`env
OPS_PASSWORD=your_admin_password
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_ALERTS_CHAT_ID=@your_channel
\`\`\`

## How to Use AI Voice Mode Safely

### Step 1: Enable AI Voice
1. Navigate to `/admin/intel`
2. Login with OPS_PASSWORD
3. Toggle "AI Voice Mode (Non-Bot)" to ON

### Step 2: Generate Intel
- Click "Generate" to create a new intel report using AI Voice
- If OpenAI fails, automatically falls back to deterministic templates
- No errors shown to user - seamless failover

### Step 3: Shuffle for Variety (Optional)
- Click "🎲 Shuffle" to generate a preview with different phrasing
- Uses a random seed to get variation while keeping facts identical
- Preview mode activated - shows warning banner
- Can shuffle multiple times to find preferred phrasing

### Step 4: Save or Regenerate
- Click "💾 Save Preview" to persist the current preview as the saved report
- Or click "Generate" again to create a new version
- Preview is discarded if you generate without saving

### Step 5: Share to X
- Use "Share to X" button on individual tweets to open Twitter intent
- Use "Share Thread to X" to share first 3 tweets as a thread
- Or use "Copy" button and paste manually

### Step 6: Send to Telegram
- Click "Send to Telegram" when ready
- Only sends the saved report (not preview)

## Safety Guarantees

### 1. Truth-First Architecture
- **Truth Pack** is built first from deterministic data
- OpenAI receives ONLY verified facts from Truth Pack
- Model CANNOT access or invent new data points

### 2. Forbidden Phrase Validation
Automatically rejects any output containing:
- "smart wallet flows"
- "wallet inflows"
- "insider wallets"
- "whale wallet tracked"
- "wallet accumulation"

If detected, falls back to deterministic templates.

### 3. Structured Output Enforcement
- Uses OpenAI's JSON Schema mode (`response_format: json_schema`)
- Strict schema: `{ tweets: string[], telegram: string }`
- Invalid responses are rejected automatically

### 4. Fail-Safe Fallbacks
- If `OPENAI_API_KEY` not set → Uses deterministic templates
- If OpenAI API returns error → Uses deterministic templates
- If output validation fails → Uses deterministic templates
- If forbidden phrases detected → Uses deterministic templates
- **User never sees errors** - always gets valid intel

### 5. Telegram Format Enforcement
System prompt explicitly forbids:
- "Tweet 1", "Tweet 2" labels
- "Thread" or "Poll" formatting
- More than 10 lines

Required format:
\`\`\`
📡 SOLRAD INTEL DROP — {date}
Market snapshot: (2 bullets)
Top radar: (top 3 lines)
Alpha candidate: (1 token + 2 bullets max)
Links: token link + dashboard link
\`\`\`

### 6. Deterministic Daily Seeding
- Each date generates the same seed by default
- Outputs are consistent for a given day unless shuffled
- Shuffle creates temporary random seed for preview only
- Saved report uses daily seed unless explicitly saved from shuffle

## Testing Checklist

### Without OPENAI_API_KEY
- [ ] Toggle AI Voice ON → Generate → Should use deterministic (no errors)
- [ ] Shuffle button should not appear

### With OPENAI_API_KEY
- [ ] Toggle AI Voice ON → Generate → Should get AI-rewritten content
- [ ] Check report shows "(AI Voice)" label
- [ ] Shuffle → Should show preview with different phrasing
- [ ] Preview mode shows warning banner
- [ ] Save Preview → Should persist preview as saved report
- [ ] Share to X buttons → Should open Twitter intent
- [ ] Share Thread to X → Should share first 3 tweets
- [ ] Send to Telegram → Should only send saved report (not preview)

### Safety Tests
- [ ] Remove OPENAI_API_KEY mid-session → Should fallback gracefully
- [ ] Simulate OpenAI API error → Should fallback to deterministic
- [ ] Verify Telegram output has NO "Tweet 1" labels
- [ ] Verify no forbidden wallet-tracking phrases in output

## Architecture Decisions

### Why Structured Outputs?
- Guarantees valid JSON schema compliance
- Eliminates parsing errors
- Enforces exact format requirements

### Why Forbidden Phrase Check?
- smartFlow badge is a volume/liquidity signal, NOT wallet tracking
- SOLRAD does not track individual wallet flows
- Prevents AI from implying capabilities we don't have

### Why Fail Silent?
- Admin user doesn't need to know if OpenAI failed
- Deterministic fallback is always valid
- Reduces cognitive load and maintains workflow

### Why Preview Mode?
- Shuffle creates variations without overwriting saved report
- Admin can try multiple phrasings before committing
- Clear visual distinction (warning banner) prevents confusion

### Why Daily Seed?
- Prevents endless regeneration loops
- Outputs remain stable unless user explicitly shuffles
- Reproducible for debugging

## No Public UI Changes
✅ **Confirmed**: All changes are within allowed scope
- Only modified: `/app/admin/intel/*`, `/app/api/admin/intel/*`, `/lib/intel/*`
- No changes to: public pages, token grid, scoring logic, non-admin routes
- Existing auth pattern (`x-ops-password`) preserved
- Telegram sending uses existing helper flow

## Performance Impact
- OpenAI API call adds ~2-5 seconds to generation
- Preview mode does NOT save to storage (faster iteration)
- Fallback to deterministic is instant
- No impact on public-facing pages

## Cost Considerations
- Model: `gpt-4o-mini` (cost-effective)
- ~1,500 tokens per generation
- Estimated cost: $0.01-0.02 per intel drop
- Only called when admin explicitly uses AI Voice Mode
- Preview shuffles also trigger API calls (consider budget if shuffling frequently)

## Future Enhancements (Not Implemented)
- [ ] Add "mode" selector: balanced, punchy, analytical
- [ ] Show token usage stats in UI
- [ ] Add A/B testing between deterministic and AI versions
- [ ] Cache generated outputs by seed for faster shuffles
- [ ] Add admin setting to prefer AI Voice by default

## Rollback Instructions
If needed, rollback is simple:
1. Remove `OPENAI_API_KEY` from environment
2. AI Voice toggle will have no effect
3. System operates exactly as before (100% deterministic)

Alternatively, to fully remove the feature:
1. Delete `/lib/intel/openaiVoice.ts`
2. Revert changes to `/lib/intel/generator.tsx`
3. Revert changes to `/app/api/admin/intel/generate/route.ts`
4. Revert changes to `/app/admin/intel/page.tsx`

# Lead-Time Proof Engine v1 - Technical Summary

**Last Updated:** February 2026  
**Status:** Production (Active)  
**Version:** 1.0

---

## 1. What the Lead-Time Proof Engine Is

The Lead-Time Proof Engine is a read-only observational system that measures time intervals between on-chain events and subsequent market reactions. It creates verifiable records ("proofs") showing how many seconds (and optionally blocks) elapsed between SOLRAD's observation of specific on-chain behaviors and measurable market changes.

### What It Does

- Monitors on-chain token activity during routine data ingestion
- Detects specific observation events (score jumps, signal state upgrades, accumulation patterns)
- Tracks baseline metrics (volume, liquidity, score) at observation time
- Watches for subsequent market reactions (volume expansions, liquidity increases)
- Computes time difference between observation and reaction
- Stores proofs in KV storage with timestamps and metadata
- Exposes proofs via public APIs with free/pro tier logic

### What It Does NOT Do

- Make predictions or forecasts
- Guarantee future performance
- Provide trading signals or recommendations
- Execute trades or automated actions
- Claim predictive capability
- Promise financial outcomes

The engine is strictly observational and historical. All proofs are backward-looking records of what was observed on-chain before market reactions occurred.

---

## 2. Data Flow Overview (Step-by-Step)

### 2.1 Ingestion Trigger

The engine runs as part of SOLRAD's regular token ingestion pipeline:

1. **Entry Point:** `/lib/ingestion.ts` line 212-218
2. **Frequency:** Every ingestion cycle (typically 5-15 minutes)
3. **Input:** Array of scored tokens + signal state map
4. **Non-Blocking:** Engine failures do not halt ingestion

```typescript
// Called after scoring + signal states are computed
const { processLeadTimeProofs } = await import("./lead-time/writer")
await processLeadTimeProofs(validScores, signalStateMap)
```

### 2.2 Observation Detection

**File:** `/lib/lead-time/writer.ts` → `processLeadTimeObservations()`

For each token:

1. Check if confidence ≥ 60
2. Check for existing observation (skip if found within 6 hours)
3. Detect score jump in last 60 minutes (≥ +10 points)
4. Detect signal state upgrade (EARLY→CAUTION, EARLY→STRONG, CAUTION→STRONG)
5. If conditions met, create pending observation

### 2.3 Pending Observation Storage

**KV Key Pattern:** `solrad:leadtime:observation:{mint}`  
**TTL:** 6 hours  
**Data Structure:**

```typescript
{
  mint: string
  observedAt: number // timestamp
  blockNumber: number // optional in v1
  observationType: string // e.g., "score_jump_+15" or "signal_upgrade_EARLY_to_CAUTION"
  confidence: "LOW" | "MEDIUM" | "HIGH"
  baseline: {
    score: number
    volume24h: number
    liquidity: number
  }
}
```

### 2.4 Reaction Detection

**File:** `/lib/lead-time/writer.ts` → `processLeadTimeReactions()`

For each pending observation:

1. Check age (must be within 60 minute reaction window)
2. Fetch current token data
3. Calculate changes from baseline:
   - Volume change: (current - baseline) / baseline × 100
   - Liquidity change: (current - baseline) / baseline × 100
4. Check reaction thresholds:
   - Volume reaction: ≥ +30%
   - Liquidity reaction: ≥ +20%
5. If reaction detected → create proof

### 2.5 Proof Creation

**File:** `/lib/lead-time/storage.ts` → `createLeadTimeProof()`

**Validation Rules:**
- Minimum lead time: 10 seconds
- Must have valid observation + reaction events
- Computes confidence based on observation confidence + lead duration

**Confidence Boost Logic:**
- 30+ minutes lead → HIGH confidence
- 15+ minutes lead + not LOW observation → HIGH confidence  
- 5+ minutes lead → MEDIUM confidence

### 2.6 Proof Storage

**Per-Token Proofs:**
- **Key:** `solrad:leadtime:{mint}`
- **TTL:** 30 days
- **Max Proofs per Token:** 50 (older proofs pruned)

**Recent Proofs (Global):**
- **Key:** `solrad:leadtime:recent`
- **TTL:** 7 days
- **Max Proofs:** 50 (newest first)

**Stats per Token:**
- **Key:** `solrad:leadtime:stats:{mint}`
- **TTL:** 30 days
- **Contains:** total proofs, avg/min/max lead times, last proof timestamp

### 2.7 API Exposure

Proofs are accessed via REST APIs:

- `GET /api/lead-time/recent?limit=20` - Recent proofs across all tokens
- `GET /api/lead-time/{mint}` - Proofs + stats for specific token
- `GET /api/lead-time/debug` - Admin diagnostics (auth required)

### 2.8 UI Consumption

UI components fetch and display proofs:

- **Token Card Badge:** Shows latest proof lead time (e.g., "🕒 +45b" or "🕒 +15m")
- **Token Detail Panel:** Shows all proofs + stats for token
- **Right-Rail Widget:** Shows engine status + aggregate metrics
- **Lead-Time Proofs Feed:** Scrollable list of recent proofs (Signals page)

---

## 3. Observation Logic (As Implemented)

### What Qualifies as an Observation

**File:** `/lib/lead-time/writer.ts` → `processLeadTimeObservations()`

An observation is created when ALL conditions are met:

1. **Confidence Threshold:** Token's signal confidence ≥ 60
2. **No Duplicate:** No existing observation for this token in last 6 hours
3. **Trigger Event:** One of:
   - Score jump ≥ +10 points in last 60 minutes
   - Signal state upgrade (EARLY→CAUTION, EARLY→STRONG, CAUTION→STRONG)

### Thresholds Used

| Metric | Threshold | Purpose |
|--------|-----------|---------|
| Confidence | ≥ 60 | Filter low-quality signals |
| Score Jump | ≥ +10 | Significant score increase |
| Time Window | 60 minutes | Score jump lookback period |
| Deduplication | 6 hours | Prevent observation spam |

### Time Windows

- **Observation Window:** Last 60 minutes of historical data
- **Deduplication Window:** 6 hours (no duplicate observations for same token)
- **Reaction Window:** 60 minutes after observation created

### Deduplication Rules

- **Key:** `solrad:leadtime:observation:{mint}`
- **Check:** Before creating new observation
- **Logic:** If key exists, skip new observation (prevents double-counting)
- **TTL:** 6 hours (auto-cleanup)

### Pending Observation Lifecycle

1. **Created:** When trigger conditions met during ingestion
2. **Stored:** In KV with 6-hour TTL
3. **Monitored:** Every subsequent ingestion cycle checks for reactions
4. **Resolved:** Either reaction detected (→ proof created) or 60min timeout
5. **Cleaned Up:** Auto-deleted when proof created or 6-hour TTL expires

---

## 4. Reaction Logic (As Implemented)

### What Qualifies as a Reaction

**File:** `/lib/lead-time/writer.ts` → `processLeadTimeReactions()`

A reaction is detected when:

1. **Active Observation:** Pending observation exists for token
2. **Within Window:** Observation age ≤ 60 minutes
3. **Metric Change:** One of:
   - Volume 24h increased ≥ +30% from baseline
   - Liquidity increased ≥ +20% from baseline

### Metrics Evaluated

| Metric | Threshold | Reaction Type |
|--------|-----------|---------------|
| Volume 24h | ≥ +30% | `volume_expansion` |
| Liquidity | ≥ +20% | `liquidity_expansion` |

**Calculation:**
```typescript
volumeChange = ((current - baseline) / baseline) × 100
liquidityChange = ((current - baseline) / baseline) × 100
```

### Time Limits

- **Reaction Window:** 60 minutes after observation
- **If No Reaction:** Observation auto-expires and is deleted
- **Lead Time Minimum:** 10 seconds (enforced in `createLeadTimeProof()`)

### When Proof is Finalized

1. Reaction detected within 60-minute window
2. Lead time ≥ 10 seconds
3. Observation + reaction events paired
4. Proof object created with metadata
5. Saved to per-token KV key
6. Added to global recent proofs list
7. Stats updated for token
8. Pending observation deleted

### What Happens if Reaction Never Occurs

- Observation remains in KV for up to 6 hours (TTL)
- After 60 minutes, engine stops checking for reactions
- KV auto-deletes observation after 6-hour TTL
- No proof is created
- No permanent record (observation-only without reaction is discarded)

---

## 5. Storage & KV Design

### Exact KV Key Patterns Used

| Purpose | Key Pattern | Example |
|---------|-------------|---------|
| Per-Token Proofs | `solrad:leadtime:{mint}` | `solrad:leadtime:jupyiwry...` |
| Token Stats | `solrad:leadtime:stats:{mint}` | `solrad:leadtime:stats:jupyiwry...` |
| Recent Proofs (Global) | `solrad:leadtime:recent` | `solrad:leadtime:recent` |
| Pending Observation | `solrad:leadtime:observation:{mint}` | `solrad:leadtime:observation:jupyiwry...` |
| Last Writer Run | `leadtime:last_writer_run_at` | `leadtime:last_writer_run_at` |
| Last Writer Stats | `leadtime:last_writer_stats` | `leadtime:last_writer_stats` |
| Last Error | `leadtime:last_error` | `leadtime:last_error` |

### TTL Behavior

| Key Type | TTL | Auto-Cleanup |
|----------|-----|--------------|
| Per-Token Proofs | 30 days | Yes (KV auto-deletes) |
| Token Stats | 30 days | Yes (KV auto-deletes) |
| Recent Proofs | 7 days | Yes (KV auto-deletes) |
| Pending Observations | 6 hours | Yes (KV auto-deletes) |
| Instrumentation | 24 hours | Yes (KV auto-deletes) |

### What is Per-Token vs Global

**Per-Token (Keyed by Mint Address):**
- Proofs array (up to 50 proofs per token)
- Stats (aggregated metrics for token)
- Pending observation (active observation state)

**Global (Single Key):**
- Recent proofs list (last 50 proofs across all tokens)
- Last writer run timestamp
- Last writer stats (run metadata)
- Last error (error tracking)

### What Gets Cleaned Up Automatically

1. **Pending Observations:** 6-hour TTL (auto-deleted if no reaction)
2. **Old Proofs:** When per-token proof count exceeds 50, oldest pruned
3. **Recent Proofs List:** When count exceeds 50, oldest pruned
4. **Expired KV Keys:** All keys have TTLs, KV storage auto-deletes on expiry

---

## 6. API Endpoints

### 6.1 GET `/api/lead-time/recent`

**Purpose:** Fetch recent proofs across all tokens  
**Auth Required:** No (public)  
**File:** `/app/api/lead-time/recent/route.ts`

**Query Parameters:**
- `limit` (optional): Max proofs to return (default: 20, max: 50)

**Response Shape:**
```typescript
{
  proofs: LeadTimeProof[]          // Array of proof objects
  isPro: boolean                   // User tier
  delayMinutes: number             // 0 for Pro, 15 for Free
  scannedAt: string                // ISO timestamp of response
}
```

**When It Returns Empty Data:**
- No proofs exist in KV yet (cold start)
- All proofs are within 15-minute delay window (Free users)
- KV key expired or missing

**Delay Rules:**
- **Free Users:** Only proofs older than 15 minutes
- **Pro Users:** All proofs (real-time)

**Special Mode:**
- `LEAD_TIME_QA_SEED=1` environment variable returns mock data for any mint

---

### 6.2 GET `/api/lead-time/[mint]`

**Purpose:** Fetch proofs + stats for specific token  
**Auth Required:** No (public)  
**File:** `/app/api/lead-time/[mint]/route.ts`

**Path Parameters:**
- `mint`: Token mint address (case-insensitive, normalized to lowercase)

**Response Shape:**
```typescript
{
  mintEcho: string                        // Normalized mint (debug field)
  proofs: LeadTimeProof[]                 // Proofs for this token
  stats: LeadTimeStats | null             // Aggregated stats
  pendingObservation: PendingObservation | null  // Pro only
  isPro: boolean                          // User tier
  delayMinutes: number                    // 0 for Pro, 15 for Free
}
```

**When It Returns Empty Data:**
- Token has no proofs yet
- All proofs are within 15-minute delay window (Free users)
- Invalid mint address

**Delay Rules:**
- **Free Users:** Only proofs older than 15 minutes, no pending observations
- **Pro Users:** All proofs + pending observations (real-time)

**Special Mode:**
- `LEAD_TIME_QA_SEED=1` returns mock data for any mint

---

### 6.3 GET `/api/lead-time/debug`

**Purpose:** Admin diagnostics and health check  
**Auth Required:** Yes (requires `x-solrad-admin` header)  
**File:** `/app/api/lead-time/debug/route.ts`

**Authentication:**
```bash
curl -H "x-solrad-admin: YOUR_KEY" https://www.solrad.io/api/lead-time/debug
```

**Response Shape:**
```typescript
{
  ok: boolean                    // Always true if authorized
  ts: string                     // ISO timestamp
  env: {
    nodeEnv: string | null       // NODE_ENV value
    proMode: boolean             // SOLRAD_PRO_MODE=1
    qaSeed: boolean              // LEAD_TIME_QA_SEED=1
  }
  kvOk: boolean                  // KV connectivity test result
  kvError?: string               // Error message if KV test failed
}
```

**When It Returns Empty Data:**
- N/A (always returns structured response or 401)

**Usage:**
- Health checks
- Verifying environment variables
- Testing KV connectivity
- Debugging API availability

---

## 7. Free vs Pro Behavior

### What Free Users See

**Proofs:**
- Delayed by 15 minutes
- Only proofs older than 15 minutes are visible
- No real-time proofs

**Pending Observations:**
- Not visible (hidden)
- Cannot see upcoming potential proofs

**Badge Display:**
- Shows latest proof if ≥ 15 minutes old
- Otherwise shows no badge

**API Responses:**
- `isPro: false`
- `delayMinutes: 15`
- Filtered proof arrays

### What Pro Users See

**Proofs:**
- Real-time (no delay)
- All proofs immediately visible when created
- Full historical access

**Pending Observations:**
- Visible in API responses
- Can see tokens with active observations awaiting reactions
- Insight into potential upcoming proofs

**Badge Display:**
- Shows latest proof immediately (real-time)
- May show pending observation indicator (if implemented)

**API Responses:**
- `isPro: true`
- `delayMinutes: 0`
- Unfiltered proof arrays
- `pendingObservation` field populated

### Delay Rules

**Implementation:** `/lib/lead-time/storage.ts` → `isPro()`

```typescript
export function isPro(): boolean {
  return process.env.SOLRAD_PRO_MODE === "1"
}
```

**Filter Logic (Applied in APIs):**
```typescript
const delayMinutes = isPro ? 0 : 15
const delayMs = delayMinutes * 60 * 1000

const filteredProofs = proofs.filter((proof) => {
  if (isPro) return true
  return Date.now() - proof.proofCreatedAt >= delayMs
})
```

### Pending Observation Visibility

- **Free:** `pendingObservation: null` (always)
- **Pro:** `pendingObservation: PendingObservation | null` (actual value)

### What Badges Represent

**Badge Format:**
- `🕒 +{blocks}b` (if `leadBlocks` available)
- `🕒 +{minutes}m` (if only `leadSeconds` available)

**Badge Colors (Confidence-Based):**
- **LOW:** Muted gray
- **MEDIUM:** Amber/yellow
- **HIGH:** Emerald green

**Badge Tooltip:**
- "Observed on-chain behavior before market reaction. Not a prediction."

**When Badge Appears:**
- Token has at least one proof
- Latest proof is visible to user (respects Free/Pro delay)
- Minimum 10-second lead time

---

## 8. UI Surfaces

### 8.1 Token Cards (Badge Display)

**Component:** `/components/lead-time-badge.tsx`  
**Location:** Token cards on dashboard and signals page  
**Trigger:** Latest proof exists for token

**Badge Appears When:**
- Token has ≥1 proof
- Latest proof is visible (respects delay rules)
- `leadBlocks` or `leadSeconds` > 0

**Badge Format:**
- Blocks: `🕒 +45b`
- Seconds: `🕒 +15m` (converted to minutes)

**Confidence Colors:**
- LOW: Gray/muted
- MEDIUM: Amber
- HIGH: Emerald green

---

### 8.2 Token Detail Panel

**Component:** `/components/lead-time-proof-panel.tsx`  
**Location:** Token drawer/modal (opens when clicking token card)  
**Displays:** All proofs + stats for selected token

**Data Shown:**
- List of all proofs (up to 50)
- Each proof shows: observation type, reaction type, lead time, timestamp
- Aggregated stats: total proofs, avg lead time, min/max lead time
- Pro users see pending observations

**Empty State Message:**
- "No lead-time proofs yet for this token"
- "Engine is actively monitoring for on-chain behavior"

---

### 8.3 Right-Rail Widget (Dashboard)

**Component:** `/components/lead-time-recent-panel.tsx`  
**Location:** Dashboard page, right sidebar (desktop only)  
**Purpose:** Show engine status + aggregate metrics

**Data Shown:**
- Engine status: Active / Inactive
- API status: OK / unavailable
- Last scan time
- Proofs today count
- Proofs (7d) count
- Last proof timing
- Average lead time (7d)

**Does NOT Show:**
- Individual token list (removed per user request)
- Scrolling feed (moved to Signals page)

**Empty State:**
- Shows "Engine: Active" even with zero proofs
- Indicates scanning is active, just no proofs yet

---

### 8.4 Lead-Time Proofs Feed (Signals Page)

**Component:** `/components/lead-time-proofs-feed.tsx`  
**Location:** `/app/signals/page.tsx` (after main signals table)  
**Purpose:** Scrollable feed of recent proofs across all tokens

**Data Shown:**
- Up to 50 recent proofs
- Each entry: token name, symbol, age, lead time, mint address
- Scrollable container (safe for page scrolling)
- Real-time updates (refreshes every 60 seconds)

**Empty State:**
- "No lead-time proofs recorded yet"
- "The engine is active and scanning continuously"

---

### 8.5 What "No Proofs Yet" Actually Means

**Possible Reasons:**

1. **Cold Start:** Engine just deployed, no observations created yet
2. **Quiet Market:** No tokens meet observation criteria (score jumps, state upgrades)
3. **No Reactions:** Observations created but no reactions within 60-minute windows
4. **Delay Window:** Proofs exist but are too recent for Free users (< 15 min old)
5. **KV Expiry:** Old proofs expired (30-day TTL)

**This is Normal When:**
- Market is slow (low volatility)
- Few tokens are being actively traded
- No significant on-chain events occurring
- Observations pending reactions (waiting for market response)

**This is NOT an Error:**
- Engine can be fully functional with zero proofs
- Observations may be pending
- System is passive and does not force proofs

---

## 9. Verify Mode (If Present)

**Status:** Not Currently Implemented

The codebase does not contain a "verify mode" or simulation mode beyond the QA seed mode.

### QA Seed Mode (Active)

**Environment Variable:** `LEAD_TIME_QA_SEED=1`

**Purpose:**
- Testing and visual verification
- Returns mock data for any mint address
- Allows UI development without real proofs

**How It Is Enabled:**
```bash
export LEAD_TIME_QA_SEED=1
```

**What It Simulates:**
- 10 mock recent proofs with realistic data
- 2 mock proofs per token queried
- Aggregated stats for any token

**Safety Guarantees:**
- Does not write to KV
- Does not modify production data
- Only affects API responses
- Clearly marked with `isPro: false` in responses

**How to Disable:**
```bash
unset LEAD_TIME_QA_SEED
# or
export LEAD_TIME_QA_SEED=0
```

---

## 10. How to Know It Is Working

### API Checks

**1. Recent Proofs Endpoint:**
```bash
curl https://www.solrad.io/api/lead-time/recent
```

**Expected Response (Healthy):**
```json
{
  "proofs": [...],
  "isPro": false,
  "delayMinutes": 15,
  "scannedAt": "2026-02-08T12:34:56.789Z"
}
```

**Expected Response (Cold Start / No Proofs):**
```json
{
  "proofs": [],
  "isPro": false,
  "delayMinutes": 15,
  "scannedAt": "2026-02-08T12:34:56.789Z"
}
```

**2. Specific Token Endpoint:**
```bash
curl https://www.solrad.io/api/lead-time/{mint}
```

**Expected Response (Has Proofs):**
```json
{
  "mintEcho": "jupyiwry...",
  "proofs": [...],
  "stats": {...},
  "pendingObservation": null,
  "isPro": false,
  "delayMinutes": 15
}
```

**Expected Response (No Proofs Yet):**
```json
{
  "mintEcho": "jupyiwry...",
  "proofs": [],
  "stats": null,
  "pendingObservation": null,
  "isPro": false,
  "delayMinutes": 15
}
```

**3. Admin Debug Endpoint:**
```bash
curl -H "x-solrad-admin: YOUR_KEY" https://www.solrad.io/api/lead-time/debug
```

**Expected Response (Healthy):**
```json
{
  "ok": true,
  "ts": "2026-02-08T12:34:56.789Z",
  "env": {
    "nodeEnv": "production",
    "proMode": false,
    "qaSeed": false
  },
  "kvOk": true
}
```

**Expected Response (KV Issue):**
```json
{
  "ok": true,
  "ts": "2026-02-08T12:34:56.789Z",
  "env": {...},
  "kvOk": false,
  "kvError": "Connection timeout"
}
```

---

### Admin Checks (KV Direct Access)

**If you have direct KV access:**

1. **Check Last Writer Run:**
```bash
GET leadtime:last_writer_run_at
# Expected: ISO timestamp (recent)
```

2. **Check Last Writer Stats:**
```bash
GET leadtime:last_writer_stats
# Expected: JSON with scannedTokens, createdPending, createdProofs
```

3. **Check Recent Proofs:**
```bash
GET solrad:leadtime:recent
# Expected: Array of proof objects or null
```

4. **Check Pending Observations (Example):**
```bash
GET solrad:leadtime:observation:{some_mint}
# Expected: Observation object or null
```

---

### Widget Signals (UI Checks)

**Dashboard Right-Rail Widget:**

1. **Engine Status:**
   - Should show "Engine: Active"
   - Should show "API: OK" (if APIs responding)

2. **Last Scan Time:**
   - Should update every 5-15 minutes
   - If stale (>30min), may indicate ingestion issue

3. **Proof Counts:**
   - "Proofs today: X" (can be 0 in quiet markets)
   - "Proofs (7d): Y" (can be 0 in cold start)

4. **Last Proof Timing:**
   - "Last proof: Xm ago" (if proofs exist)
   - "Last proof: none yet" (if no proofs)

**Lead-Time Proofs Feed (Signals Page):**

1. **Empty State:**
   - Shows message: "No lead-time proofs recorded yet"
   - Shows: "The engine is active and scanning continuously"

2. **With Proofs:**
   - Shows scrollable list of tokens with lead times
   - Updates every 60 seconds

---

### Expected Empty States During Quiet Markets

**Normal Conditions for Zero Proofs:**

1. **Market Conditions:**
   - Low trading volume across all tokens
   - No significant price moves
   - No tokens meeting observation criteria

2. **Observation Criteria:**
   - No tokens with confidence ≥ 60
   - No score jumps ≥ +10 in last 60 minutes
   - No signal state upgrades

3. **Reaction Criteria:**
   - Observations created but no reactions within 60 minutes
   - Market not responding to on-chain activity

**This is Normal and Expected:**
- Engine does not force proofs
- Proofs are event-driven, not time-driven
- Zero proofs during quiet periods is correct behavior

---

### What NOT to Expect Immediately

**After Fresh Deployment:**

1. **No Proofs for First 60-90 Minutes:**
   - Observations need time to create
   - Reactions need time to occur
   - Minimum 10-second lead time required

2. **No Signal State Upgrades Initially:**
   - Requires historical signal state data
   - First ingestion cycle has no prior state to compare

3. **No Badges on Token Cards:**
   - Badges require completed proofs
   - Will not appear until first proof created

**During Low-Volume Periods:**

1. **Zero Proofs for Hours/Days:**
   - Perfectly normal during market downturns
   - Engine is passive, not active

2. **No Pending Observations:**
   - Requires tokens meeting strict criteria
   - May be zero during quiet markets

---

## 11. Current Status Snapshot

Based on current code review (February 2026):

### Engine State

- **Status:** Production (Active)
- **Integration Point:** `/lib/ingestion.ts` line 212-218
- **Execution:** Every ingestion cycle (non-blocking)
- **Error Handling:** Failures logged but do not halt ingestion

### API Health

**Endpoints Deployed:**
- ✅ `/api/lead-time/recent` - Public, working
- ✅ `/api/lead-time/{mint}` - Public, working
- ✅ `/api/lead-time/debug` - Admin-only, auth-protected

**Features:**
- ✅ QA Seed Mode (`LEAD_TIME_QA_SEED=1`)
- ✅ Free/Pro tier filtering
- ✅ 15-minute delay for Free users
- ✅ Cache-Control headers set

### KV Connectivity

**Keys in Use:**
- ✅ `solrad:leadtime:{mint}` - Per-token proofs
- ✅ `solrad:leadtime:stats:{mint}` - Per-token stats
- ✅ `solrad:leadtime:recent` - Global recent proofs
- ✅ `solrad:leadtime:observation:{mint}` - Pending observations
- ✅ `leadtime:last_writer_run_at` - Instrumentation
- ✅ `leadtime:last_writer_stats` - Instrumentation
- ✅ `leadtime:last_error` - Error tracking

**TTLs Configured:**
- ✅ 30 days for proofs and stats
- ✅ 7 days for recent proofs
- ✅ 6 hours for pending observations
- ✅ 24 hours for instrumentation

### Expected Reason Proofs May Be Zero Right Now

**Most Likely Reasons:**

1. **Market Conditions:** Low volatility, few score jumps or state upgrades
2. **Recent Deployment:** Cold start, no historical observations yet
3. **Reaction Window:** Observations pending, waiting for market reactions
4. **Criteria Strictness:** High confidence threshold (≥60) + significant thresholds

**Verification Steps:**

1. Check `leadtime:last_writer_run_at` - Should be recent
2. Check `leadtime:last_writer_stats` - Look at `scannedTokens`, `createdPending`, `createdProofs`
3. Check widget "Last scan" time - Should be within 30 minutes
4. Check for pending observations in KV

**This is Normal If:**
- Writer running regularly (timestamps updating)
- KV connectivity healthy (`kvOk: true` in debug endpoint)
- Market is quiet (low trading activity)

---

## 12. Explicit Non-Goals

The Lead-Time Proof Engine intentionally does NOT do the following:

### Trading and Financial

- ❌ Make buy/sell recommendations
- ❌ Provide trading signals
- ❌ Execute trades or automated actions
- ❌ Guarantee future performance
- ❌ Predict price movements
- ❌ Claim alpha generation

### Predictive Capabilities

- ❌ Forecast market reactions
- ❌ Predict which tokens will react
- ❌ Estimate reaction magnitude in advance
- ❌ Provide probability estimates for future events
- ❌ Claim prescience or foresight

### Real-Time Alerts

- ❌ Send push notifications for new observations
- ❌ Alert on pending observations
- ❌ Notify when proofs are created
- ❌ Email or SMS alerts (not implemented)

### Data Modification

- ❌ Alter historical proofs retroactively
- ❌ Delete valid proofs to improve metrics
- ❌ Inject synthetic proofs
- ❌ Modify observation or reaction thresholds dynamically

### Monetization Restrictions

- ❌ Sell proofs as financial advice
- ❌ License as trading signals
- ❌ Market as alpha generation
- ❌ Claim edge over institutional investors

### Operational Commitments

- ❌ Guarantee zero downtime
- ❌ Promise immediate proof creation
- ❌ Ensure observations always lead to reactions
- ❌ Maintain fixed observation/reaction thresholds permanently

### User Expectations

- ❌ Proofs will exist for every token
- ❌ Every observation will become a proof
- ❌ Proofs will appear within minutes of deployment
- ❌ More proofs = better system performance
- ❌ Proofs validate investment decisions

---

## Conclusion

The Lead-Time Proof Engine v1 is a passive, observational system that creates verifiable records of time intervals between on-chain events and market reactions. It makes no predictions, provides no guarantees, and operates strictly in read-only mode.

The system is healthy when:
- APIs respond with structured data (even if empty)
- Writer runs regularly (timestamps update)
- KV connectivity is stable (`kvOk: true`)
- Widget shows "Engine: Active"

Zero proofs during quiet markets is expected and correct behavior. The engine does not force proofs and remains passive until market conditions meet observation and reaction criteria.

---

**Document Version:** 1.0  
**Created:** February 2026  
**Maintained By:** SOLRAD Engineering  
**Review Cycle:** Quarterly or on major version changes

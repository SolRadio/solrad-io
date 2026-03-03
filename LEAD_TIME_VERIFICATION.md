# Lead-Time Proof Engine - Visual Verification Checklist

## Quick Visual Tests

### 1. Navigation Links
**Desktop Footer (xl breakpoint)**
```
About · Scoring · Score Lab · Research · Lead-Time · Contact
                                          ^^^^^^^^^^
                                          NEW LINK
```

**Mobile Footer**
```
Scoring
Score Lab
Research
Lead-Time  ← NEW
FAQ
Contact
...
```

✅ Both links point to `/lead-time-proof`
✅ Duplicate "Contact" removed

---

### 2. Token Card Badge
**Location:** Below risk badge (LOW/MED/HIGH)

**When Visible:** Only if `token._leadTimeBlocks >= 10`

**Expected Appearance:**
```
🕒 +{blocks}b DELAYED
```

**Colors by Confidence:**
- LOW: Yellow border/text
- MEDIUM: Blue border/text  
- HIGH: Green border/text

**Hover Tooltip:**
```
Lead-Time Proof
Observed on-chain behavior {X} blocks ({Y}m) before market reaction
Confidence: {HIGH/MEDIUM/LOW}
Pro users see real-time tracking
```

---

### 3. Token Detail Drawer Panel
**Location:** After price/volume/liquidity metrics, BEFORE "Safety Snapshot" section

**Empty State (no proofs):**
```
┌─────────────────────────────────────┐
│ 🕒 LEAD-TIME PROOF                  │
├─────────────────────────────────────┤
│ No lead-time observations recorded  │
│ for this token yet.                 │
└─────────────────────────────────────┘
```

**With Proofs:**
```
┌─────────────────────────────────────┐
│ 🕒 LEAD-TIME PROOF         [HIGH]   │
├─────────────────────────────────────┤
│ ⚠ Pro users see real-time tracking │
│   Data shown with 15min delay       │
├─────────────────────────────────────┤
│ Lead Time: +150 blocks              │
│ 2h 30m before market reaction       │
├─────────────────────────────────────┤
│ 👥 OBSERVED                         │
│ +75 holders in 0.8h                 │
│ Block #1,234,567                    │
├─────────────────────────────────────┤
│ 📈 MARKET REACTION                  │
│ Volume expanded 3.2x                │
│ Block #1,234,717                    │
├─────────────────────────────────────┤
│ Stats (if multiple proofs):         │
│ Total: 5  Avg: 120b  Min: 50b      │
└─────────────────────────────────────┘
```

---

### 4. Explanation Page (/lead-time-proof)

**Expected Sections:**
1. Hero with Clock icon + title
2. Trust-First Notice (Shield icon)
3. How It Works (2-column grid)
   - Observation Events (blue)
   - Reaction Events (green)
4. Lead-Time Calculation (formula + example)
5. Confidence Levels (3-column grid)
6. Access Tiers comparison
7. Disclaimer footer

**Key Visual Elements:**
- Clock icons throughout
- Color-coded badges (yellow/blue/green)
- Pro tier card highlighted with primary color
- Alert banners for important notices

---

## API Endpoint Tests

### Test 1: Get Lead-Time for Token
```bash
GET /api/lead-time/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

Expected Response:
{
  "proofs": [],
  "stats": null,
  "isPro": false,
  "delayMinutes": 15
}
```

### Test 2: Get Recent Proofs
```bash
GET /api/lead-time/recent?limit=10

Expected Response:
{
  "proofs": [],
  "isPro": false,
  "delayMinutes": 15
}
```

Note: Empty arrays are expected until block monitoring is connected.

---

## TypeScript Compilation

**No errors expected for:**
- `lib/lead-time/types.ts`
- `lib/lead-time/storage.ts`
- `lib/lead-time/detector.ts`
- `lib/lead-time/index.ts`
- `app/api/lead-time/[mint]/route.ts`
- `app/api/lead-time/recent/route.ts`
- `components/lead-time-badge.tsx`
- `components/lead-time-proof-panel.tsx`
- `components/token-card.tsx`
- `components/token-detail-drawer.tsx`
- `hooks/use-lead-time.ts`
- `app/lead-time-proof/page.tsx`

**Type Extensions:**
```typescript
// lib/types.ts
interface TokenScore {
  // ... existing fields
  _leadTimeBlocks?: number
  _leadTimeConfidence?: "LOW" | "MEDIUM" | "HIGH"
}
```

---

## Browser Console Tests

### Test Lead-Time Hook
```javascript
// Open token detail drawer
// Check console for:
console.log("[v0] Fetching lead-time for: {mint}")
```

### Test Badge Rendering
```javascript
// Token card should NOT show badge if _leadTimeBlocks < 10
// Token card SHOULD show badge if _leadTimeBlocks >= 10
```

---

## Regression Tests (Nothing Should Break)

✅ Token cards render normally without lead-time data
✅ Token detail drawer opens/closes normally
✅ Footer layout unchanged (only link added)
✅ No TypeScript errors in existing files
✅ No runtime errors on page load
✅ Token list filtering still works
✅ Search functionality unchanged
✅ Watchlist still functional

---

## Files Modified (All Changes Additive)

**NEW FILES (9):**
1. `/lib/lead-time/types.ts`
2. `/lib/lead-time/storage.ts`
3. `/lib/lead-time/detector.ts`
4. `/lib/lead-time/index.ts`
5. `/app/api/lead-time/[mint]/route.ts`
6. `/app/api/lead-time/recent/route.ts`
7. `/components/lead-time-badge.tsx`
8. `/components/lead-time-proof-panel.tsx`
9. `/hooks/use-lead-time.ts`
10. `/app/lead-time-proof/page.tsx`

**MODIFIED FILES (4):**
1. `/lib/types.ts` - Added 2 optional fields to TokenScore
2. `/components/token-card.tsx` - Added LeadTimeBadge import + conditional render
3. `/components/token-detail-drawer.tsx` - Added LeadTimeProofPanel + useLeadTime hook
4. `/components/footer.tsx` - Added "Lead-Time" link, removed duplicate "Contact"

**ZERO BREAKING CHANGES**

---

## Production Readiness

### Ready for Production ✅
- Type system complete
- Storage layer functional
- API routes operational
- UI components styled and responsive
- Trust-first language enforced
- Monetization hooks in place
- Documentation complete

### Needs Implementation 🚧
- Block monitoring (detector triggers)
- Pro user authentication
- Recent proofs index (sorted set)
- Real-time WebSocket connections
- Historical proof backfill

---

## Next Actions

1. **QA Testing** - Run visual verification checklist
2. **Load Testing** - Test API endpoints with sample data
3. **Integration** - Connect to block monitor
4. **Auth** - Implement Pro user detection
5. **Monitoring** - Add observability for proof creation rate

---

**Status: ✅ READY FOR QA**

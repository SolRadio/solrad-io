# SOLRAD Site-Wide Truthfulness Audit

**Date:** 2025-02-13
**Scope:** All `.tsx` UI files -- user-facing copy, source attribution, provider names
**Safety Guard:** Backend data plumbing (`lib/types.ts`, `token.heliusData`, API routes) intentionally untouched

---

## Executive Summary

Helius RPC was replaced with QuickNode but 11 UI-facing pages still referenced "Helius" (and one referenced "Birdeye") in user-visible copy, tooltips, and badge labels. All have been corrected. Zero backend/data code was modified.

---

## Findings

### A) Helius References in UI Copy (11 hits across 9 files -- ALL FIXED)

| File | Line(s) | Before | After |
|---|---|---|---|
| `app/(seo)/solana-gem-finder/page.tsx` | 191 | "on-chain Solana analytics via Helius RPC" | "via QuickNode RPC" |
| `app/(seo)/solana-token-scanner/page.tsx` | 166 | "Helius RPC, and Pump.fun APIs" | "QuickNode RPC, and Pump.fun APIs" |
| `app/(seo)/solana-trending/last-1h/page.tsx` | 319 | "DexScreener, Jupiter, and Helius" | "DexScreener, Jupiter, and on-chain sources via QuickNode RPC" |
| `app/ops/page.tsx` | 165-166 | "Helius Enrichment" / checks `HELIUS_API_KEY` | "QuickNode RPC" / checks `QUICKNODE_ENDPOINT` |
| `app/privacy/page.tsx` | 27 | "sourced from DexScreener and Helius APIs" | "sourced from DexScreener, QuickNode RPC, and on-chain data" |
| `app/privacy/page.tsx` | 38 | "Helius API (public blockchain data)" | "QuickNode RPC (public blockchain data)" |
| `app/research/ResearchClient.tsx` | 1620 | "Helius -- holder count, concentration" | "QuickNode RPC -- on-chain data, holder metrics" |
| `app/scoring/page.tsx` | 347 | "Helius: On-chain enrichment data" | "On-Chain (QuickNode RPC): Enrichment data" |
| `app/security/page.tsx` | 125-127 | "Helius On-Chain Enrichment" | "QuickNode On-Chain Data" |
| `components/sources-indicator.tsx` | 10, 16 | Badge "HL" / purple / tooltip "helius" | Badge "RPC" / cyan / tooltip "On-Chain (RPC)" |

### B) Birdeye References in UI Copy (1 hit -- FIXED)

| File | Line | Before | After |
|---|---|---|---|
| `app/(seo)/solana-token-scanner/page.tsx` | 436 | "Cross-reference with Dexscreener, Birdeye, etc." | "Cross-reference with DexScreener, Solscan, etc." |

### C) Allowed Exceptions (Backend -- NOT TOUCHED)

These contain `helius` as a data key or property name, not as user-visible text:

| File | Reason Left Alone |
|---|---|
| `lib/types.ts` | `SourceType = "dexscreener" \| "helius" \| "jupiter"` -- backend union type used across data layer |
| `components/token-detail-drawer.tsx` | 32 refs to `token.heliusData.*` -- reads enrichment data from backend, never displays "Helius" to users |
| `components/sources-indicator.tsx` | `helius:` as Record key -- maps to display label "RPC", never shown as "helius" |
| `app/api/ingest/**` | Backend ingest routes that call external APIs |
| `app/api/cron/**` | Cron job routes |
| `app/api/ops/**` | Admin API routes |
| `app/api/diagnostics/**` | Internal diagnostics |
| `app/api/health/route.ts` | Health check endpoint |
| `lib/adapters/birdeye.ts` | Birdeye adapter (disabled but retained for potential re-enable) |

### D) Wallet / Custody / Trading Claims

Searched for: `wallet.connect`, `connect.wallet`, `trading.execution`, `execute.trade`, `custody`

All instances found are consistent with SOLRAD's actual capability: **read-only analytics, no wallet connection, no trade execution, no custody.** Pages that mention this (about, faq, infrastructure, security) correctly frame SOLRAD as observation-only. No fixes needed.

### E) Design Consistency

Spot-checked Home (`/`), Research (`/research`), Proof Engine (`/proof-engine/ledger-hash`), SEO pages, and legal pages. All follow the established dark terminal aesthetic with consistent use of design tokens (`bg-card`, `text-foreground`, `text-muted-foreground`). SEO pages use intentionally larger typography for content marketing -- this is appropriate and not a consistency issue.

---

## Verification Commands

After deploy, confirm zero UI-facing Helius/Birdeye with:

```
# Should return 0 matches in .tsx files (excluding token-detail-drawer.tsx data access)
grep -rn "Helius\|HELIUS" --include="*.tsx" . | grep -v heliusData | grep -v "Record<SourceType"

# Should return 0 matches
grep -rn "Birdeye\|birdeye\|BIRDEYE" --include="*.tsx" .
```

## Pages to Visually Verify

- `/privacy` -- No Helius/Birdeye in third-party data section
- `/security` -- Shows "QuickNode On-Chain Data" in data sources grid
- `/scoring` -- Shows "On-Chain (QuickNode RPC)" in scoring methodology
- `/ops` -- Shows "QuickNode RPC" status row
- `/research` -- Sources expandable shows "QuickNode RPC"
- `/solana-gem-finder` -- "QuickNode RPC" in data pipeline paragraph
- `/solana-token-scanner` -- "QuickNode RPC" and "Solscan" in FAQ answers
- `/solana-trending/last-1h` -- "QuickNode RPC" in data freshness section
- Any token card with source badges -- Shows "RPC" cyan badge instead of "HL" purple

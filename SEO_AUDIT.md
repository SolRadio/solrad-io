# SOLRAD Complete SEO Audit

**Domain:** https://www.solrad.io
**Audit Date:** February 27, 2026
**Pages Audited:** 60 route files across the entire codebase

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Global SEO Configuration](#2-global-seo-configuration)
3. [Page-by-Page Metadata Audit](#3-page-by-page-metadata-audit)
4. [JSON-LD Structured Data Audit](#4-json-ld-structured-data-audit)
5. [Sitemap & Robots Audit](#5-sitemap--robots-audit)
6. [Technical SEO Issues](#6-technical-seo-issues)
7. [Content & Keyword Strategy](#7-content--keyword-strategy)
8. [Performance & Core Web Vitals](#8-performance--core-web-vitals)
9. [Internal Linking Audit](#9-internal-linking-audit)
10. [Prioritized Fix List](#10-prioritized-fix-list)

---

## 1. Executive Summary

### Overall SEO Health: B+ (Strong Foundation, Fixable Gaps)

SOLRAD has an unusually mature SEO implementation for a crypto intelligence platform. The codebase includes centralized metadata utilities (`lib/meta.ts`, `lib/seo.ts`), comprehensive JSON-LD structured data (`lib/schema.ts`), a chunked dynamic sitemap system, proper robots directives, and score-based token indexing logic. The site is well-positioned for organic discovery.

**Key Strengths:**
- Centralized metadata builder pattern (`buildMetadata`, `generatePageMetadata`)
- Rich JSON-LD schema graph on root layout (WebSite, WebApplication, FinancialService, Dataset, Organization, SiteNavigation)
- Dynamic token sitemaps with score >= 75 indexing threshold
- Per-page canonical URLs across nearly all routes
- OpenGraph + Twitter Card metadata on all major pages
- AI crawler blocking in robots.ts (GPTBot, ChatGPT-User, CCBot, anthropic-ai, Google-Extended)

**Key Issues to Fix (ranked by impact):**
1. **Missing OG images on several pages** (signals, alerts, intelligence, disclaimer, terms, privacy, wallets, watchlist)
2. **Inconsistent canonical URL formats** (some relative `/path`, some absolute `https://www.solrad.io/path`)
3. **Several pages missing from sitemap** (learn, insights, wallets, watchlist, score-lab, alerts)
4. **Homepage metadata partially duplicated** between layout.tsx and page.tsx with different descriptions
5. **Pro Hub indexed despite `robots: { index: false }`** but is in sitemap
6. **Whitepaper page missing OG image** in metadata export
7. **Missing `viewport` export** from layout.tsx (using manual `<meta>` instead of Next.js `viewport` export)
8. **Trending pages missing from sitemap-static** despite header rules in next.config.mjs

---

## 2. Global SEO Configuration

### 2.1 Root Layout (`app/layout.tsx`)

| Element | Value | Status |
|---------|-------|--------|
| `<html lang>` | `"en"` | OK |
| Default title | `"SOLRAD -- Solana Token Intelligence"` | OK (46 chars) |
| Title template | `"%s \| SOLRAD"` | OK |
| Default description | `"SOLRAD scores Solana tokens 0-100 using on-chain data..."` | OK (155 chars) |
| `metadataBase` | `https://www.solrad.io` | OK |
| `keywords` | 11 keywords defined | OK |
| `authors` | `[{ name: "SOLRAD Team" }]` | OK |
| `creator` / `publisher` | `"SOLRAD"` | OK |
| `formatDetection` | email/address/phone disabled | OK |
| `icons.icon` | SVG + PNG 64px + PNG 512px | OK |
| `icons.apple` | 180px PNG | OK |
| `icons.shortcut` | `/brand/favicon.png` | OK |
| OpenGraph image | `/brand/og-1200x630.png` (1200x630) | OK |
| Twitter card | `summary_large_image` | OK |
| Twitter creator/site | `@solrad_io` | OK |
| `robots` | index, follow, max-image-preview:large | OK |
| Canonical | `https://www.solrad.io` | OK |
| `generator` | `'v0.app'` | OK |
| Viewport | Manual `<meta>` tag in `<head>` | **ISSUE** - Should use Next.js `viewport` export |
| Web manifest | `<link rel="manifest" href="/site.webmanifest">` | OK |
| DNS prefetch | Google Fonts, Vercel Analytics | OK |
| JSON-LD | Combined schema graph (6 schemas) | OK |

**Issue:** The viewport is set via a manual `<meta>` tag in `<head>` instead of using Next.js `metadata.viewport` or a `viewport` export. This works but Next.js may override it unpredictably in production.

### 2.2 Metadata Utility Files

| File | Purpose | Status |
|------|---------|--------|
| `lib/seo.ts` | Title/description/canonical builders, SEO constants | OK |
| `lib/meta.ts` | `buildMetadata()`, `generatePageMetadata()`, `generateArticleMetadata()` | OK |
| `lib/schema.ts` | All JSON-LD generators (12+ functions) | OK |

**Note:** Two parallel systems exist (`lib/seo.ts` and `lib/meta.ts`). Some pages use `buildMetadata()` from meta.ts, others manually define metadata. This isn't a bug but creates inconsistency.

### 2.3 `next.config.mjs`

| Setting | Value | Status |
|---------|-------|--------|
| `X-Robots-Tag` header (all pages) | `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1` | OK |
| Sitemap cache | `s-maxage=3600, stale-while-revalidate=86400` | OK |
| SEO landing page cache | `s-maxage=86400, stale-while-revalidate=604800` | OK |
| Trending page cache | `s-maxage=3600, stale-while-revalidate=7200` | OK |
| `optimizePackageImports` | `['lucide-react', '@radix-ui/react-icons']` | OK |
| `compress` | `true` | OK |
| `images.unoptimized` | `true` | **ISSUE** - Disables Next.js Image Optimization (hurts LCP) |

### 2.4 `site.webmanifest`

| Field | Value | Status |
|-------|-------|--------|
| `name` | `"SOLRAD - Solana Token Scanner"` | OK |
| `short_name` | `"SOLRAD"` | OK |
| `display` | `"standalone"` | OK |
| `theme_color` | `"#000000"` | OK |
| `icons` | 512px + 180px | OK |

---

## 3. Page-by-Page Metadata Audit

### 3.1 Core Pages

#### `/` (Homepage)

| Element | Value | Status |
|---------|-------|--------|
| Title | `"SOLRAD -- Solana Token Intelligence Terminal"` | OK (49 chars) |
| Description | `"SOLRAD scores every active Solana token 0-100..."` (155 chars) | OK |
| Canonical | `https://www.solrad.io` | OK |
| OG title | `"SOLRAD -- Solana Token Intelligence"` | OK |
| OG image | `/brand/og-1200x630.png` | OK |
| Twitter card | `summary_large_image` | OK |
| H1 tag | Rendered by `HomeClient` (client component) | **VERIFY** - Ensure H1 exists in client render |

**Issue:** The page.tsx metadata `description` differs from layout.tsx default. This is fine (page overrides layout) but the descriptions say slightly different things. Ensure the page-level description is the one you want Google to use.

#### `/about`

| Element | Value | Status |
|---------|-------|--------|
| Title | `"About SOLRAD \| Solana Token Intelligence"` | OK (43 chars) |
| Description | `"SOLRAD is a read-only Solana token intelligence terminal..."` (160 chars) | OK |
| Keywords | 9 keywords defined | OK |
| Canonical | `https://www.solrad.io/about` | OK |
| OG image | `https://www.solrad.io/brand/og-1200x630.png` (absolute) | OK |
| Twitter image | `https://www.solrad.io/brand/twitter-1200x630.png` | OK |
| JSON-LD | Organization + WebApplication + Breadcrumb + WebPage | OK |
| H1 | `"Built to show what's about to trend."` | OK |

**Note:** About page has TWO separate `<script type="application/ld+json">` blocks. Combine into one `@graph` for cleanliness.

#### `/scoring`

| Element | Value | Status |
|---------|-------|--------|
| Title | `"SOLRAD Scoring Methodology \| Intelligence Framework"` | OK (53 chars) |
| Description | Present | OK |
| Canonical | `https://www.solrad.io/scoring` | OK |
| OG | Present | OK |
| Twitter | Present | OK |
| H1 | Present | OK |

#### `/browse`

| Element | Value | Status |
|---------|-------|--------|
| Title | `"Browse Tokens -- SOLRAD Token Pool"` | OK |
| Description | Present | OK |
| Canonical | `https://www.solrad.io/browse` | OK |
| H1 | Present | OK |

#### `/faq`

| Element | Value | Status |
|---------|-------|--------|
| Title | `"FAQ \| SOLRAD -- Solana Token Intelligence"` | OK |
| Description | Present | OK |
| Canonical | `https://www.solrad.io/faq` | OK |
| H1 | `"Frequently Asked Questions"` | OK |

#### `/pro`

| Element | Value | Status |
|---------|-------|--------|
| Title | `"SOLRAD Pro -- Advanced Solana Intelligence"` | OK |
| Description | `"Unlock elite Solana insights..."` | OK |
| Keywords | Present | OK |
| Canonical | `https://www.solrad.io/pro` | OK |
| OG | Present (no image specified -- falls back to layout) | **MINOR** - Add explicit OG image |
| JSON-LD | Breadcrumb + Pro FAQ schema | OK |

#### `/signals`

| Element | Value | Status |
|---------|-------|--------|
| Title | `"Signal Outcomes \| SOLRAD"` | OK |
| Description | `"Recent signal outcomes and win/loss performance..."` | OK |
| Canonical | `https://www.solrad.io/signals` | OK |
| OG | Title + description present, **no image** | **ISSUE** - Missing OG image |
| Twitter | **Missing entirely** | **ISSUE** |
| H1 | Rendered by `SignalsClient` | **VERIFY** |

#### `/research`

| Element | Value | Status |
|---------|-------|--------|
| Title | `"Proof Engine -- Alpha Ledger \| SOLRAD"` | OK |
| Description | `"Append-only alpha ledger of SOLRAD Solana token signals..."` | OK |
| Keywords | 8 keywords | OK |
| Canonical | Uses `buildMetadata` with `path: "/research"` | OK |
| JSON-LD | WebPage schema inline | OK |
| H1 | Rendered by `ResearchClient` | **VERIFY** |

#### `/contact`

| Element | Value | Status |
|---------|-------|--------|
| Title | `"Contact \| SOLRAD Solana Intelligence"` | OK |
| Description | Present | OK |
| Canonical | `https://www.solrad.io/contact` | OK |
| OG | Present | OK |
| Twitter | `card: "summary"` (not `summary_large_image`) | **MINOR** - Inconsistent with other pages |
| H1 | Present | OK |

### 3.2 Proof & Verification Pages

#### `/proof-protocol`

| Element | Value | Status |
|---------|-------|--------|
| Title | `"Proof Protocol \| SOLRAD"` (from layout.tsx) | OK |
| Description | `"Verified on-chain signal detection proof..."` | OK |
| Canonical | `https://www.solrad.io/proof-protocol` | OK |
| OG image | `/brand/og-1200x630.png` | OK |
| Twitter | Present | OK |
| H1 | Present (in client component page.tsx) | OK |

**Note:** This is a `"use client"` page with metadata in a sibling `layout.tsx`. This is the correct Next.js pattern.

#### `/whitepaper`

| Element | Value | Status |
|---------|-------|--------|
| Title | `"Whitepaper \| SOLRAD Proof Protocol"` | OK |
| Description | `"Full technical specification for SOLRAD Proof Protocol..."` | OK |
| Canonical | `https://www.solrad.io/whitepaper` | OK |
| OG | **Missing entirely** | **ISSUE** |
| Twitter | **Missing entirely** | **ISSUE** |
| H1 | `"SOLRAD PROOF PROTOCOL"` | OK |

#### `/saw-it-first`

| Element | Value | Status |
|---------|-------|--------|
| Title | `"SOLRAD Saw It First -- Verified Early Detection Leaderboard"` | OK (60 chars - at limit) |
| Description | `"Every token SOLRAD scored before it trended on DexScreener..."` | OK |
| Canonical | `https://www.solrad.io/saw-it-first` | OK |
| OG image | `https://www.solrad.io/brand/og-1200x630.png` (absolute) | OK |
| Twitter image | `https://www.solrad.io/brand/twitter-1200x630.png` (absolute) | OK |
| H1 | Present | OK |

#### `/lead-time-proof`

| Element | Value | Status |
|---------|-------|--------|
| Title | `"Lead-Time Proof Engine \| SOLRAD"` | OK |
| Description | Present | OK |
| Canonical | `https://www.solrad.io/lead-time-proof` | OK |
| OG | Title + description present, **no image** | **ISSUE** |
| Twitter | **Missing** | **ISSUE** |
| H1 | Present | OK |

### 3.3 SEO Landing Pages (Keyword-Targeted)

#### `/solana-gem-finder` (via `(seo)` route group)

| Element | Value | Status |
|---------|-------|--------|
| Title | `"Solana Gem Finder \| Early Token Discovery \| SOLRAD"` | OK (52 chars) |
| Description | Present | OK |
| Canonical | `https://www.solrad.io/solana-gem-finder` | OK |
| OG | Present with image | OK |
| Twitter | Present | OK |
| H1 | Present | OK |

#### `/solana-token-scanner` (via `(seo)` route group)

| Element | Value | Status |
|---------|-------|--------|
| Title | `"Solana Token Scanner \| Instant Risk Analysis & Liquidity Monitoring"` | **ISSUE** - 68 chars (exceeds 60 char limit) |
| Description | Present with keywords array | OK |
| Canonical | `https://www.solrad.io/solana-token-scanner` | OK |
| OG | Present | OK |
| Twitter | Present | OK |
| H1 | Present | OK |

#### `/solana-meme-coin-scanner` (direct route, NOT in `(seo)` group)

| Element | Value | Status |
|---------|-------|--------|
| Title | `"Solana Meme Coin Scanner - Track Trending Solana Tokens"` | OK (56 chars) |
| Canonical | `https://www.solrad.io/solana-meme-coin-scanner` | OK |
| OG | Present | OK |
| Twitter | Present | OK |
| H1 | Present | OK |

**Structural Issue:** Some SEO landing pages are in the `(seo)` route group (gem-finder, token-scanner, trending/*) while others are direct routes (meme-coin-scanner, risk-checker, token-dashboard, wallet-tracker). This creates inconsistency but doesn't affect SEO since `(seo)` is a route group that doesn't appear in the URL.

#### `/solana-risk-checker`

| Element | Value | Status |
|---------|-------|--------|
| Title | `"Solana Risk Checker - Analyze Token Safety & Rug Pull Risk"` | OK (59 chars) |
| Canonical | `https://www.solrad.io/solana-risk-checker` | OK |
| All metadata | Present | OK |

#### `/solana-token-dashboard`

| Element | Value | Status |
|---------|-------|--------|
| Title | `"Solana Token Dashboard - Real-Time Analytics & Market Intelligence"` | **ISSUE** - 67 chars (exceeds 60) |
| Canonical | `https://www.solrad.io/solana-token-dashboard` | OK |
| All metadata | Present | OK |

#### `/solana-wallet-tracker`

| Element | Value | Status |
|---------|-------|--------|
| Title | `"Solana Wallet Tracker \| Smart Money Flows \| SOLRAD"` | OK (52 chars) |
| Canonical | `https://www.solrad.io/solana-wallet-tracker` | OK |
| All metadata | Present | OK |

### 3.4 Trending Sub-Pages (via `(seo)` route group)

All 6 trending pages (`by-holders`, `by-liquidity`, `by-volume`, `last-1h`, `last-6h`, `last-24h`) have:
- Unique titles with keyword targeting
- Unique descriptions
- Canonical URLs
- OG + Twitter metadata
- ItemList JSON-LD schemas
- H1 tags

**Status: All OK**

### 3.5 Legal & Info Pages

| Page | Title | Description | Canonical | OG | Twitter | H1 |
|------|-------|-------------|-----------|----|---------|----|
| `/privacy` | OK | OK | **Relative** `/privacy` | OK | OK | OK |
| `/terms` | OK | OK | **Relative** `/terms` | OK | OK | OK (verify) |
| `/disclaimer` | OK | OK | **Relative** `/disclaimer` | OK | OK | OK |
| `/security` | OK | OK | `https://www.solrad.io/security` | OK | OK | OK |

**Issue:** Privacy, terms, and disclaimer use **relative** canonical paths (`/privacy`, `/terms`, `/disclaimer`) instead of absolute URLs. With `metadataBase` set in layout.tsx, Next.js should resolve these correctly, but explicit absolute URLs are more reliable and consistent with the rest of the site.

### 3.6 Tool/Feature Pages

| Page | Title | Description | Canonical | OG Image | Twitter |
|------|-------|-------------|-----------|----------|---------|
| `/tracker` | OK | OK | OK (absolute) | Falls back to layout | Falls back |
| `/alerts` | OK | OK | **Relative** `/alerts` | **Missing** | OK (no image) |
| `/intelligence` | OK | OK | **Relative** `/intelligence` | **Missing** | OK (no image) |
| `/wallets` | OK | OK | **Relative** `/wallets` | **Missing** | `card: "summary"` |
| `/watchlist` | OK | OK | **Relative** `/watchlist` | **Missing** | `card: "summary"` |
| `/score-lab` | OK | OK | **Relative** `/score-lab` | **Missing** | OK (no image) |

**Issues:**
- 6 pages use relative canonical paths
- 6 pages missing explicit OG images
- Wallets/watchlist use `summary` card instead of `summary_large_image`

### 3.7 Dynamic Pages

#### `/token/[address]`

| Element | Value | Status |
|---------|-------|--------|
| Title | `"${symbol} (${name}) -- SOLRAD Solana Token Intelligence"` | OK (dynamic) |
| Description | Dynamic per token | OK |
| Canonical | `${siteUrl}/token/${canonicalMint}` (normalized) | OK |
| Index rule | Score >= 75: index; Score < 75: noindex, follow | OK |
| OG | **Missing from generateMetadata** | **ISSUE** |
| JSON-LD | FinancialProduct + FAQ + Breadcrumb (combined) | OK |

**Issue:** The `generateMetadata` function for token pages doesn't set OG image or Twitter card metadata. These will fall back to the layout defaults, which is acceptable but not optimal for social sharing of individual token pages.

#### `/learn/[slug]`

| Element | Value | Status |
|---------|-------|--------|
| Title | Dynamic from article | OK |
| Description | Dynamic from article | OK |
| Keywords | `article.keywords.join(", ")` | OK |
| Canonical | `https://www.solrad.io/learn/${slug}` | OK |
| OG | Present with `type: "article"` | OK |
| Twitter | Present | OK |

#### `/insights/[slug]`

| Element | Value | Status |
|---------|-------|--------|
| Title | Dynamic via `buildTitle()` | OK |
| Description | Dynamic via `buildDescription()` | OK |
| Canonical | `buildMetadata` with `/insights/${slug}` path | OK |

#### `/research/daily/[date]`

| Element | Value | Status |
|---------|-------|--------|
| Title | Dynamic from report | OK |
| Description | Dynamic from report summary | OK |
| Canonical | `https://www.solrad.io/research/daily/${date}` | OK |
| `generateStaticParams` | Present (ISR) | OK |
| JSON-LD | Article + Breadcrumb schema | OK |

### 3.8 Auth Pages

| Page | Metadata | Index Status |
|------|----------|-------------|
| `/sign-in` | Clerk default | Should be noindex |
| `/sign-up` | Clerk default | Should be noindex |

**Issue:** Sign-in and sign-up pages likely use Clerk's default metadata. They should have explicit `robots: { index: false, follow: false }` to prevent indexing of auth pages.

### 3.9 Admin/Ops Pages

| Page | Index Status |
|------|-------------|
| `/admin/*` (7 pages) | Blocked by robots.ts `/admin/` disallow |
| `/ops` | Blocked by robots.ts `/ops/` disallow |
| `/admin-cache-control` | **NOT blocked** -- path doesn't match `/admin/` pattern |

**Issue:** `/admin-cache-control` is a top-level route that doesn't match the `/admin/` disallow pattern in robots.ts. It should be either moved under `/admin/` or explicitly disallowed.

### 3.10 Pro Hub

| Element | Value | Status |
|---------|-------|--------|
| Title | `"Pro Hub \| SOLRAD"` | OK |
| Description | Present | OK |
| Canonical | **Relative** `/pro-hub` | Minor |
| `robots` | `{ index: false, follow: false }` | OK |
| In sitemap? | **Yes** (priority 0.7) | **ISSUE** |

**Issue:** Pro Hub has `robots: { index: false }` but is included in `sitemap-static.xml.ts` with priority 0.7. This sends conflicting signals to search engines. Remove it from the sitemap since it requires auth and is noindex.

---

## 4. JSON-LD Structured Data Audit

### 4.1 Root Layout Schema Graph

The root layout injects a combined `@graph` with 6 schemas:

| Schema Type | Status | Notes |
|-------------|--------|-------|
| `WebSite` with `SearchAction` | OK | Points to `/browse?q={search_term_string}` |
| `WebApplication` + `SoftwareApplication` | OK | Free app, feature list |
| `FinancialService` | OK | Service type, audience |
| `Dataset` | OK | Token dataset with temporal coverage |
| `Organization` | OK | Logo, sameAs (Twitter/X) |
| `SiteNavigationElement` | OK | 8 navigation items |

**Issues:**
- `Dataset.distribution.contentUrl` points to `/api/index` which is disallowed in robots.ts. Google may flag this as inaccessible.
- `Dataset.temporalCoverage` says `"2024-.."` but the project launched in Feb 2026. Update to `"2026-.."`.
- `Organization.sameAs` has both `twitter.com/solrad_io` and `x.com/solrad_io`. Keep only `x.com` (canonical).

### 4.2 Per-Page JSON-LD

| Page | Schema Types | Status |
|------|-------------|--------|
| `/about` | Organization + WebApplication + Breadcrumb + WebPage | **ISSUE** - Two separate `<script>` tags instead of one `@graph` |
| `/pro` | Breadcrumb + Pro FAQ | OK |
| `/token/[address]` | FinancialProduct + FAQ + Breadcrumb (combined) | OK |
| `/faq` | Static FAQ schema | OK |
| `/research` | WebPage | OK |
| `/research/daily/[date]` | Article + Breadcrumb | OK |
| `/scoring` | (not checked in detail) | Verify |
| `/browse` | ItemList (paginated) | OK |
| Trending pages | ItemList per metric | OK |

### 4.3 Token Schema Quality

The `generateTokenFinancialProductSchema` function:
- Uses `aggregateRating` converting SOLRAD score (0-100) to 0-5 scale | OK
- Sets `ratingCount: "1"` and `reviewCount: "1"` | **ISSUE** - Google may flag this as thin/self-review
- Includes price as `Offer` | OK
- Uses `dateModified: now` (updates every render) | OK

The `generateTokenFAQSchema` function:
- Generates 5 dynamic Q&A pairs per token | OK
- Includes contract address in "How to buy" answer | OK
- References specific SOLRAD score breakdown | OK

---

## 5. Sitemap & Robots Audit

### 5.1 Sitemap Architecture

```
/sitemap.xml (index)
  /sitemap-static.xml (28 static pages)
  /sitemap-tokens-0.xml (tokens 0-499, score >= 75 only)
  /sitemap-tokens-1.xml (tokens 500-999, if needed)
  ...
```

**Status:** Excellent architecture. Dynamic chunking based on indexable token count.

### 5.2 Sitemap Coverage Gaps

Pages **in sitemap** that **should NOT be**:
| Page | Reason |
|------|--------|
| `/pro-hub` | `robots: { index: false }` -- conflicting signal |

Pages **NOT in sitemap** that **should be**:
| Page | Reason |
|------|--------|
| `/learn` | High-value content hub, indexable |
| `/learn/[slug]` articles | Content pages, should have dynamic sitemap |
| `/insights/[slug]` articles | Content pages, should have dynamic sitemap |
| `/wallets` | Public feature page |
| `/watchlist` | Public feature page |
| `/score-lab` | Public analytics page |
| `/alerts` | Public feature page |
| `/solana-trending/*` (6 pages) | In `(seo)` group but missing from sitemap |
| `/research/daily/*` | Dynamic content, should have research sitemap |
| `/research/weekly/*` | Dynamic content, should have research sitemap |
| `/research/token/*/*` | Dynamic content pages |
| `/learn/category/*` | Category hub pages |

### 5.3 Robots.txt

| Rule | Status |
|------|--------|
| Allow `/` and key paths | OK |
| Disallow `/api/`, `/admin/`, `/ops/`, `/_next/` | OK |
| Block AI crawlers | OK (GPTBot, ChatGPT-User, CCBot, anthropic-ai, Google-Extended) |
| Sitemap reference | `https://www.solrad.io/sitemap.xml` | OK |
| Host | `https://www.solrad.io` | OK |

**Issues:**
- `/admin-cache-control` is not covered by `/admin/` disallow (it's a top-level route)
- Allow list includes `/learn/` and `/insights/` but these are also missing from the sitemap
- `/pro-hub` is allowed in robots.txt but has `noindex` meta tag

---

## 6. Technical SEO Issues

### 6.1 Canonical URL Inconsistencies

The site uses two canonical formats:

**Absolute URLs (preferred):**
```
alternates: { canonical: "https://www.solrad.io/about" }
```

**Relative paths (also used):**
```
alternates: { canonical: "/alerts" }
alternates: { canonical: "/privacy" }
```

Pages using **relative** canonical paths:
- `/alerts`, `/intelligence`, `/privacy`, `/terms`, `/disclaimer`, `/wallets`, `/watchlist`, `/score-lab`, `/pro-hub`

While `metadataBase` in layout.tsx should resolve these correctly, **best practice is absolute URLs everywhere** for clarity and to avoid edge cases.

### 6.2 OG Image Coverage

| Coverage | Pages |
|----------|-------|
| Explicit OG image | ~20 pages | 
| Falls back to layout default | ~15 pages |
| No OG at all | `/whitepaper`, some feature pages |

Pages missing **any** OG metadata:
- `/whitepaper` - No OG or Twitter block
- `/lead-time-proof` - No OG image, no Twitter block

### 6.3 Title Length Analysis

| Page | Title Length | Status |
|------|------------|--------|
| `/solana-token-scanner` | 68 chars | **Over limit** (60 recommended) |
| `/solana-token-dashboard` | 67 chars | **Over limit** |
| `/saw-it-first` | 60 chars | At limit |
| Most others | 30-55 chars | OK |

### 6.4 Description Length Analysis

Most descriptions are within the 150-160 char optimal range. The centralized `buildDescription()` function enforces a 160 char max with truncation.

### 6.5 Image Optimization

`images.unoptimized: true` in next.config.mjs disables Next.js Image Optimization. This means:
- No automatic WebP/AVIF conversion
- No responsive sizing
- No lazy loading optimization
- Potential LCP degradation

This is likely set because of remote image patterns, but it affects ALL images including local brand assets.

### 6.6 Client-Side Rendering Concerns

Several pages use `"use client"` at the page level:
- `/proof-protocol/page.tsx` - Has metadata in layout.tsx (correct pattern)
- `HomeClient` - Metadata in page.tsx RSC wrapper (correct pattern)

All other pages properly use RSC for metadata with client components for interactivity.

---

## 7. Content & Keyword Strategy

### 7.1 Primary Keywords (from metadata.keywords in layout.tsx)

```
Solana token scanner, Solana gems, Solana intelligence, find Solana gems,
track Solana wallets, Solana risk analysis, Solana token analytics,
DexScreener, Solana trending tokens, Solana on-chain data, token radar
```

### 7.2 SEO Landing Page Keyword Mapping

| Landing Page | Target Keywords | Status |
|-------------|----------------|--------|
| `/solana-gem-finder` | solana gem finder, early token discovery | OK |
| `/solana-token-scanner` | solana token scanner, risk analysis, liquidity monitoring | OK |
| `/solana-meme-coin-scanner` | solana meme coin scanner, trending tokens | OK |
| `/solana-risk-checker` | solana risk checker, rug pull risk, token safety | OK |
| `/solana-token-dashboard` | solana token dashboard, analytics, market intelligence | OK |
| `/solana-wallet-tracker` | solana wallet tracker, smart money, whale wallets | OK |

### 7.3 Trending Pages Keyword Coverage

| Page | Keywords Targeted |
|------|------------------|
| `/solana-trending/by-holders` | solana tokens by holders, most holders |
| `/solana-trending/by-liquidity` | solana tokens by liquidity, highest liquidity |
| `/solana-trending/by-volume` | solana tokens by volume, highest trading volume |
| `/solana-trending/last-1h` | trending solana tokens last hour |
| `/solana-trending/last-6h` | trending solana tokens last 6 hours |
| `/solana-trending/last-24h` | trending solana tokens last 24 hours |

### 7.4 Content Hubs

| Hub | Articles | Sitemap Entry | Internal Links |
|-----|----------|---------------|----------------|
| `/learn` | Multiple static articles via `lib/learn-articles` | **Missing** | Footer links present |
| `/learn/[slug]` | Dynamic article pages | **Missing** | Breadcrumb + related |
| `/insights/[slug]` | Auto-generated from token data | **Missing** | Token page links |
| `/research` | Daily/weekly/token reports | Root page in sitemap | Internal links present |

---

## 8. Performance & Core Web Vitals

### 8.1 DNS Prefetch & Preconnect

```html
<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link rel="dns-prefetch" href="https://vercel-insights.com" />
<link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />
```

**Status:** OK - Good practice for font loading and analytics.

### 8.2 Font Loading

Uses `next/font/google` for Geist and Geist Mono with proper subsetting. Font variables configured in globals.css via `@theme inline`. **Status: OK**

### 8.3 Package Optimization

`optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']` - Good for tree-shaking icon libraries.

### 8.4 Compression

`compress: true` enabled. **Status: OK**

---

## 9. Internal Linking Audit

### 9.1 Footer Links (Crawlable)

Desktop footer includes 13 links:
About, FAQ, Learn, Security, Privacy, Terms, Scoring, Score Lab, Research, Saw It First, Proof Protocol, Whitepaper, Contact

Mobile footer includes 14 links (adds Disclaimer, removes Score Lab from accordion).

**Missing from footer:** Infrastructure, Alerts, Intelligence, Wallets, Watchlist, Pro, Browse, Tracker, Trending pages

### 9.2 Navbar Links

The navbar includes: Dashboard (/), Browse, Trending, Signals, Tracker, Scoring, About, FAQ

### 9.3 Cross-Page Internal Links

The `/about` page links to: `/research`, `/saw-it-first`, `/signals`, `/scoring`
The `/scoring` page links to: (verify -- not fully read)
Footer "About" accordion links to: `/`, `/tracker`, `/scoring`

### 9.4 Orphan Pages (No Internal Links Found)

These pages may be difficult for crawlers to discover:
- `/infrastructure` - Not in navbar or footer
- `/intelligence` - Not in navbar or footer
- `/alerts` - Not in navbar or footer
- `/lead-time-proof` - Not in navbar or footer (linked from about page)

---

## 10. Prioritized Fix List

### Critical (Immediate Impact on Indexing/Rankings)

| # | Issue | Pages Affected | Fix |
|---|-------|---------------|-----|
| 1 | **Remove `/pro-hub` from sitemap** | sitemap-static.xml.ts | Delete the entry (it has `noindex`) |
| 2 | **Add `/learn`, trending, and content pages to sitemap** | sitemap-static.xml.ts + new dynamic sitemap | Add `/learn`, `/solana-trending/*` (6 pages), `/alerts`, `/wallets`, `/watchlist`, `/score-lab` to static sitemap; create `sitemap-learn.xml.ts` and `sitemap-research.xml.ts` for dynamic content |
| 3 | **Add `noindex` to auth pages** | `/sign-in`, `/sign-up` | Add `robots: { index: false, follow: false }` metadata |
| 4 | **Block `/admin-cache-control`** | robots.ts | Add `/admin-cache-control` to disallow list |
| 5 | **Fix Dataset temporal coverage** | lib/schema.ts | Change `"2024-.."` to `"2026-.."` |

### High (Social Sharing & Rich Results)

| # | Issue | Pages Affected | Fix |
|---|-------|---------------|-----|
| 6 | **Add OG + Twitter to `/whitepaper`** | whitepaper/page.tsx | Add `openGraph` and `twitter` to metadata export |
| 7 | **Add OG image to `/signals`** | signals/page.tsx | Add `images` to OG metadata |
| 8 | **Add Twitter card to `/signals`** | signals/page.tsx | Add `twitter` block |
| 9 | **Add OG + Twitter to `/lead-time-proof`** | lead-time-proof/page.tsx | Add `images` to OG, add `twitter` block |
| 10 | **Add explicit OG images to feature pages** | alerts, intelligence, wallets, watchlist, score-lab | Add `images` array to OG metadata |
| 11 | **Shorten over-length titles** | solana-token-scanner (68), solana-token-dashboard (67) | Trim to under 60 chars |

### Medium (Consistency & Best Practices)

| # | Issue | Pages Affected | Fix |
|---|-------|---------------|-----|
| 12 | **Standardize canonical URLs to absolute** | 9 pages with relative paths | Change all `canonical: "/path"` to `canonical: "https://www.solrad.io/path"` |
| 13 | **Standardize Twitter card type** | contact, wallets, watchlist | Change `card: "summary"` to `card: "summary_large_image"` for consistency |
| 14 | **Consolidate About page JSON-LD** | about/page.tsx | Merge two `<script>` tags into one `@graph` |
| 15 | **Remove duplicate Organization.sameAs** | lib/schema.ts | Keep only `https://x.com/solrad_io`, remove `twitter.com` variant |
| 16 | **Update Dataset distribution URL** | lib/schema.ts | Point to a publicly accessible URL (not blocked by robots) or remove |
| 17 | **Use Next.js viewport export** | app/layout.tsx | Replace manual `<meta name="viewport">` with `export const viewport` |

### Low (Nice-to-Have)

| # | Issue | Pages Affected | Fix |
|---|-------|---------------|-----|
| 18 | **Consider enabling image optimization** | next.config.mjs | Set `unoptimized: false` or configure selective optimization |
| 19 | **Add OG image to `/pro`** | pro/page.tsx | Add explicit `images` array |
| 20 | **Review `aggregateRating` for tokens** | lib/schema.ts | Consider removing `ratingCount: "1"` to avoid Google quality flags |
| 21 | **Add Infrastructure to footer/navbar** | components/footer.tsx, navbar.tsx | Add internal link for crawlability |
| 22 | **Add orphan pages to navigation** | alerts, intelligence, lead-time-proof | Add to footer or create hub page |
| 23 | **Unify metadata patterns** | Various | Migrate all pages to use `buildMetadata()` from `lib/meta.ts` |

---

*End of audit. 60 page routes analyzed across 25+ metadata dimensions.*

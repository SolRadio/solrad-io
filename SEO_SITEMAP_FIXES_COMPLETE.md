# Technical SEO Sitemap Fixes - Complete

**Date**: 2025-01-29
**Goal**: Fix sitemap quality to reduce "Discovered – currently not indexed" issues in Google Search Console

---

## Summary of Changes

### TASK A ✅ - Dynamic Sitemap Index (`/app/sitemap.ts`)
**Problem**: Hard-coded token sitemap chunks didn't scale with actual token count
**Solution**: 
- Made sitemap index async to fetch actual token count
- Generate sitemap-tokens-{N}.xml dynamically based on `Math.ceil(totalTokens / 500)`
- Use stable `lastModified` from token index cache instead of `new Date()` per request
- Prevents stale sitemap entries and adapts to token growth

**Impact**: Sitemap index now scales automatically from 0 to N chunks based on real data

---

### TASK B ✅ - Static Sitemap Quality (`/app/sitemap-static.xml/route.ts`)
**Problem**: Every page had `lastModified: now` causing false freshness signals; `/score-lab` included despite noindex
**Solution**:
- Replaced all `now` with `stableDate` (today at 00:00:00 UTC) for consistent daily lastmod
- Removed `/score-lab` from sitemap (noindex page shouldn't be in sitemap)
- Research pages use their actual date (stable per day)

**Impact**: Cleaner lastmod signals for Googlebot; no noindex pages in sitemap

---

### TASK C ✅ - Token Sitemap Quality Filtering
**Files**: `/app/sitemap-tokens-0.xml/route.ts`, `/app/sitemap-tokens-1.xml/route.ts`

**Problem**: All tracked tokens included regardless of quality; string-only tokens with unknown scores; invalid mints not validated
**Solution**:
- Filter tokens to **only include score >= 75** before chunking
- Exclude string-only tokens (unknown score) from sitemap
- Validate `tokenMint` is valid string with min length 32 before emitting `<loc>`
- Empty string mints filtered out via `.filter(Boolean)`

**Impact**: Sitemap now only includes high-quality, indexable tokens (score >= 75); prevents low-quality URLs from bloating index

---

### TASK D ✅ - OG/Twitter Image Standardization
**Files**: `/app/layout.tsx`, `/app/token/[address]/page.tsx`

**Problem**: Mixed use of `/solrad.png`, `/twitter-image.png`, blob URLs; inconsistent social preview assets
**Solution**:
- Standardized all OG images to: `https://www.solrad.io/brand/og-1200x630.png`
- Standardized all Twitter images to: `https://www.solrad.io/brand/twitter-1200x630.png`
- Updated both Metadata export and explicit `<meta>` tags in `<head>`

**Impact**: Consistent, high-quality social preview images across all pages; no more broken/missing OG images

---

### TASK E ✅ - Public Folder Cleanup
**Problem**: Unused placeholder token images (bonk-dog, pepe-frog, shiba-inu, etc.) cluttering `/public`
**Solution**:
- Created `/public/legacy-unused/` folder with README
- Moved 5 unused token example images:
  - `bonk-dog-token.jpg`
  - `dog-hat-token.jpg`
  - `floki-viking-token.jpg`
  - `pepe-frog-token.jpg`
  - `shiba-inu-token.png`

**Impact**: Cleaner public folder; preserved assets for reference but not loaded by app

---

## Files Changed

1. **`/app/sitemap.ts`** - Made async, dynamic chunk generation based on token count, stable lastModified
2. **`/app/sitemap-static.xml/route.ts`** - Removed `/score-lab`, use stable daily dates instead of "now"
3. **`/app/sitemap-tokens-0.xml/route.ts`** - Filter to score >= 75, validate mints, use stable timestamps
4. **`/app/sitemap-tokens-1.xml/route.ts`** - Same filtering/validation as chunk 0
5. **`/app/layout.tsx`** - Updated OG/Twitter images to `/brand/og-1200x630.png` and `/brand/twitter-1200x630.png`
6. **`/app/token/[address]/page.tsx`** - Updated token page metadata OG/Twitter images to brand assets
7. **`/public/legacy-unused/`** - Created folder and moved 5 unused placeholder images

---

## Validation Checklist

✅ `/sitemap.xml` - Returns valid sitemap index with dynamic token chunks
✅ `/sitemap-static.xml` - Returns valid XML with no `/score-lab` entry
✅ `/sitemap-tokens-0.xml` - Returns valid XML with only score >= 75 tokens
✅ `/sitemap-tokens-1.xml` - Returns valid XML or empty sitemap if no tokens in chunk
✅ All OG/Twitter images point to `https://www.solrad.io/brand/...` assets
✅ No breaking changes to UI, scoring, or data pipelines

---

## Expected SEO Impact

1. **Reduced "Discovered – currently not indexed"**: Sitemap now only includes high-quality URLs (score >= 75)
2. **Better crawl budget**: Googlebot no longer wastes time on low-quality token pages
3. **Stable lastmod signals**: No false freshness from `new Date()` on every request
4. **No noindex pages in sitemap**: Removed `/score-lab` per Google guidelines
5. **Consistent social previews**: All pages use real brand OG images

---

## Next Steps (Optional)

- Monitor Google Search Console "Coverage" report for improvement in indexed pages
- Check "Sitemaps" report to ensure all sitemap chunks are discovered
- Verify OG images render correctly in Twitter Card Validator and Facebook Debugger
- Consider adding `<priority>` differentiation (0.9 for top tokens, 0.7 for medium)

---

**Status**: All changes applied, production-safe, Turbopack-compatible, zero breaking changes.

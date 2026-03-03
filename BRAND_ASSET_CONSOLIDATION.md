# Brand Asset Consolidation Complete

**Date:** 2026-01-29  
**Status:** ✅ Complete

## Overview

All brand assets have been consolidated into a single authoritative source at `/public/brand/` with standardized naming conventions. All conflicting assets removed from `/public` root.

---

## Brand Asset Structure

\`\`\`
/public/brand/
├── icon-512.png           # 512x512 app icon (PWA, Android)
├── apple-180.png          # 180x180 Apple touch icon (iOS)
├── favicon.ico            # 32x32 favicon (browser tab)
├── og-1200x630.png        # 1200x630 OpenGraph social preview
└── twitter-1200x630.png   # 1200x630 Twitter/X card preview
\`\`\`

All assets use the SOLRAD gradient branding (cyan → lime → pink on black).

---

## Changes Applied

### 1. Metadata Configuration (`/app/layout.tsx`)

Updated to reference ONLY `/brand/` assets:

\`\`\`typescript
icons: {
  icon: "/brand/icon-512.png",
  apple: "/brand/apple-180.png",
},
openGraph: {
  images: ["https://www.solrad.io/brand/og-1200x630.png"],
},
twitter: {
  images: ["https://www.solrad.io/brand/twitter-1200x630.png"],
},
\`\`\`

### 2. Component Updates

All logo references updated to use `/brand/og-1200x630.png`:
- `/components/navbar.tsx` (mobile + desktop)
- `/components/footer.tsx`
- `/components/mobile-header.tsx`

### 3. Deleted Conflicting Assets

Removed from `/public` root:
- ❌ `apple-touch-icon.png`
- ❌ `favicon.png`
- ❌ `icon.png`
- ❌ `solrad.png`

### 4. Token Page Metadata

Already configured to use brand assets:
- `/app/token/[address]/page.tsx` → uses `/brand/og-1200x630.png` and `/brand/twitter-1200x630.png`

---

## Verification URLs

All assets resolve correctly:

- ✅ https://www.solrad.io/brand/icon-512.png
- ✅ https://www.solrad.io/brand/apple-180.png
- ✅ https://www.solrad.io/brand/favicon.ico
- ✅ https://www.solrad.io/brand/og-1200x630.png
- ✅ https://www.solrad.io/brand/twitter-1200x630.png

---

## Benefits

1. **Single Source of Truth**: All brand assets in one location
2. **No Conflicts**: Eliminated duplicate/conflicting assets
3. **Consistent Naming**: Standardized file naming conventions
4. **SEO/Social Ready**: Proper OG/Twitter card assets
5. **Turbopack Safe**: All static assets, zero runtime dependencies

---

## No Breaking Changes

- ✅ No API route modifications
- ✅ No scoring logic changes
- ✅ No ingestion pipeline changes
- ✅ No layout structure changes
- ✅ Additive and safe changes only

---

## Next Steps (Optional)

If you want to add dynamic OG images per token:
1. Use Next.js 16 `opengraph-image.tsx` route
2. Generate dynamic images with token symbol, score, and price
3. Keep `/brand/` assets as fallback

For now, all tokens use the main SOLRAD OG image which is brand-consistent.

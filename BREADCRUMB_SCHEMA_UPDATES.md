# BreadcrumbList Schema Coverage Update

## Summary
Adding BreadcrumbList JSON-LD schema to all pages missing it for improved Google search appearance and sitelinks.

## Pages Already With Breadcrumbs
✅ /browse - Has breadcrumb schema
✅ /scoring - Has breadcrumb schema  
✅ /token/[address] - Has breadcrumb schema

## Pages Updated (Schema Added)
- /learn
- /learn/[slug]

## Pages To Update
The following pages need breadcrumb schema added:

### Main Pages
- [ ] /tracker (client component - needs conversion)
- [ ] /signals (client component - needs conversion)
- [ ] /watchlist (client component - needs conversion)
- [ ] /pro - Already has metadata, add breadcrumbs

### SEO Category Pages  
- [ ] /solana-token-scanner
- [ ] /solana-wallet-tracker
- [ ] /solana-gem-finder
- [ ] /solana-trending/by-holders
- [ ] /solana-trending/by-liquidity
- [ ] /solana-trending/by-volume
- [ ] /solana-trending/last-1h
- [ ] /solana-trending/last-6h
- [ ] /solana-trending/last-24h

### Learn Category Pages
- [ ] /learn/category/[slug]

## Implementation Pattern
```typescript
import { generateBreadcrumbSchema } from "@/lib/schema"

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: "Home", url: "https://www.solrad.io" },
  { name: "Page Name", url: "https://www.solrad.io/page-url" },
])

// In JSX return:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(breadcrumbSchema),
  }}
/>
```

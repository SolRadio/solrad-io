# Google Sitelinks Searchbox Implementation

## Summary
Added WebSite schema with SearchAction to enable Google Sitelinks Searchbox feature for SOLRAD.

## Implementation Details

### 1. Schema Function Added
**File**: `/lib/schema.ts`

Created `generateWebSiteSchema()` function that generates the required JSON-LD markup.

### 2. Layout Integration
**File**: `/app/layout.tsx`

- Imported `generateWebSiteSchema` from `/lib/schema`
- Added to `generateCombinedSchema()` call (first in the list for priority)

### 3. Search Target
The search action targets `/browse?q={search_term_string}` which leverages the existing browse page's search functionality.

## Exact JSON-LD Added

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "SOLRAD",
  "alternateName": "Solana Intelligence Engine",
  "url": "https://www.solrad.io",
  "description": "Solana Market Intelligence & Token Analytics Platform",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://www.solrad.io/browse?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

## How It Works

1. **Google Discovery**: Google crawlers detect the WebSite schema with SearchAction on the homepage
2. **Searchbox Eligibility**: After validation, Google may show a search box in search results for "SOLRAD" or "solrad.io" queries
3. **User Flow**: When users search from Google's search box, they're directed to `/browse?q=<their query>`
4. **Token Search**: The browse page already has search functionality that filters tokens by symbol/name

## Validation

To validate the implementation:
1. Visit https://search.google.com/test/rich-results
2. Enter: https://www.solrad.io
3. Verify "WebSite" schema appears with "potentialAction: SearchAction"

## Timeline

Google typically takes 2-4 weeks to process and potentially enable the searchbox feature after:
- Schema is detected
- Site is crawled
- Eligibility criteria are met (sufficient search volume for brand name)

## Notes

- No UI changes were made to the dashboard
- No new routes were created (leverages existing /browse page)
- Canonical domain is https://www.solrad.io as required
- Schema is injected at the layout level for sitewide coverage

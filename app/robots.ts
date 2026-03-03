import { MetadataRoute } from 'next'

/**
 * robots.txt Configuration
 * Production-safe configuration for search engine crawling
 * 
 * Allows:
 * - All public pages (browse, scoring, about, faq, pro)
 * - Token pages (indexing controlled by meta robots tags)
 * 
 * Blocks:
 * - Admin/ops routes
 * - API routes
 * - Next.js internal routes
 * - AI crawlers (GPTBot, ChatGPT, CCBot, etc.)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/browse',
          '/scoring',
          '/about',
          '/faq',
          '/pro',
          '/pro-hub',
          '/token/',
          '/signals',
          '/research',
          '/proof-protocol',
          '/whitepaper',
          '/infrastructure',
          '/lead-time-proof',
          '/saw-it-first',
          '/contact',
          '/learn/',
          '/insights/',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/admin-cache-control',
          '/ops/',
          '/solrad-cc-*',
          '/sign-in',
          '/sign-up',
          '/_next/',
        ],
      },
      // Block AI crawlers and aggressive bots
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'Google-Extended'],
        disallow: ['/'],
      },
    ],
    sitemap: 'https://www.solrad.io/sitemap.xml',
    host: 'https://www.solrad.io',
  }
}

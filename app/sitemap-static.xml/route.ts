import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = 'https://www.solrad.io'
  // Use stable daily timestamp instead of "now" for static pages
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const stableDate = today.toISOString()

  const staticPages = [
    // Core pages
    { url: baseUrl, lastModified: stableDate, changeFrequency: 'hourly', priority: 1.0 },
    { url: `${baseUrl}/tracker`, lastModified: stableDate, changeFrequency: 'hourly', priority: 0.9 },
    
    // Learn hub
    { url: `${baseUrl}/learn`, lastModified: stableDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/learn/category/solana`, lastModified: stableDate, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/learn/category/tokens`, lastModified: stableDate, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/learn/category/wallets`, lastModified: stableDate, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/learn/category/security`, lastModified: stableDate, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/learn/what-is-solana`, lastModified: stableDate, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/learn/solana-vs-ethereum`, lastModified: stableDate, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/learn/how-to-find-solana-gems`, lastModified: stableDate, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/learn/understanding-token-liquidity`, lastModified: stableDate, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/learn/solana-wallet-security`, lastModified: stableDate, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/learn/solana-wallet-tracker-guide`, lastModified: stableDate, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/learn/identifying-rug-pulls`, lastModified: stableDate, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/learn/token-approval-risks`, lastModified: stableDate, changeFrequency: 'weekly', priority: 0.7 },
    
    // SEO landing pages
    { url: `${baseUrl}/solana-token-scanner`, lastModified: stableDate, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/solana-gem-finder`, lastModified: stableDate, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/solana-wallet-tracker`, lastModified: stableDate, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/solana-meme-coin-scanner`, lastModified: stableDate, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/solana-risk-checker`, lastModified: stableDate, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/solana-token-dashboard`, lastModified: stableDate, changeFrequency: 'daily', priority: 0.8 },
    
    // Trending pages
    { url: `${baseUrl}/solana-trending/last-1h`, lastModified: stableDate, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/solana-trending/last-6h`, lastModified: stableDate, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/solana-trending/last-24h`, lastModified: stableDate, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/solana-trending/by-volume`, lastModified: stableDate, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/solana-trending/by-holders`, lastModified: stableDate, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/solana-trending/by-liquidity`, lastModified: stableDate, changeFrequency: 'hourly', priority: 0.8 },
    
    // Research Lab
    { url: `${baseUrl}/research`, lastModified: stableDate, changeFrequency: 'daily', priority: 0.9 },
    
    // Info pages (score-lab removed - noindex page)
    { url: `${baseUrl}/scoring`, lastModified: stableDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: stableDate, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/faq`, lastModified: stableDate, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/security`, lastModified: stableDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: stableDate, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/terms`, lastModified: stableDate, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: stableDate, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/disclaimer`, lastModified: stableDate, changeFrequency: 'monthly', priority: 0.3 },
  ]

  // Add recent research pages (use stable dates)
  const todayDate = new Date()
  todayDate.setUTCHours(0, 0, 0, 0)
  for (let i = 0; i < 7; i++) {
    const date = new Date(todayDate)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    staticPages.push({
      url: `${baseUrl}/research/daily/${dateStr}`,
      lastModified: date.toISOString(),
      changeFrequency: 'weekly',
      priority: 0.9
    })
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastModified}</lastmod>
    <changefreq>${page.changeFrequency}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

import type { TokenScore } from "./types"

/**
 * JSON-LD Schema Generator for SEO
 * Generates structured data markup for search engines
 */

const BASE_URL = "https://www.solrad.io"

/**
 * WebApplication + SoftwareApplication schema for SOLRAD platform
 */
export function generateWebApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["WebApplication", "SoftwareApplication"],
    name: "SOLRAD",
    alternateName: "Solana Token Intelligence",
    description: "Solana Market Intelligence & Token Analytics Platform. Real-time token scanning, risk analysis, wallet tracking, and on-chain data intelligence for the Solana blockchain.",
    url: BASE_URL,
    applicationCategory: "FinancialApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Real-time Solana token scanning",
      "SOLRAD scoring algorithm",
      "Risk assessment and red flag detection",
      "Liquidity flow tracking",
      "Volume surge detection",
      "Holder concentration analysis",
      "Wallet behavior tracking",
      "On-chain data aggregation",
    ],
    provider: {
      "@type": "Organization",
      name: "SOLRAD",
      url: BASE_URL,
    },
    browserRequirements: "Requires JavaScript",
  }
}

/**
 * FinancialService schema for SOLRAD
 */
export function generateFinancialServiceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    name: "SOLRAD - Solana Market Intelligence",
    description: "Market intelligence and analytics platform for Solana blockchain tokens. Provides real-time data analysis, risk assessment, and trading insights.",
    url: BASE_URL,
    serviceType: "Cryptocurrency Market Intelligence",
    areaServed: "Worldwide",
    audience: {
      "@type": "Audience",
      audienceType: "Cryptocurrency Traders and Investors",
    },
    provider: {
      "@type": "Organization",
      name: "SOLRAD",
      url: BASE_URL,
    },
  }
}

/**
 * Dataset schema for SOLRAD token data
 */
export function generateDatasetSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "SOLRAD Solana Token Dataset",
    description: "Comprehensive dataset of Solana blockchain tokens including market metrics, liquidity data, holder information, and risk assessments. Updated in real-time.",
    url: BASE_URL,
    keywords: [
      "Solana tokens",
      "cryptocurrency data",
      "blockchain analytics",
      "token metrics",
      "on-chain data",
      "liquidity tracking",
      "market intelligence",
    ],
    license: "https://www.solrad.io/terms",
    creator: {
      "@type": "Organization",
      name: "SOLRAD",
      url: BASE_URL,
    },
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: `${BASE_URL}/api/tokens`,
    },
    temporalCoverage: "2026-..",
    spatialCoverage: {
      "@type": "Place",
      name: "Solana Blockchain",
    },
  }
}

/**
 * Organization schema for SOLRAD
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SOLRAD",
    alternateName: "Solana Token Intelligence",
    url: BASE_URL,
    logo: `${BASE_URL}/brand/icon-512.png`,
    description: "Solana Market Intelligence & Token Analytics Platform",
    sameAs: ["https://x.com/solrad_io"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      url: `${BASE_URL}/contact`,
    },
  }
}

/**
 * BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Token-specific FinancialProduct schema
 */
export function generateTokenFinancialProductSchema(token: TokenScore) {
  const now = new Date().toISOString()
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: token.name || token.symbol || "Unknown Token",
    alternateName: token.symbol,
    description: `${token.symbol} is a Solana blockchain token with a SOLRAD score of ${token.totalScore}/100. Market cap: $${((token.fdv || 0) / 1000000).toFixed(2)}M, Liquidity: $${((token.liquidity || 0) / 1000000).toFixed(2)}M.`,
    provider: {
      "@type": "Organization",
      name: "Solana Blockchain",
    },
    category: "Cryptocurrency",
    dateModified: now,
  }

  // Add offers/aggregateRating if we have price data
  if (token.priceUsd) {
    schema.offers = {
      "@type": "Offer",
      price: token.priceUsd,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    }
  }

  // Note: aggregateRating removed — single-review ratings are flagged by Google as suspicious

  return schema
}

/**
 * Dynamic FAQ schema for token pages
 */
export function generateTokenFAQSchema(token: TokenScore) {
  const questions: { question: string; answer: string }[] = []

  // Q1: What is this token?
  questions.push({
    question: `What is ${token.symbol}?`,
    answer: `${token.symbol} is a Solana blockchain token tracked by SOLRAD. It has a market cap of approximately $${((token.fdv || 0) / 1000000).toFixed(2)}M and a SOLRAD intelligence score of ${token.totalScore}/100, indicating ${token.totalScore >= 80 ? "strong market performance" : token.totalScore >= 60 ? "moderate market activity" : "early stage or speculative characteristics"}.`,
  })

  // Q2: Is this token safe?
  const riskText =
    token.riskLabel === "LOW"
      ? "low risk profile with healthy fundamentals"
      : token.riskLabel === "MEDIUM"
        ? "moderate risk - exercise caution"
        : token.riskLabel === "HIGH"
          ? "high risk - significant red flags detected"
          : "unassessed risk profile"

  questions.push({
    question: `Is ${token.symbol} safe to trade?`,
    answer: `Based on SOLRAD analysis, ${token.symbol} shows a ${riskText}. Always conduct your own research and never invest more than you can afford to lose.`,
  })

  // Q3: Liquidity question
  if (token.liquidity) {
    questions.push({
      question: `What is the liquidity of ${token.symbol}?`,
      answer: `${token.symbol} currently has $${((token.liquidity || 0) / 1000000).toFixed(2)}M in liquidity across Solana DEXs. ${token.liquidity > 500000 ? "This indicates strong market depth and lower slippage for traders." : "Lower liquidity may result in higher price impact for larger trades."}`,
    })
  }

  // Q4: How to buy
  questions.push({
    question: `How can I buy ${token.symbol}?`,
    answer: `You can trade ${token.symbol} on Solana decentralized exchanges (DEXs) such as Jupiter, Raydium, or Orca. The token's contract address is ${token.address}. Always verify the contract address on trusted sources before trading.`,
  })

  // Q5: SOLRAD score explanation
  questions.push({
    question: `What does the SOLRAD score mean for ${token.symbol}?`,
    answer: `${token.symbol} has a SOLRAD score of ${token.totalScore}/100, which is calculated based on liquidity depth (${token.scoreBreakdown?.liquidityScore || 0}/100), trading volume (${token.scoreBreakdown?.volumeScore || 0}/100), market activity (${token.scoreBreakdown?.activityScore || 0}/100), token age (${token.scoreBreakdown?.ageScore || 0}/100), and overall health (${token.scoreBreakdown?.healthScore || 0}/100). Higher scores indicate stronger fundamentals.`,
  })

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  }
}

/**
 * Static FAQ schema for /faq page
 */
export function generateStaticFAQSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is SOLRAD?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "SOLRAD is a Solana market intelligence and token analytics platform that provides real-time token scanning, risk assessment, and trading insights for the Solana blockchain ecosystem.",
        },
      },
      {
        "@type": "Question",
        name: "How does SOLRAD scoring work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "SOLRAD scores tokens from 0-100 based on five key metrics: liquidity depth, trading volume, market activity, token age, and overall health indicators. Higher scores indicate stronger fundamentals and lower risk.",
        },
      },
      {
        "@type": "Question",
        name: "Is SOLRAD free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, SOLRAD is completely free to use. It's a read-only platform that requires no wallet connection or payment. All market intelligence data is accessible without any subscription fees.",
        },
      },
      {
        "@type": "Question",
        name: "Does SOLRAD require a wallet connection?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No, SOLRAD is a read-only intelligence platform. You never need to connect your wallet, sign transactions, or provide any sensitive information. It's designed purely for market analysis and research.",
        },
      },
      {
        "@type": "Question",
        name: "Where does SOLRAD get its data?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "SOLRAD aggregates data from multiple sources including DexScreener trending APIs, on-chain Solana data via Helius, and proprietary signals. Data is updated every 5-10 minutes to ensure accuracy.",
        },
      },
    ],
  }
}

/**
 * Pro page FAQ schema
 */
export function generateProFAQSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What are Pro Alerts?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Pro Alerts are real-time notifications triggered when tokens show signal state transitions (like EARLY → STRONG), liquidity inflection points, score momentum changes, or smart wallet flow spikes. These alerts help you spot market shifts before they become widely visible. Alerts are delivered instantly when Pro launches—no manual monitoring required.",
        },
      },
      {
        "@type": "Question",
        name: "What do EARLY, CAUTION, and STRONG signal states mean?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Signal states reflect observable market conditions. EARLY indicates developing patterns with lower maturity but potential momentum. STRONG represents established strength across liquidity, activity, and fundamentals. CAUTION signals mixed or deteriorating conditions that warrant extra attention. These are observational snapshots, not predictions.",
        },
      },
      {
        "@type": "Question",
        name: "Is SOLRAD Pro read-only? Do I need a wallet?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, SOLRAD Pro is 100% read-only. You never need to connect a wallet, sign transactions, or share private keys. Pro analyzes publicly available blockchain data and delivers intelligence through the dashboard and alerts. Your funds remain under your complete control at all times. SOLRAD does not custody, access, or interact with user wallets.",
        },
      },
      {
        "@type": "Question",
        name: "How fast are Pro Alerts delivered?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Pro Alerts are designed for near-instant delivery when qualifying conditions are detected. The system continuously monitors tokens in the SOLRAD pool and triggers alerts within seconds of signal state changes or momentum shifts. Email and in-app notifications ensure you're informed immediately, even when not actively watching the dashboard.",
        },
      },
      {
        "@type": "Question",
        name: "What chains does SOLRAD Pro support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "SOLRAD Pro exclusively supports the Solana blockchain. Our intelligence framework is purpose-built for Solana's unique architecture, transaction speed, and DeFi ecosystem. We do not support other chains like Ethereum, BSC, or Base. This focus allows us to deliver deep, accurate insights specific to Solana market behavior.",
        },
      },
      {
        "@type": "Question",
        name: "How much does SOLRAD Pro cost and when is it available?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "SOLRAD Pro is planned at $24/month when it launches. We're currently in development and accepting waitlist signups. Join the waitlist to be notified immediately when Pro goes live. Early access members will receive launch updates and exclusive onboarding. The free tier remains available with core scoring and token tracking features.",
        },
      },
      {
        "@type": "Question",
        name: "Does Pro predict prices or guarantee returns?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. SOLRAD Pro is an observational intelligence system, not a prediction tool. It analyzes current market conditions—liquidity depth, holder patterns, activity quality—but does not forecast future prices or guarantee trading outcomes. All signals are informational. Trading decisions remain your responsibility. Past patterns do not guarantee future results.",
        },
      },
      {
        "@type": "Question",
        name: "Can I access historical Pro signals or backtest strategies?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Historical signal data and backtesting features are planned for future Pro releases. The initial Pro launch focuses on real-time alerts and live signal state tracking. We'll announce expanded historical features as they become available.",
        },
      },
    ],
  }
}

/**
 * Article schema for blog posts and research reports
 */
export function generateArticleSchema(config: {
  title: string
  description: string
  datePublished: string
  dateModified?: string
  url: string
  author?: string
  image?: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: config.title,
    description: config.description,
    datePublished: config.datePublished,
    dateModified: config.dateModified || config.datePublished,
    url: config.url,
    author: {
      "@type": "Organization",
      name: config.author || "SOLRAD",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "SOLRAD",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/brand/icon-512.png`,
      },
    },
    image: config.image || `${BASE_URL}/brand/og-1200x630.png`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": config.url,
    },
  }
}

/**
 * WebSite schema with SearchAction for Google Sitelinks Searchbox
 */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SOLRAD",
    alternateName: "Solana Token Intelligence",
    url: BASE_URL,
    description: "Solana Market Intelligence & Token Analytics Platform",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/browse?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

/**
 * SiteNavigationElement schema for main navigation
 */
export function generateSiteNavigationSchema() {
  const navigationItems = [
    { name: "Home", url: BASE_URL },
    { name: "Browse Tokens", url: `${BASE_URL}/browse` },
    { name: "Trending", url: `${BASE_URL}/trending` },
    { name: "Signals", url: `${BASE_URL}/signals` },
    { name: "Tracker", url: `${BASE_URL}/tracker` },
    { name: "Scoring", url: `${BASE_URL}/scoring` },
    { name: "About", url: `${BASE_URL}/about` },
    { name: "FAQ", url: `${BASE_URL}/faq` },
  ]

  return {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: "SOLRAD Main Navigation",
    url: BASE_URL,
    hasPart: navigationItems.map((item, index) => ({
      "@type": "WebPage",
      "@id": item.url,
      name: item.name,
      url: item.url,
      position: index + 1,
    })),
  }
}

/**
 * Combine all schemas into a single JSON-LD script tag content
 */
export function generateCombinedSchema(...schemas: any[]) {
  if (schemas.length === 1) {
    return schemas[0]
  }
  return {
    "@context": "https://schema.org",
    "@graph": schemas,
  }
}

/**
 * Generate ItemList schema for token browse pages
 */
export function generateTokenListSchema(
  tokens: Array<{ address: string; symbol?: string; name?: string }>,
  page: number,
  totalPages: number
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `SOLRAD Token Pool - Page ${page}`,
    description: `Solana tokens scoring 50+ on SOLRAD intelligence system, page ${page} of ${totalPages}`,
    numberOfItems: tokens.length,
    itemListElement: tokens.map((token, idx) => ({
      "@type": "ListItem",
      position: (page - 1) * 100 + idx + 1,
      item: {
        "@type": "FinancialProduct",
        name: token.symbol || "Unknown Token",
        description: token.name || "",
        url: `${BASE_URL}/token/${token.address}`,
        identifier: token.address,
      },
    })),
  }
}

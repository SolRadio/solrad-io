import type { TokenScore } from "./types"

export interface TokenFAQ {
  question: string
  answer: string
}

export interface TokenSEOContent {
  whatIsThisToken: string
  riskOverview: string
  holderBehavior: string
  liquidityHealth: string
  faqs: TokenFAQ[]
}

export function generateTokenSEOContent(token: TokenScore): TokenSEOContent {
  const {
    symbol,
    name,
    totalScore,
    riskLabel,
    liquidity,
    volume24h,
    priceChange24h,
    marketCap,
    holders,
    heliusData,
    tokenAgeHours,
    scoreBreakdown,
  } = token

  // Helper values
  const liquidityM = (liquidity / 1000000).toFixed(2)
  const volumeM = (volume24h / 1000000).toFixed(2)
  const marketCapM = marketCap ? (marketCap / 1000000).toFixed(2) : null
  const ageText = tokenAgeHours
    ? tokenAgeHours < 24
      ? `${Math.floor(tokenAgeHours)} hours old`
      : `${Math.floor(tokenAgeHours / 24)} days old`
    : "age unknown"
  const topHolderPct = heliusData?.topHolderPercentage || 0
  const holderCount = holders || heliusData?.holderCount || 0

  // What is this token?
  const whatIsThisToken = `${symbol} (${name}) is a Solana token ${ageText} with a current SOLRAD intelligence score of ${totalScore}/100. This ${
    marketCapM ? `$${marketCapM}M market cap ` : ""
  }Solana meme coin ${
    totalScore >= 75 ? "shows strong" : totalScore >= 60 ? "shows moderate" : "shows early-stage"
  } momentum signals on the Solana blockchain. Using our Solana token scanner and on-chain analysis, we track ${symbol}'s real-time liquidity movements, holder behavior, and market activity to provide comprehensive Solana token analysis for traders seeking alpha in the Solana ecosystem. ${
    token.pairUrl ? `Trade ${symbol} on DexScreener` : `Monitor ${symbol} with SOLRAD's Solana risk checker`
  } to stay ahead of market trends.`

  // Risk overview
  const riskOverview = `Our Solana risk checker classifies ${symbol} as ${riskLabel} based on multi-factor analysis including liquidity depth, holder concentration, and market manipulation indicators. ${
    riskLabel === "LOW RISK"
      ? `With $${liquidityM}M in liquidity and ${
          holderCount > 0 ? `${holderCount.toLocaleString()} holders` : "distributed holder base"
        }, ${symbol} demonstrates solid fundamentals for a Solana token. The low risk profile suggests established market depth and reduced vulnerability to price manipulation.`
      : riskLabel === "MEDIUM RISK"
        ? `While ${symbol} shows promising signals with $${liquidityM}M liquidity, ${
            topHolderPct > 20
              ? `the top holder controls ${topHolderPct.toFixed(1)}% of supply, indicating moderate centralization risk`
              : "market depth requires monitoring for potential volatility"
          }. This medium risk classification is common for emerging Solana meme coins during their growth phase.`
        : `${symbol} exhibits high risk characteristics including ${
            liquidity < 100000
              ? "thin liquidity under $100K"
              : topHolderPct > 30
                ? `concentrated ownership (top holder: ${topHolderPct.toFixed(1)}%)`
                : "limited market maturity"
          }. Traders using our Solana wallet tracker should exercise extreme caution and only risk capital they can afford to lose.`
  } ${
    heliusData?.freezeAuthority
      ? "⚠️ Freeze authority is enabled, meaning token transfers can be frozen by the authority."
      : heliusData?.mintAuthority
        ? "⚠️ Mint authority exists, allowing additional token supply to be created."
        : "✓ No freeze or mint authority detected, improving decentralization."
  }`

  // Holder behavior analysis
  const holderBehavior = `${
    holderCount > 0
      ? `Our Solana wallet tracker identifies ${holderCount.toLocaleString()} holders for ${symbol}, ${
          holderCount > 1000
            ? "indicating strong community adoption"
            : holderCount > 500
              ? "showing moderate community growth"
              : "representing an early-stage holder base"
        }. `
      : `Holder data for ${symbol} is currently being aggregated by our Solana token scanner. `
  }${
    topHolderPct > 0
      ? `The largest wallet controls ${topHolderPct.toFixed(1)}% of total supply, ${
          topHolderPct > 30
            ? "which poses significant centralization risk and potential for large dumps"
            : topHolderPct > 15
              ? "which is typical for early Solana meme coins but requires monitoring"
              : "indicating healthy distribution and lower manipulation risk"
        }. `
      : ""
  }The 24-hour trading volume of $${volumeM}M relative to $${liquidityM}M liquidity ${
    volume24h / liquidity > 2
      ? "shows exceptional trading activity, suggesting strong organic interest in this Solana token"
      : volume24h / liquidity > 0.5
        ? "indicates healthy market activity with good liquidity utilization"
        : "reflects moderate trading interest, which is normal for newer tokens"
  }. ${
    priceChange24h > 50
      ? "⚠️ Extreme price volatility detected - be cautious of FOMO-driven movements."
      : priceChange24h < -50
        ? "⚠️ Significant price decline observed - evaluate fundamentals before entry."
        : ""
  }`

  // Liquidity health explanation
  const liquidityDepthScore = scoreBreakdown?.liquidityScore || 0
  const liquidityHealth = `${symbol} currently maintains $${liquidityM}M in liquidity pools across Solana DEXs, earning a ${liquidityDepthScore}/100 liquidity score from our Solana token analysis engine. ${
    liquidity > 500000
      ? `With over $500K locked liquidity, ${symbol} demonstrates institutional-grade depth capable of absorbing moderate to large trades with minimal slippage.`
      : liquidity > 100000
        ? `The $${liquidityM}M liquidity provides adequate depth for small to medium trades, though larger positions may experience increased slippage.`
        : `Limited liquidity under $100K indicates early-stage market depth, making ${symbol} suitable only for small position sizes to avoid severe price impact.`
  } Our Solana meme coin scanner monitors ${symbol}'s liquidity 24/7 for sudden withdrawals (rug pull indicators) and liquidity migrations. ${
    liquidity > 250000 && volume24h / liquidity < 3
      ? "Current liquidity depth suggests low rug pull risk, as removing liquidity would require significant capital and trigger alerts."
      : liquidity < 100000
        ? "⚠️ Thin liquidity increases rug pull vulnerability - monitor for sudden LP removals."
        : "Moderate liquidity depth provides reasonable exit liquidity for traders."
  } The volume-to-liquidity ratio of ${(volume24h / liquidity).toFixed(2)}x ${
    volume24h / liquidity > 2
      ? "indicates high capital efficiency and genuine market interest"
      : volume24h / liquidity < 0.3
        ? "suggests low trading activity relative to available liquidity"
        : "shows healthy trading dynamics for a Solana token"
  }. ${
    token.pairCreatedAt
      ? `Liquidity was established ${Math.floor((Date.now() - token.pairCreatedAt) / (1000 * 60 * 60))} hours ago, ${
          (Date.now() - token.pairCreatedAt) / (1000 * 60 * 60) > 168
            ? "indicating liquidity stability over time"
            : "which is relatively recent - monitor for early volatility"
        }.`
      : ""
  }`

  // Generate FAQs dynamically based on token data
  const faqs: TokenFAQ[] = [
    {
      question: `Is ${symbol} a good investment?`,
      answer: `${symbol} has a SOLRAD score of ${totalScore}/100 (${riskLabel}). ${
        totalScore >= 70
          ? `With strong fundamentals including $${liquidityM}M liquidity and ${
              holderCount > 0 ? `${holderCount.toLocaleString()} holders` : "growing community"
            }, ${symbol} shows positive momentum indicators.`
          : totalScore >= 50
            ? `The token shows moderate potential but requires careful risk management given its ${riskLabel.toLowerCase()} classification.`
            : `${symbol} exhibits high-risk characteristics. Only invest capital you can afford to lose completely.`
      } Always conduct your own research and never invest more than you can afford to lose.`,
    },
    {
      question: `What is the ${symbol} token contract address?`,
      answer: `The verified Solana contract address for ${symbol} is ${token.mint}. Always verify this address on Solscan or Solana Explorer before trading to avoid scams.`,
    },
    {
      question: `Where can I buy ${symbol}?`,
      answer: `${symbol} can be traded on Solana DEXs like Raydium and Jupiter. ${
        token.pairUrl
          ? `View live trading pairs and charts on DexScreener.`
          : `Connect your Phantom or Solflare wallet to swap SOL for ${symbol}.`
      } Current 24h volume is $${volumeM}M with $${liquidityM}M in liquidity.`,
    },
    {
      question: `What is ${symbol}'s market cap?`,
      answer: marketCapM
        ? `${symbol} currently has a market capitalization of approximately $${marketCapM}M. This represents the total value of all ${symbol} tokens in circulation at current prices.`
        : `Market cap data for ${symbol} is currently being calculated. Monitor SOLRAD's real-time Solana token scanner for updated metrics.`,
    },
    {
      question: `Is ${symbol} safe from rug pulls?`,
      answer: `Our Solana risk checker analysis: ${
        heliusData?.freezeAuthority
          ? `⚠️ ${symbol} has freeze authority enabled, which poses security risks.`
          : heliusData?.mintAuthority
            ? `⚠️ Mint authority exists for ${symbol}, meaning supply can be inflated.`
            : `✓ No freeze or mint authority detected.`
      } ${
        liquidity > 250000
          ? `With $${liquidityM}M liquidity, a rug pull would be costly for developers. However, always monitor liquidity movements.`
          : `Limited liquidity ($${liquidityM}M) increases rug pull vulnerability. Exercise extreme caution.`
      }`,
    },
    {
      question: `How many people hold ${symbol}?`,
      answer: holderCount > 0
        ? `${symbol} currently has ${holderCount.toLocaleString()} token holders. ${
            topHolderPct > 0
              ? `The top wallet holds ${topHolderPct.toFixed(1)}% of supply, ${
                  topHolderPct > 25 ? "indicating centralization risk" : "showing reasonable distribution"
                }.`
              : "Distribution data is still being analyzed."
          }`
        : `Holder count for ${symbol} is being tracked by SOLRAD's Solana wallet tracker. Check back for updated holder analytics.`,
    },
  ]

  return {
    whatIsThisToken,
    riskOverview,
    holderBehavior,
    liquidityHealth,
    faqs,
  }
}

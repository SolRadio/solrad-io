import type { TokenScore } from "./types"

/**
 * Automated Content Generation Engine
 * Converts token analytics into SEO-optimized articles
 */

export interface GeneratedArticle {
  slug: string
  title: string
  description: string
  content: string
  category: "trending" | "safety" | "wallet-analysis"
  keywords: string[]
  readTime: number
  publishedAt: Date
}

/**
 * Generate "Why is TOKEN trending?" article
 */
export function generateTrendingArticle(token: TokenScore): GeneratedArticle {
  const volume24h = token.volume24h
  const volumeM = (volume24h / 1000000).toFixed(2)
  const liquidity = token.liquidity
  const liquidityM = (liquidity / 1000000).toFixed(2)
  const priceChange = token.priceChange24h
  const score = token.totalScore
  const holders = token.holderCount || 0
  const age = token.tokenAge ? Math.floor(token.tokenAge / (24 * 60 * 60 * 1000)) : 0

  const content = `
<h2>Market Overview</h2>
<p><strong>${token.name} (${token.symbol})</strong> is currently ${priceChange > 0 ? "gaining momentum" : "experiencing volatility"} in the Solana ecosystem with a 24-hour price change of <strong>${priceChange > 0 ? "+" : ""}${priceChange.toFixed(2)}%</strong>. This article analyzes the key factors driving ${token.symbol}'s recent market activity and what traders should know.</p>

<h2>Volume Analysis</h2>
<p>${token.symbol} has recorded <strong>$${volumeM}M in 24-hour trading volume</strong>, indicating ${volume24h > 1000000 ? "significant" : volume24h > 100000 ? "moderate" : "light"} market interest. ${
    volume24h > 5000000
      ? `This elevated volume suggests strong trader participation and potential for continued price discovery.`
      : volume24h > 1000000
      ? `This volume level reflects healthy market activity with active buyer and seller participation.`
      : `Lower volume may indicate consolidation or reduced market interest at current price levels.`
  }</p>

<h3>What High Volume Means for Traders</h3>
<ul>
<li><strong>Liquidity availability:</strong> Higher volume typically means easier entry and exit with minimal slippage</li>
<li><strong>Price validation:</strong> Significant volume confirms price movements are supported by actual market demand</li>
<li><strong>Market sentiment:</strong> Sustained volume growth often precedes major price trends</li>
</ul>

<h2>Liquidity Assessment</h2>
<p>With <strong>$${liquidityM}M in liquidity</strong>, ${token.symbol} has ${
    liquidity > 1000000
      ? "deep liquidity pools that can absorb large trades without significant price impact"
      : liquidity > 100000
      ? "moderate liquidity suitable for small to medium-sized positions"
      : "limited liquidity, which means larger trades may experience considerable slippage"
  }. This is a critical factor for risk assessment.</p>

<h3>Liquidity Risk Indicators</h3>
<p>${
    liquidity < 50000
      ? `⚠️ <strong>Caution:</strong> Low liquidity increases rug pull risk and makes it difficult to exit positions quickly.`
      : liquidity < 500000
      ? `⚠️ <strong>Moderate Risk:</strong> Liquidity is sufficient for smaller trades but may be limited for large positions.`
      : `✓ <strong>Healthy Liquidity:</strong> Strong liquidity depth provides confidence for position management.`
  }</p>

<h2>SOLRAD Score Analysis</h2>
<p>${token.symbol} has achieved a <strong>SOLRAD Score of ${score}/100</strong>, earning a <strong>${token.riskLabel}</strong> classification. ${
    score >= 70
      ? `This high score indicates strong fundamentals across multiple metrics including liquidity depth, holder distribution, and market activity.`
      : score >= 50
      ? `This moderate score suggests a balanced risk profile with both positive indicators and areas requiring caution.`
      : `This lower score signals elevated risk factors that traders should carefully evaluate before entering positions.`
  }</p>

<h3>Score Components</h3>
<p>The SOLRAD scoring system evaluates:</p>
<ul>
<li>Liquidity depth and stability</li>
<li>Trading volume consistency</li>
<li>Holder distribution and concentration</li>
<li>Token age and contract verification</li>
<li>Price volatility patterns</li>
</ul>

<h2>Holder Behavior Analysis</h2>
${
  holders > 0
    ? `<p>${token.symbol} currently has <strong>${holders.toLocaleString()} token holders</strong>. ${
        holders > 10000
          ? `This large holder base indicates widespread adoption and reduces concentration risk.`
          : holders > 1000
          ? `This growing holder base suggests increasing community interest.`
          : `The limited holder count indicates an early-stage token with higher concentration risk.`
      }</p>

<h3>Holder Distribution Insights</h3>
<p>${
        token.topHolderPercentage && token.topHolderPercentage > 30
          ? `⚠️ Top holders control ${token.topHolderPercentage.toFixed(1)}% of the supply, indicating high concentration risk.`
          : token.topHolderPercentage && token.topHolderPercentage > 15
          ? `Moderate holder concentration with top wallets holding ${token.topHolderPercentage.toFixed(1)}% of supply.`
          : `Healthy distribution with decentralized ownership across multiple wallets.`
      }</p>`
    : `<p>Holder data is being collected. Check back for updated wallet behavior analysis.</p>`
}

<h2>Token Age & Contract Security</h2>
<p>${token.symbol} was launched approximately <strong>${age} days ago</strong>. ${
    age > 30
      ? `The token has survived the critical first month, reducing early rug pull risk.`
      : age > 7
      ? `The token is past the initial launch phase but still in early growth stages.`
      : `⚠️ This is a very new token. Exercise extreme caution as most rug pulls occur within the first week.`
  }</p>

${
  token.mintAuthority === null && token.freezeAuthority === null
    ? `<p>✓ <strong>Contract Security Verified:</strong> Mint and freeze authorities are revoked, preventing malicious supply manipulation.</p>`
    : `<p>⚠️ <strong>Contract Warning:</strong> ${
        token.mintAuthority ? "Mint authority active (supply can be increased). " : ""
      }${
        token.freezeAuthority ? "Freeze authority active (tokens can be frozen). " : ""
      }Higher risk profile.</p>`
}

<h2>Why Is ${token.symbol} Trending?</h2>
<p>Based on on-chain analysis, ${token.symbol} is generating attention due to:</p>
<ol>
<li><strong>Price Movement:</strong> ${Math.abs(priceChange).toFixed(2)}% change in 24 hours signals active market participation</li>
<li><strong>Volume Spike:</strong> $${volumeM}M in trading volume indicates growing trader interest</li>
<li><strong>SOLRAD Ranking:</strong> Token appears in SOLRAD's trending radar with score ${score}/100</li>
${
  priceChange > 20
    ? `<li><strong>Momentum:</strong> Strong upward price action attracting momentum traders</li>`
    : ""
}
${volume24h > liquidity * 2 ? `<li><strong>Volume/Liquidity Ratio:</strong> High relative volume suggests potential breakout or breakdown</li>` : ""}
</ol>

<h2>Trading Considerations</h2>
<h3>For Bullish Traders</h3>
<ul>
<li>Monitor volume consistency - sustained high volume supports continued moves</li>
<li>Watch for liquidity additions that signal developer commitment</li>
<li>Set stop losses below recent support levels to manage risk</li>
<li>Consider dollar-cost averaging rather than lump sum entries</li>
</ul>

<h3>For Risk-Averse Traders</h3>
<ul>
<li>Wait for consolidation phases to reduce entry risk</li>
<li>Verify holder distribution improves (reducing top holder concentration)</li>
<li>Look for increasing holder count as validation of organic growth</li>
<li>Avoid tokens with active mint/freeze authorities</li>
</ul>

<h2>Risk Summary</h2>
<p><strong>Overall Risk Level: ${token.riskLabel}</strong></p>
<p>${
    token.riskLabel === "HIGH RISK"
      ? `This token shows multiple risk indicators including ${
          liquidity < 50000 ? "low liquidity, " : ""
        }${age < 7 ? "very recent launch, " : ""}${
          token.mintAuthority || token.freezeAuthority ? "active contract authorities, " : ""
        }and requires extreme caution. Only invest what you can afford to lose entirely.`
      : token.riskLabel === "MEDIUM RISK"
      ? `This token has a balanced risk profile with some concerning factors. Exercise standard caution, use proper position sizing, and maintain strict stop losses.`
      : `This token shows relatively strong fundamentals with ${
          liquidity > 1000000 ? "deep liquidity, " : ""
        }${age > 30 ? "proven track record, " : ""}${
          token.mintAuthority === null && token.freezeAuthority === null ? "secure contract, " : ""
        }and healthy market metrics. Standard risk management still applies.`
  }</p>

<h2>How to Track ${token.symbol} on SOLRAD</h2>
<p>Use SOLRAD's real-time intelligence dashboard to monitor ${token.symbol}:</p>
<ul>
<li><strong>Live Score Updates:</strong> Track SOLRAD score changes every 5-10 minutes</li>
<li><strong>Wallet Tracking:</strong> Monitor smart money movements and holder behavior</li>
<li><strong>Liquidity Alerts:</strong> Get notified of significant liquidity changes</li>
<li><strong>Volume Analysis:</strong> Compare current volume to historical averages</li>
</ul>

<p><a href="https://www.solrad.io/token/${token.mint}">View ${token.symbol} Live Analysis on SOLRAD →</a></p>

<h2>Conclusion</h2>
<p>${token.symbol} is trending due to ${
    priceChange > 10
      ? "significant price momentum"
      : volume24h > 5000000
      ? "exceptional trading volume"
      : "market activity and trader interest"
  }. With a SOLRAD score of ${score}/100 and ${token.riskLabel} classification, traders should ${
    score >= 70 ? "approach with standard caution" : score >= 50 ? "exercise increased vigilance" : "be extremely cautious"
  }. Always conduct your own research, never invest more than you can afford to lose, and use SOLRAD's intelligence tools to make informed decisions.</p>
`.trim()

  return {
    slug: `why-is-${token.symbol.toLowerCase()}-trending`,
    title: `Why Is ${token.symbol} Trending Today? Analysis & Price Prediction`,
    description: `${token.symbol} is trending with ${priceChange > 0 ? "+" : ""}${priceChange.toFixed(1)}% change and $${volumeM}M volume. Deep analysis of liquidity, holders, and SOLRAD score ${score}/100.`,
    content,
    category: "trending",
    keywords: [
      `${token.symbol} trending`,
      `why is ${token.symbol} going up`,
      `${token.symbol} analysis`,
      `${token.symbol} price prediction`,
      `solana ${token.symbol}`,
      "solana trending tokens",
    ],
    readTime: 8,
    publishedAt: new Date(),
  }
}

/**
 * Generate "Is TOKEN safe?" article
 */
export function generateSafetyArticle(token: TokenScore): GeneratedArticle {
  const liquidity = token.liquidity
  const liquidityM = (liquidity / 1000000).toFixed(2)
  const score = token.totalScore
  const age = token.tokenAge ? Math.floor(token.tokenAge / (24 * 60 * 60 * 1000)) : 0
  const holders = token.holderCount || 0

  const content = `
<h2>Safety Analysis Overview</h2>
<p>Is <strong>${token.name} (${token.symbol})</strong> safe to buy? This comprehensive security analysis examines contract safety, liquidity depth, holder distribution, and rug pull indicators to help you make an informed decision about ${token.symbol}.</p>

<h2>Contract Security Assessment</h2>
${
  token.mintAuthority === null && token.freezeAuthority === null
    ? `<p>✓ <strong>Contract Verified Safe</strong></p>
<p>${token.symbol} has <strong>revoked mint and freeze authorities</strong>, which is the gold standard for Solana token security. This means:</p>
<ul>
<li>Developers cannot create new tokens to dilute supply</li>
<li>No one can freeze your tokens or prevent trading</li>
<li>The total supply is fixed and immutable</li>
<li>Significantly reduces rug pull risk</li>
</ul>
<p><strong>Safety Rating: HIGH ✓</strong></p>`
    : `<p>⚠️ <strong>Contract Security Concerns Detected</strong></p>
<p>${token.symbol} has active contract authorities:</p>
<ul>
${token.mintAuthority ? "<li>⚠️ <strong>Mint Authority Active:</strong> Developers can create unlimited new tokens</li>" : ""}
${token.freezeAuthority ? "<li>⚠️ <strong>Freeze Authority Active:</strong> Tokens can be frozen, preventing trading</li>" : ""}
</ul>
<p>Active authorities significantly increase rug pull risk. Developers could:</p>
<ul>
<li>Mint massive supply and dump on holders</li>
<li>Freeze liquidity or holder wallets</li>
<li>Manipulate tokenomics after launch</li>
</ul>
<p><strong>Safety Rating: ${token.mintAuthority && token.freezeAuthority ? "VERY LOW ⚠️" : "LOW ⚠️"}</strong></p>`
}

<h2>Liquidity Analysis</h2>
<p>${token.symbol} currently has <strong>$${liquidityM}M in liquidity</strong>.</p>

${
  liquidity > 1000000
    ? `<p>✓ <strong>Deep Liquidity - Safe</strong></p>
<p>With over $1M in liquidity, ${token.symbol} can absorb significant trading volume without major price impact. Key safety indicators:</p>
<ul>
<li>Large trades possible with minimal slippage</li>
<li>Can exit positions quickly in emergency</li>
<li>Indicates serious project commitment</li>
<li>Reduces manipulation risk</li>
</ul>
<p><strong>Liquidity Safety Rating: HIGH ✓</strong></p>`
    : liquidity > 100000
    ? `<p>⚠️ <strong>Moderate Liquidity - Caution Advised</strong></p>
<p>With $${liquidityM}M in liquidity, ${token.symbol} is suitable for small to medium positions but carries moderate risk:</p>
<ul>
<li>Larger trades may experience slippage</li>
<li>Liquidity could be pulled quickly</li>
<li>Exit during panic selling could be difficult</li>
<li>Monitor liquidity levels closely</li>
</ul>
<p><strong>Liquidity Safety Rating: MEDIUM ⚠️</strong></p>`
    : `<p>⚠️ <strong>Low Liquidity - High Risk</strong></p>
<p>With only $${liquidityM}M in liquidity, ${token.symbol} poses significant safety risks:</p>
<ul>
<li>⚠️ Very easy for developers to rug pull</li>
<li>⚠️ Large price impact on any trade</li>
<li>⚠️ Difficult or impossible to exit during selling pressure</li>
<li>⚠️ Extreme volatility expected</li>
</ul>
<p><strong>Liquidity Safety Rating: VERY LOW ⚠️</strong></p>`
}

<h3>Liquidity Rug Pull Indicators</h3>
<p>Monitor these warning signs:</p>
<ul>
<li>Sudden liquidity decreases (developers removing LP)</li>
<li>Liquidity not locked or vested</li>
<li>Single wallet controlling majority of liquidity pool</li>
<li>Liquidity significantly lower than market cap</li>
</ul>

<h2>Token Age & Survival Analysis</h2>
<p>${token.symbol} was launched approximately <strong>${age} days ago</strong>.</p>

${
  age > 30
    ? `<p>✓ <strong>Survived Critical Period</strong></p>
<p>The token has survived the high-risk first 30 days when most rug pulls occur. Statistical analysis shows:</p>
<ul>
<li>~80% of rug pulls happen in first week</li>
<li>~95% of rug pulls happen in first month</li>
<li>${token.symbol} has demonstrated ${age} days of stability</li>
<li>Increasing likelihood of legitimate project</li>
</ul>
<p><strong>Age Safety Rating: HIGH ✓</strong></p>`
    : age > 7
    ? `<p>⚠️ <strong>Past Initial Risk But Still Early</strong></p>
<p>The token survived the extremely high-risk first week but is still in the danger zone:</p>
<ul>
<li>Most rug pulls occur in first 7 days (passed)</li>
<li>Still within the 30-day critical period</li>
<li>Continue monitoring closely for warning signs</li>
<li>Risk decreases significantly after 30 days</li>
</ul>
<p><strong>Age Safety Rating: MEDIUM ⚠️</strong></p>`
    : `<p>⚠️ <strong>Extremely New Token - Maximum Risk</strong></p>
<p>This is a very new token in the highest risk period:</p>
<ul>
<li>⚠️ ~80% of rug pulls occur within first week</li>
<li>⚠️ Developers have not proven commitment</li>
<li>⚠️ Easy to abandon project with minimal cost</li>
<li>⚠️ Statistical risk is extremely high</li>
</ul>
<p><strong>Age Safety Rating: VERY LOW ⚠️</strong></p>`
}

<h2>Holder Distribution Analysis</h2>
${
  holders > 0
    ? `<p>${token.symbol} has <strong>${holders.toLocaleString()} holders</strong>.</p>

${
  holders > 10000
    ? `<p>✓ <strong>Wide Distribution - Safe</strong></p>
<p>A large holder base indicates:</p>
<ul>
<li>Widespread community adoption</li>
<li>Reduced single-wallet manipulation risk</li>
<li>Organic growth and sustained interest</li>
<li>Harder for coordinated dump scenarios</li>
</ul>
<p><strong>Holder Safety Rating: HIGH ✓</strong></p>`
    : holders > 1000
    ? `<p>⚠️ <strong>Growing Distribution - Moderate Safety</strong></p>
<p>An emerging holder base suggests:</p>
<ul>
<li>Community is developing</li>
<li>Still some concentration risk</li>
<li>Monitor for continued growth</li>
<li>Vulnerable to coordinated selling</li>
</ul>
<p><strong>Holder Safety Rating: MEDIUM ⚠️</strong></p>`
    : `<p>⚠️ <strong>Low Holder Count - High Risk</strong></p>
<p>Limited holders indicate:</p>
<ul>
<li>⚠️ High concentration in few wallets</li>
<li>⚠️ Vulnerable to single-wallet dumps</li>
<li>⚠️ Lack of organic community growth</li>
<li>⚠️ Potential insider concentration</li>
</ul>
<p><strong>Holder Safety Rating: LOW ⚠️</strong></p>`
}

${
  token.topHolderPercentage
    ? `<h3>Top Holder Concentration</h3>
<p>Top holders control <strong>${token.topHolderPercentage.toFixed(1)}% of supply</strong>.</p>
${
  token.topHolderPercentage > 30
    ? `<p>⚠️ <strong>Dangerous Concentration</strong> - Over 30% concentration means a single entity could crash the price instantly.</p>`
    : token.topHolderPercentage > 15
    ? `<p>⚠️ <strong>Moderate Concentration</strong> - Top holders have significant influence over price action.</p>`
    : `<p>✓ <strong>Healthy Distribution</strong> - Power is decentralized across multiple participants.</p>`
}`
    : ""
}`
    : `<p>Holder data is currently being collected for ${token.symbol}. Check back for updated analysis.</p>`
}

<h2>SOLRAD Safety Score</h2>
<p>${token.symbol} has a <strong>SOLRAD Score of ${score}/100</strong> with <strong>${token.riskLabel}</strong> classification.</p>

${
  score >= 70
    ? `<p>✓ <strong>High Safety Score</strong></p>
<p>A score above 70 indicates multiple positive safety factors:</p>
<ul>
<li>Strong liquidity foundations</li>
<li>Verified contract security or low-risk profile</li>
<li>Healthy holder distribution</li>
<li>Consistent market activity</li>
</ul>
<p>While no token is completely safe, ${token.symbol} demonstrates above-average safety indicators.</p>`
    : score >= 50
    ? `<p>⚠️ <strong>Moderate Safety Score</strong></p>
<p>A score of ${score}/100 suggests mixed signals:</p>
<ul>
<li>Some positive safety indicators</li>
<li>Some concerning risk factors</li>
<li>Requires active monitoring</li>
<li>Not suitable for risk-averse investors</li>
</ul>
<p>Exercise increased caution and never invest more than you can afford to lose.</p>`
    : `<p>⚠️ <strong>Low Safety Score</strong></p>
<p>A score below 50 indicates multiple risk factors:</p>
<ul>
<li>⚠️ Significant safety concerns detected</li>
<li>⚠️ Not recommended for most investors</li>
<li>⚠️ Extreme risk of total loss</li>
<li>⚠️ Only for high-risk speculators</li>
</ul>
<p>This token should be approached with extreme caution or avoided entirely.</p>`
}

<h2>Rug Pull Risk Assessment</h2>
<p><strong>Overall Rug Pull Risk: ${
    token.riskLabel === "HIGH RISK"
      ? "VERY HIGH ⚠️"
      : token.riskLabel === "MEDIUM RISK"
      ? "MODERATE ⚠️"
      : "LOW ✓"
  }</strong></p>

<p>Based on comprehensive analysis:</p>
<ul>
<li>Contract Security: ${
    token.mintAuthority === null && token.freezeAuthority === null
      ? "✓ Safe (authorities revoked)"
      : "⚠️ Risk (active authorities)"
  }</li>
<li>Liquidity Depth: ${
    liquidity > 1000000 ? "✓ Safe (>$1M)" : liquidity > 100000 ? "⚠️ Moderate ($100K-$1M)" : "⚠️ High Risk (<$100K)"
  }</li>
<li>Token Age: ${age > 30 ? "✓ Established (>30 days)" : age > 7 ? "⚠️ Early (7-30 days)" : "⚠️ Very New (<7 days)"}</li>
<li>Holder Distribution: ${holders > 1000 ? "✓ Growing community" : "⚠️ Limited holders"}</li>
</ul>

<h2>Safety Recommendations</h2>

${
  token.riskLabel === "LOW RISK"
    ? `<h3>For ${token.symbol} - Relatively Safe Approach</h3>
<ul>
<li>✓ Can consider standard position sizing (1-5% of portfolio)</li>
<li>✓ Set stop losses 15-20% below entry</li>
<li>✓ Monitor liquidity and holder trends weekly</li>
<li>Still use proper risk management - no investment is 100% safe</li>
</ul>`
    : token.riskLabel === "MEDIUM RISK"
    ? `<h3>For ${token.symbol} - Cautious Approach Required</h3>
<ul>
<li>⚠️ Limit position size to 0.5-2% of portfolio</li>
<li>⚠️ Set tight stop losses 10-15% below entry</li>
<li>⚠️ Monitor liquidity and contract changes daily</li>
<li>⚠️ Be prepared to exit quickly if red flags appear</li>
<li>Not suitable for risk-averse investors</li>
</ul>`
    : `<h3>For ${token.symbol} - High Risk Approach</h3>
<ul>
<li>⚠️ Only allocate "gambling money" you can lose entirely</li>
<li>⚠️ Position size: absolute maximum 0.5% of portfolio</li>
<li>⚠️ Set stop losses 5-10% below entry (if any liquidity)</li>
<li>⚠️ Monitor continuously - this is active speculation</li>
<li>⚠️ Exit at first sign of trouble</li>
<li><strong>NOT RECOMMENDED</strong> for most investors</li>
</ul>`
}

<h2>Red Flags to Watch</h2>
<p>Immediately exit ${token.symbol} if you observe:</p>
<ul>
<li>🚨 Sudden liquidity decrease (>20% in 24 hours)</li>
<li>🚨 Developer wallet dumping large amounts</li>
<li>🚨 Social media accounts deleted or abandoned</li>
<li>🚨 Mint authority suddenly activated</li>
<li>🚨 Top holder percentage rapidly increasing</li>
<li>🚨 Volume/liquidity ratio becomes extreme (>10x)</li>
<li>🚨 Price crashes >50% on low volume</li>
</ul>

<h2>Using SOLRAD for Safety Monitoring</h2>
<p>Track ${token.symbol} safety in real-time:</p>
<ul>
<li><strong>Score Tracking:</strong> Monitor SOLRAD score changes that indicate deteriorating safety</li>
<li><strong>Liquidity Alerts:</strong> Get notified of significant liquidity movements</li>
<li><strong>Holder Analysis:</strong> Track holder count and distribution changes</li>
<li><strong>Risk Label Updates:</strong> See when risk classification changes</li>
</ul>

<p><a href="https://www.solrad.io/token/${token.mint}">Monitor ${token.symbol} Safety on SOLRAD →</a></p>

<h2>Final Verdict: Is ${token.symbol} Safe?</h2>
<p><strong>Safety Rating: ${
    token.riskLabel === "LOW RISK"
      ? "RELATIVELY SAFE ✓"
      : token.riskLabel === "MEDIUM RISK"
      ? "MODERATE RISK ⚠️"
      : "HIGH RISK ⚠️"
  }</strong></p>

<p>${
    token.riskLabel === "LOW RISK"
      ? `${token.symbol} demonstrates relatively strong safety indicators with ${
          liquidity > 1000000 ? "deep liquidity, " : ""
        }${
          token.mintAuthority === null && token.freezeAuthority === null ? "verified contract security, " : ""
        }${age > 30 ? "proven track record, " : ""}and a SOLRAD score of ${score}/100. While no crypto investment is completely safe, ${token.symbol} shows above-average safety characteristics for a Solana token.`
      : token.riskLabel === "MEDIUM RISK"
      ? `${token.symbol} presents a moderate safety profile with mixed signals. The token has some positive indicators but also concerning factors including ${
          liquidity < 500000 ? "limited liquidity, " : ""
        }${age < 30 ? "recent launch, " : ""}${
          token.mintAuthority || token.freezeAuthority ? "active contract authorities, " : ""
        }requiring careful monitoring. Only suitable for risk-tolerant traders with proper risk management.`
      : `${token.symbol} shows multiple high-risk indicators including ${liquidity < 100000 ? "very low liquidity, " : ""}${
          age < 7 ? "extremely recent launch, " : ""
        }${
          token.mintAuthority || token.freezeAuthority ? "active contract authorities, " : ""
        }and a SOLRAD score of ${score}/100. This token is NOT SAFE for most investors and carries extreme risk of total loss. Only consider if you are a high-risk speculator fully prepared to lose your entire investment.`
  }</p>

<p><strong>Remember:</strong> Always conduct your own research, never invest more than you can afford to lose completely, and diversify your portfolio across multiple assets. Use SOLRAD's tools to monitor safety indicators continuously.</p>
`.trim()

  return {
    slug: `is-${token.symbol.toLowerCase()}-safe`,
    title: `Is ${token.symbol} Safe to Buy? ${age < 7 ? "New Token" : ""} Security Analysis & Rug Pull Check`,
    description: `Safety analysis of ${token.symbol}: Contract security ${
      token.mintAuthority === null ? "✓" : "⚠️"
    }, $${liquidityM}M liquidity, ${age} days old. SOLRAD score ${score}/100, ${token.riskLabel}.`,
    content,
    category: "safety",
    keywords: [
      `is ${token.symbol} safe`,
      `${token.symbol} rug pull`,
      `${token.symbol} scam`,
      `${token.symbol} security analysis`,
      `${token.symbol} contract audit`,
      "solana token safety",
    ],
    readTime: 10,
    publishedAt: new Date(),
  }
}

/**
 * Generate wallet behavior analysis article
 */
export function generateWalletAnalysisArticle(token: TokenScore): GeneratedArticle {
  const holders = token.holderCount || 0
  const topHolder = token.topHolderPercentage || 0
  const score = token.totalScore

  const content = `
<h2>Wallet Behavior Overview</h2>
<p>Understanding wallet behavior for <strong>${token.name} (${token.symbol})</strong> reveals critical insights about holder sentiment, smart money movements, and concentration risk. This analysis examines ${holders > 0 ? `${holders.toLocaleString()} holders` : "holder distribution"} to identify trends that impact price action.</p>

<h2>Holder Count Analysis</h2>
${
  holders > 0
    ? `<p>${token.symbol} currently has <strong>${holders.toLocaleString()} token holders</strong>.</p>

${
  holders > 10000
    ? `<p>✓ <strong>Strong Community Adoption</strong></p>
<p>With over 10,000 holders, ${token.symbol} demonstrates:</p>
<ul>
<li>Widespread community interest and adoption</li>
<li>Reduced manipulation risk from single wallets</li>
<li>Organic growth pattern indicating real utility or speculation</li>
<li>Decentralized ownership structure</li>
</ul>
<p>Large holder bases typically correlate with:</p>
<ul>
<li>More stable price action (harder to manipulate)</li>
<li>Sustained long-term interest</li>
<li>Community-driven price discovery</li>
<li>Lower single-entity dump risk</li>
</ul>`
    : holders > 1000
    ? `<p>⚠️ <strong>Growing Community Base</strong></p>
<p>With ${holders.toLocaleString()} holders, ${token.symbol} shows:</p>
<ul>
<li>Emerging community interest</li>
<li>Early growth phase indicators</li>
<li>Moderate concentration risk still present</li>
<li>Potential for expansion or contraction</li>
</ul>
<p>This holder range typically indicates:</p>
<ul>
<li>Token gaining traction but not yet established</li>
<li>Vulnerable to coordinated selling pressure</li>
<li>Monitor for continued holder growth as bullish signal</li>
<li>Watch for holder decline as bearish warning</li>
</ul>`
    : `<p>⚠️ <strong>Limited Holder Base - High Concentration</strong></p>
<p>With only ${holders.toLocaleString()} holders, ${token.symbol} indicates:</p>
<ul>
<li>⚠️ Very early stage or limited interest</li>
<li>⚠️ High concentration in few wallets</li>
<li>⚠️ Vulnerable to single-wallet price manipulation</li>
<li>⚠️ Potential insider control</li>
</ul>
<p>Low holder counts signal:</p>
<ul>
<li>Extreme volatility risk from any wallet movement</li>
<li>Lack of organic community growth</li>
<li>Possible developer/insider dominated supply</li>
<li>High risk of coordinated dumps</li>
</ul>`
}`
    : `<p>Holder data for ${token.symbol} is currently being collected. Advanced wallet behavior analysis will be available once on-chain data is indexed.</p>

<h3>Why Holder Data Matters</h3>
<p>Understanding holder counts helps identify:</p>
<ul>
<li>Community adoption and interest levels</li>
<li>Concentration risk from few large holders</li>
<li>Organic vs. artificial demand</li>
<li>Long-term sustainability indicators</li>
</ul>`
}

<h2>Top Holder Concentration</h2>
${
  topHolder > 0
    ? `<p>Top holders control approximately <strong>${topHolder.toFixed(1)}% of ${token.symbol} supply</strong>.</p>

${
  topHolder > 30
    ? `<p>⚠️ <strong>Dangerous Concentration Risk</strong></p>
<p>Over 30% concentration in top wallets is a major red flag:</p>
<ul>
<li>⚠️ Single entity could crash price instantly</li>
<li>⚠️ Indicates insider or developer control</li>
<li>⚠️ Extremely vulnerable to coordinated selling</li>
<li>⚠️ Suggests low retail participation</li>
</ul>

<h3>Concentration Risk Implications</h3>
<p>When top holders control >30% of supply:</p>
<ul>
<li>🚨 Can dump and eliminate liquidity in minutes</li>
<li>🚨 Regular holders have no defense against major dumps</li>
<li>🚨 Price is at mercy of a few wallet decisions</li>
<li>🚨 Indicates potential for exit scam or rug pull</li>
</ul>

<p><strong>Recommendation:</strong> Extreme caution advised. This concentration level is unacceptable for most investors.</p>`
    : topHolder > 15
    ? `<p>⚠️ <strong>Moderate Concentration Risk</strong></p>
<p>15-30% concentration in top holders indicates:</p>
<ul>
<li>⚠️ Significant influence from few wallets</li>
<li>⚠️ Price vulnerable to top holder decisions</li>
<li>⚠️ Moderate manipulation potential</li>
<li>Still within acceptable range for early-stage tokens</li>
</ul>

<h3>Monitoring Top Holder Behavior</h3>
<p>With moderate concentration, watch for:</p>
<ul>
<li>Top holder wallets accumulating or distributing</li>
<li>Changes in concentration over time (improving or worsening)</li>
<li>Correlation between top holder moves and price action</li>
<li>New wallets entering top holder ranks</li>
</ul>

<p><strong>Recommendation:</strong> Acceptable for risk-tolerant traders but requires active monitoring.</p>`
    : `<p>✓ <strong>Healthy Distribution</strong></p>
<p>Less than 15% concentration in top holders indicates:</p>
<ul>
<li>✓ Decentralized ownership structure</li>
<li>✓ Reduced single-wallet manipulation risk</li>
<li>✓ Power distributed across many participants</li>
<li>✓ Healthy for long-term sustainability</li>
</ul>

<h3>Benefits of Low Concentration</h3>
<p>When top holders control <15% of supply:</p>
<ul>
<li>More democratic price discovery</li>
<li>Harder for any single entity to manipulate</li>
<li>Community-driven price action</li>
<li>Better resilience to selling pressure</li>
</ul>

<p><strong>Recommendation:</strong> This is a positive signal for token health and safety.</p>`
}`
    : `<p>Top holder concentration data is being analyzed. This metric will be available once wallet distribution analysis completes.</p>

<h3>Why Concentration Matters</h3>
<p>Top holder concentration reveals:</p>
<ul>
<li>How much power few wallets have over price</li>
<li>Risk of coordinated dumps</li>
<li>Whether token is community-owned or insider-controlled</li>
<li>Vulnerability to manipulation</li>
</ul>`
}

<h2>Wallet Behavior Patterns</h2>
<p>Analyzing on-chain behavior for ${token.symbol} reveals:</p>

<h3>Smart Money Activity</h3>
<p>Smart money wallets (experienced traders with proven track records) provide valuable signals:</p>
<ul>
<li><strong>Accumulation Phase:</strong> Smart money buying during consolidation or dips</li>
<li><strong>Distribution Phase:</strong> Smart money exiting during pumps or strength</li>
<li><strong>Position Sizing:</strong> Large smart money positions indicate high conviction</li>
<li><strong>Hold Duration:</strong> Smart money holding longer suggests bullish outlook</li>
</ul>

${
  token.priceChange24h > 10
    ? `<p>Recent price movement (+${token.priceChange24h.toFixed(1)}%) combined with wallet analysis suggests smart money may be participating in momentum.</p>`
    : token.priceChange24h < -10
    ? `<p>Recent price decline (${token.priceChange24h.toFixed(1)}%) may indicate smart money distribution or exit. Monitor for stabilization signals.</p>`
    : `<p>Stable price action suggests balanced smart money positioning with neither aggressive accumulation nor distribution.</p>`
}

<h3>Retail vs. Whale Behavior</h3>
<p>Understanding the balance between retail and whale participation:</p>
<ul>
<li><strong>Retail Dominance:</strong> Many small wallets = organic community growth but vulnerable to whale entry</li>
<li><strong>Whale Dominance:</strong> Few large wallets = price control by entities with significant capital</li>
<li><strong>Balanced Mix:</strong> Healthy tokens show growing retail base with engaged whales</li>
</ul>

${
  holders > 5000 && topHolder < 20
    ? `<p>${token.symbol} shows signs of balanced participation with growing retail base (${holders.toLocaleString()} holders) and acceptable whale concentration (${topHolder.toFixed(1)}%).</p>`
    : holders > 1000
    ? `<p>${token.symbol} is in transition with ${holders.toLocaleString()} holders but monitor concentration to ensure healthy balance develops.</p>`
    : `<p>${token.symbol} appears to be in early stages with limited holders. Watch for organic retail growth as a bullish signal.</p>`
}

<h3>Holder Churn Rate</h3>
<p>Tracking how quickly wallets buy and sell reveals commitment levels:</p>
<ul>
<li><strong>Low Churn (Hodlers):</strong> Wallets holding long-term suggest conviction and stability</li>
<li><strong>High Churn (Traders):</strong> Frequent buying/selling indicates speculation and volatility</li>
<li><strong>Increasing Churn:</strong> Warning sign of losing holder confidence</li>
<li><strong>Decreasing Churn:</strong> Positive signal of developing holder base</li>
</ul>

<h2>Wallet Movement Analysis</h2>
<p>Recent wallet activity patterns for ${token.symbol}:</p>

<h3>Accumulation Signals</h3>
<p>Look for these bullish wallet behaviors:</p>
<ul>
<li>New wallets entering with significant positions</li>
<li>Existing holders adding to positions during dips</li>
<li>Smart money wallets initiating positions</li>
<li>Holder count steadily increasing</li>
<li>Top holder concentration decreasing (distribution to more wallets)</li>
</ul>

<h3>Distribution Signals</h3>
<p>Watch for these bearish wallet warnings:</p>
<ul>
<li>Top holders selling into strength</li>
<li>Smart money wallets exiting positions</li>
<li>Holder count declining</li>
<li>Large wallet transfers to exchanges</li>
<li>Top holder concentration increasing (consolidation to fewer wallets)</li>
</ul>

<h2>Using SOLRAD for Wallet Tracking</h2>
<p>Track ${token.symbol} wallet behavior in real-time with SOLRAD:</p>

<h3>Holder Monitoring Tools</h3>
<ul>
<li><strong>Live Holder Count:</strong> Track total holders in real-time</li>
<li><strong>Concentration Alerts:</strong> Get notified when top holder percentage changes significantly</li>
<li><strong>Smart Money Tracking:</strong> Identify when known successful wallets enter or exit</li>
<li><strong>Whale Activity:</strong> Monitor large wallet movements that impact price</li>
</ul>

<h3>Advanced Wallet Analytics</h3>
<ul>
<li>Track individual wallet profit/loss</li>
<li>Identify holder cohorts (early buyers, recent entries)</li>
<li>Monitor wallet age and conviction levels</li>
<li>Analyze correlation between wallet moves and price</li>
</ul>

<p><a href="https://www.solrad.io/token/${token.mint}">Monitor ${token.symbol} Wallet Activity on SOLRAD →</a></p>

<h2>Holder Sentiment Indicators</h2>
<p>Based on wallet behavior analysis for ${token.symbol}:</p>

${
  holders > 5000 && topHolder < 15
    ? `<p>✓ <strong>Bullish Holder Sentiment</strong></p>
<ul>
<li>Strong community base (${holders.toLocaleString()}+ holders)</li>
<li>Healthy distribution (top holders <15%)</li>
<li>Indicates organic growth and sustainable interest</li>
<li>Reduced manipulation risk</li>
</ul>`
    : holders > 1000 && topHolder < 30
    ? `<p>⚠️ <strong>Neutral Holder Sentiment</strong></p>
<ul>
<li>Developing community base (${holders.toLocaleString()} holders)</li>
<li>Moderate concentration (${topHolder.toFixed(1)}% in top holders)</li>
<li>Watch for trend development (improving or deteriorating)</li>
<li>Could swing bullish or bearish based on holder growth</li>
</ul>`
    : `<p>⚠️ <strong>Bearish Holder Sentiment</strong></p>
<ul>
<li>Limited holder base ${holders > 0 ? `(${holders.toLocaleString()} holders)` : "(data pending)"}</li>
<li>${topHolder > 0 ? `High concentration (${topHolder.toFixed(1)}% in top holders)` : "Concentration data pending"}</li>
<li>Indicates lack of organic community growth</li>
<li>High manipulation and dump risk</li>
</ul>`
}

<h2>Wallet Behavior Recommendations</h2>

<h3>For New Investors</h3>
<p>Before buying ${token.symbol}, verify:</p>
<ul>
<li>Holder count is growing (bullish) or stable (acceptable)</li>
<li>Top holder concentration is decreasing or stable (improving distribution)</li>
<li>No sudden large wallet accumulation (could indicate insider front-running)</li>
<li>Smart money activity aligns with your thesis</li>
</ul>

<h3>For Current Holders</h3>
<p>Monitor these wallet red flags to protect positions:</p>
<ul>
<li>🚨 Top holders suddenly dumping large amounts</li>
<li>🚨 Holder count declining rapidly</li>
<li>🚨 Smart money wallets exiting en masse</li>
<li>🚨 Top holder concentration spiking (consolidation warning)</li>
<li>🚨 Large transfers to exchange wallets (impending selling pressure)</li>
</ul>

<h2>Conclusion: ${token.symbol} Wallet Analysis</h2>
<p><strong>Holder Health Rating: ${
    holders > 5000 && topHolder < 15
      ? "STRONG ✓"
      : holders > 1000 && topHolder < 30
      ? "MODERATE ⚠️"
      : "WEAK ⚠️"
  }</strong></p>

<p>${
    holders > 5000 && topHolder < 15
      ? `${token.symbol} demonstrates healthy wallet behavior with ${holders.toLocaleString()} holders and low concentration (${topHolder.toFixed(1)}% in top holders). This indicates organic community growth, reduced manipulation risk, and sustainable holder interest. Wallet metrics support a positive outlook for price stability and growth potential.`
      : holders > 1000 && topHolder < 30
      ? `${token.symbol} shows developing wallet behavior with ${holders.toLocaleString()} holders and moderate concentration (${topHolder.toFixed(1)}% in top holders). Continue monitoring for holder growth and improving distribution as positive signals. Current metrics suggest moderate risk with potential for improvement or deterioration.`
      : `${token.symbol} displays concerning wallet behavior with ${
          holders > 0 ? `limited holders (${holders.toLocaleString()})` : "pending holder data"
        } and ${
          topHolder > 0 ? `high concentration (${topHolder.toFixed(1)}% in top holders)` : "pending concentration data"
        }. This indicates elevated risk from potential manipulation, lack of community support, and vulnerability to coordinated selling. Exercise extreme caution.`
  }</p>

<p>Use SOLRAD's wallet tracking tools to monitor ${token.symbol} holder behavior in real-time and make data-driven decisions based on actual wallet movements, not speculation.</p>
`.trim()

  return {
    slug: `${token.symbol.toLowerCase()}-wallet-behavior-analysis`,
    title: `${token.symbol} Wallet Analysis: Holder Behavior & Smart Money Tracking`,
    description: `${token.symbol} has ${holders > 0 ? `${holders.toLocaleString()} holders` : "holder data pending"} with ${
      topHolder > 0 ? `${topHolder.toFixed(1)}%` : "pending"
    } top concentration. Analysis of wallet behavior, smart money, and holder sentiment.`,
    content,
    category: "wallet-analysis",
    keywords: [
      `${token.symbol} wallet tracker`,
      `${token.symbol} holders`,
      `${token.symbol} smart money`,
      `${token.symbol} whale tracking`,
      `${token.symbol} holder analysis`,
      "solana wallet behavior",
    ],
    readTime: 9,
    publishedAt: new Date(),
  }
}

/**
 * Get all article types for a token
 */
export function generateAllArticles(token: TokenScore): GeneratedArticle[] {
  return [generateTrendingArticle(token), generateSafetyArticle(token), generateWalletAnalysisArticle(token)]
}

/**
 * Generate article slug from token and category
 */
export function getArticleSlug(tokenSymbol: string, category: "trending" | "safety" | "wallet-analysis"): string {
  const slug = tokenSymbol.toLowerCase()
  switch (category) {
    case "trending":
      return `why-is-${slug}-trending`
    case "safety":
      return `is-${slug}-safe`
    case "wallet-analysis":
      return `${slug}-wallet-behavior-analysis`
  }
}

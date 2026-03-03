export interface Article {
  slug: string
  title: string
  description: string
  category: "solana" | "tokens" | "wallets" | "security"
  readTime: string
  lastUpdated: string
  content: {
    intro: string
    sections: Array<{
      heading: string
      content: string
      subsections?: Array<{
        subheading: string
        content: string
      }>
    }>
    keyTakeaways: string[]
  }
  relatedArticles: string[]
  keywords: string[]
}

export const learnArticles: Article[] = [
  // SOLANA CATEGORY
  {
    slug: "what-is-solana",
    title: "What is Solana? A Complete Guide to the High-Speed Blockchain",
    description:
      "Learn everything about Solana blockchain, its proof-of-history consensus mechanism, and why it's revolutionizing decentralized applications.",
    category: "solana",
    readTime: "8 min read",
    lastUpdated: "2026-01-26",
    content: {
      intro:
        "Solana is a high-performance blockchain platform designed for decentralized applications and cryptocurrency projects. Unlike traditional blockchains that struggle with speed and cost, Solana processes thousands of transactions per second at minimal fees, making it one of the fastest and most cost-effective blockchain networks available.",
      sections: [
        {
          heading: "Understanding Solana's Architecture",
          content:
            "Solana's revolutionary architecture combines eight key innovations to achieve unprecedented performance. The core innovation is Proof of History (PoH), a cryptographic clock that timestamps transactions before they enter the blockchain. This allows validators to process transactions in parallel rather than sequentially, dramatically increasing throughput.",
        },
        {
          heading: "Proof of History: Solana's Secret Weapon",
          content:
            "Proof of History is not a consensus mechanism itself, but rather a clock that proves that an event occurred at a specific moment in time. By creating a historical record that proves events occurred in a particular sequence, Solana validators can verify transactions without communicating with each other in real-time. This reduces network congestion and enables processing speeds of 65,000+ transactions per second.",
        },
        {
          heading: "Why Solana Matters for Token Traders",
          content:
            "For cryptocurrency traders, Solana's speed and low costs open up opportunities that are impractical on slower blockchains. High-frequency trading, automated market makers, and meme coin launches all benefit from Solana's sub-second finality and transaction fees typically under $0.01. This has made Solana a hotbed for emerging tokens and DeFi protocols.",
          subsections: [
            {
              subheading: "Transaction Speed Comparison",
              content:
                "Ethereum processes 15-30 transactions per second, while Solana handles 2,000-4,000 TPS in practice (with theoretical capacity of 65,000 TPS). This speed advantage makes Solana ideal for high-volume trading and real-time applications.",
            },
            {
              subheading: "Cost Advantages",
              content:
                "While Ethereum gas fees can reach $50-200 during peak times, Solana transaction costs remain consistent at $0.00025 per transaction. This makes micro-transactions and frequent trading economically viable.",
            },
          ],
        },
        {
          heading: "Solana's Ecosystem in 2026",
          content:
            "The Solana ecosystem has exploded with thousands of tokens, hundreds of DeFi protocols, and a thriving NFT marketplace. Major projects include decentralized exchanges like Jupiter and Raydium, lending protocols like MarginFi and Drift, and a wide variety of SPL tokens spanning meme coins, DeFi, gaming, and utility projects. SOLRAD tracks all trending Solana SPL tokens in real-time, providing intelligence on which projects are gaining momentum.",
        },
      ],
      keyTakeaways: [
        "Solana is the fastest blockchain for trading, processing 65,000+ TPS with sub-$0.01 fees",
        "Proof of History enables parallel transaction processing for unprecedented speed",
        "Solana's ecosystem is ideal for all SPL tokens including DeFi, meme coins, and high-frequency trading",
        "Use SOLRAD to track trending Solana tokens and find gems before they explode",
      ],
    },
    relatedArticles: [
      "how-to-find-solana-gems",
      "understanding-token-liquidity",
      "solana-wallet-security",
    ],
    keywords: [
      "what is solana",
      "solana blockchain",
      "proof of history",
      "solana speed",
      "solana vs ethereum",
    ],
  },
  {
    slug: "solana-vs-ethereum",
    title: "Solana vs Ethereum: Speed, Cost, and Ecosystem Comparison 2026",
    description:
      "Deep dive comparison of Solana and Ethereum for token trading, DeFi, and NFTs. Which blockchain is better for finding gems in 2026?",
    category: "solana",
    readTime: "10 min read",
    lastUpdated: "2026-01-26",
    content: {
      intro:
        "The battle between Solana and Ethereum has defined the blockchain landscape. While Ethereum pioneered smart contracts and DeFi, Solana has emerged as the speed and cost leader. For token traders and gem hunters, understanding the differences is crucial for maximizing profits.",
      sections: [
        {
          heading: "Performance: Speed and Scalability",
          content:
            "Ethereum processes 15-30 transactions per second with 12-second block times. Solana, by contrast, handles 2,000-4,000 TPS in production with 400ms block times. This 100x speed advantage makes Solana the clear winner for high-frequency trading, meme coin launches, and real-time applications. When a viral token pumps, Solana users can enter and exit positions in seconds, while Ethereum traders wait minutes for transaction confirmations.",
        },
        {
          heading: "Transaction Costs: The Fee Wars",
          content:
            "Ethereum's gas fees range from $5-200 depending on network congestion, making small trades uneconomical. Solana maintains consistent fees of $0.00025 per transaction regardless of network activity. For traders executing multiple trades daily, the cost difference is substantial. A trader making 100 transactions monthly pays $0.025 on Solana vs $500-20,000 on Ethereum.",
        },
        {
          heading: "Token Ecosystem Comparison",
          content:
            "Ethereum hosts 500,000+ tokens including established projects like Uniswap, Aave, and major stablecoins. Solana has 50,000+ SPL tokens with explosive growth across DeFi, meme coins, gaming, and utility tokens. While Ethereum has more total value locked, Solana's token ecosystem is more dynamic with frequent 10x-1000x gems emerging. SOLRAD tracks all Solana SPL tokens as they gain momentum.",
          subsections: [
            {
              subheading: "Token Ecosystem Growth",
              content:
                "Solana has become the de facto chain for new SPL token launches across all categories. Low costs enable developers to launch tokens instantly, and fast transactions allow viral growth. In 2026, Solana hosts 10x more new token launches than Ethereum, spanning meme coins, DeFi, gaming, and utility tokens.",
            },
            {
              subheading: "DeFi Maturity",
              content:
                "Ethereum's DeFi ecosystem is larger and more mature with $50B+ TVL, but Solana's DeFi protocols are growing faster with innovative projects like Jupiter (DEX aggregator) and MarginFi (lending). Solana DeFi users enjoy better capital efficiency due to lower gas costs.",
            },
          ],
        },
        {
          heading: "Which Chain for Token Trading?",
          content:
            "For gem hunters and active traders, Solana is the superior choice in 2026. The combination of speed, low costs, and explosive token launches creates more opportunities for asymmetric returns. Ethereum remains dominant for established DeFi protocols and high-value NFTs, but Solana is where 100x tokens are born. Use SOLRAD's real-time intelligence to catch Solana gems early before they go mainstream.",
        },
      ],
      keyTakeaways: [
        "Solana is 100x faster than Ethereum with 2,000-4,000 TPS vs 15-30 TPS",
        "Solana fees ($0.00025) are 20,000x cheaper than Ethereum's typical $5-50 gas fees",
        "Solana dominates emerging SPL tokens across all categories, Ethereum leads in established DeFi",
        "Active traders prefer Solana for speed and cost efficiency, SOLRAD tracks the best opportunities",
      ],
    },
    relatedArticles: [
      "what-is-solana",
      "how-to-find-solana-gems",
      "understanding-token-liquidity",
    ],
    keywords: [
      "solana vs ethereum",
      "solana ethereum comparison",
      "best blockchain for trading",
      "solana speed",
      "ethereum gas fees",
    ],
  },
  // TOKENS CATEGORY
  {
    slug: "how-to-find-gems",
    title: "How to Find Solana Gems with SOLRAD: 5-Step Framework",
    description:
      "The complete framework for finding 100x Solana tokens using SOLRAD's intelligence terminal. Learn the exact workflow top traders use to spot gems early.",
    category: "tokens",
    readTime: "15 min read",
    lastUpdated: "2026-01-29",
    content: {
      intro:
        "Finding hidden gem tokens before they explode requires a systematic approach combining on-chain data, risk analysis, and timing. This guide reveals the exact 5-step framework used by professional traders to identify 100x opportunities using SOLRAD's intelligence terminal.",
      sections: [
        {
          heading: "Step 1: Filter for Quality Signals",
          content:
            "Start with SOLRAD's Token Pool, which automatically filters tokens scoring 50+ across liquidity, volume, momentum, and quality metrics. This pre-filtered pool eliminates 95% of noise, letting you focus on tokens with validated fundamentals. Use the filter bar to narrow by score range (60-80 for early gems), volume spikes (300%+ 24h), and liquidity health.",
        },
        {
          heading: "Step 2: Analyze Risk Profile",
          content:
            "Before going deeper, verify the token's risk profile using SOLRAD's risk checker. Ensure liquidity is locked, contract ownership is renounced, mint authority is disabled, and there are no honeypot functions. Even promising tokens can be scams - this step protects your capital.",
        },
        {
          heading: "Step 3: Study Momentum & Holder Patterns",
          content:
            "Review 24-hour volume trends, holder distribution, and wallet activity. Look for steady accumulation by new wallets with SOL history (smart money), increasing holder count, and top 10 holders owning <40% of supply. SOLRAD's charts reveal these patterns instantly.",
        },
        {
          heading: "Step 4: Time Your Entry",
          content:
            "The best entry point is during consolidation after initial discovery but before viral breakout. Use SOLRAD's live updates to monitor momentum shifts. Set price alerts and be ready to act when volume accelerates. Don't chase pumps - wait for pullbacks to support levels.",
        },
        {
          heading: "Step 5: Monitor & Manage Position",
          content:
            "After entry, use SOLRAD's dashboard to track your token's score, volume, and risk signals in real-time. Set stop-losses at key support levels. Take partial profits as the token pumps (20% at 2x, 30% at 5x, etc.) to lock in gains while maintaining exposure to further upside.",
        },
      ],
      keyTakeaways: [
        "Start with Token Pool (50+ scores) to eliminate noise and focus on validated opportunities",
        "Always verify risk profile before entry - locked LP, renounced ownership, no honeypot",
        "Look for smart money accumulation patterns in holder distribution and wallet activity",
        "Time entries during consolidation phases, not during viral pumps",
        "Use SOLRAD's real-time monitoring to manage positions and take profits systematically",
      ],
    },
    relatedArticles: [
      "how-to-find-solana-gems",
      "understanding-token-liquidity",
      "identifying-rug-pulls",
    ],
    keywords: [
      "find solana gems",
      "solrad tutorial",
      "solana gem finder",
      "100x tokens",
      "how to use solrad",
    ],
  },
  {
    slug: "how-to-find-solana-gems",
    title: "How to Find Solana Gems: 7 Proven Strategies to Find 100x Tokens",
    description:
      "Master the art of finding hidden gem tokens on Solana before they explode. Learn volume analysis, holder patterns, and smart money signals.",
    category: "tokens",
    readTime: "12 min read",
    lastUpdated: "2026-01-26",
    content: {
      intro:
        "Finding hidden gem tokens before they explode is the holy grail of crypto trading. While most traders chase tokens after they've already pumped, smart money identifies gems early using data-driven signals. This guide reveals the exact strategies SOLRAD's intelligence engine uses to surface emerging Solana tokens with 10x-100x potential.",
      sections: [
        {
          heading: "Strategy 1: Volume Spike Detection",
          content:
            "Volume surges are the first sign of institutional or smart money entering a token. SOLRAD tracks 24-hour volume changes across all Solana tokens, flagging any token with 300%+ volume increase. However, volume alone isn't enough - you must verify the volume is organic and not wash trading. Look for steady buy pressure over multiple hours, not just a single massive spike.",
        },
        {
          heading: "Strategy 2: Liquidity Health Analysis",
          content:
            "A gem token needs sufficient liquidity to absorb trades without massive price impact. SOLRAD's liquidity health score evaluates total liquidity, liquidity-to-volume ratio, and pool stability. Ideal gems have $50K-500K liquidity (enough to trade but not overvalued) with locked or burned liquidity tokens. Avoid tokens with <$10K liquidity or unlocked LP that can be rugged.",
          subsections: [
            {
              subheading: "Liquidity Lock Indicators",
              content:
                "Check if liquidity tokens are locked using Solana explorers. Legitimate projects lock LP for 6-12 months minimum. No lock = red flag. SOLRAD's risk checker automatically identifies unlocked liquidity.",
            },
          ],
        },
        {
          heading: "Strategy 3: Holder Distribution Patterns",
          content:
            "Smart money accumulation creates specific holder patterns. Watch for: (1) Increasing holder count over 24-48 hours, (2) Top 10 holders owning <40% of supply, (3) New wallets with SOL history (not fresh sybil wallets) buying in. SOLRAD's wallet tracker identifies these patterns automatically, highlighting tokens with healthy distribution and smart money accumulation.",
        },
        {
          heading: "Strategy 4: Early Detection via SOLRAD Scoring",
          content:
            "SOLRAD's composite scoring system weights liquidity, volume, age, and holder metrics to identify gems in their early stages. Tokens with 60-80 scores are often in the sweet spot - validated fundamentals but not yet viral. Filter SOLRAD's dashboard by 'New/Early' and 'Fresh Signals' tabs to see emerging tokens before they hit mainstream awareness. Set alerts for tokens entering these categories.",
        },
        {
          heading: "Strategy 5: Social Momentum and Narrative",
          content:
            "The best gems have compelling narratives and growing social momentum. Monitor Twitter/X engagement, Telegram group growth, and community quality. Look for organic discussions about utility, team, or meme potential. Be wary of forced shilling or bot activity. SOLRAD doesn't track social directly but provides the on-chain data to validate social claims.",
        },
        {
          heading: "Strategy 6: Risk Assessment Before Entry",
          content:
            "Never buy a gem without checking risk factors. Use SOLRAD's risk checker to verify: contract ownership is renounced, mint authority disabled, liquidity locked, no honeypot functions. Even promising tokens can be scams. A 100x gem means nothing if you can't sell. Always verify risk labels before entering positions.",
        },
        {
          heading: "Strategy 7: Timing Your Entry",
          content:
            "The best entry point is during initial accumulation before viral breakout. Use SOLRAD to identify tokens with rising scores but low social awareness. Set price alerts and be ready to act when momentum accelerates. Gems typically offer multiple entry opportunities during consolidation phases - don't chase pumps, wait for pullbacks to support levels. Use SOLRAD's live updates to monitor momentum shifts in real-time.",
        },
      ],
      keyTakeaways: [
        "Use SOLRAD's volume spike alerts to catch gems as smart money accumulates",
        "Verify liquidity health (locked LP, $50K+ liquidity) before entering any token",
        "Filter SOLRAD by 60-80 scores to find validated gems before viral breakout",
        "Always check risk factors - renounced ownership, locked liquidity, no honeypot",
        "Time entries during consolidation, not during pumps. SOLRAD provides real-time signals.",
      ],
    },
    relatedArticles: [
      "understanding-token-liquidity",
      "solana-wallet-tracker-guide",
      "identifying-rug-pulls",
    ],
    keywords: [
      "find solana gems",
      "100x tokens",
      "solana gem finder",
      "how to find crypto gems",
      "solana token analysis",
    ],
  },
  {
    slug: "understanding-token-liquidity",
    title: "Understanding Token Liquidity: Why It Matters for Solana Traders",
    description:
      "Learn how liquidity affects your trades, why liquidity locks matter, and how to analyze liquidity health on Solana tokens.",
    category: "tokens",
    readTime: "9 min read",
    lastUpdated: "2026-01-26",
    content: {
      intro:
        "Liquidity is the lifeblood of token trading. It determines whether you can buy and sell without massive price slippage, and whether a token is a viable investment or a potential rug pull. Understanding liquidity mechanics is essential for successful Solana trading, especially when hunting for gems with 10x-100x potential.",
      sections: [
        {
          heading: "What is Token Liquidity?",
          content:
            "Liquidity refers to the total value of assets locked in a token's trading pool. On Solana, most tokens trade on decentralized exchanges (DEXs) like Raydium or Orca using automated market maker (AMM) pools. These pools contain pairs of tokens - typically the token you're trading and SOL or USDC. The larger the pool, the more liquidity available, and the less your trades will impact the price (slippage).",
        },
        {
          heading: "Why Liquidity Matters for Trading",
          content:
            "Low liquidity creates massive slippage. If a token has only $10K liquidity and you try to buy $1K worth, you might experience 15-30% price impact, meaning you pay far more than the displayed price. High liquidity ($100K+) allows larger trades with minimal slippage (1-3%). SOLRAD's liquidity health score evaluates whether a token has sufficient liquidity for your trading strategy.",
          subsections: [
            {
              subheading: "Calculating Slippage Risk",
              content:
                "As a rule of thumb, your trade size should be <5% of total liquidity to avoid excessive slippage. A token with $50K liquidity can handle $2.5K trades comfortably. Larger trades require proportionally more liquidity.",
            },
          ],
        },
        {
          heading: "Liquidity Locks and Rug Pull Prevention",
          content:
            "When developers launch a token, they provide initial liquidity by depositing tokens + SOL into a DEX pool and receive LP (liquidity provider) tokens in return. If developers hold these LP tokens, they can withdraw liquidity at any time, crashing the price to zero (a 'rug pull'). Legitimate projects lock LP tokens in time-locked contracts for 6-12+ months, proving they cannot rug. SOLRAD's risk checker automatically identifies unlocked liquidity as a critical red flag.",
        },
        {
          heading: "Analyzing Liquidity-to-Volume Ratio",
          content:
            "The liquidity-to-volume ratio reveals trading efficiency. A healthy token maintains a 1:1 to 1:3 ratio (e.g., $100K liquidity supporting $100K-300K daily volume). Ratios >1:5 indicate insufficient liquidity for volume, causing high slippage and volatility. Ratios <1:1 suggest overprovisioned liquidity relative to demand. SOLRAD tracks this metric for all tokens, helping you avoid low-liquidity traps.",
        },
        {
          heading: "Liquidity Growth Patterns",
          content:
            "Strong gems show steady liquidity growth as confidence builds. Watch for: (1) Liquidity increasing 20-50% over 7 days, (2) Multiple liquidity providers adding to pools, (3) Liquidity remaining stable during price volatility. Declining liquidity during price pumps is a warning sign of smart money exiting. SOLRAD's charts show liquidity trends over time, revealing whether a token is accumulating or distributing.",
        },
      ],
      keyTakeaways: [
        "Liquidity determines slippage - aim for tokens with $50K+ liquidity for comfortable trading",
        "Always verify LP tokens are locked using SOLRAD's risk checker - unlocked LP is a rug risk",
        "Healthy liquidity-to-volume ratio is 1:1 to 1:3, avoid tokens with >1:5 ratio",
        "Watch for steady liquidity growth as a sign of building confidence and smart money accumulation",
        "Use SOLRAD's liquidity health scores to filter out low-liquidity traps before you trade",
      ],
    },
    relatedArticles: [
      "how-to-find-solana-gems",
      "identifying-rug-pulls",
      "token-volume-analysis",
    ],
    keywords: [
      "token liquidity",
      "solana liquidity",
      "liquidity locks",
      "rug pull prevention",
      "trading slippage",
    ],
  },
  // WALLETS CATEGORY
  {
    slug: "solana-wallet-security",
    title: "Solana Wallet Security: How to Protect Your Assets from Scams",
    description:
      "Essential security practices for Solana wallets. Learn about hardware wallets, private key management, and avoiding common scams on Solana.",
    category: "wallets",
    readTime: "11 min read",
    lastUpdated: "2026-01-26",
    content: {
      intro:
        "Protecting your Solana wallet is paramount in the Wild West of crypto trading. Scams, phishing attacks, and contract exploits are rampant, targeting both newcomers and experienced traders. This comprehensive guide covers essential security practices to keep your assets safe while actively trading Solana tokens.",
      sections: [
        {
          heading: "Choosing the Right Wallet Type",
          content:
            "Solana wallets come in three categories: hardware wallets (Ledger, Trezor), software wallets (Phantom, Solflare), and web wallets. Hardware wallets provide the highest security by storing private keys offline, making them immune to online attacks. However, they're less convenient for active trading. Software wallets like Phantom balance security and usability, ideal for traders who need quick access. Never use exchange wallets as long-term storage - you don't control the private keys.",
          subsections: [
            {
              subheading: "Hardware Wallet Best Practices",
              content:
                "Always buy hardware wallets directly from manufacturers, never from third parties. Verify the device hasn't been tampered with. Use hardware wallets for holding large amounts long-term, and a hot wallet for active trading with smaller amounts.",
            },
          ],
        },
        {
          heading: "Private Key and Seed Phrase Protection",
          content:
            "Your seed phrase (12-24 words) is the master key to your wallet. Anyone with your seed phrase controls your funds. Never store seed phrases digitally - no screenshots, cloud storage, or password managers. Write them on paper or metal plates, store in secure locations like safes. Never share seed phrases with anyone claiming to be support - all seed phrase requests are scams. Use multi-word passphrases for added security.",
        },
        {
          heading: "Avoiding Phishing and Fake Sites",
          content:
            "Phishing sites mimic legitimate wallet interfaces to steal credentials. Always bookmark correct URLs (phantom.app, solflare.com) and only use those bookmarks. Verify HTTPS and site certificates. Be suspicious of urgent messages demanding immediate action. SOLRAD never asks for wallet connections or signatures - we're read-only. Any site requesting wallet interaction should be verified through official channels.",
        },
        {
          heading: "Transaction Approval Safety",
          content:
            "Before approving any transaction, carefully review what you're signing. Malicious contracts can drain your wallet through innocent-looking approvals. Check: (1) The contract address matches expected protocols, (2) Token approval amounts are reasonable, (3) You initiated the transaction (not a pop-up). Use Phantom's transaction simulation feature to preview outcomes. Never approve unlimited token allowances.",
        },
        {
          heading: "Hot Wallet / Cold Wallet Strategy",
          content:
            "Professional traders use a two-wallet strategy: a 'hot wallet' with 5-10% of capital for active trading, and a 'cold wallet' (hardware) for long-term holdings. This limits exposure - if your hot wallet is compromised, you lose only a fraction of your portfolio. Transfer profits from hot to cold wallet regularly. SOLRAD's read-only approach means you can monitor positions without exposing wallets.",
        },
        {
          heading: "Recognizing Common Solana Scams",
          content:
            "Be aware of prevalent scams: (1) Fake airdrops claiming free tokens that drain wallets, (2) Honeypot tokens that can be bought but not sold, (3) Social engineering where scammers impersonate team members, (4) Rug pulls where developers drain liquidity. SOLRAD's risk checker identifies many technical red flags, but always perform due diligence before buying any token.",
        },
      ],
      keyTakeaways: [
        "Use hardware wallets for long-term storage, hot wallets for active trading with <10% of capital",
        "Never store seed phrases digitally - write on paper/metal and secure physically",
        "Verify all transaction approvals carefully - malicious contracts can drain wallets",
        "SOLRAD is read-only and never requests wallet connections or signatures",
        "Always check SOLRAD's risk labels before buying any token to avoid common scams",
      ],
    },
    relatedArticles: [
      "identifying-rug-pulls",
      "solana-wallet-tracker-guide",
      "how-to-find-solana-gems",
    ],
    keywords: [
      "solana wallet security",
      "crypto wallet safety",
      "protect crypto assets",
      "solana scams",
      "hardware wallet guide",
    ],
  },
  {
    slug: "solana-wallet-tracker-guide",
    title: "How to Track Solana Wallets: Follow Smart Money for Alpha",
    description:
      "Learn how to identify and track profitable Solana wallets to replicate successful trading strategies and find gems early.",
    category: "wallets",
    readTime: "10 min read",
    lastUpdated: "2026-01-26",
    content: {
      intro:
        "Following smart money wallets is one of the most powerful strategies for finding alpha in crypto. By tracking wallets with proven track records, you can identify gems before they go viral, understand accumulation patterns, and replicate successful trading strategies. This guide teaches you how to find, analyze, and track high-performing Solana wallets using on-chain data.",
      sections: [
        {
          heading: "Why Track Wallets?",
          content:
            "Smart money wallets - those of successful traders, VCs, and insiders - often accumulate tokens weeks before public awareness. By monitoring their on-chain activity, you can piggyback on their research and market intelligence. Wallet tracking reveals: (1) Which tokens smart money is accumulating, (2) Entry and exit price points, (3) Position sizing and risk management, (4) New token discoveries before they trend. This information is pure alpha.",
        },
        {
          heading: "Identifying Smart Money Wallets",
          content:
            "Not all wallets are worth tracking. Focus on wallets with: (1) History of early entries into successful tokens, (2) Consistent profitability over 3+ months, (3) Meaningful transaction sizes ($5K-100K), (4) Diverse but focused portfolio (10-50 tokens). You can find these wallets by: analyzing top holders of successful recent tokens, following known traders on Twitter who share wallet addresses, using SOLRAD to identify tokens with accumulation patterns then checking top buyers.",
          subsections: [
            {
              subheading: "Using On-Chain Explorers",
              content:
                "Solscan and Solana Explorer allow you to view any wallet's full transaction history, token holdings, and trading activity. Enter a wallet address to see recent buys/sells, position sizes, and profit/loss estimates. Bookmark wallets you want to monitor.",
            },
          ],
        },
        {
          heading: "Analyzing Wallet Behavior Patterns",
          content:
            "Successful traders exhibit specific patterns: (1) Accumulation phase - multiple buys over days/weeks at stable prices, (2) Position building - increasing position size as conviction grows, (3) Distribution phase - gradual sells as price pumps. SOLRAD's holder analysis helps identify these patterns across tokens. When you see smart wallets accumulating a token that SOLRAD is flagging with rising scores, it's a strong signal.",
        },
        {
          heading: "Setting Up Wallet Alerts",
          content:
            "Manual tracking is time-consuming. Use on-chain monitoring tools to set alerts when tracked wallets make significant transactions. Alert conditions: (1) New token purchase >$5K, (2) Position size increase >20%, (3) Complete position exit. Combine these alerts with SOLRAD's live token tracking to get full context - when smart money buys, check SOLRAD's score, liquidity, and volume to validate the opportunity.",
        },
        {
          heading: "Replicating Smart Money Trades",
          content:
            "Don't blindly copy every trade - smart money can be wrong or have different risk tolerances. Instead, use wallet tracking as one signal in your decision framework. When a smart wallet you track buys a token: (1) Check SOLRAD's data for validation (score, liquidity, volume), (2) Verify risk factors using SOLRAD's risk checker, (3) Assess your own risk tolerance and position sizing. Treat wallet signals as high-conviction leads, not automatic buys.",
        },
      ],
      keyTakeaways: [
        "Track wallets with proven history of early entries into successful tokens",
        "Use Solscan to analyze wallet transaction history and identify accumulation patterns",
        "Set alerts for significant transactions from smart money wallets you track",
        "Validate wallet signals using SOLRAD's token data before entering positions",
        "Combine wallet tracking with SOLRAD's intelligence for maximum edge in finding gems",
      ],
    },
    relatedArticles: [
      "how-to-find-solana-gems",
      "understanding-token-liquidity",
      "solana-wallet-security",
    ],
    keywords: [
      "track solana wallets",
      "smart money crypto",
      "wallet tracking",
      "copy trading solana",
      "find crypto alpha",
    ],
  },
  // SECURITY CATEGORY
  {
    slug: "identifying-rug-pulls",
    title: "How to Identify Rug Pulls: 12 Red Flags Every Solana Trader Must Know",
    description:
      "Master rug pull detection with this comprehensive guide. Learn the warning signs, technical indicators, and tools to avoid scams on Solana.",
    category: "security",
    readTime: "13 min read",
    lastUpdated: "2026-01-26",
    content: {
      intro:
        "Rug pulls are the #1 threat to Solana traders, draining billions annually from unsuspecting investors. A rug pull occurs when developers abandon a project and drain liquidity or token value, leaving holders with worthless assets. This guide teaches you to identify rug pulls before they happen using technical analysis, on-chain data, and pattern recognition. SOLRAD's risk checker automates many of these checks, but understanding the fundamentals is essential.",
      sections: [
        {
          heading: "Red Flag 1: Unlocked Liquidity",
          content:
            "The most common rug pull vector is pulling liquidity from DEX pools. When developers launch a token, they deposit liquidity (token + SOL) and receive LP tokens. If these LP tokens aren't locked in a time-locked contract, developers can withdraw liquidity at any time, crashing the price to zero. Always verify LP tokens are locked for 6-12+ months. SOLRAD's risk checker automatically flags unlocked liquidity as a CRITICAL risk.",
        },
        {
          heading: "Red Flag 2: Mint Authority Not Disabled",
          content:
            "Solana tokens have a mint authority that can create unlimited new tokens. If this authority isn't disabled after launch, developers can mint billions of tokens and dump on holders. Check token metadata using Solana Explorer - the mint authority should be 'null' or burned. Any token with active mint authority is a rug risk. SOLRAD's risk checker identifies this automatically.",
        },
        {
          heading: "Red Flag 3: Extreme Holder Concentration",
          content:
            "If top 5 holders own >70% of supply, the token is a rug waiting to happen. Developers often split supply across multiple wallets to hide concentration, but patterns emerge: wallets created same day, similar transaction histories, synchronized buying/selling. SOLRAD's holder analysis reveals concentration risks. Healthy tokens have <40% top 10 holder ownership.",
          subsections: [
            {
              subheading: "Detecting Sybil Wallets",
              content:
                "Sybil wallets (controlled by same entity) often: have no transaction history before token purchase, receive SOL from same source, make purchases at exact same time. Use explorers to check top holder histories for these patterns.",
            },
          ],
        },
        {
          heading: "Red Flag 4: Anonymous Teams with No Accountability",
          content:
            "Legitimate projects have doxxed teams, public LinkedIn profiles, and track records. Anonymous teams with no social media presence, no website, or generic Telegram groups are red flags. While some anonymous projects succeed (Shiba Inu), most are rugs. At minimum, projects should have: active Twitter with engagement, detailed whitepaper, transparent roadmap. SOLRAD doesn't track social, but provides the on-chain data to validate social claims.",
        },
        {
          heading: "Red Flag 5: Honeypot Contract Functions",
          content:
            "Honeypot tokens allow buying but block selling through hidden contract functions. Only contract creators can sell, trapping other holders. Testing this requires: (1) Checking contract code for blacklist/whitelist functions, (2) Simulating sells on testnet, (3) Checking recent sell transactions to confirm others can sell. SOLRAD's risk checker identifies some honeypot patterns, but always test with small amounts first.",
        },
        {
          heading: "Red Flag 6: Unrealistic Promises and Marketing",
          content:
            "Rug pulls often promise: guaranteed returns, revolutionary technology with no details, partnerships with major companies (unverified), utility that requires massive infrastructure. Be skeptical of projects that overpromise and underdeliver. Check GitHub repos - real projects have active development. Meme coins can succeed with no utility, but claims of utility should be verifiable.",
        },
        {
          heading: "Red Flag 7: Rapid Liquidity Changes",
          content:
            "Legitimate projects grow liquidity steadily. Sudden 50%+ liquidity decreases are exit signals - developers are pulling LP in stages. SOLRAD's liquidity charts show historical trends. Set alerts for tokens in your portfolio experiencing liquidity drops. This is often the first sign of a rug in progress.",
        },
        {
          heading: "Red Flag 8: Low Liquidity Relative to Market Cap",
          content:
            "Tokens with $10M market cap but $10K liquidity are artificially pumped and can't sustain sells. The liquidity-to-market-cap ratio should be >1%. Ratios <0.5% indicate price manipulation or rug setup. SOLRAD's liquidity health score accounts for this, flagging tokens with insufficient liquidity for their market cap.",
        },
        {
          heading: "How SOLRAD Protects You",
          content:
            "SOLRAD's risk checker automatically scans for: unlocked liquidity, active mint authority, unsafe holder concentration, honeypot indicators, low liquidity health. Tokens are labeled SAFE, MEDIUM, HIGH, or CRITICAL risk. Always check risk labels before buying. SOLRAD doesn't catch every scam (social engineering, fake teams), but eliminates 80% of technical rug risks.",
        },
      ],
      keyTakeaways: [
        "Always verify LP tokens are locked using SOLRAD's risk checker - unlocked liquidity is #1 rug risk",
        "Check mint authority is disabled - active mint means unlimited token inflation risk",
        "Avoid tokens with >70% top holder concentration or suspicious sybil wallet patterns",
        "Watch for rapid liquidity drops - often the first sign of a rug in progress",
        "Use SOLRAD's risk labels to filter out 80% of rug pulls before you invest",
        "Never invest more than you can afford to lose in high-risk tokens",
      ],
    },
    relatedArticles: [
      "solana-wallet-security",
      "understanding-token-liquidity",
      "how-to-find-solana-gems",
    ],
    keywords: [
      "identify rug pulls",
      "solana scams",
      "rug pull red flags",
      "crypto scam detection",
      "safe crypto trading",
    ],
  },
  {
    slug: "token-approval-risks",
    title: "Token Approval Risks: How Malicious Contracts Drain Wallets",
    description:
      "Understand token approval mechanisms, unlimited allowances, and how to protect yourself from contract exploits on Solana.",
    category: "security",
    readTime: "9 min read",
    lastUpdated: "2026-01-26",
    content: {
      intro:
        "Token approvals are one of the most misunderstood and dangerous aspects of crypto trading. When you interact with DeFi protocols or trade tokens, you often grant contracts permission to spend tokens on your behalf. Malicious actors exploit this mechanism to drain wallets through seemingly innocent transactions. This guide explains how token approvals work, the risks of unlimited allowances, and how to protect yourself.",
      sections: [
        {
          heading: "Understanding Token Approvals",
          content:
            "On Solana and EVM chains, smart contracts cannot automatically access tokens in your wallet. You must explicitly grant permission via a token approval. When you trade on a DEX, you approve the DEX contract to spend your tokens to complete the swap. This approval persists until revoked. While necessary for DeFi, approvals create security risks when granted to malicious or vulnerable contracts.",
        },
        {
          heading: "The Danger of Unlimited Approvals",
          content:
            "Many protocols request unlimited token approvals for convenience (you don't need to approve every transaction). However, this means the contract can spend all tokens of that type in your wallet at any time. If the contract is malicious or gets hacked, your entire balance is at risk. Best practice: only approve exact amounts needed for immediate transactions, never unlimited allowances.",
          subsections: [
            {
              subheading: "Checking Your Current Approvals",
              content:
                "Use tools like Solscan or wallet extensions to view all active token approvals on your wallet. Regularly audit and revoke approvals to contracts you no longer use. This limits your attack surface.",
            },
          ],
        },
        {
          heading: "Phishing via Malicious Contracts",
          content:
            "Scammers deploy fake DEX interfaces that look identical to legitimate protocols. When you try to trade, you're actually approving a malicious contract that drains your wallet. Always verify: (1) Website URL matches official domain, (2) Contract address matches known protocol addresses, (3) Transaction preview shows expected outcome. Use Phantom's transaction simulation to preview what an approval will do.",
        },
        {
          heading: "Safe Approval Practices",
          content:
            "To minimize risk: (1) Only approve exact amounts, not unlimited, (2) Only interact with verified protocol contracts, (3) Regularly revoke unused approvals, (4) Use a separate 'hot wallet' for risky interactions, (5) Verify all transaction details before signing. SOLRAD never requests wallet connections or approvals - we're fully read-only. Any site claiming to be SOLRAD and requesting wallet interaction is a scam.",
        },
        {
          heading: "What SOLRAD Does Differently",
          content:
            "SOLRAD is completely read-only. We never connect to your wallet, never request signatures, and never require token approvals. You simply browse token data freely. This eliminates approval risks entirely. If you see any site claiming to be SOLRAD that asks for wallet connection, it's a phishing site. Bookmark solrad.io and only use that domain.",
        },
      ],
      keyTakeaways: [
        "Token approvals grant contracts permission to spend tokens - essential for DeFi but risky",
        "Never grant unlimited token approvals - only approve exact amounts for immediate transactions",
        "Regularly audit and revoke unused approvals to minimize attack surface",
        "SOLRAD is read-only and never requests wallet connections or approvals",
        "Always verify transaction previews before approving - malicious contracts can drain wallets",
      ],
    },
    relatedArticles: [
      "solana-wallet-security",
      "identifying-rug-pulls",
      "how-to-find-solana-gems",
    ],
    keywords: [
      "token approval risks",
      "unlimited allowances",
      "contract exploit",
      "wallet drainage",
      "solana security",
    ],
  },
]

export const categories = {
  solana: {
    slug: "solana",
    title: "Solana Blockchain",
    description: "Learn about Solana's architecture, speed, and why it's the leading blockchain for token trading.",
    icon: "Zap",
  },
  tokens: {
    slug: "tokens",
    title: "Token Analysis",
    description: "Master token analysis, liquidity evaluation, and gem discovery strategies on Solana.",
    icon: "TrendingUp",
  },
  wallets: {
    slug: "wallets",
    title: "Wallet Management",
    description: "Wallet security, smart money tracking, and protecting your assets in crypto.",
    icon: "Wallet",
  },
  security: {
    slug: "security",
    title: "Security & Safety",
    description: "Identify rug pulls, avoid scams, and trade safely in the Solana ecosystem.",
    icon: "Shield",
  },
}

export function getArticleBySlug(slug: string): Article | undefined {
  return learnArticles.find(article => article.slug === slug)
}

export function getArticlesByCategory(category: string): Article[] {
  return learnArticles.filter(article => article.category === category)
}

export function getRelatedArticles(article: Article): Article[] {
  return article.relatedArticles
    .map(slug => getArticleBySlug(slug))
    .filter((a): a is Article => a !== undefined)
}

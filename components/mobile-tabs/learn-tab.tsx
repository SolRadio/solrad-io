"use client"

import { useState } from "react"
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  AlertTriangle,
  Droplets,
  Users,
  Activity,
  Shield,
  Target,
  Zap,
  CheckCircle2,
  XCircle,
} from "lucide-react"

interface Module {
  id: string
  title: string
  icon: typeof BookOpen
  iconColor: string
  summary: string
  content: string[]
  tips: string[]
}

const modules: Module[] = [
  {
    id: "score",
    title: "Reading the SOLRAD Score",
    icon: BarChart3,
    iconColor: "text-cyan-400",
    summary: "Understand how the 0-100 composite score works",
    content: [
      "The SOLRAD score is a composite metric from 0-100 that aggregates multiple on-chain signals into a single health indicator for each token.",
      "Scores above 80 indicate strong structural health across liquidity, volume, and holder metrics. These tokens show consistent organic activity patterns.",
      "Scores between 55-79 represent moderate health. The token may have strengths in some areas but weaknesses in others. These require closer inspection.",
      "Scores below 55 indicate structural concerns. Low scores don't always mean 'bad' -- very new tokens naturally start low as they build on-chain history.",
    ],
    tips: [
      "Compare scores within the same age bracket -- a 60 for a 2-hour-old token is very different from a 60 for a 2-day-old token",
      "Watch for score trajectory, not just the current value",
      "High score + low volume can indicate manipulation",
    ],
  },
  {
    id: "rug",
    title: "Common Rug Signals",
    icon: AlertTriangle,
    iconColor: "text-red-400",
    summary: "Red flags that suggest a token may not be safe",
    content: [
      "Concentrated holder distribution is one of the strongest rug indicators. When the top 10 wallets hold more than 60-70% of supply, a coordinated dump becomes trivially easy.",
      "Sudden liquidity removal is the classic rug pull. Watch for tokens where liquidity is unlocked (not burned or locked in a contract). If the deployer can pull LP, they eventually will.",
      "Fake volume patterns often appear as perfectly timed buy/sell pairs with round numbers. Organic volume is messy; manufactured volume is suspiciously clean.",
      "Social engineering: fake Telegram groups, cloned websites, impersonation of known projects. If the marketing is louder than the on-chain data, be cautious.",
    ],
    tips: [
      "Check if liquidity is locked or burned -- this is non-negotiable",
      "Compare holder count to volume -- high volume with few holders is a red flag",
      "If it seems too good to be true, it probably is",
    ],
  },
  {
    id: "liquidity",
    title: "Liquidity Basics",
    icon: Droplets,
    iconColor: "text-blue-400",
    summary: "Why liquidity depth matters for every trade",
    content: [
      "Liquidity represents the total value locked in a token's trading pool. Higher liquidity means you can buy or sell with less price impact (slippage).",
      "For Solana tokens, liquidity under $5K is extremely thin. Even a $100 trade can move the price significantly. Above $50K starts to feel 'tradeable' for most position sizes.",
      "Liquidity can be added or removed at any time if it's not locked. Always check the lock status. Burned liquidity is the gold standard -- it can never be removed.",
      "Growing liquidity organically (without single large deposits) is a positive signal. It suggests multiple participants are confident enough to provide liquidity.",
    ],
    tips: [
      "Never trade more than 1-2% of a token's total liquidity in a single order",
      "Check liquidity growth over time, not just the current snapshot",
      "Locked or burned LP is significantly safer than unlocked",
    ],
  },
  {
    id: "holders",
    title: "Holder Distribution",
    icon: Users,
    iconColor: "text-purple-400",
    summary: "What healthy vs unhealthy holder patterns look like",
    content: [
      "A healthy Solana token typically has a gradually distributed holder base. No single wallet (excluding the deployer/LP) should hold more than 5-10% of circulating supply.",
      "Watch the top 10 holders collectively. Under 40% is healthy. 40-60% is concerning. Over 60% means a small group controls the token's fate.",
      "Organic holder growth shows a steady increase with natural churn. If holders spike dramatically with no price movement, it may be airdrop/bot activity designed to inflate the count.",
      "Wallet clustering -- multiple wallets from the same source accumulating -- is a sophisticated manipulation tactic. SOLRAD's engine monitors for these patterns.",
    ],
    tips: [
      "A token with 500 organic holders is better than one with 5000 airdropped holders",
      "Check if top holders are accumulating or distributing",
      "New tokens with rapid holder growth deserve extra scrutiny",
    ],
  },
  {
    id: "volume",
    title: "Volume Traps",
    icon: Activity,
    iconColor: "text-yellow-400",
    summary: "Distinguishing real volume from wash trading",
    content: [
      "Wash trading is when the same entity buys and sells to themselves to inflate volume metrics. It creates the illusion of demand and can trigger scanners and alerts.",
      "Red flags: perfectly round trade sizes ($100, $500, $1000), trades at exact intervals (every 30 seconds), volume that doesn't correlate with holder growth or price movement.",
      "Genuine volume is messy and organic. It comes in bursts around news or catalysts, has varied trade sizes, and correlates with social activity and holder changes.",
      "Volume-to-liquidity ratio matters. If daily volume is 10x+ the liquidity, something unusual is happening. Healthy ratios are typically 0.5x to 3x.",
    ],
    tips: [
      "High volume with stable price usually means wash trading",
      "Compare volume patterns to similar tokens in the same market conditions",
      "Genuine volume spikes have a cause -- look for the catalyst",
    ],
  },
  {
    id: "dyor",
    title: "DYOR Checklist",
    icon: CheckCircle2,
    iconColor: "text-green-400",
    summary: "A systematic approach to evaluating any Solana token",
    content: [
      "1. LIQUIDITY CHECK: Is LP locked or burned? Is total liquidity above $10K? Is it growing organically?",
      "2. HOLDER ANALYSIS: Are top 10 holders under 40%? Is holder count growing steadily? Any suspicious wallet clustering?",
      "3. VOLUME VALIDATION: Does volume correlate with price action? Are trade sizes varied and organic? Is volume/liquidity ratio reasonable?",
      "4. CONTRACT REVIEW: Is the contract verified? Are there any unusual permissions (mint authority, freeze authority)? Has it been audited?",
      "5. SOCIAL VERIFICATION: Does the team have a track record? Is community engagement organic? Are there verifiable partnerships?",
      "6. RISK SIZING: Never risk more than you can lose. Use position sizing appropriate to the token's risk level. Set stop-losses.",
    ],
    tips: [
      "Run through this checklist for EVERY token before entering a position",
      "No single metric tells the full story -- look at the composite picture",
      "When in doubt, don't trade. There's always another opportunity",
    ],
  },
  {
    id: "signals",
    title: "Understanding Signal States",
    icon: Zap,
    iconColor: "text-cyan-400",
    summary: "How EARLY, CAUTION, and STRONG states work",
    content: [
      "EARLY: Token has been detected with initial on-chain activity but hasn't yet proven structural health. Most tokens start here. High risk, high potential upside if the token develops.",
      "CAUTION: Score is elevated but confidence is mixed. Some metrics look good while others raise concerns. This is the 'watch closely' state. Many tokens oscillate here.",
      "STRONG: High score with high confidence. Multiple independent metrics confirm the token's structural health. This is the highest conviction state SOLRAD assigns.",
      "Transitions between states are triggered by changes in underlying metrics, not time. A token can move from EARLY to STRONG quickly if metrics improve rapidly, or stay EARLY indefinitely.",
    ],
    tips: [
      "STRONG doesn't mean 'buy' -- it means the on-chain data is healthy",
      "Most tokens never reach STRONG state. That's normal and expected",
      "Transitions from CAUTION to STRONG are often the most actionable observations",
    ],
  },
  {
    id: "risk",
    title: "Risk Management",
    icon: Shield,
    iconColor: "text-orange-400",
    summary: "Position sizing and protecting your capital",
    content: [
      "The #1 rule: never invest more than you can afford to lose. Solana SPL tokens and micro-caps are extremely high risk. Treat them as high-risk, high-reward speculation.",
      "Position sizing: allocate based on conviction. STRONG signal tokens might warrant 2-5% of your trading portfolio. EARLY signals should be 0.5-1% at most.",
      "Set exit criteria BEFORE entering. Know your take-profit levels and stop-loss. Emotional decisions during volatile moves are the top capital destroyer.",
      "Diversify across multiple tokens and timeframes. No single trade should make or break your portfolio. Think in terms of expected value across many positions.",
    ],
    tips: [
      "Use the 1% rule: never risk more than 1% of total portfolio on a single trade",
      "Take partial profits at predetermined levels (2x, 5x, 10x)",
      "Keep a trading journal. Track what works and what doesn't",
    ],
  },
]

export function LearnTab() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const activeModule = modules.find((m) => m.id === selectedModule)

  if (activeModule) {
    return (
      <div className="flex flex-col h-full overflow-y-auto overscroll-contain">
        {/* Back Header */}
        <button
          onClick={() => setSelectedModule(null)}
          className="flex items-center gap-2 px-3 py-3 border-b border-border/30 hover:bg-muted/10 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground/60" />
          <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Back to modules</span>
        </button>

        {/* Module Header */}
        <div className="px-3 py-3 border-b border-border/30">
          <div className="flex items-center gap-2 mb-1">
            <activeModule.icon className={`h-4 w-4 ${activeModule.iconColor}`} />
            <h2 className="text-sm font-mono font-bold">{activeModule.title}</h2>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground/50">{activeModule.summary}</p>
        </div>

        {/* Content */}
        <div className="px-3 py-3 space-y-3">
          {activeModule.content.map((paragraph, i) => (
            <p key={i} className="text-[11px] font-mono text-foreground/80 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Tips */}
        <div className="px-3 py-3 border-t border-border/30">
          <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-2">Key Takeaways</div>
          <div className="space-y-1.5">
            {activeModule.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded-md bg-muted/10 border border-border/20">
                <Target className="h-3 w-3 text-cyan-400 shrink-0 mt-0.5" />
                <span className="text-[10px] font-mono text-muted-foreground/70 leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto overscroll-contain">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-cyan-400" />
          <h1 className="text-sm font-mono font-bold uppercase tracking-wider">Learn</h1>
        </div>
        <p className="text-[10px] font-mono text-muted-foreground/50 mt-1">
          Practical knowledge for informed decisions
        </p>
      </div>

      {/* Module List */}
      <div className="px-3 py-2 space-y-1">
        {modules.map((mod) => {
          const Icon = mod.icon
          return (
            <button
              key={mod.id}
              onClick={() => setSelectedModule(mod.id)}
              className="
                flex items-center gap-3 w-full px-3 py-2.5 rounded-md
                border border-border/20 bg-card/30
                hover:bg-card/60 active:bg-card/80
                transition-colors duration-100 text-left
              "
            >
              <Icon className={`h-4 w-4 ${mod.iconColor} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono font-bold truncate">{mod.title}</div>
                <div className="text-[9px] font-mono text-muted-foreground/40 truncate">{mod.summary}</div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
            </button>
          )
        })}
      </div>

      {/* Quick Reference */}
      <div className="px-3 py-3 mt-2 border-t border-border/20">
        <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-2">
          Quick Reference
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-green-500/5 border border-green-500/10">
            <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />
            <span className="text-[9px] font-mono text-green-400/80">Score 80+ = Strong</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-cyan-500/5 border border-cyan-500/10">
            <BarChart3 className="h-3 w-3 text-cyan-400 shrink-0" />
            <span className="text-[9px] font-mono text-cyan-400/80">Score 55+ = Moderate</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-red-500/5 border border-red-500/10">
            <XCircle className="h-3 w-3 text-red-400 shrink-0" />
            <span className="text-[9px] font-mono text-red-400/80">{'Score < 55 = Weak'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-yellow-500/5 border border-yellow-500/10">
            <AlertTriangle className="h-3 w-3 text-yellow-400 shrink-0" />
            <span className="text-[9px] font-mono text-yellow-400/80">Always DYOR</span>
          </div>
        </div>
      </div>
    </div>
  )
}

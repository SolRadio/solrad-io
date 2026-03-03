import React from "react"
import type { TokenScore } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Activity, Droplets } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { SourcesIndicator } from "./sources-indicator"
import { formatUsdPrice, formatCompactUsd } from "@/lib/format"
import { getTokenOriginWithReason, getOriginAccent } from "@/lib/token-origin-accent"
import { getSolradScore, formatSolradScore } from "@/lib/token-score"
import { getScorePercentile, formatPercentile } from "@/lib/utils/score-percentile"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { LeadTimeBadge } from "./lead-time-badge"
import { ConvictionIcon } from "./conviction-icon"
import { useLatestLeadTimeProof } from "@/hooks/use-lead-time"
import type { LeadTimeProof } from "@/lib/lead-time/types"

interface TokenCardProps {
  token: TokenScore
  rank: number
  leadTimeProof?: LeadTimeProof
  leadTime?: { leadBlocks?: number; leadSeconds?: number; confidence?: "LOW" | "MEDIUM" | "HIGH" }
  allScores?: number[]
}

export const TokenCard = React.memo(function TokenCard({ token, rank, leadTimeProof: externalProof, leadTime, allScores = [] }: TokenCardProps) {
  // Use external proof if provided (batch-fetched), otherwise fall back to per-card hook
  const { proof: hookProof } = useLatestLeadTimeProof(externalProof || leadTime ? undefined : token.address)
  const proof = externalProof ?? hookProof

  // Prefer lightweight leadTime prop, then full proof object
  const leadBlocks = leadTime?.leadBlocks ?? proof?.leadBlocks
  const leadSeconds = leadTime?.leadSeconds ?? proof?.leadSeconds
  const confidence = leadTime?.confidence ?? proof?.confidence ?? "MEDIUM"
  const isPositive = (token.priceChange24h ?? 0) >= 0
  const priceUsd = token.priceUsd ?? 0
  const volume24h = token.volume24h ?? 0
  const liquidity = token.liquidity ?? 0

  const riskColors = {
    Strong: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50",
    Watch: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/50",
    "High Risk": "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/50",
  }

  const { origin, reason, matched } = getTokenOriginWithReason(token)
  const accent = getOriginAccent(origin)
  const isDev = process.env.NODE_ENV !== "production"
  const score = getSolradScore(token)

  return (
    <Link href={`/token/${token.address}`} className="focus-visible:outline-none">
      <Card 
        className="h-[120px] p-3 hover:bg-muted/30 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg transition-all duration-200 ease-out cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] bg-gradient-to-b from-card/95 to-card flex flex-col focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
        style={accent.borderStyle}
        tabIndex={0}
      >
        <div className="flex items-start justify-between gap-3 min-h-0">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-muted-foreground/80 font-mono text-xs tabular-nums font-semibold">#{rank}</span>
              <div 
                className="rounded-xl shrink-0"
                style={accent.ringStyle}
              >
                <Image
                  src={token.imageUrl || "/placeholder.svg?height=32&width=32"}
                  alt={`${token.symbol || "Token"} (${token.name || "Solana Token"}) logo`}
                  width={32}
                  height={32}
                  className="rounded-lg w-8 h-8"
                />
              </div>
            </div>

            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
                <h3 className="font-semibold text-sm tracking-tight truncate line-clamp-1 min-w-0">{token.symbol}</h3>
                {accent.label && (
                  <span 
                    className="text-[8px] font-mono font-bold px-1 py-0.5 rounded-full uppercase shrink-0" 
                    style={{ backgroundColor: `${accent.borderColor}22`, borderColor: accent.borderColor, color: accent.borderColor, border: `1px solid ${accent.borderColor}44` }}
                    title={isDev ? `${origin} • ${reason} • ${matched}` : undefined}
                  >
                    {accent.label}
                  </span>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className={`text-[10px] font-medium shrink-0 whitespace-nowrap px-1.5 py-0 cursor-help ${riskColors[token.riskLabel]}`}>
                        {token.riskLabel.replace(" RISK", "")}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">{token.riskLabel}</p>
                      <p className="text-xs text-muted-foreground max-w-[220px]">
                        {token.riskLabel === "LOW RISK" 
                          ? "Healthy liquidity ($200K+), distributed holders, burned mint authority, reasonable FDV ratios"
                          : token.riskLabel === "MEDIUM RISK"
                            ? "Adequate liquidity ($50K-$200K), moderate concentration (50-70%), or minor red flags"
                            : "Low liquidity (<$50K), high concentration (>70%), or multiple warning signs"}
                      </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          {(leadBlocks || leadSeconds) && (
            <LeadTimeBadge
              leadBlocks={leadBlocks}
              leadSeconds={leadSeconds}
              confidence={confidence}
            />
          )}
              </div>
              <p className="text-xs text-muted-foreground/80 truncate font-normal line-clamp-1 overflow-hidden">{token.name}</p>
              {(token as any)._rationale && (
                <p className="text-xs text-primary/70 font-medium mt-0.5 truncate italic">
                  {(token as any)._rationale}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0 overflow-hidden">
            <div className="flex items-center gap-1 shrink-0">
              {(token.badges ?? []).slice(0, 3).map((badge: any) => (
                <div 
                  key={badge.key}
                  className={`w-5 h-5 shrink-0 rounded flex items-center justify-center text-[10px] ${
                    badge.key === "RAD" ? "bg-green-500/10 border border-green-500/30" :
                    badge.key === "GEM" ? "bg-blue-500/10 border border-blue-500/30" :
                    badge.key === "TRASH" || badge.key === "WARNING" || badge.key === "WASH" ? "bg-red-500/10 border border-red-500/30" :
                    badge.key === "HELD" ? "bg-yellow-500/10 border border-yellow-500/30" :
                    "bg-cyan-500/10 border border-cyan-500/30"
                  }`}
                  title={badge.label}
                >
                  {badge.icon}
                </div>
              ))}
              <div className="text-right overflow-hidden">
                <div className="font-mono text-sm font-semibold tracking-tight tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">{formatUsdPrice(priceUsd)}</div>
                <div
                  className={`flex items-center gap-0.5 text-xs font-semibold whitespace-nowrap ${
                    isPositive ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {isPositive ? <TrendingUp className="h-3 w-3 shrink-0" /> : <TrendingDown className="h-3 w-3 shrink-0" />}
                  <span className="tabular-nums whitespace-nowrap">
                    {isPositive ? "+" : ""}
                    {token.priceChange24h?.toFixed(1) ?? "0.0"}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex flex-col items-center">
                <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/30 font-mono font-semibold text-xs px-2 py-0.5 whitespace-nowrap">
                  {formatSolradScore(score)}
                </Badge>
                {allScores.length > 0 && (
                  <span className="text-[9px] font-mono text-muted-foreground/60 leading-none mt-0.5">
                    {formatPercentile(getScorePercentile(score, allScores))}
                  </span>
                )}
              </div>
              <ConvictionIcon
                score={score}
                riskLabel={token.riskLabel}
                volume24h={volume24h}
                liquidity={liquidity}
                holderCount={(token as any).holderCount ?? (token as any).holders}
              />
            </div>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-border/50 grid grid-cols-3 gap-3 overflow-hidden">
          <div className="flex flex-col gap-0.5 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1 text-muted-foreground/80 text-[10px] font-medium whitespace-nowrap">
              <Activity className="h-3 w-3 stroke-[1.5] shrink-0" />
              <span className="uppercase tracking-wide truncate">Vol</span>
            </div>
            <span className="font-mono text-xs font-semibold tabular-nums truncate whitespace-nowrap overflow-hidden text-ellipsis">{formatCompactUsd(volume24h)}</span>
          </div>

          <div className="flex flex-col gap-0.5 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1 text-muted-foreground/80 text-[10px] font-medium whitespace-nowrap">
              <Droplets className="h-3 w-3 stroke-[1.5] shrink-0" />
              <span className="uppercase tracking-wide truncate">Liq</span>
            </div>
            <span className="font-mono text-xs font-semibold tabular-nums truncate whitespace-nowrap overflow-hidden text-ellipsis">{formatCompactUsd(liquidity)}</span>
          </div>

          <div className="flex flex-col gap-0.5 min-w-0 overflow-hidden">
            <div className="text-muted-foreground/80 text-[10px] font-medium uppercase tracking-wide truncate whitespace-nowrap">Sources</div>
            <SourcesIndicator sources={token.sources} />
          </div>
        </div>
      </Card>
    </Link>
  )
})

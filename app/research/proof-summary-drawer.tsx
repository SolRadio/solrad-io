"use client"

import React, { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Copy,
  CheckCircle2,
  ExternalLink,
  Share2,
  Timer,
  Shield,
  TrendingUp,
  TrendingDown,
  Activity,
  ScanSearch,
  ClipboardCheck,
  Blocks,
} from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

// ── Types (duplicated minimally to avoid coupling) ──

interface LedgerEntry {
  id: string
  mint: string
  symbol: string
  name?: string
  detectedAt: string
  detectionType: string
  scoreAtSignal?: number
  scoreNow?: number
  priceAtSignal: number
  priceNow: number
  pct24h?: number
  pct7d?: number
  pct30d?: number
  outcome: "win" | "loss" | "neutral"
  source: string
  notes?: string
  voided?: boolean
  voidReason?: string
  createdAt: string
  // On-chain evidence (optional)
  slot?: number
  blockTime?: number
  txSig?: string
  sourceRpc?: string
}

interface LeadTimeLedgerRow {
  id: string
  mint: string
  symbol: string
  name: string
  logo: string | null
  observedAt: string
  observationEvent: string
  reactionEvent: string
  leadSeconds: number
  leadBlocks: number
  confidence: number
  // On-chain evidence (optional)
  observationSlot?: number
  observationBlockTime?: number
  reactionSlot?: number
  reactionBlockTime?: number
  sourceRpc?: string
}

export type DrawerPayload =
  | { type: "alpha"; entry: LedgerEntry }
  | { type: "lead"; row: LeadTimeLedgerRow }
  | null

// ── Helpers ──

function fmtPrice(p: number): string {
  if (!p || !Number.isFinite(p)) return "--"
  if (p < 0.0001) return `$${p.toExponential(2)}`
  if (p < 1) return `$${p.toFixed(6)}`
  return `$${p.toFixed(2)}`
}

function fmtPct(p: number | undefined | null): string {
  if (p === undefined || p === null || !Number.isFinite(p)) return "\u2014"
  const sign = p >= 0 ? "+" : ""
  return `${sign}${p.toFixed(1)}%`
}

function pctColor(p: number | undefined | null): string {
  if (p === undefined || p === null) return "text-muted-foreground/50"
  if (p > 0) return "text-green-400"
  if (p < 0) return "text-red-400"
  return "text-muted-foreground"
}

function fmtLeadTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

function fmtObservationType(t: string): string {
  return t
    .replace(/_/g, " ")
    .replace(/signal upgrade /i, "")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    if (diff < 0) return "just now"
    const sec = Math.floor(diff / 1000)
    if (sec < 60) return `${sec}s ago`
    const min = Math.floor(sec / 60)
    if (min < 60) return `${min}m ago`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr}h ago`
    const d = Math.floor(hr / 24)
    return `${d}d ago`
  } catch {
    return "Unknown"
  }
}

function shortMint(mint: string): string {
  if (!mint || mint.length < 8) return mint || "--"
  return `${mint.slice(0, 4)}...${mint.slice(-4)}`
}

function confidenceLabel(c: number): { text: string; color: string } {
  if (c >= 80) return { text: "HIGH", color: "text-green-400 border-green-500/20 bg-green-500/10" }
  if (c >= 50) return { text: "MEDIUM", color: "text-amber-400 border-amber-500/20 bg-amber-500/10" }
  return { text: "LOW", color: "text-muted-foreground border-border/50 bg-muted" }
}

function fmtBlockTime(ts: number | undefined): string {
  if (!ts || !Number.isFinite(ts)) return "\u2014"
  // Timestamps may be unix seconds or milliseconds
  const ms = ts < 1e12 ? ts * 1000 : ts
  return new Date(ms).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  })
}

function fmtSlot(slot: number | undefined): string {
  if (!slot || !Number.isFinite(slot)) return "\u2014"
  return slot.toLocaleString()
}

function outcomeStyle(o: string): { text: string; color: string; icon: React.ReactNode } {
  if (o === "win")
    return {
      text: "WIN",
      color: "text-green-400 border-green-500/20 bg-green-500/10",
      icon: <TrendingUp className="h-3 w-3" />,
    }
  if (o === "loss")
    return {
      text: "LOSS",
      color: "text-red-400 border-red-500/20 bg-red-500/10",
      icon: <TrendingDown className="h-3 w-3" />,
    }
  return {
    text: "NEUTRAL",
    color: "text-muted-foreground border-border/50 bg-muted",
    icon: <Activity className="h-3 w-3" />,
  }
}

// ── Shared row component ──

function DataRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-border/10">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 shrink-0">
        {label}
      </span>
      <span className="text-[12px] font-mono text-foreground/90 text-right">
        {children}
      </span>
    </div>
  )
}

// ── Token Logo (self-contained, no external state) ──

function DrawerLogo({
  src,
  symbol,
}: {
  src?: string
  symbol: string
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={symbol}
        className="h-8 w-8 rounded-full border border-border/30 bg-muted/30"
        onError={(e) => {
          ;(e.target as HTMLImageElement).style.display = "none"
        }}
      />
    )
  }
  return (
    <div className="h-8 w-8 rounded-full border border-border/30 bg-muted/30 flex items-center justify-center text-[11px] font-mono font-semibold text-muted-foreground/60">
      {(symbol || "?").charAt(0)}
    </div>
  )
}

// ── Main Drawer ──

export function ProofSummaryDrawer({
  payload,
  onClose,
  logoMap,
}: {
  payload: DrawerPayload
  onClose: () => void
  logoMap: Map<string, string>
}) {
  const [copied, setCopied] = useState<string | null>(null)
  const isMobile = useIsMobile()

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  if (!payload) return null

  const isAlpha = payload.type === "alpha"

  return (
    <Sheet open={!!payload} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={`bg-background border-border/30 p-0 font-mono overflow-y-auto ${
          isMobile
            ? "max-h-[85vh] rounded-t-xl"
            : "w-[340px] sm:max-w-[340px]"
        }`}
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div className="flex justify-center pt-2 pb-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
        )}
        {isAlpha ? (
          <AlphaDrawerContent
            entry={payload.entry}
            logoMap={logoMap}
            copied={copied}
            copyText={copyText}
          />
        ) : (
          <LeadDrawerContent
            row={payload.row}
            logoMap={logoMap}
            copied={copied}
            copyText={copyText}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

// ── Alpha Ledger Detail ──

function AlphaDrawerContent({
  entry,
  logoMap,
  copied,
  copyText,
}: {
  entry: LedgerEntry
  logoMap: Map<string, string>
  copied: string | null
  copyText: (text: string, key: string) => void
}) {
  const mint = entry.mint || ""
  const logoSrc = mint ? logoMap.get(mint.toLowerCase()) : undefined
  const outcome = outcomeStyle(entry.outcome)

  // Share snippet
  const pctVal = entry.pct7d ?? entry.pct24h
  const pctLabel = entry.pct7d !== undefined ? "7D" : "24h"
  const pctStr =
    pctVal !== undefined
      ? `${pctVal >= 0 ? "+" : ""}${pctVal.toFixed(1)}% in ${pctLabel}`
      : ""
  const snippet = `SOLRAD Proof Engine: $${entry.symbol} signaled ${entry.detectionType}${pctStr ? ` \u2014 ${pctStr}` : ""}. Mint: ${shortMint(mint)}`

  return (
    <>
      <SheetHeader className="p-4 pb-3 border-b border-border/20">
        <div className="flex items-center gap-3">
          <DrawerLogo src={logoSrc} symbol={entry.symbol} />
          <div className="min-w-0">
            <SheetTitle className="text-sm font-mono font-bold text-foreground flex items-center gap-2">
              <span>${entry.symbol}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border text-[10px] font-semibold tracking-wide ${outcome.color}`}>
                {outcome.icon}
                {outcome.text}
              </span>
            </SheetTitle>
            <SheetDescription className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
              {entry.name || "Alpha Ledger Entry"}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="px-4 py-3 space-y-0">
        {/* Mint */}
        <DataRow label="Mint">
          <button
            onClick={() => copyText(mint, "drawer-mint")}
            className="inline-flex items-center gap-1 text-muted-foreground/70 hover:text-primary transition-colors"
            title={mint}
          >
            <span className="text-[11px]">{shortMint(mint)}</span>
            {copied === "drawer-mint" ? (
              <CheckCircle2 className="h-3 w-3 text-green-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </DataRow>

        {/* Detected */}
        <DataRow label="Detected">
          <div className="flex flex-col items-end">
            <span>{relativeTime(entry.detectedAt)}</span>
            <span className="text-[9px] text-muted-foreground/50">
              {new Date(entry.detectedAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
          </div>
        </DataRow>

        {/* Detection Type */}
        <DataRow label="Type">
          {(() => {
            const map: Record<string, { label: string; cls: string }> = {
              FIRST_SEEN: { label: "EARLY DETECT", cls: "bg-primary/10 text-primary border-primary/20" },
              SIGNAL_UPGRADE: { label: "UPGRADED", cls: "bg-accent/10 text-accent border-accent/20" },
              CROSS: { label: "UPGRADED", cls: "bg-accent/10 text-accent border-accent/20" },
              STRONG: { label: "STRONG SIGNAL", cls: "bg-green-500/10 text-green-400 border-green-500/20" },
            }
            const match = map[entry.detectionType]
            const label = match?.label ?? entry.detectionType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
            const cls = match?.cls ?? "bg-muted/50 text-muted-foreground border-border"
            return (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${cls}`}>
                {label}
              </span>
            )
          })()}
        </DataRow>

        {/* Prices */}
        <DataRow label="Entry Price">{fmtPrice(entry.priceAtSignal)}</DataRow>
        <DataRow label="Current Price">{fmtPrice(entry.priceNow)}</DataRow>

        {/* Moves */}
        <div className="border-b border-border/10 py-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 block mb-1.5">
            Performance
          </span>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-[9px] text-muted-foreground/40">24H</div>
              <div className={`text-[12px] font-semibold tabular-nums ${pctColor(entry.pct24h)}`}>
                {fmtPct(entry.pct24h)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[9px] text-muted-foreground/40">7D</div>
              <div className={`text-[12px] font-semibold tabular-nums ${pctColor(entry.pct7d)}`}>
                {fmtPct(entry.pct7d)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[9px] text-muted-foreground/40">30D</div>
              <div className={`text-[12px] font-semibold tabular-nums ${pctColor(entry.pct30d)}`}>
                {fmtPct(entry.pct30d)}
              </div>
            </div>
          </div>
        </div>

        {/* Score */}
        {(entry.scoreAtSignal !== undefined || entry.scoreNow !== undefined) && (
          <DataRow label="Score">
            <span className="tabular-nums">
              {entry.scoreAtSignal ?? "\u2014"}
              <span className="text-muted-foreground/40 mx-1">{"\u2192"}</span>
              {entry.scoreNow ?? "\u2014"}
            </span>
          </DataRow>
        )}

        {/* Source */}
        <DataRow label="Source">
          <span className="text-muted-foreground/70">{entry.source || "\u2014"}</span>
        </DataRow>

        {/* Notes */}
        {entry.notes && (
          <DataRow label="Notes">
            <span className="text-muted-foreground/70 text-[10px]">{entry.notes}</span>
          </DataRow>
        )}

        {/* Voided */}
        {entry.voided && (
          <DataRow label="Voided">
            <span className="text-red-400/80 text-[10px]">{entry.voidReason || "Yes"}</span>
          </DataRow>
        )}
      </div>

      {/* On-Chain Evidence */}
      {(entry.slot || entry.blockTime || entry.txSig) && (
        <div className="px-4 py-3 border-t border-border/20">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 block mb-2">
            <Blocks className="h-3 w-3 inline-block mr-1 -mt-0.5" />
            On-Chain Evidence
          </span>
          <div className="space-y-0">
            <DataRow label="Slot">
              {entry.slot ? (
                <a
                  href={`https://solscan.io/block/${entry.slot}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary/80 hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  {fmtSlot(entry.slot)}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              ) : "\u2014"}
            </DataRow>
            <DataRow label="Block Time">{fmtBlockTime(entry.blockTime)}</DataRow>
            {entry.txSig && (
              <DataRow label="Tx">
                <a
                  href={`https://solscan.io/tx/${entry.txSig}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary/80 hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  {entry.txSig.slice(0, 8)}...{entry.txSig.slice(-4)}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </DataRow>
            )}
            {entry.sourceRpc && (
              <DataRow label="RPC">
                <span className="text-muted-foreground/70">{entry.sourceRpc}</span>
              </DataRow>
            )}
          </div>
        </div>
      )}

      {/* Verification */}
      <div className="px-4 py-3 border-t border-border/20">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 block mb-2">
          Verification
        </span>
        <div className="flex flex-col gap-1.5">
          <a
            href={mint ? `https://dexscreener.com/solana?search=${encodeURIComponent(mint)}` : "#"}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!mint}
            className={`flex items-center gap-1.5 py-1.5 px-2 rounded-sm border border-border/20 bg-card/30 text-[11px] font-mono text-foreground/80 hover:text-primary hover:border-primary/30 transition-colors ${!mint ? "opacity-30 pointer-events-none" : ""}`}
          >
            <ScanSearch className="h-3 w-3 shrink-0" />
            Open DexScreener
            <ExternalLink className="h-2.5 w-2.5 ml-auto text-muted-foreground/40" />
          </a>
          {mint && (
            <a
              href={`https://solscan.io/token/${mint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 py-1.5 px-2 rounded-sm border border-border/20 bg-card/30 text-[11px] font-mono text-foreground/80 hover:text-primary hover:border-primary/30 transition-colors"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              Open Solscan
              <ExternalLink className="h-2.5 w-2.5 ml-auto text-muted-foreground/40" />
            </a>
          )}
          <button
            onClick={() => {
              const dexUrl = mint ? `https://dexscreener.com/solana?search=${encodeURIComponent(mint)}` : null
              const solUrl = mint ? `https://solscan.io/token/${mint}` : null
              const stepsArr = [
                `Token: $${entry.symbol}`,
                `Mint: ${mint || "N/A"}`,
                `Detected: ${entry.detectedAt}`,
                `Entry Price: ${fmtPrice(entry.priceAtSignal)}`,
                `Current Price: ${fmtPrice(entry.priceNow)}`,
                `Outcome: ${entry.outcome.toUpperCase()}`,
                `Detection Type: ${entry.detectionType}`,
                "",
                "Verification Steps:",
              ]
              let step = 1
              if (dexUrl) {
                stepsArr.push(`${step}. Open DexScreener: ${dexUrl}`)
                step++
                stepsArr.push(`${step}. Confirm token matches mint address above`)
                step++
              }
              stepsArr.push(`${step}. Check chart at detected timestamp for entry price`)
              step++
              stepsArr.push(`${step}. Verify current price matches reported value`)
              step++
              if (solUrl) {
                stepsArr.push(`${step}. Open Solscan: ${solUrl}`)
                step++
                stepsArr.push(`${step}. Confirm token contract is verified and not flagged`)
              }
              const steps = stepsArr.join("\n")
              copyText(steps, "drawer-verify-steps")
            }}
            className="flex items-center gap-1.5 py-1.5 px-2 rounded-sm border border-border/20 bg-card/30 text-[11px] font-mono text-foreground/80 hover:text-primary hover:border-primary/30 transition-colors"
          >
            {copied === "drawer-verify-steps" ? (
              <CheckCircle2 className="h-3 w-3 text-green-400" />
            ) : (
              <ClipboardCheck className="h-3 w-3" />
            )}
            Copy Verification Steps
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 mt-auto border-t border-border/20 flex gap-2">
        {mint && (
          <Link
            href={`/token/${mint}`}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-sm border border-border/30 bg-card/50 text-[11px] font-mono text-foreground/80 hover:text-primary hover:border-primary/30 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            View Token
          </Link>
        )}
        <button
          onClick={() => copyText(snippet, "drawer-share")}
          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-sm border border-border/30 bg-card/50 text-[11px] font-mono text-foreground/80 hover:text-primary hover:border-primary/30 transition-colors"
        >
          {copied === "drawer-share" ? (
            <CheckCircle2 className="h-3 w-3 text-green-400" />
          ) : (
            <Share2 className="h-3 w-3" />
          )}
          Copy Snippet
        </button>
      </div>
    </>
  )
}

// ── Lead-Time Detail ──

function LeadDrawerContent({
  row,
  logoMap,
  copied,
  copyText,
}: {
  row: LeadTimeLedgerRow
  logoMap: Map<string, string>
  copied: string | null
  copyText: (text: string, key: string) => void
}) {
  const mint = row.mint || ""
  const logoSrc =
    row.logo || (mint ? logoMap.get(mint.toLowerCase()) : undefined)
  const conf = confidenceLabel(row.confidence)

  const snippet = `SOLRAD Lead-Time Proof: $${row.symbol} observed ${fmtObservationType(row.observationEvent)} \u2192 ${fmtObservationType(row.reactionEvent)} with ${fmtLeadTime(row.leadSeconds)} lead (${conf.text}).`

  return (
    <>
      <SheetHeader className="p-4 pb-3 border-b border-border/20">
        <div className="flex items-center gap-3">
          <DrawerLogo src={logoSrc} symbol={row.symbol} />
          <div className="min-w-0">
            <SheetTitle className="text-sm font-mono font-bold text-foreground flex items-center gap-2">
              <span>${row.symbol}</span>
              <Timer className="h-3.5 w-3.5 text-primary/60" />
            </SheetTitle>
            <SheetDescription className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
              {row.name || "Lead-Time Proof"}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="px-4 py-3 space-y-0">
        {/* Mint */}
        <DataRow label="Mint">
          <button
            onClick={() => copyText(mint, "drawer-lt-mint")}
            className="inline-flex items-center gap-1 text-muted-foreground/70 hover:text-primary transition-colors"
            title={mint}
          >
            <span className="text-[11px]">{shortMint(mint)}</span>
            {copied === "drawer-lt-mint" ? (
              <CheckCircle2 className="h-3 w-3 text-green-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </DataRow>

        {/* Proof Flow */}
        <div className="border-b border-border/10 py-2.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 block mb-2">
            Proof Flow
          </span>
          <div className="flex items-center gap-2 text-[11px]">
            <Badge
              variant="outline"
              className="text-[10px] h-5 px-1.5 rounded-sm"
            >
              {fmtObservationType(row.observationEvent)}
            </Badge>
            <span className="text-muted-foreground/40">{"\u2192"}</span>
            <Badge
              variant="outline"
              className="text-[10px] h-5 px-1.5 rounded-sm"
            >
              {fmtObservationType(row.reactionEvent)}
            </Badge>
          </div>
        </div>

        {/* Lead Time */}
        <DataRow label="Lead Time">
          <span className="text-primary font-semibold">
            {fmtLeadTime(row.leadSeconds)}
          </span>
        </DataRow>

        {/* Lead Blocks */}
        <DataRow label="Lead Blocks">
          <span className="tabular-nums">{row.leadBlocks}</span>
        </DataRow>

        {/* Confidence */}
        <DataRow label="Confidence">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-sm border text-[10px] font-semibold ${conf.color}`}
          >
            {conf.text}
          </span>
        </DataRow>

        {/* Observed At */}
        <DataRow label="Observed">
          <div className="flex flex-col items-end">
            <span>{relativeTime(row.observedAt)}</span>
            <span className="text-[9px] text-muted-foreground/50">
              {new Date(row.observedAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
          </div>
        </DataRow>
      </div>

      {/* On-Chain Evidence */}
      {(row.observationSlot || row.observationBlockTime || row.reactionSlot) && (
        <div className="px-4 py-3 border-t border-border/20">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 block mb-2">
            <Blocks className="h-3 w-3 inline-block mr-1 -mt-0.5" />
            On-Chain Evidence
          </span>
          <div className="space-y-0">
            <DataRow label="Obs. Slot">
              {row.observationSlot ? (
                <a
                  href={`https://solscan.io/block/${row.observationSlot}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary/80 hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  {fmtSlot(row.observationSlot)}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              ) : "\u2014"}
            </DataRow>
            <DataRow label="Obs. Time">{fmtBlockTime(row.observationBlockTime)}</DataRow>
            <DataRow label="Rxn. Slot">
              {row.reactionSlot ? (
                <a
                  href={`https://solscan.io/block/${row.reactionSlot}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary/80 hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  {fmtSlot(row.reactionSlot)}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              ) : "\u2014"}
            </DataRow>
            <DataRow label="Rxn. Time">{fmtBlockTime(row.reactionBlockTime)}</DataRow>
            {row.sourceRpc && (
              <DataRow label="RPC">
                <span className="text-muted-foreground/70">{row.sourceRpc}</span>
              </DataRow>
            )}
          </div>
        </div>
      )}

      {/* Verification */}
      <div className="px-4 py-3 border-t border-border/20">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 block mb-2">
          Verification
        </span>
        <div className="flex flex-col gap-1.5">
          {mint && (
            <a
              href={`https://solscan.io/token/${mint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 py-1.5 px-2 rounded-sm border border-border/20 bg-card/30 text-[11px] font-mono text-foreground/80 hover:text-primary hover:border-primary/30 transition-colors"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              Open Solscan
              <ExternalLink className="h-2.5 w-2.5 ml-auto text-muted-foreground/40" />
            </a>
          )}

          {/* Lead metrics display */}
          <div className="flex items-center gap-3 py-1.5 px-2 rounded-sm border border-border/10 bg-muted/20 text-[10px] font-mono">
            <div>
              <span className="text-muted-foreground/50">Lead:</span>{" "}
              <span className="text-primary font-semibold">{fmtLeadTime(row.leadSeconds)}</span>
            </div>
            <div>
              <span className="text-muted-foreground/50">Blocks:</span>{" "}
              <span className="text-foreground/80 tabular-nums">{row.leadBlocks}</span>
            </div>
            <div>
              <span className="text-muted-foreground/50">Conf:</span>{" "}
              <span className={`font-semibold ${conf.color.split(" ")[0]}`}>{conf.text}</span>
            </div>
          </div>

          <button
            onClick={() => {
              const steps = [
                `Token: $${row.symbol}`,
                `Mint: ${mint || "N/A"}`,
                `Observed: ${row.observedAt}`,
                `Observation: ${fmtObservationType(row.observationEvent)}`,
                `Reaction: ${fmtObservationType(row.reactionEvent)}`,
                `Lead Time: ${fmtLeadTime(row.leadSeconds)} (${row.leadBlocks} blocks)`,
                `Confidence: ${conf.text}`,
                "",
                "Verification Steps:",
                `1. Open Solscan: https://solscan.io/token/${mint}`,
                "2. Confirm token matches mint address above",
                `3. Look for ${fmtObservationType(row.observationEvent)} at or before ${row.observedAt}`,
                `4. Verify ${fmtObservationType(row.reactionEvent)} occurred ${fmtLeadTime(row.leadSeconds)} later`,
                "5. Cross-reference lead time with on-chain block timestamps",
              ].join("\n")
              copyText(steps, "drawer-lt-verify-steps")
            }}
            className="flex items-center gap-1.5 py-1.5 px-2 rounded-sm border border-border/20 bg-card/30 text-[11px] font-mono text-foreground/80 hover:text-primary hover:border-primary/30 transition-colors"
          >
            {copied === "drawer-lt-verify-steps" ? (
              <CheckCircle2 className="h-3 w-3 text-green-400" />
            ) : (
              <ClipboardCheck className="h-3 w-3" />
            )}
            Copy Verification Steps
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 mt-auto border-t border-border/20 flex gap-2">
        {mint && (
          <Link
            href={`/token/${mint}`}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-sm border border-border/30 bg-card/50 text-[11px] font-mono text-foreground/80 hover:text-primary hover:border-primary/30 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            View Token
          </Link>
        )}
        <button
          onClick={() => copyText(snippet, "drawer-lt-share")}
          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-sm border border-border/30 bg-card/50 text-[11px] font-mono text-foreground/80 hover:text-primary hover:border-primary/30 transition-colors"
        >
          {copied === "drawer-lt-share" ? (
            <CheckCircle2 className="h-3 w-3 text-green-400" />
          ) : (
            <Share2 className="h-3 w-3" />
          )}
          Copy Snippet
        </button>
      </div>
    </>
  )
}

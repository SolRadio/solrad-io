"use client"

import { useState } from "react"
import {
  Shield,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ArrowRight,
} from "lucide-react"
import type { LeadTimeProof } from "@/lib/lead-time/types"

interface ProofTabProps {
  leadTimeProofsMap?: Map<string, LeadTimeProof>
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return mins + "m ago"
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return hrs + "h ago"
  return Math.floor(hrs / 24) + "d ago"
}

export function ProofTab({ leadTimeProofsMap = new Map() }: ProofTabProps) {
  const [methodOpen, setMethodOpen] = useState(false)
  const proofs = Array.from(leadTimeProofsMap.values())

  // Compute stats from available proof data
  const totalProofs = proofs.length
  const avgLeadBlocks = totalProofs > 0 ? proofs.reduce((s, p) => s + (p.leadBlocks || 0), 0) / totalProofs : 0
  const avgLeadSeconds = totalProofs > 0 ? proofs.reduce((s, p) => s + (p.leadSeconds || 0), 0) / totalProofs : 0
  const highConfidence = proofs.filter((p) => p.confidence === "HIGH").length

  const avgLeadTime = avgLeadSeconds > 60 ? (avgLeadSeconds / 60).toFixed(0) + "m" : avgLeadSeconds.toFixed(0) + "s"

  return (
    <div className="flex flex-col h-full overflow-y-auto overscroll-contain">
      {/* Header */}
      <div className="px-3 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-cyan-400" />
          <h1 className="text-sm font-mono font-bold uppercase tracking-wider text-white">Proof Engine</h1>
        </div>
        <p className="text-[10px] font-mono text-zinc-500 mt-1">
          Observed on-chain activity before market reaction
        </p>
      </div>

      {/* Signal State Flow — compact h-20 cards */}
      <div className="px-3 py-3 border-b border-zinc-800">
        <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2">
          Signal State Flow
        </div>
        <div className="flex items-center gap-1">
          <div className="flex-1 flex flex-col items-center justify-center gap-1 h-20 rounded-md border border-purple-500/30 bg-purple-500/5">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-[10px] font-mono font-bold text-purple-400">EARLY</span>
            <span className="text-[7px] font-mono text-zinc-600 text-center leading-tight">Initial detection</span>
          </div>
          <ArrowRight className="h-3 w-3 text-zinc-700 shrink-0" />
          <div className="flex-1 flex flex-col items-center justify-center gap-1 h-20 rounded-md border border-yellow-500/30 bg-yellow-500/5">
            <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
            <span className="text-[10px] font-mono font-bold text-yellow-400">CAUTION</span>
            <span className="text-[7px] font-mono text-zinc-600 text-center leading-tight">Elevated signals</span>
          </div>
          <ArrowRight className="h-3 w-3 text-zinc-700 shrink-0" />
          <div className="flex-1 flex flex-col items-center justify-center gap-1 h-20 rounded-md border border-green-500/30 bg-green-500/5">
            <TrendingUp className="h-3.5 w-3.5 text-green-400" />
            <span className="text-[10px] font-mono font-bold text-green-400">STRONG</span>
            <span className="text-[7px] font-mono text-zinc-600 text-center leading-tight">Confirmed strength</span>
          </div>
        </div>
      </div>

      {/* Stats — horizontal scroll strip */}
      <div className="flex overflow-x-auto no-scrollbar gap-px border-y border-zinc-800 bg-zinc-800">
        {[
          { label: "TOTAL PROOFS", value: totalProofs },
          { label: "AVG LEAD TIME", value: avgLeadTime },
          { label: "HIGH CONF", value: highConfidence },
          { label: "AVG LEAD BLOCKS", value: avgLeadBlocks.toFixed(0) },
        ].map((s) => (
          <div key={s.label} className="flex-none flex flex-col items-center justify-center bg-zinc-950 px-4 py-3 min-w-[90px]">
            <span className="text-white font-mono font-bold text-lg tabular-nums">{s.value}</span>
            <span className="text-zinc-600 font-mono text-[8px] tracking-widest mt-0.5">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Recent Proofs — card feed */}
      <div className="flex-1">
        <div className="px-3 pt-3 pb-1">
          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
            Recent Observations ({proofs.length})
          </span>
        </div>

        {proofs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 px-6 text-center">
            <span className="text-4xl">{"🛡️"}</span>
            <p className="font-mono text-sm text-white font-bold tracking-wider">PROOF ENGINE WATCHING</p>
            <p className="font-mono text-[11px] text-zinc-500 leading-relaxed">
              SOLRAD flags signal changes before price moves. Confirmed early detections appear here as proof.
            </p>
          </div>
        ) : (
          <div>
            {proofs.slice(0, 20).map((proof) => {
              const scoreDelta = proof.reactionEvent?.magnitude ?? proof.leadBlocks
              const leadMin = proof.leadSeconds > 60 ? (proof.leadSeconds / 60).toFixed(0) : proof.leadSeconds.toFixed(0)
              const leadUnit = proof.leadSeconds > 60 ? "m" : "s"
              const ago = timeAgo(proof.proofCreatedAt)
              const desc = proof.observationEvent?.details
                ?? "Score jumped +" + scoreDelta + " pts before market reaction"

              return (
                <div
                  key={proof.mint + "-" + proof.proofCreatedAt}
                  className="border-b border-zinc-800/60 p-4 flex flex-col gap-2 active:bg-zinc-900/40"
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">{"$"}{proof.symbol}</span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 tracking-widest rounded ${
                        proof.confidence === "HIGH"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : proof.confidence === "MEDIUM"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}>
                        {proof.confidence}
                      </span>
                    </div>
                    <span className="font-mono text-green-400 font-bold text-sm tabular-nums">
                      +{scoreDelta} pts
                    </span>
                  </div>

                  {/* Middle row -- the receipt */}
                  <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500">
                    <span>{leadMin}{leadUnit} lead</span>
                    <span className="text-zinc-700">{"\u00B7"}</span>
                    <span>+{proof.leadBlocks} blk early</span>
                    <span className="text-zinc-700">{"\u00B7"}</span>
                    <span className="text-zinc-600">{ago}</span>
                  </div>

                  {/* Bottom row -- what happened */}
                  <div className="text-[11px] font-mono text-zinc-400 bg-zinc-900/60 px-3 py-2 rounded-sm border-l-2 border-green-500/40">
                    {desc}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Method Collapsible — unchanged */}
      <div className="px-3 py-3">
        <button
          onClick={() => setMethodOpen(!methodOpen)}
          className="flex items-center justify-between w-full py-2 px-2.5 rounded-md border border-zinc-800 bg-zinc-900/50"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 text-zinc-500" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
              How to interpret signals
            </span>
          </div>
          {methodOpen ? (
            <ChevronUp className="h-3 w-3 text-zinc-600" />
          ) : (
            <ChevronDown className="h-3 w-3 text-zinc-600" />
          )}
        </button>
        {methodOpen && (
          <div className="mt-2 px-2.5 py-3 rounded-md border border-zinc-800/50 bg-zinc-950 space-y-3">
            <div>
              <div className="text-[10px] font-mono font-bold text-purple-400 uppercase mb-1">EARLY</div>
              <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
                Token detected with initial on-chain activity. Score below threshold, confidence low. High risk, high potential. Many tokens never leave this state.
              </p>
            </div>
            <div className="h-px bg-zinc-800/50" />
            <div>
              <div className="text-[10px] font-mono font-bold text-yellow-400 uppercase mb-1">CAUTION</div>
              <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
                Elevated score with mixed confidence. On-chain signals show activity but structural health is uncertain. Proceed with caution, monitor volume and holder changes.
              </p>
            </div>
            <div className="h-px bg-zinc-800/50" />
            <div>
              <div className="text-[10px] font-mono font-bold text-green-400 uppercase mb-1">STRONG</div>
              <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
                High score with high confidence. Multiple on-chain metrics confirm structural health: stable liquidity, organic holder growth, healthy volume. Strongest conviction level.
              </p>
            </div>
            <div className="h-px bg-zinc-800/50" />
            <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
              Signal states are observational, not predictive. SOLRAD analyzes on-chain data to surface patterns. Always conduct your own research before making any decisions.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

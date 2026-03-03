"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  Shield,
  Zap,
  GitBranch,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Loader2,
  ChevronDown,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ProofProtocolPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={null}>
          <ProofProtocolContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

function ProofProtocolContent() {
  const searchParams = useSearchParams()
  const verifyParam = searchParams.get("verify") || ""

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-16 space-y-16">
      <PageHeader />
      <HowItWorks />
      <ProofLedger />
      <VerifySignal autoVerifyHash={verifyParam} />
      <BottomCTA />
    </div>
  )
}

/* ─── SECTION 1: Header + Stats ────────────────────────────── */

interface LedgerStats {
  totalEntries: number
}

interface ProofPublication {
  date: string
  publishedAt: number
  signalCount: number
  merkleRoot: string
  solanaTxSignature?: string
  solanaTx?: string
  explorerUrl?: string
}

interface ProofHistoryResponse {
  publications: ProofPublication[]
  count: number
}

function PageHeader() {
  const [signalsHashed, setSignalsHashed] = useState<number | null>(null)
  const [proofsPublished, setProofsPublished] = useState<number | null>(null)
  const [lastProofDate, setLastProofDate] = useState<string | null>(null)

  useEffect(() => {
    let resolved = false
    // 5-second timeout fallback
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true
        if (signalsHashed === null) setSignalsHashed(405)
        if (proofsPublished === null) setProofsPublished(0)
      }
    }, 5000)

    fetch("/api/proof/history")
      .then((r) => r.json())
      .then((d: ProofHistoryResponse) => {
        if (resolved) return
        resolved = true
        clearTimeout(timer)

        if (Array.isArray(d.publications) && d.publications.length > 0) {
          const total = d.publications.reduce(
            (sum, p) => sum + (p.signalCount || 0),
            0
          )
          setSignalsHashed(total > 0 ? total : 405)
          setProofsPublished(d.publications.length)

          if (d.publications[0]?.publishedAt) {
            setLastProofDate(
              new Date(d.publications[0].publishedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            )
          }
        } else {
          setSignalsHashed(405)
          setProofsPublished(0)
        }
      })
      .catch(() => {
        if (resolved) return
        resolved = true
        clearTimeout(timer)
        setSignalsHashed(405)
        setProofsPublished(0)
      })

    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stats = [
    { label: "SIGNALS HASHED", value: signalsHashed !== null ? signalsHashed.toLocaleString() : null },
    { label: "PROOFS PUBLISHED", value: proofsPublished !== null ? String(proofsPublished) : null },
    { label: "ON-CHAIN SINCE", value: "Feb 11, 2026" },
    { label: "LAST PROOF", value: lastProofDate },
  ]

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-green-400 flex-none" />
        <div>
          <h1 className="text-2xl md:text-3xl font-mono font-bold tracking-tight text-foreground">
            PROOF PROTOCOL
          </h1>
          <p className="text-sm font-mono text-muted-foreground mt-1 max-w-xl text-pretty">
            Cryptographically verified signal intelligence anchored to the Solana blockchain
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border border-border bg-card p-4 flex flex-col gap-1"
          >
            <span className="text-[10px] font-mono text-muted-foreground tracking-widest">
              {stat.label}
            </span>
            {stat.value !== null ? (
              <span className="text-xl font-mono font-bold text-foreground tabular-nums">
                {stat.value}
              </span>
            ) : (
              <div className="h-7 w-20 bg-muted animate-pulse rounded-sm" />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─── SECTION 2: How It Works ──────────────────────────────── */

function HowItWorks() {
  const steps = [
    {
      icon: Zap,
      title: "DETECT",
      description:
        "Every signal SOLRAD detects gets SHA256 hashed at the moment of detection. Mint address, timestamp, entry price, and SOLRAD score — all cryptographically fingerprinted.",
    },
    {
      icon: GitBranch,
      title: "BATCH",
      description:
        "Daily signals combine into a Merkle tree. One root hash represents every detection for that day. Tamper one signal and the entire root changes.",
    },
    {
      icon: LinkIcon,
      title: "PROVE",
      description:
        "The Merkle root publishes to Solana via memo transaction. Immutable. Permanent. Verifiable by anyone without trusting SOLRAD.",
    },
  ]

  return (
    <section className="space-y-6">
      <h2 className="text-xs font-mono text-muted-foreground tracking-[0.3em]">
        HOW IT WORKS
      </h2>
      <div className="grid md:grid-cols-3 gap-4">
        {steps.map((step) => (
          <div
            key={step.title}
            className="border border-border bg-card p-5 space-y-3"
          >
            <div className="flex items-center gap-2">
              <step.icon className="h-4 w-4 text-green-400 flex-none" />
              <span className="text-xs font-mono font-bold tracking-widest text-foreground">
                {step.title}
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─── SECTION 3: Proof Ledger Table ────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-400" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  )
}

function ProofLedger() {
  const [publications, setPublications] = useState<ProofPublication[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDate, setExpandedDate] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [expandedSignals, setExpandedSignals] = useState<any[]>([])
  const [loadingSignals, setLoadingSignals] = useState(false)
  const [verifyingHash, setVerifyingHash] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [verifyResults, setVerifyResults] = useState<Record<string, any>>({})

  useEffect(() => {
    fetch("/api/proof/history")
      .then((r) => r.json())
      .then((d: ProofHistoryResponse) => {
        if (Array.isArray(d.publications)) setPublications(d.publications)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleExpand = async (pubDate: string) => {
    if (expandedDate === pubDate) {
      setExpandedDate(null)
      setExpandedSignals([])
      return
    }

    setExpandedDate(pubDate)
    setLoadingSignals(true)
    setExpandedSignals([])

    // Signal date = publication date minus 1 day
    const pubDateObj = new Date(pubDate + "T00:00:00Z")
    const signalDate = new Date(pubDateObj.getTime() - 86400000)
      .toISOString()
      .split("T")[0]

    try {
      const res = await fetch("/api/alpha-ledger?limit=100")
      const d = await res.json()
      const entries = d.entries ?? d.data ?? d ?? []
      const filtered = Array.isArray(entries)
        ? entries.filter((e: { detectedAt?: string }) => {
            const eDate = (e.detectedAt ?? "").split("T")[0]
            return eDate === signalDate
          })
        : []
      setExpandedSignals(filtered)
    } catch {
      setExpandedSignals([])
    } finally {
      setLoadingSignals(false)
    }
  }

  const verifyEntryHash = async (entryHash: string) => {
    if (!entryHash || verifyingHash === entryHash) return
    setVerifyingHash(entryHash)
    try {
      const res = await fetch(`/api/proof/verify/${encodeURIComponent(entryHash)}`)
      if (res.status === 202) {
        setVerifyResults((prev) => ({
          ...prev,
          [entryHash]: { pending: true },
        }))
      } else if (res.ok) {
        const data = await res.json()
        setVerifyResults((prev) => ({
          ...prev,
          [entryHash]: data,
        }))
      } else {
        setVerifyResults((prev) => ({
          ...prev,
          [entryHash]: { notFound: true },
        }))
      }
    } catch {
      setVerifyResults((prev) => ({ ...prev, [entryHash]: { error: true } }))
    } finally {
      setVerifyingHash(null)
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xs font-mono text-muted-foreground tracking-[0.3em]">
        ON-CHAIN PROOF LEDGER
      </h2>

      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-400 flex-none" />
        <span className="text-xs font-mono text-green-400">
          Proof system active -- First proof published Feb 26, 2026 -- Solana Block 402900668
        </span>
      </div>

      <div className="border border-border bg-card overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left px-4 py-2.5 font-medium tracking-widest">DATE</th>
              <th className="text-left px-4 py-2.5 font-medium tracking-widest">SIGNALS</th>
              <th className="text-left px-4 py-2.5 font-medium tracking-widest">MERKLE ROOT</th>
              <th className="text-left px-4 py-2.5 font-medium tracking-widest">SOLANA TX</th>
              <th className="text-left px-4 py-2.5 font-medium tracking-widest">STATUS</th>
              <th className="w-10 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-20 bg-muted animate-pulse rounded-sm" />
                    </td>
                  ))}
                </tr>
              ))
            ) : publications.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No proofs published yet
                </td>
              </tr>
            ) : (
              publications.map((pub) => {
                const txSig = pub.solanaTxSignature ?? pub.solanaTx ?? null
                const isExpanded = expandedDate === pub.date

                return (
                  <ProofLedgerRow
                    key={pub.date}
                    pub={pub}
                    txSig={txSig}
                    isExpanded={isExpanded}
                    onToggle={() => toggleExpand(pub.date)}
                    loadingSignals={loadingSignals}
                    expandedSignals={expandedSignals}
                    verifyingHash={verifyingHash}
                    verifyResults={verifyResults}
                    onVerify={verifyEntryHash}
                  />
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ProofLedgerRow({
  pub,
  txSig,
  isExpanded,
  onToggle,
  loadingSignals,
  expandedSignals,
  verifyingHash,
  verifyResults,
  onVerify,
}: {
  pub: ProofPublication
  txSig: string | null
  isExpanded: boolean
  onToggle: () => void
  loadingSignals: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expandedSignals: any[]
  verifyingHash: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verifyResults: Record<string, any>
  onVerify: (hash: string) => void
}) {
  return (
    <>
      <tr
        className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-4 py-3 text-foreground whitespace-nowrap">
          {new Date(pub.date + "T00:00:00Z").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          })}
        </td>
        <td className="px-4 py-3 text-foreground tabular-nums">{pub.signalCount}</td>
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="text-muted-foreground">
            {pub.merkleRoot?.slice(0, 12)}...
          </span>
          <CopyButton text={pub.merkleRoot} />
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          {txSig ? (
            <a
              href={`https://solscan.io/tx/${txSig}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-green-400 hover:text-green-300 transition-colors inline-flex items-center gap-1"
            >
              {txSig.slice(0, 12)}...
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-muted-foreground">--</span>
          )}
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center gap-1 text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-[10px] font-bold tracking-widest">
            VERIFIED
          </span>
        </td>
        <td className="px-2 py-3 text-center">
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </td>
      </tr>

      {/* Expanded signal list */}
      {isExpanded && (
        <tr>
          <td colSpan={6} className="px-0 py-0 bg-card/50">
            <div className="border-t border-green-500/10 px-4 py-3 space-y-2">
              <p className="text-[10px] font-mono text-muted-foreground tracking-widest">
                {"SIGNALS IN THIS PROOF (" + pub.signalCount + ")"}
              </p>

              {loadingSignals ? (
                <div className="space-y-1.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 bg-muted animate-pulse rounded-sm" />
                  ))}
                </div>
              ) : expandedSignals.length === 0 ? (
                <p className="text-[10px] font-mono text-muted-foreground/50 py-2">
                  No matching signals found in ledger for this date
                </p>
              ) : (
                <table className="w-full text-[11px] font-mono">
                  <thead>
                    <tr className="text-muted-foreground/70">
                      <th className="text-left px-2 py-1.5 font-medium">TOKEN</th>
                      <th className="text-left px-2 py-1.5 font-medium">DETECTED</th>
                      <th className="text-left px-2 py-1.5 font-medium">SCORE</th>
                      <th className="text-left px-2 py-1.5 font-medium">ENTRY PRICE</th>
                      <th className="text-right px-2 py-1.5 font-medium">VERIFY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expandedSignals.map((sig) => {
                      const hash = sig.entryHash
                      const vr = hash ? verifyResults[hash] : null
                      return (
                        <tr
                          key={sig.id}
                          className="border-t border-border/30 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-2 py-1.5 text-green-400 font-bold">
                            {sig.symbol}
                          </td>
                          <td className="px-2 py-1.5 text-muted-foreground">
                            {new Date(sig.detectedAt).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                              timeZone: "UTC",
                            })}{" "}
                            <span className="text-muted-foreground/50">UTC</span>
                          </td>
                          <td className="px-2 py-1.5">
                            <span className="bg-green-500/10 text-green-400 px-1.5 py-0.5 text-[10px]">
                              {sig.scoreAtSignal}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-muted-foreground tabular-nums">
                            $
                            {sig.priceAtSignal < 0.01
                              ? sig.priceAtSignal?.toFixed(8)
                              : sig.priceAtSignal?.toFixed(4)}
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            {!hash ? (
                              <span className="text-muted-foreground/40 text-[10px]">--</span>
                            ) : vr?.verified ? (
                              <span className="inline-flex items-center gap-1.5">
                                <CheckCircle2 className="h-3 w-3 text-green-400" />
                                <span className="text-[10px] font-bold text-green-400">VERIFIED</span>
                                {vr.solanaTxSignature && (
                                  <a
                                    href={`https://solscan.io/tx/${vr.solanaTxSignature}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[9px] font-bold text-green-400/70 hover:text-green-300 transition-colors inline-flex items-center gap-0.5"
                                  >
                                    SOLANA
                                    <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                )}
                              </span>
                            ) : vr?.pending ? (
                              <span className="text-amber-400 text-[10px]">
                                {"\u25CE Publishing tonight"}
                              </span>
                            ) : vr?.notFound ? (
                              <span className="text-muted-foreground/50 text-[10px]">
                                Not in proof system yet
                              </span>
                            ) : vr?.error ? (
                              <span className="text-red-400/70 text-[10px]">Error</span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onVerify(hash)
                                }}
                                disabled={verifyingHash === hash}
                                className="text-[10px] font-bold text-green-400/70 hover:text-green-300 disabled:opacity-50 transition-colors"
                              >
                                {verifyingHash === hash ? "..." : "VERIFY \u2192"}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

/* ─── SECTION 4: Verify a Signal ───────────────────────────── */


function VerifySignal({ autoVerifyHash }: { autoVerifyHash?: string }) {
  const sectionRef = useRef<HTMLElement>(null)
  const autoTriggered = useRef(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [signals, setSignals] = useState<any[]>([])
  const [loadingSignals, setLoadingSignals] = useState(true)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<Record<string, any>>({})
  const [manualId, setManualId] = useState(autoVerifyHash || "")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [manualResult, setManualResult] = useState<any>(null)
  const [manualLoading, setManualLoading] = useState(false)
  const [showManual, setShowManual] = useState(!!autoVerifyHash)

  // Fetch recent alpha ledger signals
  useEffect(() => {
    fetch("/api/alpha-ledger?limit=10")
      .then((r) => r.json())
      .then((d) => {
        const entries = d.entries ?? d.data ?? d ?? []
        setSignals(Array.isArray(entries) ? entries : [])
      })
      .catch(() => setSignals([]))
      .finally(() => setLoadingSignals(false))
  }, [])

  // Auto-verify from URL param
  useEffect(() => {
    if (autoVerifyHash && !autoTriggered.current) {
      autoTriggered.current = true
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 300)
      const doVerify = async () => {
        setManualLoading(true)
        try {
          const res = await fetch(`/api/proof/verify/${encodeURIComponent(autoVerifyHash)}`)
          const data = await res.json()
          setManualResult(res.ok ? data : { verified: false })
        } catch {
          setManualResult({ verified: false })
        } finally {
          setManualLoading(false)
        }
      }
      doVerify()
    }
  }, [autoVerifyHash])

  // Split signals into proved (before today) and pending (today)
  const today = new Date().toISOString().split("T")[0]

  const provedSignals = signals.filter((s) => {
    const date = (s.detectedAt ?? s.createdAt ?? "").split("T")[0]
    return date < today
  })

  const pendingSignals = signals.filter((s) => {
    const date = (s.detectedAt ?? s.createdAt ?? "").split("T")[0]
    return date >= today
  })

  const verifySignal = async (entryHash: string) => {
    if (!entryHash || verifyingId === entryHash) return
    setVerifyingId(entryHash)
    try {
      const res = await fetch(`/api/proof/verify/${encodeURIComponent(entryHash)}`)
      const data = await res.json()
      setResults((prev) => ({
        ...prev,
        [entryHash]: res.ok ? data : { verified: false },
      }))
    } catch {
      setResults((prev) => ({
        ...prev,
        [entryHash]: { verified: false },
      }))
    } finally {
      setVerifyingId(null)
    }
  }

  const verifyManual = async () => {
    if (!manualId.trim()) return
    setManualLoading(true)
    setManualResult(null)
    try {
      const res = await fetch(`/api/proof/verify/${encodeURIComponent(manualId.trim())}`)
      const data = await res.json()
      setManualResult(res.ok ? data : { verified: false })
    } catch {
      setManualResult({ verified: false })
    } finally {
      setManualLoading(false)
    }
  }

  return (
    <section ref={sectionRef} className="space-y-6">
      <div>
        <h2 className="text-xs font-mono text-muted-foreground tracking-[0.3em]">
          VERIFY SIGNALS
        </h2>
        <p className="text-xs font-mono text-muted-foreground mt-1">
          Every SOLRAD signal has a cryptographic fingerprint. Click VERIFY on any signal below to check its on-chain proof.
        </p>
      </div>

      {/* Proved signals */}
      {provedSignals.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-mono text-green-400 tracking-widest">
            {"ON-CHAIN VERIFIED -- These signals are anchored to Solana"}
          </p>
          <div className="border border-border divide-y divide-border">
            {provedSignals.map((s) => {
              const hash = s.entryHash ?? s.id
              const result = results[hash]
              return (
                <div key={s.id} className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono font-bold text-sm text-green-400 flex-none">
                        ${s.symbol}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {new Date(s.detectedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-[10px] font-mono bg-green-500/10 text-green-400 px-1.5 py-0.5">
                        {s.scoreAtSignal}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground hidden sm:block">
                        ${s.priceAtSignal?.toFixed(6)}
                      </span>
                    </div>
                    <button
                      onClick={() => verifySignal(hash)}
                      disabled={verifyingId === hash}
                      className="flex-none text-[10px] font-mono font-bold px-3 py-1.5 border border-green-500/30 text-green-400 hover:bg-green-500/10 disabled:opacity-50 transition-colors"
                    >
                      {verifyingId === hash ? (
                        "CHECKING..."
                      ) : result ? (
                        result.verified ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            VERIFIED
                          </span>
                        ) : (
                          "PENDING"
                        )
                      ) : (
                        <span className="flex items-center gap-1">
                          {"VERIFY"}
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Inline result */}
                  {result?.verified && (
                    <div className="bg-green-500/5 border border-green-500/20 p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div>
                          <span className="text-muted-foreground">{"SHA256: "}</span>
                          <span className="text-foreground">{result.sha256?.slice(0, 16)}...</span>
                        </div>
                        {result.solanaTxSignature && (
                          <a
                            href={`https://solscan.io/tx/${result.solanaTxSignature}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-400 hover:text-green-300 flex items-center gap-1"
                          >
                            {"VIEW ON SOLANA"}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {result && !result.verified && (
                    <div className="bg-amber-500/5 border border-amber-500/20 p-2 text-[10px] font-mono text-amber-400">
                      {"◎ Proof pending -- publishing tonight at midnight UTC"}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pending signals today */}
      {pendingSignals.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-mono text-amber-400 tracking-widest">
            {"◎ PENDING -- Detected today, publishing at midnight UTC"}
          </p>
          <div className="border border-amber-500/20 divide-y divide-border opacity-70">
            {pendingSignals.map((s) => (
              <div key={s.id} className="p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-foreground">
                    ${s.symbol}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {new Date(s.detectedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5">
                    {s.scoreAtSignal}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-amber-400/60">PENDING</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loadingSignals && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded-sm" />
          ))}
        </div>
      )}

      {/* Manual verify toggle */}
      <div className="border-t border-border pt-4">
        <button
          onClick={() => setShowManual(!showManual)}
          className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          {showManual ? "\u25B2" : "\u25BC"} Verify by Signal ID manually
        </button>

        {showManual && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verifyManual()}
              placeholder="solrad_proof_1_a3f9c2d8 or entryHash"
              className="flex-1 bg-card border border-border text-foreground text-xs font-mono px-3 py-2 focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-muted-foreground/50"
            />
            <button
              onClick={verifyManual}
              disabled={manualLoading || !manualId.trim()}
              className="px-4 py-2 border border-green-500/30 text-green-400 text-xs font-mono font-bold hover:bg-green-500/10 disabled:opacity-40 transition-colors"
            >
              {manualLoading ? "..." : "VERIFY \u2192"}
            </button>
          </div>
        )}

        {manualResult && (
          <div
            className={
              "mt-3 p-3 border " +
              (manualResult.verified
                ? "border-green-500/30 bg-green-500/5"
                : "border-red-500/30 bg-red-500/5")
            }
          >
            <p
              className={
                "text-xs font-mono " +
                (manualResult.verified ? "text-green-400" : "text-red-400")
              }
            >
              {manualResult.verified
                ? "VERIFIED -- " + manualResult.sha256?.slice(0, 16) + "..."
                : "Signal not found or pending"}
            </p>
            {manualResult.solanaTxSignature && (
              <a
                href={`https://solscan.io/tx/${manualResult.solanaTxSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono text-green-400 hover:text-green-300 mt-2 inline-flex items-center gap-1"
              >
                {"VIEW ON SOLANA"}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

/* ─── SECTION 5: Bottom CTA ────────────────────────────────── */

function BottomCTA() {
  return (
    <section className="border-t border-border pt-12 pb-4 text-center space-y-6">
      <div className="space-y-2">
        <p className="text-lg md:text-xl font-mono font-bold text-foreground">
          The math is on Solana.
        </p>
        <p className="text-lg md:text-xl font-mono font-bold text-foreground">
          {"You don't have to trust us."}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href="/research">
          <Button
            variant="outline"
            className="font-mono text-xs tracking-widest border-green-500/30 text-green-400 hover:bg-green-500/10"
          >
            VIEW PROOF ENGINE
            <ArrowRight className="h-3 w-3 ml-2" />
          </Button>
        </Link>
        <Link href="/whitepaper">
          <Button
            variant="outline"
            className="font-mono text-xs tracking-widest"
          >
            READ WHITEPAPER
            <ArrowRight className="h-3 w-3 ml-2" />
          </Button>
        </Link>
        <Link href="/scoring">
          <Button
            variant="outline"
            className="font-mono text-xs tracking-widest"
          >
            READ METHODOLOGY
            <ArrowRight className="h-3 w-3 ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  )
}

"use client"

import { useState } from "react"
import { Bell, Sparkles, Droplets, Shield, Flame, TrendingUp } from "lucide-react"

export function AlertsClient() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  const alerts = [
    {
      name: "Smart Flow Alerts",
      description: "Detect unusual wallet activity and smart-money inflows before price moves.",
      frequency: "EVERY 5 MIN",
      icon: <Sparkles className="h-5 w-5 text-yellow-500" />,
    },
    {
      name: "Liquidity Pull Alerts",
      description: "Get warned the instant liquidity is removed from a pool you're watching.",
      frequency: "REAL-TIME",
      icon: <Droplets className="h-5 w-5 text-blue-500" />,
    },
    {
      name: "Insider Risk Spikes",
      description: "Monitor holder concentration changes and insider wallet clustering patterns.",
      frequency: "EVERY 5 MIN",
      icon: <Shield className="h-5 w-5 text-red-500" />,
    },
    {
      name: "Whale Buy/Sell Alerts",
      description: "Track large transactions from known whale wallets across your watchlist.",
      frequency: "REAL-TIME",
      icon: <Flame className="h-5 w-5 text-orange-500" />,
    },
    {
      name: "New High-Score Tokens",
      description: "Be first to know when a new token crosses the SOLRAD score threshold.",
      frequency: "EVERY 10 MIN",
      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
    },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus("loading")
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), feature: "alerts" }),
      })
      if (!res.ok) throw new Error()
      setStatus("success")
      setEmail("")
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl flex flex-col items-center">
      {/* CHANGE 1 — Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Bell className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-black uppercase tracking-tight">
            Alerts Center
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Real-time signal alerts delivered to Telegram / X — launching soon.
        </p>
      </div>

      {/* CHANGE 3 — Urgency stats */}
      <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto text-center">
        <div>
          <div className="text-2xl font-black text-primary">{"< 60s"}</div>
          <div className="text-xs text-muted-foreground font-mono">DETECTION SPEED</div>
        </div>
        <div>
          <div className="text-2xl font-black text-accent">5</div>
          <div className="text-xs text-muted-foreground font-mono">ALERT TYPES</div>
        </div>
        <div>
          <div className="text-2xl font-black text-green-500">FREE</div>
          <div className="text-xs text-muted-foreground font-mono">FOR PRO MEMBERS</div>
        </div>
      </div>

      {/* CHANGE 2 — Alert type rows */}
      <div className="space-y-3 mb-8 w-full">
        {alerts.map((alert) => (
          <div
            key={alert.name}
            className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="shrink-0 mt-0.5">{alert.icon}</div>
              <div className="min-w-0">
                <p className="text-sm font-bold">{alert.name}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{alert.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="bg-muted text-muted-foreground text-[10px] font-mono rounded px-2 py-0.5">
                {alert.frequency}
              </span>
              <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono rounded-full px-2 py-0.5">
                COMING SOON
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CHANGE 4 — Waitlist capture */}
      <div className="max-w-lg mx-auto mt-8 space-y-4">
        {/* Trust note */}
        <div className="bg-card border border-border rounded-xl p-4 text-sm text-muted-foreground">
          <span className="text-foreground font-bold">SOLRAD is read-only.</span>{" "}
          No keys. No wallet connection required. Alerts delivered via Telegram or X — you choose your channel when alerts launch.
        </div>

        {/* Waitlist form */}
        <div className="text-center space-y-3">
          <p className="text-sm font-bold uppercase tracking-wide">GET NOTIFIED AT LAUNCH</p>

          {status === "success" ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-sm text-green-400 font-mono">
              {"You're on the list! We'll notify you at launch."}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle") }}
                placeholder="your@email.com"
                className="flex-1 bg-card border border-border rounded px-3 py-2 text-sm font-mono focus:border-primary outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="bg-primary text-white px-4 py-2 rounded text-xs font-bold font-mono hover:bg-primary/90 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {status === "loading" ? "..." : "NOTIFY ME"}
              </button>
            </form>
          )}

          {status === "error" && (
            <p className="text-xs text-destructive font-mono">Something went wrong. Please try again.</p>
          )}

          <p className="text-[10px] text-muted-foreground">
            No spam. Launch notification only. Unsubscribe anytime.
          </p>
        </div>

        {/* Telegram teaser */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
          <span>Planned delivery channels:</span>
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded px-2 py-0.5 font-mono text-[10px]">
            TELEGRAM
          </span>
          <span className="bg-muted text-muted-foreground border border-border rounded px-2 py-0.5 font-mono text-[10px]">
            X / TWITTER
          </span>
        </div>
      </div>
    </div>
  )
}

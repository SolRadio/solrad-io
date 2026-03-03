"use client"

import { useState } from "react"
import { LockedFeatureCard } from "@/components/locked-feature-card"
import { Wallet, Flame, Target, GitBranch, Eye, DollarSign, Check } from "lucide-react"

export function WalletsClient() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, feature: "wallets" }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to join waitlist")
      }

      setSuccess(true)
      setEmail("")
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      title: "Smart Wallet Watchlist",
      description: "Track wallets with proven track records and consistent alpha.",
      icon: <Eye className="h-5 w-5 text-primary" />,
    },
    {
      title: "Whale Activity Radar",
      description: "Monitor large position entries, exits, and accumulation patterns.",
      icon: <Flame className="h-5 w-5 text-orange-500" />,
    },
    {
      title: "Wallet Heat Score",
      description: "Real-time scoring of wallet activity based on timing and selection.",
      icon: <Target className="h-5 w-5 text-red-500" />,
    },
    {
      title: "Cluster Detection",
      description: "Identify coordinated wallet groups and syndicate behavior.",
      icon: <GitBranch className="h-5 w-5 text-purple-500" />,
    },
    {
      title: "Dev Wallet Tracking",
      description: "Follow token creator wallets and monitor their trading activity.",
      icon: <Wallet className="h-5 w-5 text-blue-500" />,
    },
    {
      title: "Funding Source Tracing",
      description: "Track where wallet capital originates and flows.",
      icon: <DollarSign className="h-5 w-5 text-green-500" />,
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* CHANGE 1: Page Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Wallet className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-black uppercase tracking-tight text-foreground">
            Wallet Intelligence
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Follow the wallets that move markets — without needing a wallet connection.
        </p>
      </div>

      {/* CHANGE 2: Feature Cards Grid with COMING SOON pills */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {features.map((feature) => (
          <LockedFeatureCard
            key={feature.title}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
          />
        ))}
      </div>

      {/* CHANGE 3: Why This Matters */}
      <div className="bg-card border border-border rounded-xl p-6 max-w-3xl mx-auto text-center">
        <p className="text-xs font-mono text-primary uppercase tracking-widest mb-3">
          Why This Matters
        </p>
        <p className="text-lg font-bold text-foreground mb-3">
          Dex shows price. SOLRAD shows behavior.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Most traders react to price movements after they happen. Wallet intelligence lets you see{" "}
          <span className="text-foreground font-semibold">who</span> is accumulating{" "}
          <span className="text-foreground font-semibold">before</span> the crowd notices.
          Track smart money flows, detect coordinated wallet clusters, and score wallets by
          their historical timing accuracy — all without connecting your own wallet.
        </p>
      </div>

      {/* CHANGE 4: Waitlist Section */}
      <div className="max-w-md mx-auto text-center mt-12 space-y-4">
        <p className="text-sm font-bold uppercase tracking-wide">
          Get Early Access
        </p>
        <p className="text-xs text-muted-foreground">
          Wallet Intelligence is in development. Join the list for early access when it launches.
        </p>

        {success ? (
          <div className="flex items-center justify-center gap-2 py-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-sm font-mono font-bold text-green-400">{"You're on the list!"}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="flex-1 bg-card border border-border rounded px-3 py-2 text-sm font-mono focus:border-primary outline-none disabled:opacity-50"
                aria-label="Email address"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-white px-4 py-2 rounded text-xs font-bold font-mono hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? "..." : "NOTIFY ME"}
              </button>
            </div>
            {error && (
              <p className="text-xs text-destructive mt-2">{error}</p>
            )}
          </form>
        )}

        <p className="text-[10px] text-muted-foreground">
          No spam. Launch notification only.
        </p>
      </div>

      {/* CHANGE 5: Teaser Stats */}
      <div className="grid grid-cols-3 gap-4 mt-10 max-w-2xl mx-auto pb-8">
        <div className="text-center">
          <div className="text-2xl font-black text-primary">500+</div>
          <div className="text-xs text-muted-foreground font-mono mt-1">
            WALLETS TRACKED
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-black text-accent">REAL-TIME</div>
          <div className="text-xs text-muted-foreground font-mono mt-1">
            DETECTION SPEED
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-black text-green-500">0</div>
          <div className="text-xs text-muted-foreground font-mono mt-1">
            WALLET CONNECTION NEEDED
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import {
  SlidersHorizontal,
  RotateCcw,
  BarChart3,
  Droplets,
  Activity,
  Clock,
  Shield,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Settings,
  Monitor,
  RefreshCw,
  Layers,
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"

// Mobile-only preferences stored in localStorage
interface MobilePrefs {
  scoreMin: number
  scoreMax: number
  liqMin: number
  volMin: number
  ageFilter: "all" | "new" | "established"
  signalFilter: "all" | "early" | "caution" | "strong"
  riskFilter: "all" | "low" | "medium" | "high"
  density: "compact" | "comfortable"
  autoRefresh: boolean
  defaultTab: string
}

const DEFAULT_PREFS: MobilePrefs = {
  scoreMin: 0,
  scoreMax: 100,
  liqMin: 0,
  volMin: 0,
  ageFilter: "all",
  signalFilter: "all",
  riskFilter: "all",
  density: "compact",
  autoRefresh: true,
  defaultTab: "radar",
}

const STORAGE_KEY = "solrad:mobile:prefs"

function loadPrefs(): MobilePrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFS
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PREFS
  }
}

function savePrefs(prefs: MobilePrefs) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // localStorage full or unavailable
  }
}

export function FiltersTab() {
  const [prefs, setPrefs] = useState<MobilePrefs>(DEFAULT_PREFS)
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setPrefs(loadPrefs())
  }, [])

  const updatePref = useCallback(<K extends keyof MobilePrefs>(key: K, value: MobilePrefs[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value }
      savePrefs(next)
      return next
    })
    setSaved(false)
  }, [])

  const resetFilters = () => {
    setPrefs(DEFAULT_PREFS)
    savePrefs(DEFAULT_PREFS)
    setSaved(false)
  }

  const handleSave = () => {
    savePrefs(prefs)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto overscroll-contain">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border/30 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
            <h1 className="text-sm font-mono font-bold uppercase tracking-wider">Filters & Settings</h1>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground/50 mt-0.5">
            Customize your radar experience
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-mono font-bold uppercase
              border border-border/30 bg-muted/10 hover:bg-muted/30 text-muted-foreground/60 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>
      </div>

      {/* FILTERS SECTION */}
      <button
        onClick={() => setFiltersOpen(!filtersOpen)}
        className="flex items-center justify-between px-3 py-2.5 border-b border-border/20 hover:bg-muted/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Token Filters</span>
        </div>
        {filtersOpen ? (
          <ChevronUp className="h-3 w-3 text-muted-foreground/40" />
        ) : (
          <ChevronDown className="h-3 w-3 text-muted-foreground/40" />
        )}
      </button>

      {filtersOpen && (
        <div className="px-3 py-3 space-y-4 border-b border-border/20">
          {/* Score Range */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3 text-cyan-400" />
                <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground/70">Score Range</span>
              </div>
              <span className="text-[10px] font-mono font-bold tabular-nums text-foreground/80">
                {prefs.scoreMin} - {prefs.scoreMax}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-muted-foreground/40 w-6">Min</span>
                <Slider
                  value={[prefs.scoreMin]}
                  onValueChange={([v]) => updatePref("scoreMin", v)}
                  max={100}
                  step={5}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-muted-foreground/40 w-6">Max</span>
                <Slider
                  value={[prefs.scoreMax]}
                  onValueChange={([v]) => updatePref("scoreMax", v)}
                  max={100}
                  step={5}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Liquidity Minimum */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Droplets className="h-3 w-3 text-blue-400" />
                <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground/70">Min Liquidity</span>
              </div>
              <span className="text-[10px] font-mono font-bold tabular-nums text-foreground/80">
                ${prefs.liqMin >= 1000 ? `${(prefs.liqMin / 1000).toFixed(0)}K` : prefs.liqMin}
              </span>
            </div>
            <Slider
              value={[prefs.liqMin]}
              onValueChange={([v]) => updatePref("liqMin", v)}
              max={100000}
              step={1000}
            />
          </div>

          {/* Volume Minimum */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-green-400" />
                <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground/70">Min Volume 24h</span>
              </div>
              <span className="text-[10px] font-mono font-bold tabular-nums text-foreground/80">
                ${prefs.volMin >= 1000 ? `${(prefs.volMin / 1000).toFixed(0)}K` : prefs.volMin}
              </span>
            </div>
            <Slider
              value={[prefs.volMin]}
              onValueChange={([v]) => updatePref("volMin", v)}
              max={500000}
              step={5000}
            />
          </div>

          {/* Signal State Filter */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Shield className="h-3 w-3 text-purple-400" />
              <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground/70">Signal State</span>
            </div>
            <div className="flex gap-1">
              {[
                { id: "all" as const, label: "ALL", color: "text-foreground/70 border-border/40" },
                { id: "early" as const, label: "EARLY", color: "text-purple-400 border-purple-500/30" },
                { id: "caution" as const, label: "CAUTION", color: "text-yellow-400 border-yellow-500/30" },
                { id: "strong" as const, label: "STRONG", color: "text-green-400 border-green-500/30" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updatePref("signalFilter", opt.id)}
                  className={`
                    flex-1 py-1.5 rounded-md text-[9px] font-mono font-bold uppercase border transition-colors
                    ${prefs.signalFilter === opt.id
                      ? `${opt.color} bg-current/10`
                      : "text-muted-foreground/30 border-border/20 hover:border-border/40"
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Age Filter */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="h-3 w-3 text-yellow-400" />
              <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground/70">Token Age</span>
            </div>
            <div className="flex gap-1">
              {[
                { id: "all" as const, label: "ALL" },
                { id: "new" as const, label: "NEW (<72h)" },
                { id: "established" as const, label: "ESTAB." },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updatePref("ageFilter", opt.id)}
                  className={`
                    flex-1 py-1.5 rounded-md text-[9px] font-mono font-bold uppercase border transition-colors
                    ${prefs.ageFilter === opt.id
                      ? "text-cyan-400 border-cyan-500/30 bg-cyan-500/5"
                      : "text-muted-foreground/30 border-border/20 hover:border-border/40"
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Filter */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="h-3 w-3 text-red-400" />
              <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground/70">Risk Level</span>
            </div>
            <div className="flex gap-1">
              {[
                { id: "all" as const, label: "ALL" },
                { id: "low" as const, label: "LOW" },
                { id: "medium" as const, label: "MED" },
                { id: "high" as const, label: "HIGH" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updatePref("riskFilter", opt.id)}
                  className={`
                    flex-1 py-1.5 rounded-md text-[9px] font-mono font-bold uppercase border transition-colors
                    ${prefs.riskFilter === opt.id
                      ? "text-cyan-400 border-cyan-500/30 bg-cyan-500/5"
                      : "text-muted-foreground/30 border-border/20 hover:border-border/40"
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS SECTION */}
      <button
        onClick={() => setSettingsOpen(!settingsOpen)}
        className="flex items-center justify-between px-3 py-2.5 border-b border-border/20 hover:bg-muted/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Display Settings</span>
        </div>
        {settingsOpen ? (
          <ChevronUp className="h-3 w-3 text-muted-foreground/40" />
        ) : (
          <ChevronDown className="h-3 w-3 text-muted-foreground/40" />
        )}
      </button>

      {settingsOpen && (
        <div className="px-3 py-3 space-y-4 border-b border-border/20">
          {/* Display Density */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Monitor className="h-3 w-3 text-muted-foreground/50" />
              <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground/70">Display Density</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => updatePref("density", "compact")}
                className={`flex-1 py-1.5 rounded-md text-[9px] font-mono font-bold uppercase border transition-colors
                  ${prefs.density === "compact"
                    ? "text-cyan-400 border-cyan-500/30 bg-cyan-500/5"
                    : "text-muted-foreground/30 border-border/20"
                  }`}
              >
                Compact
              </button>
              <button
                onClick={() => updatePref("density", "comfortable")}
                className={`flex-1 py-1.5 rounded-md text-[9px] font-mono font-bold uppercase border transition-colors
                  ${prefs.density === "comfortable"
                    ? "text-cyan-400 border-cyan-500/30 bg-cyan-500/5"
                    : "text-muted-foreground/30 border-border/20"
                  }`}
              >
                Comfortable
              </button>
            </div>
          </div>

          {/* Auto Refresh */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-1.5">
              <RefreshCw className="h-3 w-3 text-muted-foreground/50" />
              <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground/70">Auto Refresh</span>
            </div>
            <Switch
              checked={prefs.autoRefresh}
              onCheckedChange={(v) => updatePref("autoRefresh", v)}
              className="h-4 w-7 data-[state=checked]:bg-cyan-500"
            />
          </div>

          {/* Default Tab */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Layers className="h-3 w-3 text-muted-foreground/50" />
              <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground/70">Default Tab</span>
            </div>
            <div className="flex gap-1">
              {["radar", "proof", "watchlist"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => updatePref("defaultTab", tab)}
                  className={`flex-1 py-1.5 rounded-md text-[9px] font-mono font-bold uppercase border transition-colors
                    ${prefs.defaultTab === tab
                      ? "text-cyan-400 border-cyan-500/30 bg-cyan-500/5"
                      : "text-muted-foreground/30 border-border/20"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* About */}
      <div className="px-3 py-4 mt-auto">
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-md border border-border/20 bg-muted/5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-[10px] font-mono text-muted-foreground/50">SOLRAD v1.0 -- Solana Intelligence Engine</span>
        </div>
        <p className="text-[9px] font-mono text-muted-foreground/30 mt-2 px-1 text-center">
          Observational analysis only. Not financial advice.
        </p>
      </div>
    </div>
  )
}

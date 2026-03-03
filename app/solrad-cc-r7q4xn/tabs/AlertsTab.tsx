"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Shield, Bell, Zap, Plus, Trash2, Settings, Send } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { TokenDetailDrawer } from "@/components/token-detail-drawer"
import type { TokenScore } from "@/lib/types"

interface TabProps {
  adminHeaders: Record<string, string>
  password: string
}

interface AlertRule {
  id: string; name: string; enabled: boolean; createdAt: number; updatedAt: number
  alertTypes: string[]; minSeverity: "low" | "med" | "high"; minScore?: number; minConfidence?: number
  channel: "telegram"; dedupeMinutes: number
}

const ALERT_TYPES = [
  { value: "SCORE_CROSS_80", label: "Score Cross 80" },
  { value: "SCORE_JUMP_10_60M", label: "Score Jump +10" },
  { value: "LIQ_SPIKE_WITH_SCORE", label: "Liquidity Spike" },
  { value: "RISK_WORSENED", label: "Risk Worsened" },
  { value: "SIGNAL_STATE_UPGRADE", label: "Signal Upgrade" },
  { value: "SIGNAL_STATE_DOWNGRADE", label: "Signal Downgrade" },
]

interface Alert {
  id: string
  type: string; severity: "low" | "med" | "high"
  mint: string; symbol: string; name: string; ts: number; message: string
  metrics: { scorePrev?: number; scoreNow?: number; pricePrev?: number; priceNow?: number; liqPrev?: number; liqNow?: number; riskPrev?: string; riskNow?: string; fromState?: string; toState?: string; confidenceNow?: number }
}

export function AlertsTab({ password }: TabProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [timeFilter, setTimeFilter] = useState<string>("24h")
  const [selectedToken, setSelectedToken] = useState<TokenScore | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [rules, setRules] = useState<AlertRule[]>([])
  const [rulesLoading, setRulesLoading] = useState(false)
  const [rulesError, setRulesError] = useState("")
  const [newRuleName, setNewRuleName] = useState("")
  const [newRuleTypes, setNewRuleTypes] = useState<string[]>(["SCORE_CROSS_80"])
  const [newRuleMinSeverity, setNewRuleMinSeverity] = useState<"low" | "med" | "high">("med")
  const [newRuleMinScore, setNewRuleMinScore] = useState<number | undefined>(undefined)
  const [newRuleDedupeMinutes, setNewRuleDedupeMinutes] = useState(30)
  const [deliveryStatus, setDeliveryStatus] = useState<{ enabledRules: number; telegramConfigured: boolean } | null>(null)
  const [runningDelivery, setRunningDelivery] = useState(false)

  const pw = password

  const loadRules = async () => {
    setRulesLoading(true); setRulesError("")
    try {
      const res = await fetch("/api/admin/alert-rules", { headers: { "x-admin-password": pw } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json(); setRules(data.rules || [])
    } catch (err) { setRulesError(err instanceof Error ? err.message : "Failed to load rules") }
    finally { setRulesLoading(false) }
  }

  const loadDeliveryStatus = async () => {
    try {
      const res = await fetch("/api/admin/alert-delivery", { headers: { "x-admin-password": pw } })
      if (res.ok) setDeliveryStatus(await res.json())
    } catch { /* silent */ }
  }

  const createRule = async () => {
    if (!newRuleName.trim() || newRuleTypes.length === 0) return
    setRulesLoading(true)
    try {
      const res = await fetch("/api/admin/alert-rules", {
        method: "POST", headers: { "Content-Type": "application/json", "x-admin-password": pw },
        body: JSON.stringify({ name: newRuleName.trim(), enabled: false, alertTypes: newRuleTypes, minSeverity: newRuleMinSeverity, minScore: newRuleMinScore || undefined, channel: "telegram", dedupeMinutes: newRuleDedupeMinutes }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await loadRules(); setNewRuleName(""); setNewRuleTypes(["SCORE_CROSS_80"]); setNewRuleMinSeverity("med"); setNewRuleMinScore(undefined); setNewRuleDedupeMinutes(30)
    } catch (err) { setRulesError(err instanceof Error ? err.message : "Failed to create rule") }
    finally { setRulesLoading(false) }
  }

  const toggleRuleEnabled = async (ruleId: string, enabled: boolean) => {
    try { await fetch("/api/admin/alert-rules", { method: "PATCH", headers: { "Content-Type": "application/json", "x-admin-password": pw }, body: JSON.stringify({ id: ruleId, enabled }) }); setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, enabled } : r))); loadDeliveryStatus() } catch { /* */ }
  }

  const deleteRule = async (ruleId: string) => {
    if (!confirm("Delete this alert rule?")) return
    try { await fetch(`/api/admin/alert-rules?id=${ruleId}`, { method: "DELETE", headers: { "x-admin-password": pw } }); setRules((prev) => prev.filter((r) => r.id !== ruleId)); loadDeliveryStatus() } catch { /* */ }
  }

  const runDeliveryJob = async () => {
    setRunningDelivery(true)
    try {
      const res = await fetch("/api/admin/alert-delivery", { method: "POST", headers: { "x-admin-password": pw } })
      const data = await res.json()
      if (data.success) alert(`Delivery job complete: ${data.stats.delivered} alerts sent`)
      else alert(`Delivery failed: ${data.error}`)
    } catch { alert("Failed to run delivery job") }
    finally { setRunningDelivery(false) }
  }

  const toggleAlertType = (type: string) => setNewRuleTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type])

  useEffect(() => { loadAlerts(); loadRules(); loadDeliveryStatus() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!loading) { const iv = setInterval(() => loadAlerts(true), 60000); return () => clearInterval(iv) } }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let filtered = [...alerts]
    if (typeFilter !== "all") filtered = filtered.filter((a) => a.type === typeFilter)
    if (severityFilter !== "all") filtered = filtered.filter((a) => a.severity === severityFilter)
    const timeWindows: Record<string, number> = { "1h": 3600000, "6h": 21600000, "24h": 86400000 }
    const w = timeWindows[timeFilter]
    if (w) filtered = filtered.filter((a) => Date.now() - a.ts <= w)
    setFilteredAlerts(filtered)
  }, [alerts, typeFilter, severityFilter, timeFilter])

  const loadAlerts = async (silent = false) => {
    if (!silent) setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/alerts", { headers: { "x-admin-password": pw } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json(); setAlerts(data.alerts); setLastUpdated(data.updatedAt)
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load alerts") }
    finally { if (!silent) setLoading(false) }
  }

  const handleRowClick = (alert: Alert) => {
    const token: TokenScore = { address: alert.mint, symbol: alert.symbol, name: alert.name, chain: "solana", priceUsd: alert.metrics.priceNow || 0, totalScore: alert.metrics.scoreNow || 0, riskLabel: alert.metrics.riskNow || "MEDIUM RISK", volume24h: 0, liquidity: alert.metrics.liqNow || 0, fdv: 0, trendingRank: 0, scoreBreakdown: { liquidityScore: 0, volumeScore: 0, activityScore: 0, ageScore: 0, healthScore: 0, boostScore: 0 } }
    setSelectedToken(token); setDrawerOpen(true)
  }

  const getSeverityColor = (s: string) => s === "high" ? "bg-red-500/15 text-red-400 border-red-500/40" : s === "med" ? "bg-amber-500/15 text-amber-400 border-amber-500/40" : "bg-blue-500/15 text-blue-400 border-blue-500/40"
  const getTypeIcon = (t: string) => { switch (t) { case "SCORE_CROSS_80": case "SCORE_JUMP_10_60M": return <TrendingUp className="h-4 w-4" />; case "LIQ_SPIKE_WITH_SCORE": return <Bell className="h-4 w-4" />; case "RISK_WORSENED": return <Shield className="h-4 w-4" />; case "SIGNAL_STATE_UPGRADE": return <Zap className="h-4 w-4 text-green-400" />; case "SIGNAL_STATE_DOWNGRADE": return <TrendingDown className="h-4 w-4 text-red-400" />; default: return <AlertTriangle className="h-4 w-4" /> } }
  const fmtTs = (ts: number) => { const d = Date.now() - ts; const m = Math.floor(d / 60000); const h = Math.floor(d / 3600000); if (m < 60) return `${m}m ago`; if (h < 24) return `${h}h ago`; return new Date(ts).toLocaleDateString() }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-mono font-bold flex items-center gap-2 text-zinc-200"><Bell className="h-5 w-5" /> {"◈"} ALERT FEED</h2>
          <p className="text-xs font-mono text-zinc-600 mt-1">Real-time alerts from snapshot history</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && <p className="text-xs text-zinc-600 font-mono">Updated {fmtTs(lastUpdated)}</p>}
          <Button variant="outline" size="sm" onClick={() => loadAlerts()} disabled={loading} className="border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wide text-zinc-600">Alert Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-300"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="SCORE_CROSS_80">Score Cross 80</SelectItem><SelectItem value="SCORE_JUMP_10_60M">Score Jump +10</SelectItem><SelectItem value="LIQ_SPIKE_WITH_SCORE">Liquidity Spike</SelectItem><SelectItem value="RISK_WORSENED">Risk Worsened</SelectItem><SelectItem value="SIGNAL_STATE_UPGRADE">Signal Upgrade</SelectItem><SelectItem value="SIGNAL_STATE_DOWNGRADE">Signal Downgrade</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wide text-zinc-600">Severity</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}><SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-300"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Severities</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="med">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wide text-zinc-600">Time Range</label>
              <Select value={timeFilter} onValueChange={setTimeFilter}><SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-300"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1h">Last 1 Hour</SelectItem><SelectItem value="6h">Last 6 Hours</SelectItem><SelectItem value="24h">Last 24 Hours</SelectItem></SelectContent></Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[{ l: "Total Alerts", v: filteredAlerts.length, c: "text-zinc-200" }, { l: "High Severity", v: filteredAlerts.filter((a) => a.severity === "high").length, c: "text-red-400" }, { l: "Medium Severity", v: filteredAlerts.filter((a) => a.severity === "med").length, c: "text-amber-400" }, { l: "Low Severity", v: filteredAlerts.filter((a) => a.severity === "low").length, c: "text-blue-400" }].map(({ l, v, c }) => (
          <Card key={l} className="bg-zinc-900 border-zinc-800"><CardHeader className="pb-2"><CardDescription className="text-xs font-mono text-zinc-600">{l}</CardDescription><CardTitle className={`text-2xl font-mono ${c}`}>{v}</CardTitle></CardHeader></Card>
        ))}
      </div>

      {/* Alerts Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">{error}</div>}
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12"><Bell className="h-12 w-12 mx-auto mb-3 text-zinc-700" /><p className="text-zinc-600 font-mono">No alerts triggered yet</p></div>
          ) : (
            <div className="border border-zinc-800 overflow-hidden">
              <Table>
                <TableHeader><TableRow className="bg-zinc-950 border-zinc-800"><TableHead className="w-12"></TableHead><TableHead className="text-zinc-500 font-mono">Token</TableHead><TableHead className="text-zinc-500 font-mono">Type</TableHead><TableHead className="text-zinc-500 font-mono">Severity</TableHead><TableHead className="text-zinc-500 font-mono">Message</TableHead><TableHead className="text-right text-zinc-500 font-mono">Time</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow key={alert.id} onClick={() => handleRowClick(alert)} className="cursor-pointer hover:bg-zinc-800/50 transition-colors border-zinc-800">
                      <TableCell>{getTypeIcon(alert.type)}</TableCell>
                      <TableCell><div className="font-semibold text-zinc-200 font-mono">{alert.symbol}</div><div className="text-xs text-zinc-600 font-mono">{alert.mint.slice(0, 4)}...{alert.mint.slice(-4)}</div></TableCell>
                      <TableCell><span className="text-xs font-mono text-zinc-400">{alert.type.replace(/_/g, " ")}</span></TableCell>
                      <TableCell><Badge variant="outline" className={`font-mono ${getSeverityColor(alert.severity)}`}>{alert.severity.toUpperCase()}</Badge></TableCell>
                      <TableCell className="max-w-md"><p className="text-sm truncate text-zinc-400 font-mono">{alert.message}</p></TableCell>
                      <TableCell className="text-right text-xs font-mono text-zinc-600">{fmtTs(alert.ts)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Rules */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle className="flex items-center gap-2 text-zinc-200 font-mono"><Settings className="h-5 w-5" /> Alert Rules</CardTitle><CardDescription className="font-mono text-zinc-600">Configure which alerts to deliver to Telegram</CardDescription></div>
          <div className="flex items-center gap-2">
            {deliveryStatus && <Badge variant="outline" className={`font-mono ${deliveryStatus.telegramConfigured ? "text-green-400 border-green-400/40" : "text-red-400 border-red-400/40"}`}>{deliveryStatus.telegramConfigured ? "Telegram OK" : "Telegram Not Configured"}</Badge>}
            <Button variant="outline" size="sm" onClick={runDeliveryJob} disabled={runningDelivery || rules.filter((r) => r.enabled).length === 0} className="border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
              <Send className={`h-4 w-4 mr-2 ${runningDelivery ? "animate-pulse" : ""}`} /> Run Delivery
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {rulesError && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">{rulesError}</div>}
          {rules.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-mono text-zinc-600">Active Rules</h4>
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-3 border border-zinc-800 bg-zinc-950">
                  <div className="flex items-center gap-4">
                    <Switch checked={rule.enabled} onCheckedChange={(checked) => toggleRuleEnabled(rule.id, checked)} />
                    <div><p className="font-mono text-zinc-300">{rule.name}</p><p className="text-xs text-zinc-600 font-mono">{rule.alertTypes.map((t) => t.replace(/_/g, " ")).join(", ")} | Min: {rule.minSeverity.toUpperCase()} | Dedupe: {rule.dedupeMinutes}m{rule.minScore ? ` | Score >= ${rule.minScore}` : ""}</p></div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteRule(rule.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <h4 className="text-sm font-mono text-zinc-600">Create New Rule</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-xs font-mono uppercase tracking-wide text-zinc-600">Rule Name</label><Input placeholder="e.g., High Score Alerts" value={newRuleName} onChange={(e) => setNewRuleName(e.target.value)} className="bg-zinc-950 border-zinc-800 text-zinc-300 font-mono" /></div>
              <div className="space-y-2"><label className="text-xs font-mono uppercase tracking-wide text-zinc-600">Min Severity</label><Select value={newRuleMinSeverity} onValueChange={(v: "low" | "med" | "high") => setNewRuleMinSeverity(v)}><SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-300"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low+</SelectItem><SelectItem value="med">Medium+</SelectItem><SelectItem value="high">High Only</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><label className="text-xs font-mono uppercase tracking-wide text-zinc-600">Min Score (optional)</label><Input type="number" placeholder="e.g., 70" value={newRuleMinScore ?? ""} onChange={(e) => setNewRuleMinScore(e.target.value ? Number(e.target.value) : undefined)} className="bg-zinc-950 border-zinc-800 text-zinc-300 font-mono" /></div>
              <div className="space-y-2"><label className="text-xs font-mono uppercase tracking-wide text-zinc-600">Dedupe (minutes)</label><Input type="number" value={newRuleDedupeMinutes} onChange={(e) => setNewRuleDedupeMinutes(Number(e.target.value) || 30)} className="bg-zinc-950 border-zinc-800 text-zinc-300 font-mono" /></div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wide text-zinc-600">Alert Types</label>
              <div className="flex flex-wrap gap-2">
                {ALERT_TYPES.map((type) => (
                  <label key={type.value} className="flex items-center gap-2 px-3 py-2 border border-zinc-800 cursor-pointer hover:bg-zinc-800/50 transition-colors">
                    <Checkbox checked={newRuleTypes.includes(type.value)} onCheckedChange={() => toggleAlertType(type.value)} />
                    <span className="text-sm font-mono text-zinc-400">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={createRule} disabled={rulesLoading || !newRuleName.trim() || newRuleTypes.length === 0} className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              <Plus className="h-4 w-4 mr-2" /> Create Rule
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedToken && <TokenDetailDrawer token={selectedToken} open={drawerOpen} onOpenChange={setDrawerOpen} />}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Shield, Bell, Zap, Plus, Trash2, Play, Settings, Send } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TokenDetailDrawer } from "@/components/token-detail-drawer"
import type { TokenScore } from "@/lib/types"

// Alert rule types
interface AlertRule {
  id: string
  name: string
  enabled: boolean
  createdAt: number
  updatedAt: number
  alertTypes: string[]
  minSeverity: "low" | "med" | "high"
  minScore?: number
  minConfidence?: number
  channel: "telegram"
  dedupeMinutes: number
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
  type: "SCORE_CROSS_80" | "SCORE_JUMP_10_60M" | "LIQ_SPIKE_WITH_SCORE" | "RISK_WORSENED" | "SIGNAL_STATE_UPGRADE" | "SIGNAL_STATE_DOWNGRADE"
  severity: "low" | "med" | "high"
  mint: string
  symbol: string
  name: string
  ts: number
  message: string
  metrics: {
    scorePrev?: number
    scoreNow?: number
    pricePrev?: number
    priceNow?: number
    liqPrev?: number
    liqNow?: number
    riskPrev?: string
    riskNow?: string
    fromState?: string
    toState?: string
    confidenceNow?: number
  }
}

interface AlertsResponse {
  updatedAt: number
  alerts: Alert[]
}

export default function AdminAlertsPage() {
  const [password, setPassword] = useState("")
  const [authenticated, setAuthenticated] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [error, setError] = useState("")
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [timeFilter, setTimeFilter] = useState<string>("24h")
  
  // Drawer state
  const [selectedToken, setSelectedToken] = useState<TokenScore | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  
  // Alert Rules state
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

  // Function declarations
  const loadRules = async () => {
    setRulesLoading(true)
    setRulesError("")
    try {
      const storedPassword = sessionStorage.getItem("admin_alerts_pw") || ""
      const res = await fetch("/api/admin/alert-rules", {
        headers: { "x-admin-password": storedPassword },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setRules(data.rules || [])
    } catch (err) {
      setRulesError(err instanceof Error ? err.message : "Failed to load rules")
    } finally {
      setRulesLoading(false)
    }
  }

  const loadDeliveryStatus = async () => {
    try {
      const storedPassword = sessionStorage.getItem("admin_alerts_pw") || ""
      const res = await fetch("/api/admin/alert-delivery", {
        headers: { "x-admin-password": storedPassword },
      })
      if (res.ok) {
        const data = await res.json()
        setDeliveryStatus(data)
      }
    } catch {
      // Silent fail for status
    }
  }

  const createRule = async () => {
    if (!newRuleName.trim() || newRuleTypes.length === 0) return
    setRulesLoading(true)
    try {
      const storedPassword = sessionStorage.getItem("admin_alerts_pw") || ""
      const res = await fetch("/api/admin/alert-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": storedPassword,
        },
        body: JSON.stringify({
          name: newRuleName.trim(),
          enabled: false,
          alertTypes: newRuleTypes,
          minSeverity: newRuleMinSeverity,
          minScore: newRuleMinScore || undefined,
          channel: "telegram",
          dedupeMinutes: newRuleDedupeMinutes,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await loadRules()
      setNewRuleName("")
      setNewRuleTypes(["SCORE_CROSS_80"])
      setNewRuleMinSeverity("med")
      setNewRuleMinScore(undefined)
      setNewRuleDedupeMinutes(30)
    } catch (err) {
      setRulesError(err instanceof Error ? err.message : "Failed to create rule")
    } finally {
      setRulesLoading(false)
    }
  }

  const toggleRuleEnabled = async (ruleId: string, enabled: boolean) => {
    try {
      const storedPassword = sessionStorage.getItem("admin_alerts_pw") || ""
      await fetch("/api/admin/alert-rules", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": storedPassword,
        },
        body: JSON.stringify({ id: ruleId, enabled }),
      })
      setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, enabled } : r)))
      loadDeliveryStatus()
    } catch {
      // Silent fail
    }
  }

  const deleteRule = async (ruleId: string) => {
    if (!confirm("Delete this alert rule?")) return
    try {
      const storedPassword = sessionStorage.getItem("admin_alerts_pw") || ""
      await fetch(`/api/admin/alert-rules?id=${ruleId}`, {
        method: "DELETE",
        headers: { "x-admin-password": storedPassword },
      })
      setRules((prev) => prev.filter((r) => r.id !== ruleId))
      loadDeliveryStatus()
    } catch {
      // Silent fail
    }
  }

  const runDeliveryJob = async () => {
    setRunningDelivery(true)
    try {
      const storedPassword = sessionStorage.getItem("admin_alerts_pw") || ""
      const res = await fetch("/api/admin/alert-delivery", {
        method: "POST",
        headers: { "x-admin-password": storedPassword },
      })
      const data = await res.json()
      if (data.success) {
        alert(`Delivery job complete: ${data.stats.delivered} alerts sent`)
      } else {
        alert(`Delivery failed: ${data.error}`)
      }
    } catch (err) {
      alert("Failed to run delivery job")
    } finally {
      setRunningDelivery(false)
    }
  }

  const toggleAlertType = (type: string) => {
    setNewRuleTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  // Check auth on mount
  useEffect(() => {
    const savedAuth = sessionStorage.getItem("admin_alerts_auth")
    if (savedAuth === "true") {
      setAuthenticated(true)
      loadAlerts()
      loadRules()
      loadDeliveryStatus()
    }
  }, [])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!authenticated) return

    const interval = setInterval(() => {
      loadAlerts(true) // Silent refresh
    }, 60000)

    return () => clearInterval(interval)
  }, [authenticated])

  // Apply filters whenever alerts or filter state changes
  useEffect(() => {
    let filtered = [...alerts]

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((a) => a.type === typeFilter)
    }

    // Severity filter
    if (severityFilter !== "all") {
      filtered = filtered.filter((a) => a.severity === severityFilter)
    }

    // Time filter
    const now = Date.now()
    const timeWindows: Record<string, number> = {
      "1h": 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
    }
    const window = timeWindows[timeFilter]
    if (window) {
      filtered = filtered.filter((a) => now - a.ts <= window)
    }

    setFilteredAlerts(filtered)
  }, [alerts, typeFilter, severityFilter, timeFilter])

  const handleAuth = async () => {
    setLoading(true)
    setError("")

    try {
      // Trim password before sending to avoid whitespace issues
      const trimmedPassword = password.trim()
      
      const res = await fetch("/api/ops/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: trimmedPassword }),
      })

      if (res.ok) {
        sessionStorage.setItem("admin_alerts_auth", "true")
        sessionStorage.setItem("admin_alerts_pw", trimmedPassword)
        setAuthenticated(true)
        setPassword("")
        await loadAlerts()
      } else {
        setError("Invalid password")
      }
    } catch (err) {
      setError("Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  const loadAlerts = async (silent = false) => {
    if (!silent) setLoading(true)
    setError("")

    try {
      const storedPassword = sessionStorage.getItem("admin_alerts_pw") || password
      const res = await fetch("/api/admin/alerts", {
        headers: {
          "x-admin-password": storedPassword,
        },
      })

      if (!res.ok) {
        if (res.status === 401) {
          setError("Session expired. Please re-authenticate.")
          setAuthenticated(false)
          sessionStorage.removeItem("admin_alerts_auth")
          sessionStorage.removeItem("admin_alerts_pw")
          return
        }
        throw new Error(`HTTP ${res.status}`)
      }

      const data: AlertsResponse = await res.json()
      setAlerts(data.alerts)
      setLastUpdated(data.updatedAt)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load alerts")
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleRowClick = (alert: Alert) => {
    // Create a minimal TokenScore object for the drawer
    const token: TokenScore = {
      address: alert.mint,
      symbol: alert.symbol,
      name: alert.name,
      chain: "solana",
      priceUsd: alert.metrics.priceNow || 0,
      totalScore: alert.metrics.scoreNow || 0,
      riskLabel: alert.metrics.riskNow || "MEDIUM RISK",
      volume24h: 0,
      liquidity: alert.metrics.liqNow || 0,
      fdv: 0,
      trendingRank: 0,
      scoreBreakdown: {
        liquidityScore: 0,
        volumeScore: 0,
        activityScore: 0,
        ageScore: 0,
        healthScore: 0,
        boostScore: 0,
      },
    }

    setSelectedToken(token)
    setDrawerOpen(true)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500/15 text-red-400 border-red-500/40"
      case "med":
        return "bg-yellow-500/15 text-yellow-400 border-yellow-500/40"
      case "low":
        return "bg-blue-500/15 text-blue-400 border-blue-500/40"
      default:
        return "bg-muted/50 text-muted-foreground"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SCORE_CROSS_80":
        return <TrendingUp className="h-4 w-4" />
      case "SCORE_JUMP_10_60M":
        return <TrendingUp className="h-4 w-4" />
      case "LIQ_SPIKE_WITH_SCORE":
        return <Bell className="h-4 w-4" />
      case "RISK_WORSENED":
        return <Shield className="h-4 w-4" />
      case "SIGNAL_STATE_UPGRADE":
        return <Zap className="h-4 w-4 text-green-400" />
      case "SIGNAL_STATE_DOWNGRADE":
        return <TrendingDown className="h-4 w-4 text-red-400" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const formatTimestamp = (ts: number) => {
    const diff = Date.now() - ts
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return new Date(ts).toLocaleDateString()
  }

  // Auth gate
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Admin Alerts
            </CardTitle>
            <CardDescription>Enter admin password to view alerts feed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button onClick={handleAuth} disabled={loading || !password} className="w-full">
              {loading ? "Authenticating..." : "Login"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" />
              ALERT FEED
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time alerts from snapshot history
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Updated {formatTimestamp(lastUpdated)}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadAlerts()}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Alert Type
                </label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="SCORE_CROSS_80">Score Cross 80</SelectItem>
                    <SelectItem value="SCORE_JUMP_10_60M">Score Jump +10</SelectItem>
                    <SelectItem value="LIQ_SPIKE_WITH_SCORE">Liquidity Spike</SelectItem>
                    <SelectItem value="RISK_WORSENED">Risk Worsened</SelectItem>
                    <SelectItem value="SIGNAL_STATE_UPGRADE">Signal Upgrade</SelectItem>
                    <SelectItem value="SIGNAL_STATE_DOWNGRADE">Signal Downgrade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Severity
                </label>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="med">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Time Range
                </label>
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Last 1 Hour</SelectItem>
                    <SelectItem value="6h">Last 6 Hours</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Total Alerts</CardDescription>
              <CardTitle className="text-2xl font-mono">{filteredAlerts.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">High Severity</CardDescription>
              <CardTitle className="text-2xl font-mono text-red-400">
                {filteredAlerts.filter((a) => a.severity === "high").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Medium Severity</CardDescription>
              <CardTitle className="text-2xl font-mono text-yellow-400">
                {filteredAlerts.filter((a) => a.severity === "med").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Low Severity</CardDescription>
              <CardTitle className="text-2xl font-mono text-blue-400">
                {filteredAlerts.filter((a) => a.severity === "low").length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Alerts Table */}
        <Card>
          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No alerts triggered yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Alerts will appear when snapshot history detects meaningful changes
                </p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlerts.map((alert) => (
                      <TableRow
                        key={alert.id}
                        onClick={() => handleRowClick(alert)}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <TableCell>{getTypeIcon(alert.type)}</TableCell>
                        <TableCell>
                          <div className="font-semibold">{alert.symbol}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {alert.mint.slice(0, 4)}...{alert.mint.slice(-4)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono">
                            {alert.type.replace(/_/g, " ")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm truncate">{alert.message}</p>
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-muted-foreground">
                          {formatTimestamp(alert.ts)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alert Rules Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Alert Rules
              </CardTitle>
              <CardDescription>
                Configure which alerts to deliver to Telegram
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {deliveryStatus && (
                <Badge variant="outline" className={deliveryStatus.telegramConfigured ? "text-green-400 border-green-400/40" : "text-red-400 border-red-400/40"}>
                  {deliveryStatus.telegramConfigured ? "Telegram OK" : "Telegram Not Configured"}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={runDeliveryJob}
                disabled={runningDelivery || rules.filter((r) => r.enabled).length === 0}
              >
                <Send className={`h-4 w-4 mr-2 ${runningDelivery ? "animate-pulse" : ""}`} />
                Run Delivery
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {rulesError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {rulesError}
              </div>
            )}

            {/* Existing Rules */}
            {rules.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Active Rules</h4>
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
                  >
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => toggleRuleEnabled(rule.id, checked)}
                      />
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {rule.alertTypes.map((t) => t.replace(/_/g, " ")).join(", ")} | Min: {rule.minSeverity.toUpperCase()} | Dedupe: {rule.dedupeMinutes}m
                          {rule.minScore && ` | Score >= ${rule.minScore}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRule(rule.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Create New Rule */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Create New Rule</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Rule Name
                  </label>
                  <Input
                    placeholder="e.g., High Score Alerts"
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Min Severity
                  </label>
                  <Select value={newRuleMinSeverity} onValueChange={(v: "low" | "med" | "high") => setNewRuleMinSeverity(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low+</SelectItem>
                      <SelectItem value="med">Medium+</SelectItem>
                      <SelectItem value="high">High Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Min Score (optional)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g., 70"
                    value={newRuleMinScore ?? ""}
                    onChange={(e) => setNewRuleMinScore(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Dedupe (minutes)
                  </label>
                  <Input
                    type="number"
                    value={newRuleDedupeMinutes}
                    onChange={(e) => setNewRuleDedupeMinutes(Number(e.target.value) || 30)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Alert Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALERT_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={newRuleTypes.includes(type.value)}
                        onCheckedChange={() => toggleAlertType(type.value)}
                      />
                      <span className="text-sm">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                onClick={createRule}
                disabled={rulesLoading || !newRuleName.trim() || newRuleTypes.length === 0}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <p className="text-xs text-center text-muted-foreground/60">
          Alerts are automated observations from snapshot history. Not financial advice.
        </p>
      </div>

      {/* Token Detail Drawer */}
      {selectedToken && (
        <TokenDetailDrawer
          token={selectedToken}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
      )}
    </div>
  )
}

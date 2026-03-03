"use client"

import { useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  RefreshCw,
  Database,
  ShieldAlert,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Save,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────
interface SubcallResult {
  id: string
  url: string
  status: number
  ok: boolean
  durationMs: number
  internalAuthHeader: string | null
  bodyPreview: string
  error: string | null
}

interface DiagReport {
  ok: boolean
  nowISO: string
  totalDurationMs: number
  envPresence: Record<string, unknown>
  results: SubcallResult[]
}

interface KvKeyResult {
  key: string
  exists: boolean
  value: string | null
  type: string
}

interface KvScanReport {
  ok: boolean
  nowISO: string
  durationMs: number
  keyCount: number
  existingCount: number
  results: KvKeyResult[]
}

// ── Helpers ────────────────────────────────────────────────
const LS_KEY = "solrad:ops_password"

function getStoredPassword(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(LS_KEY) || ""
}

function statusColor(status: number): string {
  if (status === 0) return "text-muted-foreground"
  if (status >= 200 && status < 300) return "text-success"
  if (status >= 400) return "text-destructive"
  return "text-accent"
}

function statusBadgeVariant(status: number): "default" | "destructive" | "secondary" | "outline" {
  if (status >= 200 && status < 300) return "default"
  if (status >= 400) return "destructive"
  return "secondary"
}

// ── Components ─────────────────────────────────────────────

function CollapsibleJson({ data, label }: { data: unknown; label: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(data, null, 2)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [json])

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {label}
      </button>
      {open && (
        <div className="relative mt-2">
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1 rounded bg-muted hover:bg-muted/80 transition-colors"
            title="Copy JSON"
          >
            {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
          </button>
          <pre className="p-3 rounded-md bg-muted text-xs font-mono overflow-x-auto max-h-80 text-foreground">
            {json}
          </pre>
        </div>
      )}
    </div>
  )
}

function SubcallCard({ result }: { result: SubcallResult }) {
  const [bodyOpen, setBodyOpen] = useState(false)
  const isFail = !result.ok || result.status >= 400

  return (
    <div className={`rounded-lg border p-4 ${isFail ? "border-destructive/50 bg-destructive/5" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-foreground">{result.id}</span>
          <Badge variant={statusBadgeVariant(result.status)}>
            {result.status || "ERR"}
          </Badge>
          {result.internalAuthHeader && (
            <Badge variant="outline" className="text-xs">
              x-internal-auth: {result.internalAuthHeader}
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground font-mono">{result.durationMs}ms</span>
      </div>

      <p className="mt-1 text-xs text-muted-foreground font-mono break-all">{result.url}</p>

      {result.error && (
        <p className="mt-2 text-xs text-destructive font-mono">Error: {result.error}</p>
      )}

      {result.bodyPreview && (
        <div className="mt-2">
          <button
            onClick={() => setBodyOpen(!bodyOpen)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {bodyOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Response body preview
          </button>
          {bodyOpen && (
            <pre className="mt-1 p-2 rounded bg-muted text-xs font-mono overflow-x-auto max-h-48 text-foreground">
              {result.bodyPreview}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

function KvResultRow({ result }: { result: KvKeyResult }) {
  return (
    <tr className={`border-b border-border ${!result.exists ? "opacity-50" : ""}`}>
      <td className="py-2 px-3 font-mono text-xs text-foreground">{result.key}</td>
      <td className="py-2 px-3">
        {result.exists ? (
          <Badge variant="default" className="text-xs">exists</Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">missing</Badge>
        )}
      </td>
      <td className="py-2 px-3 text-xs text-muted-foreground font-mono">{result.type}</td>
      <td className="py-2 px-3 text-xs font-mono text-foreground max-w-md break-all">
        {result.value ? (
          <span className="line-clamp-3">{result.value}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
    </tr>
  )
}

// ── Main Page ──────────────────────────────────────────────

export default function AdminToolsPage() {
  const [password, setPassword] = useState(getStoredPassword)
  const [showPassword, setShowPassword] = useState(false)
  const [saved, setSaved] = useState(false)

  const [diagLoading, setDiagLoading] = useState(false)
  const [diagReport, setDiagReport] = useState<DiagReport | null>(null)
  const [diagError, setDiagError] = useState<string | null>(null)

  const [kvLoading, setKvLoading] = useState(false)
  const [kvReport, setKvReport] = useState<KvScanReport | null>(null)
  const [kvError, setKvError] = useState<string | null>(null)

  const handleSave = useCallback(() => {
    localStorage.setItem(LS_KEY, password)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [password])

  const makeHeaders = useCallback((): Record<string, string> => {
    const h: Record<string, string> = {}
    const pw = localStorage.getItem(LS_KEY)
    if (pw) h["x-ops-password"] = pw
    return h
  }, [])

  const runDiag = useCallback(async () => {
    setDiagLoading(true)
    setDiagError(null)
    setDiagReport(null)
    try {
      const res = await fetch("/api/admin/tools/diag", { headers: makeHeaders(), cache: "no-store" })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        setDiagError(`HTTP ${res.status}: ${text.slice(0, 300)}`)
        return
      }
      const data = await res.json()
      setDiagReport(data)
    } catch (err) {
      setDiagError(err instanceof Error ? err.message : String(err))
    } finally {
      setDiagLoading(false)
    }
  }, [makeHeaders])

  const runKvScan = useCallback(async () => {
    setKvLoading(true)
    setKvError(null)
    setKvReport(null)
    try {
      const res = await fetch("/api/admin/tools/kv-scan", { headers: makeHeaders(), cache: "no-store" })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        setKvError(`HTTP ${res.status}: ${text.slice(0, 300)}`)
        return
      }
      const data = await res.json()
      setKvReport(data)
    } catch (err) {
      setKvError(err instanceof Error ? err.message : String(err))
    } finally {
      setKvLoading(false)
    }
  }, [makeHeaders])

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">SOLRAD Admin Tools</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Proof Engine diagnostics and KV inspection
          </p>
        </div>

        {/* Auth Card */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <ShieldAlert className="h-4 w-4 text-accent" />
              Authentication
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Set your ops password. All requests from this page use the <code className="text-xs bg-muted px-1 py-0.5 rounded text-foreground">x-ops-password</code> header.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter OPS_PASSWORD"
                  className="pr-10 font-mono text-sm bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button onClick={handleSave} variant="secondary" size="sm" className="gap-1.5">
                {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                {saved ? "Saved" : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={runDiag}
            disabled={diagLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${diagLoading ? "animate-spin" : ""}`} />
            {diagLoading ? "Running..." : "Run Diagnostics"}
          </Button>
          <Button
            onClick={runKvScan}
            disabled={kvLoading}
            variant="secondary"
            className="gap-2"
          >
            <Database className={`h-4 w-4 ${kvLoading ? "animate-spin" : ""}`} />
            {kvLoading ? "Scanning..." : "KV Scan"}
          </Button>
        </div>

        {/* Diagnostics Results */}
        {diagError && (
          <Card className="bg-card border-destructive/50">
            <CardContent className="pt-4">
              <p className="text-sm text-destructive font-mono">{diagError}</p>
            </CardContent>
          </Card>
        )}

        {diagReport && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">Diagnostic Results</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={diagReport.ok ? "default" : "destructive"}>
                    {diagReport.ok ? "ALL OK" : "FAILURES"}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">{diagReport.totalDurationMs}ms</span>
                </div>
              </div>
              <CardDescription className="text-muted-foreground">{diagReport.nowISO}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Env presence */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(diagReport.envPresence).map(([k, v]) => (
                  <Badge key={k} variant={v ? "default" : "secondary"} className="text-xs font-mono">
                    {k}: {v ? (typeof v === "string" ? v : "set") : "unset"}
                  </Badge>
                ))}
              </div>

              {/* Subcall results */}
              <div className="space-y-2">
                {diagReport.results.map((r) => (
                  <SubcallCard key={r.id} result={r} />
                ))}
              </div>

              <CollapsibleJson data={diagReport} label="Raw JSON" />
            </CardContent>
          </Card>
        )}

        {/* KV Scan Results */}
        {kvError && (
          <Card className="bg-card border-destructive/50">
            <CardContent className="pt-4">
              <p className="text-sm text-destructive font-mono">{kvError}</p>
            </CardContent>
          </Card>
        )}

        {kvReport && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">KV Scan Results</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">
                    {kvReport.existingCount}/{kvReport.keyCount} keys
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">{kvReport.durationMs}ms</span>
                </div>
              </div>
              <CardDescription className="text-muted-foreground">{kvReport.nowISO}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 px-3 text-xs font-semibold text-muted-foreground">Key</th>
                      <th className="py-2 px-3 text-xs font-semibold text-muted-foreground">Status</th>
                      <th className="py-2 px-3 text-xs font-semibold text-muted-foreground">Type</th>
                      <th className="py-2 px-3 text-xs font-semibold text-muted-foreground">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kvReport.results.map((r) => (
                      <KvResultRow key={r.key} result={r} />
                    ))}
                  </tbody>
                </table>
              </div>

              <CollapsibleJson data={kvReport} label="Raw JSON" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle2, 
  XCircle, 
  Activity, 
  ChevronDown, 
  ChevronRight,
  ExternalLink,
  Clock,
  AlertTriangle
} from "lucide-react"

interface QATestResult {
  testName: string
  pass: boolean
  reason?: string
  tokenSymbol?: string
  tokenMint?: string
  dexUrl?: string
}

interface QASummary {
  totalTests: number
  passed: number
  failed: number
  timestamp: string
  duration: number
}

interface QAReport {
  summary: QASummary
  results: QATestResult[]
  columnChecks: {
    newEarly: { pass: boolean; failures: string[] }
    active: { pass: boolean; failures: string[] }
    trending: { pass: boolean; failures: string[] }
  }
}

export default function AdminQAPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [running, setRunning] = useState(false)
  const [report, setReport] = useState<QAReport | null>(null)
  const [error, setError] = useState("")
  const [expandedFailures, setExpandedFailures] = useState<Set<string>>(new Set())

  // Check session storage
  useEffect(() => {
    const savedPassword = sessionStorage.getItem("admin_qa_password")
    if (savedPassword) {
      setPassword(savedPassword)
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password) {
      sessionStorage.setItem("admin_qa_password", password)
      setIsAuthenticated(true)
      setError("")
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("admin_qa_password")
    setIsAuthenticated(false)
    setPassword("")
    setReport(null)
  }

  const runQA = async () => {
    setRunning(true)
    setError("")
    setReport(null)

    try {
      const response = await fetch("/api/admin/qa/run", {
        method: "POST",
        headers: {
          "x-admin-password": password,
        },
      })

      if (!response.ok) {
        throw new Error(`QA failed: ${response.status}`)
      }

      const data = await response.json()
      setReport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "QA run failed")
    } finally {
      setRunning(false)
    }
  }

  const toggleExpanded = (testName: string) => {
    const newExpanded = new Set(expandedFailures)
    if (newExpanded.has(testName)) {
      newExpanded.delete(testName)
    } else {
      newExpanded.add(testName)
    }
    setExpandedFailures(newExpanded)
  }

  // Group results by pass/fail
  const failedResults = report?.results.filter(r => !r.pass) || []
  const passedResults = report?.results.filter(r => r.pass) || []

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold">SOLRAD QA System</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter admin password to run data quality checks
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full">
              Access QA Panel
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-tight">SOLRAD QA System</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Comprehensive data quality verification for production
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={runQA}
              disabled={running}
              size="lg"
              className="min-w-[140px]"
            >
              {running ? (
                <>
                  <Activity className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                "Run QA"
              )}
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="p-4 bg-red-500/10 border-red-500/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <div className="font-semibold text-red-500">QA Run Failed</div>
                <div className="text-sm text-red-500/80">{error}</div>
              </div>
            </div>
          </Card>
        )}

        {/* Summary */}
        {report && (
          <Card className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Tests</div>
                <div className="text-2xl font-bold">{report.summary.totalTests}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Passed</div>
                <div className="text-2xl font-bold text-green-500">
                  {report.summary.passed}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Failed</div>
                <div className="text-2xl font-bold text-red-500">
                  {report.summary.failed}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Duration</div>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {(report.summary.duration / 1000).toFixed(1)}s
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Status</div>
                <Badge
                  variant={report.summary.failed === 0 ? "default" : "destructive"}
                  className="text-base font-bold px-3 py-1"
                >
                  {report.summary.failed === 0 ? "✓ PASS" : "✗ FAIL"}
                </Badge>
              </div>
            </div>
          </Card>
        )}

        {/* Column Rule Checks */}
        {report && (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Column Rule Validation</h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              {/* New/Early */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">New/Early</h3>
                  {report.columnChecks.newEarly.pass ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                {report.columnChecks.newEarly.failures.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {report.columnChecks.newEarly.failures.map((f, i) => (
                      <div key={i} className="text-xs text-red-500 bg-red-500/10 p-2 rounded">
                        {f}
                      </div>
                    ))}
                  </div>
                )}
                {report.columnChecks.newEarly.failures.length === 0 && (
                  <div className="text-xs text-green-500">All rules passed</div>
                )}
              </div>

              {/* Active */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Active Trading</h3>
                  {report.columnChecks.active.pass ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                {report.columnChecks.active.failures.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {report.columnChecks.active.failures.map((f, i) => (
                      <div key={i} className="text-xs text-red-500 bg-red-500/10 p-2 rounded">
                        {f}
                      </div>
                    ))}
                  </div>
                )}
                {report.columnChecks.active.failures.length === 0 && (
                  <div className="text-xs text-green-500">All rules passed</div>
                )}
              </div>

              {/* Trending */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Trending</h3>
                  {report.columnChecks.trending.pass ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                {report.columnChecks.trending.failures.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {report.columnChecks.trending.failures.map((f, i) => (
                      <div key={i} className="text-xs text-red-500 bg-red-500/10 p-2 rounded">
                        {f}
                      </div>
                    ))}
                  </div>
                )}
                {report.columnChecks.trending.failures.length === 0 && (
                  <div className="text-xs text-green-500">All rules passed</div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Failed Tests */}
        {report && failedResults.length > 0 && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-bold">Failed Tests ({failedResults.length})</h2>
            </div>
            
            <div className="space-y-2">
              {failedResults.map((result, idx) => {
                const isExpanded = expandedFailures.has(`failed-${idx}`)
                
                return (
                  <div key={idx} className="border border-red-500/50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleExpanded(`failed-${idx}`)}
                      className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="font-mono text-sm">{result.testName}</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {result.tokenSymbol || "N/A"}
                        </Badge>
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="p-4 border-t border-red-500/50 space-y-2 text-sm">
                        {result.reason && (
                          <div>
                            <span className="text-muted-foreground">Reason: </span>
                            <span className="text-red-500">{result.reason}</span>
                          </div>
                        )}
                        {result.tokenMint && (
                          <div>
                            <span className="text-muted-foreground">Mint: </span>
                            <code className="bg-muted px-2 py-1 rounded font-mono text-xs">
                              {result.tokenMint}
                            </code>
                          </div>
                        )}
                        {result.dexUrl && (
                          <div>
                            <span className="text-muted-foreground">DexUrl: </span>
                            <a
                              href={result.dexUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-1"
                            >
                              {result.dexUrl}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Passed Tests Summary */}
        {report && passedResults.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <h2 className="text-xl font-bold">Passed Tests ({passedResults.length})</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              All passed tests are collapsed for clarity. No issues detected.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

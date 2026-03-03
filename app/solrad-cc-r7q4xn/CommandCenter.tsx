"use client"

import { useState, useEffect } from "react"
import {
  Activity,
  Zap,
  Radio,
  Database,
  Bell,
  EyeOff,
  Wrench,
  CheckCircle,
  Shield,
  Lock,
} from "lucide-react"
import { StatusTab } from "./tabs/StatusTab"
import { TriggersTab } from "./tabs/TriggersTab"
import { IntelTab } from "./tabs/IntelTab"
import { IngestTab } from "./tabs/IngestTab"
import { AlertsTab } from "./tabs/AlertsTab"
import { SuppressTab } from "./tabs/SuppressTab"
import { ToolsTab } from "./tabs/ToolsTab"
import { QATab } from "./tabs/QATab"

const TABS = [
  { id: "status", label: "STATUS", icon: Activity },
  { id: "triggers", label: "TRIGGERS", icon: Zap },
  { id: "intel", label: "INTEL", icon: Radio },
  { id: "ingest", label: "INGEST", icon: Database },
  { id: "alerts", label: "ALERTS", icon: Bell },
  { id: "suppress", label: "SUPPRESS", icon: EyeOff },
  { id: "tools", label: "TOOLS", icon: Wrench },
  { id: "qa", label: "QA", icon: CheckCircle },
] as const

type TabId = (typeof TABS)[number]["id"]

export default function CommandCenter() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [inputPassword, setInputPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>("status")
  const [currentTime, setCurrentTime] = useState("")
  const [authTime, setAuthTime] = useState("")

  // Check session on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("solrad_cc_auth")
    const savedPw = sessionStorage.getItem("solrad_cc_pw")
    if (saved === "true" && savedPw) {
      setAuthenticated(true)
      setPassword(savedPw)
      setAuthTime(new Date().toLocaleTimeString())
    }
  }, [])

  // Live clock
  useEffect(() => {
    if (!authenticated) return
    const tick = () => setCurrentTime(new Date().toLocaleTimeString())
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [authenticated])

  const handleAuth = async () => {
    setLoading(true)
    setError("")
    try {
      const trimmed = inputPassword.trim()
      const res = await fetch("/api/ops/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: trimmed }),
      })
      if (res.ok) {
        sessionStorage.setItem("solrad_cc_auth", "true")
        sessionStorage.setItem("solrad_cc_pw", trimmed)
        setAuthenticated(true)
        setPassword(trimmed)
        setAuthTime(new Date().toLocaleTimeString())
        setInputPassword("")
      } else {
        setError("Invalid access key")
      }
    } catch {
      setError("Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  const handleLock = () => {
    sessionStorage.removeItem("solrad_cc_auth")
    sessionStorage.removeItem("solrad_cc_pw")
    setAuthenticated(false)
    setPassword("")
    setInputPassword("")
  }

  // Global headers for all admin API calls
  const adminHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "x-admin-password": password,
    "x-ops-password": password,
  }

  // Auth gate
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="border border-zinc-800 p-8 w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="font-mono text-xs text-zinc-500 tracking-widest">
              SOLRAD COMMAND CENTER
            </span>
          </div>
          <input
            type="password"
            placeholder="ACCESS KEY"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 font-mono text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/50"
          />
          <button
            onClick={handleAuth}
            disabled={loading || !inputPassword.trim()}
            className="w-full mt-3 bg-green-500/10 border border-green-500/30 text-green-400 font-mono text-xs tracking-widest py-2 hover:bg-green-500/20 transition-colors disabled:opacity-40"
          >
            {loading ? "AUTHENTICATING..." : "AUTHENTICATE"}
          </button>
          {error && (
            <p className="font-mono text-xs text-red-400 mt-2">{error}</p>
          )}
        </div>
      </div>
    )
  }

  // Command center
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col font-mono">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between bg-[#0a0a0a]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-mono text-xs text-zinc-400 tracking-widest">
            {"◈"} SOLRAD COMMAND CENTER
          </span>
          <span className="font-mono text-[10px] text-zinc-700">solrad.io</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-zinc-600">
            {"◈"} AUTHENTICATED {"·"} {authTime}
          </span>
          <span className="font-mono text-[10px] text-zinc-600">
            {currentTime}
          </span>
          <button
            onClick={handleLock}
            className="font-mono text-[10px] text-zinc-600 hover:text-red-400 tracking-widest flex items-center gap-1"
          >
            <Lock className="w-3 h-3" />
            LOCK
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-zinc-800 bg-zinc-950 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 font-mono text-[10px] tracking-widest transition-colors whitespace-nowrap ${
                isActive
                  ? "border-b-2 border-green-500 text-green-400"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "status" && <StatusTab adminHeaders={adminHeaders} password={password} />}
        {activeTab === "triggers" && <TriggersTab adminHeaders={adminHeaders} password={password} />}
        {activeTab === "intel" && <IntelTab adminHeaders={adminHeaders} password={password} />}
        {activeTab === "ingest" && <IngestTab adminHeaders={adminHeaders} password={password} />}
        {activeTab === "alerts" && <AlertsTab adminHeaders={adminHeaders} password={password} />}
        {activeTab === "suppress" && <SuppressTab adminHeaders={adminHeaders} password={password} />}
        {activeTab === "tools" && <ToolsTab adminHeaders={adminHeaders} password={password} />}
        {activeTab === "qa" && <QATab adminHeaders={adminHeaders} password={password} />}
      </div>
    </div>
  )
}

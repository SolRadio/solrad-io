"use client"

import { Bell, BellOff, Zap, TrendingUp, Clock, ChevronRight } from "lucide-react"
import { usePushNotifications } from "@/hooks/use-push-notifications"

export function AlertsTab() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
  } = usePushNotifications()

  // Unsupported browser
  if (!isSupported) {
    return (
      <div className="h-full overflow-y-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <BellOff className="h-8 w-8 text-zinc-600" />
          <p className="font-mono text-xs text-zinc-500 tracking-widest text-center">
            PUSH NOTIFICATIONS NOT SUPPORTED
          </p>
          <p className="font-mono text-[10px] text-zinc-600 text-center max-w-[240px]">
            Your browser does not support push notifications. Try Chrome, Edge, or Safari 16+.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
        <span className="font-mono text-[10px] font-bold text-zinc-400 tracking-[0.3em] uppercase">
          SCORE ALERTS
        </span>
      </div>

      {/* Subscribe / Unsubscribe Card */}
      <div className="border border-zinc-800 bg-zinc-950 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className={`h-4 w-4 ${isSubscribed ? "text-cyan-400" : "text-zinc-600"}`} />
            <span className="font-mono text-xs font-bold text-zinc-200">
              {isSubscribed ? "ALERTS ACTIVE" : "ENABLE ALERTS"}
            </span>
          </div>
          {isSubscribed && (
            <span className="font-mono text-[9px] text-cyan-500 tracking-widest bg-cyan-500/10 px-2 py-0.5">
              LIVE
            </span>
          )}
        </div>

        <p className="font-mono text-[10px] text-zinc-500 mb-4 leading-relaxed">
          {isSubscribed
            ? "You will receive push notifications when tokens hit your score thresholds or upgrade signal state."
            : "Get notified when SOLRAD detects score spikes, signal upgrades, and lead-time proof confirmations."}
        </p>

        {permission === "denied" && (
          <div className="bg-red-950/30 border border-red-900/50 p-2 mb-3">
            <p className="font-mono text-[10px] text-red-400">
              Notifications are blocked. Enable them in your browser settings for this site.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-950/30 border border-red-900/50 p-2 mb-3">
            <p className="font-mono text-[10px] text-red-400">{error}</p>
          </div>
        )}

        <button
          onClick={isSubscribed ? unsubscribe : subscribe}
          disabled={isLoading || permission === "denied"}
          className={`w-full py-2.5 font-mono text-[10px] font-bold tracking-widest transition-colors border ${
            isSubscribed
              ? "bg-transparent border-zinc-700 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300"
              : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {isLoading
            ? "PROCESSING..."
            : isSubscribed
              ? "DISABLE ALERTS"
              : "ENABLE PUSH ALERTS"}
        </button>
      </div>

      {/* Preferences (only when subscribed) */}
      {isSubscribed && (
        <div className="border border-zinc-800 bg-zinc-950 p-4 mb-4">
          <span className="font-mono text-[10px] font-bold text-zinc-400 tracking-[0.2em] uppercase mb-3 block">
            ALERT TYPES
          </span>

          <div className="flex flex-col gap-0.5">
            <PreferenceRow
              icon={<Zap className="h-3.5 w-3.5" />}
              label="SCORE ALERTS"
              description={`Tokens crossing ${preferences.minScore}+ score`}
              enabled={preferences.scoreAlerts}
              onChange={(v) => updatePreferences({ scoreAlerts: v })}
            />
            <PreferenceRow
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              label="SIGNAL UPGRADES"
              description="EARLY to CAUTION or STRONG transitions"
              enabled={preferences.signalUpgrades}
              onChange={(v) => updatePreferences({ signalUpgrades: v })}
            />
            <PreferenceRow
              icon={<Clock className="h-3.5 w-3.5" />}
              label="LEAD-TIME PROOFS"
              description="New confirmed lead-time detections"
              enabled={preferences.leadTimeProofs}
              onChange={(v) => updatePreferences({ leadTimeProofs: v })}
            />
          </div>

          {/* Min score slider */}
          <div className="mt-4 pt-3 border-t border-zinc-800/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] text-zinc-500">MIN SCORE THRESHOLD</span>
              <span className="font-mono text-xs font-bold text-zinc-200">{preferences.minScore}</span>
            </div>
            <input
              type="range"
              min={40}
              max={90}
              step={5}
              value={preferences.minScore}
              onChange={(e) => updatePreferences({ minScore: Number(e.target.value) })}
              className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between mt-1">
              <span className="font-mono text-[8px] text-zinc-700">40</span>
              <span className="font-mono text-[8px] text-zinc-700">90</span>
            </div>
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="border border-zinc-800/50 bg-zinc-950/50 p-3">
        <span className="font-mono text-[9px] text-zinc-600 leading-relaxed block">
          Alerts are delivered via Web Push. They work even when the app is closed.
          Checked every 10 minutes by the background alert cron. No email or account required.
        </span>
      </div>
    </div>
  )
}

function PreferenceRow({
  icon,
  label,
  description,
  enabled,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  description: string
  enabled: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="flex items-center gap-3 py-3 px-1 border-b border-zinc-800/30 last:border-0 w-full text-left group"
    >
      <div className={`${enabled ? "text-cyan-400" : "text-zinc-700"} transition-colors`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className={`font-mono text-[10px] font-bold tracking-wider block ${enabled ? "text-zinc-200" : "text-zinc-500"}`}>
          {label}
        </span>
        <span className="font-mono text-[9px] text-zinc-600 block">{description}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`font-mono text-[8px] tracking-widest ${enabled ? "text-cyan-500" : "text-zinc-700"}`}>
          {enabled ? "ON" : "OFF"}
        </span>
        <ChevronRight className="h-3 w-3 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
      </div>
    </button>
  )
}

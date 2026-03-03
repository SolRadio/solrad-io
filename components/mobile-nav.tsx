"use client"

import { Radar, Star, BookOpen, Bell, Shield } from "lucide-react"

export type MobileTabId = "radar" | "proof" | "watchlist" | "learn" | "alerts"

interface MobileNavProps {
  activeTab: MobileTabId
  onTabChange: (tab: MobileTabId) => void
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const tabs: { id: MobileTabId; label: string; icon: typeof Radar }[] = [
    { id: "radar", label: "RADAR", icon: Radar },
    { id: "proof", label: "PROOF", icon: Shield },
    { id: "watchlist", label: "WATCH", icon: Star },
    { id: "learn", label: "LEARN", icon: BookOpen },
    { id: "alerts", label: "ALERTS", icon: Bell },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 border-t border-border/50">
      <div className="flex items-center justify-around h-14 px-1 safe-bottom">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-1
                transition-colors duration-150
                ${isActive ? "text-foreground" : "text-muted-foreground/50"}
              `}
            >
              <Icon className={`h-4.5 w-4.5 ${isActive ? "text-cyan-400" : ""}`} />
              <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${isActive ? "text-cyan-400" : ""}`}>
                {tab.label}
              </span>
              {isActive && <div className="w-4 h-0.5 rounded-full bg-cyan-400 mt-0.5" />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

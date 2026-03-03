"use client"

import { useState } from "react"
import type { TokenScore } from "@/lib/types"
import { MobileHeader } from "./mobile-header"
import { MobileNav } from "./mobile-nav"
import type { MobileTabId } from "./mobile-nav"
import { RadarTab } from "./mobile-tabs/radar-tab"
import { ProofTab } from "./mobile-tabs/proof-tab"
import { WatchlistTab } from "./mobile-tabs/watchlist-tab"
import { LearnTab } from "./mobile-tabs/learn-tab"
import { AlertsTab } from "./mobile-tabs/alerts-tab"
import type { LeadTimeProof } from "@/lib/lead-time/types"

interface MobileContainerProps {
  allTokens: TokenScore[]
  trending: TokenScore[]
  active: TokenScore[]
  newEarly: TokenScore[]
  freshSignals: TokenScore[]
  lastUpdated?: number
  onRefresh?: () => void
  isRefreshing?: boolean
  leadTimeProofsMap?: Map<string, LeadTimeProof>
  stats: {
    totalVolume: number
    avgScore: number
    totalLiquidity: number
    tokensTracked: number
  }
  solPrice: {
    price: number
    change24h: number
    loading: boolean
    error: boolean
  }
}

export function MobileContainer({
  allTokens,
  trending,
  active,
  newEarly,
  freshSignals,
  lastUpdated,
  onRefresh,
  isRefreshing,
  leadTimeProofsMap = new Map(),
  stats,
  solPrice,
}: MobileContainerProps) {
  const [activeTab, setActiveTab] = useState<MobileTabId>("radar")
  const [gemFinderMode, setGemFinderMode] = useState(false)

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Fixed Header - 48px */}
      <MobileHeader
        lastUpdated={lastUpdated}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        solPrice={solPrice}
      />

      {/* Scrollable Content Area */}
      <div
        className="flex-1 overflow-hidden"
        style={{
          paddingTop: "calc(3rem + env(safe-area-inset-top))",
          paddingBottom: "calc(56px + env(safe-area-inset-bottom))",
        }}
      >
        {activeTab === "radar" && (
          <RadarTab
            freshSignals={freshSignals}
            trending={trending}
            active={active}
            newEarly={newEarly}
            stats={stats}
            solPrice={solPrice}
            leadTimeProofsMap={leadTimeProofsMap}
            gemFinderMode={gemFinderMode}
            onGemFinderChange={setGemFinderMode}
          />
        )}
        {activeTab === "proof" && (
          <ProofTab leadTimeProofsMap={leadTimeProofsMap} />
        )}
        {activeTab === "watchlist" && (
          <WatchlistTab allTokens={allTokens} leadTimeProofsMap={leadTimeProofsMap} />
        )}
        {activeTab === "learn" && <LearnTab />}
        {activeTab === "alerts" && <AlertsTab />}
      </div>

      {/* Fixed Bottom Nav - 56px */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

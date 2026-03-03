import { NextResponse } from "next/server"
import { getTrackedMints, getSnapshotHistory, type TokenSnapshot } from "@/lib/snapshotLogger"
import { storage } from "@/lib/storage"

// Storage key for signal state alerts
export const SIGNAL_STATE_ALERTS_KEY = "solrad:signalStateAlerts"

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
    confidencePrev?: number
    confidenceNow?: number
  }
}

export type { Alert }

/**
 * Check if admin authenticated
 */
function isAdminAuthenticated(req: Request): boolean {
  const password = req.headers.get("x-admin-password")
  const trimmedPassword = password?.trim() || ""
  
  // Get all possible admin passwords
  const opsPassword = process.env.OPS_PASSWORD
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminAlertsPassword = process.env.ADMIN_ALERTS_PASSWORD
  
  // Check if provided password matches any configured password
  const isValid = 
    (opsPassword && trimmedPassword === opsPassword) ||
    (adminPassword && trimmedPassword === adminPassword) ||
    (adminAlertsPassword && trimmedPassword === adminAlertsPassword)
  
  // SAFE debug logs on failed auth (no secret values)
  if (!isValid) {
    console.log("[v0] Admin alerts auth failed:", {
      hasOpsPassword: !!opsPassword,
      hasAdminPassword: !!adminPassword,
      hasAdminAlertsPassword: !!adminAlertsPassword,
      providedLength: password?.length || 0,
      providedTrimmedLength: trimmedPassword.length,
    })
  }
  
  return isValid
}

/**
 * Evaluate alert rules for a token's snapshot history
 */
function evaluateAlerts(snapshots: TokenSnapshot[]): Alert[] {
  if (snapshots.length < 2) return []

  const alerts: Alert[] = []
  const now = Date.now()
  const oneHourAgo = now - 60 * 60 * 1000

  // Sort by timestamp ascending (oldest first)
  const sorted = [...snapshots].sort((a, b) => a.ts - b.ts)
  
  const latest = sorted[sorted.length - 1]
  const previous = sorted[sorted.length - 2]

  // Get snapshots from last 60 minutes
  const last60min = sorted.filter((s) => s.ts >= oneHourAgo)

  // RULE 1: SCORE_CROSS_80
  if (previous.solradScore < 80 && latest.solradScore >= 80) {
    alerts.push({
      id: `${latest.mint}-cross80-${latest.ts}`,
      type: "SCORE_CROSS_80",
      severity: "high",
      mint: latest.mint,
      symbol: latest.symbol,
      name: latest.name,
      ts: latest.ts,
      message: `Score crossed 80 threshold (${previous.solradScore.toFixed(1)} → ${latest.solradScore.toFixed(1)})`,
      metrics: {
        scorePrev: previous.solradScore,
        scoreNow: latest.solradScore,
        pricePrev: previous.price,
        priceNow: latest.price,
      },
    })
  }

  // RULE 2: SCORE_JUMP_10_60M
  if (last60min.length >= 2) {
    const oldestIn60min = last60min[0]
    const scoreDelta = latest.solradScore - oldestIn60min.solradScore

    if (scoreDelta >= 10) {
      alerts.push({
        id: `${latest.mint}-jump10-${latest.ts}`,
        type: "SCORE_JUMP_10_60M",
        severity: "med",
        mint: latest.mint,
        symbol: latest.symbol,
        name: latest.name,
        ts: latest.ts,
        message: `Score jumped +${scoreDelta.toFixed(1)} in 60 min (${oldestIn60min.solradScore.toFixed(1)} → ${latest.solradScore.toFixed(1)})`,
        metrics: {
          scorePrev: oldestIn60min.solradScore,
          scoreNow: latest.solradScore,
          pricePrev: oldestIn60min.price,
          priceNow: latest.price,
        },
      })
    }
  }

  // RULE 3: LIQ_SPIKE_WITH_SCORE
  if (last60min.length >= 2) {
    const oldestIn60min = last60min[0]
    const liqChange = ((latest.liquidityUsd - oldestIn60min.liquidityUsd) / oldestIn60min.liquidityUsd) * 100

    if (liqChange >= 30 && latest.solradScore >= 70) {
      alerts.push({
        id: `${latest.mint}-liqspike-${latest.ts}`,
        type: "LIQ_SPIKE_WITH_SCORE",
        severity: "high",
        mint: latest.mint,
        symbol: latest.symbol,
        name: latest.name,
        ts: latest.ts,
        message: `Liquidity spiked +${liqChange.toFixed(0)}% with score ${latest.solradScore.toFixed(1)}`,
        metrics: {
          liqPrev: oldestIn60min.liquidityUsd,
          liqNow: latest.liquidityUsd,
          scoreNow: latest.solradScore,
          pricePrev: oldestIn60min.price,
          priceNow: latest.price,
        },
      })
    }
  }

  // RULE 4: RISK_WORSENED
  const riskLevels: Record<string, number> = {
    "LOW RISK": 1,
    "MEDIUM RISK": 2,
    "HIGH RISK": 3,
  }

  const prevRiskLevel = riskLevels[previous.riskLabel] || 2
  const currentRiskLevel = riskLevels[latest.riskLabel] || 2

  if (currentRiskLevel > prevRiskLevel) {
    alerts.push({
      id: `${latest.mint}-riskworse-${latest.ts}`,
      type: "RISK_WORSENED",
      severity: currentRiskLevel === 3 ? "high" : "med",
      mint: latest.mint,
      symbol: latest.symbol,
      name: latest.name,
      ts: latest.ts,
      message: `Risk worsened: ${previous.riskLabel} → ${latest.riskLabel}`,
      metrics: {
        riskPrev: previous.riskLabel,
        riskNow: latest.riskLabel,
        scorePrev: previous.solradScore,
        scoreNow: latest.solradScore,
        pricePrev: previous.price,
        priceNow: latest.price,
      },
    })
  }

  return alerts
}

/**
 * GET /api/admin/alerts
 * Returns alerts detected from snapshot history
 */
export async function GET(req: Request) {
  try {
    // Check admin auth
    if (!isAdminAuthenticated(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all tracked mints
    const mints = await getTrackedMints()
    console.log(`[v0] Evaluating alerts for ${mints.length} tracked tokens`)

    const allAlerts: Alert[] = []

    // Evaluate each mint
    for (const mint of mints) {
      try {
        // Get last ~2 hours of snapshots (limit 50)
        const snapshots = await getSnapshotHistory(mint, 50)
        
        if (snapshots.length < 2) continue

        const alerts = evaluateAlerts(snapshots)
        allAlerts.push(...alerts)
      } catch (error) {
        console.error(`[v0] Error evaluating alerts for ${mint}:`, error)
        // Continue to next mint
      }
    }

    // Fetch signal state alerts from storage
    try {
      const signalStateAlerts = (await storage.get(SIGNAL_STATE_ALERTS_KEY)) as Alert[] || []
      // Filter to last 24 hours
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
      const recentSignalAlerts = signalStateAlerts.filter((a) => a.ts >= oneDayAgo)
      allAlerts.push(...recentSignalAlerts)
      console.log(`[v0] Added ${recentSignalAlerts.length} signal state alerts`)
    } catch (err) {
      console.error("[v0] Error fetching signal state alerts:", err)
    }

    // Sort by timestamp descending (newest first)
    allAlerts.sort((a, b) => b.ts - a.ts)

    // Cap to 100 alerts
    const capped = allAlerts.slice(0, 100)

    console.log(`[v0] Generated ${capped.length} alerts (from ${allAlerts.length} total)`)

    return NextResponse.json({
      updatedAt: Date.now(),
      alerts: capped,
    })
  } catch (error) {
    console.error("[v0] Admin alerts API error:", error)
    return NextResponse.json(
      { error: "Failed to generate alerts", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

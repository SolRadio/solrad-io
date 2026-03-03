/**
 * Emit Signal State Alerts
 * 
 * Emits alerts to the admin alert feed when signal state transitions occur.
 * Includes severity rules and 2-minute dedupe.
 */

import { storage } from "./storage"
import type { TokenScore } from "./types"
import type { SignalState } from "./signal-state"
import { SIGNAL_STATE_ALERTS_KEY } from "./signal-state"

// Alert type matching the admin alerts route
interface SignalStateAlert {
  id: string
  type: "SIGNAL_STATE_UPGRADE" | "SIGNAL_STATE_DOWNGRADE"
  severity: "low" | "med" | "high"
  mint: string
  symbol: string
  name: string
  ts: number
  message: string
  metrics: {
    scorePrev?: number
    scoreNow?: number
    fromState?: string
    toState?: string
    confidenceNow?: number
  }
}

// Dedupe key for tracking recent alert emissions (2 minute window)
const SIGNAL_ALERT_DEDUPE_KEY = (mint: string, fromState: string, toState: string) =>
  `solrad:signalAlertDedupe:${mint}:${fromState}:${toState}`

// Dedupe window in seconds
const DEDUPE_TTL = 120 // 2 minutes

// Alerts TTL (24 hours)
const ALERTS_TTL = 86400

// State ordering for determining upgrade vs downgrade
const STATE_ORDER: Record<SignalState, number> = {
  EARLY: 1,
  CAUTION: 2,
  STRONG: 3,
}

/**
 * Determine severity based on transition type
 * 
 * SEVERITY RULES:
 * - UPGRADE to STRONG => HIGH
 * - UPGRADE to CAUTION => MED
 * - DOWNGRADE from STRONG => HIGH
 * - DOWNGRADE to EARLY => MED
 * - Otherwise LOW
 */
function getSeverity(
  fromState: SignalState,
  toState: SignalState,
  isUpgrade: boolean
): "low" | "med" | "high" {
  if (isUpgrade) {
    if (toState === "STRONG") return "high"
    if (toState === "CAUTION") return "med"
    return "low"
  } else {
    // Downgrade
    if (fromState === "STRONG") return "high"
    if (toState === "EARLY") return "med"
    return "low"
  }
}

/**
 * Generate message for the transition
 */
function getTransitionMessage(
  fromState: SignalState,
  toState: SignalState,
  isUpgrade: boolean
): string {
  const direction = isUpgrade ? "upgraded" : "downgraded"
  return `Signal state ${direction}: ${fromState} → ${toState}`
}

/**
 * Emit a signal state alert to the admin alert feed
 * Includes 2-minute dedupe per mint + transition type
 */
export async function emitSignalStateAlert(
  token: TokenScore,
  fromState: SignalState,
  toState: SignalState,
  confidence: number
): Promise<boolean> {
  const mint = token.address
  const now = Date.now()
  
  // Check dedupe
  const dedupeKey = SIGNAL_ALERT_DEDUPE_KEY(mint, fromState, toState)
  try {
    const recentEmission = await storage.get(dedupeKey)
    if (recentEmission) {
      // Skip - already emitted this transition recently
      return false
    }
  } catch {
    // Continue on error
  }
  
  // Determine if upgrade or downgrade
  const isUpgrade = STATE_ORDER[toState] > STATE_ORDER[fromState]
  const alertType = isUpgrade ? "SIGNAL_STATE_UPGRADE" : "SIGNAL_STATE_DOWNGRADE"
  
  // Build alert
  const alert: SignalStateAlert = {
    id: `${mint}-${alertType.toLowerCase()}-${now}`,
    type: alertType,
    severity: getSeverity(fromState, toState, isUpgrade),
    mint,
    symbol: token.symbol,
    name: token.name || token.symbol,
    ts: now,
    message: getTransitionMessage(fromState, toState, isUpgrade),
    metrics: {
      scoreNow: token.totalScore,
      fromState,
      toState,
      confidenceNow: confidence,
    },
  }
  
  // Store alert
  try {
    const existingAlerts = (await storage.get(SIGNAL_STATE_ALERTS_KEY)) as SignalStateAlert[] || []
    const updatedAlerts = [alert, ...existingAlerts].slice(0, 200) // Keep last 200
    await storage.set(SIGNAL_STATE_ALERTS_KEY, updatedAlerts, { ex: ALERTS_TTL })
  } catch (err) {
    console.error("[v0] Failed to store signal state alert:", err)
    return false
  }
  
  // Set dedupe marker
  try {
    await storage.set(dedupeKey, { ts: now }, { ex: DEDUPE_TTL })
  } catch {
    // Non-critical
  }
  
  console.log(`[v0] Emitted signal state alert: ${token.symbol} ${fromState} → ${toState}`)
  return true
}

/**
 * Alert Rules Storage and Types
 * Stores subscription rules for automated alert delivery
 */

import { storage } from "./storage"

// Storage keys
export const ALERT_RULES_KEY = "solrad:alertRules"
export const ALERT_DELIVERY_LOG_KEY = "solrad:alertDeliveryLog"

// All supported alert types (from admin alerts route)
export const ALERT_TYPES = [
  "SCORE_CROSS_80",
  "SCORE_JUMP_10_60M",
  "LIQ_SPIKE_WITH_SCORE",
  "RISK_WORSENED",
  "SIGNAL_STATE_UPGRADE",
  "SIGNAL_STATE_DOWNGRADE",
] as const

export type AlertType = (typeof ALERT_TYPES)[number]

// Delivery channels
export const DELIVERY_CHANNELS = ["telegram"] as const
export type DeliveryChannel = (typeof DELIVERY_CHANNELS)[number]

// Severity levels
export const SEVERITY_LEVELS = ["low", "med", "high"] as const
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number]

// Alert rule definition
export interface AlertRule {
  id: string
  name: string
  enabled: boolean
  createdAt: number
  updatedAt: number

  // Matching criteria
  alertTypes: AlertType[] // Which alert types to match
  minSeverity: SeverityLevel // Minimum severity to trigger
  minScore?: number // Optional: minimum score threshold
  minConfidence?: number // Optional: minimum confidence threshold (0-100)

  // Delivery
  channel: DeliveryChannel
  dedupeMinutes: number // No repeat alerts within X minutes per token
}

// Delivery log entry (for deduplication)
export interface DeliveryLogEntry {
  ruleId: string
  alertId: string
  mint: string
  alertType: AlertType
  deliveredAt: number
}

// Default rule template
export const DEFAULT_RULE: Omit<AlertRule, "id" | "createdAt" | "updatedAt"> = {
  name: "New Alert Rule",
  enabled: false,
  alertTypes: ["SCORE_CROSS_80"],
  minSeverity: "med",
  minScore: undefined,
  minConfidence: undefined,
  channel: "telegram",
  dedupeMinutes: 30,
}

/**
 * Get all alert rules
 */
export async function getAlertRules(): Promise<AlertRule[]> {
  try {
    const rules = (await storage.get(ALERT_RULES_KEY)) as AlertRule[] | null
    return rules || []
  } catch (error) {
    console.error("[alert-rules] Error fetching rules:", error)
    return []
  }
}

/**
 * Save all alert rules
 */
export async function saveAlertRules(rules: AlertRule[]): Promise<void> {
  await storage.set(ALERT_RULES_KEY, rules)
}

/**
 * Create a new alert rule
 */
export async function createAlertRule(
  rule: Omit<AlertRule, "id" | "createdAt" | "updatedAt">
): Promise<AlertRule> {
  const rules = await getAlertRules()
  const now = Date.now()

  const newRule: AlertRule = {
    ...rule,
    id: `rule_${now}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
  }

  rules.push(newRule)
  await saveAlertRules(rules)

  return newRule
}

/**
 * Update an existing alert rule
 */
export async function updateAlertRule(
  id: string,
  updates: Partial<Omit<AlertRule, "id" | "createdAt">>
): Promise<AlertRule | null> {
  const rules = await getAlertRules()
  const index = rules.findIndex((r) => r.id === id)

  if (index === -1) return null

  rules[index] = {
    ...rules[index],
    ...updates,
    updatedAt: Date.now(),
  }

  await saveAlertRules(rules)
  return rules[index]
}

/**
 * Delete an alert rule
 */
export async function deleteAlertRule(id: string): Promise<boolean> {
  const rules = await getAlertRules()
  const filtered = rules.filter((r) => r.id !== id)

  if (filtered.length === rules.length) return false

  await saveAlertRules(filtered)
  return true
}

/**
 * Get delivery log (for deduplication checks)
 */
export async function getDeliveryLog(): Promise<DeliveryLogEntry[]> {
  try {
    const log = (await storage.get(ALERT_DELIVERY_LOG_KEY)) as DeliveryLogEntry[] | null
    return log || []
  } catch {
    return []
  }
}

/**
 * Add entry to delivery log
 */
export async function logDelivery(entry: DeliveryLogEntry): Promise<void> {
  const log = await getDeliveryLog()
  const now = Date.now()

  // Keep last 24 hours of entries
  const cutoff = now - 24 * 60 * 60 * 1000
  const filtered = log.filter((e) => e.deliveredAt >= cutoff)

  filtered.push(entry)

  // Cap at 1000 entries
  const capped = filtered.slice(-1000)

  await storage.set(ALERT_DELIVERY_LOG_KEY, capped, { ex: 86400 }) // 24h TTL
}

/**
 * Check if an alert was already delivered for a rule within dedupe window
 */
export async function wasRecentlyDelivered(
  ruleId: string,
  mint: string,
  alertType: AlertType,
  dedupeMinutes: number
): Promise<boolean> {
  const log = await getDeliveryLog()
  const cutoff = Date.now() - dedupeMinutes * 60 * 1000

  return log.some(
    (entry) =>
      entry.ruleId === ruleId &&
      entry.mint === mint &&
      entry.alertType === alertType &&
      entry.deliveredAt >= cutoff
  )
}

/**
 * Severity level to numeric value (for comparison)
 */
export function severityToNumber(severity: SeverityLevel): number {
  switch (severity) {
    case "low":
      return 1
    case "med":
      return 2
    case "high":
      return 3
    default:
      return 0
  }
}

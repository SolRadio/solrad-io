import type { RiskLabel } from "@/lib/types"

/**
 * Normalizes legacy risk label strings to the canonical 3-level system.
 *
 * @param input - Any risk label string from legacy systems
 * @returns Normalized RiskLabel or undefined if invalid
 */
export function normalizeRiskLabel(input?: string): RiskLabel | undefined {
  if (!input) return undefined

  const normalized = input.toUpperCase().trim()

  // Already correct format
  if (normalized === "LOW RISK") return "LOW RISK"
  if (normalized === "MEDIUM RISK") return "MEDIUM RISK"
  if (normalized === "HIGH RISK") return "HIGH RISK"

  // Legacy mappings
  if (normalized === "STRONG" || normalized === "HEALTHY") return "LOW RISK"
  if (normalized === "WATCH" || normalized === "CAUTION" || normalized === "MONITOR") return "MEDIUM RISK"
  if (normalized === "DANGER" || normalized === "RISKY" || normalized === "SPECULATIVE") return "HIGH RISK"

  // Invalid or unrecognized
  return undefined
}

/**
 * Ensures a token has a valid riskLabel field by normalizing from any legacy field.
 * Falls back to computing risk level if no valid field exists.
 */
export function ensureRiskLabel(token: any, computeFn: (token: any) => RiskLabel): RiskLabel {
  // Try to normalize from any existing risk field
  const normalized =
    normalizeRiskLabel(token.riskLabel) ??
    normalizeRiskLabel(token.risk) ??
    normalizeRiskLabel(token.riskText) ??
    normalizeRiskLabel(token.label)

  // If we got a valid normalized value, use it
  if (normalized) return normalized

  // Otherwise compute from scratch
  return computeFn(token)
}

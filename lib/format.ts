/**
 * Format USD prices consistently across the app
 * No scientific notation, adaptive decimal precision
 */

/**
 * Format a USD price with smart decimal precision
 * - Returns "$—" for null/undefined/NaN
 * - >= $1: 2 decimals with comma separators
 * - $0.01 to $1: up to 4 decimals (trim trailing zeros)
 * - $0.0001 to $0.01: up to 6 decimals (trim trailing zeros)
 * - < $0.0001: up to 8 decimals (trim trailing zeros)
 */
export function formatUsdPrice(price: number | null | undefined): string {
  if (price == null || Number.isNaN(price)) {
    return "$—"
  }

  // Handle negative prices (shouldn't happen, but be safe)
  if (price < 0) {
    return "$—"
  }

  // >= $1: Use standard US currency format
  if (price >= 1) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)
  }

  // $0.01 to $1: Show up to 4 decimals
  if (price >= 0.01) {
    return `$${price.toFixed(4).replace(/\.?0+$/, "")}`
  }

  // $0.0001 to $0.01: Show up to 6 decimals
  if (price >= 0.0001) {
    return `$${price.toFixed(6).replace(/\.?0+$/, "")}`
  }

  // < $0.0001: Show up to 8 decimals
  return `$${price.toFixed(8).replace(/\.?0+$/, "")}`
}

/**
 * Format a USD value as a compact string: $1.2B, $3.5M, $420K, $800
 * Used for volume and liquidity displays.
 */
export function formatCompactUsd(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "$0"
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

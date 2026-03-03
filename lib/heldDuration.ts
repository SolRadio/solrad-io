import { getSnapshotHistory, type TokenSnapshot } from "./snapshotLogger"

/**
 * Compute how long a token has held SOLRAD score ≥ 80 based on snapshot history
 * Returns "1H" | "6H" | "24H" | null
 * - Safe: never fails, returns null if no data or KV not configured
 * - Uses existing snapshot logic from snapshotLogger (10-minute intervals)
 */
export async function getHeldDurationLabel(mint: string): Promise<"1H" | "6H" | "24H" | null> {
  try {
    // Get snapshot history (last 200 snapshots max)
    const snapshots = await getSnapshotHistory(mint, 200)

    if (!snapshots || snapshots.length === 0) {
      return null
    }

    // Sort by timestamp descending (newest first)
    const sortedSnapshots = [...snapshots].sort((a, b) => b.ts - a.ts)

    // Count consecutive snapshots where solradScore >= 80
    let consecutiveCount = 0
    for (const snap of sortedSnapshots) {
      if (snap.solradScore >= 80) {
        consecutiveCount++
      } else {
        break // Stop at first score < 80
      }
    }

    if (consecutiveCount === 0) {
      return null
    }

    // Convert consecutive count to duration
    // Assuming snapshots are logged every 10 minutes
    const SNAPSHOT_INTERVAL_MINUTES = 10
    const durationMinutes = consecutiveCount * SNAPSHOT_INTERVAL_MINUTES

    // Convert to hours
    const durationHours = durationMinutes / 60

    // Return label based on duration
    if (durationHours >= 24) {
      return "24H"
    }
    if (durationHours >= 6) {
      return "6H"
    }
    if (durationHours >= 1) {
      return "1H"
    }

    return null
  } catch (error) {
    console.error(`[v0] Failed to compute held duration for ${mint}:`, error)
    return null
  }
}

/**
 * Client-side version that can be used in components
 * Fetches held duration via internal API call
 */
export async function getHeldDurationLabelClient(mint: string): Promise<"1H" | "6H" | "24H" | null> {
  try {
    const response = await fetch(`/api/held-duration?mint=${encodeURIComponent(mint)}`)
    if (!response.ok) {
      return null
    }
    const data = await response.json()
    return data.label || null
  } catch (error) {
    console.error(`[v0] Failed to fetch held duration for ${mint}:`, error)
    return null
  }
}

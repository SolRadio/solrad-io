import { put, list } from "@vercel/blob"
import type { TokenSnapshot } from "./types"

const SNAPSHOTS_BLOB_PATH = "solrad/snapshots.json"

interface SnapshotsStore {
  snapshots: TokenSnapshot[]
  lastUpdated: number
}

let memoryStore: SnapshotsStore = { snapshots: [], lastUpdated: 0 }

async function findSnapshotsBlob(): Promise<string | null> {
  try {
    const { blobs } = await list({ prefix: "solrad/" })
    const snapshotBlob = blobs.find((b) => b.pathname === SNAPSHOTS_BLOB_PATH)
    return snapshotBlob?.url || null
  } catch (error) {
    console.warn("[v0] Snapshots list() failed:", error)
    return null
  }
}

export async function loadSnapshots(): Promise<TokenSnapshot[]> {
  const url = await findSnapshotsBlob()
  
  if (url) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        const store = (await response.json()) as SnapshotsStore
        memoryStore = store
        console.log("[v0] Loaded", store.snapshots.length, "snapshots from Blob")
        return store.snapshots
      }
    } catch (error) {
      console.warn("[v0] Failed to load snapshots:", error)
    }
  }
  
  return memoryStore.snapshots
}

export async function saveSnapshots(snapshots: TokenSnapshot[]): Promise<boolean> {
  memoryStore = {
    snapshots,
    lastUpdated: Date.now(),
  }
  
  try {
    await put(SNAPSHOTS_BLOB_PATH, JSON.stringify(memoryStore), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    })
    console.log("[v0] Saved", snapshots.length, "snapshots to Blob")
    return true
  } catch (error) {
    console.warn("[v0] Failed to save snapshots:", error)
    return false
  }
}

export async function recordSnapshot(snapshot: TokenSnapshot): Promise<void> {
  const snapshots = await loadSnapshots()
  snapshots.push(snapshot)
  
  // Keep only last 10,000 snapshots (auto-cleanup)
  if (snapshots.length > 10000) {
    snapshots.splice(0, snapshots.length - 10000)
  }
  
  await saveSnapshots(snapshots)
}

export async function batchRecordSnapshots(newSnapshots: TokenSnapshot[]): Promise<void> {
  const snapshots = await loadSnapshots()
  
  // Filter out duplicates (same mint within last 10 minutes)
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000
  const recentMints = new Set(
    snapshots
      .filter((s) => s.createdAt > tenMinutesAgo)
      .map((s) => s.mint)
  )
  
  const filteredNew = newSnapshots.filter((s) => !recentMints.has(s.mint))
  
  if (filteredNew.length === 0) {
    console.log("[v0] No new snapshots to record (all duplicates)")
    return
  }
  
  snapshots.push(...filteredNew)
  
  // Keep only last 10,000 snapshots
  if (snapshots.length > 10000) {
    snapshots.splice(0, snapshots.length - 10000)
  }
  
  await saveSnapshots(snapshots)
  console.log("[v0] Recorded", filteredNew.length, "new snapshots")
}

export async function getSnapshotsLast24h(): Promise<TokenSnapshot[]> {
  const snapshots = await loadSnapshots()
  const cutoff = Date.now() - 24 * 60 * 60 * 1000
  return snapshots.filter((s) => s.createdAt >= cutoff)
}

export async function getSnapshotsByMint(mint: string, hours = 24): Promise<TokenSnapshot[]> {
  const snapshots = await loadSnapshots()
  const cutoff = Date.now() - hours * 60 * 60 * 1000
  return snapshots
    .filter((s) => s.mint === mint && s.createdAt >= cutoff)
    .sort((a, b) => a.createdAt - b.createdAt)
}

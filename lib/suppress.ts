/**
 * Token Suppression System
 * 
 * View-layer filter: removes rugged/unsafe tokens from public discovery surfaces.
 * Does NOT modify scoring, ingestion, or any other data pipeline.
 * 
 * KV keys:
 *   suppress:mint:{MINT} -> JSON { mint, reason, addedAt }
 *   suppress:index       -> Set of suppressed mint addresses
 */

import { storage } from "@/lib/storage"
import { kv } from "@vercel/kv"

const SUPPRESS_INDEX_KEY = "suppress:index"
const suppressMintKey = (mint: string) => `suppress:mint:${mint}`

export interface SuppressedEntry {
  mint: string
  reason: string
  addedAt: string // ISO string
}

/**
 * Check if a single mint is suppressed.
 * Returns the entry if suppressed, null otherwise.
 */
export async function isSuppressed(mint: string): Promise<SuppressedEntry | null> {
  try {
    const entry = await storage.get(suppressMintKey(mint))
    if (entry && typeof entry === "object" && (entry as any).mint) {
      return entry as SuppressedEntry
    }
    // Could be JSON-stringified
    if (typeof entry === "string") {
      try {
        const parsed = JSON.parse(entry)
        if (parsed && parsed.mint) return parsed as SuppressedEntry
      } catch {
        // Not JSON
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Add a mint to the suppression list.
 */
export async function addSuppressed(mint: string, reason: string): Promise<void> {
  const entry: SuppressedEntry = {
    mint,
    reason,
    addedAt: new Date().toISOString(),
  }

  // Store individual entry (no TTL -- permanent until manually removed)
  await storage.set(suppressMintKey(mint), entry)

  // Add to the suppress index set
  try {
    await kv.sadd(SUPPRESS_INDEX_KEY, mint)
  } catch {
    // Fallback: read-modify-write via storage adapter
    const existing = await getSuppressedMints()
    if (!existing.includes(mint)) {
      existing.push(mint)
      await storage.set(SUPPRESS_INDEX_KEY, existing)
    }
  }
}

/**
 * Remove a mint from the suppression list.
 */
export async function removeSuppressed(mint: string): Promise<void> {
  // Delete individual entry
  await storage.del(suppressMintKey(mint))

  // Remove from the suppress index set
  try {
    await kv.srem(SUPPRESS_INDEX_KEY, mint)
  } catch {
    // Fallback: read-modify-write via storage adapter
    const existing = await getSuppressedMints()
    const filtered = existing.filter((m) => m !== mint)
    await storage.set(SUPPRESS_INDEX_KEY, filtered)
  }
}

/**
 * Get all suppressed mint addresses (lightweight, just mints).
 */
export async function getSuppressedMints(): Promise<string[]> {
  try {
    // Try KV set first
    const members = await kv.smembers(SUPPRESS_INDEX_KEY)
    if (Array.isArray(members) && members.length > 0) {
      return members.filter((m): m is string => typeof m === "string" && m.length > 0)
    }
  } catch {
    // Fall through to storage adapter
  }

  try {
    const stored = await storage.get(SUPPRESS_INDEX_KEY)
    if (Array.isArray(stored)) {
      return stored.filter((m): m is string => typeof m === "string" && m.length > 0)
    }
    if (typeof stored === "string") {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          return parsed.filter((m): m is string => typeof m === "string")
        }
      } catch {
        // Not JSON
      }
    }
  } catch {
    // Storage read failed
  }

  return []
}

/**
 * Get full list with details (mint + reason + addedAt).
 */
export async function getSuppressedList(): Promise<SuppressedEntry[]> {
  const mints = await getSuppressedMints()
  if (mints.length === 0) return []

  const entries: SuppressedEntry[] = []
  // Batch read all entries
  for (const mint of mints) {
    const entry = await isSuppressed(mint)
    if (entry) {
      entries.push(entry)
    } else {
      // Mint is in index but entry is missing -- include with unknown reason
      entries.push({ mint, reason: "(unknown)", addedAt: new Date().toISOString() })
    }
  }

  return entries.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
}

/**
 * Filter an array of token objects, removing any that are suppressed.
 * Accepts any object with an `address` or `mint` string field.
 * Preserves ordering.
 */
export async function filterSuppressed<T extends Record<string, any>>(tokens: T[]): Promise<T[]> {
  if (tokens.length === 0) return tokens

  const suppressedSet = new Set(await getSuppressedMints())
  if (suppressedSet.size === 0) return tokens

  return tokens.filter((t) => {
    const addr = t.address || t.mint || ""
    return !suppressedSet.has(addr)
  })
}

/**
 * Watchlist / Favorites system for SOLRAD
 * Uses localStorage for persistence, no login required
 * SSR-safe with event-driven updates
 */

import { normalizeMint } from "./solana/normalizeMint"

const STORAGE_KEY = "solrad:watchlist:v1"
const CHANGE_EVENT = "solrad:watchlist:changed"

export interface WatchlistItem {
  mint: string
  addedAt: number
  symbol?: string
  name?: string
  image?: string
}

/**
 * SSR-safe check for localStorage availability
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") return false
  try {
    const test = "__test__"
    window.localStorage.setItem(test, test)
    window.localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Migrate and normalize old watchlist items
 */
function migrateWatchlist(items: WatchlistItem[]): { items: WatchlistItem[], needsSave: boolean } {
  let needsSave = false
  const normalizedItems: WatchlistItem[] = []
  const seenMints = new Set<string>()
  
  for (const item of items) {
    const originalMint = item.mint
    const normalizedMint = normalizeMint(originalMint)
    const normalizedLower = normalizedMint.toLowerCase()
    
    // Skip duplicates after normalization
    if (seenMints.has(normalizedLower)) {
      console.log(`[v0] Removing duplicate watchlist item after normalization: ${originalMint}`)
      needsSave = true
      continue
    }
    
    seenMints.add(normalizedLower)
    
    // Check if normalization changed the mint
    if (originalMint !== normalizedMint) {
      console.log(`[v0] Normalizing watchlist mint: ${originalMint} → ${normalizedMint}`)
      normalizedItems.push({
        ...item,
        mint: normalizedMint
      })
      needsSave = true
    } else {
      normalizedItems.push(item)
    }
  }
  
  return { items: normalizedItems, needsSave }
}

/**
 * Get all watchlist items from localStorage
 */
export function getWatchlist(): WatchlistItem[] {
  if (!isLocalStorageAvailable()) return []
  
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    
    // Migrate and normalize old items
    const { items, needsSave } = migrateWatchlist(parsed)
    
    // Save back to localStorage if migration made changes
    if (needsSave) {
      console.log('[v0] Watchlist migration complete, saving normalized items')
      saveWatchlist(items)
    }
    
    return items
  } catch (error) {
    console.warn("[v0] Failed to parse watchlist from localStorage:", error)
    return []
  }
}

/**
 * Save watchlist to localStorage and dispatch change event
 */
function saveWatchlist(items: WatchlistItem[]): void {
  if (!isLocalStorageAvailable()) return
  
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    
    // Dispatch custom event for same-window updates
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: items }))
  } catch (error) {
    console.error("[v0] Failed to save watchlist to localStorage:", error)
  }
}

/**
 * Check if a token is in the watchlist
 */
export function isWatched(mint: string): boolean {
  const watchlist = getWatchlist()
  const normalizedMint = normalizeMint(mint).toLowerCase()
  return watchlist.some(item => normalizeMint(item.mint).toLowerCase() === normalizedMint)
}

/**
 * Add a token to the watchlist
 */
export function addWatch(
  mint: string,
  tokenMeta?: { symbol?: string; name?: string; image?: string }
): void {
  const watchlist = getWatchlist()
  const normalizedMint = normalizeMint(mint)
  
  // Don't add duplicates
  if (watchlist.some(item => normalizeMint(item.mint).toLowerCase() === normalizedMint.toLowerCase())) {
    return
  }
  
  const newItem: WatchlistItem = {
    mint: normalizedMint, // Store normalized mint
    addedAt: Date.now(),
    symbol: tokenMeta?.symbol,
    name: tokenMeta?.name,
    image: tokenMeta?.image,
  }
  
  watchlist.push(newItem)
  saveWatchlist(watchlist)
}

/**
 * Remove a token from the watchlist
 */
export function removeWatch(mint: string): void {
  const watchlist = getWatchlist()
  const normalizedMint = normalizeMint(mint).toLowerCase()
  const filtered = watchlist.filter(item => normalizeMint(item.mint).toLowerCase() !== normalizedMint)
  
  if (filtered.length !== watchlist.length) {
    saveWatchlist(filtered)
  }
}

/**
 * Toggle a token in/out of the watchlist
 * Returns true if added, false if removed
 */
export function toggleWatch(
  mint: string,
  tokenMeta?: { symbol?: string; name?: string; image?: string }
): boolean {
  if (isWatched(mint)) {
    removeWatch(mint)
    return false
  } else {
    addWatch(mint, tokenMeta)
    return true
  }
}

/**
 * Clear entire watchlist
 */
export function clearWatchlist(): void {
  if (!isLocalStorageAvailable()) return
  
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: [] }))
  } catch (error) {
    console.error("[v0] Failed to clear watchlist:", error)
  }
}

/**
 * Subscribe to watchlist changes (both same-window and cross-tab)
 * Returns an unsubscribe function
 */
export function subscribeWatchlist(callback: (watchlist: WatchlistItem[]) => void): () => void {
  if (!isLocalStorageAvailable()) {
    return () => {} // No-op unsubscribe
  }
  
  // Handler for custom events (same window)
  const handleCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<WatchlistItem[]>
    callback(customEvent.detail || getWatchlist())
  }
  
  // Handler for storage events (cross-tab)
  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      callback(getWatchlist())
    }
  }
  
  window.addEventListener(CHANGE_EVENT, handleCustomEvent)
  window.addEventListener("storage", handleStorageEvent)
  
  return () => {
    window.removeEventListener(CHANGE_EVENT, handleCustomEvent)
    window.removeEventListener("storage", handleStorageEvent)
  }
}

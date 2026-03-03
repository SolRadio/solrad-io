'use client';

import { useState, useEffect } from "react"
import {
  getWatchlist,
  isWatched as checkIsWatched,
  toggleWatch as toggleWatchFn,
  addWatch as addWatchFn,
  removeWatch as removeWatchFn,
  clearWatchlist as clearWatchlistFn,
  subscribeWatchlist,
  type WatchlistItem,
} from "@/lib/watchlist"

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load initial watchlist
    setWatchlist(getWatchlist())
    setMounted(true)

    // Subscribe to changes
    const unsubscribe = subscribeWatchlist((updatedWatchlist) => {
      setWatchlist(updatedWatchlist)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // SSR-safe wrappers that only run on client
  const isWatched = (mint: string): boolean => {
    if (!mounted) return false
    return checkIsWatched(mint)
  }

  const toggleWatch = (
    mint: string,
    tokenMeta?: { symbol?: string; name?: string; image?: string }
  ): boolean => {
    if (!mounted) return false
    return toggleWatchFn(mint, tokenMeta)
  }

  const addWatch = (
    mint: string,
    tokenMeta?: { symbol?: string; name?: string; image?: string }
  ): void => {
    if (!mounted) return
    addWatchFn(mint, tokenMeta)
  }

  const removeWatch = (mint: string): void => {
    if (!mounted) return
    removeWatchFn(mint)
  }

  const clearWatchlist = (): void => {
    if (!mounted) return
    clearWatchlistFn()
  }

  return {
    watchlist,
    isWatched,
    toggleWatch,
    addWatch,
    removeWatch,
    clearWatchlist,
    mounted, // Export to avoid hydration mismatches
  }
}

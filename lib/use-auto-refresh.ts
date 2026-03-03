"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export interface UseAutoRefreshOptions {
  /** Base interval in milliseconds */
  intervalMs: number
  /** Whether auto-refresh is enabled (default true) */
  enabled?: boolean
  /** Async callback invoked each tick. Receives an AbortSignal you can pass to fetch. */
  onTick: (signal: AbortSignal) => Promise<void>
}

export interface UseAutoRefreshReturn {
  /** Timestamp of last successful tick completion */
  lastUpdatedAt: number | null
  /** True while an onTick call is in-flight */
  isRefreshing: boolean
  /** Trigger an immediate refresh (resets the timer) */
  refreshNow: () => void
}

/**
 * Client-side auto-refresh hook.
 * - Pauses when the tab is hidden (document.visibilityState)
 * - Adds +-10% jitter to prevent thundering-herd
 * - Prevents overlapping calls (skips tick if previous still running)
 * - Cancels in-flight request via AbortController when a new tick starts
 */
export function useAutoRefresh({
  intervalMs,
  enabled = true,
  onTick,
}: UseAutoRefreshOptions): UseAutoRefreshReturn {
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const runningRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onTickRef = useRef(onTick)
  onTickRef.current = onTick

  // Jittered interval: +-10%
  const jitter = useCallback(() => {
    const factor = 0.9 + Math.random() * 0.2 // 0.9 – 1.1
    return Math.round(intervalMs * factor)
  }, [intervalMs])

  const doTick = useCallback(async () => {
    if (runningRef.current) return // skip overlapping
    if (document.visibilityState === "hidden") return // paused when hidden

    // Cancel any in-flight from previous tick
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    runningRef.current = true
    setIsRefreshing(true)
    try {
      await onTickRef.current(controller.signal)
      if (!controller.signal.aborted) {
        setLastUpdatedAt(Date.now())
      }
    } catch (err) {
      // Swallow AbortError silently
      if (err instanceof Error && err.name === "AbortError") return
      // Other errors: logged but don't break the interval loop
      console.error("[auto-refresh] tick error:", err)
    } finally {
      runningRef.current = false
      setIsRefreshing(false)
    }
  }, [])

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      doTick().then(scheduleNext)
    }, jitter())
  }, [doTick, jitter])

  // Manual refresh: runs immediately, then reschedules
  const refreshNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    doTick().then(scheduleNext)
  }, [doTick, scheduleNext])

  // Main effect: start/stop based on `enabled`
  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearTimeout(timerRef.current)
      abortRef.current?.abort()
      return
    }

    // Schedule first tick
    scheduleNext()

    // Visibility handler: resume on tab focus
    const onVisibility = () => {
      if (document.visibilityState === "visible" && enabled) {
        // Run immediately when tab becomes visible again
        if (timerRef.current) clearTimeout(timerRef.current)
        doTick().then(scheduleNext)
      }
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      abortRef.current?.abort()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [enabled, scheduleNext, doTick])

  return { lastUpdatedAt, isRefreshing, refreshNow }
}

"use client"

import { useState, useEffect, useCallback } from "react"

export type PushPreferences = {
  scoreAlerts: boolean
  signalUpgrades: boolean
  leadTimeProofs: boolean
  minScore: number
}

const DEFAULT_PREFS: PushPreferences = {
  scoreAlerts: true,
  signalUpgrades: true,
  leadTimeProofs: false,
  minScore: 60,
}

const PREFS_KEY = "solrad:push:prefs"

function getStoredPrefs(): PushPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFS
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [preferences, setPreferences] = useState<PushPreferences>(DEFAULT_PREFS)
  const [error, setError] = useState<string | null>(null)

  // Check support and current state on mount
  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window

    setIsSupported(supported)

    if (!supported) return

    setPermission(Notification.permission)
    setPreferences(getStoredPrefs())

    // Check existing subscription
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub)
      })
    })

    // Register service worker
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silent - SW may already be registered
    })
  }, [])

  const subscribe = useCallback(async () => {
    if (!isSupported) return
    setIsLoading(true)
    setError(null)

    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== "granted") {
        setError("Notification permission denied")
        setIsLoading(false)
        return
      }

      const reg = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidKey) {
        setError("Push not configured")
        setIsLoading(false)
        return
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const prefs = getStoredPrefs()

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), preferences: prefs }),
      })

      if (!res.ok) throw new Error("Server rejected subscription")

      setIsSubscribed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Subscription failed")
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  const unsubscribe = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()

      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }

      setIsSubscribed(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unsubscribe failed")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updatePreferences = useCallback(
    async (newPrefs: Partial<PushPreferences>) => {
      const merged = { ...preferences, ...newPrefs }
      setPreferences(merged)
      localStorage.setItem(PREFS_KEY, JSON.stringify(merged))

      // Re-subscribe with new preferences if currently subscribed
      if (isSubscribed) {
        try {
          const reg = await navigator.serviceWorker.ready
          const sub = await reg.pushManager.getSubscription()
          if (sub) {
            await fetch("/api/push/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ subscription: sub.toJSON(), preferences: merged }),
            })
          }
        } catch {
          // Silent - prefs saved locally regardless
        }
      }
    },
    [preferences, isSubscribed]
  )

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

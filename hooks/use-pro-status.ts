"use client"
import { useEffect, useState } from "react"

// DEV BYPASS: set NEXT_PUBLIC_BYPASS_PRO_AUTH=true to skip Pro check
const bypassPro = process.env.NEXT_PUBLIC_BYPASS_PRO_AUTH === "true"

export function useProStatus() {
  const [isPro, setIsPro] = useState(bypassPro)
  const [loading, setLoading] = useState(!bypassPro)

  useEffect(() => {
    if (bypassPro) return
    fetch("/api/user/pro-status")
      .then((r) => r.json())
      .then((data) => {
        setIsPro(data.isPro)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return { isPro, loading }
}

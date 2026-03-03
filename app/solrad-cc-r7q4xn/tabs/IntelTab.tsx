"use client"

import IntelClient from "@/app/admin/intel/IntelClient"

interface TabProps {
  adminHeaders: Record<string, string>
  password: string
}

/**
 * Intel tab wraps the existing IntelClient component.
 * IntelClient manages its own auth state -- since the CC already handles auth,
 * we pre-seed the sessionStorage keys that IntelClient checks on mount.
 */
export function IntelTab({ password }: TabProps) {
  // Pre-seed IntelClient's auth so it skips its own login screen
  if (typeof window !== "undefined") {
    sessionStorage.setItem("admin_alerts_auth", "true")
    sessionStorage.setItem("admin_alerts_pw", password)
  }

  return <IntelClient />
}

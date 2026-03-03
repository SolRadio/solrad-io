import type { Metadata } from "next"
import type React from "react"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "SOLRAD Command Center",
}

export default function CCLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

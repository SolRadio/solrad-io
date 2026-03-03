import React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Token Pool — SOLRAD",
  description: "SOLRAD Token Pool: tokens scoring 50+ tracked in one place with continuously refreshed metrics, scores, and risk signals.",
}

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

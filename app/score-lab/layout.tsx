import React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Score Lab | Internal Evaluation Dashboard",
  description:
    "Internal SOLRAD evaluation dashboard for scoring system performance analysis. Win rates, snapshot analysis, and signal score validation.",
  alternates: {
    canonical: "https://www.solrad.io/score-lab",
  },
  robots: {
    index: false, // Internal tool - not for public indexing
    follow: false,
  },
}

export default function ScoreLabLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

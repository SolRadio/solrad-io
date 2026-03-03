import React from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function TrendingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {children}
      </main>
      <Footer />
    </>
  )
}

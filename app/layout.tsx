import type { Metadata } from "next"
import { Space_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { Toaster } from "sonner"
import { Analytics } from "@vercel/analytics/next"
import Navbar from "@/components/navbar"
import "./globals.css"

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
})

export const metadata: Metadata = {
  title: "SOLRAD — Solana Signal Intelligence",
  description: "Early token detection. On-chain verified.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" className={`${spaceMono.variable} dark`}>
        <body className="font-mono antialiased bg-[#000000] text-[#e5e5e5]">
          <Navbar />
          <div className="pt-14">
            {children}
          </div>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "#0a0a0a",
                border: "1px solid #1a1a1a",
                color: "#e5e5e5",
              },
            }}
          />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}

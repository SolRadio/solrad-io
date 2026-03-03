import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CookieConsent } from "@/components/cookie-consent"
import "./globals.css"
import {
  generateWebApplicationSchema,
  generateFinancialServiceSchema,
  generateDatasetSchema,
  generateOrganizationSchema,
  generateSiteNavigationSchema,
  generateWebSiteSchema,
  generateCombinedSchema,
} from "@/lib/schema"

const _geist = Geist({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL("https://www.solrad.io"),
  title: {
    default: "SOLRAD — Solana Token Intelligence Platform",
    template: "%s | SOLRAD",
  },
  description:
    "SOLRAD scores Solana tokens 0-100 using on-chain data. Detect early signals before price moves. Real intelligence, not noise. Free, no wallet required.",
  keywords:
    "Solana token scanner, Solana gems, Solana intelligence, find Solana gems, track Solana wallets, Solana risk analysis, Solana token analytics, DexScreener, Solana trending tokens, Solana on-chain data, token radar",
  authors: [{ name: "SOLRAD Team" }],
  creator: "SOLRAD",
  publisher: "SOLRAD",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  icons: {
    icon: [
      { url: "/brand/favicon.png", type: "image/png", sizes: "64x64" },
      { url: "/brand/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/brand/apple-180.png", type: "image/png", sizes: "180x180" },
    ],
    shortcut: "/brand/favicon.png",
  },
  openGraph: {
    title: "SOLRAD — Solana Token Intelligence Platform",
    description: "Live Solana market intelligence. Discover trending tokens, detect rug pulls early, and track smart wallet flows.",
    url: "https://www.solrad.io",
    siteName: "SOLRAD",
    images: [
      {
        url: "/brand/og-1200x630.png",
        width: 1200,
        height: 630,
        alt: "SOLRAD — Solana Token Intelligence",
        type: "image/png",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SOLRAD — Solana Token Intelligence Platform",
    description: "Live Solana market intelligence. Trending tokens, rug detection, wallet flows, and gem discovery.",
    images: [
      {
        url: "/brand/twitter-1200x630.png",
        width: 1200,
        height: 630,
        alt: "SOLRAD — Solana Token Intelligence",
      },
    ],
    creator: "@solrad_io",
    site: "@solrad_io",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.solrad.io",
  },
    generator: 'Next.js'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>

        
        {/* Sprint 4: DNS prefetch for Google Fonts to improve LCP */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Analytics prefetch */}
        <link rel="dns-prefetch" href="https://vercel-insights.com" />
        <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />
        
{/* Brand assets loaded via metadata.icons — no preload needed */}
        
        {/* Manifest link */}
        <link rel="manifest" href="/site.webmanifest" />
        
{/* Favicon/icon tags are emitted by the metadata.icons export above — no manual duplicates needed */}
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              generateCombinedSchema(
                generateWebSiteSchema(),
                generateWebApplicationSchema(),
                generateFinancialServiceSchema(),
                generateDatasetSchema(),
                generateOrganizationSchema(),
                generateSiteNavigationSchema()
              )
            ),
          }}
        />
      </head>
      <body className={`font-sans antialiased`}>
        <ClerkProvider
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "hsl(var(--primary))",
              colorBackground: "hsl(var(--card))",
              colorText: "hsl(var(--foreground))",
              colorTextSecondary: "hsl(var(--muted-foreground))",
              colorInputBackground: "hsl(var(--background))",
              colorInputText: "hsl(var(--foreground))",
              borderRadius: "0.5rem",
            },
          }}
          telemetry={false}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          afterSignOutUrl="/"
          dynamic
        >
          <TooltipProvider delayDuration={150}>
            {children}
          </TooltipProvider>
          <Analytics />
          <Toaster />
          <CookieConsent />
        </ClerkProvider>
      </body>
    </html>
  )
}

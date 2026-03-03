"use client"

import Image from "next/image"
import Link from "next/link"
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Radar, Flame, Info, Bell, Trophy, Shield, Search, FlaskConical, Activity, Wallet, BellRing, Crown, LogIn, FileText } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ThemeToggle } from "./theme-toggle"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useNavbarMetadata } from "@/hooks/use-navbar-metadata"

import { Menu, ChevronDown } from "lucide-react"


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NavbarProps {
  onRefresh?: () => void
  isRefreshing?: boolean
  lastUpdated?: number
  // PART C: Stale indicator props
  stale?: boolean
  staleSeverity?: "low" | "high" | null
  // Token count for coverage display
  tokenCount?: number
}

export function Navbar({ onRefresh, isRefreshing, lastUpdated, stale, staleSeverity, tokenCount }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const [userPlan, setUserPlan] = useState<"pro" | "free" | "anonymous">("anonymous")

  
  // Fetch real navbar metadata from API
  const { metadata } = useNavbarMetadata()

  useEffect(() => {
    fetch("/api/user/plan")
      .then((r) => r.json())
      .then((d) => { if (d?.plan) setUserPlan(d.plan) })
      .catch(() => {})
  }, [])

  const navItems = [
    { label: "DASHBOARD", href: "/dashboard", icon: Radar },
    { label: "TOKEN POOL", href: "/browse", icon: Search },
    { label: "SIGNAL OUTCOMES", href: "/signals", icon: Activity },
    { label: "TOP PERFORMERS", href: "/tracker", icon: Trophy },
    { label: "PROOF ENGINE", href: "/research", icon: FlaskConical },
  ]
  
  const comingSoonItems = [
    { label: "WALLETS", href: "/wallets", icon: Wallet, description: "Whale Tracker" },
    { label: "ALERTS", href: "/alerts", icon: BellRing, description: "Smart Notifications" },
    { label: "PRO", href: "/pro", icon: Crown, description: "Premium Features" },
  ]

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 w-full overflow-hidden">
        <div className="w-full px-4 md:px-6 bg-black">
          {/* Mobile: 3-column layout (hamburger left, logo center, actions right) */}
          <div className="flex lg:hidden h-16 items-center justify-between gap-2 min-w-0">
            {/* Left: Mobile menu (hamburger) */}
            <div className="flex items-center w-[80px]">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[85vw] max-w-[400px] pb-[calc(env(safe-area-inset-bottom)+1rem)] overflow-y-auto"
                >
                  <div className="flex flex-col gap-4 mt-8">
                    <Link href="/" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start uppercase font-bold font-mono text-xs tracking-widest text-zinc-400 hover:text-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse mr-2" />
                        RADAR
                      </Button>
                    </Link>
                    {navItems.map((item) => {
                      if (item.hasSubmenu && item.label === "TRENDING TOKENS") {
                        return (
                          <div key={item.label} className="flex flex-col">
                            <Link href={item.href} onClick={() => setMobileOpen(false)}>
                              <Button variant="ghost" className="w-full justify-start uppercase font-bold">
                                <item.icon className="h-4 w-4 mr-2" />
                                {item.label}
                              </Button>
                            </Link>
                            <div className="ml-6 mt-2 flex flex-col gap-2">
                              <Link href="/solana-token-scanner" onClick={() => setMobileOpen(false)}>
                                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                                  <Search className="h-3 w-3 mr-2" />
                                  Token Scanner
                                </Button>
                              </Link>
                            </div>
                          </div>
                        )
                      }
                      return (
                        <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start uppercase font-bold">
                            <item.icon className="h-4 w-4 mr-2" />
                            {item.label}
                          </Button>
                        </Link>
                      )
                    })}
                    
                    {/* Proof Protocol */}
                    <Link href="/proof-protocol" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start uppercase font-bold">
                        <Shield className="h-4 w-4 mr-2 text-green-500" />
                        PROOF PROTOCOL
                      </Button>
                    </Link>
                    <Link href="/whitepaper" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start uppercase font-bold">
                        <FileText className="h-4 w-4 mr-2 text-green-500" />
                        WHITEPAPER
                      </Button>
                    </Link>

                    {/* Roadmap Items */}
                    <div className="border-t pt-3 mt-2">
                      <p className="text-xs font-semibold text-muted-foreground px-4 mb-2 uppercase tracking-wide">Roadmap</p>
                      {comingSoonItems.map((item) => {
                        const IconComponent = item.icon
                        return (
                          <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start">
                              <IconComponent className="h-4 w-4 mr-2" />
                              <div className="flex flex-col items-start">
                                <span className="uppercase text-xs font-bold">{item.label}</span>
                                <span className="text-[10px] text-muted-foreground normal-case">{item.description}</span>
                              </div>
                              <Badge variant="secondary" className="ml-auto text-[9px]">
                                SOON
                              </Badge>
                            </Button>
                          </Link>
                        )
                      })}
                    </div>
                    
                    {onRefresh && (
                      <Button onClick={onRefresh} disabled={isRefreshing} className="w-full uppercase font-bold mt-4">
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                        REFRESH
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Center: Logo (absolute center) */}
            <div className="absolute left-1/2 -translate-x-1/2">
              <Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
                <Image
                  src="/images/solradWB.png"
                  alt="SOLRAD"
                  width={160}
                  height={32}
                  className="h-auto w-32"
                  priority
                />
              </Link>
            </div>

            {/* Tablet only: Small LIVE indicator between logo and actions */}
            {lastUpdated && (
              <div className="hidden md:flex lg:hidden items-center gap-1 absolute left-1/2 translate-x-[90px]">
                {stale ? (
                  <>
                    <div className={`h-1.5 w-1.5 rounded-full ${staleSeverity === "high" ? "bg-red-500" : "bg-yellow-500"} animate-pulse`} />
                    <span className={`text-[9px] font-semibold uppercase ${staleSeverity === "high" ? "text-red-500" : "text-yellow-500"}`}>
                      STALE
                    </span>
                  </>
                ) : (
                  <>
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 breathe-dot" />
                    <span className="text-[9px] font-semibold uppercase text-green-500">LIVE</span>
                  </>
                )}
              </div>
            )}

            {/* Right: Actions (Auth + Admin + Theme) */}
            <div className="flex items-center gap-1 w-[100px] justify-end">
              <SignedOut>
                <SignInButton mode="redirect" forceRedirectUrl="/sign-in">
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <LogIn className="h-4 w-4" />
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center gap-1">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "h-7 w-7",
                      },
                    }}
                  />
                  {userPlan === "pro" && (
                    <Link href="/pro-hub" className="text-[9px] font-mono bg-amber-400 text-zinc-950 rounded-full px-1.5 py-0.5 font-bold hover:bg-amber-300 transition-colors">
                      PRO
                    </Link>
                  )}
                </div>
              </SignedIn>
              <ThemeToggle />
            </div>
          </div>

          {/* Desktop: 3-zone full-width layout */}
          <div className="hidden lg:flex h-12 items-center w-full">
            {/* LEFT: Logo pinned hard left */}
            <div className="flex items-center shrink-0">
              <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
                <Image
                  src="/images/solradWB.png"
                  alt="SOLRAD"
                  width={160}
                  height={32}
                  className="h-auto w-36"
                  priority
                />
              </Link>
            </div>

            {/* CENTER: Nav tabs centered and evenly spaced */}
            <div className="flex-1 flex items-center justify-center gap-4 whitespace-nowrap">
              <Link href="/" className="font-mono text-xs tracking-widest text-zinc-400 hover:text-green-400 transition-colors flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                RADAR
              </Link>
              {navItems.map((item) => {
                if (item.hasSubmenu && item.label === "TRENDING TOKENS") {
                  return (
                    <DropdownMenu key={item.label}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="uppercase text-xs font-bold tracking-wide">
                          <item.icon className="h-4 w-4 mr-2" />
                          {item.label}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem asChild>
                          <Link href="/#trending" className="cursor-pointer">
                            <Flame className="h-4 w-4 mr-2" />
                            View Trending
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/solana-token-scanner" className="cursor-pointer">
                            <Search className="h-4 w-4 mr-2" />
                            Token Scanner
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                }
                return (
                  <Link key={item.href} href={item.href} className="focus-visible:outline-none">
                    <Button variant="ghost" size="sm" className="uppercase text-xs font-bold tracking-wide ml-0 mr-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
              
              {/* Roadmap dropdown - lower visual weight */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs font-medium tracking-wide text-muted-foreground hover:text-foreground">
                    MORE
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64">
                  <div className="px-2 py-1.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Roadmap</p>
                  </div>
                  {comingSoonItems.map((item) => {
                    const IconComponent = item.icon
                    return (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className="cursor-pointer flex items-center py-3">
                          <IconComponent className="h-4 w-4 mr-3 text-primary" />
                          <div className="flex flex-col flex-1">
                            <span className="text-sm font-semibold uppercase">{item.label}</span>
                            <span className="text-xs text-muted-foreground">{item.description}</span>
                          </div>
                          <Badge variant="secondary" className="ml-2 text-[9px]">
                            SOON
                          </Badge>
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                  <DropdownMenuItem asChild>
                    <Link href="/saw-it-first" className="cursor-pointer flex items-center py-3">
                      <Trophy className="h-4 w-4 mr-3 text-green-500" />
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-semibold uppercase">SAW IT FIRST</span>
                        <span className="text-xs text-muted-foreground">Verified Detections</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/scoring" className="cursor-pointer flex items-center py-3">
                      <Info className="h-4 w-4 mr-3 text-muted-foreground" />
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-semibold uppercase">HOW SCORING WORKS</span>
                        <span className="text-xs text-muted-foreground">Methodology</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/proof-protocol" className="cursor-pointer flex items-center py-3">
                      <Shield className="h-4 w-4 mr-3 text-green-500" />
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-semibold uppercase">PROOF PROTOCOL</span>
                        <span className="text-xs text-muted-foreground">On-Chain Verification</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/whitepaper" className="cursor-pointer flex items-center py-3">
                      <FileText className="h-4 w-4 mr-3 text-green-500" />
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-semibold uppercase">WHITEPAPER</span>
                        <span className="text-xs text-muted-foreground">Technical Specification</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* RIGHT: Actions pinned hard right */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Status Indicator - PART C: Stale-aware with Data Confidence */}
              {(lastUpdated || metadata.updatedAt) && (
                <div className="hidden xl:flex flex-col gap-0.5 text-xs text-muted-foreground mr-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {stale ? (
                        <>
                          <div className={`h-2 w-2 rounded-full ${staleSeverity === "high" ? "bg-red-500" : "bg-yellow-500"} animate-pulse`} />
                          <span className={`uppercase font-semibold ${staleSeverity === "high" ? "text-red-500" : "text-yellow-500"}`}>
                            STALE
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="h-2 w-2 rounded-full bg-green-500 breathe-dot" />
                          <span className="uppercase font-semibold text-green-500">LIVE</span>
                        </>
                      )}
                    </div>
                    <span>•</span>
                    <span>{stale ? `Last good ${formatDistanceToNow(lastUpdated || metadata.updatedAt || Date.now(), { addSuffix: false })} ago` : formatDistanceToNow(lastUpdated || metadata.updatedAt || Date.now(), { addSuffix: true })}</span>
                  </div>
                  
                  {/* Data Confidence line - uses real metadata from API */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 cursor-help">
                          <span>Sources: {metadata.sources.join(" + ")}</span>
                          <span>•</span>
                          <span>Coverage: {tokenCount || metadata.tokenCount} tokens</span>
                          <Info className="h-3 w-3 opacity-50" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[280px]">
                        <div className="space-y-1.5 text-xs">
                          <p className="font-semibold">Data Confidence</p>
                          <p className="text-muted-foreground">
                            Read-only analysis from {metadata.sources.join(", ")} sources. No wallet keys required.
                          </p>
                          <p className="text-muted-foreground">
                            Scores are heuristics based on liquidity, volume, holder patterns, and wash detection. Always DYOR.
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}

              {/* Clerk Auth */}
              <SignedOut>
                <SignInButton mode="redirect" forceRedirectUrl="/sign-in">
                  <Button variant="outline" size="sm" className="text-xs font-bold uppercase tracking-wide gap-1.5">
                    <LogIn className="h-3.5 w-3.5" />
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center gap-1.5">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "h-8 w-8",
                        userButtonPopoverCard: "bg-card border border-border",
                        userButtonPopoverActionButton: "text-foreground hover:bg-muted",
                        userButtonPopoverFooter: "hidden",
                      },
                    }}
                  />
                  {userPlan === "pro" && (
                    <Link href="/pro-hub" className="text-[10px] font-mono bg-amber-400 text-zinc-950 rounded-full px-2 py-0.5 font-bold hover:bg-amber-300 transition-colors">
                      PRO
                    </Link>
                  )}
                </div>
              </SignedIn>

              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

    </>
  )
}

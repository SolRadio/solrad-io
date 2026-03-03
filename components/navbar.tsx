"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser, useClerk } from "@clerk/nextjs"

const NAV_LINKS = [
  { label: "RADAR", href: "/radar", hasPulse: true },
  { label: "SIGNALS", href: "/signals", hasPulse: false },
  { label: "PROOF", href: "/proof-protocol", hasPulse: false },
]

function truncateEmail(email: string, max = 18): string {
  if (email.length <= max) return email
  return email.slice(0, max) + "..."
}

export default function Navbar() {
  const { isSignedIn, user } = useUser()
  const { signOut, openSignIn } = useClerk()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  const email = user?.primaryEmailAddress?.emailAddress ?? ""

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-[#27272a] px-4 sm:px-6"
      style={{ backgroundColor: "#000000" }}
    >
      {/* Left: Wordmark */}
      <Link
        href="/"
        className="flex-shrink-0 text-base font-bold tracking-[0.3em] uppercase text-foreground transition-opacity hover:opacity-80"
      >
        SOLRAD
      </Link>

      {/* Center: Desktop nav links */}
      <div className="hidden items-center gap-8 md:flex">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors"
              style={{
                color: isActive ? "#00ff88" : "#a1a1aa",
              }}
            >
              {link.hasPulse && (
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: "#00ff88",
                    animation: "pulse-glow 2s ease-in-out infinite",
                  }}
                />
              )}
              {link.label}
            </Link>
          )
        })}
      </div>

      {/* Right: Auth controls (desktop) */}
      <div className="hidden items-center gap-3 md:flex">
        {!isSignedIn ? (
          <>
            <button
              onClick={() => openSignIn()}
              className="px-4 py-1.5 text-[11px] font-bold tracking-[0.15em] uppercase text-[#a1a1aa] transition-colors hover:text-foreground cursor-pointer"
            >
              SIGN IN
            </button>
            <Link
              href="/pro"
              className="px-4 py-1.5 text-[11px] font-bold tracking-[0.15em] uppercase transition-colors"
              style={{
                border: "1px solid #00ff88",
                color: "#00ff88",
              }}
            >
              JOIN $9.99
            </Link>
          </>
        ) : (
          <div className="relative">
            <button
              onClick={() => setAccountOpen(!accountOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold tracking-[0.1em] uppercase text-foreground transition-colors hover:text-green cursor-pointer"
            >
              <span className="text-[#a1a1aa]">{truncateEmail(email)}</span>
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                className="transition-transform"
                style={{
                  transform: accountOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                <path
                  d="M1 1L5 5L9 1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {accountOpen && (
              <>
                {/* Backdrop to close dropdown */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setAccountOpen(false)}
                />
                <div
                  className="absolute right-0 top-full z-50 mt-2 flex w-48 flex-col border border-[#27272a] py-1"
                  style={{ backgroundColor: "#0a0a0a" }}
                >
                  <Link
                    href="/signals"
                    onClick={() => setAccountOpen(false)}
                    className="px-4 py-2.5 text-[11px] font-bold tracking-[0.15em] uppercase text-[#a1a1aa] transition-colors hover:text-foreground hover:bg-[#1a1a1a]"
                  >
                    MY SIGNALS
                  </Link>
                  <button
                    onClick={() => {
                      setAccountOpen(false)
                      signOut()
                    }}
                    className="px-4 py-2.5 text-left text-[11px] font-bold tracking-[0.15em] uppercase text-[#a1a1aa] transition-colors hover:text-[#ff4444] hover:bg-[#1a1a1a] cursor-pointer"
                  >
                    SIGN OUT
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile: Hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="flex h-8 w-8 flex-col items-center justify-center gap-1.5 md:hidden cursor-pointer"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        <span
          className="block h-px w-5 transition-all duration-200"
          style={{
            backgroundColor: "#a1a1aa",
            transform: mobileOpen
              ? "rotate(45deg) translate(2px, 2px)"
              : "none",
          }}
        />
        <span
          className="block h-px w-5 transition-all duration-200"
          style={{
            backgroundColor: "#a1a1aa",
            opacity: mobileOpen ? 0 : 1,
          }}
        />
        <span
          className="block h-px w-5 transition-all duration-200"
          style={{
            backgroundColor: "#a1a1aa",
            transform: mobileOpen
              ? "rotate(-45deg) translate(2px, -2px)"
              : "none",
          }}
        />
      </button>

      {/* Mobile: Slide-down menu */}
      {mobileOpen && (
        <div
          className="absolute left-0 top-14 right-0 z-50 flex flex-col border-b border-[#27272a] md:hidden"
          style={{ backgroundColor: "#000000" }}
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 border-b border-[#27272a]/50 px-6 py-4 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors"
                style={{
                  color: isActive ? "#00ff88" : "#a1a1aa",
                }}
              >
                {link.hasPulse && (
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: "#00ff88",
                      animation: "pulse-glow 2s ease-in-out infinite",
                    }}
                  />
                )}
                {link.label}
              </Link>
            )
          })}

          {/* Mobile auth */}
          <div className="flex flex-col gap-0 border-t border-[#27272a]">
            {!isSignedIn ? (
              <>
                <button
                  onClick={() => {
                    setMobileOpen(false)
                    openSignIn()
                  }}
                  className="px-6 py-4 text-left text-[11px] font-bold tracking-[0.15em] uppercase text-[#a1a1aa] transition-colors hover:text-foreground cursor-pointer"
                >
                  SIGN IN
                </button>
                <Link
                  href="/pro"
                  onClick={() => setMobileOpen(false)}
                  className="mx-6 mb-4 flex items-center justify-center px-4 py-3 text-[11px] font-bold tracking-[0.15em] uppercase transition-colors"
                  style={{
                    border: "1px solid #00ff88",
                    color: "#00ff88",
                  }}
                >
                  JOIN $9.99
                </Link>
              </>
            ) : (
              <>
                <div className="px-6 py-3 text-[10px] tracking-[0.1em] uppercase text-[#525252]">
                  {email}
                </div>
                <Link
                  href="/signals"
                  onClick={() => setMobileOpen(false)}
                  className="px-6 py-4 text-[11px] font-bold tracking-[0.15em] uppercase text-[#a1a1aa] transition-colors hover:text-foreground"
                >
                  MY SIGNALS
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false)
                    signOut()
                  }}
                  className="px-6 py-4 text-left text-[11px] font-bold tracking-[0.15em] uppercase text-[#a1a1aa] transition-colors hover:text-[#ff4444] cursor-pointer"
                >
                  SIGN OUT
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const CONSENT_KEY = "solrad_cookie_consent"

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem(CONSENT_KEY)
    if (!consent) {
      // Small delay to prevent flash on initial page load
      setTimeout(() => setIsVisible(true), 500)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "true")
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[420px] px-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-4 backdrop-blur-sm">
        <div className="space-y-3">
          {/* Title */}
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Privacy Notice
          </div>
          
          {/* Body Text */}
          <p className="text-sm text-zinc-300 leading-relaxed">
            SOLRAD uses essential cookies to ensure platform functionality and performance insights. 
            No wallets, keys, or personal data are collected.
          </p>
          
          {/* Links and Button */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3 text-xs">
              <Link 
                href="/privacy" 
                className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2 transition-colors"
              >
                Privacy Policy
              </Link>
              <span className="text-zinc-700">|</span>
              <Link 
                href="/privacy#cookies" 
                className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2 transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
            
            <Button
              onClick={handleAccept}
              size="sm"
              className="shrink-0 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 h-8 px-4 text-xs font-medium"
            >
              Got it
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

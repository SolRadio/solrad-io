"use client"

import React from "react"

import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWatchlist } from "@/hooks/use-watchlist"
import { cn } from "@/lib/utils"

interface WatchlistButtonProps {
  mint: string
  tokenMeta?: {
    symbol?: string
    name?: string
    image?: string
  }
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showLabel?: boolean
}

export function WatchlistButton({
  mint,
  tokenMeta,
  variant = "ghost",
  size = "icon",
  className,
  showLabel = false,
}: WatchlistButtonProps) {
  const { isWatched, toggleWatch, mounted } = useWatchlist()
  
  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn("opacity-0", className)}
        disabled
      >
        <Star className="h-4 w-4" />
        {showLabel && <span className="ml-2">Watchlist</span>}
      </Button>
    )
  }

  const watched = isWatched(mint)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWatch(mint, tokenMeta)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(
        "transition-all duration-200 hover:scale-105 active:scale-95 bg-transparent",
        watched && "text-yellow-500 hover:text-yellow-600",
        !watched && "text-muted-foreground hover:text-foreground",
        className
      )}
      aria-label={watched ? "Remove from Watchlist" : "Add to Watchlist"}
    >
      <Star
        className={cn(
          "h-4 w-4 transition-all",
          watched && "fill-yellow-500"
        )}
      />
      {showLabel && (
        <span className="ml-2">{watched ? "Watching" : "Watch"}</span>
      )}
    </Button>
  )
}

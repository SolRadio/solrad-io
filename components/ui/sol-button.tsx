"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface SolButtonProps {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  variant?: "primary" | "secondary"
  className?: string
  disabled?: boolean
  type?: "button" | "submit"
}

export function SolButton({
  children,
  href,
  onClick,
  variant = "primary",
  className,
  disabled = false,
  type = "button",
}: SolButtonProps) {
  const base = cn(
    "inline-flex items-center justify-center font-mono text-xs font-bold uppercase tracking-[0.2em] transition-colors",
    "border px-6 py-3",
    variant === "primary"
      ? "border-primary text-primary hover:bg-primary/10"
      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
    disabled && "pointer-events-none opacity-40",
    className,
  )

  if (href) {
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} onClick={onClick} className={base} disabled={disabled}>
      {children}
    </button>
  )
}

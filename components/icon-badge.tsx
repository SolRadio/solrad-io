'use client'

import React from "react"

import { Type as type, LucideIcon } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { useState, useEffect } from 'react'

interface IconBadgeProps {
  icon: LucideIcon
  label: string
  color: 'success' | 'primary' | 'yellow' | 'accent' | 'teal' | 'violet'
  title: string
}

const colorClasses = {
  success: 'bg-success/10 border-success/30 text-success shadow-[0_0_8px_rgba(34,197,94,0.2)]',
  primary: 'bg-primary/10 border-primary/30 text-primary shadow-[0_0_8px_rgba(112,26,255,0.2)]',
  yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.2)]',
  accent: 'bg-accent/10 border-accent/30 text-accent shadow-[0_0_8px_rgba(147,51,234,0.2)]',
  teal: 'bg-teal-500/10 border-teal-500/30 text-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.2)]',
  violet: 'bg-violet-950 border-primary/30 text-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.2)]',
}

export function IconBadge({ icon: Icon, label, color, title }: IconBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  // Detect touch device on mount
  useEffect(() => {
    const checkTouch = () => {
      // Check for touch support and coarse pointer (mobile/tablet)
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches
      setIsTouchDevice(hasTouch || hasCoarsePointer)
    }
    
    checkTouch()
    
    // Re-check on resize (for responsive testing)
    window.addEventListener('resize', checkTouch)
    return () => window.removeEventListener('resize', checkTouch)
  }, [])

  const handleClick = (e: React.MouseEvent) => {
    if (isTouchDevice) {
      e.preventDefault()
      e.stopPropagation()
      setIsOpen(!isOpen)
    }
  }

  const handleOpenChange = (open: boolean) => {
    // On desktop (hover), let Radix control the tooltip
    // On mobile (tap), we control it with state
    if (!isTouchDevice) {
      setIsOpen(open)
    }
  }

  return (
    <TooltipProvider delayDuration={isTouchDevice ? 0 : 200}>
      <Tooltip open={isOpen} onOpenChange={handleOpenChange}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full border backdrop-blur-sm transition-all hover:scale-110 active:scale-95 ${colorClasses[color]}`}
            aria-label={label}
            aria-expanded={isOpen}
            aria-describedby={`badge-${label.toLowerCase().replace(/\s+/g, '-')}`}
            title={title}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          sideOffset={4}
          id={`badge-${label.toLowerCase().replace(/\s+/g, '-')}`}
          onPointerDownOutside={() => isTouchDevice && setIsOpen(false)}
        >
          <span className="font-medium">{label}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

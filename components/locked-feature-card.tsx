import React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ComingSoonPill } from "./coming-soon-pill"
import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"

interface LockedFeatureCardProps {
  title: string
  description: string
  details?: string
  icon?: React.ReactNode
  className?: string
}

export function LockedFeatureCard({
  title,
  description,
  details,
  icon,
  className,
}: LockedFeatureCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {/* Lock overlay — reduced blur so content creates FOMO */}
      <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px] z-10 flex items-center justify-center">
        <Lock className="h-6 w-6 text-muted-foreground/40" />
      </div>
      
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {icon && <div className="shrink-0">{icon}</div>}
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <ComingSoonPill />
        </div>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      
      {details && (
        <CardContent>
          <p className="text-sm text-muted-foreground font-mono">{details}</p>
        </CardContent>
      )}
    </Card>
  )
}

import { cn } from "@/lib/utils"

interface SectionHeadingProps {
  children: React.ReactNode
  className?: string
  /** Show a horizontal rule below the heading */
  rule?: boolean
  /** Render as a specific heading level */
  as?: "h1" | "h2" | "h3" | "h4"
  /** Optional subheading text rendered below */
  sub?: string
}

export function SectionHeading({
  children,
  className,
  rule = true,
  as: Tag = "h2",
  sub,
}: SectionHeadingProps) {
  return (
    <div className={cn("mb-10", className)}>
      <Tag className="font-mono text-sm font-bold uppercase tracking-[0.3em] text-foreground">
        {children}
      </Tag>
      {sub && (
        <p className="mt-2 font-mono text-sm text-muted-foreground" style={{ letterSpacing: "0.05em" }}>
          {sub}
        </p>
      )}
      {rule && (
        <div className="mt-3 h-px w-full bg-border" />
      )}
    </div>
  )
}

"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface FilterBarProps {
  sortBy: string
  onSortChange: (sort: string) => void
}

export function FilterBar({ sortBy, onSortChange }: FilterBarProps) {
  const sortOptions = [
    { value: "score", label: "Score" },
    { value: "volume", label: "Volume" },
    { value: "price", label: "Price Change" },
    { value: "liquidity", label: "Liquidity" },
  ]

  return (
    <div className="flex flex-wrap items-center gap-3 justify-between">
      <Badge variant="secondary" className="text-sm font-medium">
        ⚡ Solana Network Only
      </Badge>

      <div className="flex items-center gap-2 ml-auto">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

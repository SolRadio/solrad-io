"use client"

import type { TokenScore } from "@/lib/types"
import { TokenDetailDrawer } from "@/components/token-detail-drawer"

export function TokenDetailDrawerPage({ token }: { token: TokenScore }) {
  return (
    <TokenDetailDrawer
      token={token}
      open={true}
      onOpenChange={() => {}}
      isStandalonePage={true}
    />
  )
}

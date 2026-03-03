import { SignIn } from "@clerk/nextjs"
import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="mb-8 text-center">
        <p className="text-2xl font-bold tracking-tight text-foreground">
          {"S\u25CFLRAD"}
        </p>
        <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-widest">
          Solana Intelligence Terminal
        </p>
      </div>

      <SignIn />

      <p className="text-[10px] text-muted-foreground font-mono mt-6">
        {"Read-only \u00B7 No wallet required \u00B7 No keys stored"}
      </p>
    </div>
  )
}

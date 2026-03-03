import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export async function GET(req: Request) {
  const password = req.headers.get('x-admin-password')
  if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Check all 3 possible lead-time keys
  const [primary, alt1, alt2] = await Promise.all([
    kv.get('solrad:leadtime:recent'),
    kv.get('solrad:leadtime:proofs:recent'),
    kv.get('leadtime:recent'),
  ])

  // Check signal states — what tokens have signal state data
  const signalStates = await kv.get('solrad:signal-states')

  // Check snapshot index
  const index = await kv.get('solrad:index')
  const tokenCount = Array.isArray(index) ? index.length : 0

  // Check a few recent snapshots to see if scores are changing
  const sampleMints = Array.isArray(index) ? index.slice(0, 5) : []
  const sampleSnapshots = await Promise.all(
    sampleMints.map(async (mint: string) => {
      const snapshots = await kv.get(`solrad:snapshots:${mint}`)
      const token = await kv.get(`solrad:token:${mint}`)
      return {
        mint: mint.slice(0, 8) + '...',
        snapshotCount: Array.isArray(snapshots) ? snapshots.length : 0,
        currentScore: (token as any)?.score ?? null,
        signalState: (token as any)?.signalState ?? null,
      }
    })
  )

  return NextResponse.json({
    leadtime: {
      primary: primary ? `HAS DATA (${JSON.stringify(primary).slice(0, 100)})` : 'EMPTY',
      alt1: alt1 ? `HAS DATA` : 'EMPTY',
      alt2: alt2 ? `HAS DATA` : 'EMPTY',
    },
    signalStates: signalStates
      ? `EXISTS — ${Object.keys(signalStates as object).length} entries`
      : 'MISSING — this is likely the problem',
    tokenCount,
    sampleTokens: sampleSnapshots,
  })
}

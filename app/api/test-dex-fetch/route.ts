import { NextResponse } from "next/server"

/**
 * Test endpoint to fetch a single token from DexScreener and see its structure
 * Call with ?symbol=TRUMP to test a specific token
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol") || "TRUMP"
  
  try {
    // Fetch from DexScreener search
    const searchUrl = `https://api.dexscreener.com/latest/dex/search/?q=${symbol}`
    const response = await fetch(searchUrl)
    const data = await response.json()
    
    // Find the best Solana pair
    const solanaPairs = data.pairs?.filter((p: any) => p.chainId === "solana") || []
    const bestPair = solanaPairs[0]
    
    if (!bestPair) {
      return NextResponse.json({ error: "No Solana pairs found" })
    }
    
    // Return the structure so we can see what fields exist
    return NextResponse.json({
      symbol: bestPair.baseToken.symbol,
      pairAddress: bestPair.pairAddress,
      baseToken: {
        address: bestPair.baseToken.address,
        name: bestPair.baseToken.name,
        symbol: bestPair.baseToken.symbol,
      },
      quoteToken: {
        address: bestPair.quoteToken?.address,
        name: bestPair.quoteToken?.name,
        symbol: bestPair.quoteToken?.symbol,
      },
      dexId: bestPair.dexId,
      url: bestPair.url,
      fullPair: bestPair,
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

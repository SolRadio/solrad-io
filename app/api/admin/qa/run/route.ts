import { type NextRequest, NextResponse } from "next/server"
import { getTokenIndexCached } from "@/lib/intel/tokenIndex"
import { getTrending, getActiveTrading, getNewEarly } from "@/lib/intel/queries"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"

interface QATestResult {
  testName: string
  pass: boolean
  reason?: string
  tokenSymbol?: string
  tokenMint?: string
  dexUrl?: string
}

interface QASummary {
  totalTests: number
  passed: number
  failed: number
  timestamp: string
  duration: number
}

interface QAReport {
  summary: QASummary
  results: QATestResult[]
  columnChecks: {
    newEarly: {
      pass: boolean
      failures: string[]
    }
    active: {
      pass: boolean
      failures: string[]
    }
    trending: {
      pass: boolean
      failures: string[]
    }
  }
}

/**
 * POST /api/admin/qa/run
 * Runs comprehensive QA checks on token data
 * Protected with OPS_PASSWORD - same auth as /admin pages
 */
export async function POST(request: NextRequest) {
  // Auth check using helper
  if (!verifyOpsPasswordFromHeader(request)) {
    console.warn("[v0] /api/admin/qa/run: Unauthorized attempt")
    return NextResponse.json(
      { error: "Access denied" },
      { status: 401 }
    )
  }
  
  const startTime = Date.now()
  
  try {
    
    console.log("[v0] QA: Starting comprehensive data quality check...")
    
    // Fetch token index
    const indexCache = await getTokenIndexCached()
    const allTokens = indexCache.tokens
    const trending = getTrending(allTokens)
    const active = getActiveTrading(allTokens)
    const newEarly = getNewEarly(allTokens)
    
    const results: QATestResult[] = []
    
    // Sample sets
    const trendingSample = trending.slice(0, 10)
    const activeSample = active.slice(0, 10)
    const newEarlySample = newEarly.slice(0, 10)
    const randomSample = allTokens
      .sort(() => Math.random() - 0.5)
      .slice(0, 10)
    
    // Helper function to test a token
    const testToken = async (token: any, source: string) => {
      // Test 1: Has mint address
      if (!token.mint || token.mint.length < 32) {
        results.push({
          testName: `${source}: Has valid mint`,
          pass: false,
          reason: "Missing or invalid mint address",
          tokenSymbol: token.symbol,
          tokenMint: token.mint,
        })
      } else {
        results.push({
          testName: `${source}: Has valid mint`,
          pass: true,
          tokenSymbol: token.symbol,
          tokenMint: token.mint,
        })
      }
      
      // Test 2: Has pairAddress
      if (!token.pairAddress) {
        results.push({
          testName: `${source}: Has pairAddress`,
          pass: false,
          reason: "Missing pairAddress",
          tokenSymbol: token.symbol,
          tokenMint: token.mint,
        })
      } else {
        results.push({
          testName: `${source}: Has pairAddress`,
          pass: true,
          tokenSymbol: token.symbol,
          tokenMint: token.mint,
        })
      }
      
      // Test 3: Has dexUrl and contains pairAddress
      if (!token.dexUrl) {
        results.push({
          testName: `${source}: Has dexUrl`,
          pass: false,
          reason: "Missing dexUrl",
          tokenSymbol: token.symbol,
          tokenMint: token.mint,
        })
      } else if (token.pairAddress && !token.dexUrl.includes(token.pairAddress)) {
        results.push({
          testName: `${source}: dexUrl contains pairAddress`,
          pass: false,
          reason: `dexUrl (${token.dexUrl}) doesn't contain pairAddress (${token.pairAddress})`,
          tokenSymbol: token.symbol,
          tokenMint: token.mint,
          dexUrl: token.dexUrl,
        })
      } else {
        results.push({
          testName: `${source}: dexUrl valid`,
          pass: true,
          tokenSymbol: token.symbol,
          tokenMint: token.mint,
          dexUrl: token.dexUrl,
        })
      }
      
      // Test 4: Quote endpoint returns valid JSON
      try {
        const quoteRes = await fetch(
          `${request.url.replace('/api/admin/qa/run', '')}/api/quote/${token.mint}`,
          {
            headers: {
              "User-Agent": "SOLRAD-QA/1.0",
            },
            signal: AbortSignal.timeout(5000),
          }
        )
        
        const contentType = quoteRes.headers.get("content-type") || ""
        
        if (!contentType.includes("application/json")) {
          results.push({
            testName: `${source}: Quote endpoint returns JSON`,
            pass: false,
            reason: `Content-Type: ${contentType}`,
            tokenSymbol: token.symbol,
            tokenMint: token.mint,
          })
        } else {
          const quoteData = await quoteRes.json()
          
          // Test 5: Quote has updatedAt
          if (!quoteData.updatedAt) {
            results.push({
              testName: `${source}: Quote has updatedAt`,
              pass: false,
              reason: "Missing updatedAt field",
              tokenSymbol: token.symbol,
              tokenMint: token.mint,
            })
          } else {
            results.push({
              testName: `${source}: Quote has updatedAt`,
              pass: true,
              tokenSymbol: token.symbol,
              tokenMint: token.mint,
            })
          }
          
          // Test 6: If rate limited, must have rateLimited flag
          if (quoteRes.status === 429 && !quoteData.rateLimited) {
            results.push({
              testName: `${source}: Rate limited response format`,
              pass: false,
              reason: "429 response missing rateLimited flag",
              tokenSymbol: token.symbol,
              tokenMint: token.mint,
            })
          } else if (quoteData.rateLimited && !quoteData.priceUsd) {
            // If rateLimited, should still have cached quote data
            results.push({
              testName: `${source}: Rate limited returns cached data`,
              pass: false,
              reason: "Rate limited but no cached price data",
              tokenSymbol: token.symbol,
              tokenMint: token.mint,
            })
          } else {
            results.push({
              testName: `${source}: Quote endpoint format correct`,
              pass: true,
              tokenSymbol: token.symbol,
              tokenMint: token.mint,
            })
          }
        }
      } catch (fetchError) {
        results.push({
          testName: `${source}: Quote endpoint accessible`,
          pass: false,
          reason: fetchError instanceof Error ? fetchError.message : "Fetch failed",
          tokenSymbol: token.symbol,
          tokenMint: token.mint,
        })
      }
    }
    
    // Test all sample sets
    console.log("[v0] QA: Testing trending tokens...")
    for (const token of trendingSample) {
      await testToken(token, "TRENDING")
    }
    
    console.log("[v0] QA: Testing active tokens...")
    for (const token of activeSample) {
      await testToken(token, "ACTIVE")
    }
    
    console.log("[v0] QA: Testing new/early tokens...")
    for (const token of newEarlySample) {
      await testToken(token, "NEW/EARLY")
    }
    
    console.log("[v0] QA: Testing random pool...")
    for (const token of randomSample) {
      await testToken(token, "RANDOM")
    }
    
    // Column rule checks
    const columnChecks = {
      newEarly: {
        pass: true,
        failures: [] as string[],
      },
      active: {
        pass: true,
        failures: [] as string[],
      },
      trending: {
        pass: true,
        failures: [] as string[],
      },
    }
    
    // Check NEW/EARLY rules
    console.log("[v0] QA: Validating NEW/EARLY column rules...")
    const now = Date.now()
    const maxAgeMs = 30 * 24 * 60 * 60 * 1000 // 30 days
    
    for (const token of newEarly.slice(0, 20)) {
      // Must have pairCreatedAt
      if (!token.pairCreatedAt) {
        columnChecks.newEarly.pass = false
        columnChecks.newEarly.failures.push(
          `${token.symbol}: Missing pairCreatedAt`
        )
      } else {
        // Must be <= 30 days old
        const ageDays = Math.round((now - token.pairCreatedAt) / (1000 * 60 * 60 * 24))
        if (ageDays > 30) {
          columnChecks.newEarly.pass = false
          columnChecks.newEarly.failures.push(
            `${token.symbol}: Age ${ageDays}d exceeds 30d limit`
          )
        }
      }
      
      // Must have liquidity >= 100k
      const liq = token.liquidityUsd ?? 0
      if (liq < 100000) {
        columnChecks.newEarly.pass = false
        columnChecks.newEarly.failures.push(
          `${token.symbol}: Liquidity $${(liq / 1000).toFixed(0)}k < $100k`
        )
      }
    }
    
    // Check ACTIVE rules
    console.log("[v0] QA: Validating ACTIVE column rules...")
    for (const token of active.slice(0, 20)) {
      const vol = token.volume24hUsd ?? 0
      const liq = token.liquidityUsd ?? 0
      
      if (liq < 25000) {
        columnChecks.active.pass = false
        columnChecks.active.failures.push(
          `${token.symbol}: Liquidity $${(liq / 1000).toFixed(0)}k < $25k`
        )
      }
      
      // Should have significant volume OR price movement
      const change = token.change24hPct ?? 0
      if (vol < 500000 && Math.abs(change) < 10) {
        columnChecks.active.pass = false
        columnChecks.active.failures.push(
          `${token.symbol}: Vol $${(vol / 1000).toFixed(0)}k < $500k AND change ${change.toFixed(1)}% < 10%`
        )
      }
    }
    
    // Check TRENDING rules
    console.log("[v0] QA: Validating TRENDING column rules...")
    for (const token of trending.slice(0, 20)) {
      const liq = token.liquidityUsd ?? 0
      
      if (liq < 25000) {
        columnChecks.trending.pass = false
        columnChecks.trending.failures.push(
          `${token.symbol}: Liquidity $${(liq / 1000).toFixed(0)}k < $25k`
        )
      }
    }
    
    // Generate summary
    const passed = results.filter(r => r.pass).length
    const failed = results.filter(r => !r.pass).length
    
    const duration = Date.now() - startTime
    
    const report: QAReport = {
      summary: {
        totalTests: results.length,
        passed,
        failed,
        timestamp: new Date().toISOString(),
        duration,
      },
      results,
      columnChecks,
    }
    
    console.log("[v0] QA: Complete", {
      totalTests: report.summary.totalTests,
      passed: report.summary.passed,
      failed: report.summary.failed,
      duration: `${duration}ms`,
    })
    
    return NextResponse.json(report)
    
  } catch (error) {
    console.error("[v0] QA error:", error)
    // Safe error response - no stack traces
    return NextResponse.json(
      { error: "QA process failed. Please try again." },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"

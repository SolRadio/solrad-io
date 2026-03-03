import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query params with safe defaults
    const address = searchParams.get("address") || "Unknown"
    const symbol = searchParams.get("symbol") || "TOKEN"
    const name = searchParams.get("name") || "Unknown Token"
    const score = Number.parseInt(searchParams.get("score") || "50", 10)
    const riskLabel = searchParams.get("riskLabel") || "MEDIUM RISK"
    const change24h = Number.parseFloat(searchParams.get("change24h") || "0")
    const price = Number.parseFloat(searchParams.get("price") || "0")
    const volume24h = Number.parseFloat(searchParams.get("volume24h") || "0")
    const liquidity = Number.parseFloat(searchParams.get("liquidity") || "0")
    const marketCap = Number.parseFloat(searchParams.get("marketCap") || "0")

    // Format helpers
    const formatCompact = (val: number): string => {
      if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`
      if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`
      if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`
      return `$${val.toFixed(2)}`
    }

    const formatPrice = (p: number): string => {
      if (p < 0.000001) return p.toFixed(8)
      if (p < 0.01) return p.toFixed(6)
      if (p < 1) return p.toFixed(4)
      return p.toFixed(2)
    }

    // Colors
    const riskColor = riskLabel === "LOW RISK" ? "#10b981" : riskLabel === "MEDIUM RISK" ? "#f59e0b" : "#ef4444"
    const tierLabel = score >= 80 ? "TREASURE" : score >= 55 ? "SAFE" : "CAUTION"
    const tierColor = score >= 80 ? "#a855f7" : score >= 55 ? "#06b6d4" : "#f59e0b"
    const changeColor = change24h >= 0 ? "#10b981" : "#ef4444"

    // Score descriptor
    const getScoreDescriptor = (s: number): string => {
      if (s >= 85) return "Strong momentum + solid fundamentals"
      if (s >= 75) return "Momentum + liquidity aligned"
      if (s >= 60) return "Moderate activity detected"
      return "Low liquidity or risk signals"
    }

    const displaySymbol = symbol.slice(0, 16).toUpperCase()
    const displayName = name.length > 28 ? name.slice(0, 28) + "..." : name

    return new ImageResponse(
      (
        <div
          style={{
            width: 1080,
            height: 1080,
            display: "flex",
            flexDirection: "column",
            background: "linear-gradient(135deg, #0a0a0a 0%, #0d0d15 50%, #111118 100%)",
            color: "#ffffff",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {/* Thin border */}
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              right: 16,
              bottom: 16,
              border: "2px solid rgba(6, 182, 212, 0.6)",
              borderRadius: 16,
            }}
          />

          {/* Top header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              padding: "72px 64px 0",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#06b6d4", letterSpacing: 2 }}>SOLRAD</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: "#8A8A8A", marginTop: 8 }}>
                Live Solana market intel
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  padding: "8px 24px",
                  background: "#1a1a1a",
                  border: "1px solid #333333",
                  borderRadius: 18,
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#8A8A8A",
                }}
              >
                SOLANA
              </div>
              <div
                style={{
                  padding: "8px 24px",
                  background: "#0a0a0a",
                  border: "1px solid #06b6d4",
                  borderRadius: 18,
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#06b6d4",
                }}
              >
                solrad.io
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div style={{ display: "flex", padding: "48px 64px 0", gap: 40 }}>
            {/* Left column - Hero */}
            <div style={{ display: "flex", flexDirection: "column", flex: "0 0 55%" }}>
              {/* Token identity */}
              <div style={{ fontSize: 72, fontWeight: 900, letterSpacing: -1, marginBottom: 16 }}>
                {displaySymbol}
              </div>
              <div style={{ fontSize: 28, fontWeight: 500, color: "#D6D6D6", marginBottom: 48 }}>{displayName}</div>

              {/* Big score */}
              <div style={{ display: "flex", flexDirection: "column", marginBottom: 32 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#8A8A8A", letterSpacing: 1, marginBottom: 16 }}>
                  SOLRAD SCORE
                </div>
                <div style={{ fontSize: 110, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>{score}</div>
                <div style={{ fontSize: 20, fontWeight: 500, color: "#8A8A8A", marginTop: 16 }}>
                  {getScoreDescriptor(score)}
                </div>
              </div>

              {/* Badges */}
              <div style={{ display: "flex", gap: 16 }}>
                <div
                  style={{
                    padding: "12px 32px",
                    background: `${tierColor}22`,
                    border: `2px solid ${tierColor}`,
                    borderRadius: 24,
                    fontSize: 18,
                    fontWeight: 700,
                    color: tierColor,
                  }}
                >
                  {tierLabel}
                </div>
                <div
                  style={{
                    padding: "12px 32px",
                    background: `${riskColor}22`,
                    border: `2px solid ${riskColor}`,
                    borderRadius: 24,
                    fontSize: 18,
                    fontWeight: 700,
                    color: riskColor,
                  }}
                >
                  {riskLabel}
                </div>
              </div>
            </div>

            {/* Right column - Metrics grid */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 16 }}>
              {/* Row 1 */}
              <div style={{ display: "flex", gap: 16 }}>
                <div
                  style={{
                    flex: 1,
                    padding: "16px",
                    background: "#0f0f0f",
                    border: "1px solid #222222",
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#8A8A8A", marginBottom: 12 }}>PRICE</div>
                  <div style={{ fontSize: 24, fontWeight: 700, textAlign: "right" }}>${formatPrice(price)}</div>
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: "16px",
                    background: "#0f0f0f",
                    border: "1px solid #222222",
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#8A8A8A", marginBottom: 12 }}>24H CHANGE</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: changeColor, textAlign: "right" }}>
                    {change24h >= 0 ? "+" : ""}
                    {change24h.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Row 2 */}
              <div style={{ display: "flex", gap: 16 }}>
                <div
                  style={{
                    flex: 1,
                    padding: "16px",
                    background: "#0f0f0f",
                    border: "1px solid #222222",
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#8A8A8A", marginBottom: 12 }}>VOLUME 24H</div>
                  <div style={{ fontSize: 24, fontWeight: 700, textAlign: "right" }}>{formatCompact(volume24h)}</div>
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: "16px",
                    background: "#0f0f0f",
                    border: "1px solid #222222",
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#8A8A8A", marginBottom: 12 }}>LIQUIDITY</div>
                  <div style={{ fontSize: 24, fontWeight: 700, textAlign: "right" }}>{formatCompact(liquidity)}</div>
                </div>
              </div>

              {/* Row 3 - full width */}
              <div
                style={{
                  padding: "16px",
                  background: "#0f0f0f",
                  border: "1px solid #222222",
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 600, color: "#8A8A8A", marginBottom: 12 }}>MARKET CAP</div>
                <div style={{ fontSize: 24, fontWeight: 700, textAlign: "right" }}>{formatCompact(marketCap)}</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", flexDirection: "column", padding: "0 64px", marginTop: "auto", marginBottom: 64 }}>
            <div style={{ fontSize: 18, fontWeight: 500, color: "#666666", marginBottom: 8 }}>
              Generated: {new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, color: "#666666" }}>DYOR • Market intel only</div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1080,
      }
    )
  } catch (error) {
    console.error("[v0] OG image generation failed:", error)
    return new Response("Failed to generate image", { status: 500 })
  }
}

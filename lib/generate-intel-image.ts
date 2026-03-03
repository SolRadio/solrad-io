/**
 * Client-side canvas renderer for SOLRAD Intel images.
 * Returns a base64 PNG data URL (1080x1080).
 */

interface TokenForImage {
  symbol: string
  score: number
  priceChange24h: number
  liquidity?: number
  liquidityUsd?: number
  volume24h: number
  signalState?: string
}

function scoreColor(s: number): string {
  return s >= 70 ? "#22c55e" : s >= 40 ? "#f59e0b" : "#ef4444"
}

function signalColor(state?: string): string {
  switch (state?.toUpperCase()) {
    case "STRONG": return "#22c55e"
    case "EARLY": return "#eab308"
    case "PEAK": return "#3b82f6"
    case "SURGE": return "#f59e0b"
    case "DETECTED": return "#71717a"
    default: return "#71717a"
  }
}

function fmtK(val: number): string {
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`
  return `$${val.toFixed(0)}`
}

export async function generateIntelImage(
  tokens: TokenForImage[],
  date: string,
): Promise<string> {
  const W = 1080
  const H = 1080
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!

  // Background
  ctx.fillStyle = "#0a0a0a"
  ctx.fillRect(0, 0, W, H)

  // Scanlines
  for (let y = 0; y < H; y += 4) {
    ctx.fillStyle = "rgba(255,255,255,0.015)"
    ctx.fillRect(0, y, W, 1)
  }

  // Header
  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 52px monospace"
  ctx.fillText("\u25C8 SOLRAD DAILY INTEL", 60, 100)

  ctx.fillStyle = "#52525b"
  ctx.font = "28px monospace"
  ctx.fillText(`${date}  \u00B7  ${tokens.length} tokens tracked`, 60, 145)

  // Divider
  ctx.fillStyle = "#27272a"
  ctx.fillRect(60, 170, 960, 1)

  // Token cards (up to 3)
  const top3 = tokens.slice(0, 3)
  top3.forEach((token, i) => {
    const y = 200 + i * 240
    const color = scoreColor(token.score)
    const sigColor = signalColor(token.signalState)
    const liq = token.liquidityUsd ?? token.liquidity ?? 0

    // Card background
    ctx.fillStyle = "#111111"
    ctx.fillRect(60, y, 960, 210)

    // Left accent bar
    ctx.fillStyle = color
    ctx.fillRect(60, y, 4, 210)

    // Symbol
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 44px monospace"
    ctx.fillText(`$${token.symbol}`, 90, y + 60)

    // Score (right-aligned)
    ctx.fillStyle = color
    ctx.font = "bold 44px monospace"
    const scoreText = `${token.score}`
    const scoreWidth = ctx.measureText(scoreText).width
    ctx.fillText(scoreText, 990 - scoreWidth, y + 60)

    // Signal badge background
    const badgeText = (token.signalState ?? "N/A").toUpperCase()
    ctx.font = "18px monospace"
    const badgeWidth = ctx.measureText(badgeText).width + 28
    ctx.fillStyle = sigColor + "22"
    ctx.fillRect(90, y + 75, badgeWidth, 32)
    ctx.fillStyle = sigColor
    ctx.fillText(badgeText, 104, y + 97)

    // Score bar
    ctx.fillStyle = "#27272a"
    ctx.fillRect(90, y + 120, 700, 8)
    ctx.fillStyle = color
    ctx.fillRect(90, y + 120, (token.score / 100) * 700, 8)

    // Stats row
    ctx.fillStyle = "#71717a"
    ctx.font = "22px monospace"
    const statsText = `Vol ${fmtK(token.volume24h)}  \u00B7  Liq ${fmtK(liq)}  \u00B7  24h ${token.priceChange24h >= 0 ? "+" : ""}${token.priceChange24h.toFixed(1)}%`
    ctx.fillText(statsText, 90, y + 168)

    // 24h change color highlight
    const changeColor = token.priceChange24h >= 0 ? "#22c55e" : "#ef4444"
    const changeText = `${token.priceChange24h >= 0 ? "+" : ""}${token.priceChange24h.toFixed(1)}%`
    const prefixText = `Vol ${fmtK(token.volume24h)}  \u00B7  Liq ${fmtK(liq)}  \u00B7  24h `
    const prefixWidth = ctx.measureText(prefixText).width
    ctx.fillStyle = changeColor
    ctx.fillText(changeText, 90 + prefixWidth, y + 168)
  })

  // Footer divider
  ctx.fillStyle = "#27272a"
  ctx.fillRect(60, 930, 960, 1)

  // Footer text
  ctx.fillStyle = "#52525b"
  ctx.font = "22px monospace"
  ctx.fillText("solrad.io  \u00B7  Solana Intelligence  \u00B7  Not financial advice. DYOR.", 60, 975)

  // SOLRAD branding (right)
  ctx.fillStyle = "#22c55e"
  ctx.font = "bold 24px monospace"
  const brandText = "\u25C8 SOLRAD"
  const brandWidth = ctx.measureText(brandText).width
  ctx.fillText(brandText, 1020 - brandWidth, 975)

  return canvas.toDataURL("image/png")
}

/**
 * post-image.ts
 * Client-only HTML Canvas renderer for SOLRAD Intel post images.
 * Output: 1080 x 1350 PNG (Instagram / X portrait aspect ratio).
 * Zero external dependencies -- pure Canvas 2D API.
 */

// ────────────────────────────────────────────
// Types (mirrors IntelClient inline types)
// ────────────────────────────────────────────

export interface PostImageCandidate {
  symbol: string
  score: number
  liquidity: number
  volume24h: number
  priceChange24h: number
  signal: "EARLY" | "CAUTION" | "STRONG"
}

export interface PostImageInput {
  date: string
  generatedAt: number
  candidates: PostImageCandidate[]
  avgScore: number
  totalCandidates: number
}

// ────────────────────────────────────────────
// Color palette (dark terminal theme)
// ────────────────────────────────────────────

const COLORS = {
  bg: "#0a0a0f",
  bgCard: "#111118",
  bgRow: "#14141e",
  bgRowAlt: "#18182a",
  border: "#2a2a3a",
  borderAccent: "#3a3a5a",
  textPrimary: "#e4e4ef",
  textSecondary: "#8888a0",
  textMuted: "#5a5a70",
  accent: "#818cf8",       // indigo-400
  accentDim: "#4f46e5",    // indigo-600
  green: "#4ade80",
  red: "#f87171",
  yellow: "#facc15",
  blue: "#60a5fa",
  signalStrong: "#22c55e",
  signalCaution: "#eab308",
  signalEarly: "#3b82f6",
} as const

// ────────────────────────────────────────────
// Formatting helpers
// ────────────────────────────────────────────

function fmtUsd(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`
  return `$${val.toFixed(0)}`
}

function fmtDate(date: string, generatedAt: number): string {
  const d = new Date(generatedAt)
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
  return `${date}  ${time} UTC`
}

// ────────────────────────────────────────────
// Rounded rect helper
// ────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// ────────────────────────────────────────────
// Score bar helper
// ────────────────────────────────────────────

function drawScoreBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  score: number,
  maxScore: number = 100
) {
  const pct = Math.min(score / maxScore, 1)

  // Background
  roundRect(ctx, x, y, width, height, height / 2)
  ctx.fillStyle = COLORS.border
  ctx.fill()

  // Fill
  if (pct > 0) {
    const fillW = Math.max(height, width * pct)
    roundRect(ctx, x, y, fillW, height, height / 2)
    const grad = ctx.createLinearGradient(x, y, x + fillW, y)
    grad.addColorStop(0, COLORS.accentDim)
    grad.addColorStop(1, COLORS.accent)
    ctx.fillStyle = grad
    ctx.fill()
  }
}

// ────────────────────────────────────────────
// Signal badge helper
// ────────────────────────────────────────────

function drawSignalBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  signal: "EARLY" | "CAUTION" | "STRONG"
) {
  const color = signal === "STRONG" ? COLORS.signalStrong
    : signal === "CAUTION" ? COLORS.signalCaution
    : COLORS.signalEarly

  const label = signal
  ctx.font = "bold 20px monospace"
  const textW = ctx.measureText(label).width
  const padX = 14
  const padY = 6
  const badgeW = textW + padX * 2
  const badgeH = 28

  // Badge background
  roundRect(ctx, x, y, badgeW, badgeH, 6)
  ctx.fillStyle = color + "18" // ~10% opacity
  ctx.fill()
  ctx.strokeStyle = color + "50" // ~30% opacity
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Badge text
  ctx.fillStyle = color
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(label, x + badgeW / 2, y + badgeH / 2 + 1)

  return badgeW
}

// ────────────────────────────────────────────
// Main render function
// ────────────────────────────────────────────

export function renderPostImage(input: PostImageInput): HTMLCanvasElement {
  const W = 1080
  const H = 1350
  const PAD = 56
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!

  // ── Background ──
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, W, H)

  // Subtle grid pattern
  ctx.strokeStyle = COLORS.border + "20"
  ctx.lineWidth = 0.5
  for (let gx = 0; gx < W; gx += 40) {
    ctx.beginPath()
    ctx.moveTo(gx, 0)
    ctx.lineTo(gx, H)
    ctx.stroke()
  }
  for (let gy = 0; gy < H; gy += 40) {
    ctx.beginPath()
    ctx.moveTo(0, gy)
    ctx.lineTo(W, gy)
    ctx.stroke()
  }

  // Accent glow at top
  const glowGrad = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 600)
  glowGrad.addColorStop(0, COLORS.accent + "12")
  glowGrad.addColorStop(1, "transparent")
  ctx.fillStyle = glowGrad
  ctx.fillRect(0, 0, W, 400)

  // ────────────────────────────────
  // HEADER SECTION
  // ────────────────────────────────

  let cursorY = PAD

  // Terminal dots (decorative)
  const dotColors = ["#ef4444", "#eab308", "#22c55e"]
  dotColors.forEach((c, i) => {
    ctx.beginPath()
    ctx.arc(PAD + i * 24, cursorY + 6, 6, 0, Math.PI * 2)
    ctx.fillStyle = c
    ctx.fill()
  })

  cursorY += 36

  // "SOLRAD DAILY INTEL" title
  ctx.font = "bold 44px monospace"
  ctx.fillStyle = COLORS.textPrimary
  ctx.textAlign = "left"
  ctx.textBaseline = "top"
  ctx.fillText("SOLRAD DAILY INTEL", PAD, cursorY)

  cursorY += 56

  // Date + time
  ctx.font = "500 22px monospace"
  ctx.fillStyle = COLORS.textSecondary
  ctx.fillText(fmtDate(input.date, input.generatedAt), PAD, cursorY)

  // Right-side stats
  ctx.textAlign = "right"
  ctx.font = "500 22px monospace"
  ctx.fillStyle = COLORS.textMuted
  ctx.fillText(
    `${input.totalCandidates} tokens tracked  |  avg ${input.avgScore}/100`,
    W - PAD,
    cursorY
  )
  ctx.textAlign = "left"

  cursorY += 40

  // Separator line
  ctx.strokeStyle = COLORS.borderAccent
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PAD, cursorY)
  ctx.lineTo(W - PAD, cursorY)
  ctx.stroke()

  cursorY += 32

  // "TOP 5 RADAR" label
  ctx.font = "bold 18px monospace"
  ctx.fillStyle = COLORS.accent
  ctx.fillText("TOP 5 RADAR", PAD, cursorY)

  cursorY += 36

  // ────────────────────────────────
  // CANDIDATE ROWS
  // ────────────────────────────────

  const top5 = input.candidates.slice(0, 5)
  const rowH = 150
  const rowGap = 12
  const contentW = W - PAD * 2

  top5.forEach((c, idx) => {
    const rowY = cursorY + idx * (rowH + rowGap)
    const isAlt = idx % 2 === 1

    // Row background
    roundRect(ctx, PAD, rowY, contentW, rowH, 12)
    ctx.fillStyle = isAlt ? COLORS.bgRowAlt : COLORS.bgRow
    ctx.fill()
    ctx.strokeStyle = COLORS.border
    ctx.lineWidth = 1
    ctx.stroke()

    // Rank number
    ctx.font = "bold 48px monospace"
    ctx.fillStyle = COLORS.textMuted + "40"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText(`${idx + 1}`, PAD + 18, rowY + 14)

    // Symbol
    ctx.font = "bold 32px monospace"
    ctx.fillStyle = COLORS.textPrimary
    ctx.fillText(`$${c.symbol}`, PAD + 70, rowY + 20)

    // Signal badge (right of symbol)
    const symbolW = ctx.measureText(`$${c.symbol}`).width
    drawSignalBadge(ctx, PAD + 70 + symbolW + 16, rowY + 18, c.signal)

    // Score bar + label
    const barX = PAD + 70
    const barY = rowY + 66
    const barW = 260
    const barH = 12

    ctx.font = "bold 18px monospace"
    ctx.fillStyle = COLORS.accent
    ctx.textAlign = "left"
    ctx.fillText(`${c.score}`, barX, barY - 2)

    const scoreLabelW = ctx.measureText(`${c.score}`).width
    ctx.font = "16px monospace"
    ctx.fillStyle = COLORS.textMuted
    ctx.fillText("/100", barX + scoreLabelW + 2, barY)

    drawScoreBar(ctx, barX + scoreLabelW + 50, barY + 2, barW - scoreLabelW - 50, barH, c.score)

    // Metrics row at bottom of card
    const metricsY = rowY + 102
    ctx.font = "18px monospace"

    // Liquidity
    ctx.fillStyle = COLORS.textSecondary
    ctx.textAlign = "left"
    ctx.fillText("LIQ", barX, metricsY)
    ctx.fillStyle = COLORS.textPrimary
    ctx.fillText(fmtUsd(c.liquidity), barX + 48, metricsY)

    // Volume
    const volX = barX + 220
    ctx.fillStyle = COLORS.textSecondary
    ctx.fillText("VOL", volX, metricsY)
    ctx.fillStyle = COLORS.textPrimary
    ctx.fillText(fmtUsd(c.volume24h), volX + 48, metricsY)

    // 24h change (right-aligned)
    const changeStr = `${c.priceChange24h > 0 ? "+" : ""}${c.priceChange24h.toFixed(1)}%`
    ctx.font = "bold 28px monospace"
    ctx.fillStyle = c.priceChange24h >= 0 ? COLORS.green : COLORS.red
    ctx.textAlign = "right"
    ctx.fillText(changeStr, W - PAD - 22, rowY + 34)

    // 24h label under change
    ctx.font = "14px monospace"
    ctx.fillStyle = COLORS.textMuted
    ctx.fillText("24h", W - PAD - 22, rowY + 68)

    ctx.textAlign = "left"
  })

  // ────────────────────────────────
  // FOOTER
  // ────────────────────────────────

  const footerY = H - 80

  // Separator
  ctx.strokeStyle = COLORS.borderAccent
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PAD, footerY)
  ctx.lineTo(W - PAD, footerY)
  ctx.stroke()

  // Left: solrad.io
  ctx.font = "bold 22px monospace"
  ctx.fillStyle = COLORS.accent
  ctx.textAlign = "left"
  ctx.textBaseline = "top"
  ctx.fillText("solrad.io", PAD, footerY + 24)

  // Center: tagline
  ctx.font = "16px monospace"
  ctx.fillStyle = COLORS.textMuted
  ctx.textAlign = "center"
  ctx.fillText("Solana Radar  --  Signal Intelligence", W / 2, footerY + 28)

  // Right: SOLRAD logo text
  ctx.font = "bold 26px monospace"
  ctx.fillStyle = COLORS.textSecondary
  ctx.textAlign = "right"
  ctx.fillText("SOLRAD", W - PAD, footerY + 22)

  // Small accent dot next to SOLRAD
  ctx.beginPath()
  const solradW = ctx.measureText("SOLRAD").width
  ctx.arc(W - PAD - solradW - 12, footerY + 36, 5, 0, Math.PI * 2)
  ctx.fillStyle = COLORS.accent
  ctx.fill()

  return canvas
}

// ────────────────────────────────────────────
// Export helper: canvas -> data URL
// ────────────────────────────────────────────

export function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png")
}

// ────────────────────────────────────────────
// Export helper: trigger PNG download
// ────────────────────────────────────────────

export function downloadCanvasPng(canvas: HTMLCanvasElement, filename: string) {
  const url = canvas.toDataURL("image/png")
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/**
 * thread-pack.ts
 * Canvas-based Thread Image Pack generator.
 * Renders N images (one per tweet), stamped "Tweet i/N",
 * with wrapped tweet text in terminal style.
 * Exports individual PNGs and a ZIP via fflate.
 */

import { zipSync } from "fflate"

// ────────────────────────────────────────────
// Colors (matches post-image.ts palette)
// ────────────────────────────────────────────

const COLORS = {
  bg: "#0a0a0f",
  bgCard: "#111118",
  border: "#2a2a3a",
  borderAccent: "#3a3a5a",
  textPrimary: "#e4e4ef",
  textSecondary: "#8888a0",
  textMuted: "#5a5a70",
  accent: "#818cf8",
  accentDim: "#4f46e5",
} as const

// ────────────────────────────────────────────
// Text wrapping helper
// ────────────────────────────────────────────

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
      if (lines.length >= maxLines) break
    } else {
      current = test
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current)
  }

  // If truncated, add ellipsis to last line
  if (lines.length >= maxLines && words.length > 0) {
    const last = lines[lines.length - 1]
    if (ctx.measureText(last + "...").width <= maxWidth) {
      lines[lines.length - 1] = last + "..."
    } else {
      // Trim last word and add ellipsis
      const lastWords = last.split(/\s+/)
      lastWords.pop()
      lines[lines.length - 1] = lastWords.join(" ") + "..."
    }
  }

  return lines
}

// ────────────────────────────────────────────
// Rounded rect
// ────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
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
// Render one tweet image (1080 x 1080)
// ────────────────────────────────────────────

export function renderThreadImage(
  tweetText: string,
  index: number,
  total: number,
  reportDate: string,
): HTMLCanvasElement {
  const W = 1080
  const H = 1080
  const PAD = 64
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!

  // Background
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, W, H)

  // Subtle grid
  ctx.strokeStyle = COLORS.border + "15"
  ctx.lineWidth = 0.5
  for (let gx = 0; gx < W; gx += 40) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke()
  }
  for (let gy = 0; gy < H; gy += 40) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke()
  }

  // Top glow
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 500)
  glow.addColorStop(0, COLORS.accent + "0a")
  glow.addColorStop(1, "transparent")
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, 400)

  let cursorY = PAD

  // ── Header ──
  // Terminal dots
  const dotColors = ["#ef4444", "#eab308", "#22c55e"]
  dotColors.forEach((c, i) => {
    ctx.beginPath()
    ctx.arc(PAD + i * 22, cursorY + 5, 5, 0, Math.PI * 2)
    ctx.fillStyle = c
    ctx.fill()
  })

  // Tweet N/Total badge (top right)
  ctx.font = "bold 28px monospace"
  ctx.fillStyle = COLORS.accent
  ctx.textAlign = "right"
  ctx.textBaseline = "top"
  ctx.fillText(`${index + 1}/${total}`, W - PAD, cursorY - 4)

  cursorY += 36

  // "SOLRAD INTEL THREAD"
  ctx.font = "bold 36px monospace"
  ctx.fillStyle = COLORS.textPrimary
  ctx.textAlign = "left"
  ctx.fillText("SOLRAD INTEL THREAD", PAD, cursorY)

  cursorY += 48

  // Date
  ctx.font = "500 20px monospace"
  ctx.fillStyle = COLORS.textSecondary
  ctx.fillText(reportDate, PAD, cursorY)

  cursorY += 36

  // Separator
  ctx.strokeStyle = COLORS.borderAccent
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PAD, cursorY)
  ctx.lineTo(W - PAD, cursorY)
  ctx.stroke()

  cursorY += 32

  // "TWEET X of Y" label
  ctx.font = "bold 18px monospace"
  ctx.fillStyle = COLORS.accent
  ctx.fillText(`TWEET ${index + 1} OF ${total}`, PAD, cursorY)

  cursorY += 36

  // ── Tweet body card ──
  const cardX = PAD - 8
  const cardY = cursorY
  const cardW = W - (PAD - 8) * 2
  const cardH = H - cardY - 120  // leave room for footer
  roundRect(ctx, cardX, cardY, cardW, cardH, 14)
  ctx.fillStyle = COLORS.bgCard
  ctx.fill()
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 1
  ctx.stroke()

  // Tweet text (wrapped)
  const textX = cardX + 28
  const textMaxW = cardW - 56
  ctx.font = "24px monospace"
  const maxLines = 14
  const lines = wrapText(ctx, tweetText, textMaxW, maxLines)

  const lineHeight = 34
  let textY = cardY + 32
  ctx.fillStyle = COLORS.textPrimary
  ctx.textAlign = "left"
  ctx.textBaseline = "top"

  for (const line of lines) {
    ctx.fillText(line, textX, textY)
    textY += lineHeight
  }

  // ── Footer ──
  const footerY = H - 68

  ctx.strokeStyle = COLORS.borderAccent
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PAD, footerY)
  ctx.lineTo(W - PAD, footerY)
  ctx.stroke()

  // solrad.io
  ctx.font = "bold 20px monospace"
  ctx.fillStyle = COLORS.accent
  ctx.textAlign = "left"
  ctx.fillText("solrad.io", PAD, footerY + 20)

  // SOLRAD
  ctx.font = "bold 22px monospace"
  ctx.fillStyle = COLORS.textSecondary
  ctx.textAlign = "right"
  ctx.fillText("SOLRAD", W - PAD, footerY + 18)

  return canvas
}

// ────────────────────────────────────────────
// Generate all thread images
// ────────────────────────────────────────────

export interface ThreadPackResult {
  canvases: HTMLCanvasElement[]
  dataUrls: string[]
}

export function generateThreadPack(
  tweets: string[],
  reportDate: string,
): ThreadPackResult {
  const canvases: HTMLCanvasElement[] = []
  const dataUrls: string[] = []
  const total = tweets.length

  for (let i = 0; i < total; i++) {
    const canvas = renderThreadImage(tweets[i], i, total, reportDate)
    canvases.push(canvas)
    dataUrls.push(canvas.toDataURL("image/png"))
  }

  return { canvases, dataUrls }
}

// ────────────────────────────────────────────
// Download individual PNG
// ────────────────────────────────────────────

export function downloadThreadImage(dataUrl: string, index: number, reportDate: string): void {
  const a = document.createElement("a")
  a.href = dataUrl
  a.download = `solrad-thread-${reportDate}-${index + 1}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ────────────────────────────────────────────
// Download all as ZIP
// ────────────────────────────────────────────

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1]
  if (!base64) return new Uint8Array(0)
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function downloadThreadPackZip(
  dataUrls: string[],
  reportDate: string,
): void {
  const files: Record<string, Uint8Array> = {}

  for (let i = 0; i < dataUrls.length; i++) {
    files[`tweet-${i + 1}.png`] = dataUrlToBytes(dataUrls[i])
  }

  const zipped = zipSync(files, { level: 6 })
  const blob = new Blob([zipped], { type: "application/zip" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `solrad-thread-pack-${reportDate}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

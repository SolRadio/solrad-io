import type { TokenScore } from "./types"

export type ShareCardFormat = "square" | "wide"

/**
 * Premium 1080x1080 ShareCard with professional layout
 * Left-aligned, 12-column grid, high contrast, clean hierarchy
 */
export function generateShareCardSVG(token: TokenScore, format: ShareCardFormat = "square"): string {
  // Fixed dimensions
  const width = 1080
  const height = 1080
  const padding = 64 // Outer padding
  const leftCol = padding // Left column X start
  const rightCol = 640 // Right column X start (40% width)
  const contentWidth = width - padding * 2 // Content width

  // Risk color mapping
  const riskColor =
    token.riskLabel === "LOW RISK" ? "#10b981" : token.riskLabel === "MEDIUM RISK" ? "#f59e0b" : "#ef4444"

  // Tier/badge logic
  const tierLabel = token.totalScore >= 80 ? "TREASURE" : token.totalScore >= 55 ? "SAFE" : "CAUTION"
  const tierColor = token.totalScore >= 80 ? "#a855f7" : token.totalScore >= 55 ? "#06b6d4" : "#f59e0b"

  // Score descriptor
  const getScoreDescriptor = (score: number): string => {
    if (score >= 85) return "Strong momentum + solid fundamentals"
    if (score >= 75) return "Momentum + liquidity aligned"
    if (score >= 60) return "Moderate activity detected"
    return "Low liquidity or risk signals"
  }

  // Format helpers
  const formatCompact = (val: number): string => {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`
    if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`
    return `$${val.toFixed(2)}`
  }

  const formatPrice = (price: number): string => {
    if (price < 0.000001) return price.toFixed(8)
    if (price < 0.01) return price.toFixed(6)
    if (price < 1) return price.toFixed(4)
    return price.toFixed(2)
  }

  // Truncate long text
  const displaySymbol = token.symbol.slice(0, 16).toUpperCase()
  const displayName = token.name.length > 28 ? token.name.slice(0, 28) + "..." : token.name

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Dark gradient background -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0a;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#0d0d15;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#111118;stop-opacity:1" />
    </linearGradient>
    
    <!-- Radial glow overlay -->
    <radialGradient id="glowGradient" cx="30%" cy="30%">
      <stop offset="0%" style="stop-color:#06b6d4;stop-opacity:0.15" />
      <stop offset="50%" style="stop-color:#a855f7;stop-opacity:0.08" />
      <stop offset="100%" style="stop-color:#000000;stop-opacity:0" />
    </radialGradient>
    
    <!-- Neon border gradient -->
    <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#06b6d4;stop-opacity:0.6" />
      <stop offset="50%" style="stop-color:#a855f7;stop-opacity:0.6" />
      <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:0.6" />
    </linearGradient>
    
    <!-- Noise texture pattern -->
    <filter id="noiseFilter">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feBlend mode="multiply" in="SourceGraphic"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>
  <rect width="${width}" height="${height}" fill="url(#glowGradient)"/>
  <rect width="${width}" height="${height}" fill="#000000" opacity="0.03" style="filter: url(#noiseFilter)"/>
  
  <!-- Thin neon border -->
  <rect x="16" y="16" width="${width - 32}" height="${height - 32}" fill="none" stroke="url(#borderGradient)" strokeWidth="2" rx="16"/>
  
  <!-- TOP HEADER (left aligned) -->
  <g transform="translate(${leftCol}, 72)">
    <text x="0" y="0" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="32" fontWeight="800" fill="#06b6d4" letterSpacing="2">
      SOLRAD
    </text>
    <text x="0" y="32" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="18" fontWeight="500" fill="#8A8A8A">
      Live Solana market intel
    </text>
  </g>
  
  <!-- Top right pills -->
  <g transform="translate(780, 72)">
    <rect x="0" y="-18" width="110" height="36" fill="#1a1a1a" stroke="#333333" strokeWidth="1" rx="18"/>
    <text x="55" y="6" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="16" fontWeight="600" fill="#8A8A8A" textAnchor="middle">
      SOLANA
    </text>
    
    <rect x="120" y="-18" width="140" height="36" fill="#0a0a0a" stroke="#06b6d4" strokeWidth="1" rx="18"/>
    <text x="190" y="6" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="16" fontWeight="600" fill="#06b6d4" textAnchor="middle">
      solrad.io
    </text>
  </g>
  
  <!-- MAIN HERO BLOCK (left side, 60% width) -->
  <g transform="translate(${leftCol}, 180)">
    <!-- Token Identity -->
    <text x="0" y="0" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="72" fontWeight="900" fill="#ffffff" letterSpacing="-1">
      ${displaySymbol}
    </text>
    <text x="0" y="48" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="28" fontWeight="500" fill="#D6D6D6">
      ${displayName}
    </text>
    
    <!-- Big Score Module -->
    <g transform="translate(0, 100)">
      <text x="0" y="0" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="20" fontWeight="700" fill="#8A8A8A" letterSpacing="1">
        SOLRAD SCORE
      </text>
      <text x="0" y="80" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="110" fontWeight="900" fill="#ffffff" letterSpacing="-2">
        ${token.totalScore}
      </text>
      <text x="0" y="110" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="20" fontWeight="500" fill="#8A8A8A">
        ${getScoreDescriptor(token.totalScore)}
      </text>
    </g>
    
    <!-- Risk + Badge Pills -->
    <g transform="translate(0, 340)">
      <!-- Tier Badge -->
      <rect x="0" y="0" width="140" height="48" fill="${tierColor}22" stroke="${tierColor}" strokeWidth="2" rx="24"/>
      <text x="70" y="32" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="18" fontWeight="700" fill="${tierColor}" textAnchor="middle">
        ${tierLabel}
      </text>
      
      <!-- Risk Badge -->
      <rect x="155" y="0" width="160" height="48" fill="${riskColor}22" stroke="${riskColor}" strokeWidth="2" rx="24"/>
      <text x="235" y="32" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="18" fontWeight="700" fill="${riskColor}" textAnchor="middle">
        ${token.riskLabel}
      </text>
    </g>
  </g>
  
  <!-- METRICS GRID (right side, 40% width) -->
  <g transform="translate(${rightCol}, 180)">
    <!-- PRICE tile -->
    <g>
      <rect x="0" y="0" width="180" height="100" fill="#0f0f0f" stroke="#222222" strokeWidth="1" rx="8"/>
      <text x="16" y="32" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="18" fontWeight="600" fill="#8A8A8A">
        PRICE
      </text>
      <text x="164" y="72" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="24" fontWeight="700" fill="#ffffff" textAnchor="end">
        $${formatPrice(token.priceUsd ?? 0)}
      </text>
    </g>
    
    <!-- 24H CHANGE tile -->
    <g transform="translate(200, 0)">
      <rect x="0" y="0" width="180" height="100" fill="#0f0f0f" stroke="#222222" strokeWidth="1" rx="8"/>
      <text x="16" y="32" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="18" fontWeight="600" fill="#8A8A8A">
        24H CHANGE
      </text>
      <text x="164" y="72" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="28" fontWeight="900" fill="${(token.priceChange24h ?? 0) >= 0 ? "#10b981" : "#ef4444"}" textAnchor="end">
        ${(token.priceChange24h ?? 0) >= 0 ? "+" : ""}${(token.priceChange24h ?? 0).toFixed(1)}%
      </text>
    </g>
    
    <!-- VOLUME 24H tile -->
    <g transform="translate(0, 120)">
      <rect x="0" y="0" width="180" height="100" fill="#0f0f0f" stroke="#222222" strokeWidth="1" rx="8"/>
      <text x="16" y="32" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="18" fontWeight="600" fill="#8A8A8A">
        VOLUME 24H
      </text>
      <text x="164" y="72" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="24" fontWeight="700" fill="#ffffff" textAnchor="end">
        ${formatCompact(token.volume24h ?? 0)}
      </text>
    </g>
    
    <!-- LIQUIDITY tile -->
    <g transform="translate(200, 120)">
      <rect x="0" y="0" width="180" height="100" fill="#0f0f0f" stroke="#222222" strokeWidth="1" rx="8"/>
      <text x="16" y="32" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="18" fontWeight="600" fill="#8A8A8A">
        LIQUIDITY
      </text>
      <text x="164" y="72" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="24" fontWeight="700" fill="#ffffff" textAnchor="end">
        ${formatCompact(token.liquidity ?? 0)}
      </text>
    </g>
    
    <!-- MARKET CAP tile -->
    <g transform="translate(0, 240)">
      <rect x="0" y="0" width="380" height="100" fill="#0f0f0f" stroke="#222222" strokeWidth="1" rx="8"/>
      <text x="16" y="32" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="18" fontWeight="600" fill="#8A8A8A">
        MARKET CAP
      </text>
      <text x="364" y="72" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="24" fontWeight="700" fill="#ffffff" textAnchor="end">
        ${formatCompact(token.fdv ?? token.marketCap ?? 0)}
      </text>
    </g>
  </g>
  
  <!-- FOOTER (left aligned) -->
  <g transform="translate(${leftCol}, ${height - 100})">
    <text x="0" y="0" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="18" fontWeight="500" fill="#666666">
      Generated: ${new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
    </text>
    <text x="0" y="32" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="18" fontWeight="500" fill="#666666">
      DYOR • Market intel only
    </text>
  </g>
</svg>
  `.trim()
}

export async function svgToPng(svgString: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const canvas = document.createElement("canvas")
    const blob = new Blob([svgString], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        reject(new Error("Failed to get canvas context"))
        return
      }

      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)

      canvas.toBlob(
        (pngBlob) => {
          if (pngBlob) {
            resolve(pngBlob)
          } else {
            reject(new Error("Failed to convert to PNG"))
          }
        },
        "image/png",
        1.0,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load SVG image"))
    }

    img.src = url
  })
}

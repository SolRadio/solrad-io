import { type NextRequest } from "next/server"
import { storage } from "@/lib/storage"

/**
 * Hash IP address for rate limiting keys
 * Uses a simple hash to avoid storing raw IPs
 */
export function hashIP(ip: string): string {
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16)
}

/**
 * Get client IP from Next.js request
 */
export function getClientIP(request: NextRequest): string {
  // Try forwarded headers first (production)
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  
  // Try real IP header
  const realIP = request.headers.get("x-real-ip")
  if (realIP) {
    return realIP
  }
  
  // Fallback to a constant for local dev
  return "127.0.0.1"
}

/**
 * Check per-IP rate limit using storage
 * Returns true if rate limited (should block), false if allowed
 */
export async function checkIPRateLimit(
  ip: string,
  keyPrefix: string,
  ttlSeconds: number
): Promise<boolean> {
  try {
    const hashedIP = hashIP(ip)
    const key = `${keyPrefix}:${hashedIP}`
    
    const exists = await storage.get(key)
    
    if (exists) {
      return true // Rate limited
    }
    
    // Set lock with TTL
    await storage.set(key, Date.now(), { ex: ttlSeconds })
    return false // Not rate limited
  } catch (error) {
    console.error("[v0] Rate limit check error:", error)
    return false // Don't block on storage errors
  }
}

/**
 * Verify internal secret from request header
 */
export function verifyInternalSecret(request: NextRequest | Request): boolean {
  const authHeader = request.headers.get("x-solrad-internal")
  const internalSecret = process.env.SOLRAD_INTERNAL_SECRET
  
  if (!internalSecret) {
    console.error("[v0] SOLRAD_INTERNAL_SECRET not configured")
    return false
  }
  
  return authHeader === internalSecret
}

/**
 * Verify OPS password from request header
 */
export function verifyOpsPasswordFromHeader(request: NextRequest | Request): boolean {
  const passwordHeader = request.headers.get("x-ops-password")
  const opsPassword = process.env.OPS_PASSWORD
  
  if (!opsPassword) {
    console.warn("[v0] OPS_PASSWORD not configured")
    return false
  }
  
  return passwordHeader === opsPassword
}

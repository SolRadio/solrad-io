/**
 * Hybrid Storage Adapter for SOLRAD
 * 
 * Environment Setup (checked in order):
 * 1. Vercel KV: KV_REST_API_URL + KV_REST_API_TOKEN
 * 2. Upstash Redis: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * 3. Fallback: In-memory storage (local development only)
 */

import { kv } from "@vercel/kv"
import { Redis } from "@upstash/redis"
import { logger } from "./logger"
import { env } from "./env"

// Function to check if Vercel KV is available
const isKVAvailable = (): boolean => {
  return Boolean(env.KV_REST_API_URL && env.KV_REST_API_TOKEN)
}

// In-memory cache for local development fallback
const memoryCache = new Map<string, { value: unknown; expiresAt: number }>()

export interface StorageAdapter {
  set: (key: string, value: unknown, options?: { ex?: number }) => Promise<void>
  get: (key: string) => Promise<unknown | null>
  del: (key: string) => Promise<void>
}

// Detect storage backend
type StorageBackend = "vercel-kv" | "upstash-rest" | "memory"

const detectBackend = (): StorageBackend => {
  if (env.KV_REST_API_URL && env.KV_REST_API_TOKEN) {
    return "vercel-kv"
  }
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return "upstash-rest"
  }
  return "memory"
}

const backend = detectBackend()
logger.log(`[v0] storage backend: ${backend}`)

// Initialize Upstash client if needed
let upstashClient: Redis | null = null
if (backend === "upstash-rest") {
  upstashClient = new Redis({
    url: env.UPSTASH_REDIS_REST_URL!,
    token: env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

// Hybrid storage adapter: Use KV or Upstash when available, fall back to memory
export const storage: StorageAdapter = {
  async set(key: string, value: unknown, options?: { ex?: number }) {
    if (backend === "vercel-kv") {
      try {
        // Vercel KV: serialize to JSON string to avoid serialization issues
        const serialized = JSON.stringify(value)
        const sizeKB = Math.round(serialized.length / 1024)
        
        // Vercel KV has a 1MB limit per key - warn if approaching
        if (sizeKB > 900) {
          console.warn(`[v0] KV set ${key}: large value (${sizeKB}KB), may fail`)
        }
        
        // Retry logic for transient failures
        let lastError: Error | null = null
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            if (options?.ex) {
              await kv.set(key, serialized, { ex: options.ex })
            } else {
              await kv.set(key, serialized)
            }
            // Success - exit retry loop
            if (attempt > 1) {
              console.log(`[v0] KV set ${key} succeeded on retry ${attempt}`)
            }
            return
          } catch (err) {
            lastError = err as Error
            if (attempt < 2) {
              // Wait 500ms before retry
              await new Promise((resolve) => setTimeout(resolve, 500))
            }
          }
        }
        
        // Both attempts failed - throw to outer catch
        throw lastError
      } catch (error) {
        // Silently fall back to memory - this is expected in development and transient network issues
        const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : Number.POSITIVE_INFINITY
        memoryCache.set(key, { value, expiresAt })
        
        // Don't log common/expected errors to keep logs clean
        // (Failed to fetch, t.map errors from KV internals, etc.)
      }
    } else if (backend === "upstash-rest" && upstashClient) {
      try {
        // Upstash: serialize value to JSON string
        const serialized = JSON.stringify(value)
        if (options?.ex) {
          await upstashClient.set(key, serialized, { ex: options.ex })
        } else {
          await upstashClient.set(key, serialized)
        }
      } catch (error) {
        console.error(`[v0] Upstash set failed for ${key}, falling back to memory:`, error)
        const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : Number.POSITIVE_INFINITY
        memoryCache.set(key, { value, expiresAt })
      }
    } else {
      // Memory fallback
      const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : Number.POSITIVE_INFINITY
      memoryCache.set(key, { value, expiresAt })
    }
  },

  async get(key: string) {
    if (backend === "vercel-kv") {
      try {
        const raw = await kv.get(key)
        if (raw === null) return null
        
        // Handle both old format (object) and new format (JSON string)
        if (typeof raw === "string") {
          try {
            return JSON.parse(raw)
          } catch (parseError) {
            // If parsing fails, return the string as-is
            return raw
          }
        }
        // Already an object (old format), return as-is
        return raw
      } catch (error) {
        // Silently fall back to memory for common errors
        const cached = memoryCache.get(key)
        if (!cached) return null
        if (cached.expiresAt < Date.now()) {
          memoryCache.delete(key)
          return null
        }
        return cached.value
      }
    } else if (backend === "upstash-rest" && upstashClient) {
      try {
        const raw = await upstashClient.get(key)
        if (raw === null) return null
        
        // Handle both old format (object) and new format (JSON string)
        if (typeof raw === "string") {
          try {
            return JSON.parse(raw)
          } catch {
            // If parsing fails, return the string as-is
            return raw
          }
        }
        // Already an object (old format), return as-is
        return raw
      } catch (error) {
        console.error(`[v0] Upstash get failed for ${key}, falling back to memory:`, error)
        const cached = memoryCache.get(key)
        if (!cached) return null
        if (cached.expiresAt < Date.now()) {
          memoryCache.delete(key)
          return null
        }
        return cached.value
      }
    } else {
      // Memory fallback
      const cached = memoryCache.get(key)
      if (!cached) return null
      if (cached.expiresAt < Date.now()) {
        memoryCache.delete(key)
        return null
      }
      return cached.value
    }
  },

  async del(key: string) {
    if (backend === "vercel-kv") {
      try {
        await kv.del(key)
      } catch (error) {
        // Silently fall back to memory - KV deletion is non-critical
        memoryCache.delete(key)
      }
    } else if (backend === "upstash-rest" && upstashClient) {
      try {
        await upstashClient.del(key)
      } catch (error) {
        // Silently fall back to memory - KV deletion is non-critical
        memoryCache.delete(key)
      }
    } else {
      // Memory fallback
      memoryCache.delete(key)
    }
  },
}

export const CACHE_KEYS = {
  TOKENS: "solrad:latest", // Updated to match spec
  LAST_UPDATED: "solrad:lastUpdated",
  SOURCE_META: "solrad:sourceMeta",
  INGESTION_LOCK: "solrad:lock:ingestion",
  LAST_INGEST_TIME: "solrad:lastIngestTime",
  INGESTION_STATUS: "solrad:ingestionStatus", // Track degraded/ready status
  SNAPSHOTS_INDEX: "solrad:snapshots:index",
  SNAPSHOTS_DAY: (date: string) => `solrad:snapshots:${date}`,
  TIME_SERIES: (mint: string) => `solrad:ts:${mint}`, // New: per-token time series
  LAST_GOOD_INDEX: "solrad:last_good_index", // Last-known-good token cache
  LAST_GOOD_COUNT: "solrad:last_good_count", // Token count at last good state
  LAST_GOOD_AT: "solrad:last_good_at", // Timestamp of last good state
}

export const CACHE_TTL = {
  TOKENS: 900, // 15 minutes - provides stability while still refreshing regularly
  TIME_SERIES: 604800, // 7 days
  LOCK: 90, // 90s single-flight lock (was 300)
  RATE_LIMIT: 60, // Updated to 60 seconds as per spec
  BLOB_COOLDOWN: 600, // 10 minutes blob rate-limit cooldown
}

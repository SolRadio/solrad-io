/**
 * Cache Invalidation Script
 * Run this to clear all token-related caches and force fresh ingestion
 * 
 * Usage: npx tsx scripts/invalidate-cache.ts
 */

import { kv } from "@vercel/kv"

const CACHE_KEYS_TO_CLEAR = [
  "solrad:latest",
  "solrad:lastUpdated", 
  "solrad:sourceMeta",
  "solrad:lock:ingestion",
  "solrad:lastIngestTime",
  "solrad:ingestionStatus",
  "solrad:source:dexscreener",
  "solrad:tokenIndex",
]

async function invalidateCache() {
  console.log("Starting cache invalidation...")
  
  let deleted = 0
  for (const key of CACHE_KEYS_TO_CLEAR) {
    try {
      const result = await kv.del(key)
      if (result) {
        console.log(`Deleted: ${key}`)
        deleted++
      } else {
        console.log(`Not found: ${key}`)
      }
    } catch (error) {
      console.error(`Error deleting ${key}:`, error)
    }
  }
  
  // Also clear any mint:* keys from fallback discovery
  try {
    const mintKeys = await kv.keys("mint:*")
    if (mintKeys.length > 0) {
      console.log(`Found ${mintKeys.length} mint:* keys to clear`)
      for (const key of mintKeys) {
        await kv.del(key)
        deleted++
      }
    }
  } catch (error) {
    console.error("Error clearing mint:* keys:", error)
  }
  
  console.log(`\nCache invalidation complete. Deleted ${deleted} keys.`)
  console.log("Run ingestion to populate fresh data.")
}

invalidateCache().catch(console.error)

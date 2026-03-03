/**
 * P2-02: Centralized environment variable access and validation
 * 
 * - Server-only validation (secrets never exposed to client)
 * - Clear error messages for missing required vars
 * - Single source of truth for env access in lib/
 * 
 * Usage:
 *   import { env } from '@/lib/env'
 *   const rpcUrl = env.QUICKNODE_SOLANA_RPC_URL
 */

import { z } from 'zod'

// Zod schema for environment variables
const envSchema = z.object({
  // API Keys - Helius (legacy, optional -- enrichment only, no longer required)
  HELIUS_API_KEY: z.string().optional(),
  HELIUS_ENRICHMENT_ENABLED: z.string().optional(),
  HELIUS_MINT_DISCOVERY_ENABLED: z.string().optional(),
  
  // API Keys - QuickNode (primary RPC)
  QUICKNODE_SOLANA_RPC_URL: z.string().optional(),
  QUICKNODE_MINT_DISCOVERY_ENABLED: z.string().optional(),
  
  // API Keys - OpenAI
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  USE_OPENAI_REPORTS: z.string().optional(),
  
  // Internal secrets
  SOLRAD_INTERNAL_SECRET: z.string().optional(),
  RESEARCH_GENERATE_SECRET: z.string().optional(),
  CRON_SECRET: z.string().optional(),                // canonical cron secret
  SOLRAD_CRON_SECRET: z.string().optional(),          // backward-compat fallback for CRON_SECRET
  ALLOW_CRON_QUERY_SECRET: z.string().optional(),     // set to "1" to allow ?secret= query param
  
  // Vercel KV (Upstash Redis)
  VERCEL_KV_REST_API_URL: z.string().optional(),
  VERCEL_KV_REST_API_TOKEN: z.string().optional(),
  KV_REST_API_URL: z.string().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
  
  // Direct Upstash Redis
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // Vercel Blob
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Parse and validate environment variables
// This runs once on module import (server-side only)
let parsedEnv: z.infer<typeof envSchema>

try {
  parsedEnv = envSchema.parse(process.env)
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment variable validation failed:')
    console.error(error.errors)
    throw new Error('Invalid environment variables')
  }
  throw error
}

/**
 * Validated environment variables
 * Access via: env.OPENAI_API_KEY, env.CRON_SECRET, etc.
 */
export const env = parsedEnv

/**
 * Helper to require a server environment variable
 * Throws clear error if missing
 * 
 * Usage:
 *   const secret = requireServerEnv('CRON_SECRET')
 */
export function requireServerEnv(key: keyof typeof env): string {
  const value = env[key]
  
  if (!value || typeof value !== 'string') {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Please add it to your .env file or Vercel project settings.`
    )
  }
  
  return value
}

/**
 * Helper to get optional server environment variable with fallback
 * 
 * Usage:
 *   const model = getServerEnv('OPENAI_MODEL', 'gpt-4o-mini')
 */
export function getServerEnv(key: keyof typeof env, fallback = ''): string {
  const value = env[key]
  return typeof value === 'string' ? value : fallback
}

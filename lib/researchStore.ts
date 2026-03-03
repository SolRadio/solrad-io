/**
 * Research Content Storage
 * Uses Vercel KV (Redis) for generated content storage
 */

import { kv } from '@vercel/kv'
import type { ResearchReport } from './types/research'

/**
 * Get research content from KV storage
 */
export async function getResearchContent(key: string): Promise<ResearchReport | null> {
  try {
    const content = await kv.get<ResearchReport>(key)
    return content
  } catch (error) {
    console.error(`[v0] Failed to get research content from KV: ${key}`, error)
    return null
  }
}

/**
 * Set research content in KV storage
 */
export async function setResearchContent(
  key: string,
  value: ResearchReport,
  ttlSeconds?: number
): Promise<boolean> {
  try {
    if (ttlSeconds) {
      await kv.setex(key, ttlSeconds, JSON.stringify(value))
    } else {
      await kv.set(key, JSON.stringify(value))
    }
    return true
  } catch (error) {
    console.error(`[v0] Failed to set research content in KV: ${key}`, error)
    return false
  }
}

/**
 * Generate KV keys for different content types
 */
export const researchKeys = {
  daily: (date: string) => `research:daily:${date}`,
  token: (token: string, date: string, kind: string) => `research:token:${token}:${date}:${kind}`,
  guide: (slug: string) => `research:guide:${slug}`,
} as const

/**
 * Delete research content from KV storage
 */
export async function deleteResearchContent(key: string): Promise<boolean> {
  try {
    await kv.del(key)
    return true
  } catch (error) {
    console.error(`[v0] Failed to delete research content from KV: ${key}`, error)
    return false
  }
}

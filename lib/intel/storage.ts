import "server-only"
import { storage } from "@/lib/storage"
import type { IntelReport } from "./generator"

const INTEL_KEYS = {
  DAILY: (date: string) => `intel:daily:${date}`,
  LATEST: "intel:latest",
}

/**
 * Save intel report to storage with daily key and latest key
 */
export async function saveIntelReport(report: IntelReport): Promise<void> {
  const dailyKey = INTEL_KEYS.DAILY(report.date)
  const latestKey = INTEL_KEYS.LATEST

  console.log("[v0] Storage: Saving intel report", { 
    date: report.date, 
    dailyKey, 
    latestKey 
  })

  // Save with 30 day TTL
  await storage.set(dailyKey, report, { ex: 60 * 60 * 24 * 30 })
  await storage.set(latestKey, report, { ex: 60 * 60 * 24 * 30 })
  
  console.log("[v0] Storage: Intel report saved successfully")
}

/**
 * Get latest intel report from storage
 */
export async function getLatestIntelReport(): Promise<IntelReport | null> {
  const key = INTEL_KEYS.LATEST
  console.log("[v0] Storage: Fetching latest intel report", { key })
  
  const data = await storage.get(key)
  
  console.log("[v0] Storage: Latest intel fetch result", { 
    hasData: !!data,
    date: data ? (data as IntelReport).date : null
  })
  
  return data as IntelReport | null
}

/**
 * Get intel report for specific date
 */
export async function getIntelReportByDate(date: string): Promise<IntelReport | null> {
  const data = await storage.get(INTEL_KEYS.DAILY(date))
  return data as IntelReport | null
}

// ────────────────────────────────────────────
// PUBLISH AUDIT LOG
// Append-only log of what was published, when, and to which channel.
// ────────────────────────────────────────────

export interface PublishAuditEntry {
  id: string // unique id: "pub_{timestamp}"
  timestamp: number // unix ms
  channel: "x" | "telegram" | "x-thread"
  contentHash: string // first 8 chars of simple hash for dedup reference
  reportDate: string // which intel report date this came from
  tweetIndex?: number // if channel is "x", which tweet index
  preview: string // first 80 chars of the content
}

const AUDIT_KEYS = {
  LOG: "intel:audit:log",
}

/**
 * Simple string hash for content dedup reference.
 */
function contentHash(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(8, "0")
}

/**
 * Record a publish action to the audit log.
 * Keeps at most 50 entries (FIFO).
 */
export async function recordPublishAction(
  entry: Omit<PublishAuditEntry, "id" | "timestamp" | "contentHash" | "preview">,
  content: string
): Promise<PublishAuditEntry> {
  const now = Date.now()
  const full: PublishAuditEntry = {
    ...entry,
    id: `pub_${now}`,
    timestamp: now,
    contentHash: contentHash(content),
    preview: content.replace(/\n/g, " ").slice(0, 80),
  }

  // Read existing log
  const existing = ((await storage.get(AUDIT_KEYS.LOG)) as PublishAuditEntry[] | null) ?? []

  // Prepend new entry, cap at 50
  const updated = [full, ...existing].slice(0, 50)

  await storage.set(AUDIT_KEYS.LOG, updated, { ex: 60 * 60 * 24 * 90 }) // 90-day TTL

  return full
}

/**
 * Get the publish audit log (most recent first, max 50).
 */
export async function getPublishAuditLog(): Promise<PublishAuditEntry[]> {
  const data = await storage.get(AUDIT_KEYS.LOG)
  return (data as PublishAuditEntry[] | null) ?? []
}

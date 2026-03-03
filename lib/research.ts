/**
 * Research Lab Utilities
 * Functions for loading and managing research reports from Vercel Blob
 */

import type { ResearchReport, ResearchIndex } from "./types/research"
import { promises as fs } from "fs"
import path from "path"
import { list, head } from "@vercel/blob"

const RESEARCH_DIR = path.join(process.cwd(), "content", "research")

/**
 * Get Blob path for a research report
 */
function getBlobPath(type: "daily" | "weekly" | "token", identifier: string): string {
  if (type === "daily") {
    return `research/daily/${identifier}.json`
  } else if (type === "weekly") {
    return `research/weekly/${identifier}.json`
  } else {
    // token identifier is "TOKEN/DATE"
    return `research/token/${identifier}.json`
  }
}

/**
 * Load research report from Blob
 */
async function loadFromBlob(blobPath: string): Promise<ResearchReport | null> {
  try {
    const blobUrl = `https://solrad.blob.core.windows.net/${blobPath}`
    const response = await fetch(blobUrl)
    if (response.ok) {
      const data = await response.json()
      console.log(`[v0] Loaded research from Blob: ${blobPath}`)
      return data as ResearchReport
    }
  } catch (error) {
    console.log(`[v0] Blob fetch failed for ${blobPath}, will try local fallback`)
  }
  return null
}

/**
 * Load a specific research report by type and identifier
 * Checks Blob storage first, then falls back to local JSON files
 */
export async function loadResearchReport(
  type: "daily" | "weekly" | "token",
  identifier: string
): Promise<ResearchReport | null> {
  try {
    // Try Blob storage first
    const blobPath = getBlobPath(type, identifier)
    const blobReport = await loadFromBlob(blobPath)
    if (blobReport) {
      return blobReport
    }

    // Fallback to local JSON files (dev mode)
    let filePath: string

    if (type === "daily") {
      filePath = path.join(RESEARCH_DIR, "daily", `${identifier}.json`)
    } else if (type === "weekly") {
      filePath = path.join(RESEARCH_DIR, "weekly", `${identifier}.json`)
    } else {
      filePath = path.join(RESEARCH_DIR, "token", `${identifier}.json`)
    }

    const content = await fs.readFile(filePath, "utf-8")
    console.log(`[v0] Loaded research report from local file: ${filePath}`)
    return JSON.parse(content) as ResearchReport
  } catch (error) {
    console.error(`[v0] Failed to load research report ${type}/${identifier}:`, error)
    return null
  }
}

/**
 * Load research index from Blob
 */
export async function loadResearchIndex(): Promise<ResearchIndex | null> {
  try {
    const indexUrl = `https://solrad.blob.core.windows.net/research/index.json`
    const response = await fetch(indexUrl, { next: { revalidate: 300 } })
    if (response.ok) {
      const data = await response.json()
      console.log(`[v0] Loaded research index from Blob`)
      return data as ResearchIndex
    }
  } catch (error) {
    console.log(`[v0] Failed to load index from Blob, using local files`)
  }
  return null
}

/**
 * Load all research reports (most recent first)
 */
export async function loadAllResearchReports(limit = 30): Promise<ResearchReport[]> {
  // Try Blob index first
  const index = await loadResearchIndex()
  if (index?.reports) {
    return index.reports.slice(0, limit)
  }

  // Fallback to local files
  try {
    const reports: ResearchReport[] = []

    // Load daily reports
    const dailyDir = path.join(RESEARCH_DIR, "daily")
    try {
      const dailyFiles = await fs.readdir(dailyDir)
      for (const file of dailyFiles) {
        if (file.endsWith(".json")) {
          const content = await fs.readFile(path.join(dailyDir, file), "utf-8")
          reports.push(JSON.parse(content))
        }
      }
    } catch {
      // Directory doesn't exist yet
    }

    // Load weekly reports
    const weeklyDir = path.join(RESEARCH_DIR, "weekly")
    try {
      const weeklyFiles = await fs.readdir(weeklyDir)
      for (const file of weeklyFiles) {
        if (file.endsWith(".json")) {
          const content = await fs.readFile(path.join(weeklyDir, file), "utf-8")
          reports.push(JSON.parse(content))
        }
      }
    } catch {
      // Directory doesn't exist yet
    }

    // Load token reports
    const tokenDir = path.join(RESEARCH_DIR, "token")
    try {
      const tokenFolders = await fs.readdir(tokenDir)
      for (const folder of tokenFolders) {
        const folderPath = path.join(tokenDir, folder)
        const stat = await fs.stat(folderPath)
        if (stat.isDirectory()) {
          const files = await fs.readdir(folderPath)
          for (const file of files) {
            if (file.endsWith(".json")) {
              const content = await fs.readFile(path.join(folderPath, file), "utf-8")
              reports.push(JSON.parse(content))
            }
          }
        }
      }
    } catch {
      // Directory doesn't exist yet
    }

    // Sort by date descending and limit
    return reports.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit)
  } catch (error) {
    console.error("[v0] Failed to load research reports:", error)
    return []
  }
}

/**
 * Generate static params for daily reports
 */
export async function getDailyReportDates(): Promise<string[]> {
  try {
    const dailyDir = path.join(RESEARCH_DIR, "daily")
    const files = await fs.readdir(dailyDir)
    return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""))
  } catch {
    return []
  }
}

/**
 * Generate static params for weekly reports
 */
export async function getWeeklyReportWeeks(): Promise<string[]> {
  try {
    const weeklyDir = path.join(RESEARCH_DIR, "weekly")
    const files = await fs.readdir(weeklyDir)
    return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""))
  } catch {
    return []
  }
}

/**
 * Generate static params for token reports
 */
export async function getTokenReportParams(): Promise<Array<{ token: string; date: string }>> {
  try {
    const tokenDir = path.join(RESEARCH_DIR, "token")
    const tokens = await fs.readdir(tokenDir)
    const params: Array<{ token: string; date: string }> = []

    for (const token of tokens) {
      const tokenPath = path.join(tokenDir, token)
      const stat = await fs.stat(tokenPath)
      if (stat.isDirectory()) {
        const files = await fs.readdir(tokenPath)
        for (const file of files) {
          if (file.endsWith(".json")) {
            params.push({
              token,
              date: file.replace(".json", ""),
            })
          }
        }
      }
    }

    return params
  } catch {
    return []
  }
}

/**
 * Research Lab Data Model
 * Lightweight structure for auto-generated crawlable reports
 */

export interface ResearchSection {
  heading: string
  bullets: string[]
}

export interface ResearchReport {
  title: string
  date: string // ISO format: YYYY-MM-DD
  summary: string
  sections: ResearchSection[]
  relatedTokens: string[] // Token symbols or mints
  tags: string[]
  type: "daily" | "weekly" | "token"
  slug: string // URL-friendly identifier
}

export interface ResearchIndex {
  reports: ResearchReport[]
  lastUpdated: string
}

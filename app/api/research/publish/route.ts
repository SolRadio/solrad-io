import { put, list } from "@vercel/blob"
import { NextResponse } from "next/server"
import type { ResearchReport, ResearchIndex } from "@/lib/types/research"
import { env } from "@/lib/env"

export const runtime = "edge"
export const dynamic = "force-dynamic"

/**
 * POST /api/research/publish
 * Publish a research report to Vercel Blob and update index
 * Body: { report: ResearchReport, secret: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { report, secret } = body

    // Verify secret
    if (!secret || secret !== env.RESEARCH_GENERATE_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate report structure
    if (!report || !report.type || !report.slug || !report.date) {
      return NextResponse.json({ error: "Invalid report structure" }, { status: 400 })
    }

    const typedReport = report as ResearchReport

    // Determine blob path
    let blobPath: string
    if (typedReport.type === "daily") {
      blobPath = `research/daily/${typedReport.slug}.json`
    } else if (typedReport.type === "weekly") {
      blobPath = `research/weekly/${typedReport.slug}.json`
    } else if (typedReport.type === "token") {
      // For token reports, slug should be "TOKEN/DATE"
      blobPath = `research/token/${typedReport.slug}.json`
    } else {
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    console.log(`[v0] Publishing research report to Blob: ${blobPath}`)

    // Upload report to Blob
    const blob = await put(blobPath, JSON.stringify(typedReport, null, 2), {
      access: "public",
      contentType: "application/json",
    })

    console.log(`[v0] Research report published: ${blob.url}`)

    // Update index
    await updateResearchIndex(typedReport)

    return NextResponse.json({
      success: true,
      url: blob.url,
      path: blobPath,
    })
  } catch (error) {
    console.error("[v0] Error publishing research report:", error)
    return NextResponse.json(
      { error: "Failed to publish report", details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Update research/index.json with new report
 */
async function updateResearchIndex(newReport: ResearchReport) {
  try {
    // Load existing index
    let index: ResearchIndex = { reports: [], lastUpdated: new Date().toISOString() }

    try {
      const indexUrl = `https://solrad.blob.core.windows.net/research/index.json`
      const response = await fetch(indexUrl)
      if (response.ok) {
        index = await response.json()
      }
    } catch {
      console.log("[v0] No existing index found, creating new one")
    }

    // Remove any existing report with same slug
    index.reports = index.reports.filter((r) => r.slug !== newReport.slug)

    // Add new report at the beginning
    index.reports.unshift(newReport)

    // Keep only last 30 reports
    index.reports = index.reports.slice(0, 30)
    index.lastUpdated = new Date().toISOString()

    // Upload updated index
    await put("research/index.json", JSON.stringify(index, null, 2), {
      access: "public",
      contentType: "application/json",
    })

    console.log(`[v0] Research index updated with ${index.reports.length} reports`)
  } catch (error) {
    console.error("[v0] Failed to update research index:", error)
    // Don't fail the entire operation if index update fails
  }
}

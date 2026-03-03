/**
 * campaign-pack.ts
 * Client-only helpers for:
 *  1) Campaign Pack ZIP export (tweets, telegram, caption, report, post-image)
 *  2) Publish lock / SHA-256 hash computation
 *  3) Approval checklist persistence
 *
 * Uses fflate for minimal ZIP generation (~8kB gzipped).
 * Zero server calls -- all in-browser.
 */

import { zipSync, strToU8 } from "fflate"

// ────────────────────────────────────────────
// Campaign Pack ZIP
// ────────────────────────────────────────────

export interface CampaignPackInput {
  tweets: string[]
  telegramHtml: string
  caption: string
  reportJson: object
  /** data-URL of the post image, or null if not generated */
  postImageDataUrl: string | null
  reportDate: string
}

/**
 * Build and trigger download of a ZIP containing all campaign assets.
 */
export function downloadCampaignPack(input: CampaignPackInput): void {
  const files: Record<string, Uint8Array> = {}

  // tweets.txt -- separated by blank lines
  files["tweets.txt"] = strToU8(input.tweets.join("\n\n"))

  // telegram.html
  files["telegram.html"] = strToU8(input.telegramHtml)

  // caption.txt -- first tweet
  files["caption.txt"] = strToU8(input.caption)

  // report.json
  files["report.json"] = strToU8(JSON.stringify(input.reportJson, null, 2))

  // post-image.png (if available)
  if (input.postImageDataUrl) {
    const base64 = input.postImageDataUrl.split(",")[1]
    if (base64) {
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      files["post-image.png"] = bytes
    }
  } else {
    files["post-image-NOT-GENERATED.txt"] = strToU8(
      "Post image was not generated before export.\nGenerate it in the Post Image tab and re-export."
    )
  }

  const zipped = zipSync(files, { level: 6 })
  const blob = new Blob([zipped], { type: "application/zip" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `solrad-campaign-${input.reportDate}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ────────────────────────────────────────────
// Publish Lock + SHA-256 Hash
// ────────────────────────────────────────────

export interface PublishLock {
  hash: string       // first 8 chars of SHA-256
  fullHash: string   // full hex SHA-256
  timestamp: number  // when published
  reportKey: string  // date:generatedAt
}

const PUBLISH_LOCK_PREFIX = "solrad_publish_lock"

function lockStorageKey(reportKey: string): string {
  return `${PUBLISH_LOCK_PREFIX}:${reportKey}`
}

/**
 * Compute a SHA-256 hash of the telegramPacket + tweet drafts.
 * Returns the hex string (full 64-char).
 */
export async function computePublishHash(
  telegramPacket: string,
  tweetDrafts: string[]
): Promise<string> {
  const payload = telegramPacket + "\n---\n" + tweetDrafts.join("\n---\n")
  const encoder = new TextEncoder()
  const data = encoder.encode(payload)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Save a publish lock to localStorage.
 */
export function savePublishLock(lock: PublishLock): void {
  try {
    localStorage.setItem(lockStorageKey(lock.reportKey), JSON.stringify(lock))
  } catch (_) { void _ }
}

/**
 * Load a publish lock for a given report key.
 */
export function loadPublishLock(reportKey: string): PublishLock | null {
  try {
    const raw = localStorage.getItem(lockStorageKey(reportKey))
    if (raw) return JSON.parse(raw) as PublishLock
  } catch (_) { void _ }
  return null
}

// ────────────────────────────────────────────
// Approval Checklist Persistence
// ────────────────────────────────────────────

export interface ApprovalChecklist {
  draftReviewed: boolean
  noFinancialAdvice: boolean
  linksVerified: boolean
  tokenListConfirmed: boolean
}

const APPROVAL_PREFIX = "solrad_approval_checklist"

function approvalStorageKey(reportKey: string): string {
  return `${APPROVAL_PREFIX}:${reportKey}`
}

export const EMPTY_CHECKLIST: ApprovalChecklist = {
  draftReviewed: false,
  noFinancialAdvice: false,
  linksVerified: false,
  tokenListConfirmed: false,
}

export function isChecklistComplete(checklist: ApprovalChecklist): boolean {
  return (
    checklist.draftReviewed &&
    checklist.noFinancialAdvice &&
    checklist.linksVerified &&
    checklist.tokenListConfirmed
  )
}

export function saveChecklist(reportKey: string, checklist: ApprovalChecklist): void {
  try {
    localStorage.setItem(approvalStorageKey(reportKey), JSON.stringify(checklist))
  } catch (_) { void _ }
}

export function loadChecklist(reportKey: string): ApprovalChecklist {
  try {
    const raw = localStorage.getItem(approvalStorageKey(reportKey))
    if (raw) return JSON.parse(raw) as ApprovalChecklist
  } catch (_) { void _ }
  return { ...EMPTY_CHECKLIST }
}

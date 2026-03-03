/**
 * SOLRAD Intel Draft Persistence
 *
 * Client-safe localStorage helper for persisting tweet/telegram edits
 * keyed by report date + generatedAt. No server imports.
 */

// ── Types ──

export interface IntelDraft {
  /** Report date this draft belongs to */
  reportDate: string
  /** Report generatedAt timestamp for uniqueness */
  generatedAt: number
  /** Selected template name */
  templateName: string
  /** Edited tweet texts (including empty slots) */
  tweets: string[]
  /** Edited telegram packet */
  telegramPacket: string
  /** When this draft was last saved (unix ms) */
  savedAt: number
}

// ── Constants ──

const STORAGE_KEY_PREFIX = "solrad_intel_draft"
const MAX_DRAFTS = 10

// ── Key helpers ──

function draftKey(reportDate: string, generatedAt?: number): string {
  // Use date + generatedAt if available, fallback to date only
  if (generatedAt) {
    return `${STORAGE_KEY_PREFIX}:${reportDate}:${generatedAt}`
  }
  return `${STORAGE_KEY_PREFIX}:${reportDate}`
}

function indexKey(): string {
  return `${STORAGE_KEY_PREFIX}:_index`
}

// ── Index management (tracks which drafts exist) ──

function getIndex(): string[] {
  try {
    const raw = localStorage.getItem(indexKey())
    if (raw) return JSON.parse(raw) as string[]
  } catch { /* ignore */ }
  return []
}

function setIndex(keys: string[]): void {
  try {
    localStorage.setItem(indexKey(), JSON.stringify(keys))
  } catch { /* ignore */ }
}

// ── Public API ──

/**
 * Save a draft to localStorage. Caps total drafts at MAX_DRAFTS (FIFO).
 */
export function saveDraft(draft: Omit<IntelDraft, "savedAt">): void {
  try {
    const key = draftKey(draft.reportDate, draft.generatedAt)
    const full: IntelDraft = { ...draft, savedAt: Date.now() }
    localStorage.setItem(key, JSON.stringify(full))

    // Update index
    const idx = getIndex().filter((k) => k !== key)
    idx.unshift(key)
    // Trim old drafts beyond MAX_DRAFTS
    while (idx.length > MAX_DRAFTS) {
      const removed = idx.pop()
      if (removed) {
        try { localStorage.removeItem(removed) } catch { /* ignore */ }
      }
    }
    setIndex(idx)
  } catch { /* ignore */ }
}

/**
 * Load a draft for the given report date + generatedAt.
 * Returns null if no draft exists.
 */
export function loadDraft(reportDate: string, generatedAt?: number): IntelDraft | null {
  try {
    const key = draftKey(reportDate, generatedAt)
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as IntelDraft
  } catch { /* ignore */ }
  return null
}

/**
 * Check if a draft exists for the given report.
 */
export function hasDraft(reportDate: string, generatedAt?: number): boolean {
  try {
    const key = draftKey(reportDate, generatedAt)
    return localStorage.getItem(key) !== null
  } catch { return false }
}

/**
 * Clear a draft for the given report.
 */
export function clearDraft(reportDate: string, generatedAt?: number): void {
  try {
    const key = draftKey(reportDate, generatedAt)
    localStorage.removeItem(key)
    const idx = getIndex().filter((k) => k !== key)
    setIndex(idx)
  } catch { /* ignore */ }
}

/**
 * Get relative time string for display (e.g. "2m ago").
 */
export function draftAge(savedAt: number): string {
  const diff = Date.now() - savedAt
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

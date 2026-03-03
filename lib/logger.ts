/**
 * P2-01: Production-safe logger
 * 
 * - log/info/debug: NO-OP in production unless NEXT_PUBLIC_DEBUG_LOGS === "1"
 * - warn/error: Always log (production-safe, no sensitive data)
 * 
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.log('[module]', 'message', data)
 *   logger.error('[module]', 'error message') // Never log full error objects with headers
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const debugEnabled = process.env.NEXT_PUBLIC_DEBUG_LOGS === '1'

// Should verbose logs be shown?
const shouldLog = isDevelopment || debugEnabled

export const logger = {
  /**
   * General logging - disabled in production unless debug flag set
   */
  log: (...args: unknown[]) => {
    if (shouldLog) {
      console.log(...args)
    }
  },

  /**
   * Info logging - disabled in production unless debug flag set
   */
  info: (...args: unknown[]) => {
    if (shouldLog) {
      console.info(...args)
    }
  },

  /**
   * Debug logging - disabled in production unless debug flag set
   */
  debug: (...args: unknown[]) => {
    if (shouldLog) {
      console.debug(...args)
    }
  },

  /**
   * Warning logging - always enabled
   */
  warn: (...args: unknown[]) => {
    console.warn(...args)
  },

  /**
   * Error logging - always enabled
   * Note: Never pass full error objects with headers/secrets
   */
  error: (...args: unknown[]) => {
    console.error(...args)
  },
}

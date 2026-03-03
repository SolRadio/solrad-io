/**
 * Alert Delivery Job
 * Matches alerts against rules and delivers to configured channels
 * 
 * This endpoint is designed to be called by a cron job or manually triggered.
 * It will:
 * 1. Fetch recent alerts
 * 2. Get enabled alert rules
 * 3. Match alerts against rules
 * 4. Deliver matched alerts via configured channel (Telegram first)
 * 5. Log deliveries for deduplication
 */

import { NextRequest, NextResponse } from "next/server"
import {
  getAlertRules,
  logDelivery,
  wasRecentlyDelivered,
  severityToNumber,
  type AlertRule,
  type AlertType,
  type SeverityLevel,
} from "@/lib/alert-rules"
import { sendTelegramMessage } from "@/lib/telegram"

// Types from admin alerts route
interface Alert {
  id: string
  type: AlertType
  severity: SeverityLevel
  mint: string
  symbol: string
  name: string
  ts: number
  message: string
  metrics: {
    scorePrev?: number
    scoreNow?: number
    pricePrev?: number
    priceNow?: number
    liqPrev?: number
    liqNow?: number
    riskPrev?: string
    riskNow?: string
    fromState?: string
    toState?: string
    confidenceNow?: number
  }
}

/**
 * Check if admin authenticated
 */
function isAdminAuthenticated(req: Request): boolean {
  const password = req.headers.get("x-admin-password")?.trim() || ""
  const cronSecret = req.headers.get("x-cron-secret")?.trim() || ""

  // Allow cron secret for automated delivery (canonical: CRON_SECRET, fallback: SOLRAD_CRON_SECRET)
  const expectedCronSecret = process.env.CRON_SECRET ?? process.env.SOLRAD_CRON_SECRET
  if (expectedCronSecret && cronSecret && cronSecret === expectedCronSecret) {
    return true
  }

  const opsPassword = process.env.OPS_PASSWORD
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminAlertsPassword = process.env.ADMIN_ALERTS_PASSWORD

  return (
    (!!opsPassword && password === opsPassword) ||
    (!!adminPassword && password === adminPassword) ||
    (!!adminAlertsPassword && password === adminAlertsPassword)
  )
}

/**
 * Build Telegram message for an alert
 */
function buildTelegramMessage(alert: Alert, rule: AlertRule): string {
  const severityEmoji = alert.severity === "high" ? "🔴" : alert.severity === "med" ? "🟡" : "🔵"
  const typeLabel = alert.type.replace(/_/g, " ")

  let metricsText = ""

  if (alert.metrics.scoreNow !== undefined) {
    metricsText += `\nScore: ${alert.metrics.scoreNow.toFixed(1)}`
    if (alert.metrics.scorePrev !== undefined) {
      metricsText += ` (was ${alert.metrics.scorePrev.toFixed(1)})`
    }
  }

  if (alert.metrics.confidenceNow !== undefined) {
    metricsText += `\nConfidence: ${alert.metrics.confidenceNow}%`
  }

  if (alert.metrics.liqNow !== undefined) {
    metricsText += `\nLiquidity: $${(alert.metrics.liqNow / 1000).toFixed(1)}K`
  }

  if (alert.metrics.fromState && alert.metrics.toState) {
    metricsText += `\nSignal: ${alert.metrics.fromState} → ${alert.metrics.toState}`
  }

  return `${severityEmoji} <b>${typeLabel}</b>

<b>${alert.symbol}</b> (${alert.name})
${alert.message}
${metricsText}

<code>${alert.mint}</code>

🔗 <a href="https://solrad.io/token/${alert.mint}">View on SOLRAD</a>

<i>⚠️ Observed conditions, not predictions. DYOR.</i>
<i>Rule: ${rule.name}</i>`
}

/**
 * Check if an alert matches a rule
 */
function alertMatchesRule(alert: Alert, rule: AlertRule): boolean {
  // Check alert type
  if (!rule.alertTypes.includes(alert.type)) {
    return false
  }

  // Check severity (must meet minimum)
  const alertSeverity = severityToNumber(alert.severity)
  const minSeverity = severityToNumber(rule.minSeverity)
  if (alertSeverity < minSeverity) {
    return false
  }

  // Check min score if configured
  if (rule.minScore !== undefined && rule.minScore > 0) {
    const score = alert.metrics.scoreNow ?? alert.metrics.scorePrev ?? 0
    if (score < rule.minScore) {
      return false
    }
  }

  // Check min confidence if configured
  if (rule.minConfidence !== undefined && rule.minConfidence > 0) {
    const confidence = alert.metrics.confidenceNow ?? 0
    if (confidence < rule.minConfidence) {
      return false
    }
  }

  return true
}

/**
 * POST /api/admin/alert-delivery
 * Run alert delivery job
 */
export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const startTime = Date.now()

    // Get enabled rules
    const allRules = await getAlertRules()
    const enabledRules = allRules.filter((r) => r.enabled)

    if (enabledRules.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No enabled rules",
        stats: { rules: 0, alerts: 0, delivered: 0 },
      })
    }

    // Fetch recent alerts from admin alerts API (use relative URL for internal call)
    const adminPassword = req.headers.get("x-admin-password") || process.env.OPS_PASSWORD || ""
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin
    const alertsRes = await fetch(`${baseUrl}/api/admin/alerts`, {
      headers: {
        "x-admin-password": adminPassword,
      },
    })

    if (!alertsRes.ok) {
      throw new Error(`Failed to fetch alerts: ${alertsRes.status}`)
    }

    const { alerts }: { alerts: Alert[] } = await alertsRes.json()

    // Filter to alerts in the last 15 minutes (to avoid old alerts)
    const fifteenMinAgo = Date.now() - 15 * 60 * 1000
    const recentAlerts = alerts.filter((a) => a.ts >= fifteenMinAgo)

    let delivered = 0
    const deliveryResults: Array<{
      ruleId: string
      ruleName: string
      alertId: string
      symbol: string
      success: boolean
      error?: string
    }> = []

    // Process each rule
    for (const rule of enabledRules) {
      // Find matching alerts
      const matchingAlerts = recentAlerts.filter((alert) => alertMatchesRule(alert, rule))

      for (const alert of matchingAlerts) {
        // Check dedupe
        const recentlyDelivered = await wasRecentlyDelivered(
          rule.id,
          alert.mint,
          alert.type,
          rule.dedupeMinutes
        )

        if (recentlyDelivered) {
          continue // Skip this alert for this rule
        }

        // Deliver based on channel
        let success = false
        let error: string | undefined

        if (rule.channel === "telegram") {
          try {
            const message = buildTelegramMessage(alert, rule)
            const result = await sendTelegramMessage({ text: message })

            if (result.ok) {
              success = true
              delivered++

              // Log delivery for dedupe
              await logDelivery({
                ruleId: rule.id,
                alertId: alert.id,
                mint: alert.mint,
                alertType: alert.type,
                deliveredAt: Date.now(),
              })
            } else {
              error = result.error
            }
          } catch (err) {
            error = err instanceof Error ? err.message : "Unknown error"
          }
        }

        deliveryResults.push({
          ruleId: rule.id,
          ruleName: rule.name,
          alertId: alert.id,
          symbol: alert.symbol,
          success,
          error,
        })
      }
    }

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      stats: {
        rules: enabledRules.length,
        alerts: recentAlerts.length,
        delivered,
        durationMs: duration,
      },
      deliveries: deliveryResults,
    })
  } catch (error) {
    console.error("[alert-delivery] Error:", error)
    return NextResponse.json(
      {
        error: "Delivery job failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/alert-delivery
 * Get delivery job status and last run info
 */
export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const rules = await getAlertRules()
    const enabledRules = rules.filter((r) => r.enabled)

    return NextResponse.json({
      enabledRules: enabledRules.length,
      totalRules: rules.length,
      telegramConfigured: !!(
        process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ALERTS_CHAT_ID
      ),
    })
  } catch (error) {
    console.error("[alert-delivery] GET error:", error)
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 })
  }
}

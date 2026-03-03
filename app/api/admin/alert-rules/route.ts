/**
 * Alert Rules API
 * CRUD operations for alert subscription rules
 */

import { NextRequest, NextResponse } from "next/server"
import {
  getAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  ALERT_TYPES,
  DELIVERY_CHANNELS,
  SEVERITY_LEVELS,
  type AlertRule,
  type AlertType,
  type DeliveryChannel,
  type SeverityLevel,
} from "@/lib/alert-rules"

/**
 * Check if admin authenticated
 */
function isAdminAuthenticated(req: Request): boolean {
  const password = req.headers.get("x-admin-password")?.trim() || ""

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
 * GET /api/admin/alert-rules
 * List all alert rules
 */
export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const rules = await getAlertRules()
    return NextResponse.json({
      rules,
      meta: {
        alertTypes: ALERT_TYPES,
        deliveryChannels: DELIVERY_CHANNELS,
        severityLevels: SEVERITY_LEVELS,
      },
    })
  } catch (error) {
    console.error("[alert-rules] GET error:", error)
    return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 })
  }
}

/**
 * POST /api/admin/alert-rules
 * Create a new alert rule
 */
export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()

    // Validate required fields
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    if (!Array.isArray(body.alertTypes) || body.alertTypes.length === 0) {
      return NextResponse.json({ error: "At least one alert type is required" }, { status: 400 })
    }

    // Validate alert types
    const validAlertTypes = body.alertTypes.filter((t: string) =>
      ALERT_TYPES.includes(t as AlertType)
    )
    if (validAlertTypes.length === 0) {
      return NextResponse.json({ error: "Invalid alert types" }, { status: 400 })
    }

    // Validate severity
    if (!SEVERITY_LEVELS.includes(body.minSeverity)) {
      return NextResponse.json({ error: "Invalid severity level" }, { status: 400 })
    }

    // Validate channel
    if (!DELIVERY_CHANNELS.includes(body.channel)) {
      return NextResponse.json({ error: "Invalid delivery channel" }, { status: 400 })
    }

    const rule = await createAlertRule({
      name: body.name,
      enabled: body.enabled ?? false,
      alertTypes: validAlertTypes as AlertType[],
      minSeverity: body.minSeverity as SeverityLevel,
      minScore: body.minScore ?? undefined,
      minConfidence: body.minConfidence ?? undefined,
      channel: body.channel as DeliveryChannel,
      dedupeMinutes: body.dedupeMinutes ?? 30,
    })

    return NextResponse.json({ rule })
  } catch (error) {
    console.error("[alert-rules] POST error:", error)
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/alert-rules
 * Update an existing alert rule
 */
export async function PATCH(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ error: "Rule ID is required" }, { status: 400 })
    }

    // Build updates object
    const updates: Partial<AlertRule> = {}

    if (body.name !== undefined) updates.name = body.name
    if (body.enabled !== undefined) updates.enabled = body.enabled
    if (body.dedupeMinutes !== undefined) updates.dedupeMinutes = body.dedupeMinutes

    if (body.alertTypes !== undefined) {
      const validAlertTypes = body.alertTypes.filter((t: string) =>
        ALERT_TYPES.includes(t as AlertType)
      )
      if (validAlertTypes.length > 0) {
        updates.alertTypes = validAlertTypes as AlertType[]
      }
    }

    if (body.minSeverity !== undefined) {
      if (SEVERITY_LEVELS.includes(body.minSeverity)) {
        updates.minSeverity = body.minSeverity as SeverityLevel
      }
    }

    if (body.minScore !== undefined) {
      updates.minScore = body.minScore === null ? undefined : body.minScore
    }

    if (body.minConfidence !== undefined) {
      updates.minConfidence = body.minConfidence === null ? undefined : body.minConfidence
    }

    if (body.channel !== undefined) {
      if (DELIVERY_CHANNELS.includes(body.channel)) {
        updates.channel = body.channel as DeliveryChannel
      }
    }

    const rule = await updateAlertRule(body.id, updates)

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 })
    }

    return NextResponse.json({ rule })
  } catch (error) {
    console.error("[alert-rules] PATCH error:", error)
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/alert-rules
 * Delete an alert rule
 */
export async function DELETE(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Rule ID is required" }, { status: 400 })
    }

    const deleted = await deleteAlertRule(id)

    if (!deleted) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[alert-rules] DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 })
  }
}

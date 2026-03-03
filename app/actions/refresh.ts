"use server"

/**
 * Server Action to trigger ingestion refresh
 * Keeps SOLRAD_INTERNAL_SECRET on the server, never exposed to client
 */
export async function triggerRefresh() {
  try {
    const internalSecret = process.env.SOLRAD_INTERNAL_SECRET
    
    if (!internalSecret) {
      console.error("[v0] SOLRAD_INTERNAL_SECRET not configured")
      return { 
        success: false, 
        error: "Internal secret not configured" 
      }
    }
    
    // Use VERCEL_URL for deployments, fallback to production URL
    // This ensures we call the API route on the same deployment (preview or production)
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : (process.env.NEXT_PUBLIC_SITE_URL || "https://www.solrad.io")
    
    const url = `${baseUrl}/api/refresh`
    console.log("[v0] Calling refresh endpoint:", url)
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-solrad-internal": internalSecret,
        "Content-Type": "application/json",
      },
    })
    
    console.log("[v0] Refresh response status:", response.status, response.statusText)
    
    if (!response.ok) {
      const text = await response.text()
      console.error("[v0] Force refresh failed:", { status: response.status, text })
      return { 
        success: false, 
        error: `Refresh failed: ${response.status} ${text.substring(0, 100)}` 
      }
    }
    
    const data = await response.json()
    console.log("[v0] Refresh succeeded:", data)
    return data
  } catch (error) {
    console.error("[v0] Force refresh error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }
  }
}

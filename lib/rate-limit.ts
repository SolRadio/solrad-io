import { storage } from "@/lib/storage"

export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const key =
    "rl:" +
    identifier +
    ":" +
    Math.floor(Date.now() / (windowSeconds * 1000))

  try {
    const current = ((await storage.get(key)) as number) || 0
    if (current >= limit) {
      return { allowed: false, remaining: 0 }
    }
    await storage.set(key, current + 1, {
      ex: windowSeconds,
    })
    return {
      allowed: true,
      remaining: limit - current - 1,
    }
  } catch {
    // If storage fails, allow the request (fail-open)
    return { allowed: true, remaining: limit }
  }
}

export function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"
  return ip
}

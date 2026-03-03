"use client"

/**
 * Browser-safe fetch with timeout.
 *
 * Uses AbortController + setTimeout instead of AbortSignal.timeout()
 * which is unsupported in some browsers / runtimes and can throw
 * "Failed to convert value to 'AbortSignal'".
 *
 * If the caller supplies an external signal (e.g. from useAutoRefresh),
 * we forward its abort to our internal controller so both cancellation
 * paths (timeout AND caller-initiated) work correctly.
 */
export function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  ms = 8000
): Promise<Response> {
  const controller = new AbortController()

  // Compose with any external signal the caller passed
  const external = init.signal
  if (external) {
    if (external.aborted) {
      controller.abort()
    } else {
      external.addEventListener("abort", () => controller.abort(), { once: true })
    }
  }

  const timer = setTimeout(() => controller.abort(), ms)

  return fetch(input, {
    ...init,
    signal: controller.signal,
  }).finally(() => clearTimeout(timer))
}

/**
 * Mint Normalization Utility
 * 
 * Canonical function for normalizing Solana mint addresses.
 * Must be used EVERYWHERE: storage, API routes, badge lookup, drawer fetch.
 * 
 * This ensures "proofs exist but badges don't show" issues are fixed.
 */

/**
 * Normalize a Solana mint address to canonical form
 * 
 * Rules:
 * - Lowercase
 * - Trim whitespace
 * - Strip known suffixes (e.g. _pump)
 * - Return empty string if invalid
 * 
 * @param mint - Raw mint address string
 * @returns Normalized mint address or empty string if invalid
 */
export function normalizeMint(mint: string | undefined | null): string {
  if (!mint || typeof mint !== "string") {
    return ""
  }

  let normalized = mint.trim().toLowerCase()

  // Strip known suffixes
  const suffixes = ["_pump", "-pump", "_migration", "-migration"]
  for (const suffix of suffixes) {
    if (normalized.endsWith(suffix)) {
      normalized = normalized.slice(0, -suffix.length)
    }
  }

  // Basic validation: Solana addresses are 32-44 chars base58
  if (normalized.length < 32 || normalized.length > 44) {
    return ""
  }

  // Basic character validation (base58 alphabet)
  const base58Regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/
  if (!base58Regex.test(normalized)) {
    return ""
  }

  return normalized
}

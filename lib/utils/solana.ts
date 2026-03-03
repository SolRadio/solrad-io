import { PublicKey } from "@solana/web3.js"

/**
 * Validates if a string is a valid Solana mint address
 * Uses PublicKey constructor to validate base58 format
 */
export function isValidSolanaMint(input: string): boolean {
  const mint = input.trim()
  if (!mint) return false

  try {
    new PublicKey(mint)
    return true
  } catch {
    return false
  }
}

export function isValidSolanaAddress(address: string): boolean {
  return isValidSolanaMint(address)
}

// Re-export normalizeMint from its canonical location
export { normalizeMint } from "../solana/normalizeMint"

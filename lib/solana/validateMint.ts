import { PublicKey } from "@solana/web3.js"
import { normalizeMint as extractMint } from "./normalizeMint"

/**
 * Validate if a string is a valid Solana PublicKey
 * Uses @solana/web3.js PublicKey constructor for strict validation
 * 
 * @param input - String to validate (may include URLs, query params)
 * @returns Validated base58 address string, or null if invalid
 */
export function isValidPubkey(input: string | undefined | null): boolean {
  if (!input || typeof input !== "string") {
    return false
  }
  
  try {
    new PublicKey(input)
    return true
  } catch {
    return false
  }
}

/**
 * Normalize and validate a Solana mint address
 * Combines extraction (via normalizeMint) with strict PublicKey validation
 * 
 * Process:
 * 1. Extract base58 address from input (handles URLs, query params, pump suffix)
 * 2. Validate using PublicKey constructor (strict on-curve validation)
 * 3. Return validated base58 string or null
 * 
 * @param input - Raw mint address (may include URLs, query params, suffixes)
 * @returns Validated canonical base58 mint address, or null if invalid
 */
export function normalizeMint(input: string | undefined | null): string | null {
  if (!input || typeof input !== "string") {
    return null
  }
  
  // Step 1: Extract base58 address using existing normalizeMint logic
  const extracted = extractMint(input)
  if (!extracted) {
    return null
  }
  
  // Step 2: Strict validation using PublicKey
  try {
    const pubkey = new PublicKey(extracted)
    // Return validated base58 (ensures it's a real on-curve address)
    return pubkey.toBase58()
  } catch {
    return null
  }
}

/**
 * Get canonical mint from TokenData or TokenScore object
 * Ensures we always use the correct mint field (not pairAddress)
 * 
 * @param token - Token object with address field
 * @returns Canonical mint address or null if invalid
 */
export function getCanonicalMint(token: { address?: string; mint?: string }): string | null {
  // Prefer 'address' field (our canonical standard)
  const candidate = token.address || token.mint
  if (!candidate) {
    return null
  }
  
  return normalizeMint(candidate)
}

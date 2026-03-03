/**
 * Normalize Solana mint addresses to handle pump.fun suffixes and URL variations
 * 
 * Examples:
 * - "9xk...pthmpump" → "9xk...pthm" (strips trailing "pump")
 * - "https://pump.fun/coin/ABC123" → "ABC123"
 * - "ABC123?share=1" → "ABC123"
 * - "  ABC123  " → "ABC123"
 * - "invalid" → "" (no valid base58 substring found)
 */

/**
 * Extract and normalize a Solana mint address from any input format
 * 
 * Process:
 * 1. Trim whitespace
 * 2. Strip query params and hash fragments
 * 3. Remove trailing "pump" suffix (from pump.fun links)
 * 4. Extract first valid base58 substring (32-44 chars)
 * 
 * @param input - Raw mint address (may include URLs, query params, "pump" suffix)
 * @returns Normalized base58 mint address, or empty string if invalid
 */
export function normalizeMint(input: string): string {
  if (!input || typeof input !== "string") {
    return ""
  }

  // Step 1: Trim whitespace
  let normalized = input.trim()

  // Step 2: Strip query params and hash fragments
  // Handle both ? and # delimiters
  normalized = normalized.split("?")[0].split("#")[0].trim()

  // Step 3: Extract valid base58 substring (32-48 characters)
  // Solana addresses are base58 encoded (no 0, O, I, l characters)
  // Standard addresses: 32-44 chars, pump.fun addresses: 48 chars (44 + "pump")
  const base58Regex = /[1-9A-HJ-NP-Za-km-z]{32,48}/
  const match = normalized.match(base58Regex)

  if (match) {
    return match[0]
  }

  // No valid mint found
  return ""
}

/**
 * Validate if a string is a valid Solana mint address
 * 
 * @param mint - String to validate
 * @returns true if valid base58 address (32-48 chars, includes pump.fun addresses)
 */
export function isValidSolanaMint(mint: string): boolean {
  if (!mint || typeof mint !== "string") {
    return false
  }

  const length = mint.length
  // Standard Solana: 32-44, pump.fun: 48
  if (length < 32 || length > 48) {
    return false
  }

  // Base58 alphabet (excludes 0, O, I, l to avoid confusion)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/
  return base58Regex.test(mint)
}

// Test cases (for verification - not executed at runtime):
// normalizeMint("9xk...pthmpump") → "9xk...pthm"
// normalizeMint("https://pump.fun/coin/ABC123") → "ABC123"
// normalizeMint("ABC123?share=1") → "ABC123"
// normalizeMint("  ABC123#foo  ") → "ABC123"
// normalizeMint("https://www.solrad.io/token/ABC123") → "ABC123"
// normalizeMint("invalid") → ""
// normalizeMint("") → ""

/**
 * Solscan URL helper for SPL token links
 * 
 * IMPORTANT: SPL tokens use /token/ not /account/
 * Account pages show wallet addresses, not token metadata
 */

/**
 * Returns the correct Solscan token URL for a given mint address
 * @param mint - The canonical Solana mint address (SPL token address)
 * @returns Full Solscan token URL, or null if mint is invalid
 */
export function getSolscanTokenUrl(mint: string | null | undefined): string | null {
  // Validate mint exists and has minimum length for Solana address
  if (!mint || mint.length < 32) {
    return null
  }

  // Return SPL token URL (NOT /account/)
  return `https://solscan.io/token/${encodeURIComponent(mint)}`
}

/**
 * Checks if a mint address is valid for Solscan linking
 * @param mint - The mint address to validate
 * @returns true if mint can be used for Solscan links
 */
export function isValidMintForSolscan(mint: string | null | undefined): boolean {
  return mint !== null && mint !== undefined && mint.length >= 32
}

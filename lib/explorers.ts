/**
 * Blockchain explorer URL helpers
 * 
 * Centralized utility for generating correct explorer links
 */

import { PublicKey } from "@solana/web3.js"

/**
 * Solscan token page URL (for SPL token mints)
 * CRITICAL: Normalizes address to proper base58 case using PublicKey
 * Solana addresses are case-sensitive - lowercase addresses appear as accounts, not tokens
 * 
 * @param mint - SPL token mint address (can be lowercase or mixed case)
 * @returns Full Solscan token URL with properly cased address
 */
export function solscanToken(mint: string): string {
  try {
    // Normalize to proper base58 case using PublicKey
    // This fixes the issue where cached lowercase addresses open as accounts
    const pubkey = new PublicKey(mint)
    const normalizedMint = pubkey.toBase58()
    return `https://solscan.io/token/${encodeURIComponent(normalizedMint)}`
  } catch (error) {
    // If PublicKey parsing fails, use original mint (fallback)
    console.warn(`[v0] Failed to normalize mint address for Solscan: ${mint}`, error)
    return `https://solscan.io/token/${encodeURIComponent(mint)}`
  }
}

/**
 * Solscan account page URL (for wallet addresses)
 * @param address - Solana wallet/account address
 * @returns Full Solscan account URL
 */
export function solscanAccount(address: string): string {
  return `https://solscan.io/account/${encodeURIComponent(address)}`
}

/**
 * Solscan transaction page URL
 * @param sig - Transaction signature
 * @returns Full Solscan transaction URL
 */
export function solscanTx(sig: string): string {
  return `https://solscan.io/tx/${encodeURIComponent(sig)}`
}

/**
 * Validates if a mint address is usable for Solscan
 * @param mint - The mint address to validate
 * @returns true if mint can be used for explorer links
 */
export function isValidMint(mint: string | null | undefined): boolean {
  return mint !== null && mint !== undefined && mint.length >= 32
}

/**
 * Normalize a Solana address to proper base58 case
 * CRITICAL: Solana addresses are case-sensitive
 * Lowercase addresses may appear as accounts instead of tokens in explorers
 * 
 * @param address - Solana address (can be lowercase or mixed case)
 * @returns Properly cased base58 address
 */
export function normalizeAddressCase(address: string): string {
  try {
    const pubkey = new PublicKey(address)
    return pubkey.toBase58()
  } catch (error) {
    console.warn(`[v0] Failed to normalize address case: ${address}`, error)
    return address
  }
}

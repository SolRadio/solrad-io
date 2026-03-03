/**
 * Extract mint addresses from a parsed Solana transaction
 * Looks for initializeMint and initializeMint2 instructions in both
 * top-level instructions and inner instructions
 */
export function extractMintsFromParsedTx(tx: any): string[] {
  const mints = new Set<string>()
  
  if (!tx?.transaction?.message?.instructions) {
    return []
  }
  
  // Helper to check if instruction is a mint initialization
  const checkInstruction = (instruction: any) => {
    // Check if it's a parsed SPL token instruction
    if (
      instruction?.program === "spl-token" &&
      instruction?.parsed?.type &&
      (instruction.parsed.type === "initializeMint" || instruction.parsed.type === "initializeMint2")
    ) {
      const mint = instruction.parsed?.info?.mint
      if (mint && typeof mint === "string") {
        mints.add(mint)
      }
    }
  }
  
  // Check top-level instructions
  for (const instruction of tx.transaction.message.instructions) {
    checkInstruction(instruction)
  }
  
  // Check inner instructions (from meta)
  if (tx.meta?.innerInstructions) {
    for (const innerGroup of tx.meta.innerInstructions) {
      if (innerGroup.instructions) {
        for (const instruction of innerGroup.instructions) {
          checkInstruction(instruction)
        }
      }
    }
  }
  
  return Array.from(mints)
}

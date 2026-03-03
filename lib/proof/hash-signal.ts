import crypto from "crypto"

export interface SignalProofInput {
  mint: string
  detectedAtUnix: number
  entryPriceUsd: number
  solradScore: number
  signalType: string
  sequenceNumber: number
  volume24h?: number
  liquidityUsd?: number
  detectionType?: string
}

export interface SignalProof {
  input: SignalProofInput
  sha256: string
  proofId: string
}

export function hashSignal(input: SignalProofInput): SignalProof {
  const canonical = [
    input.mint,
    input.detectedAtUnix.toString(),
    input.entryPriceUsd.toFixed(8),
    input.solradScore.toFixed(2),
    input.signalType.toUpperCase(),
    input.sequenceNumber.toString(),
    input.volume24h ? input.volume24h.toFixed(2) : "0",
    input.liquidityUsd ? input.liquidityUsd.toFixed(2) : "0",
  ].join("|")

  const sha256 = crypto
    .createHash("sha256")
    .update(canonical, "utf8")
    .digest("hex")

  const proofId = `solrad_proof_${input.sequenceNumber}_${sha256.slice(0, 8)}`

  return { input, sha256, proofId }
}

export function verifySignalProof(
  input: SignalProofInput,
  expectedSha256: string
): boolean {
  const { sha256 } = hashSignal(input)
  return sha256 === expectedSha256
}

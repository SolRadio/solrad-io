import {
  Connection,
  Keypair,
  Transaction,
  TransactionInstruction,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js"

const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
)

const RPC_ENDPOINTS = [
  process.env.SOLANA_PUBLIC_RPC,
  "https://api.mainnet-beta.solana.com",
  "https://solana-api.projectserum.com",
  process.env.QUICKNODE_SOLANA_RPC_URL,
].filter(Boolean) as string[]

async function getWorkingConnection(): Promise<Connection> {
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const conn = new Connection(endpoint, "confirmed")
      await conn.getLatestBlockhash("confirmed")
      console.log("[SOLRAD-PROOF] Using RPC:", endpoint.slice(0, 40))
      return conn
    } catch {
      console.warn("[SOLRAD-PROOF] RPC failed:", endpoint.slice(0, 40))
      continue
    }
  }
  throw new Error("All RPC endpoints failed")
}

export interface ProofPublication {
  date: string
  merkleRoot: string
  signalCount: number
  prevRoot: string
  solanaTxSignature: string
  publishedAt: number
  explorerUrl: string
}

export async function publishProofToSolana(
  merkleRoot: string,
  date: string,
  signalCount: number,
  prevRoot: string
): Promise<ProofPublication> {
  const privateKeyBase64 = process.env.SOLRAD_PROOF_WALLET_PRIVATE_KEY

  if (!privateKeyBase64) {
    throw new Error("Missing SOLRAD_PROOF_WALLET_PRIVATE_KEY")
  }

  const connection = await getWorkingConnection()

  const privateKeyBytes = Buffer.from(privateKeyBase64, "base64")
  const proofWallet = Keypair.fromSecretKey(privateKeyBytes)

  const balance = await connection.getBalance(proofWallet.publicKey)
  console.log("[SOLRAD-PROOF] Wallet:", proofWallet.publicKey.toBase58())
  console.log("[SOLRAD-PROOF] Balance:", balance / 1e9, "SOL")

  if (balance < 5000) {
    throw new Error(
      "Proof wallet balance too low: " +
        balance +
        " lamports. Send SOL to: " +
        proofWallet.publicKey.toBase58()
    )
  }

  const memoData = "SOLRAD:" + date +
    ":" + merkleRoot.slice(0, 16) +
    ":" + signalCount +
    ":" + Date.now()

  // STEP 5 — Log memo size and content
  console.log("[SOLRAD-PROOF] Memo length:", memoData.length, "chars")
  console.log("[SOLRAD-PROOF] Memo content:", memoData)

  if (memoData.length > 566) {
    throw new Error("Memo data too large for transaction")
  }

  const memoInstruction = new TransactionInstruction({
    keys: [{
      pubkey: proofWallet.publicKey,
      isSigner: true,
      isWritable: true,
    }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoData, "utf8"),
  })

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed")

  // STEP 1 — Log blockhash
  console.log("[SOLRAD-PROOF] Blockhash:", blockhash)
  console.log("[SOLRAD-PROOF] LastValidBlockHeight:", lastValidBlockHeight)

  const transaction = new Transaction().add(memoInstruction)
  transaction.recentBlockhash = blockhash
  transaction.feePayer = proofWallet.publicKey

  // STEP 2 — Serialize and check TX size
  const serialized = transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  })
  console.log("[SOLRAD-PROOF] TX size bytes:", serialized.length)

  // STEP 6 — Verify wallet pubkey
  console.log("[SOLRAD-PROOF] Wallet pubkey:", proofWallet.publicKey.toBase58())

  // STEP 3 — skipPreflight: false for real error messages
  let signature: string
  try {
    signature = await connection.sendTransaction(
      transaction,
      [proofWallet],
      {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      }
    )
  } catch (err: unknown) {
    // STEP 4 — Log full sendTransaction error
    const e = err as { message?: string; logs?: string[]; code?: number }
    console.error("[SOLRAD-PROOF] sendTransaction error:")
    console.error("  message:", e.message)
    console.error("  logs:", e.logs)
    console.error("  code:", e.code)
    throw err
  }

  console.log("[SOLRAD-PROOF] Sent:", signature)

  // Poll for confirmation (up to 60 seconds, 30 checks x 2s)
  let confirmed = false
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    const status = await connection.getSignatureStatus(signature)
    const confirmStatus = status.value?.confirmationStatus
    if (confirmStatus === "confirmed" || confirmStatus === "finalized") {
      confirmed = true
      console.log(
        "[SOLRAD-PROOF] Confirmed after",
        (i + 1) * 2,
        "seconds"
      )
      break
    }
  }

  if (!confirmed) {
    console.warn(
      "[SOLRAD-PROOF] Not confirmed within 60s, signature:",
      signature
    )
  }

  return {
    date,
    merkleRoot,
    signalCount,
    prevRoot,
    solanaTxSignature: signature,
    publishedAt: Date.now(),
    explorerUrl: `https://solscan.io/tx/${signature}`,
  }
}

export async function getProofWalletBalance(): Promise<number> {
  const privateKeyBase64 = process.env.SOLRAD_PROOF_WALLET_PRIVATE_KEY

  if (!privateKeyBase64) return 0

  const connection = await getWorkingConnection()
  const proofWallet = Keypair.fromSecretKey(
    Buffer.from(privateKeyBase64, "base64")
  )

  const balance = await connection.getBalance(proofWallet.publicKey)
  return balance / LAMPORTS_PER_SOL
}

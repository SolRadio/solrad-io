import { TwitterApi } from "twitter-api-v2"

export interface TwitterPublishResult {
  ok: boolean
  tweetId?: string
  tweetUrl?: string
  error?: string
}

export interface DailyDigestData {
  signals: Array<{
    symbol: string
    score: number
    breakoutScore: number
    reasons: string[]
    priceChange1h: number
    priceChange6h: number
    volume24h: number
    pairUrl: string
  }>
  digestType: "morning" | "afternoon"
  date: string
}

function formatMorningTweet(data: DailyDigestData): string {
  const { signals } = data
  if (signals.length === 0) return ""

  const lines = signals.slice(0, 3).map((s, i) => {
    const icon = i === 0 ? "\u{1F534}" : i === 1 ? "\u{1F7E0}" : "\u{1F7E1}"
    const vol =
      s.volume24h >= 1_000_000
        ? `$${(s.volume24h / 1_000_000).toFixed(1)}M vol`
        : `$${(s.volume24h / 1000).toFixed(0)}K vol`
    const change =
      s.priceChange1h >= 0
        ? `+${s.priceChange1h.toFixed(0)}% 1h`
        : `${s.priceChange1h.toFixed(0)}% 1h`
    return `${icon} $${s.symbol} | Score ${s.score} | ${change} | ${vol}`
  })

  return `\u{1F6A8} SOLRAD Morning Signals \u2014 ${data.date}

${lines.join("\n")}

Cryptographically verified. Every signal anchored on-chain before the move.

solrad.io | #Solana #crypto`
}

function formatAfternoonTweet(data: DailyDigestData): string {
  const { signals } = data
  if (signals.length === 0) return ""

  const lines = signals.slice(0, 3).map((s, i) => {
    const icon = i === 0 ? "\u{1F534}" : i === 1 ? "\u{1F7E0}" : "\u{1F7E1}"
    const change6h =
      s.priceChange6h >= 0
        ? `+${s.priceChange6h.toFixed(0)}%`
        : `${s.priceChange6h.toFixed(0)}%`
    return `${icon} $${s.symbol} | Score ${s.score} | ${change6h} 6h | Confidence ${s.breakoutScore}/100`
  })

  return `\u{1F4E1} SOLRAD Afternoon Update \u2014 ${data.date}

Active signals showing momentum:

${lines.join("\n")}

Real-time Solana intelligence. Proof on-chain.

solrad.io | #Solana #SOL`
}

export async function postDailyDigest(
  data: DailyDigestData
): Promise<TwitterPublishResult> {
  const apiKey = process.env.TWITTER_API_KEY
  const apiSecret = process.env.TWITTER_API_SECRET
  const accessToken = process.env.TWITTER_ACCESS_TOKEN
  const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    return {
      ok: false,
      error: "Missing Twitter env vars (TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET)",
    }
  }

  const tweetText =
    data.digestType === "morning"
      ? formatMorningTweet(data)
      : formatAfternoonTweet(data)

  if (!tweetText) {
    return { ok: false, error: "No signals to tweet" }
  }

  try {
    const client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken,
      accessSecret,
    })

    const tweet = await client.v2.tweet(tweetText)
    const tweetId = tweet.data.id
    const tweetUrl = `https://x.com/solaboratoryrad/status/${tweetId}`

    return { ok: true, tweetId, tweetUrl }
  } catch (error: any) {
    const detail =
      error?.data?.detail
      ?? error?.data?.title
      ?? error?.errors?.[0]?.message
      ?? error?.message
      ?? "Twitter API error"
    const code = error?.code ?? error?.status ?? "unknown"
    return {
      ok: false,
      error: `Code ${code}: ${detail}`,
    }
  }
}

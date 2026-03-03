/**
 * Research Content Generator API
 * Generates research reports using OpenAI with strict JSON output
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireServerEnv } from '@/lib/env'
import { setResearchContent, researchKeys } from '@/lib/researchStore'
import { getTrackedTokens } from '@/lib/get-tracked-tokens'
import type { ResearchReport } from '@/lib/types/research'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

interface GenerateRequest {
  mode: 'daily' | 'token' | 'guide'
  date: string
  token?: string
  kind?: 'trending' | 'safety' | 'wallet'
  slug?: string
}

interface OpenAIMessage {
  role: 'system' | 'user'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    // Security: Validate secret
    const secret = request.headers.get('x-research-secret')
    const expectedSecret = requireServerEnv('RESEARCH_GENERATE_SECRET')
    
    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json() as GenerateRequest
    const { mode, date, token, kind, slug } = body

    // Validate required fields
    if (!mode || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: mode, date' },
        { status: 400 }
      )
    }

    if (mode === 'token' && (!token || !kind)) {
      return NextResponse.json(
        { error: 'Token mode requires token and kind fields' },
        { status: 400 }
      )
    }

    if (mode === 'guide' && !slug) {
      return NextResponse.json(
        { error: 'Guide mode requires slug field' },
        { status: 400 }
      )
    }

    // Fetch context data based on mode
    let contextData = ''
    
    if (mode === 'token' && token) {
      // Fetch token analytics
      const tokens = await getTrackedTokens()
      const tokenData = tokens.find(t => 
        t.symbol.toLowerCase() === token.toLowerCase() || 
        t.mint === token
      )
      
      if (tokenData) {
        contextData = `Token Analytics:
- Symbol: ${tokenData.symbol}
- Name: ${tokenData.name}
- SOLRAD Score: ${tokenData.totalScore}
- Risk Label: ${tokenData.riskLabel}
- 24h Volume: $${(tokenData.volume24h / 1000000).toFixed(2)}M
- Liquidity: $${(tokenData.liquidity / 1000000).toFixed(2)}M
- Holder Count: ${tokenData.holderCount}
- Top 10 Holdings: ${tokenData.top10HoldingPercent}%
- Market Cap: $${(tokenData.marketCap / 1000000).toFixed(2)}M`
      }
    } else if (mode === 'daily') {
      // Fetch top performers for daily report
      try {
        const tokens = await getTrackedTokens()
        const topTokens = tokens.slice(0, 10)
        contextData = `Top Performing Tokens Today:
${topTokens.map((t, i) => `${i + 1}. ${t.symbol} - Score: ${t.totalScore}, Volume: $${(t.volume24h / 1000000).toFixed(2)}M`).join('\n')}`
      } catch (error) {
        contextData = 'General market intelligence analysis based on Solana ecosystem trends.'
      }
    }

    // Build OpenAI prompt
    const systemPrompt = `You are a professional crypto analyst for SOLRAD, a Solana market intelligence platform.
Generate research content in STRICT JSON format only. No markdown, no additional text.

The JSON must match this exact schema:
{
  "title": "string",
  "date": "YYYY-MM-DD",
  "type": "daily" | "token" | "guide",
  "summary": "string (2-3 sentences)",
  "sections": [
    { "heading": "string", "bullets": ["string", "string", ...] }
  ],
  "faqs": [
    { "q": "string", "a": "string" }
  ],
  "relatedTokens": ["string", "string", ...],
  "tags": ["string", "string", ...]
}

Guidelines:
- Use real data provided in context
- Do NOT make up fake numbers or statistics
- Keep analysis objective and data-driven
- Include 3-5 sections with 3-5 bullets each
- Include 3-5 FAQs
- List 3-5 related tokens (for token mode)
- Add 5-8 relevant tags`

    let userPrompt = ''
    
    if (mode === 'daily') {
      userPrompt = `Generate a daily market intelligence report for ${date}.
${contextData}

Focus on:
- Market overview and key trends
- Notable token movements
- Risk signals to watch
- Opportunities for traders`
    } else if (mode === 'token' && token && kind) {
      if (kind === 'trending') {
        userPrompt = `Generate a "Why is ${token} trending?" report for ${date}.
${contextData}

Analyze:
- Volume and price movement patterns
- SOLRAD score factors
- Holder behavior
- What's driving attention`
      } else if (kind === 'safety') {
        userPrompt = `Generate a "Is ${token} safe to buy?" safety analysis for ${date}.
${contextData}

Analyze:
- Risk assessment (using SOLRAD risk label)
- Contract security indicators
- Liquidity depth
- Holder concentration risks`
      } else if (kind === 'wallet') {
        userPrompt = `Generate a "${token} wallet behavior analysis" report for ${date}.
${contextData}

Analyze:
- Holder distribution patterns
- Smart money vs retail behavior
- Accumulation/distribution signals
- Top holder activity`
      }
    } else if (mode === 'guide' && slug) {
      userPrompt = `Generate an educational guide: ${slug.replace(/-/g, ' ')} for ${date}.

Create comprehensive educational content about Solana trading, token analysis, or market intelligence.`
    }

    // Call OpenAI API
    const openaiApiKey = requireServerEnv('OPENAI_API_KEY')
    
    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      }),
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      console.error('[v0] OpenAI API error:', error)
      return NextResponse.json(
        { error: 'Failed to generate content from OpenAI' },
        { status: 500 }
      )
    }

    const openaiData = await openaiResponse.json()
    const generatedContent = openaiData.choices[0]?.message?.content

    if (!generatedContent) {
      return NextResponse.json(
        { error: 'No content generated' },
        { status: 500 }
      )
    }

    // Parse and validate JSON
    let researchReport: ResearchReport
    try {
      researchReport = JSON.parse(generatedContent)
      
      // Validate structure
      if (!researchReport.title || !researchReport.date || !researchReport.type || 
          !researchReport.summary || !Array.isArray(researchReport.sections) || 
          !Array.isArray(researchReport.faqs)) {
        throw new Error('Invalid JSON structure')
      }
    } catch (error) {
      console.error('[v0] Invalid JSON from OpenAI:', error)
      return NextResponse.json(
        { error: 'Generated content failed validation', details: generatedContent },
        { status: 500 }
      )
    }

    // Store in KV
    let storageKey: string
    if (mode === 'daily') {
      storageKey = researchKeys.daily(date)
    } else if (mode === 'token' && token && kind) {
      storageKey = researchKeys.token(token, date, kind)
    } else if (mode === 'guide' && slug) {
      storageKey = researchKeys.guide(slug)
    } else {
      return NextResponse.json(
        { error: 'Invalid mode configuration' },
        { status: 400 }
      )
    }

    const stored = await setResearchContent(storageKey, researchReport, 60 * 60 * 24 * 30) // 30 days TTL

    if (!stored) {
      return NextResponse.json(
        { error: 'Failed to store content in KV' },
        { status: 500 }
      )
    }

    // Also publish to Blob storage for public access
    let blobUrl: string | null = null
    try {
      const publishResponse = await fetch(`${new URL(request.url).origin}/api/research/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report: {
            ...researchReport,
            slug: mode === 'daily' ? date : mode === 'token' && token ? `${token}/${date}` : slug || date
          },
          secret: expectedSecret,
        }),
      })

      if (publishResponse.ok) {
        const publishResult = await publishResponse.json()
        blobUrl = publishResult.url
        console.log('[v0] Research report published to Blob:', blobUrl)
      }
    } catch (blobError) {
      console.error('[v0] Failed to publish to Blob (non-fatal):', blobError)
      // Don't fail the entire operation if Blob publish fails
    }

    // Return generated content
    return NextResponse.json({
      success: true,
      key: storageKey,
      blobUrl,
      report: researchReport
    })

  } catch (error) {
    console.error('[v0] Research generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

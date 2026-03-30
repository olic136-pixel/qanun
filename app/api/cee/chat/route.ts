import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Anthropic API key not configured' },
      { status: 500 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    })

    const data = await anthropicRes.json()

    if (!anthropicRes.ok) {
      return NextResponse.json(
        { error: data.error?.message ?? 'Anthropic API error', type: data.error?.type },
        { status: anthropicRes.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/cee/chat] Anthropic proxy error:', err)
    return NextResponse.json(
      { error: 'Failed to reach Anthropic API' },
      { status: 502 }
    )
  }
}

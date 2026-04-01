import { NextRequest, NextResponse } from 'next/server';

const STRIP_PATTERNS: RegExp[] = [
  /\[EXTRACTION READY\]/g,
  /\[PREFLIGHT COMPLETE\]/g,
  /\[[A-Z][A-Z_\s]{2,}\]/g,
];

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured' },
      { status: 500 },
    );
  }

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  let cleaned = body.text ?? '';
  for (const pattern of STRIP_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  cleaned = cleaned.trim();

  if (!cleaned) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        input: cleaned,
        voice: 'onyx',
        response_format: 'mp3',
      }),
    });

    if (!res.ok) {
      console.error('[speak] OpenAI TTS error, status:', res.status);
      return NextResponse.json(
        { error: 'TTS failed' },
        { status: res.status },
      );
    }

    const audioBuffer = await res.arrayBuffer();
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (e) {
    console.error('[speak] Network error:', e);
    return NextResponse.json(
      { error: 'Failed to reach TTS service' },
      { status: 502 },
    );
  }
}

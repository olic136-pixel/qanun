import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured' },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: 'Invalid multipart form data' },
      { status: 400 },
    );
  }

  const audio = formData.get('audio');
  if (!audio || !(audio instanceof Blob)) {
    return NextResponse.json(
      { error: 'Missing or invalid audio field' },
      { status: 400 },
    );
  }

  if (audio.size < 100) {
    return NextResponse.json({ text: '' });
  }

  const mime = audio.type || 'audio/webm';
  const ext = mime.includes('mp4') ? 'mp4' : 'webm';
  const file = new File([audio], `recording.${ext}`, { type: mime });

  const body = new FormData();
  body.append('file', file);
  body.append('model', 'whisper-1');
  body.append('response_format', 'json');
  body.append('language', 'en');

  try {
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body,
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('[transcribe] OpenAI error:', err);
      return NextResponse.json(
        { error: err?.error?.message ?? 'Transcription failed' },
        { status: res.status },
      );
    }

    const result = await res.json();
    return NextResponse.json({ text: result.text.trim() });
  } catch (e) {
    console.error('[transcribe] Network error:', e);
    return NextResponse.json(
      { error: 'Failed to reach transcription service' },
      { status: 502 },
    );
  }
}

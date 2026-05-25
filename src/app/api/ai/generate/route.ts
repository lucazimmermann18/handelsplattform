import { NextResponse } from 'next/server';

function envKeyForProvider(provider: string): string | undefined {
  if (provider === 'anthropic') return process.env.ANTHROPIC_API_KEY;
  if (provider === 'openai')    return process.env.OPENAI_API_KEY;
  if (provider === 'deepseek')  return process.env.DEEPSEEK_API_KEY;
  return undefined;
}

export async function POST(req: Request) {
  let body: { prompt?: string; systemPrompt?: string; model?: string; provider?: string; apiKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 });
  }

  const { prompt, systemPrompt, model, provider, apiKey } = body;

  if (!prompt || !model || !provider) {
    return NextResponse.json({ error: 'Fehlende Parameter: prompt, model, provider' }, { status: 400 });
  }

  // Prefer server-side env key — fall back to client-provided key
  const resolvedKey = (envKeyForProvider(provider) || apiKey || '').trim();

  if (!resolvedKey) {
    return NextResponse.json(
      { error: `Kein API-Key für "${provider}" konfiguriert. Trage den Key in .env.local ein oder hinterlege ihn in den Einstellungen.` },
      { status: 401 }
    );
  }

  const sys = systemPrompt || 'Du bist ein präziser KI-Assistent für eine Handelsplattform (Ostafrika-Export). Antworte auf Deutsch, klar und professionell.';

  try {
    if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': resolvedKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 2048,
          system: sys,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json(
          { error: data.error?.message || `Anthropic Fehler ${res.status}` },
          { status: res.status }
        );
      }
      return NextResponse.json({ text: (data.content?.[0]?.text ?? '') as string });
    }

    // OpenAI-compatible: OpenAI and DeepSeek
    const baseUrl = provider === 'deepseek' ? 'https://api.deepseek.com' : 'https://api.openai.com';
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resolvedKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        messages: [
          { role: 'system', content: sys },
          { role: 'user',   content: prompt },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || `${provider} Fehler ${res.status}` },
        { status: res.status }
      );
    }
    return NextResponse.json({ text: (data.choices?.[0]?.message?.content ?? '') as string });

  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

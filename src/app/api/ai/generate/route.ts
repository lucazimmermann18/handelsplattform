import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  let body: { prompt?: string; systemPrompt?: string; model?: string; provider?: string; apiKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 });
  }

  const { prompt, systemPrompt, model, provider, apiKey } = body;

  if (!prompt || !model || !provider || !apiKey) {
    return NextResponse.json({ error: 'Fehlende Parameter: prompt, model, provider, apiKey' }, { status: 400 });
  }

  const sys = systemPrompt || 'Du bist ein präziser KI-Assistent für eine Handelsplattform (Ostafrika-Export). Antworte auf Deutsch, klar und professionell.';

  try {
    if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
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
      const text: string = data.content?.[0]?.text ?? '';
      return NextResponse.json({ text });
    }

    // OpenAI-compatible: OpenAI and DeepSeek
    const baseUrl = provider === 'deepseek' ? 'https://api.deepseek.com' : 'https://api.openai.com';
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
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
    const text: string = data.choices?.[0]?.message?.content ?? '';
    return NextResponse.json({ text });

  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

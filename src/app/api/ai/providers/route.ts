import { NextResponse } from 'next/server';

// Returns which providers have server-side API keys configured.
// Never exposes the actual key values — only true/false per provider.
export async function GET() {
  return NextResponse.json({
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai:    !!process.env.OPENAI_API_KEY,
    deepseek:  !!process.env.DEEPSEEK_API_KEY,
  });
}

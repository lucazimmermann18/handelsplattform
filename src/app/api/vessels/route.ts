import { NextResponse } from 'next/server';

const BASE = 'https://api.vesselapi.com/v1';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const apiKey = process.env.VESSEL_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'VESSEL_API_KEY not configured' }, { status: 503 });
  }

  const imo  = searchParams.get('imo');
  const q    = searchParams.get('q');   // name search

  let endpoint: string;

  if (imo) {
    endpoint = `${BASE}/vessels?filter.idType=imo&filter.id=${encodeURIComponent(imo)}`;
  } else if (q) {
    endpoint = `${BASE}/vessels?filter.name=${encodeURIComponent(q)}`;
  } else {
    return NextResponse.json({ error: 'Provide ?imo= or ?q=' }, { status: 400 });
  }

  try {
    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 120 },
    });
    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'VesselAPI nicht erreichbar' }, { status: 502 });
  }
}

import { NextResponse } from 'next/server';

const BASE = 'https://api.vesselapi.com/v1';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const apiKey    = process.env.VESSEL_API_KEY;
  const aisApiKey = process.env.BARENTSWATCH_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'VESSEL_API_KEY not configured' }, { status: 503 });
  }

  const imo    = searchParams.get('imo');
  const q      = searchParams.get('q');
  const getPos = searchParams.get('position') === 'true';

  // ── VesselAPI: Stammdaten ─────────────────────────────────────────────────

  const fetchVesselData = async (id: string) => {
    const res = await fetch(
      `${BASE}/vessel/${encodeURIComponent(id)}?filter.idType=imo`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 86400 }, // 24h – Stammdaten ändern selten
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.vessel ?? null;
  };

  // ── BarentsWatch: AIS-Echtzeit-Position ──────────────────────────────────

  const fetchAisPosition = async (mmsi: string) => {
    if (!aisApiKey) return null;
    try {
      const res = await fetch(
        `https://www.barentswatch.no/bwapi/v1/ais/vessels/${encodeURIComponent(mmsi)}/position`,
        {
          headers: { 'Ocp-Apim-Subscription-Key': aisApiKey },
          next: { revalidate: 120 }, // 2 Minuten – Positionen ändern oft
        }
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  // ── Suche nach Name ───────────────────────────────────────────────────────

  if (q) {
    const res = await fetch(
      `${BASE}/search/vessels?filter.name=${encodeURIComponent(q)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 3600 },
      }
    );
    const json = await res.json();
    const vessels: Record<string, unknown>[] = json.vessels ?? [];

    if (getPos && vessels.length > 0) {
      const withPos = await Promise.all(
        vessels.map(async v => {
          if (!v.mmsi) return { ...v, position: null };
          const pos = await fetchAisPosition(String(v.mmsi));
          return { ...v, position: pos };
        })
      );
      return NextResponse.json({ vessels: withPos });
    }

    return NextResponse.json(json, { status: res.status });
  }

  // ── Suche nach IMO ────────────────────────────────────────────────────────

  if (imo) {
    const vessel = await fetchVesselData(imo);

    if (!vessel) {
      return NextResponse.json({ error: 'vessel not found' }, { status: 404 });
    }

    if (getPos && vessel.mmsi) {
      const position = await fetchAisPosition(String(vessel.mmsi));
      return NextResponse.json({ vessel, position });
    }

    return NextResponse.json({ vessel });
  }

  return NextResponse.json({ error: 'Provide ?imo= or ?q=' }, { status: 400 });
}

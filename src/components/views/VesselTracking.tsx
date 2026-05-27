'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

export interface VesselTrackingViewProps { lang: Lang }

// ── Types ─────────────────────────────────────────────────────────────────────

interface LivePosition {
  imo: string;
  mmsi: string;
  name: string;
  lat: number;
  lon: number;
  sog: number;
  cog: number;
  heading: number;
  navStatus: string;
  destination: string;
  eta: string;
  timestamp: string;
  callSign?: string;
  draught?: number;
}

// ── SVG map coordinate helpers ────────────────────────────────────────────────
// SVG viewBox 800×500 covers roughly lon -5°…52°, lat 65°…-40°

const lonToX = (lon: number) => (lon - 4.1) * 8.93 + 319;
const latToY = (lat: number) => (51.9 - lat) * 4.9 + 55;

// ── Port definitions ──────────────────────────────────────────────────────────

const PORTS: Record<string, { x: number; y: number; label: string; lon: number; lat: number }> = {
  MOM: { x: 637, y: 329, label: 'Mombasa',      lon: 39.7,  lat:  -4.0 },
  DAR: { x: 634, y: 341, label: 'Dar es Salaam', lon: 39.3,  lat:  -6.8 },
  CPT: { x: 434, y: 476, label: 'Cape Town',     lon: 18.4,  lat: -33.9 },
  SUZ: { x: 568, y: 167, label: 'Suez',          lon: 32.5,  lat:  30.0 },
  RTM: { x: 319, y:  62, label: 'Rotterdam',     lon:  4.1,  lat:  51.9 },
  HAM: { x: 373, y:  55, label: 'Hamburg',       lon:  9.99, lat:  53.6 },
  FXT: { x: 284, y:  62, label: 'Felixstowe',    lon:  1.35, lat:  51.9 },
  ANT: { x: 326, y:  66, label: 'Antwerp',       lon:  4.4,  lat:  51.2 },
  GOA: { x: 451, y: 114, label: 'Genova',        lon:  8.9,  lat:  44.4 },
};

function getPort(code: string) {
  const key = code?.toUpperCase().trim();
  if (PORTS[key]) return PORTS[key];
  for (const v of Object.values(PORTS)) {
    if (v.label.toUpperCase().startsWith(key) || key.includes(v.label.toUpperCase())) return v;
  }
  return null;
}

// ── Parse VesselAPI + BarentsWatch AIS response ──────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePosition(raw: any): LivePosition | null {
  if (!raw) return null;

  // VesselAPI container (Stammdaten)
  const container = raw.vessel ?? raw.vessels ?? raw.data ?? raw;
  const vessel = Array.isArray(container) ? container[0] : container;
  if (!vessel) return null;

  const imo  = String(vessel.imo  ?? '');
  const name = vessel.name ?? '';
  const mmsi = vessel.mmsi ?? '';

  // BarentsWatch AIS-Position (in raw.position)
  const pos = raw.position ?? null;

  const lat = pos?.latitude  ?? pos?.lat  ?? vessel.latitude  ?? vessel.lat  ?? null;
  const lon = pos?.longitude ?? pos?.lon  ?? vessel.longitude ?? vessel.lng  ?? null;

  if (lat === null || lon === null) return null;

  return {
    imo,
    mmsi:        String(mmsi),
    name,
    lat:         parseFloat(lat),
    lon:         parseFloat(lon),
    sog:         parseFloat(pos?.speedOverGround   ?? pos?.sog     ?? 0),
    cog:         parseFloat(pos?.courseOverGround  ?? pos?.cog     ?? 0),
    heading:     parseFloat(pos?.trueHeading       ?? pos?.heading ?? pos?.cog ?? 0),
    navStatus:   pos?.navigationalStatus ?? pos?.navStatus ?? '',
    destination: pos?.destination ?? '',
    eta:         pos?.eta ?? '',
    timestamp:   pos?.timestamp ?? pos?.lastUpdate ?? new Date().toISOString(),
    callSign:    vessel.call_sign ?? vessel.callSign ?? vessel.callsign,
    draught:     pos?.draught != null ? parseFloat(pos.draught) : undefined,
  };
}

// ── Compass arrow helper ──────────────────────────────────────────────────────

const HeadingArrow = ({ deg, size = 16 }: { deg: number; size?: number }) => {
  const rad = (deg - 90) * Math.PI / 180;
  const cx = size / 2, cy = size / 2, r = size / 2 - 2;
  const tx = cx + r * Math.cos(rad);
  const ty = cy + r * Math.sin(rad);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <line x1={cx} y1={cy} x2={tx} y2={ty} stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={tx} cy={ty} r="1.5" fill="#60a5fa" />
    </svg>
  );
};

// ── Status dot ────────────────────────────────────────────────────────────────

function navDot(status: string) {
  const s = status.toLowerCase();
  if (s.includes('moored') || s.includes('anchor')) return '#fbbf24';
  if (s.includes('under way')) return '#34d399';
  return '#60a5fa';
}

function fmtTimestamp(ts: string) {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' UTC';
  } catch { return ts.slice(11, 16) + ' UTC'; }
}

// ── Main component ────────────────────────────────────────────────────────────

export const VesselTrackingView = ({ lang: _lang }: VesselTrackingViewProps) => {
  const { data: M } = useData();

  // Live positions keyed by IMO
  const [positions, setPositions] = useState<Record<string, LivePosition>>({});
  const [loadingImos, setLoadingImos] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);

  // Search
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState<LivePosition[]>([]);
  const [searching, setSearching]         = useState(false);
  const [searchError, setSearchError]     = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selection
  const [selectedImo, setSelectedImo] = useState<string | null>(null);

  // ── Fetch one vessel position ──────────────────────────────────────────────

  const fetchPosition = useCallback(async (imo: string): Promise<LivePosition | null> => {
    try {
      const res = await fetch(`/api/vessels?imo=${encodeURIComponent(imo)}&position=true`);
      if (res.status === 503) { setApiConfigured(false); return null; }
      setApiConfigured(true);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setErrors(prev => ({ ...prev, [imo]: err.error ?? 'Fehler' }));
        return null;
      }
      const json = await res.json();
      const pos = parsePosition(json);
      if (pos) setErrors(prev => { const n = { ...prev }; delete n[imo]; return n; });
      return pos;
    } catch {
      setErrors(prev => ({ ...prev, [imo]: 'Netzwerkfehler' }));
      return null;
    }
  }, []);

  // ── Fetch all active transit vessels ──────────────────────────────────────

  const fetchAll = useCallback(async () => {
    if (!M) return;
    const TODAY_MS = Date.now();
    const activeOrders = M.orders.filter(o => {
      if (!o.etd || !o.eta) return false;
      return TODAY_MS >= new Date(o.etd).getTime() && TODAY_MS <= new Date(o.eta).getTime();
    });

    const imoSet = new Set<string>();
    activeOrders.forEach(o => {
      const v = M.vessels[o.vesselIdx];
      if (v?.imo) imoSet.add(v.imo);
    });

    if (imoSet.size === 0) return;

    setLoadingImos(new Set(imoSet));
    const results: Record<string, LivePosition> = {};

    await Promise.all(Array.from(imoSet).map(async imo => {
      const pos = await fetchPosition(imo);
      if (pos) results[imo] = pos;
      setLoadingImos(prev => { const n = new Set(prev); n.delete(imo); return n; });
    }));

    setPositions(prev => ({ ...prev, ...results }));
    setLastUpdated(new Date());
  }, [M, fetchPosition]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Live search ────────────────────────────────────────────────────────────

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSearchResults([]); setSearchError(null); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true); setSearchError(null);
      try {
        const res = await fetch(`/api/vessels?q=${encodeURIComponent(q.trim())}&position=true`);
        if (res.status === 503) { setApiConfigured(false); return; }
        const json = await res.json();
        if (!res.ok) { setSearchError(json.error ?? 'Fehler'); return; }
        const raw = json.data ?? json;
        const list = Array.isArray(raw) ? raw : [raw];
        setSearchResults(list.map(parsePosition).filter(Boolean) as LivePosition[]);
      } catch { setSearchError('Netzwerkfehler'); }
      finally { setSearching(false); }
    }, 600);
  };

  // ── Derive transits ────────────────────────────────────────────────────────

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const TODAY_MS = Date.now();
  const activeTransits = M.orders.filter(o => {
    if (!o.etd || !o.eta) return false;
    return TODAY_MS >= new Date(o.etd).getTime() && TODAY_MS <= new Date(o.eta).getTime();
  }).map(o => {
    const etdMs = new Date(o.etd).getTime();
    const etaMs = new Date(o.eta).getTime();
    const progress = etaMs > etdMs ? Math.min(1, Math.max(0, (TODAY_MS - etdMs) / (etaMs - etdMs))) : 0;
    const vessel   = M.vessels[o.vesselIdx];
    const live     = vessel?.imo ? positions[vessel.imo] : undefined;
    const origin   = getPort(o.portLoad);
    const dest     = getPort(o.portDest);
    return { o, progress, vessel, live, origin, dest };
  });

  const usedPorts = new Set<string>();
  activeTransits.forEach(t => {
    if (t.origin) usedPorts.add(t.origin.label);
    if (t.dest)   usedPorts.add(t.dest.label);
  });

  const selectedSearch  = searchResults.find(r => r.imo === selectedImo);
  const selectedLive    = selectedImo ? (positions[selectedImo] ?? selectedSearch) : undefined;

  const isLoading = loadingImos.size > 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="section-head">
        <h1>Vessel Tracking</h1>
        <div className="sub">
          {activeTransits.length} aktive Transporte
          {lastUpdated && <span className="tx3"> · aktualisiert {lastUpdated.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>}
        </div>
        <div className="right">
          {apiConfigured === false ? (
            <Badge kind="danger">VESSEL_API_KEY fehlt in .env.local</Badge>
          ) : apiConfigured === true ? (
            <Badge kind="success" dot>Live AIS · VesselAPI</Badge>
          ) : (
            <Badge kind="neutral" dot>VesselAPI</Badge>
          )}
          <button className="btn sm ghost" onClick={fetchAll} disabled={isLoading} title="Positionen neu laden">
            <Ic name="refresh" size={13} />
            {isLoading ? ' Laden…' : ' Aktualisieren'}
          </button>
        </div>
      </div>

      {/* ── API not configured banner ── */}
      {apiConfigured === false && (
        <div style={{ margin: '0 16px 12px', padding: '12px 16px', borderRadius: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', fontSize: 12.5 }}>
          <div style={{ fontWeight: 600, color: '#fbbf24', marginBottom: 4 }}>API-Key nicht konfiguriert</div>
          <div className="tx3" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
            Trage deinen Key aus <span style={{ color: 'var(--text-2)' }}>dashboard.vesselapi.com</span> in <span style={{ color: 'var(--text-2)' }}>.env.local</span> ein:<br />
            <span style={{ color: '#34d399' }}>VESSEL_API_KEY=dein_key_hier</span>
          </div>
        </div>
      )}

      <div style={{ padding: '0 16px 12px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Ic name="search" size={13} color="var(--text-3)" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Vessel suchen (Name / IMO)…"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 12,
                padding: '7px 10px 7px 28px', outline: 'none',
                position: 'relative',
              }}
            />
            <Ic name="search" size={12} color="var(--text-3)"
              // absolutely positioned — we use a wrapper div instead:
            />
          </div>
          {/* Actual search input with icon overlay */}
          <style>{`.vs-search{position:relative}.vs-search input{padding-left:30px!important}.vs-search .ic{position:absolute;left:9px;top:50%;transform:translateY(-50%)}`}</style>
          {/* (using inline approach above instead) */}

          {/* Search results */}
          {searching && <div className="tx3" style={{ fontSize: 11, textAlign: 'center', padding: 8 }}>Suche…</div>}
          {searchError && <div style={{ fontSize: 11, color: '#f87171', padding: '4px 8px', background: 'rgba(239,68,68,0.08)', borderRadius: 5 }}>{searchError}</div>}
          {searchResults.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '7px 10px', fontSize: 10.5, color: 'var(--text-3)', borderBottom: '1px solid rgba(255,255,255,0.06)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Suchergebnis
              </div>
              {searchResults.slice(0, 5).map(r => (
                <div
                  key={r.imo}
                  onClick={() => setSelectedImo(selectedImo === r.imo ? null : r.imo)}
                  style={{ padding: '9px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: selectedImo === r.imo ? 'rgba(96,165,250,0.08)' : undefined }}
                >
                  <div className="fw500" style={{ fontSize: 12 }}>{r.name}</div>
                  <div className="tx3 mono" style={{ fontSize: 10.5 }}>IMO {r.imo} · {r.navStatus}</div>
                  <div style={{ fontSize: 10.5, marginTop: 3, color: '#60a5fa' }}>
                    {r.lat.toFixed(4)}°, {r.lon.toFixed(4)}° · {r.sog.toFixed(1)} kn
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active transits */}
          <div className="tx3" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>
            Aktive Transporte
          </div>

          {activeTransits.length === 0 && (
            <div className="card" style={{ padding: 20, textAlign: 'center' }}>
              <Ic name="ship" size={28} color="var(--text-3)" />
              <div className="tx3" style={{ fontSize: 12, marginTop: 8 }}>Keine aktiven Transporte</div>
            </div>
          )}

          {activeTransits.map(t => {
            const selected = selectedImo === t.vessel?.imo;
            const live = t.live;
            const isLoadingThis = t.vessel?.imo ? loadingImos.has(t.vessel.imo) : false;
            const errThis = t.vessel?.imo ? errors[t.vessel.imo] : undefined;

            return (
              <div
                key={t.o.id}
                className="card"
                style={{ padding: 12, cursor: 'pointer', border: selected ? '1px solid #60a5fa' : undefined, transition: 'border-color 0.15s' }}
                onClick={() => setSelectedImo(selected ? null : (t.vessel?.imo ?? null))}
              >
                <div className="row" style={{ marginBottom: 5, gap: 6 }}>
                  <Ic name="ship" size={13} color={live ? '#34d399' : '#60a5fa'} />
                  <span className="fw600" style={{ fontSize: 12, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.vessel?.name ?? 'Unbekannt'}
                  </span>
                  {isLoadingThis && <div style={{ width: 9, height: 9, border: '1.5px solid rgba(255,255,255,0.2)', borderTopColor: '#60a5fa', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />}
                  {live && !isLoadingThis && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} title="Live-Daten verfügbar" />}
                </div>

                <div className="tx3" style={{ fontSize: 11, marginBottom: 6 }}>
                  {t.o.portLoad} → {t.o.portDest}
                  {live?.destination && live.destination !== t.o.portDest && (
                    <span style={{ color: '#fbbf24' }}> · AIS: {live.destination}</span>
                  )}
                </div>

                {live && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 7, padding: '5px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div className="tx3" style={{ fontSize: 9, textTransform: 'uppercase' }}>Speed</div>
                      <div className="mono fw600" style={{ fontSize: 12, color: '#60a5fa' }}>{live.sog.toFixed(1)}<span style={{ fontSize: 9, color: 'var(--text-3)' }}> kn</span></div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div className="tx3" style={{ fontSize: 9, textTransform: 'uppercase' }}>Kurs</div>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3 }}>
                        <HeadingArrow deg={live.heading} size={14} />
                        <span className="mono fw600" style={{ fontSize: 12 }}>{Math.round(live.cog)}°</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div className="tx3" style={{ fontSize: 9, textTransform: 'uppercase' }}>Pos</div>
                      <div className="mono" style={{ fontSize: 9, color: 'var(--text-2)' }}>
                        {live.lat.toFixed(2)}°<br />{live.lon.toFixed(2)}°
                      </div>
                    </div>
                  </div>
                )}

                {errThis && <div style={{ fontSize: 10, color: '#f87171', marginBottom: 5 }}>⚠ {errThis}</div>}

                <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 2, marginBottom: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round(t.progress * 100)}%`, background: live ? '#34d399' : '#60a5fa', borderRadius: 2, transition: 'width 0.4s' }} />
                </div>
                <div className="row tx3" style={{ fontSize: 10 }}>
                  <span>{Math.round(t.progress * 100)}% · ETA {fmtDate(t.o.eta)}</span>
                  {live && <span style={{ marginLeft: 'auto', color: '#34d399' }}>Live {fmtTimestamp(live.timestamp)}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Detail card for selected vessel */}
          {selectedLive && (
            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(96,165,250,0.25)' }}>
              <div className="card-head" style={{ background: 'rgba(96,165,250,0.06)' }}>
                <Ic name="ship" size={14} color="#60a5fa" />
                <span className="title" style={{ color: '#60a5fa' }}>{selectedLive.name}</span>
                <span className="meta">IMO {selectedLive.imo} · MMSI {selectedLive.mmsi}</span>
                {selectedLive.callSign && <span className="meta">Call: {selectedLive.callSign}</span>}
                <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={() => setSelectedImo(null)}>
                  <Ic name="x" size={12} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { l: 'Geschwindigkeit', v: `${selectedLive.sog.toFixed(1)} kn`, c: '#60a5fa' },
                  { l: 'Kurs (COG)',       v: `${Math.round(selectedLive.cog)}°`,  c: 'var(--text-2)' },
                  { l: 'Heading',          v: `${Math.round(selectedLive.heading)}°`, c: 'var(--text-2)' },
                  { l: 'Tiefgang',         v: selectedLive.draught ? `${selectedLive.draught} m` : '—', c: 'var(--text-2)' },
                  { l: 'Nav-Status',       v: selectedLive.navStatus || '—', c: navDot(selectedLive.navStatus) },
                ].map(k => (
                  <div key={k.l} style={{ padding: '10px 14px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="tx3" style={{ fontSize: 9, textTransform: 'uppercase', marginBottom: 3 }}>{k.l}</div>
                    <div className="mono fw600" style={{ fontSize: 13, color: k.c }}>{k.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
                {[
                  { l: 'Position',    v: `${selectedLive.lat.toFixed(4)}° N, ${selectedLive.lon.toFixed(4)}° E` },
                  { l: 'Destination', v: selectedLive.destination || '—' },
                  { l: 'ETA (AIS)',   v: selectedLive.eta ? fmtDate(selectedLive.eta) : '—' },
                  { l: 'Letztes AIS', v: fmtTimestamp(selectedLive.timestamp) },
                ].map(k => (
                  <div key={k.l} style={{ padding: '8px 14px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="tx3" style={{ fontSize: 9, textTransform: 'uppercase', marginBottom: 2 }}>{k.l}</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--text-2)' }}>{k.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-head">
              <Ic name="map" size={14} />
              <span className="title">Route-Karte · Ostafrika–Europa</span>
              <span className="meta" style={{ marginLeft: 'auto' }}>
                {Object.keys(positions).length > 0 ? `${Object.keys(positions).length} Live-Positionen` : 'Vereinfacht · nicht maßstäblich'}
              </span>
            </div>
            <div style={{ padding: 12 }}>
              <svg viewBox="0 0 800 500" style={{ width: '100%', height: 'auto', display: 'block', background: 'rgba(6,9,15,0.8)', borderRadius: 6 }}>
                <defs>
                  <style>{`
                    @keyframes spin { to { transform: rotate(360deg); } }
                    @keyframes vesselPulse { 0%,100%{opacity:0.9;r:7} 50%{opacity:0.5;r:11} }
                    .vessel-live { animation: vesselPulse 2.5s infinite; }
                    .vessel-est  { opacity: 0.6; }
                  `}</style>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                <rect width="800" height="500" fill="rgba(6,9,15,0.95)" rx="6" />

                {/* Main shipping lanes */}
                <polyline points="634,341 620,360 590,390 560,420 500,460 440,480 420,470" fill="none" stroke="rgba(34,211,238,0.12)" strokeWidth="1.5" />
                <polyline points="420,470 390,460 350,430 310,380 280,320 270,260 280,200 300,150 320,100 340,70 360,55 373,55" fill="none" stroke="rgba(34,211,238,0.12)" strokeWidth="1.5" />
                <polyline points="637,329 650,310 660,280 655,250 640,220 620,200 600,185 580,170 568,167" fill="none" stroke="rgba(34,211,238,0.12)" strokeWidth="1.5" />
                <polyline points="568,167 555,150 540,130 520,110 500,90 480,75 460,68 440,63 410,60 380,56 350,58 326,66" fill="none" stroke="rgba(34,211,238,0.12)" strokeWidth="1.5" />

                {/* Transit route lines */}
                {activeTransits.map(t => {
                  const isSelected = selectedImo === t.vessel?.imo || selectedImo === null;
                  if (!t.origin || !t.dest) return null;
                  return (
                    <line key={t.o.id}
                      x1={t.origin.x} y1={t.origin.y}
                      x2={t.dest.x}   y2={t.dest.y}
                      stroke="#60a5fa"
                      strokeWidth={selectedImo === t.vessel?.imo ? 2 : 1}
                      strokeOpacity={isSelected ? 0.5 : 0.15}
                      strokeDasharray="5 4"
                    />
                  );
                })}

                {/* Ports */}
                {Object.values(PORTS).map(p => {
                  const isActive = usedPorts.has(p.label);
                  return (
                    <g key={p.label}>
                      {isActive && <circle cx={p.x} cy={p.y} r="9" fill="rgba(34,211,238,0.06)" />}
                      <circle cx={p.x} cy={p.y} r={isActive ? 4 : 2.5}
                        fill={isActive ? '#22d3ee' : '#3a4455'}
                        stroke={isActive ? 'rgba(34,211,238,0.4)' : 'none'}
                        strokeWidth="5"
                      />
                      <text x={p.x + 7} y={p.y + 4}
                        fill={isActive ? '#c9d4e8' : '#3a4455'}
                        fontFamily="Geist Mono" fontSize="9" fontWeight={isActive ? '600' : '400'}
                      >{p.label}</text>
                    </g>
                  );
                })}

                {/* Vessel positions — live (from API) */}
                {activeTransits.map(t => {
                  const live = t.live;
                  if (!live) return null;
                  const vx = lonToX(live.lon);
                  const vy = latToY(live.lat);
                  if (vx < 0 || vx > 800 || vy < 0 || vy > 500) return null;
                  const isSelected = selectedImo === live.imo;

                  return (
                    <g key={`live-${live.imo}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedImo(live.imo === selectedImo ? null : live.imo)}
                    >
                      {isSelected && <circle cx={vx} cy={vy} r="16" fill="rgba(52,211,153,0.1)" />}
                      <circle cx={vx} cy={vy} r="7"
                        fill={isSelected ? '#34d399' : '#22d3ee'}
                        stroke="white" strokeWidth="1.5"
                        className="vessel-live"
                        filter={isSelected ? 'url(#glow)' : undefined}
                      />
                      {/* Heading indicator */}
                      {live.heading > 0 && (() => {
                        const rad = (live.heading - 90) * Math.PI / 180;
                        return <line x1={vx} y1={vy} x2={vx + 14 * Math.cos(rad)} y2={vy + 14 * Math.sin(rad)}
                          stroke="white" strokeWidth="1.5" strokeLinecap="round" />;
                      })()}
                      {(isSelected || selectedImo === null) && (
                        <text x={vx + 10} y={vy - 8} fill="white" fontFamily="Geist" fontSize="9" fontWeight="600">
                          {t.vessel?.name ?? live.name}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Search result vessel on map */}
                {searchResults.map(r => {
                  const vx = lonToX(r.lon);
                  const vy = latToY(r.lat);
                  if (vx < -20 || vx > 820 || vy < -20 || vy > 520) return null;
                  return (
                    <g key={`search-${r.imo}`} style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedImo(r.imo === selectedImo ? null : r.imo)}>
                      <circle cx={vx} cy={vy} r="6" fill="#a78bfa" stroke="white" strokeWidth="1.5" className="vessel-live" />
                      <text x={vx + 9} y={vy - 6} fill="#a78bfa" fontFamily="Geist" fontSize="9" fontWeight="600">{r.name}</text>
                    </g>
                  );
                })}

                {/* Estimated positions for orders without live data */}
                {activeTransits.map(t => {
                  if (t.live) return null;
                  if (!t.origin || !t.dest) return null;
                  const vx = t.origin.x + (t.dest.x - t.origin.x) * t.progress;
                  const vy = t.origin.y + (t.dest.y - t.origin.y) * t.progress;
                  const isSelected = selectedImo === t.vessel?.imo;
                  return (
                    <g key={`est-${t.o.id}`} style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedImo(t.vessel?.imo === selectedImo ? null : (t.vessel?.imo ?? null))}>
                      <circle cx={vx} cy={vy} r="6"
                        fill={isSelected ? '#60a5fa' : '#334155'}
                        stroke={isSelected ? 'white' : 'rgba(255,255,255,0.3)'}
                        strokeWidth="1.5"
                        strokeDasharray={isSelected ? undefined : '2 2'}
                        className="vessel-est"
                      />
                      {isSelected && (
                        <text x={vx + 9} y={vy - 6} fill="rgba(255,255,255,0.7)" fontFamily="Geist" fontSize="9">
                          {t.vessel?.name}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Legend */}
                <g transform="translate(10, 465)">
                  <circle cx="6" cy="6" r="5" fill="#22d3ee" />
                  <text x="15" y="10" fill="rgba(255,255,255,0.5)" fontFamily="Geist" fontSize="8">Live AIS</text>
                  <circle cx="66" cy="6" r="5" fill="#334155" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                  <text x="75" y="10" fill="rgba(255,255,255,0.5)" fontFamily="Geist" fontSize="8">Geschätzt</text>
                  <circle cx="136" cy="6" r="5" fill="#a78bfa" />
                  <text x="145" y="10" fill="rgba(255,255,255,0.5)" fontFamily="Geist" fontSize="8">Suche</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

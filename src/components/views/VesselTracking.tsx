'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

export interface VesselTrackingViewProps { lang: Lang }

interface PortCoords {
  x: number;
  y: number;
  label: string;
}

const PORT_COORDS: Record<string, PortCoords> = {
  mombasa:       { x: 637, y: 329, label: 'Mombasa' },
  'dar es salaam': { x: 634, y: 341, label: 'Dar es Salaam' },
  'cape town':   { x: 434, y: 476, label: 'Cape Town' },
  suez:          { x: 568, y: 167, label: 'Suez' },
  rotterdam:     { x: 319, y: 62,  label: 'Rotterdam' },
  hamburg:       { x: 373, y: 55,  label: 'Hamburg' },
  felixstowe:    { x: 284, y: 62,  label: 'Felixstowe' },
  antwerp:       { x: 326, y: 66,  label: 'Antwerp' },
};

function getPortCoords(name: string): PortCoords | null {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  for (const [k, v] of Object.entries(PORT_COORDS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

const TODAY_MS = new Date('2026-05-26').getTime();

export const VesselTrackingView = ({ lang: _lang }: VesselTrackingViewProps) => {
  const { data: M } = useData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const activeTransits = M.orders.filter(o => {
    if (!o.etd || !o.eta) return false;
    const etdMs = new Date(o.etd).getTime();
    const etaMs = new Date(o.eta).getTime();
    return TODAY_MS >= etdMs && TODAY_MS <= etaMs;
  });

  const transits = activeTransits.map(o => {
    const etdMs = new Date(o.etd).getTime();
    const etaMs = new Date(o.eta).getTime();
    const progress = etaMs > etdMs ? Math.min(1, Math.max(0, (TODAY_MS - etdMs) / (etaMs - etdMs))) : 0;
    const origin = getPortCoords(o.portLoad);
    const dest = getPortCoords(o.portDest);
    let vx: number | null = null;
    let vy: number | null = null;
    if (origin && dest) {
      vx = lerp(origin.x, dest.x, progress);
      vy = lerp(origin.y, dest.y, progress);
    }
    const vessel = M.vessels[o.vesselIdx];
    return { o, progress, origin, dest, vx, vy, vessel };
  });

  const usedPorts = new Set<string>();
  transits.forEach(t => {
    if (t.origin) usedPorts.add(t.origin.label);
    if (t.dest) usedPorts.add(t.dest.label);
  });

  const allPorts = Object.values(PORT_COORDS);

  const selectedTransit = transits.find(t => t.o.id === selectedId);

  return (
    <div>
      <div className="section-head">
        <h1>Vessel Tracking</h1>
        <div className="sub">{activeTransits.length} aktive Transporte</div>
        <div className="right">
          <Badge kind="warning">Live AIS erfordert MarineTraffic API-Key</Badge>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="tx3" style={{ fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>Aktive Transporte</div>
          {transits.length === 0 && (
            <div className="card" style={{ padding: 20, textAlign: 'center' }}>
              <Ic name="ship" size={28} color="var(--text-3)" />
              <div className="tx3" style={{ fontSize: 12, marginTop: 8 }}>Keine aktiven Transporte derzeit</div>
            </div>
          )}
          {transits.map(t => {
            const selected = selectedId === t.o.id;
            return (
              <div
                key={t.o.id}
                className="card"
                style={{ padding: 12, cursor: 'pointer', border: selected ? '1px solid #60a5fa' : undefined }}
                onClick={() => setSelectedId(selected ? null : t.o.id)}
              >
                <div className="row" style={{ marginBottom: 6 }}>
                  <Ic name="ship" size={13} color="#60a5fa" />
                  <span className="fw600" style={{ fontSize: 12, marginLeft: 4 }}>{t.vessel?.name ?? 'Unbekannt'}</span>
                  <span className="mono tx3" style={{ fontSize: 10, marginLeft: 'auto' }}>{t.o.id}</span>
                </div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 6 }}>
                  {t.o.portLoad} → {t.o.portDest}
                </div>
                <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 2, marginBottom: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round(t.progress * 100)}%`, background: '#60a5fa', borderRadius: 2 }} />
                </div>
                <div className="row tx3" style={{ fontSize: 10 }}>
                  <span>{Math.round(t.progress * 100)}% · ETA: {fmtDate(t.o.eta)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-head">
            <Ic name="map" size={14} />
            <span className="title">Route-Karte · Ostafrika–Europa</span>
            <span className="meta" style={{ marginLeft: 'auto' }}>Vereinfacht · nicht maßstäblich</span>
          </div>
          <div style={{ padding: 12 }}>
            <svg viewBox="0 0 800 500" style={{ width: '100%', height: 'auto', display: 'block', background: 'rgba(6,9,15,0.8)', borderRadius: 6 }}>
              <defs>
                <style>{`
                  @keyframes pulse { 0%,100%{r:7;opacity:0.9} 50%{r:11;opacity:0.5} }
                  .vessel-dot { animation: pulse 2s infinite; }
                `}</style>
              </defs>

              <rect width="800" height="500" fill="rgba(6,9,15,0.9)" />

              <polyline
                points="634,341 620,360 590,390 560,420 500,460 440,480 420,470"
                fill="none" stroke="rgba(34,211,238,0.15)" strokeWidth="1"
              />
              <polyline
                points="420,470 390,460 350,430 310,380 280,320 270,260 280,200 300,150 320,100 340,70 360,55 373,55"
                fill="none" stroke="rgba(34,211,238,0.15)" strokeWidth="1"
              />
              <polyline
                points="637,329 650,310 660,280 655,250 640,220 620,200 600,185 580,170 568,167"
                fill="none" stroke="rgba(34,211,238,0.15)" strokeWidth="1"
              />
              <polyline
                points="568,167 555,150 540,130 520,110 500,90 480,75 460,68 440,63 410,60 380,56 350,58 326,66"
                fill="none" stroke="rgba(34,211,238,0.15)" strokeWidth="1"
              />

              {transits.map(t => {
                const isSelected = selectedId === t.o.id || selectedId === null;
                if (!t.origin || !t.dest) return null;
                const opacity = isSelected ? 0.7 : 0.2;
                return (
                  <line
                    key={t.o.id}
                    x1={t.origin.x} y1={t.origin.y}
                    x2={t.dest.x} y2={t.dest.y}
                    stroke="#60a5fa"
                    strokeWidth={selectedId === t.o.id ? 2 : 1}
                    strokeOpacity={opacity}
                    strokeDasharray="4 3"
                  />
                );
              })}

              {allPorts.map(p => {
                const isActive = usedPorts.has(p.label);
                return (
                  <g key={p.label}>
                    <circle cx={p.x} cy={p.y} r={isActive ? 5 : 3}
                      fill={isActive ? '#22d3ee' : '#5d667d'}
                      stroke={isActive ? 'rgba(34,211,238,0.3)' : 'none'}
                      strokeWidth={isActive ? 6 : 0}
                    />
                    <text x={p.x + 7} y={p.y + 4}
                      fill={isActive ? '#e6eaf2' : '#5d667d'}
                      fontFamily="Geist Mono" fontSize="9"
                    >{p.label}</text>
                  </g>
                );
              })}

              {transits.map(t => {
                if (t.vx === null || t.vy === null) return null;
                const isSelected = selectedId === t.o.id;
                const vessel = t.vessel;
                return (
                  <g key={`v-${t.o.id}`}>
                    <circle
                      cx={t.vx} cy={t.vy} r="7"
                      fill={isSelected ? '#3b82f6' : '#60a5fa'}
                      stroke="white" strokeWidth="1.5"
                      className="vessel-dot"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedId(t.o.id === selectedId ? null : t.o.id)}
                    />
                    {isSelected && vessel && (
                      <text x={t.vx + 10} y={t.vy - 8}
                        fill="white" fontFamily="Geist" fontSize="10" fontWeight="600"
                      >{vessel.name}</text>
                    )}
                  </g>
                );
              })}

              {selectedTransit && selectedTransit.origin && selectedTransit.dest && (
                <g>
                  <rect x="10" y="10" width="220" height="70" rx="4"
                    fill="rgba(8,14,24,0.85)" stroke="rgba(96,165,250,0.4)" strokeWidth="1" />
                  <text x="20" y="28" fill="#60a5fa" fontFamily="Geist" fontSize="11" fontWeight="600">
                    {selectedTransit.vessel?.name ?? selectedTransit.o.id}
                  </text>
                  <text x="20" y="44" fill="#8893a8" fontFamily="Geist Mono" fontSize="9">
                    {selectedTransit.o.portLoad} → {selectedTransit.o.portDest}
                  </text>
                  <text x="20" y="58" fill="#8893a8" fontFamily="Geist Mono" fontSize="9">
                    ETA: {fmtDate(selectedTransit.o.eta)} · {Math.round(selectedTransit.progress * 100)}%
                  </text>
                  <text x="20" y="72" fill="#34d399" fontFamily="Geist Mono" fontSize="9">
                    {selectedTransit.vessel?.voyage ?? ''} · IMO {selectedTransit.vessel?.imo ?? '—'}
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

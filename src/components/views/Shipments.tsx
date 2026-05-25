'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { StatusBadge } from '@/components/ui/primitives';
import type { Order } from '@/lib/types';

// ────────────────────────────────────────────────────────────
// Geographic data
// ────────────────────────────────────────────────────────────

type Coord = [number, number];
type Polygon = Coord[];

const CONTINENT_PATHS: Record<string, Polygon[]> = {
  europe: [
    [[-9.5,43.8],[-9,38],[-7,37],[-5.6,36],[-2,36.7],[3,42.4],[3.1,43.4],[-1.4,46.2],[-4.7,48.5],[-1.5,49.4],[2,51],[4.3,52],[6.5,53.6],[9.5,54.5],[11.5,57.6],[12.5,55.6],[13.5,54.5],[18,54.4],[19.4,54.4],[23.2,55],[28,57.5],[31,60],[28.5,67],[18.5,68.5],[14.5,67.7],[12,65],[5,62],[6.5,58.5],[5,58.3],[7,55.3],[6,52],[3,51.4],[-4,50.8],[-5,51.4],[-3.4,53.4],[-2.7,55],[-5.8,55.8],[-7.5,55.2],[-9.5,53.4],[-10.5,52],[-9.5,43.8]],
    [[7.5,44],[14,40],[18.4,40.1],[18.5,40.5],[16.5,41.9],[18,42.8],[16,42],[14,42],[13,45.7],[10,45.8],[8,44],[7.5,44]],
  ],
  africa: [
    [[- 17,15],[-16.5,21.5],[-13.5,28],[-7.7,33],[-1.4,35.7],[3.3,36.5],[9,37.3],[11.5,33.5],[16,32.5],[23.5,32],[26,31.5],[31,31.4],[32.6,30.6],[33.5,28],[35.2,27],[37,22],[39,18],[42,15.5],[44,12.8],[51.4,11.5],[51,9.5],[48,1.7],[45,-2],[40.6,-3.4],[39.5,-7],[40.5,-10.8],[40.5,-15],[34.8,-19.7],[33,-26],[32,-29],[28,-32],[27,-33.7],[22.6,-34.1],[19,-34.7],[17.9,-32.8],[14.4,-22.5],[13.1,-12.5],[8.7,-1],[6,4.4],[3,6],[-1.4,5.4],[-4.5,5.2],[-7.8,4.4],[-12.9,7.6],[-13.5,9.6],[-16.8,12.5],[-16.5,14.4],[-17,15]],
  ],
  arabia: [
    [[34.5,29.4],[35.2,27],[37,22],[39,18],[42,15.5],[44,12.8],[45,12.5],[49,13.5],[52.5,15.5],[54,17.4],[56,18.7],[57.8,19],[59.7,22.6],[58,23.8],[56,24.4],[55,25.4],[51.5,24.5],[50.2,26.4],[48.5,29],[47.5,30],[43,31.5],[39,30.5],[36,29],[35,29.2],[34.5,29.4]],
  ],
  turkey: [
    [[26,40.5],[28,41],[36,42],[42,41.5],[43.5,40.8],[44.5,38.5],[44,37.5],[42,37],[37,36.7],[28.5,36.6],[26.7,38.3],[26,40.5]],
  ],
  uk: [
    [[-5,50],[-2.5,50],[-1,50.7],[1.4,51.4],[1.6,52.8],[0.5,53.5],[-0.7,54.4],[-1.4,54.5],[-3.1,54.6],[-3.6,54.9],[-3,55],[-2.2,56.2],[-3.2,58.7],[-5.4,58.5],[-5.7,57.2],[-5.3,55.9],[-5,53.4],[-3.5,52.4],[-4.7,51.6],[-5,50]],
  ],
};

const baseRouteToNorth: Coord[] = [
  [39.3,-6.82],[42.5,-3],[45.5,1.5],[51,11.5],[50,13.5],[44.5,13.5],[42,18],[38,22],[34.5,27.4],[32.6,30.4],[31.5,32.3],[29,33.5],[22,35.5],[14,37.5],[8,38.5],[2,38],[-3,36.5],[-6,36.5],[-9.5,38.5],[-11,43],[-7,47.5],[-2,50],[2,51.5],[5,52],
];

const routeTo: Record<string, Coord[]> = {
  HAM: [...baseRouteToNorth, [7,53.4],[9.5,53.6]],
  RTM: [...baseRouteToNorth.slice(0,-1),[3.5,52],[4.1,51.95]],
  ANR: [...baseRouteToNorth.slice(0,-1),[3.5,52],[4.34,51.28]],
  FXT: [...baseRouteToNorth.slice(0,-2),[1,50.5],[1.35,51.96]],
  LEH: [...baseRouteToNorth.slice(0,-2),[-1,49.8],[0.1,49.49]],
  GOA: [[39.3,-6.82],[42.5,-3],[45.5,1.5],[51,11.5],[50,13.5],[44.5,13.5],[42,18],[38,22],[34.5,27.4],[32.6,30.4],[31.5,32.3],[25,33.5],[16,38],[10,41],[8.93,44.41]],
};

const CONTAINER_IDS = ['LMCU8814226','MSCU2284991','CMAU7799118','HLCU0042231','ONEU1108332'];
const BOL_PREFIXES = ['MAEU','MSCU','CMAU','HLCU','ONEU'];

// ────────────────────────────────────────────────────────────
// LiveMap
// ────────────────────────────────────────────────────────────

interface LiveMapProps {
  orders: Order[];
  selected: Order | null;
  onSelect: (o: Order) => void;
  compact?: boolean;
}

const W = 1200, H = 560;

const proj = ([lng, lat]: Coord): [number, number] => [
  ((lng + 25) / 80) * W,
  ((65 - lat) / 100) * H,
];

const pathFromCoords = (coords: Coord[]) =>
  coords.map((c, i) => (i === 0 ? 'M' : 'L') + proj(c).map(v => v.toFixed(1)).join(',')).join(' ') + ' Z';

const linePath = (coords: Coord[]) =>
  coords.map((c, i) => (i === 0 ? 'M' : 'L') + proj(c).map(v => v.toFixed(1)).join(' ')).join(' ');

function segLengthsOf(route: Coord[]) {
  const lens: number[] = [];
  for (let i = 0; i < route.length - 1; i++) {
    const [a, b] = [route[i], route[i + 1]];
    lens.push(Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  return lens;
}

function positionOnRoute(route: Coord[], t: number): { lng: number; lat: number; heading: number } {
  const lens = segLengthsOf(route);
  const total = lens.reduce((s, v) => s + v, 0);
  const target = Math.max(0, Math.min(1, t)) * total;
  let cum = 0;
  for (let i = 0; i < lens.length; i++) {
    if (cum + lens[i] >= target) {
      const f = (target - cum) / lens[i];
      const [a, b] = [route[i], route[i + 1]];
      return {
        lng: a[0] + (b[0] - a[0]) * f,
        lat: a[1] + (b[1] - a[1]) * f,
        heading: Math.atan2(b[1] - a[1], b[0] - a[0]),
      };
    }
    cum += lens[i];
  }
  const last = route[route.length - 1];
  return { lng: last[0], lat: last[1], heading: 0 };
}

function partialRoute(route: Coord[], t: number): Coord[] {
  const lens = segLengthsOf(route);
  const total = lens.reduce((s, v) => s + v, 0);
  const target = Math.max(0, Math.min(1, t)) * total;
  let cum = 0;
  const partial: Coord[] = [route[0]];
  for (let i = 0; i < lens.length; i++) {
    const [a, b] = [route[i], route[i + 1]];
    if (cum + lens[i] <= target) {
      partial.push(b);
    } else {
      const f = (target - cum) / lens[i];
      partial.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
      break;
    }
    cum += lens[i];
  }
  return partial;
}

const LiveMap = ({ orders, selected, onSelect, compact = false }: LiveMapProps) => {
  const { data: liveData } = useData();
  const [tick, setTick] = useState(0);
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1);
      setTimeStr(new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 60);
    return () => clearInterval(id);
  }, []);

  const vessels = useMemo(() => orders.map((o, idx) => {
    const route = routeTo[o.portDest] ?? routeTo.HAM;
    const baseT = (o.progressPct ?? (o.status === 'in_export' ? 2 : 50)) / 100;
    const wobble = Math.sin((tick + idx * 7) / 80) * 0.0015;
    const t = Math.max(0, Math.min(1, baseT + wobble));
    const { lng, lat, heading } = positionOnRoute(route, t);
    return { o, lng, lat, heading, route, t };
  }), [orders, tick]);

  const portList = Object.entries(liveData?.ports ?? {});

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 10 }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block', background: 'radial-gradient(ellipse at 50% 35%, #0b1320 0%, #06090f 100%)' }}>
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.018)" strokeWidth="1" />
          </pattern>
          <radialGradient id="vesselGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />

        {/* Graticule */}
        {[-30,-15,0,15,30,45,60].map(lat => (
          <line key={'lat'+lat} x1={0} x2={W} y1={proj([0,lat])[1]} y2={proj([0,lat])[1]} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
        ))}
        {[-20,-10,0,10,20,30,40,50].map(lng => (
          <line key={'lng'+lng} x1={proj([lng,0])[0]} x2={proj([lng,0])[0]} y1={0} y2={H} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
        ))}
        <line x1={0} x2={W} y1={proj([0,0])[1]} y2={proj([0,0])[1]} stroke="rgba(255,255,255,0.06)" strokeWidth="0.6" strokeDasharray="3 4" />

        {/* Continents */}
        {Object.entries(CONTINENT_PATHS).map(([k, polys]) =>
          polys.map((poly, i) => (
            <path key={k + i} d={pathFromCoords(poly)} fill="#0f1828" stroke="#1d2a45" strokeWidth="0.7" strokeLinejoin="round" />
          ))
        )}

        {/* Routes — faded full path */}
        {vessels.map(({ o, route }) => (
          <path key={'r'+o.id} d={linePath(route)} fill="none" stroke="rgba(34,211,238,0.18)" strokeWidth="1" strokeDasharray="2 4" />
        ))}

        {/* Routes — solid progress */}
        {vessels.map(({ o, route, t }) => (
          <path key={'p'+o.id} d={linePath(partialRoute(route, t))} fill="none" stroke="#22d3ee" strokeWidth="1.3" opacity="0.85" />
        ))}

        {/* Ports */}
        {portList.map(([k, p]) => {
          const [x, y] = proj([p.lng, p.lat]);
          return (
            <g key={k}>
              <circle cx={x} cy={y} r="4" fill="rgba(59,130,246,0.18)" />
              <circle cx={x} cy={y} r="2.2" fill="#60a5fa" stroke="#0b1320" strokeWidth="0.6" />
              <text x={x + 6} y={y + 3} fill="#8893a8" fontFamily="Geist Mono" fontSize={compact ? 8.5 : 9.5} fontWeight="500">{p.code}</text>
            </g>
          );
        })}

        {/* Vessels */}
        {vessels.map(({ o, lng, lat, heading, t }, i) => {
          const [x, y] = proj([lng, lat]);
          const deg = (heading * 180) / Math.PI;
          const isSel = selected?.id === o.id;
          return (
            <g key={o.id} transform={`translate(${x},${y})`} style={{ cursor: 'pointer' }} onClick={() => onSelect(o)}>
              <circle r={isSel ? 22 : 14} fill="url(#vesselGlow)" />
              <circle r={6 + Math.sin(tick / 12 + i) * 1.4} fill="none" stroke="#22d3ee" strokeWidth="0.6" opacity={0.5} />
              <g transform={`rotate(${deg})`}>
                <path d="M-5,-2.5 L5,0 L-5,2.5 L-3,0 Z" fill="white" stroke="#22d3ee" strokeWidth="0.6" strokeLinejoin="round" />
              </g>
              <g transform="translate(7,-7)">
                <rect x="0" y="-9" width="78" height="18" rx="2" fill="rgba(8,14,24,0.85)" stroke="rgba(34,211,238,0.4)" strokeWidth="0.6" />
                <text x="4" y="-1" fill="#22d3ee" fontFamily="Geist Mono" fontSize="7.5" fontWeight="600">{o.id}</text>
                <text x="4" y="6.5" fill="#98a2b8" fontFamily="Geist Mono" fontSize="6.5">{Math.round(t * 100)}% · {o.portLoad}→{o.portDest}</text>
              </g>
            </g>
          );
        })}

        {/* Scale bar */}
        <g transform={`translate(${W - 90},${H - 36})`}>
          <text x="0" y="0" fill="#5d667d" fontFamily="Geist Mono" fontSize="8">0      500km     1500</text>
          <line x1="0" y1="6" x2="80" y2="6" stroke="#5d667d" strokeWidth="0.6" />
          {[0,20,40,60,80].map(x => <line key={x} x1={x} y1="4" x2={x} y2="8" stroke="#5d667d" strokeWidth="0.6" />)}
        </g>
      </svg>

      {/* LIVE badge */}
      <div style={{ position: 'absolute', left: 12, top: 12, background: 'rgba(8,14,24,0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '6px 9px', fontSize: 10, fontFamily: 'Geist Mono' }}>
        <div className="row" style={{ gap: 6 }}>
          <span className="dot" style={{ background: '#22d3ee', boxShadow: '0 0 6px #22d3ee' }} />
          <span style={{ color: '#22d3ee' }}>LIVE</span>
          <span className="tx3">· AIS feed · {timeStr}</span>
        </div>
      </div>

      {/* Vessel list panel */}
      {!compact && (
        <div style={{ position: 'absolute', right: 12, top: 12, width: 240, background: 'rgba(8,14,24,0.72)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 4, maxHeight: 'calc(100% - 24px)', overflowY: 'auto' }}>
          {vessels.map(({ o, t }) => {
            const v = (liveData?.vessels ?? [])[o.vesselIdx];
            const isSel = selected?.id === o.id;
            return (
              <div key={o.id} onClick={() => onSelect(o)} style={{ padding: '8px 9px', borderRadius: 4, cursor: 'pointer', background: isSel ? 'rgba(34,211,238,0.08)' : 'transparent', borderLeft: `2px solid ${isSel ? '#22d3ee' : 'transparent'}`, marginBottom: 1 }}>
                <div className="row" style={{ gap: 6, justifyContent: 'space-between' }}>
                  <span className="mono fw500" style={{ fontSize: 10.5, color: '#22d3ee' }}>{v?.name}</span>
                  <span className="mono tx3" style={{ fontSize: 9.5 }}>{Math.round(t * 100)}%</span>
                </div>
                <div className="row tx3 mono" style={{ fontSize: 9.5, marginTop: 2 }}>
                  <span>{o.portLoad} → {o.portDest}</span>
                  <span style={{ marginLeft: 'auto' }}>{o.id}</span>
                </div>
                <div className="progress" style={{ marginTop: 4, height: 3 }}>
                  <div style={{ width: `${Math.round(t * 100)}%`, background: '#22d3ee' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// ShipmentsView
// ────────────────────────────────────────────────────────────

interface ShipmentsViewProps {
  lang: Lang;
  onOpenOrder: (order: Order) => void;
}

export const ShipmentsView = ({ lang, onOpenOrder }: ShipmentsViewProps) => {
  const { data: M } = useData();
  const inTransit = (M?.orders ?? []).filter(o => ['in_export','shipped','in_transit','arrived'].includes(o.status));
  const [selected, setSelected] = useState<Order | null>(null);
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const sel = selected ?? inTransit[1] ?? inTransit[0] ?? null;
  const v = sel ? M.vessels[sel.vesselIdx] : null;

  const lateOrders = M.orders.filter(o => o.status === 'problem' && ['in_export','shipped','in_transit','arrived'].includes(o.status));
  const kpis = [
    { l: 'Auf See', v: M.orders.filter(o => o.status === 'in_transit').length, c: '#22d3ee' },
    { l: 'Im Hafen', v: M.orders.filter(o => o.status === 'arrived').length, c: '#34d399' },
    { l: 'Exportdok.', v: M.orders.filter(o => o.status === 'in_export').length, c: '#fbbf24' },
    { l: 'Aktive Verschiffungen', v: inTransit.length, c: '#60a5fa' },
    { l: 'Verschiffungen gesamt', v: M.orders.filter(o => ['in_export','shipped','in_transit','arrived','delivered','paid'].includes(o.status)).length, c: '#a78bfa' },
    { l: 'Verspätet / Problem', v: lateOrders.length, c: '#f87171' },
  ];

  const pct = sel?.progressPct ?? 0;

  const timelineEvents = sel ? [
    { text: 'Geladen Dar es Salaam', meta: fmtDate(sel.etd) + ' · 09:24', s: 'done' },
    { text: 'Schiff abgefahren', meta: fmtDate(sel.etd) + ' · 18:50', s: sel.status === 'in_export' ? 'future' : 'done' },
    { text: 'Suezkanal Transit', meta: 'ETA ' + fmtDate(sel.etd) + ' + 11d', s: pct > 40 ? 'done' : pct > 10 ? 'active' : 'future' },
    { text: 'Mediterranean', meta: 'On schedule', s: pct > 60 ? 'done' : pct > 40 ? 'active' : 'future' },
    { text: 'Gibraltar', meta: 'ETA approx.', s: pct > 80 ? 'done' : pct > 60 ? 'active' : 'future' },
    { text: 'Ankunft ' + sel.portDest, meta: fmtDate(sel.eta), s: sel.status === 'arrived' ? 'active' : 'future' },
  ] : [];

  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_shipments')}</h1>
        <div className="sub">{inTransit.length} aktive Verschiffungen · 8 Container · 3 Reefer · 1 Bulk</div>
        <div className="right">
          <button className="btn"><Ic name="refresh" size={13} /> AIS-Feed</button>
          <button className="btn"><Ic name="download" size={13} /> {t(lang, 'export')}</button>
          <button className="btn primary"><Ic name="plus" size={13} /> Shipment buchen</button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 12 }}>
          {kpis.map((k, i) => (
            <div key={i} className="tile kacheln" style={{ padding: 9 }}>
              <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.l}</div>
              <div className="mono fw600" style={{ fontSize: 18, color: k.c, marginTop: 2 }}>{k.v}</div>
            </div>
          ))}
        </div>

        {/* Live Map */}
        <div className="card" style={{ height: 480, overflow: 'hidden' }}>
          <LiveMap orders={inTransit} selected={sel} onSelect={setSelected} />
        </div>

        {/* Table + detail panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 12, marginTop: 12 }}>
          <div className="card">
            <div className="card-head">
              <Ic name="ship" size={14} />
              <span className="title">Alle Shipments</span>
              <span className="meta">{inTransit.length}</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Shipment</th>
                  <th>Vessel · Voyage</th>
                  <th>Container</th>
                  <th>Route</th>
                  <th>ETD</th>
                  <th>ETA</th>
                  <th>Status</th>
                  <th>Fortschritt</th>
                </tr>
              </thead>
              <tbody>
                {inTransit.map(o => {
                  const ve = M.vessels[o.vesselIdx];
                  const isSel = sel?.id === o.id;
                  return (
                    <tr key={o.id} onClick={() => setSelected(o)} style={{ cursor: 'pointer', background: isSel ? 'rgba(34,211,238,0.05)' : undefined }}>
                      <td>
                        <span className="id">{o.id.replace('ORD','SHP')}</span>
                        <div className="tx3 mono" style={{ fontSize: 10 }}>{o.id}</div>
                      </td>
                      <td>
                        <div className="mono fw500">{ve?.name}</div>
                        <div className="tx3 mono" style={{ fontSize: 10 }}>{ve?.voyage} · {ve?.operator}</div>
                      </td>
                      <td className="mono" style={{ fontSize: 11 }}>{CONTAINER_IDS[o.vesselIdx] ?? '—'}</td>
                      <td className="mono tx2" style={{ fontSize: 11 }}>{o.portLoad} → {o.portDest}</td>
                      <td className="mono tx2" style={{ fontSize: 11 }}>{fmtDate(o.etd)}</td>
                      <td className="mono tx2" style={{ fontSize: 11 }}>{fmtDate(o.eta)}</td>
                      <td><StatusBadge s={o.status} lang={lang} /></td>
                      <td>
                        <div className="progress" style={{ width: 60 }}>
                          <div style={{ width: (o.progressPct ?? 0) + '%', background: '#22d3ee' }} />
                        </div>
                        <div className="mono tx3" style={{ fontSize: 10, marginTop: 2 }}>{o.progressPct ?? 0}%</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Detail panel */}
          {sel && v && (
            <div className="card">
              <div className="card-head">
                <Ic name="ship" size={14} />
                <span className="title">{v.name}</span>
                <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={() => onOpenOrder(sel)}>
                  <Ic name="arrow_r" size={11} />
                </button>
              </div>
              <div className="card-body">
                <div className="fields">
                  <div className="l">Shipment</div><div className="v mono">{sel.id.replace('ORD','SHP')}</div>
                  <div className="l">Auftrag</div><div className="v mono">{sel.id}</div>
                  <div className="l">Vessel · IMO</div><div className="v mono">{v.name} · {v.imo}</div>
                  <div className="l">Voyage</div><div className="v mono">{v.voyage}</div>
                  <div className="l">Reederei</div><div className="v">{v.operator}</div>
                  <div className="l">Container</div><div className="v mono">{CONTAINER_IDS[sel.vesselIdx] ?? '—'} · Seal 4427-A</div>
                  <div className="l">ETD / ETA</div><div className="v mono">{fmtDate(sel.etd)} → {fmtDate(sel.eta)}</div>
                  <div className="l">Route</div><div className="v mono">{sel.portLoad} → Suez → {sel.portDest}</div>
                  <div className="l">Bill of Lading</div><div className="v mono">{(BOL_PREFIXES[sel.vesselIdx] ?? 'MAEU')}2284991</div>
                </div>
                <div className="sep" />
                <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 8 }}>Container Events</div>
                <div className="timeline">
                  {timelineEvents.map((e, i) => (
                    <div key={i} className={`ev ${e.s}`}>
                      <div className="t">{e.text}</div>
                      <div className="m">{e.meta}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

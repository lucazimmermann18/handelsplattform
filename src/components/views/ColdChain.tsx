'use client';

import React from 'react';
import type { Lang } from '@/lib/i18n';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

interface ColdChainViewProps { lang: Lang; }

interface Reefer {
  id: string; container: string; order: string; product: string;
  vessel: string; set: string; current: string; min: string; max: string;
  status: 'normal' | 'breach'; breaches: number; sensor: string;
  readings: number; breachDetails?: string;
  etd: string; eta: string; portLoad: string; portDest: string;
}

const REEFERS: Reefer[] = [
  {
    id: 'SHP-0135-RC', container: 'CMAU7799118', order: 'ORD-2026-0135',
    product: 'Avocado Hass Size 18', vessel: 'ONE TRADITION',
    set: '+5.5°C', current: '+5.4°C', min: '+5.1°C', max: '+5.8°C',
    status: 'normal', breaches: 0, sensor: 'Emerson CT-1850',
    readings: 4200, etd: '2026-05-10', eta: '2026-06-08',
    portLoad: 'Mombasa', portDest: 'Rotterdam',
  },
  {
    id: 'SHP-0118-RC', container: 'LMCU6648721', order: 'ORD-2026-0118',
    product: 'Frozen Beef Boneless (–18°C)', vessel: 'MAERSK COPENHAGEN',
    set: '–18°C', current: '–18.2°C', min: '–18.4°C', max: '–17.6°C',
    status: 'normal', breaches: 0, sensor: 'StarCool SC-3 IoT',
    readings: 1860, etd: '2026-05-18', eta: '2026-06-14',
    portLoad: 'Dar es Salaam', portDest: 'Hamburg',
  },
  {
    id: 'SHP-0098-RC', container: 'MSCU8814226', order: 'ORD-2025-0098',
    product: 'Avocado Hass Size 20 (historisch)', vessel: 'MSC OSCAR',
    set: '+5.5°C', current: '+5.5°C', min: '+4.9°C', max: '+11.2°C',
    status: 'breach', breaches: 1, sensor: 'Emerson CT-1850',
    readings: 5040, etd: '2025-12-02', eta: '2025-12-30',
    portLoad: 'Mombasa', portDest: 'Felixstowe',
    breachDetails: 'Suezkanal Stopp · 6h auf +11.2°C (Limit +7°C) · Reklamation CLM-2026-001 eingereicht · Schadensersatz €12.4k geltend',
  },
];

// Deterministic noise — no Math.random()
function tempNoise(i: number, seed: number): number {
  return (Math.sin((i + seed) * 0.731) + Math.sin((i * 1.2 + seed) * 0.413)) * 0.65;
}

function buildTempPoints(r: Reefer): string {
  const seed = r.container.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % 97;
  return Array.from({ length: 80 }, (_, i) => {
    let y = 30 + Math.sin(i / 4) * 2 + tempNoise(i, seed);
    if (r.status === 'breach' && i > 32 && i < 44) y = 5 + (i - 32) * 0.8;
    if (r.status === 'breach' && i >= 44 && i < 52) y = 12 - (i - 44) * 0.8;
    return `${i * 10},${y.toFixed(1)}`;
  }).join(' ');
}

const DOCS = [
  { label: 'Reefer Certificate (Emerson)', filed: true },
  { label: 'Temperature Protocol (pre-cooling)', filed: true },
  { label: 'Sensor Log Export (CSV)', filed: true },
  { label: 'Carrier Reefer Booking Confirmation', filed: true },
  { label: 'EU Health Certificate', filed: true },
  { label: 'Continuous Temperature Record (CTR)', filed: false },
];

export const ColdChainView = ({ lang: _lang }: ColdChainViewProps) => {
  const handleSensorExport = () => {
    const headers = ['Container-ID','Container-Nr.','Auftrag','Produkt','Schiff','Soll-Temp','Ist-Temp','Min-Temp','Max-Temp','Sensor','Readings','Status','Verletzungen','ETD','ETA','Ladehafen','Zielhafen','Details'];
    const rows = REEFERS.map(r => [
      r.id, r.container, r.order, r.product, r.vessel,
      r.set, r.current, r.min, r.max,
      r.sensor, r.readings, r.status, r.breaches,
      r.etd, r.eta, r.portLoad, r.portDest,
      r.breachDetails ?? '',
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `sensor-reports-${new Date().toISOString().slice(0,10)}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const activeReefers = REEFERS.filter(r => !r.order.includes('2025')).length;
  const okCount = REEFERS.filter(r => r.status === 'normal' && !r.order.includes('2025')).length;
  const breachHistory = REEFERS.filter(r => r.status === 'breach').length;
  const totalReadings = REEFERS.reduce((s, r) => s + r.readings, 0);

  return (
    <div>
      <div className="section-head">
        <h1>Cold Chain Monitor</h1>
        <div className="sub">Reefer-Container · Temperatur-Tracking · Kühlkettennachweis für EU-Import</div>
        <div className="right">
          <button className="btn" onClick={handleSensorExport}><Ic name="download" size={13} /> Sensor-Reports</button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
          {[
            { l: 'Aktive Reefer',        v: activeReefers,                      c: '#22d3ee', sub: 'auf See' },
            { l: 'Temperatur auf Spec',   v: okCount + '/' + activeReefers,      c: '#34d399', sub: 'aktuell' },
            { l: 'Breaches (90 Tage)',    v: breachHistory,                      c: breachHistory > 0 ? '#fbbf24' : '#34d399', sub: 'historisch' },
            { l: 'Sensor-Readings',       v: totalReadings.toLocaleString('de-DE'), c: '#60a5fa', sub: 'gesamt' },
          ].map((k, i) => (
            <div key={i} className="card" style={{ padding: 14 }}>
              <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.l}</div>
              <div className="mono fw600" style={{ fontSize: 22, color: k.c, marginTop: 4 }}>{k.v}</div>
              <div className="tx3" style={{ fontSize: 11, marginTop: 2 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* AI summary */}
        <div className="ai-card" style={{ marginBottom: 12 }}>
          <div className="head">
            <span className="pill">Kühlketten-Status</span>
            <Badge kind="success" dot>2 aktive Reefer auf Spec</Badge>
          </div>
          <div className="tx2" style={{ fontSize: 12, lineHeight: 1.55 }}>
            Alle aktiven Reefer halten die vorgeschriebenen Temperaturfenster ein.
            Historischer Breach bei <span className="mono fw500">ORD-2025-0098</span> (Suezkanal Stopp) befindet sich in der Claim-Bearbeitung.
            Sensor-Reports werden automatisch an <span className="fw500">TRACES NT</span> für den EU-Veterinärnachweis übermittelt.
          </div>
        </div>

        {/* Reefer cards */}
        {REEFERS.map(r => {
          const isHistoric = r.order.includes('2025');
          const strokeColor = r.status === 'breach' ? '#fbbf24' : '#22d3ee';
          const points = buildTempPoints(r);

          return (
            <div key={r.id} className="card" style={{ marginBottom: 12 }}>
              <div className="card-head">
                <Ic name="ship" size={14} color={strokeColor} />
                <span className="title">{r.product}</span>
                <span className="mono tx3" style={{ fontSize: 10.5 }}>{r.container}</span>
                {isHistoric && <Badge kind="neutral">Historisch</Badge>}
                <Badge kind={r.status === 'breach' ? 'warning' : 'success'} dot>
                  {r.status === 'breach' ? 'Cold-Chain-Breach' : 'Auf Spec'}
                </Badge>
              </div>

              <div className="card-body">
                {/* Metadata grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.8fr 0.8fr 0.8fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 3 }}>Vessel · Auftrag</div>
                    <div className="mono fw500" style={{ fontSize: 12 }}>{r.vessel}</div>
                    <div className="tx3 mono" style={{ fontSize: 10 }}>{r.order}</div>
                  </div>
                  <div>
                    <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 3 }}>Set Point</div>
                    <div className="mono fw600" style={{ fontSize: 15 }}>{r.set}</div>
                  </div>
                  <div>
                    <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 3 }}>Aktuell</div>
                    <div className="mono fw600" style={{ fontSize: 15, color: '#34d399' }}>{r.current}</div>
                  </div>
                  <div>
                    <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 3 }}>Min / Max</div>
                    <div className="mono fw500" style={{ fontSize: 12 }}>
                      {r.min} / <span style={{ color: r.status === 'breach' ? '#f87171' : 'var(--text)' }}>{r.max}</span>
                    </div>
                  </div>
                  <div>
                    <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 3 }}>Route · ETD/ETA</div>
                    <div className="mono" style={{ fontSize: 11 }}>{r.portLoad} → {r.portDest}</div>
                    <div className="tx3 mono" style={{ fontSize: 10 }}>{r.etd} → {r.eta}</div>
                  </div>
                  <div>
                    <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 3 }}>Sensor · Reads</div>
                    <div className="mono" style={{ fontSize: 11 }}>{r.sensor}</div>
                    <div className="tx3 mono" style={{ fontSize: 10 }}>{r.readings.toLocaleString('de-DE')} reads</div>
                  </div>
                </div>

                {/* Temperature trace */}
                <div style={{ background: 'var(--bg)', borderRadius: 4, padding: '8px 10px' }}>
                  <div className="tx3" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                    Temperaturverlauf · kontinuierlich · ETD → ETA
                  </div>
                  <svg viewBox="0 0 800 54" preserveAspectRatio="none" style={{ width: '100%', height: 54 }}>
                    {/* Spec band */}
                    <rect x="0" y="17" width="800" height="20" fill="rgba(16,185,129,0.07)" />
                    <line x1="0" x2="800" y1="27" y2="27" stroke="rgba(16,185,129,0.4)" strokeDasharray="3 5" />
                    {/* Breach zone */}
                    {r.status === 'breach' && (
                      <>
                        <rect x="320" y="0" width="120" height="54" fill="rgba(245,158,11,0.07)" />
                        <line x1="320" x2="320" y1="0" y2="54" stroke="rgba(245,158,11,0.4)" strokeDasharray="2 3" />
                        <line x1="440" x2="440" y1="0" y2="54" stroke="rgba(245,158,11,0.4)" strokeDasharray="2 3" />
                      </>
                    )}
                    {/* Temperature polyline */}
                    <polyline
                      points={points}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="1.3"
                      strokeLinejoin="round"
                    />
                    {/* Time axis */}
                    {(['ETD', '+5d', '+10d', '+15d', 'ETA'] as const).map((lbl, i) => (
                      <text key={i} x={i * 200} y="52" fill="rgba(255,255,255,0.25)" fontSize="7" fontFamily="Geist Mono, monospace">{lbl}</text>
                    ))}
                  </svg>
                </div>

                {/* Breach alert */}
                {r.breachDetails && (
                  <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: 6 }}>
                    <div className="row" style={{ marginBottom: 4, gap: 6 }}>
                      <Ic name="warn" size={12} color="#fbbf24" />
                      <span className="fw600" style={{ fontSize: 11.5 }}>Cold-Chain-Breach dokumentiert</span>
                    </div>
                    <div className="tx2" style={{ fontSize: 11, lineHeight: 1.5 }}>{r.breachDetails}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Required documentation */}
        <div className="card">
          <div className="card-head">
            <Ic name="doc" size={14} />
            <span className="title">EU-Pflichtdokumentation · Kühlkettennachweis</span>
            <span className="meta">{DOCS.filter(d => d.filed).length}/{DOCS.length} vollständig</span>
          </div>
          <div className="card-body">
            {DOCS.map((doc, i) => (
              <div key={i} className="row" style={{ padding: '7px 0', borderBottom: i < DOCS.length - 1 ? '1px solid var(--border)' : 'none', gap: 10 }}>
                <Ic name={doc.filed ? 'task' : 'clock'} size={13} color={doc.filed ? '#34d399' : '#fbbf24'} />
                <span className="tx2" style={{ flex: 1, fontSize: 12 }}>{doc.label}</span>
                <Badge kind={doc.filed ? 'success' : 'warning'}>
                  {doc.filed ? 'Vorhanden' : 'Ausstehend'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

interface EUDRViewProps { lang: Lang; }

// EUDR-relevant product categories per Regulation (EU) 2023/1115
const EUDR_CATS = ['Kaffee', 'Fleisch', 'Saaten'];

// Deterministic GPS status per supplier (seed from ID chars)
function supplierGpsStatus(suppId: string): 'complete' | 'partial' | 'missing' {
  const n = suppId.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % 10;
  if (n < 6) return 'complete';
  if (n < 9) return 'partial';
  return 'missing';
}

// Deterministic DDS status per order
function ddsStatus(orderId: string): 'submitted' | 'draft' | 'missing' {
  const n = orderId.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % 10;
  if (n < 5) return 'submitted';
  if (n < 8) return 'draft';
  return 'missing';
}

const REGULATIONS = [
  { code: 'Art. 3', title: 'Sorgfaltspflicht (Due Diligence)', deadline: '2025-12-30', readiness: 88, detail: 'Risikoanalyse + Risikominderungsmaßnahmen für alle EUDR-Waren dokumentieren.' },
  { code: 'Art. 9', title: 'GPS-Koordinaten Erzeuger', deadline: '2025-12-30', readiness: 78, detail: 'Exakte Geokoordinaten der Erzeugerparzellen für Kaffee, Fleisch, Soja, Holz, Palmöl.' },
  { code: 'Art. 10', title: 'Due Diligence Statement (DDS)', deadline: '2025-12-30', readiness: 67, detail: 'DDS pro Sendung vor EU-Einfuhr via TRACES NT einzureichen und Referenznummer auf Dokumenten anzugeben.' },
  { code: 'Art. 29', title: 'Sentinel-2 Entwaldungscheck', deadline: '2026-03-01', readiness: 55, detail: 'Satellitengestützte Verifikation — ab 2026 für Hochrisiko-Länder vorgeschrieben. Pilotintegration läuft.' },
  { code: 'Erwägungsgrund 46', title: 'Rückverfolgbarkeit Lieferkette', deadline: '2025-12-30', readiness: 92, detail: 'Charge-zu-Erzeuger Traceability in EastAfrica Export OS vollständig implementiert.' },
];

const TIMELINE = [
  { date: '2023-06-29', event: 'EUDR in Kraft getreten', status: 'done', detail: 'Verordnung (EU) 2023/1115 im Amtsblatt veröffentlicht.' },
  { date: '2024-06-29', event: '18-Monate Übergangsfrist', status: 'done', detail: 'Implementierungsfrist für Großunternehmen.' },
  { date: '2025-12-30', event: 'Anwendungsdatum für alle', status: 'active', detail: 'DDS-Pflicht für alle Unternehmen, inkl. KMU. ⚠ In 219 Tagen.' },
  { date: '2026-03-01', event: 'Sentinel-2 Hochrisiko-Check', status: 'future', detail: 'Automatisierter Satellitencheck für Hochrisikoländer.' },
  { date: '2026-06-29', event: 'Erste Überprüfungen erwartet', status: 'future', detail: 'EU-Zollbehörden beginnen aktive Kontrollen bei Einfuhr.' },
];

export const EUDRView = ({ lang: _lang }: EUDRViewProps) => {
  const { data: M } = useData();
  const [tab, setTab] = useState<'overview' | 'suppliers' | 'orders' | 'regs'>('overview');

  // local state for submissions (TRACES NT simulation)
  const [localSubmitted, setLocalSubmitted] = useState<Set<string>>(new Set());
  const [ddsModalId, setDdsModalId] = useState<string | null>(null);
  const [ddsViewId, setDdsViewId] = useState<string | null>(null);
  const [ddsForm, setDdsForm] = useState({ operator: 'EastAfrica Export OS GmbH', eori: 'DE123456789012', confirmed: false });
  const [ddsSaving, setDdsSaving] = useState(false);
  const [ddsRef, setDdsRef] = useState<Record<string, string>>({});

  // local state for GPS entries
  const [localGpsData, setLocalGpsData] = useState<Record<string, { parcels: { lat: string; lng: string; area: string; ref: string }[] }>>({});
  const [gpsModalId, setGpsModalId] = useState<string | null>(null);
  const [gpsViewId, setGpsViewId] = useState<string | null>(null);
  const [gpsForm, setGpsForm] = useState({ lat: '', lng: '', area: '', ref: 'P-01' });
  const [gpsSaving, setGpsSaving] = useState(false);

  const effectiveDdsStatus = (orderId: string): 'submitted' | 'draft' | 'missing' =>
    localSubmitted.has(orderId) ? 'submitted' : ddsStatus(orderId);

  const handleDdsSubmit = () => {
    if (!ddsModalId || !ddsForm.operator || !ddsForm.eori || !ddsForm.confirmed) return;
    setDdsSaving(true);
    setTimeout(() => {
      const ref = `DDS-2026-${ddsModalId.replace('ORD-2026-', '').replace('ORD-2025-', '')}-${Date.now().toString().slice(-4)}`;
      setLocalSubmitted(prev => { const next = new Set(prev); next.add(ddsModalId); return next; });
      setDdsRef(prev => ({ ...prev, [ddsModalId]: ref }));
      setDdsModalId(null);
      setDdsForm(f => ({ ...f, confirmed: false }));
      setDdsSaving(false);
    }, 700);
  };

  const handleGpsSubmit = () => {
    if (!gpsModalId || !gpsForm.lat || !gpsForm.lng) return;
    setGpsSaving(true);
    setTimeout(() => {
      setLocalGpsData(prev => {
        const existing = prev[gpsModalId]?.parcels ?? [];
        return { ...prev, [gpsModalId]: { parcels: [...existing, { ...gpsForm }] } };
      });
      setGpsModalId(null);
      setGpsForm({ lat: '', lng: '', area: '', ref: `P-0${(localGpsData[gpsModalId]?.parcels.length ?? 0) + 2}` });
      setGpsSaving(false);
    }, 400);
  };

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  // EUDR-relevant suppliers (have Coffee or Meat products)
  const eudrSuppliers = M.suppliers.filter(s =>
    s.products?.some(p => ['Coffee', 'Arabica', 'Beef', 'Meat', 'Sesame', 'Cashew'].some(kw => p.includes(kw)))
  );

  // EUDR-relevant active orders
  const eudrOrders = M.orders.filter(o => {
    const prod = M.products.find(p => p.id === o.productId);
    return prod && EUDR_CATS.includes(prod.cat);
  });

  const handleDDSReport = () => {
    const ts = new Date().toISOString().slice(0, 10);
    const sections: string[] = [];

    // Section 1: DDS Status per Order
    sections.push(`EUDR Due Diligence Statement Report — Stand ${ts}`);
    sections.push('');
    sections.push('## DDS-Status je Auftrag (EUDR-relevant)');
    const orderHeaders = ['Auftrags-ID','Produkt','Kategorie','Lieferant','Käufer','ETD','ETA','Status','DDS-Status','Referenznummer'];
    const orderRows = eudrOrders.map(o => {
      const prod = M.products.find(p => p.id === o.productId);
      const sup = M.suppliers.find(s => s.id === o.supplierId);
      const buyer = M.buyers.find(b => b.id === o.buyerId);
      const dds = ddsStatus(o.id);
      const ref = dds === 'submitted' ? `DDS-${o.id}-2026` : '';
      return [o.id, prod?.name ?? o.productVariant, prod?.cat ?? '', sup?.name ?? '', buyer?.name ?? '', o.etd, o.eta, o.status, dds, ref];
    });
    sections.push([orderHeaders, ...orderRows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'));

    // Section 2: GPS Status per Supplier
    sections.push('');
    sections.push('## GPS-Koordinaten-Status je Lieferant (EUDR-relevant)');
    const supHeaders = ['Lieferant-ID','Name','Land','Region','Produkte','GPS-Status','Tier','Risiko'];
    const supRows = eudrSuppliers.map(s => [
      s.id, s.name, s.country, s.region, s.products.join('; '),
      supplierGpsStatus(s.id), s.tier, s.risk,
    ]);
    sections.push([supHeaders, ...supRows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'));

    // Section 3: Regulation Readiness
    sections.push('');
    sections.push('## Compliance-Readiness nach Artikel');
    const regHeaders = ['Artikel','Titel','Frist','Readiness (%)'];
    const regRows = REGULATIONS.map(r => [r.code, r.title, r.deadline, r.readiness]);
    sections.push([regHeaders, ...regRows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'));

    const csv = sections.join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `eudr-dds-report-${ts}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const gpsComplete = eudrSuppliers.filter(s => supplierGpsStatus(s.id) === 'complete' || localGpsData[s.id]?.parcels.length > 0).length;
  const ddsSubmitted = eudrOrders.filter(o => effectiveDdsStatus(o.id) === 'submitted').length;
  const overallReadiness = Math.round((88 + 78 + 67 + 55 + 92) / REGULATIONS.length);
  const circumference = 2 * Math.PI * 46;

  const tabs = [
    { id: 'overview'  as const, label: 'Übersicht',         icon: 'dashboard' },
    { id: 'suppliers' as const, label: 'Lieferanten GPS',   icon: 'supplier'  },
    { id: 'orders'    as const, label: 'DDS pro Auftrag',   icon: 'box'       },
    { id: 'regs'      as const, label: 'Regulierungs-Check', icon: 'flag'     },
  ];

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
    padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  return (
    <>
    <div>
      <div className="section-head">
        <h1>EUDR Compliance</h1>
        <div className="sub">EU Deforestation Regulation (EU) 2023/1115 · Sorgfaltspflicht · GPS · DDS via TRACES NT</div>
        <div className="right">
          <Badge kind={overallReadiness >= 80 ? 'success' : 'warning'} dot>{overallReadiness}% Readiness</Badge>
          <button className="btn" onClick={handleDDSReport}><Ic name="download" size={13} /> DDS-Report</button>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <div key={t.id} className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
            <span className="row" style={{ gap: 6 }}><Ic name={t.icon} size={12} /> {t.label}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 16px 12px' }}>

        {/* ── Übersicht ── */}
        {tab === 'overview' && (
          <div>
            {/* Readiness ring + summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, marginBottom: 12 }}>
              <div className="ai-card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div className="risk-ring" style={{ width: 110, height: 110, flexShrink: 0 }}>
                  <svg width="110" height="110" viewBox="0 0 110 110">
                    <circle cx="55" cy="55" r="46" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
                    <circle
                      cx="55" cy="55" r="46"
                      stroke={overallReadiness >= 80 ? '#34d399' : '#fbbf24'}
                      strokeWidth="8" fill="none"
                      strokeDasharray={`${(overallReadiness / 100) * circumference} ${circumference}`}
                      transform="rotate(-90 55 55)"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="v">
                    <div className="num" style={{ fontSize: 26 }}>{overallReadiness}%</div>
                    <div className="lbl" style={{ fontSize: 9 }}>EUDR READY</div>
                  </div>
                </div>
                <div>
                  <div className="row" style={{ marginBottom: 8, gap: 8 }}>
                    <span className="pill">EUDR Status · Stand 25.05.2026</span>
                    <Badge kind="warning" dot>219 Tage bis Deadline</Badge>
                  </div>
                  <div className="fw600" style={{ fontSize: 15, marginBottom: 6 }}>
                    Gut auf Kurs — 3 von 5 Anforderungen weitgehend erfüllt
                  </div>
                  <div className="tx2" style={{ fontSize: 12, lineHeight: 1.6 }}>
                    GPS-Koordinaten für <span className="fw500">{gpsComplete}/{eudrSuppliers.length} Tier-A Lieferanten</span> vollständig hinterlegt.
                    DDS-Einreichung via TRACES NT für <span className="fw500">{ddsSubmitted}/{eudrOrders.length} aktiven Aufträgen</span> erfolgt.
                    Kritisch: <span className="fw500" style={{ color: '#fbbf24' }}>Sentinel-2-Autocheck</span> noch nicht produktiv.
                  </div>
                </div>
              </div>
            </div>

            {/* KPI tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
              {[
                { l: 'GPS vollständig',    v: `${gpsComplete}/${eudrSuppliers.length}`,   c: gpsComplete === eudrSuppliers.length ? '#34d399' : '#fbbf24' },
                { l: 'DDS eingereicht',    v: `${ddsSubmitted}/${eudrOrders.length}`,     c: '#60a5fa' },
                { l: 'TRACES NT',          v: 'Live',                                      c: '#34d399' },
                { l: 'Sentinel-2-Check',   v: 'Pilot',                                    c: '#fbbf24' },
              ].map((k, i) => (
                <div key={i} className="card" style={{ padding: 14 }}>
                  <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.l}</div>
                  <div className="mono fw600" style={{ fontSize: 22, color: k.c, marginTop: 4 }}>{k.v}</div>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div className="card">
              <div className="card-head">
                <Ic name="activity" size={14} />
                <span className="title">EUDR Zeitplan</span>
              </div>
              <div className="card-body">
                {TIMELINE.map((step, i) => (
                  <div key={i} className="row" style={{ padding: '9px 0', borderBottom: i < TIMELINE.length - 1 ? '1px solid var(--border)' : 'none', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                      background: step.status === 'done' ? '#34d399' : step.status === 'active' ? 'rgba(251,191,36,0.2)' : 'var(--surface-3)',
                      border: '2px solid ' + (step.status === 'done' ? '#34d399' : step.status === 'active' ? '#fbbf24' : 'var(--border)'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {step.status === 'done' && <Ic name="task" size={9} color="#07090f" />}
                      {step.status === 'active' && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fbbf24', display: 'block' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="fw500" style={{ fontSize: 12 }}>{step.event}</div>
                      <div className="tx3" style={{ fontSize: 11, marginTop: 1 }}>{step.detail}</div>
                    </div>
                    <div className="mono tx3" style={{ fontSize: 10.5, whiteSpace: 'nowrap' }}>{step.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Lieferanten GPS ── */}
        {tab === 'suppliers' && (
          <div className="card">
            <div className="card-head">
              <Ic name="supplier" size={14} />
              <span className="title">GPS-Koordinaten Lieferanten</span>
              <span className="meta">{eudrSuppliers.length} EUDR-relevante Lieferanten</span>
              <Badge kind={gpsComplete === eudrSuppliers.length ? 'success' : 'warning'} dot>
                {gpsComplete}/{eudrSuppliers.length} vollständig
              </Badge>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Lieferant</th>
                  <th>Land · Region</th>
                  <th>EUDR-Waren</th>
                  <th>Tier</th>
                  <th>GPS-Status</th>
                  <th>Parzellen</th>
                  <th>TRACES-ID</th>
                  <th>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {eudrSuppliers.map(s => {
                  const gps = supplierGpsStatus(s.id);
                  const parcels = s.id.split('').reduce((n, c) => n + c.charCodeAt(0), 0) % 8 + 1;
                  const tracesId = gps === 'complete'
                    ? `TN-TZ-${s.id.replace('SUP-', '')}-26`
                    : '—';
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="fw500" style={{ fontSize: 12 }}>{s.name}</div>
                        <div className="tx3 mono" style={{ fontSize: 10 }}>{s.id}</div>
                      </td>
                      <td className="tx2" style={{ fontSize: 11.5 }}>{s.country} · {s.region}</td>
                      <td>
                        <div className="row" style={{ gap: 3, flexWrap: 'wrap' }}>
                          {s.products?.slice(0, 2).map((p, i) => (
                            <Badge key={i} kind="neutral">{p.split(' ').slice(0, 2).join(' ')}</Badge>
                          ))}
                        </div>
                      </td>
                      <td><Badge kind={s.tier === 'A' ? 'success' : s.tier === 'B' ? 'info' : 'neutral'}>{s.tier}</Badge></td>
                      <td>
                        {gps === 'complete' && <Badge kind="success" dot>Vollständig</Badge>}
                        {gps === 'partial'  && <Badge kind="warning" dot>Unvollständig</Badge>}
                        {gps === 'missing'  && <Badge kind="danger"  dot>Fehlt</Badge>}
                      </td>
                      <td className="num mono" style={{ fontSize: 12 }}>{gps !== 'missing' ? parcels : '—'}</td>
                      <td className="mono tx2" style={{ fontSize: 10.5 }}>{tracesId}</td>
                      <td>
                        {(gps === 'complete' || localGpsData[s.id]?.parcels.length > 0)
                          ? <button className="btn sm ghost" onClick={() => setGpsViewId(s.id)}>Ansehen</button>
                          : <button className="btn sm primary" onClick={() => { setGpsForm({ lat: '', lng: '', area: '', ref: 'P-01' }); setGpsModalId(s.id); }}>GPS erfassen</button>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── DDS pro Auftrag ── */}
        {tab === 'orders' && (
          <div className="card">
            <div className="card-head">
              <Ic name="box" size={14} />
              <span className="title">Due Diligence Statements · EUDR-Aufträge</span>
              <span className="meta">{eudrOrders.length} Aufträge betroffen</span>
              <Badge kind={ddsSubmitted === eudrOrders.length ? 'success' : 'warning'} dot>
                {ddsSubmitted}/{eudrOrders.length} DDS eingereicht
              </Badge>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Auftrag</th>
                  <th>Produkt</th>
                  <th>Käufer</th>
                  <th>Menge</th>
                  <th>Status</th>
                  <th>DDS-Status</th>
                  <th>TRACES-Ref.</th>
                  <th>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {eudrOrders.map(o => {
                  const prod = M.products.find(p => p.id === o.productId);
                  const buyer = M.buyers.find(b => b.id === o.buyerId);
                  const dds = effectiveDdsStatus(o.id);
                  const tracesRef = dds === 'submitted'
                    ? (ddsRef[o.id] ?? `DDS-2026-${o.id.replace('ORD-2026-', '').replace('ORD-2025-', '')}`)
                    : '—';
                  return (
                    <tr key={o.id}>
                      <td><span className="id">{o.id}</span></td>
                      <td>
                        <div className="fw500" style={{ fontSize: 12 }}>{o.productVariant || prod?.name}</div>
                        <div className="tx3" style={{ fontSize: 10 }}>{prod?.cat}</div>
                      </td>
                      <td className="tx2" style={{ fontSize: 11.5 }}>
                        {buyer?.name?.split(' ').slice(0, 3).join(' ')}
                      </td>
                      <td className="num mono" style={{ fontSize: 12 }}>
                        {o.qty.toLocaleString('de-DE')} {o.unit}
                      </td>
                      <td>
                        <Badge kind={(M.statusBadge as Record<string, string>)[o.status] as 'success' | 'warning' | 'danger' | 'info' | 'neutral' || 'neutral'} dot>
                          {o.status}
                        </Badge>
                      </td>
                      <td>
                        {dds === 'submitted' && <Badge kind="success" dot>Eingereicht</Badge>}
                        {dds === 'draft'     && <Badge kind="warning" dot>Entwurf</Badge>}
                        {dds === 'missing'   && <Badge kind="danger"  dot>Fehlt</Badge>}
                      </td>
                      <td className="mono tx2" style={{ fontSize: 10.5 }}>{tracesRef}</td>
                      <td>
                        {dds !== 'submitted'
                          ? <button className="btn sm primary" onClick={() => { setDdsForm(f => ({ ...f, confirmed: false })); setDdsModalId(o.id); }}>DDS einreichen</button>
                          : <button className="btn sm ghost" onClick={() => setDdsViewId(o.id)}>Ansehen</button>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Regulierungs-Check ── */}
        {tab === 'regs' && (
          <div className="card">
            <div className="card-head">
              <Ic name="flag" size={14} />
              <span className="title">Anforderungs-Check · Artikel für Artikel</span>
              <span className="meta">Verordnung (EU) 2023/1115</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Artikel</th>
                  <th>Anforderung</th>
                  <th>Readiness</th>
                  <th>Deadline</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {REGULATIONS.map((r, i) => (
                  <tr key={i}>
                    <td><span className="mono fw600" style={{ fontSize: 11.5, color: '#c4b5fd' }}>{r.code}</span></td>
                    <td><span className="fw500" style={{ fontSize: 12 }}>{r.title}</span></td>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <div style={{ width: 70, height: 4, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${r.readiness}%`, height: '100%', background: r.readiness >= 80 ? '#34d399' : r.readiness >= 50 ? '#fbbf24' : '#f87171' }} />
                        </div>
                        <span className="mono fw500" style={{ fontSize: 11, color: r.readiness >= 80 ? '#34d399' : r.readiness >= 50 ? '#fbbf24' : '#f87171' }}>
                          {r.readiness}%
                        </span>
                      </div>
                    </td>
                    <td className="mono tx2" style={{ fontSize: 11 }}>{r.deadline}</td>
                    <td className="tx2" style={{ fontSize: 11, maxWidth: 340 }}>{r.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>

    {/* ── DDS Einreichung Modal ── */}
    {ddsModalId && (() => {
      const o = M.orders.find(x => x.id === ddsModalId)!;
      const prod = M.products.find(p => p.id === o?.productId);
      const buyer = M.buyers.find(b => b.id === o?.buyerId);
      const sup = M.suppliers.find(s => s.id === o?.supplierId);
      if (!o) return null;
      return (
        <div className="overlay" onClick={() => setDdsModalId(null)} style={{ alignItems: 'flex-start', paddingTop: '6vh' }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 520, padding: 0 }}>
            <div className="modal-head">
              <Ic name="flag" size={15} color="#c4b5fd" />
              <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>DDS einreichen · TRACES NT</span>
              <span className="mono tx3" style={{ fontSize: 11 }}>{ddsModalId}</span>
              <button className="btn sm ghost" onClick={() => setDdsModalId(null)}><Ic name="x" size={12} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Order summary */}
              <div style={{ padding: '10px 12px', background: 'rgba(196,181,253,0.05)', border: '1px solid rgba(196,181,253,0.2)', borderRadius: 6 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11.5 }}>
                  <div><span className="tx3">Produkt: </span><span className="fw500">{prod?.name ?? o.productVariant}</span></div>
                  <div><span className="tx3">Kategorie: </span><span className="mono">{prod?.cat}</span></div>
                  <div><span className="tx3">Käufer: </span><span className="fw500">{buyer?.name?.split(' ').slice(0,3).join(' ')}</span></div>
                  <div><span className="tx3">Lieferant: </span><span className="fw500">{sup?.name?.split(' ').slice(0,2).join(' ')}</span></div>
                  <div><span className="tx3">Menge: </span><span className="mono">{o.qty.toLocaleString('de-DE')} {o.unit}</span></div>
                  <div><span className="tx3">ETD→ETA: </span><span className="mono">{o.etd} → {o.eta}</span></div>
                </div>
              </div>

              {/* Operator data */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Operator / Unternehmen</div>
                  <input type="text" value={ddsForm.operator}
                    onChange={e => setDdsForm(f => ({ ...f, operator: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>EORI-Nummer</div>
                  <input type="text" value={ddsForm.eori} placeholder="DE123456789012"
                    onChange={e => setDdsForm(f => ({ ...f, eori: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid var(--border)', fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.6 }}>
                Mit der Einreichung bestätige ich, dass für die bezeichnete Sendung eine Sorgfaltsprüfung gem. Art. 8 EUDR (EU) 2023/1115 durchgeführt wurde und die Ware nachweislich nicht mit Entwaldung oder Waldschädigung in Verbindung steht.
              </div>

              <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer', fontSize: 12 }}>
                <input type="checkbox" checked={ddsForm.confirmed}
                  onChange={e => setDdsForm(f => ({ ...f, confirmed: e.target.checked }))}
                  style={{ marginTop: 2 }} />
                <span>Ich bestätige die Richtigkeit der Angaben und akzeptiere die Einreichung via TRACES NT.</span>
              </label>
            </div>
            <div className="modal-foot">
              <button className="btn ghost" onClick={() => setDdsModalId(null)}>Abbrechen</button>
              <button
                className="btn primary"
                disabled={!ddsForm.operator || !ddsForm.eori || !ddsForm.confirmed || ddsSaving}
                onClick={handleDdsSubmit}
              >
                {ddsSaving ? 'Einreichen…' : 'DDS einreichen'}
              </button>
            </div>
          </div>
        </div>
      );
    })()}

    {/* ── DDS Ansehen Modal ── */}
    {ddsViewId && (() => {
      const o = M.orders.find(x => x.id === ddsViewId)!;
      const prod = M.products.find(p => p.id === o?.productId);
      const buyer = M.buyers.find(b => b.id === o?.buyerId);
      const sup = M.suppliers.find(s => s.id === o?.supplierId);
      const ref = ddsRef[ddsViewId] ?? `DDS-2026-${ddsViewId.replace('ORD-2026-', '').replace('ORD-2025-', '')}`;
      const gpsStatus = supplierGpsStatus(o?.supplierId ?? '');
      if (!o) return null;
      return (
        <div className="overlay" onClick={() => setDdsViewId(null)} style={{ alignItems: 'flex-start', paddingTop: '6vh' }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 540, padding: 0 }}>
            <div className="modal-head">
              <Ic name="task" size={15} color="#34d399" />
              <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>Due Diligence Statement</span>
              <Badge kind="success" dot>Eingereicht</Badge>
              <button className="btn sm ghost" onClick={() => setDdsViewId(null)}><Ic name="x" size={12} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* TRACES reference */}
              <div style={{ padding: '12px 14px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 6 }}>TRACES NT Referenznummer</div>
                <div className="mono fw600" style={{ fontSize: 18, color: '#34d399', letterSpacing: '0.05em' }}>{ref}</div>
              </div>

              {/* Key fields */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {[
                  { l: 'Operator',    v: ddsForm.operator || 'EastAfrica Export OS GmbH' },
                  { l: 'EORI',        v: ddsForm.eori || 'DE123456789012' },
                  { l: 'Produkt',     v: prod?.name ?? o.productVariant },
                  { l: 'Kategorie',   v: prod?.cat ?? '—' },
                  { l: 'Käufer',      v: buyer?.name?.split(' ').slice(0,3).join(' ') ?? '—' },
                  { l: 'Lieferant',   v: sup?.name?.split(' ').slice(0,2).join(' ') ?? '—' },
                  { l: 'Menge',       v: `${o.qty.toLocaleString('de-DE')} ${o.unit}` },
                  { l: 'Auftrag',     v: o.id },
                ].map((f, i) => (
                  <div key={i} style={{ background: 'var(--bg)', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: 3 }}>{f.l}</div>
                    <div className="mono fw500" style={{ fontSize: 11.5 }}>{f.v}</div>
                  </div>
                ))}
              </div>

              {/* Compliance checks */}
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: 8 }}>Compliance-Checks</div>
                {[
                  { l: 'EUDR Sorgfaltspflicht (Art. 8)',       ok: true  },
                  { l: `GPS-Koordinaten Lieferant (Art. 9)`,   ok: gpsStatus === 'complete' || (localGpsData[o.supplierId]?.parcels.length ?? 0) > 0 },
                  { l: 'DDS eingereicht via TRACES NT (Art. 10)', ok: true  },
                  { l: 'Rückverfolgbarkeit belegt (Erw. 46)',   ok: true  },
                ].map((c, i) => (
                  <div key={i} className="row" style={{ padding: '6px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', gap: 8 }}>
                    <Ic name={c.ok ? 'task' : 'warn'} size={12} color={c.ok ? '#34d399' : '#fbbf24'} />
                    <span style={{ flex: 1, fontSize: 12 }}>{c.l}</span>
                    <Badge kind={c.ok ? 'success' : 'warning'}>{c.ok ? 'OK' : 'Offen'}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn primary" onClick={() => setDdsViewId(null)}>Schließen</button>
            </div>
          </div>
        </div>
      );
    })()}

    {/* ── GPS erfassen Modal (Lieferanten) ── */}
    {gpsModalId && (() => {
      const s = M.suppliers.find(x => x.id === gpsModalId)!;
      const existing = localGpsData[gpsModalId]?.parcels ?? [];
      if (!s) return null;
      return (
        <div className="overlay" onClick={() => setGpsModalId(null)} style={{ alignItems: 'flex-start', paddingTop: '7vh' }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 460, padding: 0 }}>
            <div className="modal-head">
              <Ic name="pin" size={15} color="#34d399" />
              <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>GPS-Koordinaten erfassen</span>
              <span className="mono tx3" style={{ fontSize: 11 }}>{s.id}</span>
              <button className="btn sm ghost" onClick={() => setGpsModalId(null)}><Ic name="x" size={12} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: '8px 10px', background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 6 }}>
                <div style={{ fontSize: 11.5, fontWeight: 500 }}>{s.name}</div>
                <div className="tx3" style={{ fontSize: 10.5, marginTop: 2 }}>{s.country} · {s.region} · {s.products?.slice(0,2).join(', ')}</div>
              </div>

              {existing.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Bereits erfasste Parzellen ({existing.length})</div>
                  {existing.map((p, i) => (
                    <div key={i} className="row" style={{ fontSize: 11, padding: '4px 0', gap: 8 }}>
                      <span className="mono tx3" style={{ fontSize: 10 }}>{p.ref}</span>
                      <span className="mono" style={{ flex: 1 }}>{p.lat}°, {p.lng}°</span>
                      {p.area && <span className="tx3">{p.area} ha</span>}
                      <Badge kind="success">Erfasst</Badge>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Breitengrad (lat)</div>
                  <input type="text" placeholder="-3.3869" value={gpsForm.lat}
                    onChange={e => setGpsForm(f => ({ ...f, lat: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Längengrad (lng)</div>
                  <input type="text" placeholder="36.6827" value={gpsForm.lng}
                    onChange={e => setGpsForm(f => ({ ...f, lng: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Fläche (ha, optional)</div>
                  <input type="text" placeholder="12.5" value={gpsForm.area}
                    onChange={e => setGpsForm(f => ({ ...f, area: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Parzellen-Ref.</div>
                  <input type="text" placeholder="P-01" value={gpsForm.ref}
                    onChange={e => setGpsForm(f => ({ ...f, ref: e.target.value }))} style={inputStyle} />
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn ghost" onClick={() => setGpsModalId(null)}>Abbrechen</button>
              <button className="btn primary" disabled={!gpsForm.lat || !gpsForm.lng || gpsSaving} onClick={handleGpsSubmit}>
                {gpsSaving ? 'Speichern…' : `Parzelle erfassen`}
              </button>
            </div>
          </div>
        </div>
      );
    })()}

    {/* ── GPS Ansehen Modal (Lieferanten) ── */}
    {gpsViewId && (() => {
      const s = M.suppliers.find(x => x.id === gpsViewId)!;
      const gpsStatus = supplierGpsStatus(s?.id ?? '');
      const localParcels = localGpsData[gpsViewId]?.parcels ?? [];
      const tracesId = gpsStatus === 'complete' ? `TN-TZ-${s.id.replace('SUP-', '')}-26` : localParcels.length > 0 ? `TN-TZ-${s.id.replace('SUP-', '')}-26-NEW` : '—';
      const parcelCount = s ? (s.id.split('').reduce((n, c) => n + c.charCodeAt(0), 0) % 8 + 1) : 0;
      if (!s) return null;
      return (
        <div className="overlay" onClick={() => setGpsViewId(null)} style={{ alignItems: 'flex-start', paddingTop: '7vh' }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 480, padding: 0 }}>
            <div className="modal-head">
              <Ic name="pin" size={15} color="#34d399" />
              <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>GPS-Koordinaten · {s.name.split(' ').slice(0,2).join(' ')}</span>
              <Badge kind="success" dot>Vollständig</Badge>
              <button className="btn sm ghost" onClick={() => setGpsViewId(null)}><Ic name="x" size={12} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: '8px 12px', background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6 }}>
                <div style={{ fontSize: 11.5, fontWeight: 500 }}>{s.name}</div>
                <div className="tx3" style={{ fontSize: 10.5, marginTop: 2 }}>{s.country} · {s.region} · TRACES: <span className="mono">{tracesId}</span></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { l: 'Parzellen gesamt',  v: String(parcelCount + localParcels.length), c: '#34d399' },
                  { l: 'GPS-Status',        v: gpsStatus === 'complete' ? 'Vollständig' : 'Aktualisiert', c: '#34d399' },
                  { l: 'TRACES ID',         v: tracesId, mono: true },
                ].map((f, i) => (
                  <div key={i} style={{ background: 'var(--bg)', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: 3 }}>{f.l}</div>
                    <div className={`fw500${f.mono ? ' mono' : ''}`} style={{ fontSize: 12, color: f.c }}>{f.v}</div>
                  </div>
                ))}
              </div>

              {localParcels.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Neu erfasste Parzellen</div>
                  {localParcels.map((p, i) => (
                    <div key={i} className="row" style={{ padding: '7px 0', borderBottom: i < localParcels.length - 1 ? '1px solid var(--border)' : 'none', gap: 10 }}>
                      <span className="mono tx3" style={{ fontSize: 11 }}>{p.ref}</span>
                      <span className="mono fw500" style={{ flex: 1, fontSize: 12 }}>{p.lat}°N, {p.lng}°E</span>
                      {p.area && <span className="tx3 mono" style={{ fontSize: 11 }}>{p.area} ha</span>}
                      <Badge kind="success">Erfasst</Badge>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid var(--border)', fontSize: 11.5, color: 'var(--text-3)' }}>
                Koordinaten wurden gem. Art. 9 EUDR (EU) 2023/1115 für alle EUDR-relevanten Erzeuger erfasst und in TRACES NT hinterlegt.
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn ghost" onClick={() => { setGpsViewId(null); setGpsForm({ lat: '', lng: '', area: '', ref: `P-0${(localGpsData[gpsViewId]?.parcels.length ?? 0) + 1}` }); setGpsModalId(gpsViewId); }}>
                Weitere Parzelle hinzufügen
              </button>
              <button className="btn primary" onClick={() => setGpsViewId(null)}>Schließen</button>
            </div>
          </div>
        </div>
      );
    })()}
    </>
  );
};

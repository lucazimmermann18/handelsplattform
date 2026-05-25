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

  const gpsComplete = eudrSuppliers.filter(s => supplierGpsStatus(s.id) === 'complete').length;
  const ddsSubmitted = eudrOrders.filter(o => ddsStatus(o.id) === 'submitted').length;
  const overallReadiness = Math.round((88 + 78 + 67 + 55 + 92) / REGULATIONS.length);
  const circumference = 2 * Math.PI * 46;

  const tabs = [
    { id: 'overview'  as const, label: 'Übersicht',         icon: 'dashboard' },
    { id: 'suppliers' as const, label: 'Lieferanten GPS',   icon: 'supplier'  },
    { id: 'orders'    as const, label: 'DDS pro Auftrag',   icon: 'box'       },
    { id: 'regs'      as const, label: 'Regulierungs-Check', icon: 'flag'     },
  ];

  return (
    <div>
      <div className="section-head">
        <h1>EUDR Compliance</h1>
        <div className="sub">EU Deforestation Regulation (EU) 2023/1115 · Sorgfaltspflicht · GPS · DDS via TRACES NT</div>
        <div className="right">
          <Badge kind={overallReadiness >= 80 ? 'success' : 'warning'} dot>{overallReadiness}% Readiness</Badge>
          <button className="btn"><Ic name="download" size={13} /> DDS-Report</button>
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
                        {gps !== 'complete'
                          ? <button className="btn sm primary">GPS erfassen</button>
                          : <button className="btn sm ghost">Ansehen</button>
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
                  const dds = ddsStatus(o.id);
                  const tracesRef = dds === 'submitted'
                    ? `DDS-2026-${o.id.replace('ORD-2026-', '').replace('ORD-2025-', '')}`
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
                          ? <button className="btn sm primary">DDS einreichen</button>
                          : <button className="btn sm ghost">Ansehen</button>
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
  );
};

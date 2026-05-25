'use client';

import React, { useState } from 'react';
import { MOCK } from '@/lib/mock';
import type { Lang } from '@/lib/i18n';
import { fmtCur } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

interface InsuranceViewProps { lang: Lang; }

const UNDERWRITERS = [
  'Allianz Trade',
  "Lloyd's of London",
  'Munich Re Marine',
  'AIG Marine',
];

// Deterministic policy number from order ID — no Math.random()
function policyNum(orderId: string): string {
  const n = orderId.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % 9000 + 1000;
  return `MR-2026-${n}`;
}

const OPEN_CLAIM = {
  id: 'CLM-2026-001',
  order: 'ORD-2026-0118',
  type: 'Cold-Chain Breach',
  amount: 12400,
  status: 'in_review',
  filed: '2026-05-08',
  underwriter: "Lloyd's of London",
  description: 'Temperaturabweichung während Suezkanal-Stopp · +11.2°C für 6h · Grenzwert +7°C · Frozen Beef Boneless betroffen · Surveyor-Besichtigung Hamburg abgeschlossen',
};

const CLAIM_TIMELINE = [
  { date: '2026-05-08', event: 'Claim eingereicht bei Lloyd\'s', detail: 'Sensor-Report, Fotos und Health Certificate übermittelt', done: true },
  { date: '2026-05-10', event: 'Underwriter bestätigt Eingang', detail: "Lloyd's Reference: MRC-2026-44812", done: true },
  { date: '2026-05-15', event: 'Surveyor-Besichtigung Hamburg', detail: 'McLarens Marine Surveyors GmbH · Gutachten Ware teilweise verwertbar', done: true },
  { date: '2026-05-22', event: 'Gutachten erwartet', detail: 'Schadensermittlung läuft', done: false },
  { date: '2026-06-05', event: 'Entscheidung Underwriter', detail: 'Auszahlung oder Ablehnung', done: false },
];

export const InsuranceView = ({ lang: _lang }: InsuranceViewProps) => {
  const [tab, setTab] = useState<'policies' | 'claims' | 'coverage'>('policies');

  const policies = MOCK.orders
    .filter(o => ['in_transit', 'shipped', 'arrived', 'in_export'].includes(o.status))
    .map(o => {
      const isColdChain = o.productVariant?.toLowerCase().includes('beef')
        || o.productVariant?.toLowerCase().includes('avocado')
        || o.productVariant?.toLowerCase().includes('frozen');
      return {
        order: o.id,
        policy: policyNum(o.id),
        underwriter: UNDERWRITERS[o.vesselIdx % UNDERWRITERS.length],
        coverage: isColdChain ? 'All Risks ICC A + Cold-Chain Rider' : 'All Risks (ICC A)',
        insured: Math.round(o.revenue * 1.1),
        premium: Math.round(o.revenue * 0.0125),
        deductible: '1.000 €',
        valid: '2026-12-31',
        hasClaim: o.id === 'ORD-2026-0118',
      };
    });

  const totalInsured = policies.reduce((s, p) => s + p.insured, 0);
  const totalPremium = policies.reduce((s, p) => s + p.premium, 0);
  const avgRate = totalInsured > 0 ? ((totalPremium / totalInsured) * 100).toFixed(2) : '0.00';

  const tabs = [
    { id: 'policies' as const, label: 'Aktive Policen', icon: 'doc' },
    { id: 'claims'   as const, label: 'Claims',         icon: 'warn' },
    { id: 'coverage' as const, label: 'Deckungsanalyse', icon: 'layers' },
  ];

  return (
    <div>
      <div className="section-head">
        <h1>Versicherungs-Tracker</h1>
        <div className="sub">Transportversicherung · Police-Verwaltung · Claim-Status · ICC A/B/C</div>
        <div className="right">
          <button className="btn primary"><Ic name="plus" size={13} /> Neue Police</button>
          <button className="btn"><Ic name="download" size={13} /> Export</button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ padding: '0 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <div className="card" style={{ padding: 14 }}>
            <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aktive Policen</div>
            <div className="mono fw600" style={{ fontSize: 24, color: '#60a5fa', marginTop: 4 }}>{policies.length}</div>
            <div className="tx3" style={{ fontSize: 11, marginTop: 2 }}>Auf See · In Export</div>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Versicherte Summe</div>
            <div className="mono fw600" style={{ fontSize: 24, color: '#34d399', marginTop: 4 }}>{fmtCur(totalInsured)}</div>
            <div className="tx3" style={{ fontSize: 11, marginTop: 2 }}>CIF-Wert + 10 %</div>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prämie YTD</div>
            <div className="mono fw600" style={{ fontSize: 24, color: '#a78bfa', marginTop: 4 }}>{fmtCur(totalPremium)}</div>
            <div className="tx3" style={{ fontSize: 11, marginTop: 2 }}>Ø {avgRate} % Rate</div>
          </div>
          <div className="card" style={{ padding: 14, borderColor: 'rgba(251,191,36,0.35)' }}>
            <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Offene Claims</div>
            <div className="mono fw600" style={{ fontSize: 24, color: '#fbbf24', marginTop: 4 }}>1</div>
            <div className="tx3" style={{ fontSize: 11, marginTop: 2 }}>ORD-2026-0118 · {fmtCur(OPEN_CLAIM.amount)} geltend</div>
          </div>
        </div>
      </div>

      <div className="tabs" style={{ marginTop: 12 }}>
        {tabs.map(t => (
          <div key={t.id} className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
            <span className="row" style={{ gap: 6 }}><Ic name={t.icon} size={12} /> {t.label}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 16px 12px' }}>

        {/* ── Policen ── */}
        {tab === 'policies' && (
          <div className="card">
            <div className="card-head">
              <Ic name="doc" size={14} />
              <span className="title">Aktive Transport-Policen</span>
              <span className="meta">{policies.length} Policen · ICC A</span>
              <Badge kind="success" dot>Vollständig versichert</Badge>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Police-Nr.</th>
                  <th>Auftrag</th>
                  <th>Underwriter</th>
                  <th>Deckungsart</th>
                  <th className="num">Versichert</th>
                  <th className="num">Prämie</th>
                  <th>Selbstbehalt</th>
                  <th>Gültig bis</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {policies.map(p => (
                  <tr key={p.policy} style={{ background: p.hasClaim ? 'rgba(245,158,11,0.03)' : undefined }}>
                    <td>
                      <span className="mono fw500" style={{ fontSize: 11.5 }}>{p.policy}</span>
                      {p.hasClaim && (
                        <div className="row" style={{ marginTop: 2, gap: 4 }}>
                          <Ic name="warn" size={10} color="#fbbf24" />
                          <span className="tx3" style={{ fontSize: 10 }}>Claim offen</span>
                        </div>
                      )}
                    </td>
                    <td className="mono" style={{ fontSize: 11 }}>{p.order}</td>
                    <td style={{ fontSize: 12 }}>{p.underwriter}</td>
                    <td className="tx2" style={{ fontSize: 11 }}>{p.coverage}</td>
                    <td className="num fw500">{fmtCur(p.insured)}</td>
                    <td className="num mono tx2">{fmtCur(p.premium)}</td>
                    <td className="tx3 mono" style={{ fontSize: 11 }}>{p.deductible}</td>
                    <td className="mono tx2" style={{ fontSize: 11 }}>{p.valid}</td>
                    <td><Badge kind={p.hasClaim ? 'warning' : 'success'} dot>{p.hasClaim ? 'Claim' : 'aktiv'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Claims ── */}
        {tab === 'claims' && (
          <div>
            <div className="ai-card" style={{ marginBottom: 12 }}>
              <div className="head">
                <span className="pill">Offener Claim · {OPEN_CLAIM.id}</span>
                <Badge kind="warning" dot>In Prüfung</Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 10 }}>
                {[
                  { l: 'Claim-Nr.', v: OPEN_CLAIM.id, mono: true },
                  { l: 'Auftrag', v: OPEN_CLAIM.order, mono: true },
                  { l: 'Underwriter', v: OPEN_CLAIM.underwriter, mono: false },
                  { l: 'Art', v: OPEN_CLAIM.type, mono: false },
                  { l: 'Eingereicht', v: OPEN_CLAIM.filed, mono: true },
                  { l: 'Schadenshöhe', v: fmtCur(OPEN_CLAIM.amount), mono: true },
                ].map((row, i) => (
                  <div key={i}>
                    <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 3 }}>{row.l}</div>
                    <div className={row.mono ? 'mono fw500' : 'fw500'} style={{ fontSize: i === 5 ? 18 : 12, color: i === 5 ? '#fbbf24' : undefined }}>
                      {row.v}
                    </div>
                  </div>
                ))}
              </div>
              <div className="sep" style={{ margin: '12px 0' }} />
              <div className="tx2" style={{ fontSize: 12, lineHeight: 1.55 }}>{OPEN_CLAIM.description}</div>
            </div>

            {/* Timeline */}
            <div className="card">
              <div className="card-head">
                <Ic name="activity" size={14} />
                <span className="title">Claim-Verlauf</span>
                <span className="meta">{CLAIM_TIMELINE.filter(s => s.done).length}/{CLAIM_TIMELINE.length} Schritte</span>
              </div>
              <div className="card-body">
                {CLAIM_TIMELINE.map((step, i) => (
                  <div key={i} className="row" style={{ padding: '9px 0', borderBottom: i < CLAIM_TIMELINE.length - 1 ? '1px solid var(--border)' : 'none', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                      background: step.done ? '#34d399' : 'var(--surface-3)',
                      border: '2px solid ' + (step.done ? '#34d399' : 'var(--border)'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {step.done && <Ic name="task" size={9} color="#07090f" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="fw500" style={{ fontSize: 12 }}>{step.event}</div>
                      <div className="tx3" style={{ fontSize: 11, marginTop: 1 }}>{step.detail}</div>
                    </div>
                    <div className="mono tx3" style={{ fontSize: 10.5, whiteSpace: 'nowrap' }}>{step.date}</div>
                  </div>
                ))}
              </div>
              <div className="card-body" style={{ paddingTop: 0 }}>
                <button className="btn primary" style={{ marginTop: 8 }}>
                  <Ic name="doc" size={12} /> Vollständige Claim-Akte öffnen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Coverage Analysis ── */}
        {tab === 'coverage' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Coverage types */}
            <div className="card">
              <div className="card-head">
                <Ic name="layers" size={14} />
                <span className="title">Deckungsarten im Einsatz</span>
              </div>
              <div className="card-body">
                {[
                  {
                    type: 'All Risks (ICC A)',
                    count: policies.filter(p => p.coverage === 'All Risks (ICC A)').length,
                    desc: 'Breiteste Deckung · für Trockenware: Kaffee, Cashew, Gewürze, Zucker',
                    color: '#34d399',
                  },
                  {
                    type: 'All Risks ICC A + Cold-Chain Rider',
                    count: policies.filter(p => p.coverage.includes('Cold-Chain')).length,
                    desc: 'Erweiterung für temperaturgeführte Ware: Avocado, Fleisch',
                    color: '#22d3ee',
                  },
                ].map((c, i) => (
                  <div key={i} style={{ padding: '10px 0', borderBottom: i === 0 ? '1px solid var(--border)' : 'none' }}>
                    <div className="row" style={{ marginBottom: 5, gap: 8 }}>
                      <span className="dot" style={{ background: c.color }} />
                      <span className="fw500" style={{ flex: 1, fontSize: 12 }}>{c.type}</span>
                      <Badge kind="info">{c.count} Policen</Badge>
                    </div>
                    <div className="tx3" style={{ fontSize: 11, marginLeft: 16, lineHeight: 1.4 }}>{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Underwriter mix */}
            <div className="card">
              <div className="card-head">
                <Ic name="supplier" size={14} />
                <span className="title">Underwriter-Mix</span>
                <span className="meta">{policies.length} Policen</span>
              </div>
              <div className="card-body">
                {UNDERWRITERS.map((uw, i) => {
                  const cnt = policies.filter(p => p.underwriter === uw).length;
                  const pct = policies.length > 0 ? Math.round((cnt / policies.length) * 100) : 0;
                  return (
                    <div key={i} className="row" style={{ padding: '8px 0', borderBottom: i < UNDERWRITERS.length - 1 ? '1px solid var(--border)' : 'none', gap: 10 }}>
                      <span style={{ flex: 1, fontSize: 12 }}>{uw}</span>
                      <div className="progress" style={{ width: 80 }}>
                        <div style={{ width: `${pct}%`, background: '#3b82f6' }} />
                      </div>
                      <span className="mono fw500 tx2" style={{ fontSize: 11, width: 26, textAlign: 'right' }}>{cnt}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Risk notes */}
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-head">
                <Ic name="info" size={14} />
                <span className="title">Versicherungshinweise · ICC-Klauseln</span>
              </div>
              <div className="card-body">
                {[
                  { clause: 'ICC A', desc: 'All Risks — deckt alle Schäden außer ausdrücklich ausgeschlossenen (Krieg, Streik, inhärentes Verderb). Empfohlen für Primärprodukte.' },
                  { clause: 'Cold-Chain Rider', desc: 'Erweiterungsklausel für temperaturgeführte Sendungen. Deckt Verluste durch unbeabsichtigte Temperaturabweichungen. Sensor-Protokoll als Schadensnachweis erforderlich.' },
                  { clause: 'CIF + 10 %', desc: 'Versicherte Summe = Warenwert (Cost, Insurance, Freight) + 10 % entgangener Gewinn. Standard INCOTERMS-Praxis für EU-Export.' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '9px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                    <div className="row" style={{ marginBottom: 4, gap: 8 }}>
                      <Badge kind="info">{item.clause}</Badge>
                    </div>
                    <div className="tx2" style={{ fontSize: 12, lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

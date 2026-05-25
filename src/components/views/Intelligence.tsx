'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { fmtCur, fmtNum } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge, Sparkline, BarChart, StatusBadge } from '@/components/ui/primitives';
import type { Order, Supplier, Document as Doc, QualityCheck } from '@/lib/types';

interface IntelligenceViewProps {
  lang: Lang;
  onOpenOrder: (o: Order) => void;
  onNav: (view: string) => void;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function seedRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function idSeed(id: string): number {
  return id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

const palette = (score: number) => {
  if (score >= 60) return '#ef4444';
  if (score >= 35) return '#f59e0b';
  if (score >= 15) return '#fbbf24';
  return '#34d399';
};

// ── Risk Engine ───────────────────────────────────────────────────────────────

interface RiskFactor { k: string; v: number; w: number; note: string; }
interface RiskResult { score: number; factors: RiskFactor[]; }

function computeRiskScore(order: Order, suppliers: Supplier[], documents: Doc[], quality: QualityCheck[]): RiskResult {
  const ref = new Date('2026-05-25');
  const etd = new Date(order.etd);
  const daysToETD = Math.round((etd.getTime() - ref.getTime()) / 86400000);
  const supplier = suppliers.find(s => s.id === order.supplierId);

  // 1 Lieferant ×0.20
  const supplierScore = supplier ? (supplier.risk === 'hoch' ? 80 : supplier.risk === 'mittel' ? 45 : 15) : 60;

  // 2 Dokumente ×0.20
  const docs = documents.filter(d => d.order === order.id);
  const missingDocs = docs.filter(d => d.status === 'fehlt').length;
  const draftDocs = docs.filter(d => d.status === 'Entwurf').length;
  const docScore = missingDocs > 0 ? 80 : draftDocs > 0 ? 50 : docs.length === 0 ? 40 : 10;

  // 3 Zahlung ×0.18
  const paymentScore = order.paid === 0 ? 70 : order.paid < 30 ? 50 : order.paid < 100 ? 30 : 5;

  // 4 ETA-Druck ×0.15
  const etaPressure = daysToETD < 0 ? 90 : daysToETD < 5 ? 75 : daysToETD < 14 ? 45 : 15;

  // 5 Qualität ×0.12
  const qc = quality.find(q => q.batch === order.batch);
  const qualScore = qc?.status === 'blocked' ? 90 : qc?.status === 'in_progress' ? 40 : qc?.status === 'released' ? 5 : 35;

  // 6 Marge ×0.10
  const marginPct = order.revenue > 0 ? (order.profit / order.revenue) * 100 : 0;
  const marginScore = marginPct < 10 ? 70 : marginPct < 20 ? 40 : 15;

  // 7 Compliance ×0.05
  const complianceScore = order.status === 'problem' ? 90 : order.problem ? 70 : 10;

  const factors: RiskFactor[] = [
    { k: 'Lieferant', v: supplierScore, w: 0.20, note: supplier?.risk ?? '—' },
    { k: 'Dokumente', v: docScore, w: 0.20, note: missingDocs > 0 ? `${missingDocs} fehlt` : 'ok' },
    { k: 'Zahlung', v: paymentScore, w: 0.18, note: `${order.paid}% bezahlt` },
    { k: 'ETA-Druck', v: etaPressure, w: 0.15, note: `${daysToETD}d bis ETD` },
    { k: 'Qualität', v: qualScore, w: 0.12, note: qc?.status ?? 'kein QC' },
    { k: 'Marge', v: marginScore, w: 0.10, note: `${marginPct.toFixed(0)}%` },
    { k: 'Compliance', v: complianceScore, w: 0.05, note: order.status },
  ];

  const score = Math.round(factors.reduce((s, f) => s + f.v * f.w, 0));
  return { score, factors };
}

// ── Tab 1: Briefing ──────────────────────────────────────────────────────────

const BriefingTab = ({ lang, onOpenOrder, onNav }: IntelligenceViewProps) => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const ord0144 = M.orders.find(o => o.id === 'ORD-2026-0144')!;
  const ord0118 = M.orders.find(o => o.id === 'ORD-2026-0118')!;

  const actions = [
    {
      prio: 'kritisch', conf: 92, impact: 61000,
      title: 'Phytosanitary Certificate für ORD-2026-0144 beantragen',
      desc: 'Verschiffung in 8 Tagen — kein Zertifikat, ETD 02.06.2026',
      action: () => onOpenOrder(ord0144),
      btnLabel: 'Auftrag öffnen',
    },
    {
      prio: 'kritisch', conf: 95, impact: 113400,
      title: 'EU Vet-Approval-Status Iringa Meat klären (ORD-0118)',
      desc: 'Auftrag blockiert — EU-Veterinärzulassung fehlt',
      action: () => onOpenOrder(ord0118),
      btnLabel: 'Auftrag öffnen',
    },
    {
      prio: 'wichtig', conf: 88, impact: 23920,
      title: 'Mediterraneo Sugar Zahlungsmahnung',
      desc: '18 Tage überfällig — 23.920 € ausstehend',
      action: () => onNav('tradefinance'),
      btnLabel: 'Trade Finance',
    },
    {
      prio: 'umsatz', conf: 74, impact: 110400,
      title: 'Nordic Nuts AB Follow-up Q-2026-0088',
      desc: 'Angebot seit 10 Tagen unbeantwortet — 110.400 €',
      action: () => onNav('content'),
      btnLabel: 'Content öffnen',
    },
    {
      prio: 'umsatz', conf: 68, impact: 90000,
      title: 'Hanseatic Coffee Cross-sell',
      desc: 'Potential für Specialty Arabica Erweiterung ~90k €',
      action: () => onNav('samples'),
      btnLabel: 'Muster',
    },
  ];

  const prioColor: Record<string, string> = { kritisch: '#ef4444', wichtig: '#f59e0b', umsatz: '#34d399' };

  const probItems = [
    { pct: 87, label: 'ORD-0118 wird weitere 14d verzögert (EU Vet)' },
    { pct: 74, label: 'Mediterreneo-Mahnung eskaliert zu Streit' },
    { pct: 68, label: 'Nordic Nuts AB unterzeichnet bis 31.05.' },
    { pct: 55, label: 'Cashew Q3 Preiskorrektur +8%' },
    { pct: 42, label: 'Hanseatic Coffee erweitert Bestellung' },
  ];

  const aiLog = [
    { time: '23:14', action: 'Phyto-Cert Antrag vorbereitet und zur Unterschrift vorgelegt' },
    { time: '22:08', action: 'ETA für ORD-0137 angepasst — Suezkanal-Verzögerung 1.5d' },
    { time: '20:44', action: 'Mediterraneo Zahlungserinnerung automatisch versendet' },
    { time: '18:30', action: 'Qualitätsbericht SES-2026-031 geprüft und freigegeben' },
    { time: '16:11', action: 'Nordic Nuts Follow-up Email generiert (wartet auf Genehmigung)' },
  ];

  return (
    <div style={{ padding: 16 }}>
      {/* AI Greeting */}
      <div className="ai-card" style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Ic name="sparkle" size={18} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 4, background: 'rgba(167,139,250,0.15)', color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>AI · Morgen-Briefing</span>
              <span className="tx3 mono" style={{ fontSize: 10 }}>07:14 · Montag, 25. Mai 2026</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Guten Morgen, Maryam. Heute gibt es 5 wichtige Punkte.</div>
            <div className="tx2" style={{ fontSize: 12, lineHeight: 1.6 }}>
              <span style={{ color: '#f87171', fontWeight: 500 }}>🔴 Kritisch:</span> Phyto-Cert ORD-0144 fehlt (ETD in 8d, 61k €) ·{' '}
              <span style={{ color: '#f87171', fontWeight: 500 }}>🔴</span> EU Vet Iringa blockiert ORD-0118 (113k €) ·{' '}
              <span style={{ color: '#fbbf24', fontWeight: 500 }}>🟡 Wichtig:</span> Mediterraneo überfällig 18d (23,9k €) ·{' '}
              <span style={{ color: '#34d399', fontWeight: 500 }}>🟢 Umsatz:</span> Nordic Nuts Follow-up (110k €) ·{' '}
              <span style={{ color: '#34d399', fontWeight: 500 }}>🟢</span> Hanseatic Coffee Cross-sell (~90k €).
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <div>
          {/* Next Best Actions */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-head">
              <Ic name="sparkle" size={14} />
              <span className="title">Next Best Actions — KI-Empfehlungen</span>
              <span className="tx3 mono" style={{ fontSize: 10, marginLeft: 'auto' }}>86% Ø Konfidenz</span>
            </div>
            <div className="card-body" style={{ padding: '6px 0' }}>
              {actions.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 16px', borderBottom: i < actions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ width: 3, height: 44, borderRadius: 2, background: prioColor[a.prio], flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <Badge kind={a.prio === 'kritisch' ? 'danger' : a.prio === 'wichtig' ? 'warning' : 'success'}>{a.prio}</Badge>
                      <span className="tx3 mono" style={{ fontSize: 10 }}>{a.conf}% Konfidenz</span>
                      <span className="tx3" style={{ fontSize: 10, marginLeft: 'auto' }}>Impact: <span className="mono" style={{ color: prioColor[a.prio] }}>{fmtCur(a.impact)}</span></span>
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 2 }}>{a.title}</div>
                    <div className="tx2" style={{ fontSize: 11 }}>{a.desc}</div>
                  </div>
                  <button className="btn sm" onClick={a.action} style={{ flexShrink: 0, fontSize: 11 }}>{a.btnLabel}</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          {/* Probability Panel */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-head">
              <Ic name="activity" size={14} />
              <span className="title">Wahrscheinlichkeiten</span>
            </div>
            <div className="card-body">
              {probItems.map((item, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11 }}>{item.label}</span>
                    <span className="mono fw600" style={{ fontSize: 11, color: item.pct >= 70 ? '#ef4444' : item.pct >= 50 ? '#f59e0b' : '#60a5fa' }}>{item.pct}%</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${item.pct}%`, background: item.pct >= 70 ? '#ef4444' : item.pct >= 50 ? '#f59e0b' : '#60a5fa', borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Activity Log */}
          <div className="card">
            <div className="card-head">
              <Ic name="history" size={14} />
              <span className="title">KI-Aktivitätslog (gestern)</span>
            </div>
            <div className="card-body">
              {aiLog.map((entry, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 11 }}>
                  <span className="mono tx3" style={{ flexShrink: 0, fontSize: 10 }}>{entry.time}</span>
                  <span className="tx2">{entry.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Tab 2: Risk Engine ────────────────────────────────────────────────────────

const RiskEngineTab = ({ onOpenOrder }: { lang: Lang; onOpenOrder: (o: Order) => void }) => {
  const { data: M } = useData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const ranked = useMemo(() => {
    if (!M) return [];
    return M.orders
      .map(o => ({ order: o, ...computeRiskScore(o, M.suppliers, M.documents, M.quality) }))
      .sort((a, b) => b.score - a.score);
  }, [M]);

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const selected = ranked.find(r => r.order.id === selectedId);

  return (
    <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 380px', gap: 14 }}>
      {/* Risk Ranking Table */}
      <div className="card">
        <div className="card-head">
          <Ic name="warn" size={14} />
          <span className="title">Risiko-Ranking — alle Aufträge</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="tbl" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Auftrag</th>
                <th>Score</th>
                <th>Trend</th>
                <th>Status</th>
                <th>ETA</th>
                <th>Wert</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => {
                const rng = seedRand(idSeed(r.order.id));
                const spark = Array.from({ length: 8 }, () => Math.round(r.score + (rng() - 0.5) * 24));
                const isSelected = r.order.id === selectedId;
                return (
                  <tr
                    key={r.order.id}
                    onClick={() => setSelectedId(isSelected ? null : r.order.id)}
                    style={{ cursor: 'pointer', background: isSelected ? 'rgba(99,102,241,0.08)' : undefined }}
                  >
                    <td className="mono tx3" style={{ fontSize: 11 }}>{i + 1}</td>
                    <td style={{ fontSize: 12, fontWeight: 500 }}>{r.order.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="mono fw700" style={{ fontSize: 14, color: palette(r.score) }}>{r.score}</span>
                        <div style={{ width: 32, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${r.score}%`, background: palette(r.score), borderRadius: 2 }} />
                        </div>
                      </div>
                    </td>
                    <td><Sparkline data={spark} w={60} h={22} color={palette(r.score)} /></td>
                    <td><Badge kind={r.score >= 60 ? 'danger' : r.score >= 35 ? 'warning' : r.score >= 15 ? 'neutral' : 'success'}>{r.order.status}</Badge></td>
                    <td className="mono tx2" style={{ fontSize: 11 }}>{r.order.eta.slice(5)}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{fmtCur(r.order.revenue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drilldown */}
      <div className="card">
        <div className="card-head">
          <Ic name="activity" size={14} />
          <span className="title">{selected ? `Drilldown — ${selected.order.id}` : 'Auftrag auswählen'}</span>
        </div>
        {selected ? (
          <div className="card-body">
            {/* SVG Ring */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <svg width={120} height={120} viewBox="0 0 120 120">
                <circle cx={60} cy={60} r={46} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12} />
                <circle
                  cx={60} cy={60} r={46}
                  fill="none"
                  stroke={palette(selected.score)}
                  strokeWidth={12}
                  strokeDasharray={`${(selected.score / 100) * 288.9} 288.9`}
                  strokeDashoffset={0}
                  transform="rotate(-90 60 60)"
                  strokeLinecap="round"
                />
                <text x={60} y={56} textAnchor="middle" fontSize={24} fontWeight={700} fill={palette(selected.score)} fontFamily="var(--font-mono)">{selected.score}</text>
                <text x={60} y={72} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.4)">Risiko-Score</text>
              </svg>
            </div>
            {/* Factor Bars */}
            {selected.factors.map((f, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span>{f.k} <span className="tx3">(×{f.w.toFixed(2)})</span></span>
                  <span className="mono" style={{ color: palette(f.v) }}>{f.v} <span className="tx3">{f.note}</span></span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${f.v}%`, background: palette(f.v), borderRadius: 2 }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
              <button className="btn sm primary" onClick={() => onOpenOrder(selected.order)}>Auftrag öffnen</button>
              <button className="btn sm" onClick={() => setSelectedId(null)}>Schließen</button>
            </div>
          </div>
        ) : (
          <div className="card-body">
            <div className="empty tx3" style={{ textAlign: 'center', paddingTop: 40 }}>Klicke auf einen Auftrag für Details</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Tab 3: Anomalies ──────────────────────────────────────────────────────────

const AnomalyTab = () => {
  const [filter, setFilter] = useState('all');

  const anomalies = [
    { id: 'AN-01', cat: 'supplier', sev: 'high' as const, title: 'Iringa Meat Qualitätskontrolle blockiert', message: 'Charge BEF-2026-002 seit 5 Tagen in QC-Hold — EU Vet Freigabe fehlt. Risiko: 113.400 €.', when: 'vor 2h', confidence: 94, chartData: [28, 32, 29, 45, 52, 49, 68, 71] },
    { id: 'AN-02', cat: 'price', sev: 'medium' as const, title: 'Cashew-Weltmarktpreis +11% in 30d', message: 'W320 Kurs stieg von USD 6.40 auf USD 7.10/kg. Marge auf ORD-0144 sinkt auf 19%.', when: 'vor 4h', confidence: 88, chartData: [64, 64, 65, 66, 67, 68, 70, 71] },
    { id: 'AN-03', cat: 'complaint', sev: 'medium' as const, title: 'Amsterdam Spice Reklamation Feuchtigkeit', message: 'Cloves Charge CLV-2026-009: Feuchte 12% statt vertragl. 10%. Gutschrift 1.800 € erwartet.', when: 'vor 6h', confidence: 82 },
    { id: 'AN-04', cat: 'cost', sev: 'low' as const, title: 'Logistikkosten ORD-0135 +8%', message: 'Reefer-Surcharge Mombasa–Felixstowe gestiegen. Profit sinkt um ca. 1.200 €.', when: 'vor 8h', confidence: 76, chartData: [6400, 6600, 6700, 6800, 6900, 7000, 7100, 7200] },
    { id: 'AN-05', cat: 'engagement', sev: 'low' as const, title: 'Nordic Nuts AB kein Antwort 10 Tage', message: 'Angebot Q-2026-0088 seit 10 Tagen ohne Rückmeldung. Abschlusswahrscheinlichkeit sinkt.', when: 'vor 9h', confidence: 71 },
    { id: 'AN-06', cat: 'delay', sev: 'medium' as const, title: 'ORD-0137 ETA-Warnung', message: 'HAPAG SAVANNAH liegt 1.5 Tage hinter Plan. Neue ETA: 02.06. statt 01.06. Demurrage-Risiko.', when: 'vor 12h', confidence: 85, chartData: [0, 0, 0, 0, 1, 1.5, 1.5, 1.5] },
    { id: 'AN-07', cat: 'supplier', sev: 'high' as const, title: 'SUP-018 Organic-Zertifikat läuft ab', message: 'Kilimo Co-op Arusha: Organic EU Zertifikat läuft in 14 Tagen ab. 2 aktive Aufträge betroffen.', when: 'vor 14h', confidence: 100 },
    { id: 'AN-08', cat: 'data', sev: 'low' as const, title: 'Preisinkongruenz ORD-0126', message: 'Verkaufspreis 0,58 €/Stk — COA zeigt Einkaufspreis 0,33 € statt 0,32 €. Ggf. Datenfehler.', when: 'vor 18h', confidence: 64 },
  ];

  const filters = ['all', 'supplier', 'price', 'complaint', 'cost', 'engagement', 'delay', 'data'];
  const visible = filter === 'all' ? anomalies : anomalies.filter(a => a.cat === filter);
  const sevColor = { high: '#ef4444', medium: '#f59e0b', low: '#60a5fa' };

  return (
    <div style={{ padding: 16 }}>
      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button key={f} className={`btn sm ${filter === f ? 'primary' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Alle' : f}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {visible.map(a => (
          <div key={a.id} className="card" style={{ borderLeft: `3px solid ${sevColor[a.sev]}` }}>
            <div style={{ padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Badge kind={a.sev === 'high' ? 'danger' : a.sev === 'medium' ? 'warning' : 'info'}>{a.sev}</Badge>
                <span className="tx3 mono" style={{ fontSize: 10 }}>{a.cat}</span>
                <span className="tx3 mono" style={{ fontSize: 10, marginLeft: 'auto' }}>{a.confidence}% · {a.when}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 4 }}>{a.title}</div>
              <div className="tx2" style={{ fontSize: 11, lineHeight: 1.5, marginBottom: a.chartData ? 8 : 0 }}>{a.message}</div>
              {a.chartData && <Sparkline data={a.chartData} w={300} h={36} color={sevColor[a.sev]} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Tab 4: Forecast ───────────────────────────────────────────────────────────

const ForecastTab = () => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const demandData = [
    { m: 'Cashew', v: 22 }, { m: 'Coffee', v: 18 }, { m: 'Sesame', v: 31 },
    { m: 'Macad.', v: 8 }, { m: 'Cloves', v: 3 }, { m: 'Sugar', v: 65 }, { m: 'Avocado', v: 9 },
  ] as unknown as Record<string, number | string>[];

  const prices = [
    { label: 'Coffee C', current: '168.2', forecast: '175.0', trend: 'up', pct: '+4.0%' },
    { label: 'Robusta', current: '2.94', forecast: '3.02', trend: 'up', pct: '+2.7%' },
    { label: 'Sugar #11', current: '21.8', forecast: '20.1', trend: 'down', pct: '-7.8%' },
    { label: 'Cocoa', current: '7.42', forecast: '7.80', trend: 'up', pct: '+5.1%' },
    { label: 'Cashew Spot', current: '7.10', forecast: '7.45', trend: 'up', pct: '+4.9%' },
    { label: 'Sesame TZ', current: '2.20', forecast: '2.18', trend: 'down', pct: '-0.9%' },
  ];

  const etaComparisons = [
    { order: 'ORD-0142', aiEta: '13.06.', carrierEta: '12.06.', diff: '+1d', prod: 'Arabica SCA' },
    { order: 'ORD-0135', aiEta: '08.06.', carrierEta: '08.06.', diff: '0d', prod: 'Avocado Hass' },
    { order: 'ORD-0137', aiEta: '02.06.', carrierEta: '01.06.', diff: '+1.5d', prod: 'Sugar VHP' },
    { order: 'ORD-0139', aiEta: '21.05.', carrierEta: '21.05.', diff: '0d', prod: 'Cloves' },
  ];

  const portCongestion = [
    { port: 'Hamburg', level: 'niedrig', wait: '1-2d', trend: 'stabil' },
    { port: 'Rotterdam', level: 'mittel', wait: '3-4d', trend: '↑' },
    { port: 'Dar es Salaam', level: 'hoch', wait: '6-8d', trend: '↓' },
    { port: 'Mombasa', level: 'mittel', wait: '2-3d', trend: 'stabil' },
  ];

  const marginErosion = [
    { order: 'ORD-0144', product: 'Cashew Organic', originalMargin: 19.7, currentMargin: 17.2, reason: 'Cashew +11%' },
    { order: 'ORD-0137', product: 'Sugar VHP', originalMargin: 17.0, currentMargin: 15.8, reason: 'Logistik +3%' },
    { order: 'ORD-0135', product: 'Avocado Hass', originalMargin: 37.2, currentMargin: 34.4, reason: 'Reefer +8%' },
    { order: 'ORD-0118', product: 'Frozen Beef', originalMargin: 18.1, currentMargin: 14.9, reason: 'Compliance' },
  ];

  // Deterministic payment risk from buyer id seed
  const paymentRisk = M.buyers.slice(0, 5).map(b => {
    const seed = idSeed(b.id);
    const rng = seedRand(seed);
    const risk = Math.round(20 + rng() * 60);
    return { name: b.name.split(' ').slice(0, 2).join(' '), risk };
  });

  // Deterministic quality risk from supplier id seed
  const qualityRisk = M.suppliers.slice(0, 5).map(s => {
    const seed = idSeed(s.id);
    const rng = seedRand(seed);
    const risk = Math.round(10 + rng() * 70);
    return { name: s.name.split(' ').slice(0, 2).join(' '), risk };
  });

  return (
    <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {/* Demand Forecast */}
      <div className="card">
        <div className="card-head"><Ic name="chart" size={14} /><span className="title">Nachfrage-Forecast Q3 2026 (t)</span></div>
        <div className="card-body"><BarChart data={demandData} w={400} h={120} color="#3b82f6" valKey="v" lblKey="m" /></div>
      </div>

      {/* Price Forecast */}
      <div className="card">
        <div className="card-head"><Ic name="finance" size={14} /><span className="title">Preis-Forecast (30d)</span></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {prices.map((p, i) => (
              <div key={i} style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                <div className="tx3" style={{ fontSize: 10 }}>{p.label}</div>
                <div className="mono fw600" style={{ fontSize: 14 }}>{p.current}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: p.trend === 'up' ? '#34d399' : '#f87171' }}>{p.pct}</span>
                  <span className="tx3" style={{ fontSize: 10 }}>→ {p.forecast}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI-ETA vs Carrier */}
      <div className="card">
        <div className="card-head"><Ic name="ship" size={14} /><span className="title">KI-ETA vs. Carrier-ETA</span></div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="tbl" style={{ width: '100%' }}>
            <thead><tr><th>Auftrag</th><th>Produkt</th><th>KI-ETA</th><th>Carrier</th><th>Delta</th></tr></thead>
            <tbody>
              {etaComparisons.map((e, i) => (
                <tr key={i}>
                  <td className="mono" style={{ fontSize: 11 }}>{e.order}</td>
                  <td style={{ fontSize: 11 }}>{e.prod}</td>
                  <td className="mono" style={{ fontSize: 11, color: '#60a5fa' }}>{e.aiEta}</td>
                  <td className="mono" style={{ fontSize: 11 }}>{e.carrierEta}</td>
                  <td className="mono fw600" style={{ fontSize: 11, color: e.diff === '0d' ? '#34d399' : '#f59e0b' }}>{e.diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Risk */}
      <div className="card">
        <div className="card-head"><Ic name="finance" size={14} /><span className="title">Zahlungsrisiko je Käufer</span></div>
        <div className="card-body">
          {paymentRisk.map((p, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                <span>{p.name}</span>
                <span className="mono" style={{ color: palette(p.risk) }}>{p.risk}%</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${p.risk}%`, background: palette(p.risk), borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quality Risk */}
      <div className="card">
        <div className="card-head"><Ic name="quality" size={14} /><span className="title">Qualitätsrisiko je Lieferant</span></div>
        <div className="card-body">
          {qualityRisk.map((q, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                <span>{q.name}</span>
                <span className="mono" style={{ color: palette(q.risk) }}>{q.risk}%</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${q.risk}%`, background: palette(q.risk), borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Port Congestion */}
      <div className="card">
        <div className="card-head"><Ic name="ship" size={14} /><span className="title">Hafen-Auslastung</span></div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="tbl" style={{ width: '100%' }}>
            <thead><tr><th>Hafen</th><th>Level</th><th>Wartezeit</th><th>Trend</th></tr></thead>
            <tbody>
              {portCongestion.map((p, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 12 }}>{p.port}</td>
                  <td><Badge kind={p.level === 'hoch' ? 'danger' : p.level === 'mittel' ? 'warning' : 'success'}>{p.level}</Badge></td>
                  <td className="mono" style={{ fontSize: 11 }}>{p.wait}</td>
                  <td className="tx2" style={{ fontSize: 11 }}>{p.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Margin Erosion */}
      <div className="card" style={{ gridColumn: 'span 2' }}>
        <div className="card-head"><Ic name="activity" size={14} /><span className="title">Margenerosion — laufende Aufträge</span></div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="tbl" style={{ width: '100%' }}>
            <thead><tr><th>Auftrag</th><th>Produkt</th><th>Urspr. Marge</th><th>Aktuelle Marge</th><th>Delta</th><th>Grund</th></tr></thead>
            <tbody>
              {marginErosion.map((m, i) => {
                const delta = m.currentMargin - m.originalMargin;
                return (
                  <tr key={i}>
                    <td className="mono" style={{ fontSize: 11 }}>{m.order}</td>
                    <td style={{ fontSize: 11 }}>{m.product}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{m.originalMargin.toFixed(1)}%</td>
                    <td className="mono fw600" style={{ fontSize: 11, color: palette(60 - m.currentMargin) }}>{m.currentMargin.toFixed(1)}%</td>
                    <td className="mono" style={{ fontSize: 11, color: '#f87171' }}>{delta.toFixed(1)}pp</td>
                    <td className="tx2" style={{ fontSize: 11 }}>{m.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Tab 5: Decision Support ───────────────────────────────────────────────────

const DecisionTab = () => {
  const [selectedDc, setSelectedDc] = useState('DC-01');

  const decisions = [
    {
      id: 'DC-01', cat: 'Auftrag', title: 'Phyto-Cert Eilantrag — ORD-0144',
      verdict: 'sofort', verdictKind: 'danger',
      dataPoints: [
        { k: 'ETD', v: '02.06.2026 (8 Tage)' }, { k: 'Zertifikat', v: 'fehlt' },
        { k: 'Auftragswert', v: '61.000 €' }, { k: 'Risiko', v: 'Verschiffung blockiert' },
      ],
      options: [
        { title: 'Eilantrag TPHC (24h)', score: 92, desc: 'Teuerste Option, sicherste Lösung' },
        { title: 'Standardantrag (5-7d)', score: 44, desc: 'Zu langsam für ETD' },
        { title: 'ETD verschieben (+10d)', score: 31, desc: 'Strafzahlung + Kundenunzufriedenheit' },
      ],
      reasoning: 'Der Eilantrag ist die einzige Option, die ETD einhält. Kosten ca. 800 € — Opportunitätskosten bei Verzögerung ca. 8.000 €.',
    },
    {
      id: 'DC-02', cat: 'Logistik', title: 'ORD-0137 — Umbuchung wegen ETA-Risiko',
      verdict: 'prüfen', verdictKind: 'warning',
      dataPoints: [
        { k: 'Aktueller Carrier', v: 'HAPAG-Lloyd' }, { k: 'Delta', v: '+1.5d Verspätung' },
        { k: 'Demurrage', v: '350 €/d' }, { k: 'Wert', v: '23.920 €' },
      ],
      options: [
        { title: 'Umbuchung MSC +3d', score: 72, desc: 'Vermeidet Demurrage-Risiko' },
        { title: 'Abwarten + Puffer', score: 68, desc: 'Günstiger, aber risikobehaftet' },
        { title: 'Käufer informieren', score: 58, desc: 'Transparenz, kein Aktionsaufwand' },
      ],
      reasoning: 'Bei aktuellem Puffer von 2 Tagen im Hafen Rotterdam ist Umbuchung nur bei weiterer Verzögerung nötig.',
    },
    {
      id: 'DC-03', cat: 'Pricing', title: 'Cashew W320 Preis anpassen',
      verdict: 'empfohlen', verdictKind: 'success',
      dataPoints: [
        { k: 'Marktpreis', v: 'USD 7.10/kg (+11%)' }, { k: 'Unser Preis', v: 'USD 6.10/kg' },
        { k: 'Margendruck', v: '-2.5pp in 30d' }, { k: 'Offene Angebote', v: '2 (Q-0094, Q-0088)' },
      ],
      options: [
        { title: 'Preis +8% (6.59$/kg)', score: 84, desc: 'Marktgerecht, Marge gesichert' },
        { title: 'Preis +5% (6.41$/kg)', score: 71, desc: 'Kompromiss — niedrigeres Risiko' },
        { title: 'Preis halten', score: 32, desc: 'Marge fällt unter 20%' },
      ],
      reasoning: 'Weltmarktpreisanstieg +11% erfordert Preisanpassung. Kunden sind preissensibel, aber Qualitätsdifferenzierung erlaubt +8%.',
    },
    {
      id: 'DC-04', cat: 'Sourcing', title: 'Alternativer Cashew-Lieferant',
      verdict: 'analyse', verdictKind: 'neutral',
      dataPoints: [
        { k: 'Aktuell', v: 'SUP-024 (Kapazität voll)' }, { k: 'Bedarf Q3', v: '+20t' },
        { k: 'Lead-Time', v: '8-12 Wochen' }, { k: 'Budget', v: 'offen' },
      ],
      options: [
        { title: 'Kenya Cashew Board prüfen', score: 76, desc: 'Neue Region, Organic verfügbar' },
        { title: 'Mosambik SUP anfragen', score: 62, desc: 'Günstigere Preise, unbekannte Qualität' },
        { title: 'SUP-024 Kapazität erhöhen', score: 54, desc: 'Bestehende Beziehung, aber Risikokonzentration' },
      ],
      reasoning: 'Risikokonzentration bei einem Cashew-Lieferanten. Diversifikation empfohlen vor Q3-Saison.',
    },
    {
      id: 'DC-05', cat: 'Käufer', title: 'Nordic Nuts AB — Eskalation Follow-up',
      verdict: 'prüfen', verdictKind: 'warning',
      dataPoints: [
        { k: 'Angebot', v: 'Q-2026-0088 (10d ohne Antwort)' }, { k: 'Wert', v: '110.400 €' },
        { k: 'Stadium', v: 'Verhandlung 70%' }, { k: 'Follow-up', v: 'überfällig +3d' },
      ],
      options: [
        { title: 'Persönlicher Anruf CEO', score: 88, desc: 'Höchste Erfolgsquote' },
        { title: 'Formelles Erinnerungsschreiben', score: 61, desc: 'Standard-Prozess' },
        { title: 'Preis -2% anbieten', score: 45, desc: 'Risiko: Signalisiert Schwäche' },
      ],
      reasoning: 'Bei 70% Abschlusswahrscheinlichkeit und 10d Inaktivität: direkter Kontakt notwendig.',
    },
    {
      id: 'DC-06', cat: 'FX', title: 'USD/EUR Hedging Q3',
      verdict: 'analyse', verdictKind: 'neutral',
      dataPoints: [
        { k: 'Aktueller Kurs', v: 'EUR/USD 1.088' }, { k: 'Exposure', v: 'USD 340k' },
        { k: 'Forecast', v: '1.05–1.11 (90d)' }, { k: 'Ungesichert', v: '280k USD' },
      ],
      options: [
        { title: 'Forward-Kontrakt 6M', score: 79, desc: 'Kurs sichern, Planungssicherheit' },
        { title: 'Partial Hedge 50%', score: 71, desc: 'Balance zwischen Risiko und Chancen' },
        { title: 'Keine Absicherung', score: 38, desc: 'Volles FX-Risiko' },
      ],
      reasoning: 'Bei USD-Exposure > 300k ist Forward-Hedging empfohlen. Aktuelle Volatilität erhöht FX-Risiko.',
    },
  ];

  const selected = decisions.find(d => d.id === selectedDc)!;

  return (
    <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14 }}>
      {/* Sidebar */}
      <div className="card" style={{ height: 'fit-content' }}>
        <div className="card-head"><Ic name="sparkle" size={14} /><span className="title">Entscheidungen</span></div>
        <div className="card-body" style={{ padding: '4px 0' }}>
          {decisions.map(d => (
            <div
              key={d.id}
              onClick={() => setSelectedDc(d.id)}
              style={{
                padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                background: d.id === selectedDc ? 'rgba(99,102,241,0.1)' : 'transparent',
                borderLeft: d.id === selectedDc ? '2px solid #6366f1' : '2px solid transparent',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{d.id} · {d.cat}</div>
                <div className="tx2" style={{ fontSize: 10 }}>{d.title}</div>
              </div>
              <Badge kind={d.verdictKind}>{d.verdict}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Detail */}
      <div className="card">
        <div className="card-head">
          <Ic name="info" size={14} />
          <span className="title">{selected.id} — {selected.title}</span>
          <span style={{ marginLeft: 'auto' }}><Badge kind={selected.verdictKind}>{selected.verdict}</Badge></span>
        </div>
        <div className="card-body">
          {/* Data Points */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
            {selected.dataPoints.map((dp, i) => (
              <div key={i} style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                <div className="tx3" style={{ fontSize: 10 }}>{dp.k}</div>
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{dp.v}</div>
              </div>
            ))}
          </div>
          {/* Options */}
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Optionen</div>
          {selected.options.map((opt, i) => (
            <div key={i} style={{ marginBottom: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, borderLeft: i === 0 ? '3px solid #6366f1' : '3px solid transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: i === 0 ? 700 : 500 }}>{opt.title}</span>
                <span className="mono fw700" style={{ fontSize: 11, color: opt.score >= 70 ? '#34d399' : opt.score >= 50 ? '#f59e0b' : '#f87171', marginLeft: 'auto' }}>{opt.score}</span>
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 4 }}>
                <div style={{ height: '100%', width: `${opt.score}%`, background: opt.score >= 70 ? '#34d399' : opt.score >= 50 ? '#f59e0b' : '#f87171', borderRadius: 2 }} />
              </div>
              <div className="tx2" style={{ fontSize: 11 }}>{opt.desc}</div>
            </div>
          ))}
          {/* Reasoning */}
          <details style={{ marginTop: 12 }}>
            <summary style={{ fontSize: 12, cursor: 'pointer', color: '#a78bfa', userSelect: 'none' }}>KI-Begründung anzeigen</summary>
            <div className="tx2" style={{ fontSize: 11, lineHeight: 1.6, marginTop: 8, padding: '10px 12px', background: 'rgba(167,139,250,0.06)', borderRadius: 6 }}>
              {selected.reasoning}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

// ── Tab 6: Content & Documents ────────────────────────────────────────────────

const ContentDocTab = () => {
  const [subTab, setSubTab] = useState<'studio' | 'inspector'>('studio');
  const [template, setTemplate] = useState('offer_letter');
  const [audience, setAudience] = useState('B2B Importeur');
  const [tone, setTone] = useState('professionell');
  const [contentLang, setContentLang] = useState('DE');

  const templates = [
    { id: 'offer_letter', label: 'Angebotsschreiben' },
    { id: 'follow_up', label: 'Follow-Up Email' },
    { id: 'intro_letter', label: 'Einführungsschreiben' },
    { id: 'product_sheet', label: 'Produktblatt' },
    { id: 'quality_report', label: 'Qualitätsbericht' },
    { id: 'complaint_response', label: 'Reklamationsantwort' },
    { id: 'shipping_notice', label: 'Versandbenachrichtigung' },
    { id: 'payment_reminder', label: 'Zahlungserinnerung' },
    { id: 'contract_intro', label: 'Vertragseinleitung' },
    { id: 'newsletter', label: 'Newsletter' },
    { id: 'customs_letter', label: 'Zollbegleitschreiben' },
  ];

  const sampleTexts: Record<string, string> = {
    offer_letter: `Betreff: Angebot Cashew Kernels W320 Organic — Q-2026-0094\n\nSehr geehrter Herr Lindqvist,\n\nvielen Dank für Ihr Interesse an unseren Premium Cashew Kernels aus Tansania. Gerne unterbreiten wir Ihnen folgendes Angebot:\n\nProdukt: Cashew Kernels W320 Organic EU\nHerkunft: Mtwara Region, Tansania\nMenge: 8.000 kg (1 × 20ft Container)\nPreis: USD 13,80/kg CIF Hamburg\nZertifizierungen: Organic EU, HACCP, Bureau Veritas\nLieferzeit: 42–48 Tage ab Auftragsbestätigung\n\nDie Ware entspricht Ihrer BRC-Anforderung und kann auf Wunsch mit SGS-Inspektion begleitet werden.\n\nWir freuen uns auf Ihre Rückmeldung und stehen für Rückfragen gerne zur Verfügung.\n\nMit freundlichen Grüßen\nMaryam Kassim · EastAfrica Export OS`,
    follow_up: `Betreff: Follow-Up: Ihr Angebot Q-2026-0088 — Nordic Nuts AB\n\nSehr geehrter Herr Lindqvist,\n\nich möchte mich bezüglich unseres Angebots vom 15. Mai 2026 für Macadamia Kernels Style 1L melden.\n\nHaben Sie die Unterlagen erhalten? Für Rückfragen stehe ich jederzeit gern zur Verfügung.`,
    payment_reminder: `Betreff: Zahlungserinnerung — Rechnung RE-2026-0137\n\nSehr geehrter Herr Romano,\n\nwie unseren Unterlagen zu entnehmen ist, steht die Zahlung unserer Rechnung RE-2026-0137 über EUR 23.920,00 bereits 18 Tage aus.\n\nWir bitten um umgehende Begleichung bis zum 28.05.2026.`,
  };

  const currentText = sampleTexts[template] || `[KI-generierter Inhalt für "${templates.find(t => t.id === template)?.label}" — Audience: ${audience}, Ton: ${tone}, Sprache: ${contentLang}]\n\nKlicke auf "Generieren" um einen vollständigen Text zu erstellen.`;

  return (
    <div style={{ padding: 16 }}>
      {/* Sub-tab switch */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        <button className={`btn ${subTab === 'studio' ? 'primary' : ''}`} onClick={() => setSubTab('studio')}>
          <Ic name="edit" size={13} /> Content Studio
        </button>
        <button className={`btn ${subTab === 'inspector' ? 'primary' : ''}`} onClick={() => setSubTab('inspector')}>
          <Ic name="doc" size={13} /> Document Inspector
        </button>
      </div>

      {subTab === 'studio' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 14 }}>
          {/* Settings Panel */}
          <div className="card">
            <div className="card-head"><Ic name="settings" size={14} /><span className="title">Einstellungen</span></div>
            <div className="card-body">
              <div style={{ marginBottom: 10 }}>
                <div className="tx3" style={{ fontSize: 10, marginBottom: 4 }}>Vorlage</div>
                <select
                  value={template}
                  onChange={e => setTemplate(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', borderRadius: 5, padding: '4px 8px', fontSize: 11 }}
                >
                  {templates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div className="tx3" style={{ fontSize: 10, marginBottom: 4 }}>Zielgruppe</div>
                <select
                  value={audience}
                  onChange={e => setAudience(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', borderRadius: 5, padding: '4px 8px', fontSize: 11 }}
                >
                  {['B2B Importeur', 'Röster', 'Distributor', 'Retail', 'Investor'].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div className="tx3" style={{ fontSize: 10, marginBottom: 4 }}>Ton</div>
                <select
                  value={tone}
                  onChange={e => setTone(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', borderRadius: 5, padding: '4px 8px', fontSize: 11 }}
                >
                  {['professionell', 'freundlich', 'formal', 'überzeugend'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div className="tx3" style={{ fontSize: 10, marginBottom: 4 }}>Sprache</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['DE', 'EN', 'FR', 'IT'].map(l => (
                    <button key={l} className={`btn sm ${contentLang === l ? 'primary' : ''}`} onClick={() => setContentLang(l)}>{l}</button>
                  ))}
                </div>
              </div>
              <button className="btn primary" style={{ width: '100%' }}>
                <Ic name="sparkle" size={13} /> Generieren
              </button>
            </div>
          </div>

          {/* Text Editor */}
          <div className="card">
            <div className="card-head">
              <Ic name="doc" size={14} />
              <span className="title">{templates.find(t => t.id === template)?.label}</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                <button className="btn sm"><Ic name="download" size={12} /> Exportieren</button>
                <button className="btn sm"><Ic name="mail" size={12} /> Senden</button>
              </div>
            </div>
            <div className="card-body">
              <textarea
                value={currentText}
                readOnly
                style={{
                  width: '100%', height: 360, background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
                  color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 11.5,
                  lineHeight: 1.6, padding: 12, resize: 'vertical', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {subTab === 'inspector' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Upload Zone */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Ic name="upload" size={24} color="#6366f1" />
              </div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Dokument hochladen</div>
              <div className="tx2" style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 14 }}>PDF, Excel, Word · max 20 MB<br />Drag & Drop oder klicken</div>
              <button className="btn primary"><Ic name="upload" size={13} /> Datei wählen</button>
            </div>
          </div>
          {/* Info */}
          <div className="card">
            <div className="card-head"><Ic name="info" size={14} /><span className="title">Document Inspector</span></div>
            <div className="card-body">
              <div className="tx2" style={{ fontSize: 12, lineHeight: 1.7 }}>
                <p>Der Document Inspector analysiert hochgeladene Dokumente automatisch:</p>
                <ul style={{ paddingLeft: 16 }}>
                  <li>Vollständigkeitsprüfung nach Export-Checkliste</li>
                  <li>Ablaufdaten-Erkennung (Zertifikate, Visa, etc.)</li>
                  <li>HS-Code Validierung</li>
                  <li>Inhaltliche Plausibilitätsprüfung</li>
                  <li>Vergleich gegen Auftragsdaten</li>
                  <li>Compliance-Check EU / UK / US Importregeln</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'brief', label: 'Briefing' },
  { id: 'risk', label: 'Risiko-Engine' },
  { id: 'anomaly', label: 'Anomalien' },
  { id: 'forecast', label: 'Forecast' },
  { id: 'decide', label: 'Entscheidungen' },
  { id: 'content', label: 'Content & Docs' },
];

export const IntelligenceView = ({ lang, onOpenOrder, onNav }: IntelligenceViewProps) => {
  const [tab, setTab] = useState('brief');

  return (
    <div>
      <div className="section-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic name="sparkle" size={14} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0 }}>Intelligence Hub</h1>
            <div className="sub">KI-Briefing · Risiko-Engine · Anomalien · Forecast · Entscheidungen · Content</div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 2, padding: '0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 16px', fontSize: 12.5, fontWeight: tab === t.id ? 600 : 400,
              background: 'none', border: 'none', cursor: 'pointer',
              color: tab === t.id ? '#a78bfa' : 'rgba(255,255,255,0.45)',
              borderBottom: tab === t.id ? '2px solid #a78bfa' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'brief' && <BriefingTab lang={lang} onOpenOrder={onOpenOrder} onNav={onNav} />}
      {tab === 'risk' && <RiskEngineTab lang={lang} onOpenOrder={onOpenOrder} />}
      {tab === 'anomaly' && <AnomalyTab />}
      {tab === 'forecast' && <ForecastTab />}
      {tab === 'decide' && <DecisionTab />}
      {tab === 'content' && <ContentDocTab />}
    </div>
  );
};

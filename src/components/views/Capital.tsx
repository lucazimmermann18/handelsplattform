'use client';

import React, { useState, useMemo } from 'react';
import type { Lang } from '@/lib/i18n';
import { fmtCur } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge, Stars } from '@/components/ui/primitives';
import { useData } from '@/lib/data-context';

interface CapitalViewProps {
  lang: Lang;
}

// ── Forecast data ─────────────────────────────────────────────────────────────

type Scenario = 'conservative' | 'base' | 'aggressive';

interface YearData {
  rev: number;
  ebitda: number;
  marge?: number;
  headcount?: number;
}

interface ScenarioData {
  y2025: YearData;
  y2026: YearData;
  y2027: YearData;
  y2028: YearData;
  description: string;
  color: string;
  markets: number;
  products: number;
}

const SCENARIOS: Record<Scenario, ScenarioData> = {
  conservative: {
    description: 'Stabiles Wachstum, kein großer Käufer-Durchbruch',
    color: '#60a5fa',
    y2025: { rev: 928,  ebitda: 28,  marge: 26, headcount: 7 },
    y2026: { rev: 1120, ebitda: 58,  marge: 27, headcount: 8 },
    y2027: { rev: 1210, ebitda: 67 },
    y2028: { rev: 1306, ebitda: 76,  marge: 28 },
    markets: 5,
    products: 6,
  },
  base: {
    description: 'France + Schweden Durchbruch, Investor-Unterstützung',
    color: '#34d399',
    y2025: { rev: 928,  ebitda: 28,  marge: 26, headcount: 7 },
    y2026: { rev: 1380, ebitda: 118, marge: 28, headcount: 10 },
    y2027: { rev: 1820, ebitda: 190 },
    y2028: { rev: 2280, ebitda: 280, marge: 31 },
    markets: 7,
    products: 10,
  },
  aggressive: {
    description: 'Series Seed geschlossen, 3+ neue Märkte, KI-Prozesse skaliert',
    color: '#a78bfa',
    y2025: { rev: 928,  ebitda: 28,  marge: 26, headcount: 7 },
    y2026: { rev: 1620, ebitda: 138, marge: 28, headcount: 12 },
    y2027: { rev: 2480, ebitda: 265 },
    y2028: { rev: 3650, ebitda: 475, marge: 32 },
    markets: 9,
    products: 14,
  },
};

const SCENARIO_LABELS: Record<Scenario, string> = {
  conservative: 'Konservativ',
  base: 'Basis',
  aggressive: 'Aggressiv',
};

const MAX_REV = 3700;

// SVG chart point: x in 0-1000, y in 0-220
function chartPoint(idx: number, rev: number): [number, number] {
  const xs = [100, 300, 600, 900];
  const x = xs[idx];
  const y = 20 + (1 - rev / MAX_REV) * 170;
  return [x, y];
}

interface SensRow {
  factor: string;
  impact: string;
  direction: 'pos' | 'neg' | 'neu';
}

const SENSITIVITIES: Record<Scenario, SensRow[]> = {
  conservative: [
    { factor: 'Umsatz +10%',      impact: '+€133k EBITDA', direction: 'pos' },
    { factor: 'Marge -2pp',       impact: '-€22k EBITDA',  direction: 'neg' },
    { factor: 'FX EUR/TZS +5%',   impact: '-€56k Kosten',  direction: 'neg' },
    { factor: '+1 Käufer DE',     impact: '+€40k Umsatz',  direction: 'pos' },
    { factor: 'Logistikkosten +8%', impact: '-€34k EBITDA', direction: 'neg' },
    { factor: 'EUDR Verzögerung', impact: '-€80k Umsatz',  direction: 'neg' },
    { factor: 'BRC Cert',         impact: '+€60k/Jahr',    direction: 'pos' },
  ],
  base: [
    { factor: 'Umsatz +10%',      impact: '+€138k EBITDA', direction: 'pos' },
    { factor: 'Marge -2pp',       impact: '-€28k EBITDA',  direction: 'neg' },
    { factor: 'FX EUR/TZS +5%',   impact: '-€69k Kosten',  direction: 'neg' },
    { factor: 'France-Deal',      impact: '+€220k Umsatz', direction: 'pos' },
    { factor: 'Logistikkosten +8%', impact: '-€48k EBITDA', direction: 'neg' },
    { factor: 'Series Seed',      impact: '+€500k Cash',   direction: 'pos' },
    { factor: 'BRC Cert',         impact: '+€90k/Jahr',    direction: 'pos' },
  ],
  aggressive: [
    { factor: 'Umsatz +10%',      impact: '+€162k EBITDA', direction: 'pos' },
    { factor: 'Marge -2pp',       impact: '-€32k EBITDA',  direction: 'neg' },
    { factor: 'FX EUR/TZS +5%',   impact: '-€81k Kosten',  direction: 'neg' },
    { factor: 'Nordic Markets',   impact: '+€500k Umsatz', direction: 'pos' },
    { factor: 'Headcount +3 FTE', impact: '-€90k Opex',    direction: 'neg' },
    { factor: 'Series Seed',      impact: '+€1M Cash',     direction: 'pos' },
    { factor: 'KI-Skalierung',    impact: '-15% CycleTime',direction: 'pos' },
  ],
};

const ASSUMPTIONS: Record<Scenario, string[]> = {
  conservative: [
    'Kein Series Seed in 2026',
    'Max. 2 neue EU-Märkte',
    'Margenverbesserung moderat',
    'EUDR-Compliance ohne größere Störung',
  ],
  base: [
    'Series Seed Q4 2026 abgeschlossen',
    'Frankreich + Schweden erfolgreich',
    'BRC-Zertifizierung Oct 2026',
    'EBITDA Break-Even Q3 2026',
  ],
  aggressive: [
    'Series Seed Q3 2026 geschlossen',
    '3 neue EU-Märkte 2026/27',
    'Headcount 12→18 bis 2027',
    'KI-Prozesse vollständig skaliert',
  ],
};

// ── Trade Finance data ─────────────────────────────────────────────────────────

interface TFOption {
  id: string;
  provider: string;
  country: string;
  type: string;
  rate: string;
  limit: number;
  advance: string;
  speed: string;
  score: number;
  recommended: boolean;
  note?: string;
}

const TF_OPTIONS: TFOption[] = [
  { id: 'TF-018', provider: 'Standard Bank TZ',       country: 'Tanzania',      type: 'LC Confirmation',           rate: '1.8% p.a.',     limit: 500000, advance: '80%',    speed: '5–7 Tage',   score: 84, recommended: false },
  { id: 'TF-019', provider: 'TradeRiver Africa',       country: 'UK',            type: 'Invoice Factoring',         rate: '2.4%/Mo',       limit: 180000, advance: '85%',    speed: '24–48h',     score: 91, recommended: true, note: 'RECOMMENDED' },
  { id: 'TF-022', provider: 'AfricInvest TradeFin',    country: 'Tunisia',       type: 'PO Financing',              rate: '1.95%/Mo',      limit: 300000, advance: '70%',    speed: '7–10 Tage',  score: 76, recommended: false },
  { id: 'TF-024', provider: 'KfW IPEX',                country: 'Germany',       type: 'Export-Förderung',          rate: '0.5% p.a.',     limit: 2000000,advance: '90%',    speed: '6–12 Wochen',score: 88, recommended: true, note: 'RECOMMENDED' },
  { id: 'TF-025', provider: 'Stenn International',     country: 'UK',            type: 'Invoice Factoring',         rate: '2.1%/Mo',       limit: 500000, advance: '80%',    speed: '48h',        score: 87, recommended: false },
  { id: 'TF-027', provider: 'Allianz Trade',           country: 'Germany',       type: 'Käufer-Kreditversicherung', rate: '0.4% Umsatz',   limit: 1000000,advance: '—',      speed: '2–3 Wochen', score: 92, recommended: true, note: 'RECOMMENDED' },
  { id: 'TF-029', provider: 'Lendable',                country: 'UK',            type: 'Working Capital',           rate: '7.2% p.a.',     limit: 750000, advance: '75%',    speed: '3–5 Wochen', score: 71, recommended: false },
  { id: 'TF-031', provider: 'Tanzania CRDB',           country: 'Tanzania',      type: 'Overdraft TZS',             rate: '12% p.a.',      limit: 180000, advance: '70%',    speed: '2 Wochen',   score: 65, recommended: false },
  { id: 'TF-033', provider: 'Modifi',                  country: 'Germany',       type: 'Buyer Financing',           rate: '1.6%/Mo',       limit: 250000, advance: '90%',    speed: '24h',        score: 89, recommended: false },
];

const SORTED_TF = [...TF_OPTIONS].sort((a, b) => b.score - a.score);

// ── Investor Update data ───────────────────────────────────────────────────────

interface PastUpdate {
  id: string;
  period: string;
  status: 'draft' | 'sent';
  rating?: number;
}

const PAST_UPDATES: PastUpdate[] = [
  { id: 'U-05', period: 'Mai 2026',    status: 'draft' },
  { id: 'U-04', period: 'April 2026',  status: 'sent', rating: 4 },
  { id: 'U-03', period: 'März 2026',   status: 'sent', rating: 5 },
  { id: 'U-02', period: 'Februar 2026',status: 'sent', rating: 4 },
  { id: 'U-01', period: 'Januar 2026', status: 'sent', rating: 3 },
];

interface Investor {
  name: string;
  firm: string;
  stake: number;
  role: string;
}

const INVESTORS: Investor[] = [
  { name: 'Dr. Anja Müller',    firm: 'Impact Ventures GmbH',   stake: 12.5, role: 'Lead Investor' },
  { name: 'Kofi Mensah',        firm: 'AfriRise Capital',        stake: 8.0,  role: 'Strategic' },
  { name: 'Sarah Lindqvist',    firm: 'Nordic Impact Fund',      stake: 6.5,  role: 'Financial' },
  { name: 'Mehmet Yilmaz',      firm: 'Bosphorus Agri VC',       stake: 5.0,  role: 'Advisor' },
  { name: 'Franziska Bauer',    firm: 'Eigenkapital (Gründer)',  stake: 68.0, role: 'Founder' },
];

// ── Main component ─────────────────────────────────────────────────────────────

export const CapitalView = ({ lang: _lang }: CapitalViewProps) => {
  const { data: M } = useData();
  const [tab, setTab] = useState('forecast');
  const [scenario, setScenario] = useState<Scenario>('base');
  const [selectedUpdate, setSelectedUpdate] = useState('U-05');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  // Compute actual revenue & profit from real orders
  const { actualRevK, actualEbitdaK } = useMemo(() => {
    if (!M || M.orders.length === 0) return { actualRevK: 928, actualEbitdaK: 28 };
    const totalRev  = M.orders.reduce((s, o) => s + o.revenue, 0);
    const totalProfit = M.orders.reduce((s, o) => s + o.profit, 0);
    return {
      actualRevK:    Math.max(1, Math.round(totalRev / 1000)),
      actualEbitdaK: Math.round(totalProfit / 1000),
    };
  }, [M]);

  const tabs = [
    { id: 'forecast',    label: 'Business Forecast',      icon: 'chart' },
    { id: 'marketplace', label: 'Trade Finance Marketplace', icon: 'finance' },
    { id: 'investor',    label: 'Investor Updates',        icon: 'mail' },
  ];

  // Inject real actuals into the selected scenario's base year
  const sc = {
    ...SCENARIOS[scenario],
    y2025: { ...SCENARIOS[scenario].y2025, rev: actualRevK, ebitda: actualEbitdaK },
  };

  // P&L rows helper
  const plRows = (yd: YearData) => {
    const rev = yd.rev * 1000;
    const cogs = Math.round(rev * 0.66);
    const gross = rev - cogs;
    const personal = (yd.headcount || 9) * 30000;
    const otherOpex = Math.round(rev * 0.06);
    return { rev, cogs, gross, personal, otherOpex, ebitda: yd.ebitda * 1000, marge: yd.marge || Math.round((yd.ebitda / yd.rev) * 100) };
  };

  const plActual = plRows(sc.y2025);
  const pl26 = plRows(sc.y2026);
  const pl27 = plRows(sc.y2027);
  const pl28 = plRows(sc.y2028);

  const cagr = (((sc.y2028.rev / sc.y2025.rev) ** (1 / 3)) - 1) * 100;

  // Chart
  const pts: [number, number][] = [
    chartPoint(0, sc.y2025.rev),
    chartPoint(1, sc.y2026.rev),
    chartPoint(2, sc.y2027.rev),
    chartPoint(3, sc.y2028.rev),
  ];
  const lineStr = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const fillStr = `100,190 ${lineStr} 900,190`;

  return (
    <div>
      <div className="section-head">
        <h1>Capital Hub</h1>
        <div className="sub">Business Forecast · Trade Finance Marketplace · Investor Updates</div>
      </div>

      {/* Tab bar */}
      <div style={{ padding: '0 16px 4px', display: 'flex', gap: 4, borderBottom: '1px solid var(--border)' }}>
        {tabs.map(tb => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`btn${tab === tb.id ? ' active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <Ic name={tb.icon} size={13} />
            {tb.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '12px 16px 16px' }}>

        {/* ── TAB: Business Forecast ────────────────────────────────────────── */}
        {tab === 'forecast' && (
          <div>
            {/* Scenario selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
              {(Object.keys(SCENARIOS) as Scenario[]).map(s => {
                const sc2 = SCENARIOS[s];
                const isActive = scenario === s;
                return (
                  <div
                    key={s}
                    onClick={() => setScenario(s)}
                    className="card"
                    style={{
                      padding: 14, cursor: 'pointer',
                      border: isActive ? `2px solid ${sc2.color}` : '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{SCENARIO_LABELS[s]}</span>
                      <Badge kind={s === 'aggressive' ? 'purple' : s === 'base' ? 'success' : 'info'}>{s === 'aggressive' ? 'Best Case' : s === 'base' ? 'Base' : 'Worst Case'}</Badge>
                    </div>
                    <div className="mono fw700" style={{ fontSize: 22, color: sc2.color, marginBottom: 4 }}>
                      {fmtCur(sc2.y2028.rev * 1000)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 6 }}>2028 Umsatz</div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>{sc2.description}</div>
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-3)' }}>
                      EBITDA 2028: <span className="mono" style={{ color: sc2.color }}>{fmtCur(sc2.y2028.ebitda * 1000)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SVG Revenue chart */}
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="card-head">
                <Ic name="chart" size={14} />
                <span className="title">Umsatz-Forecast — {SCENARIO_LABELS[scenario]}</span>
                <Badge kind={scenario === 'aggressive' ? 'purple' : scenario === 'base' ? 'success' : 'info'}>{SCENARIO_LABELS[scenario]}</Badge>
              </div>
              <div className="card-body">
                <svg viewBox="0 0 1000 220" width="100%" height={220}>
                  {/* Y-axis labels */}
                  {[1000, 2000, 3000].map(v => {
                    const y = 20 + (1 - v / MAX_REV) * 170;
                    return (
                      <g key={v}>
                        <line x1={80} x2={950} y1={y} y2={y} stroke="rgba(255,255,255,0.05)" />
                        <text x={72} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize={11} fontFamily="var(--font-mono)">{v}k</text>
                      </g>
                    );
                  })}

                  {/* Gradient fill */}
                  <defs>
                    <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={sc.color} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={sc.color} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon points={fillStr} fill="url(#revGrad)" />
                  <polyline points={lineStr} fill="none" stroke={sc.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

                  {/* Dots + labels */}
                  {pts.map(([x, y], i) => {
                    const years = [sc.y2025, sc.y2026, sc.y2027, sc.y2028];
                    const yearLabels = ['Aktuell', '2026F', '2027F', '2028F'];
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r={5} fill={sc.color} />
                        <text x={x} y={y - 12} textAnchor="middle" fill="white" fontSize={12} fontWeight={700} fontFamily="var(--font-mono)">
                          {fmtCur(years[i].rev * 1000)}
                        </text>
                        <text x={x} y={205} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={10} fontFamily="var(--font-mono)">
                          {yearLabels[i]}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* P&L table */}
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="card-head">
                <Ic name="finance" size={14} />
                <span className="title">P&amp;L — {SCENARIO_LABELS[scenario]}-Szenario</span>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Position</th>
                    <th className="num">2025 Ist</th>
                    <th className="num">2026F</th>
                    <th className="num">2027F</th>
                    <th className="num">2028F</th>
                    <th className="num">CAGR</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Umsatz',               vals: [plActual.rev, pl26.rev, pl27.rev, pl28.rev],           bold: true,  color: undefined },
                    { label: 'Wareneinkauf + Logistik', vals: [plActual.cogs, pl26.cogs, pl27.cogs, pl28.cogs],    bold: false, color: '#f87171' },
                    { label: 'Bruttogewinn',          vals: [plActual.gross, pl26.gross, pl27.gross, pl28.gross],   bold: true,  color: '#34d399' },
                    { label: 'Personal',              vals: [plActual.personal, pl26.personal, pl27.personal, pl28.personal], bold: false, color: undefined },
                    { label: 'Sonstige Opex',         vals: [plActual.otherOpex, pl26.otherOpex, pl27.otherOpex, pl28.otherOpex], bold: false, color: undefined },
                    { label: 'EBITDA',                vals: [plActual.ebitda, pl26.ebitda, pl27.ebitda, pl28.ebitda], bold: true, color: sc.color },
                  ].map((row, ri) => (
                    <tr key={ri}>
                      <td className={row.bold ? 'fw600' : ''}>{row.label}</td>
                      {row.vals.map((v, vi) => (
                        <td key={vi} className="num mono" style={{ color: row.color, fontWeight: row.bold ? 600 : undefined }}>
                          {fmtCur(v)}
                        </td>
                      ))}
                      <td className="num mono" style={{ color: 'var(--text-3)', fontSize: 11 }}>
                        {ri === 0 || ri === 2 || ri === 5 ? `+${cagr.toFixed(0)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="fw600">EBITDA-Marge</td>
                    {[plActual, pl26, pl27, pl28].map((p, pi) => (
                      <td key={pi} className="num mono fw600" style={{ color: sc.color }}>{p.marge}%</td>
                    ))}
                    <td className="num mono" style={{ color: 'var(--text-3)', fontSize: 11 }}>+{(pl28.marge - plActual.marge).toFixed(0)}pp</td>
                  </tr>
                  <tr>
                    <td>Mitarbeiter</td>
                    {[sc.y2025, sc.y2026, sc.y2027, sc.y2028].map((y, yi) => (
                      <td key={yi} className="num mono">{y.headcount || '~' + (yi === 2 ? Math.round((sc.y2026.headcount || 10) * 1.3) : Math.round((sc.y2026.headcount || 10) * 1.6))}</td>
                    ))}
                    <td className="num mono" style={{ color: 'var(--text-3)', fontSize: 11 }}>—</td>
                  </tr>
                  <tr>
                    <td>Aktive Märkte</td>
                    <td className="num mono">5</td>
                    <td className="num mono">{sc.markets}</td>
                    <td className="num mono">{sc.markets + 1}</td>
                    <td className="num mono">{sc.markets + 2}</td>
                    <td className="num mono" style={{ color: 'var(--text-3)', fontSize: 11 }}>—</td>
                  </tr>
                  <tr>
                    <td>Produkte</td>
                    <td className="num mono">7</td>
                    <td className="num mono">{sc.products}</td>
                    <td className="num mono">{sc.products + 2}</td>
                    <td className="num mono">{sc.products + 4}</td>
                    <td className="num mono" style={{ color: 'var(--text-3)', fontSize: 11 }}>—</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Sensitivities */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="card">
                <div className="card-head">
                  <Ic name="activity" size={14} />
                  <span className="title">Sensitivitäten</span>
                </div>
                <div className="card-body">
                  {SENSITIVITIES[scenario].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i < SENSITIVITIES[scenario].length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <span style={{ fontSize: 12 }}>{row.factor}</span>
                      <span className="mono fw500" style={{ fontSize: 12, color: row.direction === 'pos' ? '#34d399' : row.direction === 'neg' ? '#f87171' : 'var(--text-2)' }}>
                        {row.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <Ic name="info" size={14} />
                  <span className="title">Annahmen — {SCENARIO_LABELS[scenario]}</span>
                </div>
                <div className="card-body">
                  {ASSUMPTIONS[scenario].map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0', borderBottom: i < ASSUMPTIONS[scenario].length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <span style={{ color: sc.color, marginTop: 1 }}>●</span>
                      <span style={{ fontSize: 12, lineHeight: 1.5 }}>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Trade Finance Marketplace ────────────────────────────────── */}
        {tab === 'marketplace' && (
          <div>
            {/* KPI tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
              {[
                { l: 'Aktive Linien',     v: '3',           c: '#34d399' },
                { l: 'Gesamtlimit',       v: fmtCur(1180000), c: '#60a5fa' },
                { l: 'Nutzung',           v: `${fmtCur(384000)} (32%)`, c: '#fbbf24' },
                { l: 'Ø Zinskosten',      v: '3.8%',        c: '#a78bfa' },
              ].map((kpi, i) => (
                <div key={i} className="card" style={{ padding: 14 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: 4 }}>{kpi.l}</div>
                  <div className="mono fw700" style={{ fontSize: 20, color: kpi.c }}>{kpi.v}</div>
                </div>
              ))}
            </div>

            {/* TF table */}
            <div className="card">
              <div className="card-head">
                <Ic name="finance" size={14} />
                <span className="title">Trade Finance Optionen</span>
                <span className="meta">{TF_OPTIONS.length} Anbieter · sortiert nach Score</span>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Anbieter · Typ</th>
                    <th>Land</th>
                    <th>Rate</th>
                    <th className="num">Linie</th>
                    <th>Vorschuss</th>
                    <th>Speed</th>
                    <th>Score</th>
                    <th>Notiz</th>
                  </tr>
                </thead>
                <tbody>
                  {SORTED_TF.map(tf => (
                    <tr key={tf.id} style={{ background: tf.recommended ? 'rgba(52,211,153,0.05)' : undefined }}>
                      <td><span className="id mono" style={{ fontSize: 10 }}>{tf.id}</span></td>
                      <td>
                        <div className="fw500" style={{ fontSize: 12 }}>{tf.provider}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{tf.type}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{tf.country}</td>
                      <td className="mono" style={{ fontSize: 12 }}>{tf.rate}</td>
                      <td className="num mono fw500">{fmtCur(tf.limit)}</td>
                      <td className="mono" style={{ fontSize: 12 }}>{tf.advance}</td>
                      <td style={{ fontSize: 12 }}>{tf.speed}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div className="progress" style={{ width: 50 }}>
                            <div style={{ width: tf.score + '%', background: tf.score >= 85 ? '#34d399' : tf.score >= 70 ? '#fbbf24' : '#f87171' }} />
                          </div>
                          <span className="mono fw600" style={{ fontSize: 12 }}>{tf.score}</span>
                        </div>
                      </td>
                      <td>
                        {tf.recommended && <Badge kind="success">EMPFOHLEN</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB: Investor Updates ─────────────────────────────────────────── */}
        {tab === 'investor' && (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 12 }}>
            {/* Left sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Past updates */}
              <div className="card">
                <div className="card-head">
                  <Ic name="history" size={14} />
                  <span className="title">Updates</span>
                </div>
                <div>
                  {PAST_UPDATES.map(u => (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUpdate(u.id)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border)',
                        background: selectedUpdate === u.id ? 'rgba(167,139,250,0.08)' : undefined,
                        borderLeft: selectedUpdate === u.id ? '3px solid #a78bfa' : '3px solid transparent',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span className="fw500" style={{ fontSize: 13 }}>{u.period}</span>
                        <Badge kind={u.status === 'draft' ? 'warning' : 'success'}>{u.status === 'draft' ? 'Entwurf' : 'Gesendet'}</Badge>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>{u.id}</span>
                        {u.rating != null && <Stars value={u.rating} max={5} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Investor list */}
              <div className="card">
                <div className="card-head">
                  <Ic name="buyer" size={14} />
                  <span className="title">Investor-Verteiler</span>
                </div>
                <div>
                  {INVESTORS.map((inv, i) => (
                    <div key={i} style={{ padding: '9px 14px', borderBottom: i < INVESTORS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ fontWeight: 500, fontSize: 12 }}>{inv.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{inv.firm}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <Badge kind="neutral">{inv.role}</Badge>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-2)' }}>{inv.stake}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Current update */}
            <div className="card">
              <div className="card-head">
                <Ic name="mail" size={14} />
                <span className="title">Investor Update Mai 2026</span>
                <Badge kind={isGenerated ? 'success' : 'warning'}>{isGenerated ? 'Bereit' : 'Entwurf'}</Badge>
                <div style={{ marginLeft: 'auto' }}>
                  <button className="btn" disabled={isGenerating} onClick={() => {
                    if (isGenerating) return;
                    setIsGenerating(true);
                    setTimeout(() => { setIsGenerating(false); setIsGenerated(true); }, 1800);
                  }}>
                    <Ic name="sparkle" size={13} color="#a78bfa" />
                    {isGenerating ? 'Generiert…' : isGenerated ? 'Aktualisieren' : 'Generieren'}
                  </button>
                </div>
              </div>
              <div className="card-body" style={{ maxHeight: 600, overflowY: 'auto' }}>
                {/* KPI Summary */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#a78bfa' }}>📊 KPI-Zusammenfassung Mai 2026</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {[
                      { l: 'Umsatz YTD', v: fmtCur(621000), delta: '+12% vs Plan' },
                      { l: 'Pipeline', v: fmtCur(1.28e6), delta: '+8 neue Kontakte' },
                      { l: 'EBITDA', v: fmtCur(48000), delta: '7.7% Marge' },
                    ].map((kpi, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 2 }}>{kpi.l}</div>
                        <div className="mono fw600" style={{ fontSize: 16 }}>{kpi.v}</div>
                        <div style={{ fontSize: 11, color: '#34d399', marginTop: 2 }}>{kpi.delta}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Highlights */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#34d399' }}>✅ Highlights</div>
                  {[
                    'EUDR-DDS ist live — alle Lieferanten vollständig trackt. Wir sind einer der ersten kleinen Exporteure mit vollständiger Implementierung.',
                    'Erstes Gespräch mit zwei Importeuren in Frankreich sehr positiv — LOI für 180k € Pilotbestellung im Gespräch.',
                    'BRC-Audit-Vorbereitung auf Kurs (62%): Mtwara Werk bestätigt Termin 15. September 2026.',
                  ].map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <span style={{ color: '#34d399', flexShrink: 0 }}>•</span>
                      <span style={{ fontSize: 12, lineHeight: 1.6 }}>{h}</span>
                    </div>
                  ))}
                </div>

                {/* Challenges */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#fbbf24' }}>⚠️ Herausforderungen</div>
                  {[
                    'Macadamia Lieferverzögerung aus Kenya (+3 Wochen) aufgrund von Niederschlagsausfall — Auswirkung auf Q3 Umsatz ca. 15k €.',
                    'CBAM-Anforderungen ab 2026 erfordern Carbon-Footprint-Daten von Lieferanten — 60% noch ausstehend.',
                  ].map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <span style={{ color: '#fbbf24', flexShrink: 0 }}>•</span>
                      <span style={{ fontSize: 12, lineHeight: 1.6 }}>{c}</span>
                    </div>
                  ))}
                </div>

                {/* Asks */}
                <div style={{ padding: 14, background: 'rgba(167,139,250,0.08)', borderRadius: 10, border: '1px solid rgba(167,139,250,0.2)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#a78bfa' }}>🙋 Asks</div>
                  {[
                    'Intro zu skandinavischen Food-Import-Netzwerken (Fokus SE/DK) für Q3 Markteintritt.',
                  ].map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <span style={{ color: '#a78bfa', flexShrink: 0 }}>→</span>
                      <span style={{ fontSize: 12, lineHeight: 1.6 }}>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

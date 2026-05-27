'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Lang } from '@/lib/i18n';
import { fmtCur } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import { useData } from '@/lib/data-context';

interface CapitalViewProps { lang: Lang }

// ── Types ─────────────────────────────────────────────────────────────────────

type Scenario = 'conservative' | 'base' | 'aggressive';

interface YearData { rev: number; ebitda: number; headcount?: number; }

interface ScenarioData {
  description: string; color: string;
  y2026: YearData; y2027: YearData; y2028: YearData;
  markets: number; products: number;
}

interface TFEntry {
  id: string; provider: string; country: string; type: string;
  rate: string; limit: number; advance: string; speed: string;
  score: number; recommended: boolean;
}

interface Investor {
  id: string; name: string; firm: string; stake: number; role: string;
}

// ── Defaults (empty) ──────────────────────────────────────────────────────────

const EMPTY_SCENARIO = (): ScenarioData => ({
  description: '', color: '#60a5fa',
  y2026: { rev: 0, ebitda: 0, headcount: 0 },
  y2027: { rev: 0, ebitda: 0 },
  y2028: { rev: 0, ebitda: 0 },
  markets: 0, products: 0,
});

const DEFAULT_SCENARIOS: Record<Scenario, ScenarioData> = {
  conservative: { ...EMPTY_SCENARIO(), color: '#60a5fa' },
  base:         { ...EMPTY_SCENARIO(), color: '#34d399' },
  aggressive:   { ...EMPTY_SCENARIO(), color: '#a78bfa' },
};

const SCENARIO_LABELS: Record<Scenario, string> = {
  conservative: 'Konservativ',
  base:         'Basis',
  aggressive:   'Aggressiv',
};

const LS_KEY_SCENARIOS  = 'capital_scenarios_v1';
const LS_KEY_TF         = 'capital_tf_v1';
const LS_KEY_INVESTORS  = 'capital_investors_v1';

// ── localStorage helpers ──────────────────────────────────────────────────────

function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; }
  catch { return fallback; }
}

function lsSet(key: string, val: unknown) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Chart helpers ─────────────────────────────────────────────────────────────

function chartPoint(idx: number, rev: number, maxRev: number): [number, number] {
  const xs = [100, 300, 600, 900];
  return [xs[idx], 20 + (1 - (maxRev > 0 ? rev / maxRev : 0)) * 170];
}

// ── Input style ───────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

// ── Scenario Edit Modal ───────────────────────────────────────────────────────

interface ScenarioModalProps {
  scenario: Scenario;
  data: ScenarioData;
  onSave: (d: ScenarioData) => void;
  onClose: () => void;
}

const ScenarioModal = ({ scenario, data, onSave, onClose }: ScenarioModalProps) => {
  const [f, setF] = useState<ScenarioData>(data);
  const set = (path: string, val: unknown) => {
    setF(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let cur: Record<string, unknown> = next;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]] as Record<string, unknown>;
      cur[keys[keys.length - 1]] = val;
      return next;
    });
  };
  const num = (path: string, e: React.ChangeEvent<HTMLInputElement>) =>
    set(path, parseFloat(e.target.value) || 0);

  const yearFields = (key: 'y2026' | 'y2027' | 'y2028', label: string) => (
    <div key={key} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 12, border: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: f.color, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>Umsatz (€)</div>
          <input type="number" min={0} step={1000} value={f[key].rev * 1000 || ''} onChange={e => set(`${key}.rev`, (parseFloat(e.target.value) || 0) / 1000)} style={inp} placeholder="0" />
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>EBITDA (€)</div>
          <input type="number" min={0} step={1000} value={f[key].ebitda * 1000 || ''} onChange={e => set(`${key}.ebitda`, (parseFloat(e.target.value) || 0) / 1000)} style={inp} placeholder="0" />
        </div>
        {key === 'y2026' && (
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>Mitarbeiter</div>
            <input type="number" min={0} step={1} value={f.y2026.headcount || ''} onChange={e => num('y2026.headcount', e)} style={inp} placeholder="0" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '5vh' }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 520, padding: 0, overflow: 'hidden', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <Ic name="chart" size={14} />
          <span style={{ fontWeight: 700 }}>Szenario: {SCENARIO_LABELS[scenario]}</span>
          <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={onClose}><Ic name="x" size={13} /></button>
        </div>
        <div className="modal-body" style={{ overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Beschreibung / Annahme</div>
              <input type="text" value={f.description} onChange={e => set('description', e.target.value)} style={inp} placeholder="z.B. France + Schweden Durchbruch" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>Aktive Märkte 2026</div>
                <input type="number" min={0} value={f.markets || ''} onChange={e => num('markets', e)} style={inp} placeholder="0" />
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>Produkte 2026</div>
                <input type="number" min={0} value={f.products || ''} onChange={e => num('products', e)} style={inp} placeholder="0" />
              </div>
            </div>
            {yearFields('y2026', '2026 Forecast')}
            {yearFields('y2027', '2027 Forecast')}
            {yearFields('y2028', '2028 Forecast')}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose}>Abbrechen</button>
          <div style={{ flex: 1 }} />
          <button className="btn primary" onClick={() => { onSave(f); onClose(); }}>
            <Ic name="check" size={13} /> Speichern
          </button>
        </div>
      </div>
    </div>
  );
};

// ── TF Entry Modal ────────────────────────────────────────────────────────────

interface TFModalProps { entry?: TFEntry; onSave: (e: TFEntry) => void; onClose: () => void; }

const TFModal = ({ entry, onSave, onClose }: TFModalProps) => {
  const [f, setF] = useState<TFEntry>(entry ?? { id: `TF-${Date.now().toString().slice(-4)}`, provider: '', country: '', type: '', rate: '', limit: 0, advance: '', speed: '', score: 50, recommended: false });
  const s = (k: keyof TFEntry, v: unknown) => setF(p => ({ ...p, [k]: v }));
  return (
    <div className="overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '6vh' }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 460, padding: 0, overflow: 'hidden' }}>
        <div className="modal-head">
          <Ic name="finance" size={14} />
          <span style={{ fontWeight: 700 }}>{entry ? 'Anbieter bearbeiten' : 'Anbieter hinzufügen'}</span>
          <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={onClose}><Ic name="x" size={13} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {([['provider','Anbieter','text'],['country','Land','text'],['type','Typ','text'],['rate','Rate (z.B. 2%/Mo)','text'],['advance','Vorschuss (z.B. 80%)','text'],['speed','Geschwindigkeit','text']] as [keyof TFEntry, string, string][]).map(([k,l]) => (
              <div key={k}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{l}</div>
                <input type="text" value={String(f[k] ?? '')} onChange={e => s(k, e.target.value)} style={inp} />
              </div>
            ))}
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Kreditlinie (€)</div>
              <input type="number" min={0} step={1000} value={f.limit || ''} onChange={e => s('limit', parseFloat(e.target.value) || 0)} style={inp} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Score (0-100)</div>
              <input type="number" min={0} max={100} value={f.score} onChange={e => s('score', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))} style={inp} />
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <span className={`chip${f.recommended ? ' on' : ''}`} onClick={() => s('recommended', !f.recommended)} style={{ cursor: 'pointer' }}>Empfohlen</span>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose}>Abbrechen</button>
          <div style={{ flex: 1 }} />
          <button className="btn primary" disabled={!f.provider.trim()} onClick={() => { onSave(f); onClose(); }}>
            <Ic name="check" size={13} /> Speichern
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Investor Modal ────────────────────────────────────────────────────────────

interface InvestorModalProps { investor?: Investor; onSave: (i: Investor) => void; onClose: () => void; }

const InvestorModal = ({ investor, onSave, onClose }: InvestorModalProps) => {
  const [f, setF] = useState<Investor>(investor ?? { id: `INV-${Date.now().toString().slice(-4)}`, name: '', firm: '', stake: 0, role: '' });
  const s = (k: keyof Investor, v: unknown) => setF(p => ({ ...p, [k]: v }));
  return (
    <div className="overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '8vh' }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 400, padding: 0, overflow: 'hidden' }}>
        <div className="modal-head">
          <Ic name="buyer" size={14} />
          <span style={{ fontWeight: 700 }}>{investor ? 'Investor bearbeiten' : 'Investor hinzufügen'}</span>
          <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={onClose}><Ic name="x" size={13} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {([['name','Name'],['firm','Firma / Fonds'],['role','Rolle (z.B. Lead Investor)']] as [keyof Investor, string][]).map(([k, l]) => (
              <div key={k}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{l}</div>
                <input type="text" value={String(f[k] ?? '')} onChange={e => s(k, e.target.value)} style={inp} />
              </div>
            ))}
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Anteil (%)</div>
              <input type="number" min={0} max={100} step={0.1} value={f.stake || ''} onChange={e => s('stake', parseFloat(e.target.value) || 0)} style={inp} />
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose}>Abbrechen</button>
          <div style={{ flex: 1 }} />
          <button className="btn primary" disabled={!f.name.trim()} onClick={() => { onSave(f); onClose(); }}>
            <Ic name="check" size={13} /> Speichern
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

export const CapitalView = ({ lang: _lang }: CapitalViewProps) => {
  const { data: M } = useData();
  const [tab, setTab] = useState('forecast');
  const [scenario, setScenario] = useState<Scenario>('base');
  const [editScenario, setEditScenario] = useState<Scenario | null>(null);
  const [scenarios, setScenarios] = useState<Record<Scenario, ScenarioData>>(DEFAULT_SCENARIOS);

  const [tfEntries, setTfEntries] = useState<TFEntry[]>([]);
  const [tfModal, setTfModal] = useState<TFEntry | null | 'new'>(null);
  const [deleteTfId, setDeleteTfId] = useState<string | null>(null);

  const [investors, setInvestors] = useState<Investor[]>([]);
  const [invModal, setInvModal] = useState<Investor | null | 'new'>(null);
  const [deleteInvId, setDeleteInvId] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setScenarios(lsGet(LS_KEY_SCENARIOS, DEFAULT_SCENARIOS));
    setTfEntries(lsGet(LS_KEY_TF, []));
    setInvestors(lsGet(LS_KEY_INVESTORS, []));
  }, []);

  const saveScenario = (s: Scenario, d: ScenarioData) => {
    const next = { ...scenarios, [s]: d };
    setScenarios(next);
    lsSet(LS_KEY_SCENARIOS, next);
  };

  const saveTf = (entry: TFEntry) => {
    const next = tfEntries.find(e => e.id === entry.id)
      ? tfEntries.map(e => e.id === entry.id ? entry : e)
      : [...tfEntries, entry];
    setTfEntries(next); lsSet(LS_KEY_TF, next);
  };

  const deleteTf = (id: string) => {
    const next = tfEntries.filter(e => e.id !== id);
    setTfEntries(next); lsSet(LS_KEY_TF, next);
  };

  const saveInvestor = (inv: Investor) => {
    const next = investors.find(i => i.id === inv.id)
      ? investors.map(i => i.id === inv.id ? inv : i)
      : [...investors, inv];
    setInvestors(next); lsSet(LS_KEY_INVESTORS, next);
  };

  const deleteInvestor = (id: string) => {
    const next = investors.filter(i => i.id !== id);
    setInvestors(next); lsSet(LS_KEY_INVESTORS, next);
  };

  // Real actuals from orders
  const { actualRevK, actualEbitdaK, actualHeadcount } = useMemo(() => {
    if (!M || M.orders.length === 0) return { actualRevK: 0, actualEbitdaK: 0, actualHeadcount: 0 };
    return {
      actualRevK:     Math.round(M.orders.reduce((s, o) => s + o.revenue, 0) / 1000),
      actualEbitdaK:  Math.round(M.orders.reduce((s, o) => s + o.profit, 0) / 1000),
      actualHeadcount: 0,
    };
  }, [M]);

  const tabs = [
    { id: 'forecast',    label: 'Business Forecast',        icon: 'chart' },
    { id: 'marketplace', label: 'Trade Finance Marketplace', icon: 'finance' },
    { id: 'investor',    label: 'Investor Updates',          icon: 'mail' },
  ];

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const sc   = scenarios[scenario];
  const hasData = (s: Scenario) => scenarios[s].y2028.rev > 0;

  // P&L helper
  const pl = (rev: number, ebitda: number, headcount = 0) => {
    const r = rev * 1000, e = ebitda * 1000;
    return { rev: r, cogs: Math.round(r * 0.66), gross: Math.round(r * 0.34), personal: headcount * 30000, opex: Math.round(r * 0.06), ebitda: e };
  };
  const plAct = pl(actualRevK, actualEbitdaK, actualHeadcount);
  const pl26  = pl(sc.y2026.rev, sc.y2026.ebitda, sc.y2026.headcount);
  const pl27  = pl(sc.y2027.rev, sc.y2027.ebitda);
  const pl28  = pl(sc.y2028.rev, sc.y2028.ebitda);

  const maxRev = Math.max(actualRevK, sc.y2026.rev, sc.y2027.rev, sc.y2028.rev, 100);
  const pts: [number, number][] = [
    chartPoint(0, actualRevK, maxRev),
    chartPoint(1, sc.y2026.rev, maxRev),
    chartPoint(2, sc.y2027.rev, maxRev),
    chartPoint(3, sc.y2028.rev, maxRev),
  ];
  const lineStr = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const fillStr = `100,190 ${lineStr} 900,190`;

  const sortedTf = [...tfEntries].sort((a, b) => b.score - a.score);
  const tfLimitTotal = tfEntries.filter(e => e.recommended).reduce((s, e) => s + e.limit, 0);

  // Investor Update KPIs from real data
  const ytdRev    = M.orders.reduce((s, o) => s + o.revenue, 0);
  const ytdProfit = M.orders.reduce((s, o) => s + o.profit, 0);
  const pipeline  = M.deals.reduce((s, d) => s + (d.value ?? 0), 0);
  const ytdMarge  = ytdRev > 0 ? ((ytdProfit / ytdRev) * 100).toFixed(1) : '—';

  return (
    <div>
      <div className="section-head">
        <h1>Capital Hub</h1>
        <div className="sub">Business Forecast · Trade Finance Marketplace · Investor Updates</div>
      </div>

      {/* Tab bar */}
      <div style={{ padding: '0 16px 4px', display: 'flex', gap: 4, borderBottom: '1px solid var(--border)' }}>
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} className={`btn${tab === tb.id ? ' active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Ic name={tb.icon} size={13} /> {tb.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '12px 16px 16px' }}>

        {/* ── TAB: Business Forecast ──────────────────────────────────────── */}
        {tab === 'forecast' && (
          <div>
            {/* Scenario cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
              {(Object.keys(scenarios) as Scenario[]).map(s => {
                const sd = scenarios[s];
                const isActive = scenario === s;
                const filled = hasData(s);
                return (
                  <div key={s} onClick={() => setScenario(s)} className="card" style={{ padding: 14, cursor: 'pointer', border: isActive ? `2px solid ${sd.color}` : '1px solid var(--border)', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{SCENARIO_LABELS[s]}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Badge kind={s === 'aggressive' ? 'purple' : s === 'base' ? 'success' : 'info'}>{s === 'aggressive' ? 'Best Case' : s === 'base' ? 'Base' : 'Worst Case'}</Badge>
                        <button className="btn sm ghost" style={{ padding: '2px 5px' }} onClick={e => { e.stopPropagation(); setEditScenario(s); }} title="Szenario bearbeiten"><Ic name="edit" size={12} /></button>
                      </div>
                    </div>
                    {filled ? (
                      <>
                        <div className="mono fw700" style={{ fontSize: 22, color: sd.color, marginBottom: 2 }}>{fmtCur(sd.y2028.rev * 1000)}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 6 }}>2028 Umsatz-Ziel</div>
                        <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>{sd.description || <span className="tx3">Keine Beschreibung</span>}</div>
                        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-3)' }}>
                          EBITDA 2028: <span className="mono" style={{ color: sd.color }}>{fmtCur(sd.y2028.ebitda * 1000)}</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
                        <Ic name="chart" size={20} color="var(--text-3)" />
                        <div style={{ marginTop: 6 }}>Noch keine Planung</div>
                        <button className="btn sm" style={{ marginTop: 8 }} onClick={e => { e.stopPropagation(); setEditScenario(s); }}>
                          <Ic name="plus" size={11} /> Eingeben
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Chart */}
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="card-head">
                <Ic name="chart" size={14} />
                <span className="title">Umsatz-Forecast — {SCENARIO_LABELS[scenario]}</span>
                <Badge kind={scenario === 'aggressive' ? 'purple' : scenario === 'base' ? 'success' : 'info'}>{SCENARIO_LABELS[scenario]}</Badge>
                <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={() => setEditScenario(scenario)}>
                  <Ic name="edit" size={12} /> Bearbeiten
                </button>
              </div>
              <div className="card-body">
                {!hasData(scenario) ? (
                  <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-3)' }}>
                    <Ic name="chart" size={28} color="var(--text-3)" />
                    <div style={{ marginTop: 8, fontSize: 12 }}>Forecast-Daten noch nicht eingegeben</div>
                    <button className="btn" style={{ marginTop: 10 }} onClick={() => setEditScenario(scenario)}>
                      <Ic name="plus" size={12} /> Szenario befüllen
                    </button>
                  </div>
                ) : (
                  <svg viewBox="0 0 1000 220" width="100%" height={220}>
                    {[Math.round(maxRev * 0.33), Math.round(maxRev * 0.66), maxRev].map((v, vi) => {
                      const y = 20 + (1 - v / maxRev) * 170;
                      return (
                        <g key={vi}>
                          <line x1={80} x2={950} y1={y} y2={y} stroke="rgba(255,255,255,0.05)" />
                          <text x={72} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize={10} fontFamily="var(--font-mono)">{v}k</text>
                        </g>
                      );
                    })}
                    <defs>
                      <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={sc.color} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={sc.color} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon points={fillStr} fill="url(#revGrad)" />
                    <polyline points={lineStr} fill="none" stroke={sc.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    {pts.map(([x, y], i) => {
                      const years = [{ rev: actualRevK }, sc.y2026, sc.y2027, sc.y2028];
                      const labels = ['Aktuell', '2026F', '2027F', '2028F'];
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r={5} fill={sc.color} />
                          <text x={x} y={y - 12} textAnchor="middle" fill="white" fontSize={12} fontWeight={700} fontFamily="var(--font-mono)">
                            {fmtCur(years[i].rev * 1000)}
                          </text>
                          <text x={x} y={205} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={10} fontFamily="var(--font-mono)">{labels[i]}</text>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>
            </div>

            {/* P&L table */}
            {hasData(scenario) && (
              <div className="card">
                <div className="card-head">
                  <Ic name="finance" size={14} />
                  <span className="title">P&amp;L — {SCENARIO_LABELS[scenario]}-Szenario</span>
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Position</th><th className="num">2025 Ist</th><th className="num">2026F</th><th className="num">2027F</th><th className="num">2028F</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { l: 'Umsatz',             vals: [plAct.rev, pl26.rev, pl27.rev, pl28.rev], bold: true },
                      { l: 'Wareneinkauf + Log.', vals: [plAct.cogs, pl26.cogs, pl27.cogs, pl28.cogs], color: '#f87171' },
                      { l: 'Bruttogewinn',        vals: [plAct.gross, pl26.gross, pl27.gross, pl28.gross], bold: true, color: '#34d399' },
                      { l: 'EBITDA',              vals: [plAct.ebitda, pl26.ebitda, pl27.ebitda, pl28.ebitda], bold: true, color: sc.color },
                    ].map((row, ri) => (
                      <tr key={ri}>
                        <td className={row.bold ? 'fw600' : ''}>{row.l}</td>
                        {row.vals.map((v, vi) => (
                          <td key={vi} className="num mono" style={{ color: row.color, fontWeight: row.bold ? 600 : undefined }}>{fmtCur(v)}</td>
                        ))}
                      </tr>
                    ))}
                    {sc.y2026.headcount ? (
                      <tr>
                        <td>Mitarbeiter</td>
                        <td className="num mono">{actualHeadcount || '—'}</td>
                        <td className="num mono">{sc.y2026.headcount}</td>
                        <td className="num mono">—</td>
                        <td className="num mono">—</td>
                      </tr>
                    ) : null}
                    {sc.markets > 0 && (
                      <tr>
                        <td>Aktive Märkte</td>
                        <td className="num mono">—</td>
                        <td className="num mono">{sc.markets}</td>
                        <td className="num mono">{sc.markets + 1}</td>
                        <td className="num mono">{sc.markets + 2}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Trade Finance Marketplace ─────────────────────────────── */}
        {tab === 'marketplace' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
              {[
                { l: 'Anbieter gesamt',   v: tfEntries.length === 0 ? '—' : String(tfEntries.length),                                     c: 'var(--text-2)' },
                { l: 'Empfohlene Linien', v: tfEntries.filter(e => e.recommended).length === 0 ? '—' : String(tfEntries.filter(e => e.recommended).length), c: '#34d399' },
                { l: 'Gesamtlimit',       v: tfLimitTotal > 0 ? fmtCur(tfLimitTotal) : '—',                                               c: '#60a5fa' },
                { l: 'Ø Score',           v: tfEntries.length > 0 ? (tfEntries.reduce((s, e) => s + e.score, 0) / tfEntries.length).toFixed(0) : '—', c: '#fbbf24' },
              ].map((k, i) => (
                <div key={i} className="card" style={{ padding: 14 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4 }}>{k.l}</div>
                  <div className="mono fw700" style={{ fontSize: 20, color: k.c }}>{k.v}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-head">
                <Ic name="finance" size={14} />
                <span className="title">Trade Finance Optionen</span>
                <span className="meta">{tfEntries.length} Anbieter</span>
                <button className="btn primary sm" style={{ marginLeft: 'auto' }} onClick={() => setTfModal('new')}>
                  <Ic name="plus" size={12} /> Anbieter hinzufügen
                </button>
              </div>
              {tfEntries.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <Ic name="finance" size={32} color="var(--text-3)" />
                  <div className="tx3" style={{ marginTop: 10, fontSize: 12 }}>Noch keine Trade Finance Anbieter eingetragen</div>
                  <button className="btn" style={{ marginTop: 12 }} onClick={() => setTfModal('new')}>
                    <Ic name="plus" size={12} /> Ersten Anbieter hinzufügen
                  </button>
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr><th>Anbieter · Typ</th><th>Land</th><th>Rate</th><th className="num">Linie</th><th>Vorschuss</th><th>Speed</th><th>Score</th><th></th></tr>
                  </thead>
                  <tbody>
                    {sortedTf.map(tf => (
                      <tr key={tf.id} style={{ background: tf.recommended ? 'rgba(52,211,153,0.05)' : undefined }}>
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
                          {tf.recommended && <Badge kind="success">Empfohlen</Badge>}
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn sm ghost" onClick={() => setTfModal(tf)}><Ic name="edit" size={12} /></button>
                            {deleteTfId === tf.id ? (
                              <><button className="btn sm ghost" style={{ color: '#f87171' }} onClick={() => { deleteTf(tf.id); setDeleteTfId(null); }}>Ja</button>
                              <button className="btn sm ghost" onClick={() => setDeleteTfId(null)}>Nein</button></>
                            ) : (
                              <button className="btn sm ghost" style={{ color: '#f87171' }} onClick={() => setDeleteTfId(tf.id)}><Ic name="trash" size={12} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Investor Updates ───────────────────────────────────────── */}
        {tab === 'investor' && (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 12 }}>
            {/* Investor list */}
            <div className="card" style={{ alignSelf: 'start' }}>
              <div className="card-head">
                <Ic name="buyer" size={14} />
                <span className="title">Investor-Verteiler</span>
                <span className="meta">{investors.length}</span>
                <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={() => setInvModal('new')}>
                  <Ic name="plus" size={12} />
                </button>
              </div>
              {investors.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <Ic name="buyer" size={24} color="var(--text-3)" />
                  <div className="tx3" style={{ fontSize: 12, marginTop: 8 }}>Noch keine Investoren eingetragen</div>
                  <button className="btn sm" style={{ marginTop: 10 }} onClick={() => setInvModal('new')}>
                    <Ic name="plus" size={11} /> Hinzufügen
                  </button>
                </div>
              ) : (
                <div>
                  {investors.map((inv, i) => (
                    <div key={inv.id} style={{ padding: '9px 14px', borderBottom: i < investors.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 12 }}>{inv.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{inv.firm}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                          <Badge kind="neutral">{inv.role}</Badge>
                          <span className="mono" style={{ fontSize: 11 }}>{inv.stake}%</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <button className="btn sm ghost" onClick={() => setInvModal(inv)}><Ic name="edit" size={11} /></button>
                        {deleteInvId === inv.id ? (
                          <>
                            <button className="btn sm ghost" style={{ color: '#f87171', fontSize: 10 }} onClick={() => { deleteInvestor(inv.id); setDeleteInvId(null); }}>Ja</button>
                            <button className="btn sm ghost" style={{ fontSize: 10 }} onClick={() => setDeleteInvId(null)}>Nein</button>
                          </>
                        ) : (
                          <button className="btn sm ghost" onClick={() => setDeleteInvId(inv.id)}><Ic name="trash" size={11} /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Update preview with real data */}
            <div className="card">
              <div className="card-head">
                <Ic name="mail" size={14} />
                <span className="title">Investor Update</span>
                <span className="meta">Basierend auf Echtdaten</span>
              </div>
              <div className="card-body">
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#a78bfa' }}>KPI-Zusammenfassung</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {[
                      { l: 'Umsatz YTD',    v: fmtCur(ytdRev),    sub: `${M.orders.length} Aufträge` },
                      { l: 'Pipeline',      v: fmtCur(pipeline),  sub: `${M.deals.length} aktive Deals` },
                      { l: 'EBITDA YTD',    v: fmtCur(ytdProfit), sub: `${ytdMarge}% Marge` },
                    ].map((k, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 2 }}>{k.l}</div>
                        <div className="mono fw600" style={{ fontSize: 16 }}>{k.v}</div>
                        <div style={{ fontSize: 11, color: '#34d399', marginTop: 2 }}>{k.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                  <Ic name="sparkle" size={20} color="#a78bfa" />
                  <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 8, marginBottom: 12 }}>
                    Highlights, Herausforderungen und Asks hier eintragen oder per KI generieren.
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button className="btn">
                      <Ic name="edit" size={12} /> Manuell bearbeiten
                    </button>
                    <button className="btn">
                      <Ic name="sparkle" size={12} color="#a78bfa" /> KI-Entwurf
                    </button>
                    <button className="btn primary" disabled={investors.length === 0} title={investors.length === 0 ? 'Zuerst Investoren hinzufügen' : ''}>
                      <Ic name="mail" size={12} /> Senden {investors.length > 0 ? `(${investors.length})` : ''}
                    </button>
                  </div>
                  {investors.length === 0 && (
                    <div className="tx3" style={{ fontSize: 11, marginTop: 8 }}>Füge zuerst Investoren zum Verteiler hinzu</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {editScenario && (
        <ScenarioModal scenario={editScenario} data={scenarios[editScenario]} onSave={d => saveScenario(editScenario, d)} onClose={() => setEditScenario(null)} />
      )}
      {tfModal && (
        <TFModal entry={tfModal === 'new' ? undefined : tfModal} onSave={saveTf} onClose={() => setTfModal(null)} />
      )}
      {invModal && (
        <InvestorModal investor={invModal === 'new' ? undefined : invModal} onSave={saveInvestor} onClose={() => setInvModal(null)} />
      )}
    </div>
  );
};

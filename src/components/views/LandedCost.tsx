'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useData } from '@/lib/data-context';
import { Ic } from '@/components/ui/icons';
import { t } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';

interface LandedCostProps { lang: Lang; }

interface CalcState {
  product: string;
  origin: string;
  destination: string;
  qty: number;
  currency: string;
  exchangeRate: number;
  purchasePrice: number;
  qualityCheck: number;
  inlandTransport: number;
  exportFees: number;
  seaFreight: number;
  portFeesDep: number;
  insurancePct: number;
  freightExtras: number;
  hsCode: string;
  dutyRate: number;
  vatImport: number;
  arrivalPort: number;
  customsAgent: number;
  arrivalInspection: number;
  financeDays: number;
  financeRate: number;
  handling: number;
  overhead: number;
  other: number;
  targetMargin: number;
  minMargin: number;
}

interface SavedCalc {
  id: string;
  name: string;
  savedAt: string;
  state: CalcState;
  totalCost: number;
  targetPrice: number;
}

const DEFAULT: CalcState = {
  product: '', origin: 'Äthiopien', destination: 'Deutschland', qty: 18000,
  currency: 'USD', exchangeRate: 0.92,
  purchasePrice: 3.20, qualityCheck: 0.015, inlandTransport: 0.08, exportFees: 0.04,
  seaFreight: 0.18, portFeesDep: 0.02, insurancePct: 0.5, freightExtras: 0.02,
  hsCode: '09011100', dutyRate: 0, vatImport: 0,
  arrivalPort: 0.03, customsAgent: 0.012, arrivalInspection: 0.008,
  financeDays: 75, financeRate: 6.5,
  handling: 0.025, overhead: 0, other: 0,
  targetMargin: 10, minMargin: 5,
};

const n2 = (v: number) => v.toFixed(2);
const n0 = (v: number) => Math.round(v).toLocaleString('de-DE');
const pct = (part: number, total: number) => total > 0 ? ((part / total) * 100).toFixed(1) : '0.0';

interface ComputeRow {
  label: string;
  value: number;
  highlight?: boolean;
}

interface ComputeResult {
  insuranceCost: number;
  dutyCost: number;
  vatCost: number;
  financeCost: number;
  totalCost: number;
  targetPrice: number;
  minPrice: number;
  grossProfit: number;
  totalBuy: number;
  totalSell: number;
  rows: ComputeRow[];
  totalCostForPct: number;
}

function compute(s: CalcState): ComputeResult {
  // Insurance based on FOB value (per kg)
  const insuranceCost = (s.purchasePrice * s.insurancePct) / 100;
  // Duty based on FOB + freight (CIF basis simplified)
  const cifCost = s.purchasePrice + s.seaFreight + insuranceCost;
  const dutyCost = (cifCost * s.dutyRate) / 100;
  const vatCost = (cifCost * s.vatImport) / 100;

  // Pre-financing costs
  const preFin =
    s.purchasePrice + s.qualityCheck + s.inlandTransport + s.exportFees +
    s.seaFreight + s.portFeesDep + insuranceCost + s.freightExtras +
    dutyCost + vatCost + s.arrivalPort + s.customsAgent + s.arrivalInspection +
    s.handling + s.overhead + s.other;

  // Financing cost on pre-financing total
  const financeCost = preFin * (s.financeRate / 100) * (s.financeDays / 365);
  const totalCost = preFin + financeCost;
  const targetPrice = totalCost * (1 + s.targetMargin / 100);
  const minPrice = totalCost * (1 + s.minMargin / 100);
  const grossProfit = (targetPrice - totalCost) * s.qty;

  return {
    insuranceCost, dutyCost, vatCost, financeCost,
    totalCost, targetPrice, minPrice, grossProfit,
    totalBuy: s.purchasePrice * s.qty,
    totalSell: targetPrice * s.qty,
    rows: [
      { label: 'Einkaufspreis (FOB)', value: s.purchasePrice },
      { label: 'Qualitätsprüfung', value: s.qualityCheck },
      { label: 'Inland-Transport Ursprung', value: s.inlandTransport },
      { label: 'Exportgebühren', value: s.exportFees },
      { label: 'Seefracht', value: s.seaFreight },
      { label: 'Hafengebühren Abgang', value: s.portFeesDep },
      { label: 'Versicherung', value: insuranceCost },
      { label: 'Nebenkosten Fracht', value: s.freightExtras },
      { label: 'EU-Importzoll', value: dutyCost, highlight: dutyCost === 0 },
      { label: 'Einfuhrumsatzsteuer', value: vatCost },
      { label: 'Hafengebühren Ankunft', value: s.arrivalPort },
      { label: 'Zollagent', value: s.customsAgent },
      { label: 'Wareneingangsprüfung', value: s.arrivalInspection },
      { label: 'Finanzierungskosten', value: financeCost },
      { label: 'Handling & Lager', value: s.handling },
      { label: 'Overhead', value: s.overhead },
      { label: 'Sonstiges', value: s.other },
    ].filter(r => r.value > 0),
    totalCostForPct: totalCost,
  };
}

function computeScenario(s: CalcState, modifier: 'base' | 'pessimistic' | 'optimistic'): ComputeResult {
  const mod = { ...s };
  if (modifier === 'pessimistic') {
    mod.seaFreight = s.seaFreight * 1.2;
    mod.purchasePrice = s.purchasePrice * 1.15;
    mod.inlandTransport = s.inlandTransport * 1.1;
  } else if (modifier === 'optimistic') {
    mod.seaFreight = s.seaFreight * 0.9;
    mod.dutyRate = 0;
    mod.financeRate = s.financeRate * 0.85;
  }
  return compute(mod);
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5,
  color: 'var(--text)', fontFamily: 'inherit', fontSize: 12.5, padding: '5px 8px',
  outline: 'none', width: '100%', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase',
  letterSpacing: '0.05em', marginBottom: 3, display: 'block', fontWeight: 600,
};
const blockHead: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase',
  letterSpacing: '0.07em', marginBottom: 10, paddingBottom: 6,
  borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6,
};

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={labelStyle}>{label}{hint && <span style={{ fontSize: 9.5, color: 'var(--text-4)', fontWeight: 400, marginLeft: 4 }}>({hint})</span>}</label>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, step = 0.001, min = 0 }: { value: number; onChange: (v: number) => void; step?: number; min?: number }) {
  return (
    <input type="number" step={step} min={min} value={value}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      style={{ ...inputStyle, fontFamily: 'Geist Mono, monospace' }} />
  );
}

const LOAD_KEY = 'landed_cost_saved';
function loadSaved(): SavedCalc[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LOAD_KEY) ?? '[]') as SavedCalc[]; } catch { return []; }
}
function saveSaved(calcs: SavedCalc[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOAD_KEY, JSON.stringify(calcs));
}

export const LandedCostView = ({ lang }: LandedCostProps) => {
  const { data: M } = useData();
  const [s, setS] = useState<CalcState>({ ...DEFAULT });
  const [saved, setSaved] = useState<SavedCalc[]>(loadSaved);
  const [showSaved, setShowSaved] = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const orderPickerRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof CalcState>(k: K, v: CalcState[K]) =>
    setS(prev => ({ ...prev, [k]: v }));

  const result = useMemo(() => compute(s), [s]);

  const handleSave = () => {
    const name = s.product || `Kalkulation ${new Date().toLocaleDateString('de-DE')}`;
    const entry: SavedCalc = {
      id: `lc_${Date.now()}`, name, savedAt: new Date().toISOString(),
      state: { ...s }, totalCost: result.totalCost, targetPrice: result.targetPrice,
    };
    const updated = [entry, ...saved].slice(0, 20);
    setSaved(updated);
    saveSaved(updated);
  };

  const handleLoadSaved = (sc: SavedCalc) => {
    setS({ ...sc.state });
    setShowSaved(false);
  };

  const handleDeleteSaved = (id: string) => {
    const updated = saved.filter(sc => sc.id !== id);
    setSaved(updated);
    saveSaved(updated);
  };

  const handleFillFromOrder = (orderId: string) => {
    if (!M) return;
    const order = M.orders.find(o => o.id === orderId);
    if (!order) return;
    const product = M.products.find(p => p.id === order.productId);
    const supplier = M.suppliers.find(sup => sup.id === order.supplierId);
    setS(prev => ({
      ...prev,
      product: product?.name ?? order.productVariant ?? '',
      qty: order.qty ?? prev.qty,
      origin: supplier?.country ?? prev.origin,
      purchasePrice: order.qty && order.costGoods ? order.costGoods / order.qty : prev.purchasePrice,
    }));
    setShowOrderPicker(false);
  };

  const base = computeScenario(s, 'base');
  const pess = computeScenario(s, 'pessimistic');
  const opti = computeScenario(s, 'optimistic');

  const openOrders = M?.orders.filter(o => !['done', 'paid'].includes(o.status)) ?? [];

  const scenarioCard = (
    label: string, res: ComputeResult, color: string, sub?: string
  ) => (
    <div style={{ flex: 1, padding: '14px 16px', background: `${color}08`, border: `1px solid ${color}30`, borderRadius: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <div>
          <div style={{ fontSize: 9.5, color: 'var(--text-4)', textTransform: 'uppercase' }}>Gesamtkosten</div>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Geist Mono, monospace', color }}>{n2(res.totalCost)} €/kg</div>
        </div>
        <div>
          <div style={{ fontSize: 9.5, color: 'var(--text-4)', textTransform: 'uppercase' }}>Verkaufspreis</div>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Geist Mono, monospace', color: 'var(--text)' }}>{n2(res.targetPrice)} €/kg</div>
        </div>
        <div>
          <div style={{ fontSize: 9.5, color: 'var(--text-4)', textTransform: 'uppercase' }}>Marge</div>
          <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Geist Mono, monospace' }}>{s.targetMargin}%</div>
        </div>
        <div>
          <div style={{ fontSize: 9.5, color: 'var(--text-4)', textTransform: 'uppercase' }}>Bruttogewinn</div>
          <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Geist Mono, monospace' }}>{n0(res.grossProfit)} €</div>
        </div>
      </div>
      {sub && <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-4)', fontStyle: 'italic' }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(96,165,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic name="finance" size={15} color="#60a5fa" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{t(lang, 'lc_title')}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{t(lang, 'lc_subtitle')}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowOrderPicker(v => !v)}
              disabled={!M || openOrders.length === 0}
              style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Ic name="box" size={11} /> {t(lang, 'lc_fill_from_order')}
            </button>
            {showOrderPicker && (
              <div ref={orderPickerRef} style={{ position: 'absolute', top: '110%', right: 0, zIndex: 100, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, minWidth: 260, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', padding: '6px 0' }}>
                {openOrders.slice(0, 10).map(o => (
                  <button key={o.id} onClick={() => handleFillFromOrder(o.id)}
                    style={{ width: '100%', textAlign: 'left', padding: '7px 14px', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 12 }}>
                    {o.productVariant ?? o.id} {o.qty ? `· ${o.qty.toLocaleString('de-DE')} kg` : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleSave}
            style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Ic name="download" size={11} /> {t(lang, 'lc_save_calc')}
          </button>
          <button onClick={() => window.print()}
            style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Ic name="doc" size={11} /> {t(lang, 'lc_export_pdf')}
          </button>
          <button onClick={() => setS({ ...DEFAULT })}
            style={{ padding: '5px 12px', borderRadius: 6, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-3)', cursor: 'pointer', fontSize: 12 }}>
            {t(lang, 'lc_new_calc')}
          </button>
        </div>
      </div>

      {/* Main: Input + Result */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {/* Input panel */}
        <div style={{ width: '52%', overflowY: 'auto', borderRight: '1px solid var(--border)', padding: '20px 22px' }}>

          {/* Base params */}
          <div style={blockHead}><Ic name="product" size={12} /> Basisparameter</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label={t(lang, 'lc_product')}>
                <input style={inputStyle} value={s.product} onChange={e => set('product', e.target.value)} placeholder="z.B. Arabica Kaffee, Grade 2, Yirgacheffe" />
              </Field>
            </div>
            <Field label={t(lang, 'lc_origin')}>
              <select style={inputStyle} value={s.origin} onChange={e => set('origin', e.target.value)}>
                {['Äthiopien','Kenia','Uganda','Tansania','Ruanda','Burundi','Andere'].map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label={t(lang, 'lc_destination')}>
              <select style={inputStyle} value={s.destination} onChange={e => set('destination', e.target.value)}>
                {['Deutschland','EU allgemein','Schweiz','UK','Frankreich','Niederlande','Andere'].map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label={t(lang, 'lc_quantity')}>
              <NumInput value={s.qty} onChange={v => set('qty', v)} step={100} min={1} />
            </Field>
            <Field label={t(lang, 'lc_exchange_rate')} >
              <NumInput value={s.exchangeRate} onChange={v => set('exchangeRate', v)} step={0.01} />
            </Field>
          </div>

          {/* Block 1 */}
          <div style={blockHead}><Ic name="supplier" size={12} color="#60a5fa" /> {t(lang, 'lc_block1')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <Field label={t(lang, 'lc_purchase_price')}>
              <NumInput value={s.purchasePrice} onChange={v => set('purchasePrice', v)} />
            </Field>
            <Field label={t(lang, 'lc_quality_check')}>
              <NumInput value={s.qualityCheck} onChange={v => set('qualityCheck', v)} />
            </Field>
            <Field label={t(lang, 'lc_inland_transport')}>
              <NumInput value={s.inlandTransport} onChange={v => set('inlandTransport', v)} />
            </Field>
            <Field label={t(lang, 'lc_export_fees')}>
              <NumInput value={s.exportFees} onChange={v => set('exportFees', v)} />
            </Field>
          </div>

          {/* Block 2 */}
          <div style={blockHead}><Ic name="ship" size={12} color="#22d3ee" /> {t(lang, 'lc_block2')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <Field label={t(lang, 'lc_sea_freight')}>
              <NumInput value={s.seaFreight} onChange={v => set('seaFreight', v)} />
            </Field>
            <Field label={t(lang, 'lc_port_fees')}>
              <NumInput value={s.portFeesDep} onChange={v => set('portFeesDep', v)} />
            </Field>
            <Field label={t(lang, 'lc_insurance')}>
              <NumInput value={s.insurancePct} onChange={v => set('insurancePct', v)} step={0.1} />
            </Field>
            <Field label={t(lang, 'lc_freight_extras')} hint="D/O, B/L, THC">
              <NumInput value={s.freightExtras} onChange={v => set('freightExtras', v)} />
            </Field>
          </div>

          {/* Block 3 */}
          <div style={blockHead}><Ic name="customs" size={12} color="#f59e0b" /> {t(lang, 'lc_block3')}</div>
          <div style={{ marginBottom: 6, padding: '6px 10px', background: 'rgba(16,185,129,0.08)', borderRadius: 5, fontSize: 10.5, color: '#10b981', borderLeft: '3px solid #10b98160' }}>
            &#x2139; {t(lang, 'lc_eba_note')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <Field label={t(lang, 'lc_hs_code')}>
              <input style={inputStyle} value={s.hsCode} onChange={e => set('hsCode', e.target.value)} placeholder="z.B. 09011100" />
            </Field>
            <Field label={t(lang, 'lc_duty_rate')}>
              <NumInput value={s.dutyRate} onChange={v => set('dutyRate', v)} step={0.1} />
            </Field>
            <Field label={t(lang, 'lc_vat_import')}>
              <NumInput value={s.vatImport} onChange={v => set('vatImport', v)} step={0.1} />
            </Field>
            <Field label={t(lang, 'lc_arrival_port')}>
              <NumInput value={s.arrivalPort} onChange={v => set('arrivalPort', v)} />
            </Field>
            <Field label={t(lang, 'lc_customs_agent')}>
              <NumInput value={s.customsAgent} onChange={v => set('customsAgent', v)} />
            </Field>
            <Field label={t(lang, 'lc_arrival_inspection')}>
              <NumInput value={s.arrivalInspection} onChange={v => set('arrivalInspection', v)} />
            </Field>
          </div>

          {/* Block 4 */}
          <div style={blockHead}><Ic name="finance" size={12} color="#a78bfa" /> {t(lang, 'lc_block4')}</div>
          <div style={{ marginBottom: 6, padding: '6px 10px', background: 'rgba(167,139,250,0.08)', borderRadius: 5, fontSize: 10.5, color: '#a78bfa', borderLeft: '3px solid #a78bfa60' }}>
            Finanzierungsdauer = Zeit von Vorauszahlung bis Käuferzahlung (typisch 60–90 Tage)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <Field label={t(lang, 'lc_finance_days')}>
              <NumInput value={s.financeDays} onChange={v => set('financeDays', v)} step={1} />
            </Field>
            <Field label={t(lang, 'lc_finance_rate')}>
              <NumInput value={s.financeRate} onChange={v => set('financeRate', v)} step={0.1} />
            </Field>
          </div>

          {/* Block 5 */}
          <div style={blockHead}><Ic name="settings" size={12} color="#94a3b8" /> {t(lang, 'lc_block5')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            <Field label={t(lang, 'lc_handling')}>
              <NumInput value={s.handling} onChange={v => set('handling', v)} />
            </Field>
            <Field label={t(lang, 'lc_overhead')}>
              <NumInput value={s.overhead} onChange={v => set('overhead', v)} />
            </Field>
            <Field label={t(lang, 'lc_other')}>
              <NumInput value={s.other} onChange={v => set('other', v)} />
            </Field>
          </div>

          {/* Margin */}
          <div style={blockHead}><Ic name="chart" size={12} color="#34d399" /> {t(lang, 'lc_margin_block')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
            <Field label={t(lang, 'lc_target_margin')}>
              <NumInput value={s.targetMargin} onChange={v => set('targetMargin', v)} step={0.5} />
            </Field>
            <Field label={t(lang, 'lc_min_margin')}>
              <NumInput value={s.minMargin} onChange={v => set('minMargin', v)} step={0.5} />
            </Field>
          </div>

          {/* Saved calcs */}
          {saved.length > 0 && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <button onClick={() => setShowSaved(v => !v)}
                style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, padding: 0, marginBottom: showSaved ? 8 : 0 }}>
                <Ic name={showSaved ? 'chevD' : 'chevR'} size={11} /> {t(lang, 'lc_saved_calcs')} ({saved.length})
              </button>
              {showSaved && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {saved.map(sc => (
                    <div key={sc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--surface-2)', borderRadius: 6, border: '1px solid var(--border)' }}>
                      <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => handleLoadSaved(sc)}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{sc.name}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-4)' }}>
                          {new Date(sc.savedAt).toLocaleDateString('de-DE')} · {n2(sc.totalCost)} €/kg · VKP {n2(sc.targetPrice)} €/kg
                        </div>
                      </div>
                      <button onClick={() => handleDeleteSaved(sc.id)}
                        style={{ background: 'none', border: 'none', color: 'rgba(248,113,113,0.5)', cursor: 'pointer', fontSize: 13, padding: '2px 4px' }}>&#x2715;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Result panel */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', background: 'var(--surface-2)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Ic name="chart" size={12} color="#60a5fa" /> {t(lang, 'lc_result_title')}
          </div>

          {/* Cost waterfall bars */}
          <div style={{ marginBottom: 16 }}>
            {result.rows.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 80px 40px 1fr', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: row.highlight ? '#10b981' : 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.label}</span>
                <span style={{ fontSize: 11, fontFamily: 'Geist Mono, monospace', textAlign: 'right', color: row.highlight ? '#10b981' : 'var(--text)' }}>{n2(row.value)} €/kg</span>
                <span style={{ fontSize: 10, color: 'var(--text-4)', textAlign: 'right' }}>{pct(row.value, result.totalCost)}%</span>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (row.value / result.totalCost) * 100)}%`, height: '100%', background: row.highlight ? '#10b981' : '#60a5fa', borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={{ padding: '14px 16px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{t(lang, 'lc_total_costs')}</span>
              <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Geist Mono, monospace', color: '#60a5fa' }}>{n2(result.totalCost)} €/kg</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 2 }}>{t(lang, 'lc_target_price')} ({s.targetMargin}% Marge)</div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Geist Mono, monospace', color: '#34d399' }}>{n2(result.targetPrice)} €/kg</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 2 }}>{t(lang, 'lc_min_price')} ({s.minMargin}% Marge)</div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Geist Mono, monospace', color: '#fbbf24' }}>{n2(result.minPrice)} €/kg</div>
              </div>
            </div>
            {s.qty > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-4)', textTransform: 'uppercase' }}>{t(lang, 'lc_total_shipment_buy')}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Geist Mono, monospace' }}>{n0(result.totalBuy)} €</div>
                  <div style={{ fontSize: 10, color: 'var(--text-4)' }}>{n0(s.qty)} kg</div>
                </div>
                <div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-4)', textTransform: 'uppercase' }}>{t(lang, 'lc_total_shipment_sell')}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Geist Mono, monospace' }}>{n0(result.totalSell)} €</div>
                </div>
                <div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-4)', textTransform: 'uppercase' }}>{t(lang, 'lc_gross_profit')}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Geist Mono, monospace', color: '#34d399' }}>{n0(result.grossProfit)} €</div>
                </div>
              </div>
            )}
          </div>

          {/* Scenarios */}
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{t(lang, 'lc_scenarios')}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {scenarioCard(t(lang, 'lc_scenario_base'), base, '#34d399')}
            {scenarioCard(t(lang, 'lc_scenario_pessimistic'), pess, '#f87171', '+20% Fracht, +15% EK')}
            {scenarioCard(t(lang, 'lc_scenario_optimistic'), opti, '#60a5fa', '-10% Fracht, 0% Zins-Bonus')}
          </div>
        </div>
      </div>
    </div>
  );
};

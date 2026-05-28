'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useData } from '@/lib/data-context';
import { Ic } from '@/components/ui/icons';
import { fmtCur } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { useLang } from '@/lib/lang-context';

// ── Types & constants ─────────────────────────────────────────────────────────

type Step = 'buyer' | 'product' | 'qty' | 'logistics' | 'review';

const STEPS: { key: Step; labelKey: string; icon: string }[] = [
  { key: 'buyer',     labelKey: 'wiz_step_buyer',     icon: 'buyer'   },
  { key: 'product',   labelKey: 'wiz_step_product',   icon: 'product' },
  { key: 'qty',       labelKey: 'wiz_step_qty',       icon: 'finance' },
  { key: 'logistics', labelKey: 'wiz_step_logistics', icon: 'ship'    },
  { key: 'review',    labelKey: 'wiz_step_finish',    icon: 'flag'    },
];

const INCOTERMS = ['FOB', 'CFR', 'CIF', 'EXW', 'DDP', 'FCA', 'DAP'];

const LOAD_PORTS = [
  { key: 'DAR', label: 'Dar es Salaam', sub: 'Tanzania' },
  { key: 'MOM', label: 'Mombasa',       sub: 'Kenya' },
  { key: 'JIB', label: 'Djibouti',      sub: 'Djibouti' },
];

const DEST_PORTS = [
  { key: 'HAM', label: 'Hamburg',    sub: 'Deutschland' },
  { key: 'RTM', label: 'Rotterdam',  sub: 'Niederlande' },
  { key: 'ANR', label: 'Antwerpen',  sub: 'Belgien' },
  { key: 'GOA', label: 'Genova',     sub: 'Italien' },
  { key: 'FXT', label: 'Felixstowe', sub: 'Großbritannien' },
  { key: 'LEH', label: 'Le Havre',   sub: 'Frankreich' },
];

interface WizardState {
  buyerId: string;
  productId: string;
  productVariant: string;
  supplierId: string;
  qty: number;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  incoterm: string;
  portLoad: string;
  portDest: string;
  etd: string;
  eta: string;
  costLogistics: number;
  costDocs: number;
  responsible: string;
}

const offsetDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const initState = (): WizardState => ({
  buyerId: '', productId: '', productVariant: '', supplierId: '',
  qty: 0, unit: 'kg', buyPrice: 0, sellPrice: 0,
  incoterm: 'FOB', portLoad: 'DAR', portDest: 'HAM',
  etd: offsetDate(21), eta: offsetDate(51),
  costLogistics: 1200, costDocs: 350,
  responsible: '',
});

const generateOrderId = (existingIds: string[]) => {
  const nums = existingIds.map(id => parseInt(id.replace('ORD-', ''), 10)).filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1001;
  return `ORD-${String(next).padStart(4, '0')}`;
};

// ── Shared input styles ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface OrderWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ── Main component ────────────────────────────────────────────────────────────

export function OrderWizard({ open, onClose, onSuccess }: OrderWizardProps) {
  const lang = useLang();
  const { data: M, refresh } = useData();
  const [step, setStep]     = useState<Step>('buyer');
  const [state, setState]   = useState<WizardState>(initState);
  const [buyerQ, setBuyerQ] = useState('');
  const [prodQ, setProdQ]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [newOrderId, setNewOrderId]   = useState('');

  const update = useCallback(<K extends keyof WizardState>(key: K, val: WizardState[K]) =>
    setState(prev => ({ ...prev, [key]: val })), []);

  const reset = useCallback(() => {
    setStep('buyer'); setState(initState()); setBuyerQ(''); setProdQ('');
    setSubmitting(false); setSubmitError(null); setNewOrderId('');
  }, []);

  const handleClose = () => { reset(); onClose(); };

  // Keep eta = etd + 30 days when etd changes
  useEffect(() => {
    if (!state.etd) return;
    const etd = new Date(state.etd);
    etd.setDate(etd.getDate() + 30);
    setState(prev => ({ ...prev, eta: etd.toISOString().slice(0, 10) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.etd]);

  const stepIdx  = STEPS.findIndex(s => s.key === step);
  const canNext  = useMemo(() => {
    if (step === 'buyer')     return !!state.buyerId;
    if (step === 'product')   return !!state.productId && !!state.productVariant;
    if (step === 'qty')       return state.qty > 0 && state.sellPrice > 0 && !!state.supplierId;
    if (step === 'logistics') return !!state.etd && !!state.eta;
    return true;
  }, [step, state]);

  const goNext = () => { const i = stepIdx; if (i < STEPS.length - 1) setStep(STEPS[i + 1].key); };
  const goBack = () => { const i = stepIdx; if (i > 0) setStep(STEPS[i - 1].key); };

  // Derived financials (used in qty step and review)
  const revenue   = state.qty * state.sellPrice;
  const costGoods = state.qty * state.buyPrice;
  const profit    = revenue - costGoods - state.costLogistics - state.costDocs;
  const marginPct = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

  const submit = async () => {
    if (!M) return;
    setSubmitting(true); setSubmitError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const orderId = generateOrderId(M.orders.map(o => o.id));
      const batch   = `BATCH-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000) + 10000}`;
      const { error: sbErr } = await sb.from('orders').insert({
        id: orderId, buyer_id: state.buyerId, product_id: state.productId,
        product_variant: state.productVariant, supplier_id: state.supplierId,
        qty: state.qty, unit: state.unit, batch,
        buy_price: state.buyPrice, sell_price: state.sellPrice,
        revenue, cost_goods: costGoods,
        cost_logistics: state.costLogistics, cost_docs: state.costDocs,
        profit, incoterm: state.incoterm,
        port_load: state.portLoad, port_dest: state.portDest,
        status: 'confirmed', status_key: 'confirmed',
        etd: state.etd, eta: state.eta,
        responsible: state.responsible || 'Admin',
        vessel_idx: 0, paid: 0, created_at: new Date().toISOString(),
      });
      if (sbErr) throw new Error(sbErr.message);
      setNewOrderId(orderId);
      refresh();
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  // ── Step: Buyer ─────────────────────────────────────────────────────────────

  const renderBuyer = () => {
    const buyers = M?.buyers ?? [];
    const filtered = buyerQ
      ? buyers.filter(b => b.name.toLowerCase().includes(buyerQ.toLowerCase()) || b.country.toLowerCase().includes(buyerQ.toLowerCase()) || b.city.toLowerCase().includes(buyerQ.toLowerCase()))
      : buyers;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          autoFocus
          value={buyerQ} onChange={e => setBuyerQ(e.target.value)}
          placeholder={t(lang, 'wiz_buyer_search')}
          style={inputStyle}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(b => {
            const sel = b.id === state.buyerId;
            return (
              <div
                key={b.id}
                onClick={() => {
                  update('buyerId', b.id);
                  update('incoterm', b.incoterm || 'FOB');
                  // auto-set portDest based on buyer country
                  if (['DE', 'AT', 'CH'].includes(b.country)) update('portDest', 'HAM');
                  else if (['NL', 'BE'].includes(b.country))   update('portDest', 'RTM');
                  else if (['IT'].includes(b.country))          update('portDest', 'GOA');
                  else if (['FR'].includes(b.country))          update('portDest', 'LEH');
                  else if (['GB'].includes(b.country))          update('portDest', 'FXT');
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${sel ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`,
                  background: sel ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.12s',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: sel ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ic name="buyer" size={15} color={sel ? '#a78bfa' : 'var(--text-3)'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: sel ? '#e2d9f3' : 'var(--text)' }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{b.city} · {b.country} · {b.industry}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                  <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>{b.incoterm}</span>
                  <div style={{ display: 'flex', gap: 1 }}>
                    {[1,2,3,4,5].map(s => (
                      <div key={s} style={{ width: 6, height: 6, borderRadius: '50%', background: s <= b.rating ? '#f59e0b' : 'rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                </div>
                {sel && <Ic name="check" size={14} color="#a78bfa" />}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
              {t(lang, 'wiz_no_buyers')}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Step: Product ───────────────────────────────────────────────────────────

  const renderProduct = () => {
    const products = M?.products ?? [];
    const filtered = prodQ
      ? products.filter(p => p.name.toLowerCase().includes(prodQ.toLowerCase()) || p.cat.toLowerCase().includes(prodQ.toLowerCase()))
      : products;
    const selProd = products.find(p => p.id === state.productId);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          value={prodQ} onChange={e => setProdQ(e.target.value)}
          placeholder={t(lang, 'wiz_product_search')}
          style={inputStyle}
        />
        {/* Variant picker for selected product */}
        {selProd && (
          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {selProd.name} — Variante wählen
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {selProd.variants.map(v => (
                <span
                  key={v.v}
                  className={`chip${state.productVariant === v.v ? ' on' : ''}`}
                  onClick={() => update('productVariant', v.v)}
                  style={{ cursor: 'pointer' }}
                >
                  {v.v}
                  <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>({v.grade})</span>
                </span>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {filtered.map(p => {
            const sel = p.id === state.productId;
            return (
              <div
                key={p.id}
                onClick={() => {
                  if (state.productId === p.id) return;
                  update('productId', p.id);
                  update('productVariant', '');
                  update('unit', p.unit);
                  update('buyPrice', p.buyPrice);
                  update('sellPrice', p.sellPrice);
                }}
                style={{
                  padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${sel ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`,
                  background: sel ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.12s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Ic name="product" size={13} color={sel ? '#a78bfa' : 'var(--text-3)'} />
                  <span style={{ fontWeight: 600, fontSize: 12.5, color: sel ? '#e2d9f3' : 'var(--text)', flex: 1 }}>{p.name}</span>
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 4 }}>{p.cat} · {p.origin}</div>
                <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                  <span style={{ color: 'var(--text-3)' }}>Buy: <span style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{p.buyPrice.toFixed(2)} €/{p.unit}</span></span>
                  <span style={{ color: 'var(--text-3)' }}>Sell: <span style={{ color: '#34d399', fontFamily: 'var(--font-mono)' }}>{p.sellPrice.toFixed(2)} €/{p.unit}</span></span>
                </div>
                {!p.exportReady && (
                  <div style={{ marginTop: 6, fontSize: 10, color: '#f59e0b' }}>⚠ Noch nicht exportbereit</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Step: Qty & Price ───────────────────────────────────────────────────────

  const renderQty = () => {
    const product   = M?.products.find(p => p.id === state.productId);
    const suppliers = (M?.suppliers ?? []).filter(s =>
      s.status === 'aktiv' && (!product || s.products.some(sp => product.name.toLowerCase().includes(sp.toLowerCase()) || sp.toLowerCase().includes(product.name.toLowerCase().split(' ')[0])))
    );
    const allSuppliers = M?.suppliers.filter(s => s.status === 'aktiv') ?? [];
    const displaySuppliers = suppliers.length > 0 ? suppliers : allSuppliers;

    return (
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Left: inputs */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Qty */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>{t(lang, 'wiz_qty_label')} ({state.unit})</div>
            <input
              type="number" min={0} value={state.qty || ''}
              onChange={e => update('qty', parseFloat(e.target.value) || 0)}
              placeholder="z.B. 20000"
              style={inputStyle}
            />
          </div>
          {/* Buy price */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>{t(lang, 'wiz_row_buy')} (€ / {state.unit})</div>
            <input
              type="number" min={0} step={0.01} value={state.buyPrice || ''}
              onChange={e => update('buyPrice', parseFloat(e.target.value) || 0)}
              style={inputStyle}
            />
          </div>
          {/* Sell price */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>{t(lang, 'wiz_row_sell')} (€ / {state.unit})</div>
            <input
              type="number" min={0} step={0.01} value={state.sellPrice || ''}
              onChange={e => update('sellPrice', parseFloat(e.target.value) || 0)}
              style={inputStyle}
            />
          </div>
          {/* Supplier */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>{t(lang, 'wiz_row_supplier')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
              {displaySuppliers.map(s => {
                const sel = s.id === state.supplierId;
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      update('supplierId', s.id);
                      update('portLoad', s.country === 'KE' ? 'MOM' : 'DAR');
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                      borderRadius: 6, cursor: 'pointer',
                      border: `1px solid ${sel ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.06)'}`,
                      background: sel ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <Ic name="supplier" size={12} color={sel ? '#34d399' : 'var(--text-3)'} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: sel ? 600 : 400, color: sel ? 'var(--text)' : 'var(--text)' }}>{s.name}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{s.region} · Score {s.score}</div>
                    </div>
                    <span style={{
                      fontSize: 10, padding: '2px 5px', borderRadius: 4, flexShrink: 0,
                      background: s.tier === 'A' ? 'rgba(52,211,153,0.15)' : s.tier === 'B' ? 'rgba(251,191,36,0.15)' : 'rgba(239,68,68,0.15)',
                      color: s.tier === 'A' ? '#34d399' : s.tier === 'B' ? '#fbbf24' : '#f87171',
                    }}>Tier {s.tier}</span>
                    {sel && <Ic name="check" size={12} color="#34d399" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: live P&L */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0 }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, fontWeight: 600 }}>Live P&L</div>
            {[
              { l: t(lang, 'wiz_row_revenue'), v: revenue, pos: true },
              { l: t(lang, 'wiz_row_buy'), v: -costGoods },
              { l: t(lang, 'wiz_row_logistics'), v: -state.costLogistics },
              { l: t(lang, 'wiz_row_docs'), v: -state.costDocs },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 11.5, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: 'var(--text-3)' }}>{r.l}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: r.pos ? 'var(--text)' : 'var(--text-3)' }}>
                  {r.v >= 0 ? '+' : ''}{fmtCur(r.v)}
                </span>
              </div>
            ))}
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>{t(lang, 'profit')}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: profit > 0 ? '#34d399' : '#f87171' }}>{fmtCur(profit)}</span>
            </div>
            <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-3)' }}>{t(lang, 'margin')}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: marginPct >= 20 ? '#34d399' : marginPct >= 10 ? '#fbbf24' : '#f87171' }}>{marginPct}%</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-3)', opacity: 0.7 }}>{t(lang, 'wiz_estimates')}</div>
          </div>
        </div>
      </div>
    );
  };

  // ── Step: Logistics ─────────────────────────────────────────────────────────

  const renderLogistics = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Incoterm */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500 }}>Incoterm</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {INCOTERMS.map(inc => (
            <span
              key={inc}
              className={`chip${state.incoterm === inc ? ' on' : ''}`}
              onClick={() => update('incoterm', inc)}
              style={{ cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12 }}
            >
              {inc}
            </span>
          ))}
        </div>
      </div>

      {/* Ports */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500 }}>{t(lang, 'wiz_load_port')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {LOAD_PORTS.map(p => {
              const sel = state.portLoad === p.key;
              return (
                <div
                  key={p.key}
                  onClick={() => update('portLoad', p.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                    borderRadius: 6, cursor: 'pointer',
                    border: `1px solid ${sel ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`,
                    background: sel ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <Ic name="pin" size={12} color={sel ? '#a78bfa' : 'var(--text-3)'} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: sel ? 600 : 400 }}>{p.label}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{p.sub}</div>
                  </div>
                  {sel && <div style={{ marginLeft: 'auto' }}><Ic name="check" size={12} color="#a78bfa" /></div>}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500 }}>{t(lang, 'wiz_dest_port')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {DEST_PORTS.map(p => {
              const sel = state.portDest === p.key;
              return (
                <div
                  key={p.key}
                  onClick={() => update('portDest', p.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                    borderRadius: 6, cursor: 'pointer',
                    border: `1px solid ${sel ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`,
                    background: sel ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <Ic name="flag" size={12} color={sel ? '#a78bfa' : 'var(--text-3)'} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: sel ? 600 : 400 }}>{p.label}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{p.sub}</div>
                  </div>
                  {sel && <div style={{ marginLeft: 'auto' }}><Ic name="check" size={12} color="#a78bfa" /></div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>{t(lang, 'wiz_etd_planned')}</div>
          <input type="date" value={state.etd} onChange={e => update('etd', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>{t(lang, 'wiz_eta_planned')}</div>
          <input type="date" value={state.eta} onChange={e => update('eta', e.target.value)} style={inputStyle} />
        </div>
      </div>

      {/* Costs + responsible */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>{t(lang, 'wiz_logistics_cost')}</div>
          <input
            type="number" min={0} value={state.costLogistics}
            onChange={e => update('costLogistics', parseFloat(e.target.value) || 0)}
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>{t(lang, 'wiz_doc_costs')}</div>
          <input
            type="number" min={0} value={state.costDocs}
            onChange={e => update('costDocs', parseFloat(e.target.value) || 0)}
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>{t(lang, 'wiz_responsible')}</div>
          <input
            type="text" value={state.responsible}
            onChange={e => update('responsible', e.target.value)}
            placeholder="Name"
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );

  // ── Step: Review ────────────────────────────────────────────────────────────

  const renderReview = () => {
    const buyer    = M?.buyers.find(b => b.id === state.buyerId);
    const product  = M?.products.find(p => p.id === state.productId);
    const supplier = M?.suppliers.find(s => s.id === state.supplierId);
    const loadPort = LOAD_PORTS.find(p => p.key === state.portLoad);
    const destPort = DEST_PORTS.find(p => p.key === state.portDest);

    // Success state
    if (newOrderId) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic name="check" size={26} color="#34d399" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{t(lang, 'wiz_order_done')}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: '#a78bfa', fontWeight: 600, marginBottom: 4 }}>{newOrderId}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {product?.name} · {state.qty.toLocaleString('de-DE')} {state.unit} → {buyer?.name}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn ghost" onClick={handleClose}>{t(lang, 'close')}</button>
            <button className="btn primary" onClick={() => { onSuccess(); handleClose(); }}>
              <Ic name="eye" size={13} /> {t(lang, 'wiz_order_view')}
            </button>
          </div>
        </div>
      );
    }

    const rows = [
      { l: t(lang, 'wiz_row_buyer'),       v: buyer?.name,                      sub: `${buyer?.city} · ${buyer?.country}` },
      { l: t(lang, 'wiz_row_product'),     v: product?.name,                    sub: state.productVariant },
      { l: t(lang, 'wiz_row_supplier'),    v: supplier?.name,                   sub: `${supplier?.region} · Tier ${supplier?.tier}` },
      { l: t(lang, 'wiz_row_qty'),         v: `${state.qty.toLocaleString('de-DE')} ${state.unit}` },
      { l: t(lang, 'wiz_row_buy'),         v: `${state.buyPrice.toFixed(2)} €/${state.unit}` },
      { l: t(lang, 'wiz_row_sell'),        v: `${state.sellPrice.toFixed(2)} €/${state.unit}` },
      { l: t(lang, 'wiz_row_incoterm'),    v: state.incoterm },
      { l: t(lang, 'wiz_row_route'),       v: `${loadPort?.label} → ${destPort?.label}` },
      { l: t(lang, 'wiz_row_etd'),         v: `${state.etd} → ${state.eta}` },
      { l: t(lang, 'wiz_row_responsible'), v: state.responsible || 'Admin' },
    ];

    return (
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{t(lang, 'wiz_order_summary')}</div>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12.5, gap: 8 }}>
              <span style={{ color: 'var(--text-3)', width: 110, flexShrink: 0 }}>{r.l}</span>
              <div>
                <div style={{ fontWeight: 500 }}>{r.v ?? '—'}</div>
                {r.sub && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.sub}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* P&L summary */}
        <div style={{ width: 190, flexShrink: 0 }}>
          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
            <div style={{ fontSize: 10, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 12 }}>{t(lang, 'wiz_calc')}</div>
            {[
              { l: t(lang, 'wiz_row_revenue'), v: revenue,              pos: true },
              { l: t(lang, 'wiz_row_buy'),     v: -costGoods },
              { l: t(lang, 'wiz_row_logistics').replace('*', ''), v: -state.costLogistics },
              { l: t(lang, 'wiz_row_docs').replace('*', ''),      v: -state.costDocs },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 11.5, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: 'var(--text-3)' }}>{r.l}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: r.pos ? 'var(--text)' : 'var(--text-3)' }}>
                  {r.v >= 0 ? '+' : ''}{fmtCur(r.v)}
                </span>
              </div>
            ))}
            <div style={{ marginTop: 10, padding: '8px 0', borderTop: '1px solid rgba(52,211,153,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}>
                <span>{t(lang, 'profit')}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: profit > 0 ? '#34d399' : '#f87171' }}>{fmtCur(profit)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                <span style={{ color: 'var(--text-3)' }}>{t(lang, 'margin')}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: marginPct >= 20 ? '#34d399' : '#fbbf24' }}>{marginPct}%</span>
              </div>
            </div>
          </div>

          {submitError && (
            <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11.5, color: '#f87171' }}>
              {submitError}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const isSuccess = !!newOrderId;

  return (
    <div className="overlay" onClick={handleClose} style={{ alignItems: 'flex-start', paddingTop: '5vh' }}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ width: '92vw', maxWidth: 780, maxHeight: '88vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isSuccess ? 0 : 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(99,102,241,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic name="box" size={14} color="#a78bfa" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{t(lang, 'wiz_new_order')}</span>
            <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={handleClose}>
              <Ic name="x" size={13} />
            </button>
          </div>

          {/* Step indicator */}
          {!isSuccess && (
            <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
              {STEPS.map((s, i) => {
                const done    = i < stepIdx;
                const current = i === stepIdx;
                return (
                  <React.Fragment key={s.key}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: done ? 'pointer' : 'default' }}
                      onClick={() => done && setStep(s.key)}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                        background: done ? '#34d399' : current ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)',
                        border: `1.5px solid ${done ? '#34d399' : current ? '#818cf8' : 'rgba(255,255,255,0.1)'}`,
                        color: done ? '#fff' : current ? '#a78bfa' : 'var(--text-3)',
                        fontWeight: 600, boxShadow: current ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
                      }}>
                        {done ? '✓' : i + 1}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: current ? 600 : 400, color: current ? 'var(--text)' : 'var(--text-3)', whiteSpace: 'nowrap' }}>
                        {t(lang, s.labelKey)}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{ flex: 1, height: 1, background: done ? '#34d399' : 'rgba(255,255,255,0.07)', margin: '0 6px' }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {step === 'buyer'     && renderBuyer()}
          {step === 'product'   && renderProduct()}
          {step === 'qty'       && renderQty()}
          {step === 'logistics' && renderLogistics()}
          {step === 'review'    && renderReview()}
        </div>

        {/* Footer */}
        {!isSuccess && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button className="btn ghost" onClick={handleClose} style={{ fontSize: 12 }}>{t(lang, 'cancel')}</button>
            {stepIdx > 0 && (
              <button className="btn" onClick={goBack} style={{ fontSize: 12 }}>
                <Ic name="chevL" size={12} /> {t(lang, 'back')}
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step !== 'review' ? (
              <button className="btn primary" onClick={goNext} disabled={!canNext}>
                {t(lang, 'next')} <Ic name="chevR" size={12} />
              </button>
            ) : (
              <button
                className="btn primary"
                onClick={submit}
                disabled={submitting}
                style={{ minWidth: 140, gap: 6 }}
              >
                {submitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    {t(lang, 'creating')}
                  </span>
                ) : (
                  <><Ic name="plus" size={13} /> {t(lang, 'wiz_order_create')}</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

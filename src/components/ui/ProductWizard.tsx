'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Ic } from '@/components/ui/icons';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'basic' | 'pricing' | 'review';

const STEPS: { key: Step; label: string }[] = [
  { key: 'basic',   label: 'Basis' },
  { key: 'pricing', label: 'Preise & Varianten' },
  { key: 'review',  label: 'Prüfen' },
];

const UNITS = ['kg', 't', 'Stk', 'L'];

interface Variant {
  v: string;
  grade: string;
  stock: number;
}

interface BasicState {
  name: string;
  cat: string;
  origin: string;
  hs: string;
  unit: string;
  packaging: string;
  moq: string;
}

interface PricingState {
  buyPrice: number;
  sellPrice: number;
  certs: string;
  exportReady: boolean;
  variants: Variant[];
}

interface WizardState {
  basic: BasicState;
  pricing: PricingState;
}

const initState = (): WizardState => ({
  basic: { name: '', cat: '', origin: '', hs: '', unit: 'kg', packaging: '', moq: '' },
  pricing: { buyPrice: 0, sellPrice: 0, certs: '', exportReady: false, variants: [{ v: '', grade: '', stock: 0 }] },
});

// ── Shared input style ────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

const smallInputStyle: React.CSSProperties = {
  ...inputStyle,
  padding: '5px 8px',
  fontSize: 12,
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface ProductWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProductWizard({ open, onClose, onSuccess }: ProductWizardProps) {
  const { data: M, refresh } = useData();
  const [step, setStep] = useState<Step>('basic');
  const [state, setState] = useState<WizardState>(initState);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newId, setNewId] = useState('');

  const updateBasic = (key: keyof BasicState, val: string) =>
    setState(prev => ({ ...prev, basic: { ...prev.basic, [key]: val } }));

  const updatePricing = <K extends keyof PricingState>(key: K, val: PricingState[K]) =>
    setState(prev => ({ ...prev, pricing: { ...prev.pricing, [key]: val } }));

  const updateVariant = (index: number, key: keyof Variant, val: string | number) =>
    setState(prev => {
      const variants = prev.pricing.variants.map((v, i) => i === index ? { ...v, [key]: val } : v);
      return { ...prev, pricing: { ...prev.pricing, variants } };
    });

  const addVariant = () =>
    setState(prev => ({
      ...prev,
      pricing: { ...prev.pricing, variants: [...prev.pricing.variants, { v: '', grade: '', stock: 0 }] },
    }));

  const reset = () => {
    setStep('basic');
    setState(initState());
    setSaving(false);
    setSaveError(null);
    setNewId('');
  };

  const handleClose = () => { reset(); onClose(); };

  const stepIdx = STEPS.findIndex(s => s.key === step);

  const canNext = (() => {
    if (step === 'basic') return !!state.basic.name.trim();
    return true;
  })();

  const goNext = () => { if (stepIdx < STEPS.length - 1) setStep(STEPS[stepIdx + 1].key); };
  const goBack = () => { if (stepIdx > 0) setStep(STEPS[stepIdx - 1].key); };

  const { buyPrice, sellPrice } = state.pricing;
  const margin = sellPrice > 0 ? Math.round((sellPrice - buyPrice) / sellPrice * 100) : 0;

  const handleSave = async () => {
    if (!M) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const { basic, pricing } = state;
      const certsArr = pricing.certs.split(',').map(s => s.trim()).filter(Boolean);
      const ids = M.products.map(p => parseInt(p.id.replace('PRD-', '')) || 0);
      const nextId = `PRD-${String(Math.max(0, ...ids) + 1).padStart(3, '0')}`;
      const { error: sbErr } = await sb.from('products').insert({
        id: nextId,
        name: basic.name,
        cat: basic.cat,
        origin: basic.origin,
        hs: basic.hs,
        unit: basic.unit,
        packaging: basic.packaging,
        moq: basic.moq,
        buy_price: pricing.buyPrice,
        sell_price: pricing.sellPrice,
        margin,
        export_ready: pricing.exportReady,
        variants: pricing.variants,
        certs: certsArr,
        buyers_count: 0,
        suppliers_count: 0,
      });
      if (sbErr) throw new Error(sbErr.message);
      setNewId(nextId);
      refresh();
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  // ── Step: Basic ─────────────────────────────────────────────────────────────

  const renderBasic = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Name *</div>
          <input
            autoFocus
            type="text"
            value={state.basic.name}
            onChange={e => updateBasic('name', e.target.value)}
            placeholder="Produktname"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Kategorie</div>
          <input
            type="text"
            value={state.basic.cat}
            onChange={e => updateBasic('cat', e.target.value)}
            placeholder="z.B. Kaffee, Cashews, Avocado"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Herkunft</div>
          <input
            type="text"
            value={state.basic.origin}
            onChange={e => updateBasic('origin', e.target.value)}
            placeholder="z.B. TZ, KE"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>HS-Code</div>
          <input
            type="text"
            value={state.basic.hs}
            onChange={e => updateBasic('hs', e.target.value)}
            placeholder="z.B. 0901.11"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500 }}>Einheit</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {UNITS.map(u => (
              <span
                key={u}
                className={`chip${state.basic.unit === u ? ' on' : ''}`}
                onClick={() => updateBasic('unit', u)}
                style={{ cursor: 'pointer' }}
              >
                {u}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Verpackung</div>
          <input
            type="text"
            value={state.basic.packaging}
            onChange={e => updateBasic('packaging', e.target.value)}
            placeholder="z.B. 60 kg Jutesack"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>MOQ</div>
          <input
            type="text"
            value={state.basic.moq}
            onChange={e => updateBasic('moq', e.target.value)}
            placeholder="z.B. 1000 kg"
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );

  // ── Step: Pricing ───────────────────────────────────────────────────────────

  const renderPricing = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Einkaufspreis (€/Einh.)</div>
          <input
            type="number"
            min={0}
            step={0.01}
            value={state.pricing.buyPrice || ''}
            onChange={e => updatePricing('buyPrice', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Verkaufspreis (€/Einh.)</div>
          <input
            type="number"
            min={0}
            step={0.01}
            value={state.pricing.sellPrice || ''}
            onChange={e => updatePricing('sellPrice', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Live margin */}
      <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 12.5 }}>
        <span style={{ color: 'var(--text-3)' }}>Marge: </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: margin >= 20 ? '#34d399' : margin >= 10 ? '#fbbf24' : margin > 0 ? '#f87171' : 'var(--text-3)' }}>
          {`Marge: ${margin}%`}
        </span>
      </div>

      <div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Zertifikate</div>
        <input
          type="text"
          value={state.pricing.certs}
          onChange={e => updatePricing('certs', e.target.value)}
          placeholder="z.B. Fairtrade, Organic"
          style={inputStyle}
        />
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 3 }}>Kommagetrennt</div>
      </div>

      <div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500 }}>Exportstatus</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span
            className={`chip${state.pricing.exportReady ? ' on' : ''}`}
            onClick={() => updatePricing('exportReady', !state.pricing.exportReady)}
            style={{ cursor: 'pointer' }}
          >
            Export bereit
          </span>
        </div>
      </div>

      {/* Variants table */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500 }}>Varianten</div>
        <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 0, background: 'rgba(255,255,255,0.04)', padding: '6px 10px', fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Variante</span>
            <span>Grad</span>
            <span>Bestand (kg)</span>
          </div>
          {state.pricing.variants.map((vr, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 6, padding: '6px 10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <input
                type="text"
                value={vr.v}
                onChange={e => updateVariant(i, 'v', e.target.value)}
                placeholder="z.B. Arabica"
                style={smallInputStyle}
              />
              <input
                type="text"
                value={vr.grade}
                onChange={e => updateVariant(i, 'grade', e.target.value)}
                placeholder="z.B. AA"
                style={smallInputStyle}
              />
              <input
                type="number"
                min={0}
                value={vr.stock || ''}
                onChange={e => updateVariant(i, 'stock', parseFloat(e.target.value) || 0)}
                placeholder="0"
                style={smallInputStyle}
              />
            </div>
          ))}
        </div>
        <button
          className="btn ghost"
          onClick={addVariant}
          style={{ marginTop: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Ic name="plus" size={12} /> Variante hinzufügen
        </button>
      </div>
    </div>
  );

  // ── Step: Review ────────────────────────────────────────────────────────────

  const renderReview = () => {
    if (newId) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic name="check" size={26} color="#34d399" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Produkt angelegt!</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: '#a78bfa', fontWeight: 600, marginBottom: 4 }}>{newId}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{state.basic.name} · {state.basic.cat}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn ghost" onClick={handleClose}>Schließen</button>
            <button className="btn primary" onClick={() => { onSuccess(); handleClose(); }}>
              <Ic name="eye" size={13} /> Produkt ansehen
            </button>
          </div>
        </div>
      );
    }

    const { basic, pricing } = state;
    const rows = [
      { l: 'Name',          v: basic.name || '—' },
      { l: 'Kategorie',     v: basic.cat || '—' },
      { l: 'Herkunft',      v: basic.origin || '—' },
      { l: 'HS-Code',       v: basic.hs || '—' },
      { l: 'Einheit',       v: basic.unit },
      { l: 'Verpackung',    v: basic.packaging || '—' },
      { l: 'MOQ',           v: basic.moq || '—' },
      { l: 'Einkaufspreis', v: `${pricing.buyPrice.toFixed(2)} €` },
      { l: 'Verkaufspreis', v: `${pricing.sellPrice.toFixed(2)} €` },
      { l: 'Marge',         v: `${margin}%` },
      { l: 'Zertifikate',   v: pricing.certs || '—' },
      { l: 'Export bereit', v: pricing.exportReady ? 'Ja' : 'Nein' },
      { l: 'Varianten',     v: `${pricing.variants.filter(v => v.v).length} definiert` },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Übersicht</div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12.5, gap: 8 }}>
            <span style={{ color: 'var(--text-3)', width: 110, flexShrink: 0 }}>{r.l}</span>
            <span style={{ fontWeight: 500 }}>{r.v}</span>
          </div>
        ))}
        {saveError && (
          <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11.5, color: '#f87171' }}>
            {saveError}
          </div>
        )}
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const isSuccess = !!newId;

  return (
    <div className="overlay" onClick={handleClose} style={{ alignItems: 'flex-start', paddingTop: '5vh' }}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ width: '92vw', maxWidth: 500, maxHeight: '88vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isSuccess ? 0 : 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(99,102,241,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic name="product" size={14} color="#a78bfa" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Neues Produkt</span>
            <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={handleClose}>
              <Ic name="x" size={13} />
            </button>
          </div>

          {!isSuccess && (
            <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
              {STEPS.map((s, i) => {
                const done = i < stepIdx;
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
                        {s.label}
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
          {step === 'basic'   && renderBasic()}
          {step === 'pricing' && renderPricing()}
          {step === 'review'  && renderReview()}
        </div>

        {/* Footer */}
        {!isSuccess && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button className="btn ghost" onClick={handleClose} style={{ fontSize: 12 }}>Abbrechen</button>
            {stepIdx > 0 && (
              <button className="btn" onClick={goBack} style={{ fontSize: 12 }}>
                <Ic name="chevL" size={12} /> Zurück
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step !== 'review' ? (
              <button className="btn primary" onClick={goNext} disabled={!canNext}>
                Weiter <Ic name="chevR" size={12} />
              </button>
            ) : (
              <button
                className="btn primary"
                onClick={handleSave}
                disabled={saving}
                style={{ minWidth: 150, gap: 6 }}
              >
                {saving ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Wird angelegt…
                  </span>
                ) : (
                  <><Ic name="plus" size={13} /> Produkt anlegen</>
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

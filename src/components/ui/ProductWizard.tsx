'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useData } from '@/lib/data-context';
import { useAiConfig } from '@/lib/ai-config';
import { Ic } from '@/components/ui/icons';
import { t } from '@/lib/i18n';
import { useLang } from '@/lib/lang-context';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'basic' | 'pricing' | 'review';

const STEPS: { key: Step; labelKey: string }[] = [
  { key: 'basic',   labelKey: 'wiz_step_basic' },
  { key: 'pricing', labelKey: 'wiz_step_pricing' },
  { key: 'review',  labelKey: 'wiz_step_review' },
];

const UNITS = ['kg', 't', 'Stk', 'L'];

interface Variant { v: string; grade: string; stock: number; }
interface BasicState {
  name: string; cat: string; origin: string; hs: string;
  unit: string; packaging: string; moq: string;
}
interface PricingState {
  buyPrice: number; sellPrice: number; certs: string;
  exportReady: boolean; variants: Variant[];
}
interface WizardState { basic: BasicState; pricing: PricingState; }

const initState = (): WizardState => ({
  basic:   { name: '', cat: '', origin: '', hs: '', unit: 'kg', packaging: '', moq: '' },
  pricing: { buyPrice: 0, sellPrice: 0, certs: '', exportReady: false, variants: [{ v: '', grade: '', stock: 0 }] },
});

// ── HS-Code product database ──────────────────────────────────────────────────

interface HsSugg { code: string; desc: string; confidence: number; }
interface ProductEntry {
  hs: HsSugg[]; unit: string; packaging: string; moq: string;
  cat: string; expectedHsPrefix: string;
}

const PRODUCT_DB: Record<string, ProductEntry> = {
  'kaffee': {
    hs: [
      { code: '0901.11', desc: 'Nicht geröstet, nicht entkoffeiniert', confidence: 92 },
      { code: '0901.12', desc: 'Nicht geröstet, entkoffeiniert',       confidence: 65 },
      { code: '0901.21', desc: 'Geröstet, nicht entkoffeiniert',       confidence: 58 },
      { code: '0901.22', desc: 'Geröstet, entkoffeiniert',             confidence: 45 },
    ],
    unit: 'kg', packaging: '60 kg Jutesack', moq: '1.000 kg', cat: 'Kaffee',
    expectedHsPrefix: '0901',
  },
  'cashew': {
    hs: [
      { code: '0801.31', desc: 'In der Schale', confidence: 88 },
      { code: '0801.32', desc: 'Geschält',      confidence: 75 },
    ],
    unit: 'kg', packaging: '25 kg Karton', moq: '5.000 kg', cat: 'Nüsse',
    expectedHsPrefix: '0801',
  },
  'avocado': {
    hs: [{ code: '0804.40', desc: 'Avocados, frisch oder getrocknet', confidence: 95 }],
    unit: 'kg', packaging: '4 kg Karton', moq: '2.000 kg', cat: 'Obst & Gemüse',
    expectedHsPrefix: '0804',
  },
  'tee': {
    hs: [
      { code: '0902.30', desc: 'Schwarzer Tee, fermentiert',   confidence: 85 },
      { code: '0902.10', desc: 'Grüner Tee, nicht fermentiert', confidence: 78 },
    ],
    unit: 'kg', packaging: '50 kg Sack', moq: '1.000 kg', cat: 'Tee',
    expectedHsPrefix: '0902',
  },
  'kakao': {
    hs: [
      { code: '1801.00', desc: 'Kakaobohnen, ganz oder gebrochen', confidence: 94 },
      { code: '1802.00', desc: 'Kakaoschalen und Abfälle',          confidence: 60 },
    ],
    unit: 'kg', packaging: '65 kg Jutesack', moq: '1.000 kg', cat: 'Kakao',
    expectedHsPrefix: '1801',
  },
  'sesam': {
    hs: [{ code: '1207.40', desc: 'Sesamsamen', confidence: 96 }],
    unit: 'kg', packaging: '50 kg PP-Sack', moq: '10.000 kg', cat: 'Ölsaaten',
    expectedHsPrefix: '1207',
  },
  'macadamia': {
    hs: [
      { code: '0802.61', desc: 'In der Schale', confidence: 88 },
      { code: '0802.62', desc: 'Geschält',      confidence: 82 },
    ],
    unit: 'kg', packaging: '12.5 kg Karton', moq: '2.000 kg', cat: 'Nüsse',
    expectedHsPrefix: '0802',
  },
  'vanille': {
    hs: [
      { code: '0905.10', desc: 'Weder gemahlen noch gepulvert', confidence: 94 },
      { code: '0905.20', desc: 'Gemahlen oder gepulvert',       confidence: 75 },
    ],
    unit: 'kg', packaging: '5 kg Vakuumbeutel', moq: '100 kg', cat: 'Gewürze',
    expectedHsPrefix: '0905',
  },
  'ingwer': {
    hs: [
      { code: '0910.11', desc: 'Weder gemahlen noch gepulvert', confidence: 92 },
      { code: '0910.12', desc: 'Gemahlen oder gepulvert',       confidence: 80 },
    ],
    unit: 'kg', packaging: '20 kg Sack', moq: '2.000 kg', cat: 'Gewürze',
    expectedHsPrefix: '0910',
  },
  'bohnen': {
    hs: [
      { code: '0713.33', desc: 'Kidney- / Gartenbohnen, getrocknet', confidence: 85 },
      { code: '0713.39', desc: 'Andere Bohnen, getrocknet',          confidence: 75 },
    ],
    unit: 'kg', packaging: '50 kg Sack', moq: '5.000 kg', cat: 'Hülsenfrüchte',
    expectedHsPrefix: '0713',
  },
  'blumen': {
    hs: [
      { code: '0603.11', desc: 'Schnittblumen frisch – Rosen',  confidence: 85 },
      { code: '0603.19', desc: 'Schnittblumen frisch – andere', confidence: 78 },
    ],
    unit: 'Stk', packaging: '10 Stk/Bund', moq: '500 Stk', cat: 'Schnittblumen',
    expectedHsPrefix: '0603',
  },
};

function detectProduct(name: string): [string, ProductEntry] | null {
  const n = name.toLowerCase().trim();
  if (!n) return null;
  return Object.entries(PRODUCT_DB).find(([key]) => n.includes(key)) ?? null;
}

// ── Shared input style ────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};
const smallInputStyle: React.CSSProperties = { ...inputStyle, padding: '5px 8px', fontSize: 12 };

// ── Props ─────────────────────────────────────────────────────────────────────

interface ProductWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProductWizard({ open, onClose, onSuccess }: ProductWizardProps) {
  const lang = useLang();
  const { data: M, refresh } = useData();
  const { generate, isConfigured } = useAiConfig();

  const [step, setStep]         = useState<Step>('basic');
  const [state, setState]       = useState<WizardState>(initState);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newId, setNewId]       = useState('');

  // Smart suggestion state
  const [suggestion, setSuggestion]     = useState<[string, ProductEntry] | null>(null);
  const [sugDismissed, setSugDismissed] = useState(false);
  const sugTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // AI autofill state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState<string | null>(null);

  // Re-detect product suggestion on name change
  useEffect(() => {
    setSugDismissed(false);
    setAiError(null);
    if (sugTimerRef.current) clearTimeout(sugTimerRef.current);
    sugTimerRef.current = setTimeout(() => {
      setSuggestion(detectProduct(state.basic.name));
    }, 350);
    return () => { if (sugTimerRef.current) clearTimeout(sugTimerRef.current); };
  }, [state.basic.name]);

  const updateBasic   = (key: keyof BasicState, val: string) =>
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
    setStep('basic'); setState(initState()); setSaving(false);
    setSaveError(null); setNewId(''); setSuggestion(null);
    setSugDismissed(false); setAiLoading(false); setAiError(null);
  };
  const handleClose = () => { reset(); onClose(); };

  // Apply suggestion to form fields
  const applySuggestion = (entry: ProductEntry, hsCode?: string) => {
    if (!state.basic.cat) updateBasic('cat', entry.cat);
    updateBasic('unit', entry.unit);
    updateBasic('packaging', entry.packaging);
    updateBasic('moq', entry.moq);
    if (hsCode) updateBasic('hs', hsCode);
    else if (!state.basic.hs) updateBasic('hs', entry.hs[0]?.code ?? '');
    setSugDismissed(true);
  };

  // AI autofill
  const handleAiFill = async () => {
    if (!state.basic.name.trim()) { setAiError(t(lang, 'wiz_ai_no_name')); return; }
    if (!isConfigured) { setAiError(t(lang, 'wiz_ai_no_key')); return; }
    setAiLoading(true); setAiError(null);
    try {
      const { basic } = state;
      const prompt =
        `Produkt: ${basic.name}${basic.origin ? `, Herkunft: ${basic.origin}` : ''}${basic.cat ? `, Kategorie: ${basic.cat}` : ''}\n\n` +
        `Gib mir die Stammdaten als JSON zurück (NUR JSON, kein Text darum):\n` +
        `{"hs":"","unit":"kg","packaging":"","moq":"","cat":""}`;
      const raw = await generate(
        prompt,
        'Du bist Spezialist für EU-Zolltarife und Ostafrika-Export. Antworte ausschließlich mit einem validen JSON-Objekt — kein Markdown, kein Text, nur JSON.',
      );
      const cleaned = raw.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
      const parsed  = JSON.parse(cleaned);
      if (parsed.hs)                               updateBasic('hs',        parsed.hs);
      if (parsed.unit && UNITS.includes(parsed.unit)) updateBasic('unit',   parsed.unit);
      if (parsed.packaging)                        updateBasic('packaging', parsed.packaging);
      if (parsed.moq)                              updateBasic('moq',       parsed.moq);
      if (parsed.cat && !state.basic.cat)          updateBasic('cat',       parsed.cat);
      setSugDismissed(true);
    } catch (e) {
      setAiError(`KI-Fehler: ${(e as Error).message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const stepIdx = STEPS.findIndex(s => s.key === step);
  const canNext = step === 'basic' ? !!state.basic.name.trim() : true;
  const goNext  = () => { if (stepIdx < STEPS.length - 1) setStep(STEPS[stepIdx + 1].key); };
  const goBack  = () => { if (stepIdx > 0) setStep(STEPS[stepIdx - 1].key); };

  const { buyPrice, sellPrice } = state.pricing;
  const margin = sellPrice > 0 ? Math.round((sellPrice - buyPrice) / sellPrice * 100) : 0;

  const handleSave = async () => {
    if (!M) return;
    setSaving(true); setSaveError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const { basic, pricing } = state;
      const certsArr = pricing.certs.split(',').map(s => s.trim()).filter(Boolean);
      const ids = M.products.map(p => parseInt(p.id.replace('PRD-', '')) || 0);
      const nextId = `PRD-${String(Math.max(0, ...ids) + 1).padStart(3, '0')}`;
      const { error: sbErr } = await sb.from('products').insert({
        id: nextId, name: basic.name, cat: basic.cat, origin: basic.origin,
        hs: basic.hs, unit: basic.unit, packaging: basic.packaging, moq: basic.moq,
        buy_price: pricing.buyPrice, sell_price: pricing.sellPrice, margin,
        export_ready: pricing.exportReady, variants: pricing.variants,
        certs: certsArr, buyers_count: 0, suppliers_count: 0,
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

  // ── HS validation warning ─────────────────────────────────────────────────

  const hsWarning = (() => {
    if (!state.basic.hs || !suggestion || sugDismissed) return null;
    const [, entry] = suggestion;
    if (!state.basic.hs.startsWith(entry.expectedHsPrefix)) {
      return `Für ${suggestion[0].charAt(0).toUpperCase() + suggestion[0].slice(1)} erwartet: ${entry.expectedHsPrefix}xx`;
    }
    return null;
  })();

  // ── Step: Basic ───────────────────────────────────────────────────────────

  const renderBasic = () => {
    const showSug = suggestion !== null && !sugDismissed;
    const [sugKey, sugEntry] = suggestion ?? ['', null as unknown as ProductEntry];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Name field */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Name *</div>
          <input
            autoFocus
            type="text"
            value={state.basic.name}
            onChange={e => updateBasic('name', e.target.value)}
            placeholder={t(lang, 'wiz_row_product')}
            style={inputStyle}
          />
        </div>

        {/* Smart suggestion card */}
        {showSug && (
          <div style={{
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 8, padding: '10px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t(lang, 'wiz_product_detect')}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>–</span>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{sugKey}</span>
              <button
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 14, lineHeight: 1, padding: 0 }}
                onClick={() => setSugDismissed(true)}
              >
                ×
              </button>
            </div>

            {/* HS code suggestions */}
            <div style={{ marginBottom: 10 }}>
              {sugEntry.hs.map(h => (
                <div
                  key={h.code}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
                    borderRadius: 5, cursor: 'pointer', marginBottom: 2,
                    background: state.basic.hs === h.code ? 'rgba(99,102,241,0.15)' : 'transparent',
                    border: state.basic.hs === h.code ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                  }}
                  onClick={() => updateBasic('hs', h.code)}
                >
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
                    color: '#a78bfa', width: 60, flexShrink: 0,
                  }}>{h.code}</span>
                  <span style={{ flex: 1, fontSize: 11, color: 'var(--text-2)' }}>{h.desc}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                    background: h.confidence >= 90 ? 'rgba(52,211,153,0.15)' : h.confidence >= 70 ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)',
                    color: h.confidence >= 90 ? '#34d399' : h.confidence >= 70 ? '#fbbf24' : 'var(--text-3)',
                  }}>{h.confidence}%</span>
                </div>
              ))}
            </div>

            {/* Suggested field values */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {[
                { l: t(lang, 'wiz_row_unit'),      v: sugEntry.unit },
                { l: t(lang, 'wiz_row_packaging'),  v: sugEntry.packaging },
                { l: 'MOQ',                         v: sugEntry.moq },
              ].map(item => (
                <span key={item.l} style={{
                  fontSize: 10.5, padding: '2px 7px', borderRadius: 4,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-2)',
                }}>
                  <span style={{ color: 'var(--text-3)' }}>{item.l}: </span>{item.v}
                </span>
              ))}
            </div>

            <button
              className="btn primary"
              style={{ fontSize: 11, height: 26 }}
              onClick={() => applySuggestion(sugEntry)}
            >
              {t(lang, 'wiz_product_apply')}
            </button>
          </div>
        )}

        {/* Cat + Origin */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>{t(lang, 'wiz_row_cat')}</div>
            <input
              type="text" value={state.basic.cat}
              onChange={e => updateBasic('cat', e.target.value)}
              placeholder="z.B. Kaffee, Cashews, Avocado"
              style={inputStyle}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>{t(lang, 'wiz_row_origin')}</div>
            <input
              type="text" value={state.basic.origin}
              onChange={e => updateBasic('origin', e.target.value)}
              placeholder="z.B. TZ, KE"
              style={inputStyle}
            />
          </div>
        </div>

        {/* HS Code + Unit */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>{t(lang, 'wiz_row_hs_code')}</div>
            <input
              type="text" value={state.basic.hs}
              onChange={e => updateBasic('hs', e.target.value)}
              placeholder="z.B. 0901.11"
              style={{ ...inputStyle, borderColor: hsWarning ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.1)' }}
            />
            {hsWarning && (
              <div style={{
                marginTop: 4, fontSize: 10.5, color: '#fbbf24',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <span>⚠</span> {hsWarning}
                {suggestion && (
                  <button
                    style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa', fontSize: 10.5, padding: 0, textDecoration: 'underline' }}
                    onClick={() => updateBasic('hs', suggestion[1].hs[0]?.code ?? '')}
                  >
                    {t(lang, 'wiz_hs_apply')}
                  </button>
                )}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500 }}>{t(lang, 'wiz_row_unit')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {UNITS.map(u => (
                <span
                  key={u}
                  className={`chip${state.basic.unit === u ? ' on' : ''}`}
                  onClick={() => updateBasic('unit', u)}
                  style={{ cursor: 'pointer' }}
                >{u}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Packaging + MOQ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>{t(lang, 'wiz_row_packaging')}</div>
            <input
              type="text" value={state.basic.packaging}
              onChange={e => updateBasic('packaging', e.target.value)}
              placeholder="z.B. 60 kg Jutesack"
              style={inputStyle}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>{t(lang, 'wiz_row_moq')}</div>
            <input
              type="text" value={state.basic.moq}
              onChange={e => updateBasic('moq', e.target.value)}
              placeholder="z.B. 1000 kg"
              style={inputStyle}
            />
          </div>
        </div>

        {/* AI error */}
        {aiError && (
          <div style={{ padding: '7px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11, color: '#f87171' }}>
            {aiError}
          </div>
        )}
      </div>
    );
  };

  // ── Step: Pricing ─────────────────────────────────────────────────────────

  const renderPricing = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>{t(lang, 'wiz_row_buy_price')}</div>
          <input
            type="number" min={0} step={0.01} value={state.pricing.buyPrice || ''}
            onChange={e => updatePricing('buyPrice', parseFloat(e.target.value) || 0)}
            placeholder="0.00" style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>{t(lang, 'wiz_row_sell_price')}</div>
          <input
            type="number" min={0} step={0.01} value={state.pricing.sellPrice || ''}
            onChange={e => updatePricing('sellPrice', parseFloat(e.target.value) || 0)}
            placeholder="0.00" style={inputStyle}
          />
        </div>
      </div>

      <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 12.5 }}>
        <span style={{ color: 'var(--text-3)' }}>{t(lang, 'margin')}: </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: margin >= 20 ? '#34d399' : margin >= 10 ? '#fbbf24' : margin > 0 ? '#f87171' : 'var(--text-3)' }}>
          {`${margin}%`}
        </span>
      </div>

      <div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>{t(lang, 'wiz_row_certs')}</div>
        <input
          type="text" value={state.pricing.certs}
          onChange={e => updatePricing('certs', e.target.value)}
          placeholder="z.B. Fairtrade, Organic" style={inputStyle}
        />
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 3 }}>{t(lang, 'wiz_comma_sep')}</div>
      </div>

      <div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500 }}>{t(lang, 'wiz_row_export_status')}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span
            className={`chip${state.pricing.exportReady ? ' on' : ''}`}
            onClick={() => updatePricing('exportReady', !state.pricing.exportReady)}
            style={{ cursor: 'pointer' }}
          >{t(lang, 'wiz_export_ready')}</span>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500 }}>{t(lang, 'wiz_row_variants')}</div>
        <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', background: 'rgba(255,255,255,0.04)', padding: '6px 10px', fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>{t(lang, 'wiz_variant_col')}</span><span>{t(lang, 'wiz_variant_grade')}</span><span>{t(lang, 'wiz_variant_stock')}</span>
          </div>
          {state.pricing.variants.map((vr, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 6, padding: '6px 10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <input type="text" value={vr.v} onChange={e => updateVariant(i, 'v', e.target.value)} placeholder="z.B. Arabica" style={smallInputStyle} />
              <input type="text" value={vr.grade} onChange={e => updateVariant(i, 'grade', e.target.value)} placeholder="z.B. AA" style={smallInputStyle} />
              <input type="number" min={0} value={vr.stock || ''} onChange={e => updateVariant(i, 'stock', parseFloat(e.target.value) || 0)} placeholder="0" style={smallInputStyle} />
            </div>
          ))}
        </div>
        <button className="btn ghost" onClick={addVariant} style={{ marginTop: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Ic name="plus" size={12} /> {t(lang, 'wiz_add_variant')}
        </button>
      </div>
    </div>
  );

  // ── Step: Review ──────────────────────────────────────────────────────────

  const renderReview = () => {
    if (newId) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic name="check" size={26} color="#34d399" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{t(lang, 'wiz_product_done')}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: '#a78bfa', fontWeight: 600, marginBottom: 4 }}>{newId}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{state.basic.name} · {state.basic.cat}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn ghost" onClick={handleClose}>{t(lang, 'close')}</button>
            <button className="btn primary" onClick={() => { onSuccess(); handleClose(); }}>
              <Ic name="eye" size={13} /> {t(lang, 'wiz_product_view')}
            </button>
          </div>
        </div>
      );
    }

    const { basic, pricing } = state;
    const rows = [
      { l: t(lang, 'wiz_row_name'),          v: basic.name || '—' },
      { l: t(lang, 'wiz_row_cat'),            v: basic.cat || '—' },
      { l: t(lang, 'wiz_row_origin'),         v: basic.origin || '—' },
      { l: t(lang, 'wiz_row_hs_code'),        v: basic.hs || '—' },
      { l: t(lang, 'wiz_row_unit'),           v: basic.unit },
      { l: t(lang, 'wiz_row_packaging'),      v: basic.packaging || '—' },
      { l: 'MOQ',                             v: basic.moq || '—' },
      { l: t(lang, 'wiz_row_buy_price'),      v: `${pricing.buyPrice.toFixed(2)} €` },
      { l: t(lang, 'wiz_row_sell_price'),     v: `${pricing.sellPrice.toFixed(2)} €` },
      { l: t(lang, 'margin'),                 v: `${margin}%` },
      { l: t(lang, 'wiz_row_certs'),          v: pricing.certs || '—' },
      { l: t(lang, 'wiz_export_ready'),       v: pricing.exportReady ? t(lang, 'yes') : t(lang, 'no') },
      { l: t(lang, 'wiz_row_variants'),       v: `${pricing.variants.filter(v => v.v).length} ${t(lang, 'wiz_defined')}` },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t(lang, 'overview')}</div>
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

  // ── Render ────────────────────────────────────────────────────────────────

  const isSuccess = !!newId;

  return (
    <div className="overlay" onClick={handleClose} style={{ alignItems: 'flex-start', paddingTop: '5vh' }}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ width: '92vw', maxWidth: 520, maxHeight: '88vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isSuccess ? 0 : 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(99,102,241,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic name="product" size={14} color="#a78bfa" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{t(lang, 'wiz_new_product')}</span>
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
          {step === 'basic'   && renderBasic()}
          {step === 'pricing' && renderPricing()}
          {step === 'review'  && renderReview()}
        </div>

        {/* Footer */}
        {!isSuccess && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button className="btn ghost" onClick={handleClose} style={{ fontSize: 12 }}>{t(lang, 'cancel')}</button>
            {step === 'basic' && (
              <button
                className="btn"
                onClick={handleAiFill}
                disabled={aiLoading}
                style={{ fontSize: 12, gap: 5, color: '#a78bfa', borderColor: 'rgba(99,102,241,0.3)' }}
                title={!isConfigured ? t(lang, 'wiz_ai_no_key') : t(lang, 'wiz_ai_fill')}
              >
                {aiLoading
                  ? <><div style={{ width: 11, height: 11, border: '1.5px solid rgba(167,139,250,0.3)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> {t(lang, 'wiz_ai_loading')}</>
                  : <>{t(lang, 'wiz_ai_fill')}</>
                }
              </button>
            )}
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
              <button className="btn primary" onClick={handleSave} disabled={saving} style={{ minWidth: 150, gap: 6 }}>
                {saving
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      {t(lang, 'creating')}
                    </span>
                  : <><Ic name="plus" size={13} /> {t(lang, 'wiz_product_create')}</>
                }
              </button>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

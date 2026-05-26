'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Ic } from '@/components/ui/icons';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'basic' | 'details' | 'review';

const STEPS: { key: Step; label: string }[] = [
  { key: 'basic',   label: 'Basis' },
  { key: 'details', label: 'Produkte & Zertifikate' },
  { key: 'review',  label: 'Prüfen' },
];

interface BasicState {
  name: string;
  type: string;
  country: string;
  region: string;
  city: string;
  contact: string;
  phone: string;
  email: string;
}

interface DetailsState {
  products: string;
  certs: string;
  capacity: string;
  tier: string;
  risk: string;
}

interface WizardState {
  basic: BasicState;
  details: DetailsState;
}

const initState = (): WizardState => ({
  basic: { name: '', type: 'Produzent', country: '', region: '', city: '', contact: '', phone: '', email: '' },
  details: { products: '', certs: '', capacity: '', tier: 'B', risk: 'mittel' },
});

// ── Shared input style ────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface SupplierWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ── Main component ────────────────────────────────────────────────────────────

export function SupplierWizard({ open, onClose, onSuccess }: SupplierWizardProps) {
  const { data: M, refresh } = useData();
  const [step, setStep] = useState<Step>('basic');
  const [state, setState] = useState<WizardState>(initState);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newId, setNewId] = useState('');

  const updateBasic = (key: keyof BasicState, val: string) =>
    setState(prev => ({ ...prev, basic: { ...prev.basic, [key]: val } }));

  const updateDetails = (key: keyof DetailsState, val: string) =>
    setState(prev => ({ ...prev, details: { ...prev.details, [key]: val } }));

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
    if (step === 'details') return true;
    return true;
  })();

  const goNext = () => { if (stepIdx < STEPS.length - 1) setStep(STEPS[stepIdx + 1].key); };
  const goBack = () => { if (stepIdx > 0) setStep(STEPS[stepIdx - 1].key); };

  const handleSave = async () => {
    if (!M) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const { basic, details } = state;
      const productsArr = details.products.split(',').map(s => s.trim()).filter(Boolean);
      const certsArr = details.certs.split(',').map(s => s.trim()).filter(Boolean);
      const ids = M.suppliers.map(s => parseInt(s.id.replace('SUP-', '')) || 0);
      const nextId = `SUP-${String(Math.max(0, ...ids) + 1).padStart(3, '0')}`;
      const { error: sbErr } = await sb.from('suppliers').insert({
        id: nextId,
        name: basic.name,
        type: basic.type,
        country: basic.country,
        region: basic.region,
        city: basic.city,
        contact: basic.contact,
        phone: basic.phone,
        email: basic.email,
        products: productsArr,
        certs: certsArr,
        capacity: details.capacity,
        tier: details.tier,
        risk: details.risk,
        score: 0, rel: 0, qual: 0, comm: 0, price: 0, docs: 0,
        status: 'aktiv',
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
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>Name *</div>
          <input
            autoFocus
            type="text"
            value={state.basic.name}
            onChange={e => updateBasic('name', e.target.value)}
            placeholder="Lieferantenname"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>Typ</div>
          <select
            value={state.basic.type}
            onChange={e => updateBasic('type', e.target.value)}
            style={inputStyle}
          >
            {['Produzent', 'Exporteur', 'Kooperative', 'Händler'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>Land</div>
          <input
            type="text"
            value={state.basic.country}
            onChange={e => updateBasic('country', e.target.value)}
            placeholder="z.B. TZ"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>Region</div>
          <input
            type="text"
            value={state.basic.region}
            onChange={e => updateBasic('region', e.target.value)}
            placeholder="z.B. Arusha"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>Stadt</div>
          <input
            type="text"
            value={state.basic.city}
            onChange={e => updateBasic('city', e.target.value)}
            placeholder="z.B. Arusha"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>Kontaktperson</div>
          <input
            type="text"
            value={state.basic.contact}
            onChange={e => updateBasic('contact', e.target.value)}
            placeholder="Name"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>Telefon</div>
          <input
            type="text"
            value={state.basic.phone}
            onChange={e => updateBasic('phone', e.target.value)}
            placeholder="+255 ..."
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>E-Mail</div>
          <input
            type="email"
            value={state.basic.email}
            onChange={e => updateBasic('email', e.target.value)}
            placeholder="email@example.com"
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );

  // ── Step: Details ───────────────────────────────────────────────────────────

  const renderDetails = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>Produkte</div>
        <input
          type="text"
          value={state.details.products}
          onChange={e => updateDetails('products', e.target.value)}
          placeholder="z.B. Kaffee, Cashews"
          style={inputStyle}
        />
        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>Kommagetrennt</div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>Zertifikate</div>
        <input
          type="text"
          value={state.details.certs}
          onChange={e => updateDetails('certs', e.target.value)}
          placeholder="z.B. Fairtrade, Organic"
          style={inputStyle}
        />
        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>Kommagetrennt</div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>Kapazität</div>
        <input
          type="text"
          value={state.details.capacity}
          onChange={e => updateDetails('capacity', e.target.value)}
          placeholder="z.B. 500 t/Monat"
          style={inputStyle}
        />
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Tier</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['A', 'B', 'C'].map(t => (
            <span
              key={t}
              className={`chip${state.details.tier === t ? ' on' : ''}`}
              onClick={() => updateDetails('tier', t)}
              style={{ cursor: 'pointer' }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Risiko</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['niedrig', 'mittel', 'hoch'].map(r => (
            <span
              key={r}
              className={`chip${state.details.risk === r ? ' on' : ''}`}
              onClick={() => updateDetails('risk', r)}
              style={{ cursor: 'pointer' }}
            >
              {r}
            </span>
          ))}
        </div>
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
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Lieferant angelegt!</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: '#a78bfa', fontWeight: 600, marginBottom: 4 }}>{newId}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{state.basic.name} · {state.basic.country}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn ghost" onClick={handleClose}>Schließen</button>
            <button className="btn primary" onClick={() => { onSuccess(); handleClose(); }}>
              <Ic name="eye" size={13} /> Lieferant ansehen
            </button>
          </div>
        </div>
      );
    }

    const { basic, details } = state;
    const rows = [
      { l: 'Name',          v: basic.name || '—' },
      { l: 'Typ',           v: basic.type || '—' },
      { l: 'Land',          v: basic.country || '—' },
      { l: 'Region',        v: basic.region || '—' },
      { l: 'Stadt',         v: basic.city || '—' },
      { l: 'Kontakt',       v: basic.contact || '—' },
      { l: 'Telefon',       v: basic.phone || '—' },
      { l: 'E-Mail',        v: basic.email || '—' },
      { l: 'Produkte',      v: details.products || '—' },
      { l: 'Zertifikate',   v: details.certs || '—' },
      { l: 'Kapazität',     v: details.capacity || '—' },
      { l: 'Tier',          v: details.tier },
      { l: 'Risiko',        v: details.risk },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Übersicht</div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12.5, gap: 8 }}>
            <span style={{ color: 'var(--text-muted)', width: 100, flexShrink: 0 }}>{r.l}</span>
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
        style={{ width: '92vw', maxWidth: 480, maxHeight: '88vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isSuccess ? 0 : 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(99,102,241,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic name="supplier" size={14} color="#a78bfa" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Neuer Lieferant</span>
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
                        color: done ? '#fff' : current ? '#a78bfa' : 'var(--text-muted)',
                        fontWeight: 600, boxShadow: current ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
                      }}>
                        {done ? '✓' : i + 1}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: current ? 600 : 400, color: current ? 'var(--text)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
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
          {step === 'details' && renderDetails()}
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
                style={{ minWidth: 160, gap: 6 }}
              >
                {saving ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Wird angelegt…
                  </span>
                ) : (
                  <><Ic name="plus" size={13} /> Lieferant anlegen</>
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

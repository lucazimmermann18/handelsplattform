'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Ic } from '@/components/ui/icons';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'basic' | 'trading' | 'review';

const STEPS: { key: Step; label: string }[] = [
  { key: 'basic',   label: 'Basis' },
  { key: 'trading', label: 'Handelskonditionen' },
  { key: 'review',  label: 'Prüfen' },
];

const INCOTERMS = ['FOB', 'CIF', 'CFR', 'EXW', 'DAP'];

interface BasicState {
  name: string;
  country: string;
  city: string;
  industry: string;
  contact: string;
  position: string;
  phone: string;
  email: string;
}

interface TradingState {
  incoterm: string;
  moq: string;
  terms: string;
  interests: string;
}

interface WizardState {
  basic: BasicState;
  trading: TradingState;
}

const initState = (): WizardState => ({
  basic: { name: '', country: '', city: '', industry: '', contact: '', position: '', phone: '', email: '' },
  trading: { incoterm: 'FOB', moq: '', terms: '', interests: '' },
});

// ── Shared input style ────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface BuyerWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ── Main component ────────────────────────────────────────────────────────────

export function BuyerWizard({ open, onClose, onSuccess }: BuyerWizardProps) {
  const { data: M, refresh } = useData();
  const [step, setStep] = useState<Step>('basic');
  const [state, setState] = useState<WizardState>(initState);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newId, setNewId] = useState('');

  const updateBasic = (key: keyof BasicState, val: string) =>
    setState(prev => ({ ...prev, basic: { ...prev.basic, [key]: val } }));

  const updateTrading = (key: keyof TradingState, val: string) =>
    setState(prev => ({ ...prev, trading: { ...prev.trading, [key]: val } }));

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

  const handleSave = async () => {
    if (!M) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const { basic, trading } = state;
      const interestsArr = trading.interests.split(',').map(s => s.trim()).filter(Boolean);
      const ids = M.buyers.map(b => parseInt(b.id.replace('BUY-', '')) || 0);
      const nextId = `BUY-${String(Math.max(0, ...ids) + 1).padStart(3, '0')}`;
      const { error: sbErr } = await sb.from('buyers').insert({
        id: nextId,
        name: basic.name,
        country: basic.country,
        city: basic.city,
        industry: basic.industry,
        contact: basic.contact,
        position: basic.position,
        phone: basic.phone,
        email: basic.email,
        incoterm: trading.incoterm,
        moq: trading.moq,
        terms: trading.terms,
        interests: interestsArr,
        rating: 0,
        status: 'aktiv',
        revenue: 0,
        certs: [],
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
            placeholder="Kundenname / Unternehmen"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>Land</div>
          <input
            type="text"
            value={state.basic.country}
            onChange={e => updateBasic('country', e.target.value)}
            placeholder="z.B. DE"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>Stadt</div>
          <input
            type="text"
            value={state.basic.city}
            onChange={e => updateBasic('city', e.target.value)}
            placeholder="z.B. Hamburg"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>Branche</div>
          <input
            type="text"
            value={state.basic.industry}
            onChange={e => updateBasic('industry', e.target.value)}
            placeholder="z.B. Lebensmittelhandel"
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
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>Position</div>
          <input
            type="text"
            value={state.basic.position}
            onChange={e => updateBasic('position', e.target.value)}
            placeholder="z.B. Einkaufsleiter"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>Telefon</div>
          <input
            type="text"
            value={state.basic.phone}
            onChange={e => updateBasic('phone', e.target.value)}
            placeholder="+49 ..."
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

  // ── Step: Trading ───────────────────────────────────────────────────────────

  const renderTrading = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Incoterm</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {INCOTERMS.map(inc => (
            <span
              key={inc}
              className={`chip${state.trading.incoterm === inc ? ' on' : ''}`}
              onClick={() => updateTrading('incoterm', inc)}
              style={{ cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12 }}
            >
              {inc}
            </span>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>Mindestbestellmenge (MOQ)</div>
        <input
          type="text"
          value={state.trading.moq}
          onChange={e => updateTrading('moq', e.target.value)}
          placeholder="z.B. 5 t"
          style={inputStyle}
        />
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>Zahlungskonditionen</div>
        <input
          type="text"
          value={state.trading.terms}
          onChange={e => updateTrading('terms', e.target.value)}
          placeholder="z.B. 30% Anzahlung, 70% vor Verschiffung"
          style={inputStyle}
        />
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>Produktinteressen</div>
        <input
          type="text"
          value={state.trading.interests}
          onChange={e => updateTrading('interests', e.target.value)}
          placeholder="z.B. Kaffee, Cashews"
          style={inputStyle}
        />
        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>Kommagetrennt</div>
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
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Käufer angelegt!</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: '#a78bfa', fontWeight: 600, marginBottom: 4 }}>{newId}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{state.basic.name} · {state.basic.country}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn ghost" onClick={handleClose}>Schließen</button>
            <button className="btn primary" onClick={() => { onSuccess(); handleClose(); }}>
              <Ic name="eye" size={13} /> Käufer ansehen
            </button>
          </div>
        </div>
      );
    }

    const { basic, trading } = state;
    const rows = [
      { l: 'Name',           v: basic.name || '—' },
      { l: 'Land',           v: basic.country || '—' },
      { l: 'Stadt',          v: basic.city || '—' },
      { l: 'Branche',        v: basic.industry || '—' },
      { l: 'Kontakt',        v: basic.contact || '—' },
      { l: 'Position',       v: basic.position || '—' },
      { l: 'Telefon',        v: basic.phone || '—' },
      { l: 'E-Mail',         v: basic.email || '—' },
      { l: 'Incoterm',       v: trading.incoterm },
      { l: 'MOQ',            v: trading.moq || '—' },
      { l: 'Konditionen',    v: trading.terms || '—' },
      { l: 'Interessen',     v: trading.interests || '—' },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Übersicht</div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12.5, gap: 8 }}>
            <span style={{ color: 'var(--text-muted)', width: 110, flexShrink: 0 }}>{r.l}</span>
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
              <Ic name="buyer" size={14} color="#a78bfa" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Neuer Käufer</span>
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
          {step === 'trading' && renderTrading()}
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
                style={{ minWidth: 140, gap: 6 }}
              >
                {saving ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Wird angelegt…
                  </span>
                ) : (
                  <><Ic name="plus" size={13} /> Käufer anlegen</>
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

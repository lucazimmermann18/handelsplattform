'use client';

import React, { useState } from 'react';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

// ── Types & constants ─────────────────────────────────────────────────────────

type Step = 'basic' | 'services' | 'review';

const STEPS: { key: Step; label: string }[] = [
  { key: 'basic',    label: 'Basis'   },
  { key: 'services', label: 'Dienste' },
  { key: 'review',   label: 'Prüfen'  },
];

const SERVICE_OPTIONS = [
  'Seefracht',
  'Luftfracht',
  'Lager',
  'Zollabwicklung',
  'Landtransport',
];

interface FormState {
  name: string;
  country: string;
  city: string;
  contact: string;
  email: string;
  phone: string;
  website: string;
  routes: string;
  services: string[];
  rating: number;
  notes: string;
}

const initForm = (): FormState => ({
  name: '', country: '', city: '', contact: '', email: '', phone: '', website: '',
  routes: '',
  services: [],
  rating: 0,
  notes: '',
});

// ── Shared input styles ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500,
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface ForwarderWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ── Main component ────────────────────────────────────────────────────────────

export function ForwarderWizard({ open, onClose, onSuccess }: ForwarderWizardProps) {
  const [step, setStep]       = useState<Step>('basic');
  const [form, setForm]       = useState<FormState>(initForm);
  const [saving, setSaving]   = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const reset = () => {
    setStep('basic');
    setForm(initForm());
    setSaving(false);
    setSaveError(null);
    setSavedId(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const stepIdx = STEPS.findIndex(s => s.key === step);

  const goNext = () => { if (stepIdx < STEPS.length - 1) setStep(STEPS[stepIdx + 1].key); };
  const goBack = () => { if (stepIdx > 0) setStep(STEPS[stepIdx - 1].key); };

  const canNext =
    step === 'basic'    ? !!form.name.trim() :
    step === 'services' ? true :
    true;

  const toggleService = (s: string) =>
    update('services', form.services.includes(s)
      ? form.services.filter(x => x !== s)
      : [...form.services, s]);

  const submit = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const nextId = `FWD-${Date.now().toString().slice(-6)}`;
      const routesArr = form.routes.split(',').map(s => s.trim()).filter(Boolean);
      const { error } = await sb.from('forwarders').insert({
        id: nextId, name: form.name, country: form.country, city: form.city,
        contact: form.contact, email: form.email, phone: form.phone,
        website: form.website || null, rating: form.rating,
        routes: routesArr, services: form.services,
        status: 'aktiv', notes: form.notes || null,
      });
      if (error) throw new Error(error.message);
      setSavedId(nextId);
      onSuccess();
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  // ── Step: Basic ─────────────────────────────────────────────────────────────

  const renderBasic = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={labelStyle}>Name <span style={{ color: '#f87171' }}>*</span></div>
          <input
            autoFocus
            value={form.name}
            onChange={e => update('name', e.target.value)}
            placeholder="z.B. Hapag-Lloyd Forwarding GmbH"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={labelStyle}>Land</div>
          <input
            value={form.country}
            onChange={e => update('country', e.target.value)}
            placeholder="z.B. DE"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={labelStyle}>Stadt</div>
          <input
            value={form.city}
            onChange={e => update('city', e.target.value)}
            placeholder="z.B. Hamburg"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={labelStyle}>Ansprechpartner</div>
          <input
            value={form.contact}
            onChange={e => update('contact', e.target.value)}
            placeholder="z.B. Max Mustermann"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={labelStyle}>E-Mail</div>
          <input
            type="email"
            value={form.email}
            onChange={e => update('email', e.target.value)}
            placeholder="kontakt@spediteur.de"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={labelStyle}>Telefon</div>
          <input
            value={form.phone}
            onChange={e => update('phone', e.target.value)}
            placeholder="+49 40 123456"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={labelStyle}>Website</div>
          <input
            value={form.website}
            onChange={e => update('website', e.target.value)}
            placeholder="https://www.spediteur.de"
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );

  // ── Step: Services ──────────────────────────────────────────────────────────

  const renderServices = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Routes */}
      <div>
        <div style={labelStyle}>Routen (kommagetrennt)</div>
        <input
          value={form.routes}
          onChange={e => update('routes', e.target.value)}
          placeholder="z.B. DAR-HAM, MOM-DXB, NBO-AMS"
          style={inputStyle}
        />
      </div>

      {/* Services multi-select */}
      <div>
        <div style={labelStyle}>Dienstleistungen</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 6 }}>
          {SERVICE_OPTIONS.map(s => {
            const on = form.services.includes(s);
            return (
              <span
                key={s}
                className={`chip${on ? ' on' : ''}`}
                onClick={() => toggleService(s)}
                style={{ cursor: 'pointer' }}
              >
                {s}
              </span>
            );
          })}
        </div>
      </div>

      {/* Rating */}
      <div>
        <div style={labelStyle}>Bewertung</div>
        <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
          {[1, 2, 3, 4, 5].map(star => (
            <span
              key={star}
              onClick={() => update('rating', star === form.rating ? 0 : star)}
              style={{
                fontSize: 24,
                cursor: 'pointer',
                color: star <= form.rating ? '#fbbf24' : 'rgba(255,255,255,0.15)',
                lineHeight: 1,
                transition: 'color 0.1s',
              }}
            >
              ★
            </span>
          ))}
          {form.rating > 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6, alignSelf: 'center' }}>
              {form.rating} / 5
            </span>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <div style={labelStyle}>Notizen</div>
        <textarea
          value={form.notes}
          onChange={e => update('notes', e.target.value)}
          rows={3}
          placeholder="Interne Notizen zum Spediteur…"
          style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
        />
      </div>
    </div>
  );

  // ── Step: Review ────────────────────────────────────────────────────────────

  const renderReview = () => {
    if (savedId) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic name="check" size={26} color="#34d399" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Spediteur angelegt!</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: '#a78bfa', fontWeight: 600, marginBottom: 4 }}>{savedId}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {form.name}{form.city ? ` · ${form.city}` : ''}{form.country ? `, ${form.country}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn primary" onClick={handleClose}>
              <Ic name="check" size={13} /> Fertig
            </button>
          </div>
        </div>
      );
    }

    const routesArr = form.routes.split(',').map(s => s.trim()).filter(Boolean);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
          Zusammenfassung
        </div>

        {[
          { l: 'Name',      v: form.name || '—' },
          { l: 'Land',      v: form.country || '—' },
          { l: 'Stadt',     v: form.city || '—' },
          { l: 'Kontakt',   v: form.contact || '—' },
          { l: 'E-Mail',    v: form.email || '—' },
          { l: 'Telefon',   v: form.phone || '—' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12.5, gap: 8 }}>
            <span style={{ color: 'var(--text-muted)', width: 90, flexShrink: 0 }}>{r.l}</span>
            <span style={{ fontWeight: 500 }}>{r.v}</span>
          </div>
        ))}

        {/* Routes */}
        <div style={{ display: 'flex', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12.5, gap: 8 }}>
          <span style={{ color: 'var(--text-muted)', width: 90, flexShrink: 0 }}>Routen</span>
          <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            {routesArr.length > 0 ? routesArr.join(' · ') : '—'}
          </span>
        </div>

        {/* Services */}
        <div style={{ display: 'flex', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12.5, gap: 8 }}>
          <span style={{ color: 'var(--text-muted)', width: 90, flexShrink: 0 }}>Dienste</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {form.services.length > 0
              ? form.services.map(s => <Badge key={s}>{s}</Badge>)
              : <span style={{ color: 'var(--text-muted)' }}>—</span>
            }
          </div>
        </div>

        {/* Rating */}
        <div style={{ display: 'flex', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12.5, gap: 8 }}>
          <span style={{ color: 'var(--text-muted)', width: 90, flexShrink: 0 }}>Bewertung</span>
          <div style={{ display: 'flex', gap: 2 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} style={{ color: i < form.rating ? '#fbbf24' : '#3a4455', fontSize: 15 }}>★</span>
            ))}
          </div>
        </div>

        {saveError && (
          <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11.5, color: '#f87171' }}>
            {saveError}
          </div>
        )}
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const isSuccess = !!savedId;

  return (
    <div className="overlay" onClick={handleClose} style={{ alignItems: 'flex-start', paddingTop: '5vh' }}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ width: '92vw', maxWidth: 620, maxHeight: '88vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isSuccess ? 0 : 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(99,102,241,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic name="ship" size={14} color="#a78bfa" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Neuer Spediteur</span>
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
          {step === 'basic'    && renderBasic()}
          {step === 'services' && renderServices()}
          {step === 'review'   && renderReview()}
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
                onClick={submit}
                disabled={saving}
                style={{ minWidth: 160, gap: 6 }}
              >
                {saving ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Wird angelegt…
                  </span>
                ) : (
                  <><Ic name="plus" size={13} /> Spediteur anlegen</>
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

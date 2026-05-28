'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { BuyerRequirement } from '@/lib/types';

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 12.5,
  padding: '6px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  fontSize: 10.5, color: 'var(--text-3)', marginBottom: 4, display: 'block',
  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
};

const STATUS_COLORS: Record<string, string> = {
  offen: '#94a3b8', teilweise: '#fbbf24', vollständig: '#34d399',
};

// ── ChipInput: comma-separated tags ───────────────────────────────────────────
const ChipInput = ({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) => {
  const [input, setInput] = useState('');
  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
    setInput('');
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '6px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, minHeight: 38, alignItems: 'center' }}>
      {values.map((v, i) => (
        <span key={i} style={{ padding: '2px 8px', borderRadius: 20, background: 'rgba(96,165,250,0.15)', color: '#60a5fa', fontSize: 11.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          {v}
          <span onClick={() => onChange(values.filter((_, j) => j !== i))} style={{ cursor: 'pointer', opacity: 0.7, fontSize: 13, lineHeight: 1 }}>×</span>
        </span>
      ))}
      <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
        placeholder={values.length === 0 ? 'Eingabe + Enter' : ''}
        style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 12.5, fontFamily: 'inherit', minWidth: 80, flex: 1 }} />
    </div>
  );
};

// ── Requirement modal ──────────────────────────────────────────────────────────

interface RequirementModalProps {
  initial?: Partial<BuyerRequirement>;
  buyerId: string;
  onSaved: () => void;
  onClose: () => void;
}

type FormState = {
  productCategory: string; productId: string; qualityNotes: string;
  quantitySample: string; quantityFirst: string; quantityMonthly: string;
  targetPriceMin: string; targetPriceMax: string; currency: string;
  incotermPref: string; deliveryLocation: string; paymentTerms: string;
  certRequirements: string[]; docRequirements: string[];
  packagingNotes: string; otherNotes: string; status: string;
};

const RequirementModal = ({ initial, buyerId, onSaved, onClose }: RequirementModalProps) => {
  const [form, setForm] = useState<FormState>({
    productCategory: initial?.productCategory ?? '',
    productId: initial?.productId ?? '',
    qualityNotes: initial?.qualityNotes ?? '',
    quantitySample: initial?.quantitySample ?? '',
    quantityFirst: initial?.quantityFirst ?? '',
    quantityMonthly: initial?.quantityMonthly ?? '',
    targetPriceMin: String(initial?.targetPriceMin ?? ''),
    targetPriceMax: String(initial?.targetPriceMax ?? ''),
    currency: initial?.currency ?? 'EUR',
    incotermPref: initial?.incotermPref ?? '',
    deliveryLocation: initial?.deliveryLocation ?? '',
    paymentTerms: initial?.paymentTerms ?? '',
    certRequirements: initial?.certRequirements ?? [],
    docRequirements: initial?.docRequirements ?? [],
    packagingNotes: initial?.packagingNotes ?? '',
    otherNotes: initial?.otherNotes ?? '',
    status: initial?.status ?? 'offen',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof FormState, v: string | string[]) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const sb = createClient();
      const payload = {
        buyer_id: buyerId,
        product_category: form.productCategory || null,
        product_id: form.productId || null,
        quality_notes: form.qualityNotes || null,
        quantity_sample: form.quantitySample || null,
        quantity_first: form.quantityFirst || null,
        quantity_monthly: form.quantityMonthly || null,
        target_price_min: form.targetPriceMin ? parseFloat(form.targetPriceMin) : null,
        target_price_max: form.targetPriceMax ? parseFloat(form.targetPriceMax) : null,
        currency: form.currency,
        incoterm_pref: form.incotermPref || null,
        delivery_location: form.deliveryLocation || null,
        payment_terms: form.paymentTerms || null,
        cert_requirements: form.certRequirements,
        doc_requirements: form.docRequirements,
        packaging_notes: form.packagingNotes || null,
        other_notes: form.otherNotes || null,
        status: form.status,
      };
      if (initial?.id) {
        await sb.from('buyer_requirements').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', initial.id);
      } else {
        await sb.from('buyer_requirements').insert(payload);
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--bg-2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, width: '100%', maxWidth: 640, maxHeight: '92vh', overflow: 'auto', padding: 26 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{initial?.id ? 'Anforderung bearbeiten' : 'Neue Anforderung'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Produktkategorie / Produkt</label><input style={inputStyle} value={form.productCategory} onChange={e => set('productCategory', e.target.value)} placeholder="z.B. Arabica Rohkaffee, Cashewkerne W320" /></div>
            <div><label style={labelStyle}>Qualitätsanforderungen</label><textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.qualityNotes} onChange={e => set('qualityNotes', e.target.value)} placeholder="Grade, Cup Score, Feuchte, Sorte, Verarbeitung..." /></div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="offen">Offen</option>
                <option value="teilweise">Teilweise</option>
                <option value="vollständig">Vollständig</option>
              </select>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Mengen</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <div><label style={labelStyle}>Muster</label><input style={inputStyle} value={form.quantitySample} onChange={e => set('quantitySample', e.target.value)} placeholder="z.B. 500g" /></div>
              <div><label style={labelStyle}>Erste Lieferung</label><input style={inputStyle} value={form.quantityFirst} onChange={e => set('quantityFirst', e.target.value)} placeholder="z.B. 2 t" /></div>
              <div><label style={labelStyle}>Monatlich</label><input style={inputStyle} value={form.quantityMonthly} onChange={e => set('quantityMonthly', e.target.value)} placeholder="z.B. 10 t / Monat" /></div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Preis & Konditionen</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 1fr 1fr', gap: 10 }}>
              <div><label style={labelStyle}>Preis min.</label><input type="number" style={inputStyle} value={form.targetPriceMin} onChange={e => set('targetPriceMin', e.target.value)} placeholder="0.00" /></div>
              <div><label style={labelStyle}>Preis max.</label><input type="number" style={inputStyle} value={form.targetPriceMax} onChange={e => set('targetPriceMax', e.target.value)} placeholder="0.00" /></div>
              <div><label style={labelStyle}>Währung</label>
                <select style={inputStyle} value={form.currency} onChange={e => set('currency', e.target.value)}>
                  {['EUR','USD','GBP','CHF'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Incoterm</label><input style={inputStyle} value={form.incotermPref} onChange={e => set('incotermPref', e.target.value)} placeholder="z.B. CIF Hamburg" /></div>
              <div><label style={labelStyle}>Lieferort</label><input style={inputStyle} value={form.deliveryLocation} onChange={e => set('deliveryLocation', e.target.value)} placeholder="Stadt / Hafen" /></div>
            </div>
            <div style={{ marginTop: 10 }}><label style={labelStyle}>Zahlungsbedingungen</label><input style={inputStyle} value={form.paymentTerms} onChange={e => set('paymentTerms', e.target.value)} placeholder="z.B. 30% Anzahlung, 70% vor Versand" /></div>
          </div>

          <div>
            <label style={labelStyle}>Zertifikate erforderlich</label>
            <ChipInput values={form.certRequirements} onChange={v => set('certRequirements', v)} />
          </div>
          <div>
            <label style={labelStyle}>Dokumente erforderlich</label>
            <ChipInput values={form.docRequirements} onChange={v => set('docRequirements', v)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Verpackungsanforderungen</label><textarea style={{ ...inputStyle, minHeight: 56, resize: 'vertical' }} value={form.packagingNotes} onChange={e => set('packagingNotes', e.target.value)} /></div>
            <div><label style={labelStyle}>Weitere Notizen</label><textarea style={{ ...inputStyle, minHeight: 56, resize: 'vertical' }} value={form.otherNotes} onChange={e => set('otherNotes', e.target.value)} /></div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
          <button onClick={onClose} style={{ padding: '7px 16px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>Abbrechen</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '7px 16px', borderRadius: 6, background: '#34d399', border: 'none', color: '#0d0f1a', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

interface TabBuyerRequirementsProps {
  buyerId: string;
  requirements: BuyerRequirement[];
  onRefresh: () => void;
}

export const TabBuyerRequirements = ({ buyerId, requirements, onRefresh }: TabBuyerRequirementsProps) => {
  const [modal, setModal] = useState<Partial<BuyerRequirement> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setExpanded(prev => {
    const s = new Set(prev);
    if (s.has(id)) { s.delete(id); } else { s.add(id); }
    return s;
  });

  const handleDelete = async (id: string) => {
    await createClient().from('buyer_requirements').delete().eq('id', id);
    onRefresh();
    setDeleteId(null);
  };

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button onClick={() => setModal({})}
          style={{ padding: '6px 14px', borderRadius: 6, background: '#34d399', border: 'none', color: '#0d0f1a', cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>
          + Anforderung
        </button>
      </div>

      {requirements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: 13 }}>
          Noch keine Anforderungen erfasst. Klicke &quot;+ Anforderung&quot; sobald ein Käufer Interesse zeigt.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {requirements.map(req => {
            const isOpen = expanded.has(req.id);
            const statusColor = STATUS_COLORS[req.status] ?? '#94a3b8';
            return (
              <div key={req.id} style={{ borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }} onClick={() => toggle(req.id)}>
                  <span style={{ fontSize: 16 }}>{isOpen ? '▾' : '▸'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 13.5 }}>{req.productCategory || 'Produktkategorie nicht definiert'}</span>
                      <span style={{ padding: '1px 7px', borderRadius: 10, fontSize: 10.5, fontWeight: 700, color: statusColor, background: `${statusColor}18`, border: `1px solid ${statusColor}30` }}>
                        {req.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                      {req.quantityMonthly && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>📦 {req.quantityMonthly}/Monat</span>}
                      {(req.targetPriceMin || req.targetPriceMax) && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>💶 {req.targetPriceMin ?? '?'} – {req.targetPriceMax ?? '?'} {req.currency}</span>}
                      {req.incotermPref && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{req.incotermPref}</span>}
                      {req.certRequirements.length > 0 && <span style={{ fontSize: 11, color: '#a78bfa' }}>✓ {req.certRequirements.slice(0, 2).join(', ')}{req.certRequirements.length > 2 ? ` +${req.certRequirements.length - 2}` : ''}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={e => { e.stopPropagation(); setModal(req); }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '3px 8px', color: 'var(--text-3)', cursor: 'pointer', fontSize: 11 }}>✏️</button>
                    <button onClick={e => { e.stopPropagation(); setDeleteId(req.id); }} style={{ background: 'none', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 5, padding: '3px 8px', color: '#f87171', cursor: 'pointer', fontSize: 11 }}>🗑</button>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
                      {req.qualityNotes && <div style={{ gridColumn: '1 / -1' }}><div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Qualität</div><p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5 }}>{req.qualityNotes}</p></div>}
                      {req.quantitySample && <div><div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Muster</div><span style={{ fontSize: 12.5 }}>{req.quantitySample}</span></div>}
                      {req.quantityFirst && <div><div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Erstlieferung</div><span style={{ fontSize: 12.5 }}>{req.quantityFirst}</span></div>}
                      {req.deliveryLocation && <div><div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Lieferort</div><span style={{ fontSize: 12.5 }}>{req.deliveryLocation}</span></div>}
                      {req.paymentTerms && <div style={{ gridColumn: '1 / -1' }}><div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Zahlungsbedingungen</div><span style={{ fontSize: 12.5 }}>{req.paymentTerms}</span></div>}
                    </div>
                    {req.certRequirements.length > 0 && <div style={{ marginBottom: 8 }}><div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Zertifikate</div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{req.certRequirements.map((c, i) => <span key={i} style={{ padding: '2px 8px', borderRadius: 20, background: 'rgba(167,139,250,0.15)', color: '#a78bfa', fontSize: 11.5 }}>{c}</span>)}</div></div>}
                    {req.docRequirements.length > 0 && <div style={{ marginBottom: 8 }}><div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Dokumente</div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{req.docRequirements.map((d, i) => <span key={i} style={{ padding: '2px 8px', borderRadius: 20, background: 'rgba(96,165,250,0.15)', color: '#60a5fa', fontSize: 11.5 }}>{d}</span>)}</div></div>}
                    {(req.packagingNotes || req.otherNotes) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {req.packagingNotes && <div><div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Verpackung</div><p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{req.packagingNotes}</p></div>}
                        {req.otherNotes && <div><div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Weitere Notizen</div><p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{req.otherNotes}</p></div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal !== null && <RequirementModal initial={modal} buyerId={buyerId} onSaved={onRefresh} onClose={() => setModal(null)} />}

      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 24, maxWidth: 340, width: '100%' }}>
            <p style={{ margin: '0 0 18px', fontSize: 14 }}>Anforderung wirklich löschen?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: '7px 14px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>Abbrechen</button>
              <button onClick={() => handleDelete(deleteId)} style={{ padding: '7px 14px', borderRadius: 6, background: '#f87171', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Löschen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

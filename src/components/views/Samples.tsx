'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

interface Sample {
  id: string;
  product: string;
  buyerId: string;
  qty: string;
  supplierId: string;
  courier: string;
  tracking: string;
  sent: string;
  status: string;
  feedback: string;
}

const statusKind: Record<string, string> = {
  delivered: 'success',
  in_transit: 'ocean',
  feedback_pending: 'warning',
  rejected: 'danger',
};

const statusLabel: Record<string, string> = {
  delivered: 'Geliefert',
  in_transit: 'Unterwegs',
  feedback_pending: 'Feedback offen',
  rejected: 'Abgelehnt',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

interface SamplesViewProps { lang: Lang; }

export const SamplesView = ({ lang: _lang }: SamplesViewProps) => {
  const { data: M } = useData();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [newSample, setNewSample] = useState(false);
  const [form, setForm] = useState({ product: '', buyerId: '', qty: '', supplierId: '', courier: '', tracking: '', sentAt: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = async () => {
    setLoadingDb(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { data } = await createClient().from('samples').select('*').order('created_at', { ascending: false });
      setSamples((data ?? []).map((r: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        id: r.id,
        product: r.product,
        buyerId: r.buyer_id,
        qty: r.qty,
        supplierId: r.supplier_id,
        courier: r.courier,
        tracking: r.tracking,
        sent: r.sent_at ?? '',
        status: r.status,
        feedback: r.feedback,
      })));
    } catch (_e) {
      // table may not exist yet, use empty array
    }
    setLoadingDb(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fld = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.product || !form.buyerId) return;
    setSaving(true); setSaveError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const id = `SMP-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
      const { error } = await createClient().from('samples').insert({
        id,
        product: form.product,
        buyer_id: form.buyerId,
        qty: form.qty || '—',
        supplier_id: form.supplierId || '',
        courier: form.courier || '',
        tracking: form.tracking || '',
        sent_at: form.sentAt || new Date().toISOString().slice(0, 10),
        status: 'in_transit',
        feedback: '—',
      });
      if (error) throw new Error(error.message);
      setNewSample(false);
      setForm({ product: '', buyerId: '', qty: '', supplierId: '', courier: '', tracking: '', sentAt: '' });
      await load();
    } catch (e) { setSaveError((e as Error).message); }
    finally { setSaving(false); }
  };

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const buyerName = (id: string) => M.buyers.find(b => b.id === id)?.name ?? id;

  const total = samples.length;
  const inTransit = samples.filter(s => s.status === 'in_transit').length;
  const feedbackPending = samples.filter(s => s.status === 'feedback_pending').length;
  const accepted = samples.filter(s => s.feedback.toLowerCase().includes('akzeptiert')).length;
  const rejected = samples.filter(s => s.status === 'rejected').length;

  return (
    <>
    <div>
      <div className="section-head">
        <h1>Musterverwaltung</h1>
        <div className="sub">Versendete Warenproben · Status · Feedback</div>
        <div className="right">
          <button className="btn primary" onClick={() => setNewSample(true)}><Ic name="plus" size={14} /> Muster erfassen</button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>

      {/* KPI Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 12 }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ color: 'var(--text-3)', marginBottom: 6 }}><Ic name="box" size={16} /></div>
          <div className="mono fw600" style={{ fontSize: 22 }}>{total}</div>
          <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Gesendet</div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ color: 'var(--text-3)', marginBottom: 6 }}><Ic name="ship" size={16} /></div>
          <div className="mono fw600" style={{ fontSize: 22, color: '#60a5fa' }}>{inTransit}</div>
          <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Auf dem Weg</div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ color: '#fbbf24', marginBottom: 6 }}><Ic name="clock" size={16} /></div>
          <div className="mono fw600" style={{ fontSize: 22, color: '#fbbf24' }}>{feedbackPending}</div>
          <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Feedback offen</div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ color: '#34d399', marginBottom: 6 }}><Ic name="quality" size={16} /></div>
          <div className="mono fw600" style={{ fontSize: 22, color: '#34d399' }}>{accepted}</div>
          <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Akzeptiert</div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ color: '#f87171', marginBottom: 6 }}><Ic name="danger" size={16} /></div>
          <div className="mono fw600" style={{ fontSize: 22, color: '#f87171' }}>{rejected}</div>
          <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Abgelehnt</div>
        </div>
      </div>

      {/* Samples Table */}
      <div className="card">
        <div className="card-head">
          <Ic name="pkg" size={14} />
          <span className="title">Alle Muster</span>
        </div>
        {loadingDb ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Lädt…</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Sample-ID</th>
                <th>Produkt</th>
                <th>Menge</th>
                <th>Käufer</th>
                <th>Versand</th>
                <th>Tracking</th>
                <th>Status</th>
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {samples.map(s => (
                <tr key={s.id}>
                  <td><span className="mono">{s.id}</span></td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{s.product}</div>
                  </td>
                  <td>{s.qty}</td>
                  <td>
                    <div style={{ fontSize: 13 }}>{buyerName(s.buyerId)}</div>
                    <div className="sub mono">{s.buyerId}</div>
                  </td>
                  <td>
                    <div>{fmtDate(s.sent)}</div>
                    <div className="sub">{s.courier}</div>
                  </td>
                  <td><span className="mono" style={{ fontSize: 11 }}>{s.tracking}</span></td>
                  <td>
                    <Badge kind={statusKind[s.status] ?? 'neutral'}>{statusLabel[s.status] ?? s.status}</Badge>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 12,
                      color: s.feedback.toLowerCase().includes('akzeptiert') ? 'var(--success)'
                        : s.feedback === '—' ? 'var(--text-3)'
                        : s.status === 'rejected' ? 'var(--danger)'
                        : 'var(--text)',
                    }}>
                      {s.feedback}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>
    </div>

    {/* Modal */}
    {newSample && (
      <div className="overlay" onClick={() => setNewSample(false)} style={{ alignItems: 'flex-start', paddingTop: '8vh' }}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 480, padding: 0, overflow: 'hidden' }}>
          {/* header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ic name="box" size={14} color="#60a5fa" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Muster erfassen</span>
            <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={() => setNewSample(false)}><Ic name="x" size={13} /></button>
          </div>
          {/* body */}
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Produkt */}
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Produkt</div>
              <input
                list="sample-products"
                value={form.product}
                onChange={e => fld('product', e.target.value)}
                placeholder="Produktname eingeben…"
                style={inputStyle}
              />
              <datalist id="sample-products">
                {M.products.map(p => <option key={p.id} value={p.name} />)}
              </datalist>
            </div>
            {/* Käufer */}
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Käufer *</div>
              <select value={form.buyerId} onChange={e => fld('buyerId', e.target.value)} style={inputStyle}>
                <option value="">— wählen —</option>
                {M.buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            {/* Menge + Lieferant */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Menge</div>
                <input
                  type="text"
                  value={form.qty}
                  onChange={e => fld('qty', e.target.value)}
                  placeholder="z.B. 500g"
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Lieferant</div>
                <select value={form.supplierId} onChange={e => fld('supplierId', e.target.value)} style={inputStyle}>
                  <option value="">— wählen —</option>
                  {M.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            {/* Kurier + Tracking */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Kurier</div>
                <input
                  type="text"
                  value={form.courier}
                  onChange={e => fld('courier', e.target.value)}
                  placeholder="z.B. DHL Express"
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Tracking</div>
                <input
                  type="text"
                  value={form.tracking}
                  onChange={e => fld('tracking', e.target.value)}
                  placeholder="Tracking-Nummer"
                  style={inputStyle}
                />
              </div>
            </div>
            {/* Sendedatum */}
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Sendedatum</div>
              <input
                type="date"
                value={form.sentAt}
                onChange={e => fld('sentAt', e.target.value)}
                style={inputStyle}
              />
            </div>
            {saveError && (
              <div style={{ fontSize: 11.5, color: '#f87171', padding: '6px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: 6 }}>
                {saveError}
              </div>
            )}
          </div>
          {/* footer */}
          <div style={{ padding: '10px 18px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn ghost" onClick={() => setNewSample(false)}>Abbrechen</button>
            <button
              className="btn primary"
              onClick={handleSave}
              disabled={saving || !form.product || !form.buyerId}
            >
              {saving ? 'Speichern…' : <><Ic name="plus" size={13} /> Muster erfassen</>}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

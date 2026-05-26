'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtCur, fmtNum, fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

const STATUS_KIND: Record<string, string> = {
  draft: 'neutral', sent: 'info', viewed: 'info',
  negotiation: 'warning', accepted: 'success',
  rejected: 'danger', expired: 'neutral',
};
const STATUS_LABEL: Record<string, string> = {
  draft: 'Entwurf', sent: 'Gesendet', viewed: 'Angesehen',
  negotiation: 'Verhandlung', accepted: 'Angenommen',
  rejected: 'Abgelehnt', expired: 'Abgelaufen',
};

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: 13,
  padding: '7px 10px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
};

interface OffersViewProps {
  lang: Lang;
}

export const OffersView = ({ lang }: OffersViewProps) => {
  const { data: M, refresh } = useData();
  const [newOffer, setNewOffer] = useState(false);
  const [form, setForm] = useState({ buyerId: '', productId: '', qty: '', price: '', validUntil: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const resetForm = () => setForm({ buyerId: '', productId: '', qty: '', price: '', validUntil: '' });

  const handleSaveOffer = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const qty = parseFloat(form.qty);
      const price = parseFloat(form.price);
      const id = `OFF-${Date.now().toString().slice(-6)}`;
      const { error } = await sb.from('offers').insert({
        id,
        buyer_id: form.buyerId,
        product_id: form.productId,
        qty,
        price,
        value: qty * price,
        status: 'draft',
        valid_until: form.validUntil || null,
        sent_at: null,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      setNewOffer(false);
      resetForm();
      refresh();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const totalVolume = M.offers.reduce((s, o) => s + o.value, 0);

  return (
    <>
      <div>
        <div className="section-head">
          <h1>{t(lang, 'nav_offers')}</h1>
          <div className="sub">{M.offers.length} Angebote · {fmtCur(totalVolume)} Volumen</div>
          <div className="right">
            <button className="btn primary" onClick={() => setNewOffer(true)}><Ic name="plus" size={13} /> Neues Angebot</button>
          </div>
        </div>

        <div style={{ padding: '0 16px 12px' }}>
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Angebot</th>
                  <th>Käufer</th>
                  <th>Produkt</th>
                  <th className="num">Menge</th>
                  <th className="num">Preis</th>
                  <th className="num">Wert</th>
                  <th>Gesendet</th>
                  <th>Gültig bis</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {M.offers.map(o => {
                  const b = M.buyers.find(x => x.id === o.buyer);
                  const p = M.products.find(x => x.id === o.product);
                  return (
                    <tr key={o.id}>
                      <td><span className="id fw500">{o.id}</span></td>
                      <td>
                        <div>{b?.name?.split(' ').slice(0, 3).join(' ')}</div>
                        <div className="tx3" style={{ fontSize: 10.5 }}>{b?.country}</div>
                      </td>
                      <td>{p?.name}</td>
                      <td className="num">{fmtNum(o.qty)} {p?.unit}</td>
                      <td className="num mono">{o.price.toFixed(2)} €</td>
                      <td className="num fw500">{fmtCur(o.value)}</td>
                      <td className="mono tx2" style={{ fontSize: 11 }}>{fmtDate(o.sent)}</td>
                      <td className="mono tx2" style={{ fontSize: 11 }}>{fmtDate(o.valid)}</td>
                      <td>
                        <Badge kind={STATUS_KIND[o.status] ?? 'neutral'} dot>
                          {STATUS_LABEL[o.status] ?? o.status}
                        </Badge>
                      </td>
                      <td style={{ display: 'flex', gap: 4 }}>
                        <button className="btn sm ghost" title="Angebot ansehen"><Ic name="eye" size={11} /></button>
                        <button
                          className="btn sm ghost"
                          title="Per E-Mail senden"
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('open-email', {
                              detail: {
                                type: 'offer',
                                to: b?.email ?? '',
                                subject: `Angebot ${o.id} – ${p?.name ?? ''}`,
                                data: {
                                  buyerName: b?.name ?? 'Käufer',
                                  buyerCompany: b?.name,
                                  offerRef: o.id,
                                  validUntil: o.valid,
                                  products: [{ name: p?.name ?? '', qty: String(o.qty), unit: p?.unit ?? 'MT', price: `${o.price.toFixed(2)} €`, total: `${o.value.toLocaleString('de-DE')} €` }],
                                  totalValue: o.value.toLocaleString('de-DE'),
                                  currency: 'EUR',
                                  senderName: 'EastAfrica Export OS',
                                },
                              },
                            }));
                          }}
                        >
                          <Ic name="upload" size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {newOffer && (
        <div className="overlay" onClick={() => setNewOffer(false)} style={{ alignItems: 'flex-start', paddingTop: '8vh' }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 480, padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ic name="doc" size={15} color="#a78bfa" />
              <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>Neues Angebot</span>
              <button className="btn sm ghost" onClick={() => setNewOffer(false)}><Ic name="x" size={12} /></button>
            </div>

            {/* Body */}
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Row 1: Käufer + Produkt */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Käufer</div>
                  <select
                    style={inputStyle}
                    value={form.buyerId}
                    onChange={e => setForm(f => ({ ...f, buyerId: e.target.value }))}
                  >
                    <option value="">— Käufer wählen —</option>
                    {M.buyers.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Produkt</div>
                  <select
                    style={inputStyle}
                    value={form.productId}
                    onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                  >
                    <option value="">— Produkt wählen —</option>
                    {M.products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Menge + Preis */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Menge</div>
                  <input
                    type="number"
                    style={inputStyle}
                    placeholder="0"
                    value={form.qty}
                    onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Preis (€/Einh.)</div>
                  <input
                    type="number"
                    style={inputStyle}
                    placeholder="0.00"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  />
                </div>
              </div>

              {/* Live value */}
              {form.qty && form.price && (
                <div className="tx3" style={{ fontSize: 12, padding: '6px 10px', background: 'rgba(59,130,246,0.08)', borderRadius: 6 }}>
                  Angebotswert: <span className="mono fw600" style={{ color: '#60a5fa' }}>{fmtCur(parseFloat(form.qty || '0') * parseFloat(form.price || '0'))}</span>
                </div>
              )}

              {/* Gültig bis */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Gültig bis</div>
                <input
                  type="date"
                  style={inputStyle}
                  value={form.validUntil}
                  onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                />
              </div>

              {saveError && (
                <div style={{ fontSize: 11.5, color: '#f87171', padding: '6px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: 6 }}>{saveError}</div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 18px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn ghost" onClick={() => { setNewOffer(false); resetForm(); }}>Abbrechen</button>
              <button
                className="btn primary"
                disabled={saving || !form.buyerId || !form.productId || !form.qty || !form.price}
                onClick={handleSaveOffer}
              >
                {saving ? 'Speichern…' : 'Angebot erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

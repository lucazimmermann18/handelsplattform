'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtCur, fmtNum, fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

interface DealsViewProps {
  lang: Lang;
}

export const DealsView = ({ lang }: DealsViewProps) => {
  const { data: M, refresh } = useData();
  const [newDeal, setNewDeal] = useState(false);
  const [form, setForm] = useState({ buyerId: '', productId: '', qty: '', ourPrice: '', targetPrice: '', stage: 'Qualifizierung', prob: '30', nextFollow: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const stages = M.dealStages;

  const fld = <K extends keyof typeof form>(k: K, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSaveDeal = async () => {
    if (!form.buyerId || !form.productId || !form.qty || !form.ourPrice) return;
    setSaving(true); setSaveError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const qty = parseFloat(form.qty); const price = parseFloat(form.ourPrice); const target = parseFloat(form.targetPrice || form.ourPrice);
      const { error } = await createClient().from('deals').insert({
        id: `D-${Date.now().toString().slice(-6)}`,
        buyer_id: form.buyerId, product_id: form.productId,
        qty, our_price: price, target_price: target,
        value: qty * price, stage: form.stage, prob: parseInt(form.prob),
        next_follow: form.nextFollow || new Date(Date.now() + 7*86400000).toISOString().slice(0,10),
        created_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
      setNewDeal(false); setForm({ buyerId: '', productId: '', qty: '', ourPrice: '', targetPrice: '', stage: 'Qualifizierung', prob: '30', nextFollow: '' });
      refresh();
    } catch (e) { setSaveError((e as Error).message); }
    finally { setSaving(false); }
  };

  const totalPipeline = M.deals.reduce((s, d) => s + d.value, 0);
  const totalWeighted = M.deals.reduce((s, d) => s + d.value * (d.prob / 100), 0);

  return (
    <>
      <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_deals')}</h1>
        <div className="sub">
          {M.deals.length} Deals · {fmtCur(totalPipeline)} Pipeline · {fmtCur(totalWeighted)} gewichtet
        </div>
        <div className="right">
          <button className="btn"><Ic name="panel" size={13} /> Listen-Ansicht</button>
          <button className="btn primary" onClick={() => setNewDeal(true)}><Ic name="plus" size={13} /> Neuer Deal</button>
        </div>
      </div>

      <div className="kanban">
        {stages.map(st => {
          const stDeals = M.deals.filter(d => d.stage === st);
          const colTotal = stDeals.reduce((s, d) => s + d.value, 0);

          return (
            <div key={st} className="col">
              <div className="col-head">
                <span className="t">{st}</span>
                <span className="ct">{stDeals.length}</span>
                <span className="ct" style={{ marginLeft: 'auto' }}>{fmtCur(colTotal)}</span>
              </div>

              <div className="col-body">
                {stDeals.map(d => {
                  const b = M.buyers.find(x => x.id === d.buyerId);
                  const p = M.products.find(x => x.id === d.productId);
                  return (
                    <div key={d.id} className="deal-card">
                      <div className="t">{p?.name}</div>
                      <div className="meta">
                        {b?.name?.split(' ').slice(0, 3).join(' ')} · {b?.country}
                      </div>
                      <div className="row" style={{ marginTop: 6, gap: 6 }}>
                        <span className="mono tx2" style={{ fontSize: 11 }}>{fmtNum(d.qty)} {p?.unit}</span>
                        <span className="tx3" style={{ fontSize: 11 }}>×</span>
                        <span className="mono tx2" style={{ fontSize: 11 }}>{d.ourPrice.toFixed(2)} €</span>
                      </div>
                      <div className="foot">
                        <span>{fmtCur(d.value)}</span>
                        <Badge kind={d.prob >= 70 ? 'success' : d.prob >= 40 ? 'info' : 'neutral'}>
                          {d.prob}%
                        </Badge>
                      </div>
                      <div className="row tx3" style={{ fontSize: 10, marginTop: 6 }}>
                        <Ic name="clock" size={10} />
                        <span>Follow-up {fmtDate(d.nextFollow)}</span>
                        <span style={{ marginLeft: 'auto' }} className="mono">{d.id.slice(-4)}</span>
                      </div>
                    </div>
                  );
                })}
                {stDeals.length === 0 && (
                  <div className="tx3" style={{ fontSize: 11, padding: 14, textAlign: 'center' }}>
                    Keine Deals
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* New Deal Modal */}
    {newDeal && (
      <div className="overlay" onClick={() => setNewDeal(false)} style={{ alignItems: 'flex-start', paddingTop: '8vh' }}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 480, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ic name="deals" size={14} color="#a78bfa" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Neuer Deal</span>
            <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={() => setNewDeal(false)}><Ic name="x" size={13} /></button>
          </div>
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Käufer</div>
                <select value={form.buyerId} onChange={e => fld('buyerId', e.target.value)} style={inputStyle}>
                  <option value="">— wählen —</option>
                  {M.buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Produkt</div>
                <select value={form.productId} onChange={e => fld('productId', e.target.value)} style={inputStyle}>
                  <option value="">— wählen —</option>
                  {M.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Menge ({M.products.find(p => p.id === form.productId)?.unit ?? 'Einh.'})</div>
                <input type="number" value={form.qty} onChange={e => fld('qty', e.target.value)} placeholder="z.B. 5000" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Unser Preis (€/Einh.)</div>
                <input type="number" step={0.01} value={form.ourPrice} onChange={e => fld('ourPrice', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Zielpreis Käufer (€)</div>
                <input type="number" step={0.01} value={form.targetPrice} onChange={e => fld('targetPrice', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Wahrscheinlichkeit (%)</div>
                <input type="number" min={0} max={100} value={form.prob} onChange={e => fld('prob', e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Stage</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {M.dealStages.map(s => (
                  <span key={s} className={`chip${form.stage === s ? ' on' : ''}`} onClick={() => fld('stage', s)} style={{ cursor: 'pointer' }}>{s}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Nächster Follow-up</div>
              <input type="date" value={form.nextFollow} onChange={e => fld('nextFollow', e.target.value)} style={inputStyle} />
            </div>
            {saveError && <div style={{ fontSize: 11.5, color: '#f87171', padding: '6px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: 6 }}>{saveError}</div>}
          </div>
          <div style={{ padding: '10px 18px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn ghost" onClick={() => setNewDeal(false)}>Abbrechen</button>
            <button className="btn primary" onClick={handleSaveDeal} disabled={saving || !form.buyerId || !form.productId || !form.qty || !form.ourPrice}>
              {saving ? 'Speichern…' : <><Ic name="plus" size={13} /> Deal anlegen</>}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
};

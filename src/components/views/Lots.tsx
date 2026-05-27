'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { fmtNum, fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { ConfirmDelete } from '@/components/ui/ConfirmDelete';
import { GenericEditModal, type FieldDef } from '@/components/ui/GenericEditModal';

export interface LotsViewProps { lang: Lang }

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

const statusKind = (s: string) => {
  if (s === 'available') return 'success';
  if (s === 'reserved') return 'warning';
  if (s === 'shipped') return 'info';
  return 'neutral';
};

const statusLabel = (s: string) => {
  if (s === 'available') return 'Verfügbar';
  if (s === 'reserved') return 'Reserviert';
  if (s === 'shipped') return 'Versendet';
  return 'Verbraucht';
};

export const LotsView = ({ lang: _lang }: LotsViewProps) => {
  const { data: M, refresh } = useData();
  const [tab, setTab] = useState<'list' | 'trace'>('list');
  const [createOpen, setCreateOpen] = useState(false);
  const [traceInput, setTraceInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    productId: '', supplierId: '', harvestDate: '', qty: '', unit: 'MT',
    grade: 'A', moisture: '', notes: '',
  });

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const lots = M.lots ?? [];

  const traceResult = (() => {
    if (!traceInput.trim()) return null;
    const q = traceInput.trim().toLowerCase();
    const lot = lots.find(l => l.id.toLowerCase() === q);
    if (lot) {
      const supplier = M.suppliers.find(s => s.id === lot.supplierId);
      const linkedOrders = M.orders.filter(o => lot.linkedOrders.includes(o.id) || o.batch === lot.id);
      return { lot, supplier, linkedOrders };
    }
    const order = M.orders.find(o => o.id.toLowerCase() === q || o.batch.toLowerCase() === q);
    if (order) {
      const lot2 = lots.find(l => l.id === order.batch || l.linkedOrders.includes(order.id));
      const supplier = lot2 ? M.suppliers.find(s => s.id === lot2.supplierId) : M.suppliers.find(s => s.id === order.supplierId);
      const buyer = M.buyers.find(b => b.id === order.buyerId);
      return { lot: lot2 ?? null, supplier, linkedOrders: [order], buyer };
    }
    return null;
  })();

  const handleSave = async () => {
    if (!form.productId || !form.supplierId || !form.harvestDate || !form.qty) return;
    setSaving(true); setSaveError(null);
    try {
      const product = M.products.find(p => p.id === form.productId);
      const { createClient } = await import('@/lib/supabase/client');
      const { error } = await createClient().from('lots').insert({
        product_id: form.productId,
        product_name: product?.name ?? '',
        supplier_id: form.supplierId,
        harvest_date: form.harvestDate,
        qty: parseFloat(form.qty),
        unit: form.unit,
        grade: form.grade,
        moisture: form.moisture,
        notes: form.notes,
        status: 'available',
        linked_order_ids: [],
      });
      if (error) throw new Error(error.message);
      setCreateOpen(false);
      setForm({ productId: '', supplierId: '', harvestDate: '', qty: '', unit: 'MT', grade: 'A', moisture: '', notes: '' });
      refresh();
    } catch (e) { setSaveError((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div>
        <div className="section-head">
          <h1>Lots &amp; Chargen</h1>
          <div className="sub">{lots.length} Lots erfasst</div>
          <div className="right">
            <button className="btn primary" onClick={() => setCreateOpen(true)}>
              <Ic name="plus" size={13} /> Neu erfassen
            </button>
          </div>
        </div>

        <div style={{ padding: '0 16px 12px' }}>
          <div className="tabs" style={{ marginBottom: 16 }}>
            <div className={`tab${tab === 'list' ? ' on' : ''}`} onClick={() => setTab('list')}>Alle Lots</div>
            <div className={`tab${tab === 'trace' ? ' on' : ''}`} onClick={() => setTab('trace')}>Rückverfolgung</div>
          </div>

          {tab === 'list' && (
            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Lot-ID</th>
                    <th>Produkt</th>
                    <th>Lieferant</th>
                    <th>Ernte</th>
                    <th className="num">Menge</th>
                    <th>Grade</th>
                    <th>Status</th>
                    <th className="num">Aufträge</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lots.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-3)' }}>
                        <Ic name="layers" size={24} color="var(--text-3)" />
                        <div style={{ marginTop: 8 }}>Noch keine Lots erfasst. Klicken Sie auf &quot;Neu erfassen&quot;.</div>
                      </td>
                    </tr>
                  )}
                  {lots.map(l => {
                    const supplier = M.suppliers.find(s => s.id === l.supplierId);
                    const product = M.products.find(p => p.id === l.productId);
                    return (
                      <tr key={l.id}>
                        <td>
                          <span className="mono fw500" style={{ fontSize: 12, color: '#60a5fa', cursor: 'pointer' }}
                            onClick={() => { setTraceInput(l.id); setTab('trace'); }}>
                            {l.id}
                          </span>
                          {l.certRef && <div className="tx3 mono" style={{ fontSize: 10 }}>{l.certRef}</div>}
                        </td>
                        <td>
                          <div className="fw500" style={{ fontSize: 12 }}>{l.productName || product?.name || l.productId}</div>
                          {l.moisture && <div className="tx3 mono" style={{ fontSize: 10 }}>Feuchte: {l.moisture}</div>}
                        </td>
                        <td className="tx2" style={{ fontSize: 12 }}>{supplier?.name ?? l.supplierId}</td>
                        <td className="mono tx2" style={{ fontSize: 11 }}>{fmtDate(l.harvestDate)}</td>
                        <td className="num mono">{fmtNum(l.qty)} {l.unit}</td>
                        <td><Badge kind="info">{l.grade}</Badge></td>
                        <td><Badge kind={statusKind(l.status)} dot>{statusLabel(l.status)}</Badge></td>
                        <td className="num mono">{l.linkedOrders.length}</td>
                        <td>
                          <ActionMenu onEdit={() => setEditId(l.id)} onDelete={() => setDeleteId(l.id)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'trace' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <div className="card-body">
                  <div style={{ marginBottom: 8 }}>
                    <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Lot-ID oder Auftrags-ID eingeben</div>
                    <div className="row" style={{ gap: 8 }}>
                      <input
                        style={{ ...inputStyle, flex: 1 }}
                        placeholder="z.B. LOT-001 oder ORD-001"
                        value={traceInput}
                        onChange={e => setTraceInput(e.target.value)}
                      />
                      <button className="btn primary" onClick={() => {}}>
                        <Ic name="search" size={13} /> Suchen
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {traceInput.trim() && !traceResult && (
                <div className="card">
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-3)' }}>
                    Keine Rückverfolgungsdaten für &quot;{traceInput}&quot; gefunden.
                  </div>
                </div>
              )}

              {traceResult && (
                <div className="card">
                  <div className="card-head">
                    <Ic name="layers" size={14} />
                    <span className="title">Rückverfolgungskette</span>
                  </div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 16 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', border: '1px solid #34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Ic name="supplier" size={14} color="#34d399" />
                        </div>
                        <div style={{ width: 2, height: 40, background: 'var(--border)' }} />
                      </div>
                      <div style={{ paddingTop: 6 }}>
                        <div className="fw600" style={{ fontSize: 12 }}>Lieferant</div>
                        <div className="tx2" style={{ fontSize: 12 }}>{traceResult.supplier?.name ?? 'Unbekannt'}</div>
                        {traceResult.supplier && <div className="tx3 mono" style={{ fontSize: 10 }}>{traceResult.supplier.country} · {traceResult.supplier.region}</div>}
                      </div>
                    </div>

                    {traceResult.lot && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 16 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(96,165,250,0.15)', border: '1px solid #60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Ic name="layers" size={14} color="#60a5fa" />
                          </div>
                          <div style={{ width: 2, height: 40, background: 'var(--border)' }} />
                        </div>
                        <div style={{ paddingTop: 6 }}>
                          <div className="fw600" style={{ fontSize: 12 }}>Lot</div>
                          <div className="tx2 mono" style={{ fontSize: 12 }}>{traceResult.lot.id}</div>
                          <div className="tx3" style={{ fontSize: 10 }}>
                            {traceResult.lot.qty} {traceResult.lot.unit} · Grade {traceResult.lot.grade} · Ernte: {fmtDate(traceResult.lot.harvestDate)}
                          </div>
                          <Badge kind={statusKind(traceResult.lot.status)} dot>{statusLabel(traceResult.lot.status)}</Badge>
                        </div>
                      </div>
                    )}

                    {traceResult.linkedOrders.map((o, i) => {
                      const buyer = M.buyers.find(b => b.id === o.buyerId);
                      return (
                        <div key={o.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 16 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(251,191,36,0.15)', border: '1px solid #fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Ic name="box" size={14} color="#fbbf24" />
                            </div>
                            {i < traceResult.linkedOrders.length - 1 && <div style={{ width: 2, height: 40, background: 'var(--border)' }} />}
                          </div>
                          <div style={{ paddingTop: 6 }}>
                            <div className="fw600" style={{ fontSize: 12 }}>Auftrag → Käufer</div>
                            <div className="tx2 mono" style={{ fontSize: 12 }}>{o.id}</div>
                            <div className="tx3" style={{ fontSize: 10 }}>
                              {buyer?.name ?? o.buyerId} · {o.portDest} · ETA: {fmtDate(o.eta)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {createOpen && (
        <div className="overlay" onClick={() => setCreateOpen(false)}>
          <div className="modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <Ic name="layers" size={15} color="#60a5fa" />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Neues Lot erfassen</span>
              <button className="btn ghost" style={{ marginLeft: 'auto', padding: 4 }} onClick={() => setCreateOpen(false)}>
                <Ic name="x" size={13} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Produkt</div>
                <select style={inputStyle} value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}>
                  <option value="">— Produkt wählen —</option>
                  {M.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Lieferant</div>
                <select style={inputStyle} value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}>
                  <option value="">— Lieferant wählen —</option>
                  {M.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Erntedatum</div>
                  <input type="date" style={inputStyle} value={form.harvestDate} onChange={e => setForm(f => ({ ...f, harvestDate: e.target.value }))} />
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Menge</div>
                  <input type="number" style={inputStyle} placeholder="0" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Einheit</div>
                  <select style={inputStyle} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                    <option>MT</option>
                    <option>KG</option>
                    <option>L</option>
                    <option>PCE</option>
                  </select>
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Grade</div>
                  <select style={inputStyle} value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}>
                    <option>A</option>
                    <option>B</option>
                    <option>C</option>
                  </select>
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Feuchte %</div>
                  <input style={inputStyle} placeholder="z.B. 11.5%" value={form.moisture} onChange={e => setForm(f => ({ ...f, moisture: e.target.value }))} />
                </div>
              </div>
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Notizen</div>
                <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              {saveError && <div style={{ color: '#f87171', fontSize: 12 }}>{saveError}</div>}
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setCreateOpen(false)}>Abbrechen</button>
              <button className="btn primary" onClick={handleSave} disabled={saving || !form.productId || !form.supplierId || !form.harvestDate || !form.qty}>
                {saving ? 'Speichern…' : 'Lot erfassen'}
              </button>
            </div>
          </div>
        </div>
      )}
      {editId && (() => {
        const r = lots.find(x => x.id === editId);
        if (!r) return null;
        const fields: FieldDef[] = [
          { key: 'productName', label: 'Produkt', type: 'text', dbKey: 'product_name' },
          { key: 'qty', label: 'Menge', type: 'number' },
          { key: 'unit', label: 'Einheit', type: 'select', options: [
            { value: 'MT', label: 'MT' }, { value: 'KG', label: 'KG' }, { value: 'L', label: 'L' }, { value: 'PCE', label: 'PCE' },
          ] },
          { key: 'grade', label: 'Grade', type: 'select', options: [
            { value: 'A', label: 'A' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' },
          ] },
          { key: 'moisture', label: 'Feuchte %', type: 'text' },
          { key: 'status', label: 'Status', type: 'select', options: [
            { value: 'available', label: 'Verfügbar' }, { value: 'reserved', label: 'Reserviert' },
            { value: 'shipped', label: 'Versendet' }, { value: 'consumed', label: 'Verbraucht' },
          ] },
          { key: 'notes', label: 'Notizen', type: 'textarea', span: 2 },
        ];
        return <GenericEditModal title="Lot bearbeiten" subtitle={r.id} record={r as unknown as Record<string, unknown>} fields={fields} table="lots" onClose={() => setEditId(null)} onSaved={() => setEditId(null)} />;
      })()}
      {deleteId && (() => {
        const r = lots.find(x => x.id === deleteId);
        return r ? <ConfirmDelete label={`Lot '${r.id}'`} table="lots" id={deleteId} onClose={() => setDeleteId(null)} onDeleted={() => setDeleteId(null)} /> : null;
      })()}
    </>
  );
};

'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtDate, fmtNum } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

const LOCATIONS = ['Dar es Salaam', 'Arusha', 'Dodoma', 'Mbeya'];
type StatusFilter = 'alle' | 'released' | 'reserved' | 'quality_hold' | 'blocked';

const STATUS_META: Record<string, { kind: string; label: string }> = {
  released:     { kind: 'success', label: 'Freigegeben' },
  reserved:     { kind: 'info',    label: 'Reserviert' },
  quality_hold: { kind: 'warning', label: 'QC-Hold' },
  blocked:      { kind: 'danger',  label: 'Gesperrt' },
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: 13,
  padding: '7px 10px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

interface InventoryViewProps {
  lang: Lang;
}

const EMPTY_FORM = {
  product: '',
  qty: '',
  unit: 'kg',
  location: 'Dar es Salaam',
  batch: '',
  receivedAt: '',
};

export const InventoryView = ({ lang }: InventoryViewProps) => {
  const { data: M, refresh } = useData();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('alle');
  const [locFilter, setLocFilter] = useState<string>('alle');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const handleExport = () => {
    const headers = ['Produkt','Menge','Einheit','Standort','Status','Charge','Eingang'];
    const rows = M.inventory.map(i => [i.product, i.qty, i.unit, i.location, i.status, i.batch, i.received]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `inventar-${new Date().toISOString().slice(0,10)}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const handleBooking = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const { error } = await sb.from('inventory').insert({
        product: form.product,
        qty: parseFloat(form.qty),
        unit: form.unit,
        location: form.location,
        status: 'released',
        batch: form.batch || `BATCH-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
        received_at: form.receivedAt || new Date().toISOString().slice(0, 10),
      });
      if (error) throw new Error(error.message);
      setBookingOpen(false);
      setForm(EMPTY_FORM);
      refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const filtered = M.inventory.filter(item => {
    if (statusFilter !== 'alle' && item.status !== statusFilter) return false;
    if (locFilter !== 'alle' && !item.location.includes(locFilter)) return false;
    return true;
  });

  const totalQty = M.inventory.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      <div>
        <div className="section-head">
          <h1>{t(lang, 'nav_inventory')}</h1>
          <div className="sub">{M.inventory.length} Posten · 4 Standorte · {fmtNum(totalQty)} Einheiten gesamt</div>
          <div className="right">
            <button className="btn" onClick={handleExport}><Ic name="download" size={13} /> Export</button>
            <button className="btn primary" onClick={() => setBookingOpen(true)}><Ic name="plus" size={13} /> Eingang buchen</button>
          </div>
        </div>

        <div style={{ padding: '0 16px 12px' }}>
          {/* Location tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
            {LOCATIONS.map(loc => {
              const items = M.inventory.filter(x => x.location.includes(loc));
              const qty = items.reduce((s, i) => s + i.qty, 0);
              const hasHold = items.some(i => i.status === 'quality_hold' || i.status === 'blocked');
              return (
                <div
                  key={loc}
                  className="tile kacheln"
                  style={{ cursor: 'pointer', outline: locFilter === loc ? '1px solid #3b82f6' : undefined }}
                  onClick={() => setLocFilter(locFilter === loc ? 'alle' : loc)}
                >
                  <div className="head">
                    <span className="lbl" style={{ fontSize: 11 }}>{loc}</span>
                    <Ic name="pin" size={12} color={hasHold ? '#fbbf24' : '#5d667d'} />
                  </div>
                  <div className="v" style={{ fontSize: 20, color: '#e6eaf2' }}>{items.length}</div>
                  <div className="sub">{fmtNum(qty)} Einh.</div>
                  <div className="row" style={{ gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                    {Object.entries(STATUS_META).map(([s, m]) => {
                      const n = items.filter(i => i.status === s).length;
                      return n > 0 ? <Badge key={s} kind={m.kind}>{n}</Badge> : null;
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status filter chips */}
          <div className="row" style={{ gap: 6, marginBottom: 12 }}>
            <button className={`btn sm${statusFilter === 'alle' ? ' primary' : ' ghost'}`} onClick={() => setStatusFilter('alle')}>
              Alle <span className="mono" style={{ opacity: 0.7, marginLeft: 3 }}>{M.inventory.length}</span>
            </button>
            {(Object.entries(STATUS_META) as [StatusFilter, { kind: string; label: string }][]).map(([s, m]) => {
              const n = M.inventory.filter(i => i.status === s).length;
              return (
                <button key={s} className={`btn sm${statusFilter === s ? ' primary' : ' ghost'}`} onClick={() => setStatusFilter(s)}>
                  <span className={`dot`} style={{ background: s === 'released' ? '#34d399' : s === 'reserved' ? '#60a5fa' : s === 'quality_hold' ? '#fbbf24' : '#f87171', width: 6, height: 6, borderRadius: '50%', display: 'inline-block', marginRight: 4 }} />
                  {m.label}
                  <span className="mono" style={{ opacity: 0.7, marginLeft: 3 }}>{n}</span>
                </button>
              );
            })}
            {locFilter !== 'alle' && (
              <button className="btn sm ghost" style={{ marginLeft: 'auto', color: '#60a5fa' }} onClick={() => setLocFilter('alle')}>
                {locFilter} ✕
              </button>
            )}
          </div>

          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th>Charge</th>
                  <th className="num">Menge</th>
                  <th>Lagerort</th>
                  <th>Eingang</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const meta = STATUS_META[item.status];
                  return (
                    <tr key={idx} style={{ background: item.status === 'blocked' ? 'rgba(248,113,113,0.03)' : item.status === 'quality_hold' ? 'rgba(251,191,36,0.03)' : undefined }}>
                      <td>
                        <div className="fw500">{item.product}</div>
                      </td>
                      <td className="mono">{item.batch}</td>
                      <td className="num fw500">{fmtNum(item.qty)} {item.unit}</td>
                      <td>
                        <div className="row" style={{ gap: 6 }}>
                          <Ic name="pin" size={11} color="#5d667d" />
                          <span style={{ fontSize: 12 }}>{item.location}</span>
                        </div>
                      </td>
                      <td className="mono tx2" style={{ fontSize: 11 }}>{fmtDate(item.received)}</td>
                      <td>
                        {meta && <Badge kind={meta.kind} dot>{meta.label}</Badge>}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="empty">Keine Einträge für diesen Filter</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {bookingOpen && (
        <div className="overlay" onClick={() => { setBookingOpen(false); setSaveError(null); }} style={{ alignItems: 'flex-start', paddingTop: '8vh' }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 440, padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <Ic name="pin" size={16} color="#34d399" />
              <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>Lagereingang buchen</span>
              <button className="btn sm ghost" onClick={() => { setBookingOpen(false); setSaveError(null); }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Produkt */}
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Produkt</div>
                <input
                  list="inv-products"
                  value={form.product}
                  onChange={e => setForm(p => ({ ...p, product: e.target.value }))}
                  style={inputStyle}
                  placeholder="Produktname"
                />
                <datalist id="inv-products">
                  {M.products.map(p => <option key={p.id} value={p.name} />)}
                </datalist>
              </div>

              {/* Menge + Einheit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Menge</div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.qty}
                    onChange={e => setForm(p => ({ ...p, qty: e.target.value }))}
                    style={inputStyle}
                    placeholder="0"
                  />
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Einheit</div>
                  <div className="row" style={{ gap: 6 }}>
                    {(['kg', 't', 'Stk'] as const).map(u => (
                      <button
                        key={u}
                        className={`btn sm${form.unit === u ? ' primary' : ' ghost'}`}
                        onClick={() => setForm(p => ({ ...p, unit: u }))}
                        style={{ flex: 1 }}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Standort */}
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Standort</div>
                <select
                  value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  style={inputStyle}
                >
                  {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>

              {/* Charge + Eingangsdatum */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Charge</div>
                  <input
                    type="text"
                    value={form.batch}
                    onChange={e => setForm(p => ({ ...p, batch: e.target.value }))}
                    style={inputStyle}
                    placeholder="z.B. BATCH-2026-042"
                  />
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Eingangsdatum</div>
                  <input
                    type="date"
                    value={form.receivedAt}
                    onChange={e => setForm(p => ({ ...p, receivedAt: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Status info */}
              <div className="tx3" style={{ fontSize: 11 }}>Status: Freigegeben (automatisch gesetzt)</div>

              {/* Error */}
              {saveError && (
                <div style={{ color: '#f87171', fontSize: 12, background: 'rgba(248,113,113,0.08)', borderRadius: 6, padding: '6px 10px' }}>
                  {saveError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button className="btn ghost" onClick={() => { setBookingOpen(false); setSaveError(null); }}>Abbrechen</button>
              <button
                className="btn primary"
                onClick={handleBooking}
                disabled={!form.product || !form.qty || saving}
              >
                {saving ? 'Speichern…' : 'Eingang buchen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

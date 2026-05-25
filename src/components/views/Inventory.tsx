'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtDate, fmtNum } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

const LOCATIONS = ['Dar es Salaam', 'Arusha', 'Dodoma', 'Mbeya'];
const STATUS_FILTERS = ['alle', 'released', 'reserved', 'quality_hold', 'blocked'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const STATUS_META: Record<string, { kind: string; label: string }> = {
  released:     { kind: 'success', label: 'Freigegeben' },
  reserved:     { kind: 'info',    label: 'Reserviert' },
  quality_hold: { kind: 'warning', label: 'QC-Hold' },
  blocked:      { kind: 'danger',  label: 'Gesperrt' },
};

interface InventoryViewProps {
  lang: Lang;
}

export const InventoryView = ({ lang }: InventoryViewProps) => {
  const { data: M } = useData();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('alle');
  const [locFilter, setLocFilter] = useState<string>('alle');
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const filtered = M.inventory.filter(item => {
    if (statusFilter !== 'alle' && item.status !== statusFilter) return false;
    if (locFilter !== 'alle' && !item.location.includes(locFilter)) return false;
    return true;
  });

  const totalQty = M.inventory.reduce((s, i) => s + i.qty, 0);

  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_inventory')}</h1>
        <div className="sub">{M.inventory.length} Posten · 4 Standorte · {fmtNum(totalQty)} Einheiten gesamt</div>
        <div className="right">
          <button className="btn"><Ic name="download" size={13} /> Export</button>
          <button className="btn primary"><Ic name="plus" size={13} /> Eingang buchen</button>
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
  );
};

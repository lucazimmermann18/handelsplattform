'use client';

import React, { useMemo, useState } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { fmtCur, fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

export interface PayablesViewProps { lang: Lang }

const TODAY = new Date();

function fmtDaysLeft(eta: string): string {
  if (!eta) return '—';
  const d = new Date(eta);
  if (isNaN(d.getTime())) return '—';
  const diff = Math.round((d.getTime() - TODAY.getTime()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d überfällig`;
  if (diff === 0) return 'heute';
  return `in ${diff}d`;
}

function getDueDate(etaStr: string): Date {
  const d = new Date(etaStr);
  d.setDate(d.getDate() + 30);
  return d;
}

function getAgingBucket(dueDate: Date): string {
  const diff = Math.round((dueDate.getTime() - TODAY.getTime()) / 86400000);
  if (diff > 0) return 'current';
  if (diff >= -30) return '1-30';
  if (diff >= -60) return '31-60';
  if (diff >= -90) return '61-90';
  return '90+';
}

function getPayStatus(paid: number, dueDate: Date): { label: string; kind: string } {
  if (paid >= 100) return { label: 'Bezahlt', kind: 'success' };
  const overdue = dueDate < TODAY;
  if (overdue) return { label: 'Überfällig', kind: 'danger' };
  if (paid > 0) return { label: 'Teilweise', kind: 'warning' };
  return { label: 'Offen', kind: 'neutral' };
}

export const PayablesView = ({ lang: _lang }: PayablesViewProps) => {
  const { data: M, refresh } = useData();
  const [tab, setTab] = useState<'ar' | 'ap'>('ar');
  const [markingId, setMarkingId] = useState<string | null>(null);

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const orders = M.orders;
  const ytdStart = new Date('2026-01-01');

  const arData = useMemo(() => orders.map(o => {
    const dueDate = getDueDate(o.eta);
    const paid = o.paid ?? 0;
    const openAmt = o.revenue * (1 - paid / 100);
    const paidAmt = o.revenue * (paid / 100);
    return { o, dueDate, paid, openAmt, paidAmt, bucket: getAgingBucket(dueDate), status: getPayStatus(paid, dueDate) };
  }), [orders]);

  const totalOpen = arData.reduce((s, x) => s + x.openAmt, 0);
  const totalOverdue = arData.filter(x => x.status.kind === 'danger').reduce((s, x) => s + x.openAmt, 0);
  const due30 = arData.filter(x => {
    const diff = Math.round((x.dueDate.getTime() - TODAY.getTime()) / 86400000);
    return diff >= 0 && diff <= 30 && x.paid < 100;
  }).reduce((s, x) => s + x.openAmt, 0);
  const paidYtd = arData.filter(x => x.paid >= 100 && new Date(x.o.eta) >= ytdStart).reduce((s, x) => s + x.o.revenue, 0);

  const aging: Record<string, number> = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  arData.forEach(x => { if (x.paid < 100) aging[x.bucket] = (aging[x.bucket] ?? 0) + x.openAmt; });
  const agingMax = Math.max(...Object.values(aging), 1);

  const handleMarkPaid = async (orderId: string) => {
    setMarkingId(orderId);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { error } = await createClient().from('orders').update({ paid: 100 }).eq('id', orderId);
      if (error) throw new Error(error.message);
      refresh();
    } catch (_e) {}
    setMarkingId(null);
  };

  return (
    <div>
      <div className="section-head">
        <h1>AR / AP · Zahlungsmanagement</h1>
        <div className="sub">{orders.length} Aufträge analysiert</div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { l: 'Total Offen', v: fmtCur(totalOpen), c: '#60a5fa' },
            { l: 'Überfällig', v: fmtCur(totalOverdue), c: '#f87171' },
            { l: 'Fällig 30d', v: fmtCur(due30), c: '#fbbf24' },
            { l: 'Bezahlt YTD', v: fmtCur(paidYtd), c: '#34d399' },
          ].map((k, i) => (
            <div key={i} className="card" style={{ padding: 14 }}>
              <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase' }}>{k.l}</div>
              <div className="mono fw600" style={{ fontSize: 20, color: k.c, marginTop: 4 }}>{k.v}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-head">
            <Ic name="chart" size={14} />
            <span className="title">Aging-Analyse (Forderungen offen)</span>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries({ 'Aktuell': aging['current'], '1–30d': aging['1-30'], '31–60d': aging['31-60'], '61–90d': aging['61-90'], '90d+': aging['90+'] }).map(([label, amt]) => (
              <div key={label} className="row" style={{ gap: 10, alignItems: 'center' }}>
                <div className="mono tx3" style={{ width: 60, fontSize: 11, textAlign: 'right', flexShrink: 0 }}>{label}</div>
                <div style={{ flex: 1, height: 18, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(amt / agingMax) * 100}%`, background: label.includes('+') ? '#f87171' : label.includes('61') ? '#fb923c' : label.includes('31') ? '#fbbf24' : '#60a5fa', borderRadius: 3 }} />
                </div>
                <div className="mono fw500" style={{ width: 90, fontSize: 11, textAlign: 'right', flexShrink: 0 }}>{fmtCur(amt)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="tabs" style={{ marginBottom: 16 }}>
          <div className={`tab${tab === 'ar' ? ' on' : ''}`} onClick={() => setTab('ar')}>Forderungen (AR)</div>
          <div className={`tab${tab === 'ap' ? ' on' : ''}`} onClick={() => setTab('ap')}>Verbindlichkeiten (AP)</div>
        </div>

        {tab === 'ar' && (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Auftrag</th>
                  <th>Käufer</th>
                  <th className="num">Revenue</th>
                  <th className="num">Bezahlt %</th>
                  <th className="num">Offen (€)</th>
                  <th>Fällig am</th>
                  <th>Status</th>
                  <th>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {arData.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)' }}>Keine Aufträge</td></tr>
                )}
                {arData.map(({ o, dueDate, paid, openAmt, status }) => {
                  const buyer = M.buyers.find(b => b.id === o.buyerId);
                  return (
                    <tr key={o.id}>
                      <td><span className="id">{o.id}</span></td>
                      <td className="tx2" style={{ fontSize: 12 }}>{buyer?.name ?? o.buyerId}</td>
                      <td className="num mono fw500">{fmtCur(o.revenue)}</td>
                      <td className="num mono">{paid}%</td>
                      <td className="num mono fw500" style={{ color: openAmt > 0 ? '#fbbf24' : 'var(--text-3)' }}>
                        {fmtCur(openAmt)}
                      </td>
                      <td>
                        <div className="mono" style={{ fontSize: 11 }}>{fmtDate(dueDate.toISOString())}</div>
                        <div className="tx3 mono" style={{ fontSize: 10 }}>{fmtDaysLeft(dueDate.toISOString())}</div>
                      </td>
                      <td><Badge kind={status.kind} dot>{status.label}</Badge></td>
                      <td>
                        {paid < 100 && (
                          <button className="btn sm" onClick={() => handleMarkPaid(o.id)} disabled={markingId === o.id}>
                            {markingId === o.id ? '…' : 'Als bezahlt'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'ap' && (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Auftrag</th>
                  <th>Lieferant</th>
                  <th className="num">Kosten (EK)</th>
                  <th>Fällig (ETD)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)' }}>Keine Aufträge</td></tr>
                )}
                {orders.map(o => {
                  const supplier = M.suppliers.find(s => s.id === o.supplierId);
                  const etdDate = new Date(o.etd);
                  const overdue = etdDate < TODAY;
                  return (
                    <tr key={o.id}>
                      <td><span className="id">{o.id}</span></td>
                      <td className="tx2" style={{ fontSize: 12 }}>{supplier?.name ?? o.supplierId}</td>
                      <td className="num mono fw500">{fmtCur(o.costGoods)}</td>
                      <td>
                        <div className="mono" style={{ fontSize: 11 }}>{fmtDate(o.etd)}</div>
                        <div className="tx3 mono" style={{ fontSize: 10 }}>{fmtDaysLeft(o.etd)}</div>
                      </td>
                      <td>
                        <Badge kind={overdue ? 'danger' : 'info'} dot>{overdue ? 'Fällig' : 'Ausstehend'}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtCur } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { BarChart, Donut } from '@/components/ui/primitives';

interface FinanceViewProps {
  lang: Lang;
}

const SUP_PAID: Record<string, number> = {
  paid: 100, delivered: 100, done: 100,
  arrived: 80, in_transit: 80,
  ready: 50, in_export: 50, shipped: 50,
};

export const FinanceView = ({ lang }: FinanceViewProps) => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const orders = M.orders;
  const revTrend = M.revTrend;

  const total = orders.reduce((s, o) => s + o.revenue, 0);
  const totalProfit = orders.reduce((s, o) => s + o.profit, 0);
  const receivable = orders
    .filter(o => o.paid < 100 && o.status !== 'done')
    .reduce((s, o) => s + (o.revenue * (100 - o.paid) / 100), 0);

  const totalExpected = revTrend.reduce((s, r) => s + r.exp, 0) * 1000;
  const totalRealized = revTrend.filter(r => r.real > 0).reduce((s, r) => s + r.real, 0) * 1000;

  const receivableCount = orders.filter(o => o.paid < 100 && o.status !== 'done').length;
  const overdueOrders = orders.filter(o => o.paid < 50 && ['delivered', 'arrived'].includes(o.status));
  const overdueAmount = overdueOrders.reduce((s, o) => s + (o.revenue * (100 - o.paid) / 100), 0);
  const avgMarginPct = orders.length > 0 ? Math.round(orders.reduce((s, o) => s + (o.profit / Math.max(o.revenue, 1)) * 100, 0) / orders.length) : 0;

  const kpis = [
    { l: 'Umsatz · Pipeline',  v: fmtCur(total),          sub: `${orders.length} Aufträge`,           c: '#60a5fa', delta: '+18%' },
    { l: 'Erwarteter Gewinn',  v: fmtCur(totalProfit),    sub: `Ø Marge ${avgMarginPct}%`,            c: '#34d399', delta: '+2pp' },
    { l: 'Offene Forderungen', v: fmtCur(receivable),     sub: `${receivableCount} Aufträge`,         c: '#fbbf24', delta: undefined },
    { l: 'Überfällig',         v: overdueAmount > 0 ? fmtCur(overdueAmount) : '—', sub: `${overdueOrders.length} Aufträge · Ø 18 Tage`, c: '#f87171', delta: undefined },
  ];

  const tGoods     = orders.reduce((s, o) => s + o.costGoods, 0);
  const tLogistics = orders.reduce((s, o) => s + o.costLogistics, 0);
  const tDocs      = orders.reduce((s, o) => s + o.costDocs, 0);
  const tTotal     = Math.max(total, 1);
  const pOther     = Math.max(0, 100 - Math.round(tGoods/tTotal*100) - Math.round(tLogistics/tTotal*100) - Math.round(tDocs/tTotal*100) - Math.round(totalProfit/tTotal*100));
  const costSlices = [
    { l: 'Einkauf Ware',  p: Math.round(tGoods/tTotal*100),        c: '#3b82f6' },
    { l: 'Seetransport',  p: Math.round(tLogistics/tTotal*100),    c: '#22d3ee' },
    { l: 'Inland/Hafen',  p: Math.round(pOther * 0.45),            c: '#f59e0b' },
    { l: 'Dok/Zoll',      p: Math.round(tDocs/tTotal*100),         c: '#a78bfa' },
    { l: 'Marge',         p: Math.round(totalProfit/tTotal*100),   c: '#34d399' },
  ].filter(s => s.p > 0);

  const handleExport = () => {
    const headers = ['Auftrag-ID','Käufer','Produkt','Umsatz (€)','Einkauf (€)','Logistik (€)','Docs (€)','Gewinn (€)','Marge (%)','Incoterm','Status','Zahlung (%)'];
    const rows = orders.map(o => {
      const buyer = M.buyers.find(b => b.id === o.buyerId);
      return [o.id, buyer?.name ?? o.buyerId, o.productVariant, o.revenue, o.costGoods, o.costLogistics, o.costDocs, o.profit, Math.round((o.profit/o.revenue)*100), o.incoterm, o.status, o.paid];
    });
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `finanzen-${new Date().toISOString().slice(0,10)}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_finance')}</h1>
        <div className="sub">Controlling pro Auftrag · Margen-Analyse · Zahlungstracking</div>
        <div className="right">
          <button className="btn" onClick={handleExport}><Ic name="download" size={13} /> {t(lang, 'export')}</button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
          {kpis.map((k, i) => (
            <div key={i} className="card" style={{ padding: 14 }}>
              <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.l}</div>
              <div className="mono fw600" style={{ fontSize: 24, color: k.c, marginTop: 4 }}>{k.v}</div>
              <div className="tx3" style={{ fontSize: 11, marginTop: 4 }}>
                {k.sub}
                {k.delta && <span style={{ color: k.c, marginLeft: 8 }}>{k.delta}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
          <div className="card">
            <div className="card-head">
              <Ic name="chart" size={14} />
              <span className="title">Umsatz, Realisierung &amp; Marge — 12 Monate</span>
            </div>
            <div className="card-body">
              <BarChart
                data={revTrend as unknown as Record<string, number | string>[]}
                w={680} h={170}
                color="#3b82f6" secondColor="#22d3ee"
                valKey="exp" val2Key="real" lblKey="m"
              />
              <div className="row tx3" style={{ fontSize: 11, marginTop: 8, gap: 16 }}>
                <span><span className="dot" style={{ background: '#3b82f6' }} /> Erwartet</span>
                <span><span className="dot" style={{ background: '#22d3ee' }} /> Realisiert</span>
                <span style={{ marginLeft: 'auto' }} className="mono">
                  Σ erwartet {fmtCur(totalExpected)} · Σ realisiert {fmtCur(totalRealized)}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <Ic name="layers" size={14} />
              <span className="title">Kosten-Aufschlüsselung</span>
            </div>
            <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <Donut size={130} thickness={18} data={costSlices.map(s => ({ v: s.p, color: s.c }))} />
              <div style={{ flex: 1, fontSize: 11.5 }}>
                {costSlices.map((r, i) => (
                  <div key={i} className="row" style={{ marginBottom: 6 }}>
                    <span className="dot" style={{ background: r.c }} />
                    <span style={{ flex: 1 }}>{r.l}</span>
                    <span className="mono fw500">{r.p}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* P&L table */}
        <div className="card">
          <div className="card-head">
            <Ic name="finance" size={14} />
            <span className="title">P&amp;L pro Auftrag</span>
            <span className="meta">{orders.length} Aufträge</span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Auftrag</th>
                <th>Käufer</th>
                <th className="num">Umsatz</th>
                <th className="num">Wareneinkauf</th>
                <th className="num">Logistik</th>
                <th className="num">Dok/Zoll</th>
                <th className="num">Gewinn</th>
                <th className="num">Marge</th>
                <th>Zahlung Käufer</th>
                <th>Zahlung Lieferant</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const b = M.buyers.find(x => x.id === o.buyerId);
                const mp = o.revenue > 0 ? Math.round((o.profit / o.revenue) * 100) : 0;
                const marginColor = mp >= 30 ? '#34d399' : mp >= 20 ? '#fbbf24' : '#f87171';
                const supPaid = SUP_PAID[o.status] ?? 30;
                return (
                  <tr key={o.id}>
                    <td><span className="id">{o.id}</span></td>
                    <td className="tx2" style={{ fontSize: 11.5 }}>
                      {b?.name?.split(' ').slice(0, 3).join(' ')}
                    </td>
                    <td className="num fw500">{fmtCur(o.revenue)}</td>
                    <td className="num tx2">{fmtCur(o.costGoods)}</td>
                    <td className="num tx2">{fmtCur(o.costLogistics)}</td>
                    <td className="num tx2">{fmtCur(o.costDocs)}</td>
                    <td className="num fw500" style={{ color: '#34d399' }}>{fmtCur(o.profit)}</td>
                    <td className="num mono fw500" style={{ color: marginColor }}>{mp}%</td>
                    <td>
                      <div className="progress" style={{ width: 56 }}>
                        <div style={{ width: o.paid + '%', background: o.paid === 100 ? '#10b981' : '#3b82f6' }} />
                      </div>
                      <div className="mono tx3" style={{ fontSize: 10, marginTop: 2 }}>
                        {o.paid}% · {fmtCur(o.revenue * o.paid / 100)}
                      </div>
                    </td>
                    <td>
                      <div className="progress" style={{ width: 56 }}>
                        <div style={{ width: supPaid + '%', background: supPaid === 100 ? '#10b981' : '#a78bfa' }} />
                      </div>
                      <div className="mono tx3" style={{ fontSize: 10, marginTop: 2 }}>{supPaid}%</div>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)', fontSize: 12 }}>
                    Noch keine Aufträge mit Finanzdaten vorhanden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

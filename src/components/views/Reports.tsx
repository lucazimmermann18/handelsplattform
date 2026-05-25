'use client';

import React from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtCur } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge, Donut } from '@/components/ui/primitives';

interface ReportsViewProps {
  lang: Lang;
}

const ROUTES = [
  { r: 'DAR → HAM', d: 30, sla: 32, late: false },
  { r: 'DAR → RTM', d: 28, sla: 30, late: false },
  { r: 'MOM → FXT', d: 23, sla: 25, late: false },
  { r: 'DAR → GOA', d: 21, sla: 24, late: false },
  { r: 'DAR → ANR', d: 31, sla: 30, late: true  },
  { r: 'DAR → LEH', d: 27, sla: 29, late: false },
];

export const ReportsView = ({ lang }: ReportsViewProps) => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const sortedBuyers = [...M.buyers]
    .filter(b => b.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);
  const maxRevenue = Math.max(...sortedBuyers.map(b => b.revenue));

  const sortedSuppliers = [...M.suppliers].sort((a, b) => b.score - a.score);
  const sortedProducts = [...M.products].sort((a, b) => b.margin - a.margin).slice(0, 8);

  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_reports')}</h1>
        <div className="sub">Einkauf · Sales · Export · Finanzen</div>
        <div className="right">
          <button className="btn"><Ic name="download" size={13} /> Alle PDFs</button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        {/* Row 1: Sales + Supplier Performance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          {/* Sales by buyer */}
          <div className="card">
            <div className="card-head">
              <Ic name="buyer" size={14} />
              <span className="title">Sales · Umsatz nach Käufer YTD</span>
              <span className="meta">{fmtCur(sortedBuyers.reduce((s, b) => s + b.revenue, 0))}</span>
            </div>
            <div className="card-body">
              {sortedBuyers.map((b, i) => (
                <div key={b.id} style={{ marginBottom: 10 }}>
                  <div className="row" style={{ fontSize: 11.5, marginBottom: 4 }}>
                    <span style={{ width: 18, fontFamily: 'Geist Mono', fontSize: 10, color: 'var(--text-3)' }}>{i + 1}</span>
                    <span className="fw500" style={{ flex: 1 }}>{b.name}</span>
                    <span className="tx3" style={{ marginRight: 8 }}>{b.country}</span>
                    <span className="mono fw500">{fmtCur(b.revenue)}</span>
                  </div>
                  <div className="progress">
                    <div style={{ width: `${(b.revenue / maxRevenue) * 100}%`, background: i === 0 ? '#3b82f6' : '#1d4ed8' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supplier performance */}
          <div className="card">
            <div className="card-head">
              <Ic name="supplier" size={14} />
              <span className="title">Einkauf · Lieferanten-Performance</span>
            </div>
            <div className="card-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Lieferant</th>
                    <th className="num" title="Qualität">Qual</th>
                    <th className="num" title="Lieferzuverlässigkeit">Lief</th>
                    <th className="num" title="Kommunikation">Komm</th>
                    <th className="num" title="Preis">Preis</th>
                    <th className="num" title="Dokumentation">Doks</th>
                    <th className="num">Score</th>
                    <th>Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSuppliers.map(s => (
                    <tr key={s.id}>
                      <td className="fw500" style={{ fontSize: 11.5 }}>
                        {s.name.split(' ').slice(0, 2).join(' ')}
                      </td>
                      <td className="num mono">{s.qual}</td>
                      <td className="num mono">{s.rel}</td>
                      <td className="num mono">{s.comm}</td>
                      <td className="num mono">{s.price}</td>
                      <td className="num mono">{s.docs}</td>
                      <td className="num fw500" style={{ color: s.score >= 4 ? '#34d399' : s.score >= 3 ? '#fbbf24' : '#f87171' }}>
                        {s.score.toFixed(1)}
                      </td>
                      <td>
                        <Badge kind={s.tier === 'A' ? 'success' : s.tier === 'B' ? 'info' : 'neutral'}>
                          {s.tier}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Row 2: Transit times, QC rate, Product profitability */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {/* Transit times */}
          <div className="card">
            <div className="card-head">
              <Ic name="ship" size={14} />
              <span className="title">Export · Lieferzeit pro Route</span>
            </div>
            <div className="card-body">
              {ROUTES.map((row, i) => (
                <div key={i} className="row" style={{ padding: '7px 0', fontSize: 12, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <span className="mono fw500">{row.r}</span>
                    <span className="mono tx3" style={{ marginLeft: 8, fontSize: 10.5 }}>SLA {row.sla}d</span>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    {row.late && <Badge kind="danger">+{row.d - row.sla}d</Badge>}
                    <span className="mono fw500" style={{ color: row.late ? '#f87171' : '#34d399' }}>
                      {row.d} {t(lang, 'days') || 'Tage'}
                    </span>
                  </div>
                </div>
              ))}
              <div className="sep" />
              <div className="row tx3" style={{ fontSize: 11 }}>
                <span>Pünktlichkeitsrate</span>
                <span className="mono fw500" style={{ marginLeft: 'auto', color: '#34d399' }}>83%</span>
              </div>
            </div>
          </div>

          {/* QC release rate */}
          <div className="card">
            <div className="card-head">
              <Ic name="quality" size={14} />
              <span className="title">Qualität · Freigabequote</span>
            </div>
            <div className="card-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
              <Donut
                data={[
                  { v: 86, color: '#34d399' },
                  { v: 8,  color: '#fbbf24' },
                  { v: 6,  color: '#f87171' },
                ]}
                size={130} thickness={18}
              />
              <div style={{ fontSize: 11.5 }}>
                {[
                  { l: 'Freigegeben', p: 86, c: '#34d399' },
                  { l: 'Nachprüfung', p:  8, c: '#fbbf24' },
                  { l: 'Gesperrt',    p:  6, c: '#f87171' },
                ].map((r, i) => (
                  <div key={i} className="row" style={{ marginBottom: 8, gap: 8 }}>
                    <span className="dot" style={{ background: r.c }} />
                    <span style={{ flex: 1 }}>{r.l}</span>
                    <span className="mono fw500">{r.p}%</span>
                  </div>
                ))}
                <div className="sep" />
                <div className="tx3" style={{ fontSize: 10 }}>
                  Basis: {M.quality.length} Prüfungen YTD
                </div>
              </div>
            </div>
          </div>

          {/* Product profitability */}
          <div className="card">
            <div className="card-head">
              <Ic name="finance" size={14} />
              <span className="title">Profitabilität pro Produkt</span>
            </div>
            <div className="card-body">
              {sortedProducts.map(p => {
                const barW = Math.min(100, p.margin * 2);
                const color = p.margin >= 30 ? '#34d399' : p.margin >= 20 ? '#fbbf24' : '#f87171';
                return (
                  <div key={p.id} className="row" style={{ padding: '6px 0', fontSize: 11.5, borderBottom: '1px solid var(--border)', gap: 8 }}>
                    <span className="fw500" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </span>
                    <div className="progress" style={{ width: 60 }}>
                      <div style={{ width: `${barW}%`, background: color }} />
                    </div>
                    <span className="mono fw500" style={{ width: 34, textAlign: 'right', color }}>{p.margin}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

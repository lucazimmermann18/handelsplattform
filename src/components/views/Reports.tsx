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

export const ReportsView = ({ lang }: ReportsViewProps) => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  // Derive transit routes from real orders
  const routeMap = new Map<string, number[]>();
  M.orders.forEach(o => {
    const load = (o as any).portLoad as string | undefined;
    const dest = (o as any).portDest as string | undefined;
    if (!load || !dest || !o.etd || !o.eta) return;
    const key = `${load.slice(0, 3).toUpperCase()} → ${dest.slice(0, 3).toUpperCase()}`;
    const days = Math.round((new Date(o.eta).getTime() - new Date(o.etd).getTime()) / 86400000);
    if (days > 0 && days < 120) {
      const arr = routeMap.get(key) ?? [];
      arr.push(days);
      routeMap.set(key, arr);
    }
  });
  const routes = Array.from(routeMap.entries()).map(([r, days]) => ({
    r,
    d: Math.round(days.reduce((a, b) => a + b, 0) / days.length),
  }));

  // QC statistics from real quality checks
  const qcTotal = M.quality.length;
  const qcReleased = M.quality.filter(q => q.status === 'released').length;
  const qcInProgress = M.quality.filter(q => q.status === 'in_progress').length;
  const qcBlocked = M.quality.filter(q => q.status === 'blocked').length;
  const qcRelPct = qcTotal > 0 ? Math.round((qcReleased / qcTotal) * 100) : 0;
  const qcInPct = qcTotal > 0 ? Math.round((qcInProgress / qcTotal) * 100) : 0;
  const qcBlkPct = qcTotal > 0 ? 100 - qcRelPct - qcInPct : 0;

  const handleExportAll = () => {
    const ts = new Date().toISOString().slice(0, 10);
    // Comprehensive multi-section CSV export
    const sections: string[] = [];

    // Section 1: Revenue by Buyer
    sections.push('## Umsatz nach Käufer');
    const buyerHeaders = ['Käufer-ID','Name','Land','Umsatz (€)','Bewertung','Status'];
    const buyerRows = [...M.buyers].filter(b => b.revenue > 0).sort((a, b) => b.revenue - a.revenue)
      .map(b => [b.id, b.name, b.country, b.revenue, b.rating, b.status]);
    sections.push([buyerHeaders, ...buyerRows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'));

    // Section 2: Supplier Performance
    sections.push('\n## Lieferanten-Performance');
    const supHeaders = ['Lieferant-ID','Name','Land','Tier','Score','Risiko','Status'];
    const supRows = [...M.suppliers].sort((a, b) => b.score - a.score)
      .map(s => [s.id, s.name, s.country, s.tier, s.score, s.risk, s.status]);
    sections.push([supHeaders, ...supRows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'));

    // Section 3: Products
    sections.push('\n## Produkte & Margen');
    const prodHeaders = ['Produkt-ID','Name','Kategorie','Einkauf (€)','Verkauf (€)','Marge (%)','Exportbereit'];
    const prodRows = [...M.products].sort((a, b) => b.margin - a.margin)
      .map(p => [p.id, p.name, p.cat, p.buyPrice, p.sellPrice, p.margin, p.exportReady ? 'Ja' : 'Nein']);
    sections.push([prodHeaders, ...prodRows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'));

    const csv = sections.join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `berichte-gesamt-${ts}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  };

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
          <button className="btn" onClick={handleExportAll}><Ic name="download" size={13} /> Export (CSV)</button>
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
              {routes.length === 0
                ? <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>Keine Routendaten vorhanden</div>
                : routes.map((row, i) => (
                  <div key={i} className="row" style={{ padding: '7px 0', fontSize: 12, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                      <span className="mono fw500">{row.r}</span>
                    </div>
                    <span className="mono fw500" style={{ color: '#34d399' }}>
                      {row.d} {t(lang, 'days') || 'Tage'}
                    </span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* QC release rate */}
          <div className="card">
            <div className="card-head">
              <Ic name="quality" size={14} />
              <span className="title">Qualität · Freigabequote</span>
            </div>
            <div className="card-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
              {qcTotal > 0
                ? <>
                    <Donut
                      data={[
                        { v: qcRelPct,  color: '#34d399' },
                        { v: qcInPct,   color: '#fbbf24' },
                        { v: qcBlkPct,  color: '#f87171' },
                      ]}
                      size={130} thickness={18}
                    />
                    <div style={{ fontSize: 11.5 }}>
                      {[
                        { l: 'Freigegeben', p: qcRelPct, c: '#34d399' },
                        { l: 'In Prüfung',  p: qcInPct,  c: '#fbbf24' },
                        { l: 'Gesperrt',    p: qcBlkPct, c: '#f87171' },
                      ].map((r, i) => (
                        <div key={i} className="row" style={{ marginBottom: 8, gap: 8 }}>
                          <span className="dot" style={{ background: r.c }} />
                          <span style={{ flex: 1 }}>{r.l}</span>
                          <span className="mono fw500">{r.p}%</span>
                        </div>
                      ))}
                      <div className="sep" />
                      <div className="tx3" style={{ fontSize: 10 }}>
                        Basis: {qcTotal} Prüfungen YTD
                      </div>
                    </div>
                  </>
                : <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
                    Noch keine Qualitätsprüfungen vorhanden
                  </div>
              }
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

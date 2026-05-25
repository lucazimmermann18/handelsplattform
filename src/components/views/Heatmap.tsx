'use client';

import React from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { fmtCur } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';

interface HeatmapViewProps { lang: Lang; }

const cellBg = (margin: number | null): string => {
  if (margin === null) return 'var(--surface)';
  if (margin >= 35) return 'rgba(16,185,129,0.45)';
  if (margin >= 28) return 'rgba(16,185,129,0.30)';
  if (margin >= 20) return 'rgba(245,158,11,0.30)';
  return 'rgba(239,68,68,0.30)';
};

export const HeatmapView = ({ lang }: HeatmapViewProps) => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const products = M.products.slice(0, 10);
  const buyers = M.buyers;

  // Build lookup: productId+buyerId → { margin, revenue }
  const lookup: Record<string, { margin: number; revenue: number }> = {};
  M.orders.forEach(o => {
    const key = `${o.productId}:${o.buyerId}`;
    if (!lookup[key]) {
      const marginPct = o.revenue > 0 ? Math.round((o.profit / o.revenue) * 100) : 0;
      lookup[key] = { margin: marginPct, revenue: o.revenue };
    }
  });

  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h1 className="view-title">Profitabilitäts-Heatmap</h1>
          <p className="view-sub">Produkte × Käufer · Marge & Umsatz</p>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `200px repeat(${buyers.length}, 90px)`,
          gap: 1,
          background: 'var(--border)',
          minWidth: 'max-content',
        }}>
          {/* Header: corner + buyer names */}
          <div style={{ background: 'var(--surface-2)', padding: '8px 10px', display: 'flex', alignItems: 'flex-end', height: 120, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
            Produkt \ Käufer
          </div>
          {buyers.map(b => (
            <div key={b.id} style={{
              background: 'var(--surface-2)',
              height: 120,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              padding: '4px 2px',
            }}>
              <span style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                fontSize: 10,
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                maxHeight: 110,
              }}>
                {b.name.length > 22 ? b.name.slice(0, 22) + '…' : b.name}
              </span>
            </div>
          ))}

          {/* Data rows */}
          {products.map(p => (
            <React.Fragment key={p.id}>
              {/* Product name cell */}
              <div style={{ background: 'var(--surface)', padding: '10px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p.hs}</div>
              </div>

              {/* Buyer cells */}
              {buyers.map(b => {
                const key = `${p.id}:${b.id}`;
                const data = lookup[key] ?? null;
                return (
                  <div key={b.id} style={{
                    background: cellBg(data?.margin ?? null),
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 4,
                    minHeight: 56,
                  }}>
                    {data ? (
                      <>
                        <div style={{ fontSize: 15, fontWeight: 700, color: data.margin >= 28 ? 'rgba(16,185,129,1)' : data.margin >= 20 ? 'rgba(245,158,11,1)' : 'rgba(239,68,68,1)' }}>
                          {data.margin}%
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center' }}>
                          {fmtCur(data.revenue)}
                        </div>
                      </>
                    ) : (
                      <div style={{ color: 'var(--border)', fontSize: 16 }}>·</div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 20, padding: '16px 0 0', fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 14, borderRadius: 2, background: 'rgba(16,185,129,0.45)', display: 'inline-block' }} /> ≥35% Exzellent
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 14, borderRadius: 2, background: 'rgba(16,185,129,0.30)', display: 'inline-block' }} /> 28–34% Gut
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 14, borderRadius: 2, background: 'rgba(245,158,11,0.30)', display: 'inline-block' }} /> 20–27% OK
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 14, borderRadius: 2, background: 'rgba(239,68,68,0.30)', display: 'inline-block' }} /> &lt;20% Niedrig
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 14, borderRadius: 2, background: 'var(--surface)', border: '1px solid var(--border)', display: 'inline-block' }} /> Kein Auftrag
          </span>
        </div>
      </div>
    </div>
  );
};

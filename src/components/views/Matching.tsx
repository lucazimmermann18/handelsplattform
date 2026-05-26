'use client';

import React from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';

import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import type { Buyer, Product } from '@/lib/types';

interface MatchingViewProps { lang: Lang; onNav: (view: string) => void; }

const score = (b: Buyer, p: Product): number => {
  let s = 0;
  if (b.interests.some(i => p.name.toLowerCase().includes(i.toLowerCase().split(' ')[0]) || i.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]))) s += 60;
  if (p.certs.some(c => b.certs.some(bc => c.toLowerCase().includes(bc.toLowerCase().split(' ')[0])))) s += 20;
  if (b.country === 'DE' && p.exportReady) s += 5;
  if (b.industry && p.cat && b.industry.toLowerCase().includes(p.cat.toLowerCase())) s += 10;
  if (b.rating >= 4) s += 5;
  return Math.min(100, s);
};

const cellColor = (s: number) => {
  if (s === 0) return 'transparent';
  if (s < 20) return 'rgba(239,68,68,0.10)';
  if (s < 40) return 'rgba(245,158,11,0.15)';
  if (s < 70) return 'rgba(59,130,246,0.20)';
  return 'rgba(16,185,129,0.35)';
};

export const MatchingView = ({ lang: _lang, onNav }: MatchingViewProps) => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const buyers = M.buyers;
  const products = M.products;

  // Top matches: score >= 70, no existing order
  const existingPairs = new Set(M.orders.map(o => `${o.buyerId}:${o.productId}`));

  const allMatches: { buyer: typeof buyers[0]; product: typeof products[0]; sc: number }[] = [];
  buyers.forEach(b => {
    products.forEach(p => {
      const sc = score(b, p);
      if (sc >= 70 && !existingPairs.has(`${b.id}:${p.id}`)) {
        allMatches.push({ buyer: b, product: p, sc });
      }
    });
  });
  allMatches.sort((a, b) => b.sc - a.sc);
  const topMatches = allMatches.slice(0, 6);

  // Matrix: first 10 products, all buyers
  const matrixProducts = products.slice(0, 10);

  return (
    <div>
      <div className="section-head">
        <h1>KI-Matching</h1>
        <div className="sub">Käufer × Produkte · Kompatibilitätsmatrix</div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
      {/* Top Matches */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
          <Ic name="sparkle" size={14} /> Top-Matches
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {topMatches.map((m, i) => {
            const margin = m.product.margin;
            return (
              <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Badge kind={m.sc >= 90 ? 'success' : m.sc >= 80 ? 'info' : 'warning'}>
                    {m.sc}% Match
                  </Badge>
                  {m.product.exportReady && <Badge kind="success">EU-konform</Badge>}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{m.buyer.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{m.buyer.country} · {m.buyer.city}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Ic name="arrow_r" size={12} color="var(--text-3)" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{m.product.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Marge: {margin}%</div>
                  </div>
                </div>
                <button className="btn ghost" style={{ fontSize: 12, marginTop: 4 }} onClick={() => onNav('offers')}>
                  Angebot erstellen
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Match Matrix */}
      <div className="card">
        <div className="card-head">
          <Ic name="layers" size={14} />
          <span className="title">Match-Matrix · Käufer × Produkte</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `180px repeat(${matrixProducts.length}, 60px) 60px`,
            gap: 1,
            background: 'var(--border)',
            minWidth: 'max-content',
          }}>
            {/* Header row */}
            <div style={{ background: 'var(--surface)', padding: '8px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', display: 'flex', alignItems: 'flex-end' }}>
              Käufer \ Produkt
            </div>
            {matrixProducts.map(p => (
              <div key={p.id} style={{
                background: 'var(--surface)',
                height: 100,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                padding: '4px 2px',
              }}>
                <span style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  fontSize: 10,
                  color: 'var(--text-3)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  maxHeight: 90,
                }}>
                  {p.name}
                </span>
              </div>
            ))}
            <div style={{ background: 'var(--surface)', height: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 4 }}>
              <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 10, fontWeight: 600, color: 'var(--text-3)' }}>Total</span>
            </div>

            {/* Data rows */}
            {buyers.map(b => {
              const rowScores = matrixProducts.map(p => score(b, p));
              const total = rowScores.reduce((s, v) => s + v, 0);
              return (
                <React.Fragment key={b.id}>
                  <div style={{ background: 'var(--surface)', padding: '0 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 40 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{b.id}</div>
                  </div>
                  {rowScores.map((sc, pi) => (
                    <div key={pi} style={{ background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div
                        style={{ width: 24, height: 24, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, background: cellColor(sc), color: sc >= 70 ? 'rgba(16,185,129,0.9)' : sc >= 40 ? 'rgba(59,130,246,0.9)' : sc >= 20 ? 'rgba(245,158,11,0.9)' : sc > 0 ? 'rgba(239,68,68,0.9)' : 'transparent' }}
                      >
                        {sc > 0 ? sc : ''}
                      </div>
                    </div>
                  ))}
                  <div style={{ background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                    {total}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, padding: '12px 0 0', fontSize: 11, color: 'var(--text-3)', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(16,185,129,0.35)', display: 'inline-block' }} /> ≥70 Starke Übereinstimmung
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(59,130,246,0.20)', display: 'inline-block' }} /> 40-69 Möglich
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(245,158,11,0.15)', display: 'inline-block' }} /> 20-39 Schwach
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(239,68,68,0.10)', display: 'inline-block' }} /> 1-19 Gering
          </span>
        </div>
      </div>
      </div>
    </div>
  );
};

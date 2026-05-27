'use client';

import React from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtNum, fmtKg } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import type { ProductMaster } from './types';
import { STATUS_MAP, calcReadinessScore } from './types';

interface ProductsListProps { lang: Lang; onOpen: (id: string) => void; }

export const ProductsList = ({ lang, onOpen }: ProductsListProps) => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const totalVariants = M.products.reduce((s, p) => s + p.variants.length, 0);

  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_products')}</h1>
        <div className="sub">{M.products.length} Produkte · {totalVariants} Varianten</div>
        <div className="right">
          <button className="btn primary" onClick={() => window.dispatchEvent(new CustomEvent('open-product-wizard'))}>
            <Ic name="plus" size={13} /> Neues Produkt
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {M.products.map(p => {
            const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
            const iconName   = p.cat === 'Kaffee' ? 'coffee' : 'leaf';
            const master     = (p as unknown as { product_master?: ProductMaster }).product_master ?? {};
            const score      = calcReadinessScore(master);
            const scoreColor = score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';
            const statusInfo = STATUS_MAP[master.productStatus ?? 'active'] ?? STATUS_MAP['active'];

            return (
              <div key={p.id} className="card" style={{ cursor: 'pointer' }} onClick={() => onOpen(p.id)}>
                <div className="card-head">
                  <Ic name={iconName} size={14} />
                  <span className="title">{p.name}</span>
                  <Badge kind={statusInfo.kind as string}>{statusInfo.label}</Badge>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor }}>{score}%</span>
                    <span className="tx3" style={{ fontSize: 9 }}>ready</span>
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                    <div>
                      <div className="tx3" style={{ fontSize: 10 }}>HS-Code</div>
                      <div className="mono fw500" style={{ fontSize: 12 }}>{p.hs || '—'}</div>
                    </div>
                    <div>
                      <div className="tx3" style={{ fontSize: 10 }}>Ursprung</div>
                      <div className="mono" style={{ fontSize: 11 }}>{p.origin || '—'}</div>
                    </div>
                    <div>
                      <div className="tx3" style={{ fontSize: 10 }}>MOQ</div>
                      <div className="mono" style={{ fontSize: 11 }}>{p.moq || '—'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                    <div>
                      <div className="tx3" style={{ fontSize: 10 }}>EK</div>
                      <div className="mono fw500" style={{ fontSize: 12 }}>{p.buyPrice.toFixed(2)} €</div>
                    </div>
                    <div>
                      <div className="tx3" style={{ fontSize: 10 }}>VK</div>
                      <div className="mono fw500" style={{ fontSize: 12, color: '#34d399' }}>{p.sellPrice.toFixed(2)} €</div>
                    </div>
                    <div>
                      <div className="tx3" style={{ fontSize: 10 }}>Marge</div>
                      <div className="mono fw500" style={{ fontSize: 12, color: '#34d399' }}>{p.margin}%</div>
                    </div>
                  </div>
                  {p.variants.length > 0 && (
                    <>
                      <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>
                        Varianten · {fmtKg(totalStock)} verfügbar
                      </div>
                      {p.variants.slice(0, 3).map((v, i) => (
                        <div key={i} className="row" style={{ padding: '3px 0', fontSize: 11, borderBottom: i < Math.min(2, p.variants.length - 1) ? '1px solid var(--border)' : 'none' }}>
                          <span>{v.v}</span>
                          <Badge kind="neutral">{v.grade}</Badge>
                          <span className="mono tx2" style={{ marginLeft: 'auto' }}>{fmtNum(v.stock)} {p.unit}</span>
                        </div>
                      ))}
                      {p.variants.length > 3 && (
                        <div className="tx3" style={{ fontSize: 10.5, marginTop: 4 }}>+{p.variants.length - 3} weitere Varianten</div>
                      )}
                    </>
                  )}
                  {p.certs.length > 0 && (
                    <>
                      <div className="sep" />
                      <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                        {p.certs.map((c, i) => <Badge key={i} kind="ocean">{c}</Badge>)}
                      </div>
                    </>
                  )}
                  {master.descShort && (
                    <div className="tx3" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>
                      {master.descShort.slice(0, 100)}{master.descShort.length > 100 ? '…' : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

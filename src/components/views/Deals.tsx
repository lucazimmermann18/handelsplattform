'use client';

import React from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtCur, fmtNum, fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

interface DealsViewProps {
  lang: Lang;
}

export const DealsView = ({ lang }: DealsViewProps) => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const stages = M.dealStages;

  const totalPipeline = M.deals.reduce((s, d) => s + d.value, 0);
  const totalWeighted = M.deals.reduce((s, d) => s + d.value * (d.prob / 100), 0);

  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_deals')}</h1>
        <div className="sub">
          {M.deals.length} Deals · {fmtCur(totalPipeline)} Pipeline · {fmtCur(totalWeighted)} gewichtet
        </div>
        <div className="right">
          <button className="btn"><Ic name="panel" size={13} /> Listen-Ansicht</button>
          <button className="btn primary"><Ic name="plus" size={13} /> Neuer Deal</button>
        </div>
      </div>

      <div className="kanban">
        {stages.map(st => {
          const stDeals = M.deals.filter(d => d.stage === st);
          const colTotal = stDeals.reduce((s, d) => s + d.value, 0);

          return (
            <div key={st} className="col">
              <div className="col-head">
                <span className="t">{st}</span>
                <span className="ct">{stDeals.length}</span>
                <span className="ct" style={{ marginLeft: 'auto' }}>{fmtCur(colTotal)}</span>
              </div>

              <div className="col-body">
                {stDeals.map(d => {
                  const b = M.buyers.find(x => x.id === d.buyerId);
                  const p = M.products.find(x => x.id === d.productId);
                  return (
                    <div key={d.id} className="deal-card">
                      <div className="t">{p?.name}</div>
                      <div className="meta">
                        {b?.name?.split(' ').slice(0, 3).join(' ')} · {b?.country}
                      </div>
                      <div className="row" style={{ marginTop: 6, gap: 6 }}>
                        <span className="mono tx2" style={{ fontSize: 11 }}>{fmtNum(d.qty)} {p?.unit}</span>
                        <span className="tx3" style={{ fontSize: 11 }}>×</span>
                        <span className="mono tx2" style={{ fontSize: 11 }}>{d.ourPrice.toFixed(2)} €</span>
                      </div>
                      <div className="foot">
                        <span>{fmtCur(d.value)}</span>
                        <Badge kind={d.prob >= 70 ? 'success' : d.prob >= 40 ? 'info' : 'neutral'}>
                          {d.prob}%
                        </Badge>
                      </div>
                      <div className="row tx3" style={{ fontSize: 10, marginTop: 6 }}>
                        <Ic name="clock" size={10} />
                        <span>Follow-up {fmtDate(d.nextFollow)}</span>
                        <span style={{ marginLeft: 'auto' }} className="mono">{d.id.slice(-4)}</span>
                      </div>
                    </div>
                  );
                })}
                {stDeals.length === 0 && (
                  <div className="tx3" style={{ fontSize: 11, padding: 14, textAlign: 'center' }}>
                    Keine Deals
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

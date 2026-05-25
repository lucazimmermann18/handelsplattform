'use client';

import React from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtCur, fmtNum, fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

const STATUS_KIND: Record<string, string> = {
  draft: 'neutral', sent: 'info', viewed: 'info',
  negotiation: 'warning', accepted: 'success',
  rejected: 'danger', expired: 'neutral',
};
const STATUS_LABEL: Record<string, string> = {
  draft: 'Entwurf', sent: 'Gesendet', viewed: 'Angesehen',
  negotiation: 'Verhandlung', accepted: 'Angenommen',
  rejected: 'Abgelehnt', expired: 'Abgelaufen',
};

interface OffersViewProps {
  lang: Lang;
}

export const OffersView = ({ lang }: OffersViewProps) => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const totalVolume = M.offers.reduce((s, o) => s + o.value, 0);

  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_offers')}</h1>
        <div className="sub">{M.offers.length} Angebote · {fmtCur(totalVolume)} Volumen</div>
        <div className="right">
          <button className="btn primary"><Ic name="plus" size={13} /> Neues Angebot</button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Angebot</th>
                <th>Käufer</th>
                <th>Produkt</th>
                <th className="num">Menge</th>
                <th className="num">Preis</th>
                <th className="num">Wert</th>
                <th>Gesendet</th>
                <th>Gültig bis</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {M.offers.map(o => {
                const b = M.buyers.find(x => x.id === o.buyer);
                const p = M.products.find(x => x.id === o.product);
                return (
                  <tr key={o.id}>
                    <td><span className="id fw500">{o.id}</span></td>
                    <td>
                      <div>{b?.name?.split(' ').slice(0, 3).join(' ')}</div>
                      <div className="tx3" style={{ fontSize: 10.5 }}>{b?.country}</div>
                    </td>
                    <td>{p?.name}</td>
                    <td className="num">{fmtNum(o.qty)} {p?.unit}</td>
                    <td className="num mono">{o.price.toFixed(2)} €</td>
                    <td className="num fw500">{fmtCur(o.value)}</td>
                    <td className="mono tx2" style={{ fontSize: 11 }}>{fmtDate(o.sent)}</td>
                    <td className="mono tx2" style={{ fontSize: 11 }}>{fmtDate(o.valid)}</td>
                    <td>
                      <Badge kind={STATUS_KIND[o.status] ?? 'neutral'} dot>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </Badge>
                    </td>
                    <td style={{ display: 'flex', gap: 4 }}>
                      <button className="btn sm ghost" title="Angebot ansehen"><Ic name="eye" size={11} /></button>
                      <button
                        className="btn sm ghost"
                        title="Per E-Mail senden"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('open-email', {
                            detail: {
                              type: 'offer',
                              to: b?.email ?? '',
                              subject: `Angebot ${o.id} – ${p?.name ?? ''}`,
                              data: {
                                buyerName: b?.name ?? 'Käufer',
                                buyerCompany: b?.name,
                                offerRef: o.id,
                                validUntil: o.valid,
                                products: [{ name: p?.name ?? '', qty: String(o.qty), unit: p?.unit ?? 'MT', price: `${o.price.toFixed(2)} €`, total: `${o.value.toLocaleString('de-DE')} €` }],
                                totalValue: o.value.toLocaleString('de-DE'),
                                currency: 'EUR',
                                senderName: 'EastAfrica Export OS',
                              },
                            },
                          }));
                        }}
                      >
                        <Ic name="upload" size={11} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

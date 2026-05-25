'use client';

import React, { useMemo } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtCur, fmtNum, fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge, Stars, BarChart, StatusBadge } from '@/components/ui/primitives';

// ────────────────────────────────────────────────────────────
// Buyers List
// ────────────────────────────────────────────────────────────

interface BuyersListProps {
  lang: Lang;
  onOpen: (id: string) => void;
}

export const BuyersList = ({ lang, onOpen }: BuyersListProps) => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const totalRevenue = M.buyers.reduce((s, b) => s + b.revenue, 0);

  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_buyers')}</h1>
        <div className="sub">
          {M.buyers.length} Käufer · 7 Länder · {fmtCur(totalRevenue)} YTD
        </div>
        <div className="right">
          <button className="btn"><Ic name="filter" size={13} /> {t(lang, 'filter')}</button>
          <button className="btn primary"><Ic name="plus" size={13} /> Neuer Käufer</button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {M.buyers.map(b => (
            <div key={b.id} className="card" style={{ cursor: 'pointer' }} onClick={() => onOpen(b.id)}>
              <div style={{ padding: 14 }}>
                <div className="row" style={{ marginBottom: 8 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 6,
                    background: 'linear-gradient(135deg, #1a2540, #0e1828)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 600, color: '#60a5fa', fontFamily: 'Geist Mono', fontSize: 13,
                    border: '1px solid var(--border)', flexShrink: 0,
                  }}>
                    {b.country}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="fw600" style={{ fontSize: 13 }}>{b.name}</div>
                    <div className="tx3" style={{ fontSize: 11 }}>{b.industry} · {b.city}</div>
                  </div>
                  <Badge kind={b.status === 'aktiv' ? 'success' : b.status === 'in Verhandlung' ? 'warning' : 'info'} dot>
                    {b.status}
                  </Badge>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div className="tx3" style={{ fontSize: 10 }}>Umsatz YTD</div>
                    <div className="mono fw500" style={{ fontSize: 13 }}>{fmtCur(b.revenue)}</div>
                  </div>
                  <div>
                    <div className="tx3" style={{ fontSize: 10 }}>Rating</div>
                    <Stars value={b.rating} />
                  </div>
                  <div>
                    <div className="tx3" style={{ fontSize: 10 }}>Incoterm</div>
                    <div className="mono" style={{ fontSize: 11 }}>{b.incoterm}</div>
                  </div>
                  <div>
                    <div className="tx3" style={{ fontSize: 10 }}>MOQ</div>
                    <div className="mono" style={{ fontSize: 11 }}>{b.moq}</div>
                  </div>
                </div>

                <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Interesse</div>
                <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                  {b.interests.map((p, i) => <Badge key={i} kind="info">{p}</Badge>)}
                </div>

                <div className="sep" />
                <div className="row tx3" style={{ fontSize: 11, gap: 6 }}>
                  <Ic name="mail" size={11} />
                  <span>{b.email}</span>
                  <span style={{ marginLeft: 8 }}><Ic name="phone" size={11} /></span>
                  <span>{b.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Buyer Detail
// ────────────────────────────────────────────────────────────

interface BuyerDetailProps {
  id: string;
  lang: Lang;
  onBack: () => void;
}

export const BuyerDetail = ({ id, lang, onBack }: BuyerDetailProps) => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const b = M.buyers.find(x => x.id === id);
  if (!b) return <div className="empty">Käufer nicht gefunden</div>;

  const buyerOrders = M.orders.filter(o => o.buyerId === id);
  const buyerDeals = M.deals.filter(d => d.buyerId === id);

  // Deterministic revenue history using buyer id as seed
  const seed = b.id.charCodeAt(4) || 42;
  const revHistory = useMemo(() =>
    Array.from({ length: 12 }).map((_, i) => ({
      m: ['J','F','M','A','M','J','J','A','S','O','N','D'][i],
      v: Math.max(0, parseFloat((8 + Math.sin(i / 2 + seed) * 6 + ((seed * (i + 3) * 11) % 100) / 25).toFixed(1))),
    })),
    [seed]
  );

  const avgPayDays = 15 + (seed % 15);
  const creditLimit = b.revenue * 1.5 + 50000;
  const creditUsed = b.revenue * 0.3;

  return (
    <div>
      <div className="section-head">
        <button className="btn ghost" onClick={onBack} style={{ padding: 4 }}>
          <Ic name="chevL" size={14} /> {t(lang, 'back')}
        </button>
        <div style={{
          width: 44, height: 44, borderRadius: 8,
          background: 'linear-gradient(135deg, #1a2540, #0e1828)',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 600, color: '#60a5fa', fontFamily: 'Geist Mono',
        }}>
          {b.country}
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 18 }}>{b.name}</h1>
          <div className="tx3" style={{ fontSize: 12 }}>{b.id} · {b.industry} · {b.city}, {b.country}</div>
        </div>
        <Badge kind={b.status === 'aktiv' ? 'success' : 'warning'} dot>{b.status}</Badge>
        <Stars value={b.rating} />
        <div className="right">
          <button className="btn"><Ic name="mail" size={13} /> Mail</button>
          <button className="btn"><Ic name="star" size={13} /> Angebot</button>
          <button className="btn primary"><Ic name="plus" size={13} /> Neuer Auftrag</button>
        </div>
      </div>

      <div className="detail-grid">
        {/* ── LEFT ── */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Revenue history */}
          <div className="card">
            <div className="card-head">
              <Ic name="chart" size={14} />
              <span className="title">Umsatz-Historie · 12 Monate</span>
              <span className="meta">k €</span>
            </div>
            <div className="card-body">
              <BarChart data={revHistory} w={680} h={150} color="#34d399" lblKey="m" valKey="v" />
              <div className="row tx3" style={{ fontSize: 11, marginTop: 6 }}>
                <span>Gesamt: <span className="mono fw500" style={{ color: '#34d399' }}>{fmtCur(b.revenue)}</span></span>
                <span style={{ marginLeft: 'auto' }}>Ø Auftragsgröße: <span className="mono">{fmtCur(b.revenue / Math.max(1, buyerOrders.length))}</span></span>
              </div>
            </div>
          </div>

          {/* Orders */}
          <div className="card">
            <div className="card-head">
              <Ic name="box" size={14} />
              <span className="title">Aufträge</span>
              <span className="meta">{buyerOrders.length}</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Auftrag</th>
                  <th>Produkt</th>
                  <th className="num">Menge</th>
                  <th className="num">Umsatz</th>
                  <th>Incoterm</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {buyerOrders.length === 0 && (
                  <tr><td colSpan={6} className="empty">Noch keine Aufträge</td></tr>
                )}
                {buyerOrders.map(o => (
                  <tr key={o.id}>
                    <td><span className="id">{o.id}</span></td>
                    <td>{o.productVariant}</td>
                    <td className="num">{fmtNum(o.qty)} {o.unit}</td>
                    <td className="num fw500">{fmtCur(o.revenue)}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{o.incoterm}</td>
                    <td><StatusBadge s={o.status} lang={lang} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pipeline */}
          {buyerDeals.length > 0 && (
            <div className="card">
              <div className="card-head">
                <Ic name="deals" size={14} />
                <span className="title">Pipeline</span>
                <span className="meta">{buyerDeals.length}</span>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Deal</th>
                    <th>Produkt</th>
                    <th className="num">Wert</th>
                    <th>Stage</th>
                    <th>Wahrsch.</th>
                    <th>Follow-up</th>
                  </tr>
                </thead>
                <tbody>
                  {buyerDeals.map(d => {
                    const p = M.products.find(x => x.id === d.productId);
                    return (
                      <tr key={d.id}>
                        <td><span className="id">{d.id}</span></td>
                        <td>{p?.name}</td>
                        <td className="num fw500">{fmtCur(d.value)}</td>
                        <td><Badge kind="info">{d.stage}</Badge></td>
                        <td className="mono">{d.prob}%</td>
                        <td className="mono tx2" style={{ fontSize: 11 }}>{fmtDate(d.nextFollow)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── RIGHT ── */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Kreditprofil */}
          <div className="card">
            <div className="card-head"><Ic name="finance" size={14} /><span className="title">Kreditprofil</span></div>
            <div className="card-body">
              <div className="kpi" style={{ marginBottom: 8 }}>
                <div>
                  <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase' }}>Kreditlimit</div>
                  <div className="mono fw600" style={{ fontSize: 18 }}>{fmtCur(creditLimit)}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase' }}>Genutzt</div>
                  <div className="mono fw600" style={{ fontSize: 14 }}>{fmtCur(creditUsed)}</div>
                </div>
              </div>
              <div className="progress"><div style={{ width: '32%' }} /></div>
              <div className="sep" />
              <div className="fields">
                <div className="l">Zahlungsziel</div><div className="v">{b.terms}</div>
                <div className="l">Ø Zahlungsdauer</div><div className="v mono">{avgPayDays} Tage</div>
                <div className="l">Bonität</div>
                <div className="v">
                  <Badge kind={b.rating >= 4 ? 'success' : b.rating >= 3 ? 'warning' : 'danger'} dot>
                    {b.rating >= 4 ? 'A' : b.rating >= 3 ? 'B' : 'C'}
                  </Badge>
                </div>
                <div className="l">Versicherung</div><div className="v">Allianz Trade · 80% Coverage</div>
                <div className="l">FX-Hedge</div><div className="v">{b.country === 'GB' ? 'GBP Forward 3M' : 'EUR · keiner'}</div>
              </div>
            </div>
          </div>

          {/* Profil */}
          <div className="card">
            <div className="card-head"><Ic name="buyer" size={14} /><span className="title">Profil</span></div>
            <div className="card-body">
              <div className="fields">
                <div className="l">Ansprechpartner</div><div className="v">{b.contact}</div>
                <div className="l">Position</div><div className="v tx2">{b.position}</div>
                <div className="l">E-Mail</div><div className="v mono" style={{ fontSize: 11 }}>{b.email}</div>
                <div className="l">Telefon</div><div className="v mono">{b.phone}</div>
                {b.website && <><div className="l">Website</div><div className="v mono">{b.website}</div></>}
                <div className="l">MOQ</div><div className="v mono">{b.moq}</div>
                <div className="l">Incoterm</div><div className="v mono">{b.incoterm}</div>
              </div>
              <div className="sep" />
              <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Anforderungen</div>
              <div className="row" style={{ gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                {b.certs.map((c, i) => <Badge key={i} kind="ocean">{c}</Badge>)}
              </div>
              <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Produkte von Interesse</div>
              <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                {b.interests.map((p, i) => <Badge key={i} kind="info">{p}</Badge>)}
              </div>
            </div>
          </div>

          {/* AI Insight */}
          <div className="ai-card">
            <div className="head">
              <span className="pill">AI</span>
              <span className="fw600" style={{ fontSize: 12 }}>Käufer-Analyse</span>
            </div>
            <div className="tx2" style={{ fontSize: 11.5, lineHeight: 1.55 }}>
              {b.revenue > 200000 && <span>Top-Kunde mit zuverlässiger Zahlungsmoral. </span>}
              {b.status === 'in Verhandlung' && <span>Aktuelle Verhandlung — Empfehlung: Muster-Versand priorisieren. </span>}
              Reagiert auf <span className="fw500" style={{ color: '#e6eaf2' }}>{b.country === 'DE' ? 'detaillierte technische Specs' : 'Pricing & Lieferzeit'}</span>. Nächste sinnvolle Aktion:{' '}
              <span className="fw500" style={{ color: '#34d399' }}>
                {b.status === 'aktiv' ? `Cross-sell ${b.interests[1] || b.interests[0]}` : 'Erstkontakt-Follow-up in 3 Tagen'}
              </span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import { useData } from '@/lib/data-context';
import { OrderComments } from '@/components/ui/OrderComments';
import { fmtCur, fmtNum, fmtDate, fmtDateLong } from '@/lib/utils';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import type { Order } from '@/lib/types';

// ── helpers ─────────────────────────────────────────────────────────────────

const StatusBadge = ({ s, lang }: { s: string; lang: Lang }) => {
  const { data } = useData();
  return (
    <Badge kind={(data?.statusBadge as Record<string, string> ?? {})[s] || 'neutral'} dot>
      {t(lang, `s_${s}`)}
    </Badge>
  );
};

const ORDER_STATUS_FLOW = [
  { k: 'confirmed',   label: 'Bestätigt',         icon: 'task' },
  { k: 'procurement', label: 'Beschaffung',        icon: 'pkg' },
  { k: 'quality',     label: 'Qualitätsprüfung',   icon: 'quality' },
  { k: 'ready',       label: 'Freigegeben',        icon: 'leaf' },
  { k: 'in_export',   label: 'Exportdokumente',    icon: 'doc' },
  { k: 'shipped',     label: 'Container geladen',  icon: 'pkg' },
  { k: 'in_transit',  label: 'Auf See',            icon: 'ship' },
  { k: 'arrived',     label: 'Zielhafen',          icon: 'pin' },
  { k: 'delivered',   label: 'Geliefert',          icon: 'flag' },
  { k: 'paid',        label: 'Bezahlt',            icon: 'finance' },
];

// ── OrdersList ───────────────────────────────────────────────────────────────

interface OrdersListProps {
  lang: Lang;
  onOpen: (order: Order) => void;
}

export const OrdersList = ({ lang, onOpen }: OrdersListProps) => {
  const { data: M } = useData();
  const [statusFilter, setStatusFilter] = useState('all');
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const filtered = statusFilter === 'all'
    ? M.orders
    : M.orders.filter((o) => o.status === statusFilter);

  const handleExport = () => {
    const buyer = (id: string) => M.buyers.find(b => b.id === id);
    const supplier = (id: string) => M.suppliers.find(s => s.id === id);
    const headers = ['Auftrag-ID', 'Charge', 'Käufer', 'Lieferant', 'Produkt', 'Menge', 'Einheit', 'Umsatz (€)', 'Gewinn (€)', 'Marge (%)', 'Incoterm', 'Ladehafen', 'Zielhafen', 'ETD', 'ETA', 'Zahlung (%)', 'Status'];
    const rows = filtered.map(o => [
      o.id, o.batch,
      buyer(o.buyerId)?.name ?? o.buyerId,
      supplier(o.supplierId)?.name ?? o.supplierId,
      o.productVariant, o.qty, o.unit,
      o.revenue, o.profit,
      o.revenue > 0 ? Math.round((o.profit / o.revenue) * 100) : 0,
      o.incoterm, o.portLoad, o.portDest,
      o.etd, o.eta, o.paid, o.status,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `auftraege-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const totalRev    = filtered.reduce((s, o) => s + o.revenue, 0);
  const totalProfit = filtered.reduce((s, o) => s + o.profit,  0);

  const statusFilters = [
    { id: 'all',         label: 'Alle',         n: M.orders.length },
    { id: 'procurement', label: 'Beschaffung',  n: M.orders.filter((o) => o.status === 'procurement').length },
    { id: 'quality',     label: 'Qualität',     n: M.orders.filter((o) => o.status === 'quality').length },
    { id: 'ready',       label: 'Exportbereit', n: M.orders.filter((o) => o.status === 'ready').length },
    { id: 'in_export',   label: 'Exportdok.',   n: M.orders.filter((o) => o.status === 'in_export').length },
    { id: 'in_transit',  label: 'Auf See',      n: M.orders.filter((o) => o.status === 'in_transit').length },
    { id: 'arrived',     label: 'Angekommen',   n: M.orders.filter((o) => o.status === 'arrived').length },
    { id: 'delivered',   label: 'Geliefert',    n: M.orders.filter((o) => o.status === 'delivered').length },
    { id: 'paid',        label: 'Bezahlt',      n: M.orders.filter((o) => o.status === 'paid').length },
    { id: 'problem',     label: 'Problemfälle', n: M.orders.filter((o) => o.status === 'problem').length },
  ];

  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_orders')}</h1>
        <div className="sub">
          {filtered.length} {t(lang, 'of')} {M.orders.length} · Umsatz {fmtCur(totalRev)} · Gewinn {fmtCur(totalProfit)}
        </div>
        <div className="right">
          <button className="btn"><Ic name="filter" size={13} /> {t(lang, 'filter')}</button>
          <button className="btn" onClick={handleExport}><Ic name="download" size={13} /> {t(lang, 'export')}</button>
          <button
            className="btn primary"
            onClick={() => window.dispatchEvent(new CustomEvent('open-wizard'))}
          >
            <Ic name="plus" size={13} /> {t(lang, 'new')}
          </button>
        </div>
      </div>

      <div className="toolbar" style={{ gap: 6, flexWrap: 'wrap' }}>
        {statusFilters.map((s) => (
          <span
            key={s.id}
            className={`chip ${statusFilter === s.id ? 'on' : ''}`}
            onClick={() => setStatusFilter(s.id)}
          >
            {s.label}&nbsp;<span className="mono tx3" style={{ marginLeft: 2 }}>{s.n}</span>
          </span>
        ))}
        <div className="sp" />
        <span className="tx3" style={{ fontSize: 11 }}>
          Sortiert nach: <span className="tx2 fw500">ETD</span>
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ background: 'var(--surface)' }}>
          <thead>
            <tr>
              <th>Auftrag</th>
              <th>Käufer · Land</th>
              <th>Lieferant</th>
              <th>Produkt</th>
              <th className="num">Menge</th>
              <th className="num">Umsatz</th>
              <th className="num">Marge</th>
              <th>Incoterm</th>
              <th>Route</th>
              <th>ETA</th>
              <th>Zahlung</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const buyer    = M.buyers.find((x) => x.id === o.buyerId);
              const supplier = M.suppliers.find((x) => x.id === o.supplierId);
              const marginPct = o.revenue > 0 ? Math.round((o.profit / o.revenue) * 100) : 0;
              return (
                <tr key={o.id} onClick={() => onOpen(o)}>
                  <td>
                    <div className="id fw500" style={{ color: 'var(--text)' }}>{o.id}</div>
                    <div className="tx3 mono" style={{ fontSize: 10 }}>{o.batch}</div>
                  </td>
                  <td>
                    <div className="fw500">{buyer?.name.split(' ').slice(0, 2).join(' ')}</div>
                    <div className="tx3" style={{ fontSize: 10.5 }}>{buyer?.city} · {buyer?.country}</div>
                  </td>
                  <td>
                    <div>{supplier?.name.split(' ').slice(0, 2).join(' ')}</div>
                    <div className="tx3" style={{ fontSize: 10.5 }}>{supplier?.region}</div>
                  </td>
                  <td><div>{o.productVariant}</div></td>
                  <td className="num">
                    {fmtNum(o.qty)}&nbsp;<span className="tx3">{o.unit}</span>
                  </td>
                  <td className="num fw500">{fmtCur(o.revenue)}</td>
                  <td className="num">
                    <div
                      className={marginPct >= 30 ? 'fw500' : ''}
                      style={{ color: marginPct >= 30 ? '#34d399' : marginPct >= 20 ? '#fbbf24' : '#f87171' }}
                    >
                      {marginPct}%
                    </div>
                    <div className="tx3 mono" style={{ fontSize: 10 }}>{fmtCur(o.profit)}</div>
                  </td>
                  <td><span className="mono" style={{ fontSize: 10.5 }}>{o.incoterm}</span></td>
                  <td>
                    <span className="mono tx2" style={{ fontSize: 10.5 }}>
                      {o.portLoad} → {o.portDest}
                    </span>
                  </td>
                  <td className="mono tx2" style={{ fontSize: 11 }}>{fmtDate(o.eta)}</td>
                  <td>
                    <div className="progress" style={{ width: 50 }}>
                      <div style={{ width: o.paid + '%', background: o.paid === 100 ? '#10b981' : '#3b82f6' }} />
                    </div>
                    <div className="tx3 mono" style={{ fontSize: 10, marginTop: 2 }}>{o.paid}%</div>
                  </td>
                  <td><StatusBadge s={o.status} lang={lang} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── OrderDetail ──────────────────────────────────────────────────────────────

interface OrderDetailProps {
  order: Order;
  lang: Lang;
  onBack: () => void;
}

export const OrderDetail = ({ order: o, lang, onBack }: OrderDetailProps) => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const buyer    = M.buyers.find((x) => x.id === o.buyerId);
  const supplier = M.suppliers.find((x) => x.id === o.supplierId);
  const product  = M.products.find((x) => x.id === o.productId);
  const vessel   = M.vessels[o.vesselIdx];
  const currentIdx = ORDER_STATUS_FLOW.findIndex((x) => x.k === o.status);
  const marginPct  = o.revenue > 0 ? Math.round((o.profit / o.revenue) * 100) : 0;

  const docs = [
    { name: 'Commercial Invoice',      req: true,  status: o.status === 'confirmed' ? 'fehlt' : 'gültig' },
    { name: 'Packing List',            req: true,  status: ['in_export','shipped','in_transit','arrived','delivered','paid'].includes(o.status) ? 'gültig' : 'fehlt' },
    { name: 'Certificate of Origin',   req: true,  status: ['shipped','in_transit','arrived','delivered','paid'].includes(o.status) ? 'gültig' : 'beantragt' },
    { name: 'Phytosanitary Certificate',req: true, status: o.status === 'in_export' ? 'fehlt' : ['shipped','in_transit','arrived','delivered','paid'].includes(o.status) ? 'gültig' : 'später' },
    { name: 'Bill of Lading',          req: true,  status: ['in_transit','arrived','delivered','paid'].includes(o.status) ? 'gültig' : 'später' },
    { name: 'Insurance Certificate',   req: true,  status: ['in_transit','arrived','delivered','paid'].includes(o.status) ? 'gültig' : 'fehlt' },
    { name: 'Lab Report (COA)',         req: false, status: 'gültig' },
    { name: 'Health Certificate',       req: o.productId === 'PRD-008', status: o.productId === 'PRD-008' ? 'fehlt' : 'n.a.' },
  ];

  const finance = [
    { l: 'Umsatz (brutto)',           v:  o.revenue,                      pos: true },
    { l: 'Einkauf Ware',              v: -o.costGoods },
    { l: 'Logistik (Sea + Inland)',   v: -o.costLogistics },
    { l: 'Dokumente / Zoll',          v: -o.costDocs },
    { l: 'Versicherung',              v: -Math.round(o.revenue * 0.012) },
    { l: 'Bank / FX',                 v: -Math.round(o.revenue * 0.005) },
  ];

  const portLoad = M.ports[o.portLoad];
  const portDest = M.ports[o.portDest];

  return (
    <div>
      {/* Header */}
      <div className="section-head">
        <button className="btn ghost" onClick={onBack} style={{ padding: 4 }}>
          <Ic name="chevL" size={14} /> {t(lang, 'back')}
        </button>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 17 }}>{o.id}</h1>
        <StatusBadge s={o.status} lang={lang} />
        <div className="sub">{o.productVariant} · {fmtNum(o.qty)} {o.unit} · {buyer?.name}</div>
        <div className="right">
          <button className="btn"><Ic name="history" size={13} /> Historie</button>
          <button
            className="btn"
            onClick={() => window.dispatchEvent(new CustomEvent('open-email', { detail: {
              type: 'order_confirmation',
              to: buyer?.email ?? '',
              subject: `Auftrag ${o.id} — ${o.productVariant}`,
              recipientName: buyer?.name ?? '',
              data: { orderId: o.id, product: o.productVariant, qty: o.qty, unit: o.unit, eta: o.eta },
            }}))}
          >
            <Ic name="mail" size={13} /> Käufer mailen
          </button>
          <button className="btn" onClick={() => window.print()}><Ic name="download" size={13} /> Auftrag.pdf</button>
          <button className="btn primary"><Ic name="edit" size={13} /> Bearbeiten</button>
        </div>
      </div>

      {/* Status flow */}
      <div className="card" style={{ margin: '0 16px 12px' }}>
        <div className="card-head">
          <Ic name="activity" size={14} />
          <span className="title">Lieferketten-Status</span>
          <span className="meta">Schritt {currentIdx + 1} / {ORDER_STATUS_FLOW.length}</span>
          {o.problem && (
            <Badge kind="danger" dot>{o.problem}</Badge>
          )}
        </div>
        <div style={{ padding: '14px 16px 18px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', minWidth: 900 }}>
            {ORDER_STATUS_FLOW.map((st, i) => {
              const done   = i < currentIdx;
              const active = i === currentIdx;
              return (
                <div key={st.k} style={{ flex: 1, position: 'relative', textAlign: 'center' }}>
                  {i < ORDER_STATUS_FLOW.length - 1 && (
                    <div style={{
                      position: 'absolute', top: 15, left: '55%', right: '-45%', height: 2,
                      background: done ? '#34d399' : 'var(--border)',
                    }} />
                  )}
                  <div style={{
                    width: 30, height: 30, margin: '0 auto', borderRadius: '50%',
                    background: active ? 'rgba(59,130,246,0.18)' : done ? 'rgba(16,185,129,0.18)' : 'var(--surface-2)',
                    border: `1.5px solid ${active ? 'var(--accent)' : done ? '#34d399' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', zIndex: 1,
                    color: active ? 'var(--accent)' : done ? '#34d399' : 'var(--text-3)',
                    boxShadow: active ? '0 0 0 4px rgba(59,130,246,0.12)' : 'none',
                  }}>
                    <Ic name={st.icon} size={13} />
                  </div>
                  <div style={{
                    marginTop: 6, fontSize: 10, lineHeight: 1.3,
                    color: active ? 'var(--text)' : done ? 'var(--text-2)' : 'var(--text-4)',
                    fontWeight: active ? 600 : 400,
                  }}>
                    {st.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {/* Left column */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Live Shipment banner (when at sea) */}
          {['in_export','shipped','in_transit','arrived'].includes(o.status) && vessel && (
            <div className="card">
              <div className="card-head">
                <Ic name="ship" size={14} />
                <span className="title">Live Shipment</span>
                <Badge kind="ocean"><span className="dot" style={{ background: '#22d3ee' }} /> LIVE</Badge>
                <span className="mono tx2" style={{ fontSize: 11, marginLeft: 'auto' }}>
                  {vessel.name} · {vessel.voyage}
                </span>
              </div>
              {/* Map placeholder — LiveMap wird in Phase 3 (Shipments) eingebaut */}
              <div style={{ height: 200, background: 'radial-gradient(ellipse at 50% 40%,#0b1320,#06090f)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <Ic name="ship" size={32} color="#22d3ee" />
                <div>
                  <div className="mono fw600" style={{ color: '#22d3ee', fontSize: 15 }}>{vessel.name}</div>
                  <div className="mono tx3" style={{ fontSize: 11 }}>{o.portLoad} → {o.portDest} · ETA {fmtDateLong(o.eta)}</div>
                </div>
              </div>
              <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                {[
                  { l: 'Vessel',  v: vessel.name },
                  { l: 'Voyage',  v: vessel.voyage },
                  { l: 'IMO',     v: vessel.imo },
                  { l: 'Route',   v: `${o.portLoad} → ${o.portDest}` },
                  { l: 'ETA',     v: fmtDateLong(o.eta) },
                ].map((f, i) => (
                  <div key={i}>
                    <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase' }}>{f.l}</div>
                    <div className="mono fw500" style={{ fontSize: 12 }}>{f.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order facts */}
          <div className="card">
            <div className="card-head"><Ic name="info" size={14} /><span className="title">Auftragsdaten</span></div>
            <div className="card-body">
              <div className="fields">
                <div className="l">Käufer</div>
                <div className="v fw500">{buyer?.name} <span className="tx3">· {buyer?.contact}</span></div>

                <div className="l">Lieferant</div>
                <div className="v">{supplier?.name} <span className="tx3">· {supplier?.region}, {supplier?.country}</span></div>

                <div className="l">Produkt</div>
                <div className="v">{product?.name} · <span className="tx2">{o.productVariant}</span></div>

                <div className="l">Charge</div>
                <div className="v mono">{o.batch}</div>

                <div className="l">Menge</div>
                <div className="v mono">{fmtNum(o.qty)} {o.unit}</div>

                <div className="l">Einkaufspreis</div>
                <div className="v mono">{o.buyPrice.toFixed(2)} € / {o.unit}</div>

                <div className="l">Verkaufspreis</div>
                <div className="v mono">{o.sellPrice.toFixed(2)} € / {o.unit}</div>

                <div className="l">Incoterm</div>
                <div className="v mono">{o.incoterm}</div>

                <div className="l">Ladehafen</div>
                <div className="v">{portLoad?.name} <span className="tx3">· {portLoad?.code}</span></div>

                <div className="l">Zielhafen</div>
                <div className="v">{portDest?.name} <span className="tx3">· {portDest?.code}</span></div>

                <div className="l">Verantwortlich</div>
                <div className="v">{o.responsible}</div>

                <div className="l">Angelegt</div>
                <div className="v mono">{fmtDateLong(o.created)}</div>

                <div className="l">ETD / ETA</div>
                <div className="v mono">{fmtDateLong(o.etd)} → {fmtDateLong(o.eta)}</div>
              </div>
            </div>
          </div>

          {/* Documents checklist */}
          <div className="card">
            <div className="card-head">
              <Ic name="doc" size={14} />
              <span className="title">{t(lang, 'docs_checklist')}</span>
              <span className="meta">
                {docs.filter((d) => d.status === 'gültig').length} / {docs.filter((d) => d.req).length} Pflicht
              </span>
              <div style={{ marginLeft: 'auto' }}>
                <button className="btn sm"><Ic name="upload" size={11} /> Hochladen</button>
              </div>
            </div>
            <table className="table">
              <thead>
                <tr><th>Dokument</th><th>Pflicht</th><th>Status</th><th>Datum</th><th /></tr>
              </thead>
              <tbody>
                {docs.map((d, i) => (
                  <tr key={i}>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Ic name="doc" size={12} />
                        {d.name}
                      </span>
                    </td>
                    <td>
                      {d.req ? <Badge kind="neutral">Pflicht</Badge> : <span className="tx3">Optional</span>}
                    </td>
                    <td>
                      {d.status === 'gültig'    && <Badge kind="success" dot>Gültig</Badge>}
                      {d.status === 'fehlt'     && <Badge kind="danger"  dot>Fehlt</Badge>}
                      {d.status === 'beantragt' && <Badge kind="warning" dot>Beantragt</Badge>}
                      {d.status === 'später'    && <Badge kind="neutral">Später</Badge>}
                      {d.status === 'n.a.'      && <span className="tx3">n.a.</span>}
                    </td>
                    <td className="tx3 mono" style={{ fontSize: 11 }}>
                      {d.status === 'gültig' ? fmtDate(o.created) : '—'}
                    </td>
                    <td style={{ width: 90 }}>
                      {d.status === 'gültig' && (
                        <button className="btn sm ghost"><Ic name="eye" size={11} /></button>
                      )}
                      {d.status === 'fehlt' && (
                        <button className="btn sm primary">Beantragen</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Communication log */}
          <div className="card">
            <div className="card-head">
              <Ic name="mail" size={14} />
              <span className="title">{t(lang, 'communication')}</span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <OrderComments orderId={o.id} />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Finance breakdown */}
          <div className="card">
            <div className="card-head">
              <Ic name="finance" size={14} />
              <span className="title">{t(lang, 'finance_breakdown')}</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase' }}>Erwarteter Gewinn</div>
                  <div className="mono fw600" style={{ fontSize: 22, color: '#34d399' }}>{fmtCur(o.profit)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase' }}>Marge</div>
                  <div className="mono fw600" style={{ fontSize: 18, color: marginPct >= 30 ? '#34d399' : '#fbbf24' }}>{marginPct}%</div>
                </div>
              </div>
              <div className="sep" />
              {finance.map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '4px 0', fontSize: 12 }}>
                  <span className={row.pos ? 'fw500' : 'tx2'}>{row.l}</span>
                  <span className="mono" style={{ marginLeft: 'auto', color: row.pos ? 'var(--text)' : 'var(--text-2)' }}>
                    {row.v > 0 ? '+' : ''}{fmtCur(row.v)}
                  </span>
                </div>
              ))}
              <div className="sep" />
              <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 600 }}>
                <span>Netto Gewinn</span>
                <span className="mono" style={{ marginLeft: 'auto', color: '#34d399' }}>{fmtCur(o.profit)}</span>
              </div>
              <div className="sep" />
              <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>Zahlung Käufer</div>
              <div className="progress" style={{ marginBottom: 4 }}>
                <div style={{ width: o.paid + '%', background: '#10b981' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: 11, color: 'var(--text-2)' }}>
                <span>{o.paid}% erhalten</span>
                <span className="mono" style={{ marginLeft: 'auto' }}>
                  {fmtCur(o.revenue * o.paid / 100)} / {fmtCur(o.revenue)}
                </span>
              </div>
            </div>
          </div>

          {/* Open tasks */}
          {(() => {
            const orderTasks = M.tasks.filter(tk => tk.order === o.id);
            return (
              <div className="card">
                <div className="card-head">
                  <Ic name="task" size={14} />
                  <span className="title">{t(lang, 'open_tasks')}</span>
                  <span className="meta">{orderTasks.length}</span>
                </div>
                {orderTasks.length === 0 ? (
                  <div style={{ padding: '20px 14px', textAlign: 'center' }}>
                    <div className="tx3" style={{ fontSize: 12 }}>Keine offenen Aufgaben</div>
                  </div>
                ) : (
                  <div>
                    {orderTasks.map((task, i) => (
                      <div key={i} className="alert-row" style={{ padding: '9px 12px', alignItems: 'center' }}>
                        <span className="dot" style={{ background: task.prio === 'hoch' ? '#ef4444' : task.prio === 'mittel' ? '#f59e0b' : '#5d667d', width: 6, height: 6, borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
                        <div className="body">
                          <div className="t">{task.t}</div>
                          <div className="m">{task.prio} · fällig {task.due}</div>
                        </div>
                        <input type="checkbox" style={{ accentColor: '#3b82f6' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Related entities */}
          <div className="card">
            <div className="card-head">
              <Ic name="layers" size={14} />
              <span className="title">{t(lang, 'related')}</span>
            </div>
            <div>
              {[
                { ic: 'buyer',   l: 'Käufer',          v: buyer?.name,    sub: buyer?.country },
                { ic: 'supplier',l: 'Lieferant',        v: supplier?.name, sub: `Score ${supplier?.score}` },
                { ic: 'product', l: 'Produkt',          v: product?.name,  sub: `HS ${product?.hs}` },
                { ic: 'quality', l: 'Qualitätsprüfung', v: 'QC-2026-0077', sub: 'Freigegeben' },
                { ic: 'ship',    l: 'Shipment',         v: vessel?.name,   sub: o.id.replace('ORD', 'SHP') },
                { ic: 'doc',     l: 'Vertrag',          v: `CT-${o.id.slice(-4)}`, sub: 'Signiert' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <Ic name={r.ic} size={13} color="#5d667d" />
                  <div style={{ flex: 1 }}>
                    <div className="tx3" style={{ fontSize: 10 }}>{r.l}</div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{r.v}</div>
                  </div>
                  <span className="tx3" style={{ fontSize: 10.5 }}>{r.sub}</span>
                  <Ic name="chevR" size={11} color="#5d667d" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

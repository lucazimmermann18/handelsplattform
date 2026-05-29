'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtCur } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge, StatusBadge } from '@/components/ui/primitives';
import type { Order } from '@/lib/types';

interface CockpitViewProps {
  lang: Lang;
  onOpenOrder: (o: Order) => void;
  onNav: (view: string) => void;
}

export const CockpitView = ({ lang, onOpenOrder, onNav }: CockpitViewProps) => {
  const { data: M } = useData();
  const [section, setSection] = useState('all');
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const sections = [
    { id: 'all', label: t(lang, 'cockpit_sec_all') },
    { id: 'critical', label: t(lang, 'cockpit_sec_critical') },
    { id: 'blockers', label: t(lang, 'cockpit_sec_blockers') },
    { id: 'ready', label: t(lang, 'cockpit_sec_ready') },
    { id: 'money', label: t(lang, 'cockpit_sec_money') },
    { id: 'docs', label: t(lang, 'cockpit_sec_docs') },
    { id: 'demurrage', label: t(lang, 'cockpit_sec_demurrage') },
  ];

  // ── Money at Risk ──
  const atSea = M.orders.filter(o => ['in_transit', 'shipped'].includes(o.status)).reduce((s, o) => s + o.revenue, 0);
  const overdueOrders = M.orders.filter(o => o.paid < 50 && ['delivered', 'arrived'].includes(o.status));
  const overdue = overdueOrders.reduce((s, o) => s + (o.revenue * (100 - o.paid) / 100), 0);
  const blocked = M.orders.filter(o => o.status === 'problem').reduce((s, o) => s + o.revenue, 0);
  const storage = M.inventory.reduce((s, i) => {
    const p = M.products.find(p => i.product.includes(p.name.split(' ')[0]));
    return s + (p ? p.buyPrice * i.qty : 0);
  }, 0);
  const pipeline = M.orders.filter(o => ['procurement', 'quality', 'ready', 'in_export'].includes(o.status)).reduce((s, o) => s + o.revenue, 0);

  const moneyPanels = [
    { label: t(lang, 'cockpit_money_at_sea'), value: atSea, count: M.orders.filter(o => ['in_transit', 'shipped'].includes(o.status)).length, color: '#60a5fa', icon: 'ship', nav: 'shipments' },
    { label: t(lang, 'cockpit_money_overdue'), value: overdue, count: overdueOrders.length, color: '#f87171', icon: 'warn', nav: 'finance' },
    { label: t(lang, 'cockpit_money_blocked'), value: blocked, count: M.orders.filter(o => o.status === 'problem').length, color: '#ef4444', icon: 'danger', nav: 'orders' },
    { label: t(lang, 'cockpit_money_storage'), value: storage, count: M.inventory.length, color: '#fbbf24', icon: 'inv', nav: 'inventory' },
    { label: t(lang, 'cockpit_money_pipeline'), value: pipeline, count: M.orders.filter(o => ['procurement', 'quality', 'ready', 'in_export'].includes(o.status)).length, color: '#34d399', icon: 'pkg', nav: 'orders' },
  ];

  // ── Blockers ──
  const problemOrders = M.orders.filter(o => o.status === 'problem');
  const noDownpaymentOrders = M.orders.filter(o => o.paid === 0 && ['confirmed', 'procurement'].includes(o.status));
  const blockers = [
    ...problemOrders.map((o, idx) => ({
      id: `BLK-${String(idx + 1).padStart(2, '0')}`,
      prio: t(lang, 'cockpit_prio_critical'),
      title: `${t(lang, 'cockpit_blocker_p_title')} ${o.id}`,
      desc: t(lang, 'cockpit_blocker_p_desc'),
      order: o.id,
      impact: o.revenue,
      daysLeft: 0,
      action: () => onOpenOrder(o),
    })),
    ...noDownpaymentOrders.map((o, idx) => ({
      id: `BLK-A${String(idx + 1).padStart(2, '0')}`,
      prio: t(lang, 'cockpit_prio_important'),
      title: `${t(lang, 'cockpit_blocker_a_title')} ${o.id}`,
      desc: t(lang, 'cockpit_blocker_a_desc'),
      order: o.id,
      impact: o.revenue,
      daysLeft: 30,
      action: () => onOpenOrder(o),
    })),
  ];

  // ── Ready to Ship ──
  const readyOrders = M.orders.filter(o => o.status === 'ready');
  const fastReadyOrders = M.orders.filter(o => o.status === 'in_export');

  // ── Document Risk ──
  const docRisk = M.documents.filter(d => ['fehlt', 'läuft ab', 'Entwurf'].includes(d.status));

  // ── Plausibility Checks ──
  const plausibilityChecks = [
    ...M.orders.filter(o => o.paid === 0 && o.status === 'confirmed').map(o => ({
      id: `PC-${o.id}`, sev: 'warn', msg: `${o.id}: Bestätigt, aber 0% Anzahlung erhalten.`,
    })),
    ...M.orders.filter(o => o.paid === 100 && o.status === 'in_transit').map(o => ({
      id: `PC-P-${o.id}`, sev: 'info', msg: `${o.id}: 100% bezahlt, Status noch "in_transit" — Abschlussbuchung prüfen.`,
    })),
    ...M.documents.filter(d => d.status === 'fehlt' && d.order).map(d => ({
      id: `PC-D-${d.id}`, sev: 'warn', msg: `${d.order}: Dokument "${d.name}" fehlt.`,
    })),
  ];

  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'cockpit_title')}</h1>
        <div className="sub">{t(lang, 'cockpit_sub')}</div>
        <div className="right">
          <button className="btn" onClick={() => onNav('intelligence')}><Ic name="sparkle" size={13} /> Intelligence</button>
          <button className="btn" onClick={() => onNav('cashflow')}><Ic name="finance" size={13} /> Cashflow</button>
        </div>
      </div>

      {/* Section Filter */}
      <div style={{ display: 'flex', gap: 4, padding: '0 16px 12px', flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button key={s.id} className={`btn sm ${section === s.id ? 'primary' : ''}`} onClick={() => setSection(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 16px 16px' }}>

        {/* ── Money at Risk ── */}
        {(section === 'all' || section === 'money') && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{t(lang, 'cockpit_money_title')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
              {moneyPanels.map((p, i) => (
                <div key={i} className="card" style={{ padding: 14, cursor: 'pointer', borderLeft: `3px solid ${p.color}` }} onClick={() => onNav(p.nav)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Ic name={p.icon} size={14} color={p.color} />
                    <span className="tx3" style={{ fontSize: 10 }}>{p.label}</span>
                  </div>
                  <div className="mono fw700" style={{ fontSize: 20, color: p.color }}>{fmtCur(p.value)}</div>
                  <div className="tx3" style={{ fontSize: 10, marginTop: 4 }}>{p.count} {t(lang, 'cockpit_money_orders')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Blockers ── */}
        {(section === 'all' || section === 'blockers' || section === 'critical') && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              {t(lang, 'cockpit_blockers_title')}
            </div>
            <div className="card">
              <div className="card-body" style={{ padding: 0 }}>
                <table className="tbl" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>{t(lang, 'cockpit_col_priority')}</th>
                      <th>{t(lang, 'cockpit_col_title_h')}</th>
                      <th>{t(lang, 'cockpit_col_order')}</th>
                      <th>{t(lang, 'cockpit_col_impact')}</th>
                      <th>{t(lang, 'cockpit_col_etd_in')}</th>
                      <th>{t(lang, 'cockpit_col_action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockers.length === 0 && (
                      <tr><td colSpan={6} className="empty tx3" style={{ padding: 16, textAlign: 'center' }}>{t(lang, 'cockpit_no_blockers')}</td></tr>
                    )}
                    {blockers.map(b => (
                      <tr key={b.id}>
                        <td><Badge kind={b.prio === t(lang, 'cockpit_prio_critical') ? 'danger' : 'warning'}>{b.prio}</Badge></td>
                        <td>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{b.title}</div>
                          <div className="tx2" style={{ fontSize: 10 }}>{b.desc}</div>
                        </td>
                        <td className="mono" style={{ fontSize: 11, color: '#60a5fa', cursor: 'pointer' }} onClick={b.action}>{b.order}</td>
                        <td className="mono fw600" style={{ fontSize: 12, color: b.prio === t(lang, 'cockpit_prio_critical') ? '#ef4444' : '#f59e0b' }}>{fmtCur(b.impact)}</td>
                        <td className="mono" style={{ fontSize: 11, color: b.daysLeft <= 3 ? '#ef4444' : b.daysLeft <= 10 ? '#f59e0b' : 'inherit' }}>
                          {b.daysLeft === 0 ? t(lang, 'cockpit_today') : `${b.daysLeft}d`}
                        </td>
                        <td>
                          <button className="btn sm primary" onClick={b.action}>{t(lang, 'cockpit_btn_open')}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Ready to Ship ── */}
        {(section === 'all' || section === 'ready') && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              {t(lang, 'cockpit_ready_title')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="card">
                <div className="card-head">
                  <Ic name="quality" size={14} />
                  <span className="title">{t(lang, 'cockpit_ready_export')} ({readyOrders.length})</span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {readyOrders.length === 0 ? (
                    <div className="empty tx3" style={{ padding: 16, textAlign: 'center' }}>{t(lang, 'cockpit_no_ready')}</div>
                  ) : (
                    <table className="tbl" style={{ width: '100%' }}>
                      <thead><tr><th>{t(lang, 'cockpit_col_order')}</th><th>{t(lang, 'cockpit_col_product')}</th><th>ETD</th><th>{t(lang, 'cockpit_col_value')}</th><th></th></tr></thead>
                      <tbody>
                        {readyOrders.map(o => {
                          const prod = M.products.find(p => p.id === o.productId);
                          return (
                            <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => onOpenOrder(o)}>
                              <td className="mono" style={{ fontSize: 11 }}>{o.id.replace('ORD-2026-', 'ORD-')}</td>
                              <td style={{ fontSize: 11 }}>{prod?.name ?? o.productId}</td>
                              <td className="mono" style={{ fontSize: 11, color: '#34d399' }}>{o.etd.slice(5)}</td>
                              <td className="mono" style={{ fontSize: 11 }}>{fmtCur(o.revenue)}</td>
                              <td><button className="btn sm primary" onClick={e => { e.stopPropagation(); onOpenOrder(o); }}>{t(lang, 'cockpit_btn_shipping')}</button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
              <div className="card">
                <div className="card-head">
                  <Ic name="clock" size={14} />
                  <span className="title">{t(lang, 'cockpit_ready_fast')} ({fastReadyOrders.length})</span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {fastReadyOrders.length === 0 ? (
                    <div className="empty tx3" style={{ padding: 16, textAlign: 'center' }}>{t(lang, 'cockpit_no_fast_ready')}</div>
                  ) : (
                    <table className="tbl" style={{ width: '100%' }}>
                      <thead><tr><th>{t(lang, 'cockpit_col_order')}</th><th>{t(lang, 'status')}</th><th>ETD</th><th>{t(lang, 'cockpit_col_value')}</th><th></th></tr></thead>
                      <tbody>
                        {fastReadyOrders.map(o => (
                          <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => onOpenOrder(o)}>
                            <td className="mono" style={{ fontSize: 11 }}>{o.id.replace('ORD-2026-', 'ORD-')}</td>
                            <td><StatusBadge s={o.status} lang={lang} /></td>
                            <td className="mono" style={{ fontSize: 11, color: '#fbbf24' }}>{o.etd.slice(5)}</td>
                            <td className="mono" style={{ fontSize: 11 }}>{fmtCur(o.revenue)}</td>
                            <td><button className="btn sm" onClick={e => { e.stopPropagation(); onOpenOrder(o); }}>{t(lang, 'cockpit_btn_details')}</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Document Risk ── */}
        {(section === 'all' || section === 'docs') && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              {t(lang, 'cockpit_docs_title')}
            </div>
            <div className="card">
              <div className="card-body" style={{ padding: 0 }}>
                <table className="tbl" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>{t(lang, 'sp_doc_name')}</th>
                      <th>{t(lang, 'type')}</th>
                      <th>{t(lang, 'cockpit_col_order')}</th>
                      <th>{t(lang, 'status')}</th>
                      <th>{t(lang, 'cockpit_col_action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docRisk.map(d => (
                      <tr key={d.id}>
                        <td className="mono tx3" style={{ fontSize: 10 }}>{d.id}</td>
                        <td style={{ fontSize: 11.5 }}>{d.name}</td>
                        <td className="tx2" style={{ fontSize: 11 }}>{d.type}</td>
                        <td className="mono" style={{ fontSize: 11 }}>{d.order ?? '—'}</td>
                        <td>
                          <Badge kind={d.status === 'fehlt' ? 'danger' : d.status === 'läuft ab' ? 'warning' : 'neutral'}>{d.status}</Badge>
                        </td>
                        <td>
                          <button className="btn sm" onClick={() => onNav('documents')}>
                            {d.status === 'fehlt' ? t(lang, 'cockpit_doc_apply') : d.status === 'läuft ab' ? t(lang, 'cockpit_doc_renew') : t(lang, 'cockpit_doc_finalize')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Demurrage ── */}
        {(section === 'all' || section === 'demurrage') && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              {t(lang, 'cockpit_demurrage_title')}
            </div>
            <div className="card">
              <div className="card-body" style={{ padding: 0 }}>
                <table className="tbl" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>{t(lang, 'cockpit_dem_container')}</th>
                      <th>{t(lang, 'cockpit_col_order')}</th>
                      <th>{t(lang, 'cockpit_dem_port')}</th>
                      <th>{t(lang, 'cockpit_dem_carrier')}</th>
                      <th>{t(lang, 'cockpit_dem_free_days')}</th>
                      <th>{t(lang, 'cockpit_dem_remaining')}</th>
                      <th>{t(lang, 'cockpit_dem_per_day')}</th>
                      <th>{t(lang, 'cockpit_dem_risk')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td colSpan={8} className="empty tx3" style={{ padding: 16, textAlign: 'center' }}>{t(lang, 'cockpit_dem_empty')}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Plausibility Checks (only in 'all') ── */}
        {section === 'all' && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              {t(lang, 'cockpit_plaus_title')}
            </div>
            <div className="card">
              <div className="card-body" style={{ padding: '8px 0' }}>
                {plausibilityChecks.length === 0 ? (
                  <div className="tx3" style={{ padding: '12px 16px', fontSize: 12, textAlign: 'center' }}>{t(lang, 'cockpit_no_plaus')}</div>
                ) : plausibilityChecks.map(pc => (
                  <div key={pc.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <Ic name={pc.sev === 'warn' ? 'warn' : 'info'} size={14} color={pc.sev === 'warn' ? '#f59e0b' : '#60a5fa'} />
                    <span className="tx2" style={{ fontSize: 11.5, lineHeight: 1.5 }}>{pc.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick navigation */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button className="btn sm" onClick={() => onNav('orders')}><Ic name="box" size={12} /> {t(lang, 'nav_orders')}</button>
          <button className="btn sm" onClick={() => onNav('documents')}><Ic name="doc" size={12} /> {t(lang, 'nav_documents')}</button>
          <button className="btn sm" onClick={() => onNav('shipments')}><Ic name="ship" size={12} /> {t(lang, 'nav_shipments')}</button>
          <button className="btn sm" onClick={() => onNav('finance')}><Ic name="finance" size={12} /> {t(lang, 'nav_finance')}</button>
          <button className="btn sm" onClick={() => onNav('quality')}><Ic name="quality" size={12} /> {t(lang, 'nav_quality')}</button>
        </div>
      </div>
    </div>
  );
};

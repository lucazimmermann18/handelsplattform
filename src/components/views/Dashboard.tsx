'use client';

import React from 'react';
import { Ic } from '@/components/ui/icons';
import { Badge, Sparkline, BarChart, Donut } from '@/components/ui/primitives';
import { useData } from '@/lib/data-context';
import { fmtCur, fmtDate } from '@/lib/utils';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import type { Order } from '@/lib/types';

interface DashboardProps {
  lang: Lang;
  onNav: (view: string) => void;
  onOpenOrder: (order: Order) => void;
}

export const Dashboard = ({ lang, onNav, onOpenOrder }: DashboardProps) => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const activeOrders = M.orders.filter((o) => !['done'].includes(o.status));
  const inShipping = M.orders.filter((o) => ['in_transit', 'shipped', 'arrived', 'in_export'].includes(o.status));
  const inProc = M.orders.filter((o) => o.status === 'procurement').length;
  const inQual = M.orders.filter((o) => o.status === 'quality').length;
  const expRev = M.orders.filter((o) => !['paid', 'done', 'delivered'].includes(o.status)).reduce((s, o) => s + o.revenue, 0);
  const realRev = M.orders.filter((o) => ['paid', 'delivered', 'done'].includes(o.status)).reduce((s, o) => s + o.revenue, 0);
  const avgMargin = M.orders.length > 0 ? Math.round(M.orders.reduce((s, o) => s + ((o.profit / Math.max(o.revenue, 1)) * 100), 0) / M.orders.length) : 0;
  const invValue = M.inventory.reduce((s, i) => {
    const p = M.products.find((p) => i.product.includes(p.name.split(' ')[0]));
    return s + (p ? p.buyPrice * i.qty : 0);
  }, 0);
  const pipelineValue = M.deals.reduce((s, d) => s + d.value * (d.prob / 100), 0);

  interface KpiEntry {
    lbl: string; v: number | string; sub: string; target: string; icon: string;
    spark?: number[]; up?: boolean; down?: boolean; alert?: boolean; warn?: boolean;
  }
  const activeSupplierCountries = Array.from(new Set(M.suppliers.filter(s => s.status === 'aktiv').map(s => s.country))).length;
  const openOffers = M.offers.filter((o) => ['sent', 'viewed', 'negotiation'].includes(o.status));
  const overdueOrders = M.orders.filter(o => o.paid < 50 && ['delivered', 'arrived'].includes(o.status));
  const overdueAmount = overdueOrders.reduce((s, o) => s + (o.revenue * (100 - o.paid) / 100), 0);
  const criticalAlerts = M.alerts.filter((a: { sev: string }) => a.sev === 'r').length;
  const expiringDocs = M.documents.filter(d => {
    if (!d.expires) return false;
    const exp = new Date(d.expires), today = new Date(M.todayBase);
    if (isNaN(exp.getTime()) || isNaN(today.getTime())) return false;
    const diff = (exp.getTime() - today.getTime()) / 86400000;
    return diff >= 0 && diff <= 30;
  });
  const dealsInNegotiation = M.deals.filter(d => d.stage === 'Verhandlung' || d.stage === 'negotiation').length;
  const tasksHigh = M.tasks.filter(x => x.prio === 'hoch' && x.status !== 'erledigt').length;
  const tasksWaiting = M.tasks.filter(x => x.status === 'wartet').length;

  const flat: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const kpis: KpiEntry[] = [
    { lbl: t(lang, 'kpi_active_orders'), v: activeOrders.length, sub: `${inShipping.length} in Verschiffung`, spark: activeOrders.length > 0 ? [8,9,10,9,11,10,12,11,12] : flat, target: 'orders', icon: 'box' },
    { lbl: t(lang, 'kpi_in_shipping'), v: inShipping.length, sub: `${M.orders.filter(o => o.status === 'in_transit').length} auf See`, spark: inShipping.length > 0 ? [3,4,3,5,4,5,4,5,4] : flat, target: 'shipments', icon: 'ship' },
    { lbl: t(lang, 'kpi_in_procurement'), v: inProc, sub: `${M.suppliers.filter(s => s.status === 'aktiv').length} Lieferanten aktiv`, spark: inProc > 0 ? [2,3,2,3,2,2,3,2,2] : flat, target: 'orders', icon: 'pkg' },
    { lbl: t(lang, 'kpi_in_quality'), v: inQual, sub: `${M.quality.filter(q => q.status === 'in_progress').length} in Labor`, spark: inQual > 0 ? [1,1,2,1,2,1,1,2,1] : flat, target: 'quality', icon: 'quality' },
    { lbl: t(lang, 'kpi_expected_revenue'), v: fmtCur(expRev), sub: `${M.orders.filter(o => !['paid','done','delivered'].includes(o.status)).length} offene Aufträge`, spark: expRev > 0 ? [62,68,72,78,76,82,85,88,92] : flat, target: 'finance', icon: 'finance' },
    { lbl: t(lang, 'kpi_realized_revenue'), v: fmtCur(realRev), sub: `${M.orders.filter(o => ['paid','delivered','done'].includes(o.status)).length} abgeschlossen`, spark: realRev > 0 ? [40,52,58,68,72,84,88,92,99] : flat, target: 'finance', icon: 'chart' },
    { lbl: t(lang, 'kpi_avg_margin'), v: avgMargin + '%', sub: `${M.orders.length} Aufträge`, spark: avgMargin > 0 ? [27,28,28,30,29,31,30,32,31] : flat, target: 'reports', icon: 'activity' },
    { lbl: t(lang, 'kpi_inventory_value'), v: fmtCur(invValue), sub: `${M.inventory.length} SKU`, spark: invValue > 0 ? [120,140,135,150,162,158,170,175,182] : flat, target: 'inventory', icon: 'inv' },
    { lbl: t(lang, 'kpi_open_deals'), v: M.deals.length, sub: fmtCur(pipelineValue) + ' gewichtet', target: 'deals', icon: 'deals' },
    { lbl: t(lang, 'kpi_open_offers'), v: openOffers.length, sub: `${M.offers.length} gesamt`, target: 'offers', icon: 'offer' },
    { lbl: t(lang, 'kpi_supplier_docs'), v: M.documents.length, sub: expiringDocs.length > 0 ? `${expiringDocs.length} laufen ab (30d)` : 'alle aktuell', warn: expiringDocs.length > 0, target: 'documents', icon: 'doc' },
    { lbl: t(lang, 'kpi_overdue_payments'), v: overdueOrders.length, sub: overdueAmount > 0 ? fmtCur(overdueAmount) + ' offen' : 'keine', alert: overdueOrders.length > 0, target: 'finance', icon: 'warn' },
    { lbl: t(lang, 'kpi_critical_alerts'), v: criticalAlerts, sub: `${M.alerts.length} gesamt`, alert: criticalAlerts > 0, target: 'compliance', icon: 'danger' },
    { lbl: t(lang, 'kpi_suppliers_active'), v: M.suppliers.filter((s) => s.status === 'aktiv').length, sub: `${activeSupplierCountries} ${activeSupplierCountries === 1 ? 'Land' : 'Länder'}`, target: 'suppliers', icon: 'supplier' },
    { lbl: t(lang, 'kpi_buyers_pipeline'), v: M.buyers.length, sub: `${dealsInNegotiation} in Verhandlung`, target: 'buyers', icon: 'buyer' },
    { lbl: t(lang, 'section_tasks'), v: M.tasks.filter((x) => x.status !== 'erledigt').length, sub: `${tasksHigh} hoch · ${tasksWaiting} wartet`, target: 'tasks', icon: 'task' },
  ];

  const byStatus = ['procurement','quality','ready','in_export','in_transit','arrived','delivered','paid','problem'].map((s) => {
    const colorMap: Record<string, string> = { procurement: '#60a5fa', quality: '#fbbf24', ready: '#34d399', in_export: '#f59e0b', in_transit: '#22d3ee', arrived: '#34d399', delivered: '#10b981', paid: '#10b981', problem: '#ef4444' };
    return { name: t(lang, `s_${s}`), v: M.orders.filter((o) => o.status === s).length, color: colorMap[s] };
  }).filter((x) => x.v > 0);

  const byStage = M.dealStages.map((st: string) => ({ m: st.slice(0, 6), v: Math.round(M.deals.filter((d) => d.stage === st).reduce((s, d) => s + d.value, 0) / 1000) }));

  const revData = M.revTrend.map((r) => ({ m: r.m, v: r.real / 1000, v2: r.margin }));

  return (
    <div style={{ padding: 14 }}>
      {/* Morning Brief AI Card */}
      <div className="ai-card" style={{ padding: 14, marginBottom: 12, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Ic name="sparkle" size={16} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4, gap: 8 }}>
            <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 3, background: 'rgba(167,139,250,0.15)', color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>AI · Tagesbriefing</span>
            <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => onNav('intelligence')}><Ic name="arrow_r" size={11} /> Intelligence</button>
          </div>
          <div className="fw600" style={{ fontSize: 14, marginBottom: 4 }}>KI-Briefing noch nicht konfiguriert</div>
          <div className="tx2" style={{ fontSize: 11.5 }}>Verbinde eine KI-Integration unter Intelligence um automatische Tagesanalysen zu erhalten.</div>
        </div>
      </div>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{t(lang, 'welcome_back')}</h1>
        <span className="tx3" style={{ fontSize: 12 }}>{t(lang, 'overview')} · {new Date(M.todayBase).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className="btn"><Ic name="refresh" size={13} /> {t(lang, 'refresh')}</button>
          <button className="btn"><Ic name="download" size={13} /> {t(lang, 'export')}</button>
          <button className="btn primary" onClick={() => window.dispatchEvent(new CustomEvent('open-wizard'))}><Ic name="plus" size={13} /> {t(lang, 'new')} Auftrag</button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8, marginBottom: 12 }}>
        {kpis.map((k, i) => (
          <div key={i} className={`tile kacheln ${k.alert ? 'alert' : ''} ${k.warn ? 'warn' : ''}`} onClick={() => onNav(k.target)}>
            <div className="head">
              <span className="lbl">{k.lbl}</span>
              <span className="ico"><Ic name={k.icon} size={13} /></span>
            </div>
            <div className="v" style={{ fontSize: 19 }}>{String(k.v)}</div>
            <div className="sub">
              {k.up && <span className="up">▲</span>}
              {k.down && <span className="down">▼</span>}
              <span>{k.sub}</span>
              {k.spark && <span style={{ marginLeft: 'auto' }}><Sparkline data={k.spark} w={48} h={16} color={k.alert ? '#ef4444' : k.warn ? '#f59e0b' : '#60a5fa'} /></span>}
            </div>
          </div>
        ))}
      </div>

      {/* Row: Alerts + Donut + Pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.2fr', gap: 12, marginBottom: 12 }}>
        {/* Alerts */}
        <div className="card">
          <div className="card-head">
            <Ic name="bell" size={14} />
            <span className="title">{t(lang, 'section_alerts')}</span>
            <Badge kind="danger">{M.alerts.filter(a => a.sev === 'r').length} kritisch</Badge>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              <span className="chip on">Alle</span>
              <span className="chip">Kritisch</span>
              <span className="chip">Warn</span>
            </div>
          </div>
          <div>
            {M.alerts.map((a, i) => (
              <div className="alert-row" key={i}>
                <div className={`ic ${a.sev}`}><Ic name={a.sev === 'r' ? 'warn' : a.sev === 'w' ? 'clock' : 'info'} size={11} /></div>
                <div className="body">
                  <div className="t">{a.t}</div>
                  <div className="m">{a.m}</div>
                </div>
                <div className="time">{a.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders by status donut */}
        <div className="card">
          <div className="card-head"><Ic name="layers" size={14} /><span className="title">{t(lang, 'section_orders_status')}</span><span className="meta">{M.orders.length} gesamt</span></div>
          <div className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Donut data={byStatus} size={118} thickness={16} />
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11 }}>
              {byStatus.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="dot" style={{ background: s.color, width: 6, height: 6, borderRadius: '50%', display: 'inline-block' }} />
                  <span className="tx2" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                  <span className="mono fw500">{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pipeline */}
        <div className="card">
          <div className="card-head"><Ic name="deals" size={14} /><span className="title">{t(lang, 'section_pipeline')}</span><span className="meta">{fmtCur(M.deals.reduce((s, d) => s + d.value, 0))} brutto</span></div>
          <div className="card-body" style={{ paddingTop: 4 }}>
            <BarChart data={byStage} w={380} h={120} color="#3b82f6" lblKey="m" valKey="v" />
            <div style={{ display: 'flex', fontSize: 10, marginTop: 4, justifyContent: 'space-between', color: 'var(--text-3)' }}>
              <span>Wert in k €</span>
              <span>Ø Win-Rate: <span className="mono tx2">38%</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Row: Revenue chart + Recent orders + Tasks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 2fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Revenue chart */}
        <div className="card">
          <div className="card-head"><Ic name="chart" size={14} /><span className="title">{t(lang, 'section_revenue')}</span></div>
          <div className="card-body" style={{ paddingTop: 4 }}>
            <BarChart data={revData} w={340} h={120} color="#3b82f6" secondColor="#22d3ee" valKey="v" val2Key="v2" lblKey="m" />
            <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 10.5 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><span style={{ width: 10, height: 3, background: '#3b82f6', display: 'inline-block', borderRadius: 2 }} />Umsatz (k€)</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><span style={{ width: 10, height: 3, background: '#22d3ee', display: 'inline-block', borderRadius: 2 }} />Marge (k€)</div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="card-head">
            <Ic name="box" size={14} />
            <span className="title">{t(lang, 'section_recent_orders')}</span>
            <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={() => onNav('orders')}>{t(lang, 'all')} →</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Auftrag</th>
                <th>Käufer · Produkt</th>
                <th>Menge</th>
                <th className="num">Umsatz</th>
                <th>ETA</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {M.orders.slice(0, 8).map((o) => {
                const buyer = M.buyers.find((b) => b.id === o.buyerId);
                const product = M.products.find((p) => p.id === o.productId);
                return (
                  <tr key={o.id} onClick={() => onOpenOrder(o)}>
                    <td><span className="id">{o.id}</span></td>
                    <td>
                      <div className="fw500" style={{ fontSize: 12 }}>{buyer?.name.split(' ').slice(0, 2).join(' ') || o.buyerId}</div>
                      <div className="tx3" style={{ fontSize: 10.5 }}>{product?.name.split(' ').slice(0, 3).join(' ') || o.productId}</div>
                    </td>
                    <td className="mono tx2" style={{ fontSize: 11 }}>{o.qty} {o.unit}</td>
                    <td className="num mono fw500">{fmtCur(o.revenue)}</td>
                    <td className="mono tx2" style={{ fontSize: 11 }}>{fmtDate(o.eta)}</td>
                    <td>
                      <Badge kind={(M.statusBadge as Record<string, string>)[o.status] || 'neutral'} dot>
                        {t(lang, `s_${o.status}`)}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Tasks */}
        <div className="card">
          <div className="card-head">
            <Ic name="task" size={14} />
            <span className="title">{t(lang, 'section_tasks')}</span>
            <span className="meta">{M.tasks.filter((x) => x.status !== 'erledigt').length} offen</span>
          </div>
          <div>
            {M.tasks.slice(0, 8).map((tk, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 16, height: 16, borderRadius: 3, border: '1.5px solid var(--border-2)', marginTop: 1, flexShrink: 0, background: tk.status === 'erledigt' ? 'var(--success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {tk.status === 'erledigt' && <Ic name="quality" size={10} color="white" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: tk.status === 'erledigt' ? 'var(--text-3)' : 'var(--text)' }}>{tk.t}</div>
                  <div className="tx3" style={{ fontSize: 10.5 }}>{tk.order} · {fmtDate(tk.due)}</div>
                </div>
                <Badge kind={tk.prio === 'hoch' ? 'danger' : tk.prio === 'mittel' ? 'warning' : 'neutral'}>{tk.prio}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row: Top Buyers + Top Suppliers + Quick Access */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {/* Top Buyers */}
        <div className="card">
          <div className="card-head"><Ic name="buyer" size={14} /><span className="title">{t(lang, 'section_top_buyers')}</span></div>
          <div>
            {M.buyers.slice(0, 5).map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 28, height: 28, borderRadius: 5, background: 'linear-gradient(135deg,#1a2540,#0e1828)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#60a5fa', fontWeight: 600, border: '1px solid var(--border)', flexShrink: 0 }}>{b.country}</div>
                <div style={{ flex: 1 }}>
                  <div className="fw500" style={{ fontSize: 12 }}>{b.name.split(' ').slice(0, 3).join(' ')}</div>
                  <div className="tx3" style={{ fontSize: 10.5 }}>{b.industry}</div>
                </div>
                <div className="mono fw500" style={{ fontSize: 12 }}>{fmtCur(b.revenue)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Suppliers */}
        <div className="card">
          <div className="card-head"><Ic name="supplier" size={14} /><span className="title">{t(lang, 'section_top_suppliers')}</span></div>
          <div>
            {M.suppliers.slice(0, 5).map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 28, height: 28, borderRadius: 5, background: 'linear-gradient(135deg,#0f1a0f,#081208)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: '#34d399', fontWeight: 600, border: '1px solid var(--border)', flexShrink: 0 }}>{s.tier}</div>
                <div style={{ flex: 1 }}>
                  <div className="fw500" style={{ fontSize: 12 }}>{s.name.split(' ').slice(0, 3).join(' ')}</div>
                  <div className="tx3" style={{ fontSize: 10.5 }}>{s.country}{s.products[0] ? ` · ${s.products[0]}` : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {Array.from({ length: 5 }).map((_, si) => (
                    <svg key={si} viewBox="0 0 10 10" fill={si < s.score ? '#d4a44a' : 'var(--border-3)'} style={{ width: 9, height: 9 }}>
                      <path d="M5 1l1.2 2.8 3 .3-2.2 2 .7 2.9L5 7.5l-2.7 1.5.7-2.9L.8 4.1l3-.3z" />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access */}
        <div className="card">
          <div className="card-head"><Ic name="sparkle" size={14} /><span className="title">{t(lang, 'section_quick')}</span></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Neuer Auftrag', icon: 'plus', color: '#3b82f6', action: () => window.dispatchEvent(new CustomEvent('open-wizard')) },
                { label: 'Shipment Map', icon: 'map', color: '#06b6d4', action: () => onNav('shipments') },
                { label: 'Intelligence Hub', icon: 'sparkle', color: '#a78bfa', action: () => onNav('intelligence') },
                { label: 'Dokumente', icon: 'doc', color: '#f59e0b', action: () => onNav('documents') },
                { label: 'Deals', icon: 'deals', color: '#34d399', action: () => onNav('deals') },
                { label: 'Reports', icon: 'chart', color: '#f87171', action: () => onNav('reports') },
                { label: 'Daten-Import', icon: 'upload', color: '#60a5fa', action: () => onNav('import') },
                { label: 'Einstellungen', icon: 'settings', color: '#5d667d', action: () => onNav('settings') },
              ].map((q, i) => (
                <button key={i} className="btn" style={{ justifyContent: 'flex-start', gap: 8, padding: '7px 10px' }} onClick={q.action}>
                  <span style={{ color: q.color }}><Ic name={q.icon} size={14} /></span>
                  <span style={{ fontSize: 11.5 }}>{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

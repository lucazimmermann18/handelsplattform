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
    { id: 'all', label: 'Alle' },
    { id: 'critical', label: 'Kritisch' },
    { id: 'blockers', label: 'Blocker' },
    { id: 'ready', label: 'Exportbereit' },
    { id: 'money', label: 'Money at Risk' },
    { id: 'docs', label: 'Dokumente' },
    { id: 'demurrage', label: 'Demurrage' },
  ];

  // ── Money at Risk ──
  const atSea = M.orders.filter(o => ['in_transit', 'shipped'].includes(o.status)).reduce((s, o) => s + o.revenue, 0);
  const overdue = 43920;
  const blocked = M.orders.filter(o => o.status === 'problem').reduce((s, o) => s + o.revenue, 0);
  const storage = M.inventory.reduce((s, i) => {
    const p = M.products.find(p => i.product.includes(p.name.split(' ')[0]));
    return s + (p ? p.buyPrice * i.qty : 0);
  }, 0);
  const pipeline = M.orders.filter(o => ['procurement', 'quality', 'ready', 'in_export'].includes(o.status)).reduce((s, o) => s + o.revenue, 0);

  const moneyPanels = [
    { label: 'Auf See', value: atSea, count: M.orders.filter(o => ['in_transit', 'shipped'].includes(o.status)).length, color: '#60a5fa', icon: 'ship', nav: 'shipments' },
    { label: 'Überfällig', value: overdue, count: 2, color: '#f87171', icon: 'warn', nav: 'finance' },
    { label: 'Blockiert', value: blocked, count: M.orders.filter(o => o.status === 'problem').length, color: '#ef4444', icon: 'danger', nav: 'orders' },
    { label: 'Lager', value: storage, count: M.inventory.length, color: '#fbbf24', icon: 'inv', nav: 'inventory' },
    { label: 'Pipeline', value: pipeline, count: M.orders.filter(o => ['procurement', 'quality', 'ready', 'in_export'].includes(o.status)).length, color: '#34d399', icon: 'pkg', nav: 'orders' },
  ];

  // ── Blockers ──
  const blockers = [
    {
      id: 'BLK-01', prio: 'kritisch', title: 'Phyto-Cert ORD-0144 fehlt',
      desc: 'Phytosanitary Certificate für Cashew W320 Organic nicht beantragt. ETD in 8 Tagen.',
      order: 'ORD-2026-0144', impact: 61000, daysLeft: 8,
      action: () => onOpenOrder(M.orders.find(o => o.id === 'ORD-2026-0144')!),
    },
    {
      id: 'BLK-02', prio: 'kritisch', title: 'EU Vet Approval Iringa Meat',
      desc: 'EU Veterinärzulassung für SUP-072 fehlt. ORD-0118 blockiert, Halal Foods wartet.',
      order: 'ORD-2026-0118', impact: 113400, daysLeft: 0,
      action: () => onOpenOrder(M.orders.find(o => o.id === 'ORD-2026-0118')!),
    },
    {
      id: 'BLK-03', prio: 'wichtig', title: 'QC-Hold Sesame SES-2026-031',
      desc: 'Qualitätsprüfung läuft, Feinanalyse ausstehend. Export blockiert bis Freigabe.',
      order: 'ORD-2026-0133', impact: 48400, daysLeft: 12,
      action: () => onOpenOrder(M.orders.find(o => o.id === 'ORD-2026-0133')!),
    },
    {
      id: 'BLK-04', prio: 'wichtig', title: 'Anzahlung Antwerpen Building Supplies',
      desc: 'ORD-0126 bestätigt, aber 0% Anzahlung erhalten. Produktion kann nicht starten.',
      order: 'ORD-2026-0126', impact: 13920, daysLeft: 34,
      action: () => onOpenOrder(M.orders.find(o => o.id === 'ORD-2026-0126')!),
    },
  ];

  // ── Ready to Ship ──
  const readyOrders = M.orders.filter(o => o.status === 'ready');
  const fastReadyOrders = M.orders.filter(o => o.status === 'in_export');

  // ── Document Risk ──
  const docRisk = M.documents.filter(d => ['fehlt', 'läuft ab', 'Entwurf'].includes(d.status));

  // ── Free Days / Demurrage ──
  const containers = [
    { id: 'MSCU4421889', order: 'ORD-2026-0142', port: 'Hamburg', carrier: 'MSC', daysLeft: 4, demurragePerDay: 85, freeDays: 14 },
    { id: 'LMCU8814226', order: 'ORD-2026-0137', port: 'Genova', carrier: 'Hapag-Lloyd', daysLeft: 2, demurragePerDay: 95, freeDays: 10 },
    { id: 'CMAU1108742', order: 'ORD-2026-0139', port: 'Rotterdam', carrier: 'CMA CGM', daysLeft: 7, demurragePerDay: 120, freeDays: 14 },
    { id: 'HLXU9982311', order: 'ORD-2026-0135', port: 'Felixstowe', carrier: 'ONE', daysLeft: 11, demurragePerDay: 75, freeDays: 14 },
  ];

  // ── Plausibility Checks ──
  const plausibilityChecks = [
    { id: 'PC-01', sev: 'warn', msg: 'ORD-0144: Sell-Price 6,10 USD/kg < Marktpreis 7,10 USD/kg. Preis anpassen?' },
    { id: 'PC-02', sev: 'warn', msg: 'ORD-0118: ETD heute — EU Vet Approval fehlt. Verschiffung unmöglich.' },
    { id: 'PC-03', sev: 'info', msg: 'ORD-0126: Käufer-Incoterm CFR, aber kein Spediteur gebucht.' },
    { id: 'PC-04', sev: 'warn', msg: 'SUP-018 Organic-Zertifikat läuft in 14d ab — 2 laufende Aufträge betroffen.' },
    { id: 'PC-05', sev: 'info', msg: 'ORD-0133: QC pending > 3 Tage — Eskalation an Labor empfohlen.' },
    { id: 'PC-06', sev: 'info', msg: 'Deal D-2026-0179: Follow-up 1 Tag überfällig (Hanseatic Coffee).' },
    { id: 'PC-07', sev: 'warn', msg: 'ORD-0135: Paid = 100%, aber Status noch "in_transit" — Abschlussbuchung prüfen.' },
  ];

  const showSection = (id: string) => section === 'all' || section === id;

  return (
    <div>
      <div className="section-head">
        <h1>Operations Cockpit</h1>
        <div className="sub">Bin ich auf Kurs? · Blocker · Exportbereit · Demurrage · Dokumente</div>
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
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Money at Risk</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
              {moneyPanels.map((p, i) => (
                <div key={i} className="card" style={{ padding: 14, cursor: 'pointer', borderLeft: `3px solid ${p.color}` }} onClick={() => onNav(p.nav)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Ic name={p.icon} size={14} color={p.color} />
                    <span className="tx3" style={{ fontSize: 10 }}>{p.label}</span>
                  </div>
                  <div className="mono fw700" style={{ fontSize: 20, color: p.color }}>{fmtCur(p.value)}</div>
                  <div className="tx3" style={{ fontSize: 10, marginTop: 4 }}>{p.count} Aufträge</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Blockers ── */}
        {(section === 'all' || section === 'blockers' || section === 'critical') && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Blocker &amp; Kritische Punkte
            </div>
            <div className="card">
              <div className="card-body" style={{ padding: 0 }}>
                <table className="tbl" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Priorität</th>
                      <th>Titel</th>
                      <th>Auftrag</th>
                      <th>Impact</th>
                      <th>ETD in</th>
                      <th>Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockers.map(b => (
                      <tr key={b.id}>
                        <td><Badge kind={b.prio === 'kritisch' ? 'danger' : 'warning'}>{b.prio}</Badge></td>
                        <td>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{b.title}</div>
                          <div className="tx2" style={{ fontSize: 10 }}>{b.desc}</div>
                        </td>
                        <td className="mono" style={{ fontSize: 11, color: '#60a5fa', cursor: 'pointer' }} onClick={b.action}>{b.order}</td>
                        <td className="mono fw600" style={{ fontSize: 12, color: b.prio === 'kritisch' ? '#ef4444' : '#f59e0b' }}>{fmtCur(b.impact)}</td>
                        <td className="mono" style={{ fontSize: 11, color: b.daysLeft <= 3 ? '#ef4444' : b.daysLeft <= 10 ? '#f59e0b' : 'inherit' }}>
                          {b.daysLeft === 0 ? 'Heute' : `${b.daysLeft}d`}
                        </td>
                        <td>
                          <button className="btn sm primary" onClick={b.action}>Öffnen</button>
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
              Exportbereit &amp; Fast Ready
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="card">
                <div className="card-head">
                  <Ic name="quality" size={14} />
                  <span className="title">Exportbereit ({readyOrders.length})</span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {readyOrders.length === 0 ? (
                    <div className="empty tx3" style={{ padding: 16, textAlign: 'center' }}>Keine exportbereiten Aufträge</div>
                  ) : (
                    <table className="tbl" style={{ width: '100%' }}>
                      <thead><tr><th>Auftrag</th><th>Produkt</th><th>ETD</th><th>Wert</th><th></th></tr></thead>
                      <tbody>
                        {readyOrders.map(o => {
                          const prod = M.products.find(p => p.id === o.productId);
                          return (
                            <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => onOpenOrder(o)}>
                              <td className="mono" style={{ fontSize: 11 }}>{o.id.replace('ORD-2026-', 'ORD-')}</td>
                              <td style={{ fontSize: 11 }}>{prod?.name ?? o.productId}</td>
                              <td className="mono" style={{ fontSize: 11, color: '#34d399' }}>{o.etd.slice(5)}</td>
                              <td className="mono" style={{ fontSize: 11 }}>{fmtCur(o.revenue)}</td>
                              <td><button className="btn sm primary" onClick={e => { e.stopPropagation(); onOpenOrder(o); }}>Verschiffung</button></td>
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
                  <span className="title">Fast Ready — Exportdokumente ({fastReadyOrders.length})</span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {fastReadyOrders.length === 0 ? (
                    <div className="empty tx3" style={{ padding: 16, textAlign: 'center' }}>Keine Aufträge in Exportdokumenten</div>
                  ) : (
                    <table className="tbl" style={{ width: '100%' }}>
                      <thead><tr><th>Auftrag</th><th>Status</th><th>ETD</th><th>Wert</th><th></th></tr></thead>
                      <tbody>
                        {fastReadyOrders.map(o => (
                          <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => onOpenOrder(o)}>
                            <td className="mono" style={{ fontSize: 11 }}>{o.id.replace('ORD-2026-', 'ORD-')}</td>
                            <td><StatusBadge s={o.status} lang={lang} /></td>
                            <td className="mono" style={{ fontSize: 11, color: '#fbbf24' }}>{o.etd.slice(5)}</td>
                            <td className="mono" style={{ fontSize: 11 }}>{fmtCur(o.revenue)}</td>
                            <td><button className="btn sm" onClick={e => { e.stopPropagation(); onOpenOrder(o); }}>Details</button></td>
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
              Dokumente mit Handlungsbedarf
            </div>
            <div className="card">
              <div className="card-body" style={{ padding: 0 }}>
                <table className="tbl" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Dokument</th>
                      <th>Typ</th>
                      <th>Auftrag</th>
                      <th>Status</th>
                      <th>Aktion</th>
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
                            {d.status === 'fehlt' ? 'Beantragen' : d.status === 'läuft ab' ? 'Erneuern' : 'Finalisieren'}
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
              Liegegeld &amp; Free Days
            </div>
            <div className="card">
              <div className="card-body" style={{ padding: 0 }}>
                <table className="tbl" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Container</th>
                      <th>Auftrag</th>
                      <th>Hafen</th>
                      <th>Carrier</th>
                      <th>Free Days</th>
                      <th>Verbleibend</th>
                      <th>Demurrage/Tag</th>
                      <th>Risiko</th>
                    </tr>
                  </thead>
                  <tbody>
                    {containers.map(c => (
                      <tr key={c.id}>
                        <td className="mono" style={{ fontSize: 11 }}>{c.id}</td>
                        <td className="mono" style={{ fontSize: 11, color: '#60a5fa', cursor: 'pointer' }} onClick={() => onNav('orders')}>{c.order.replace('ORD-2026-', 'ORD-')}</td>
                        <td style={{ fontSize: 11 }}>{c.port}</td>
                        <td className="tx2" style={{ fontSize: 11 }}>{c.carrier}</td>
                        <td className="mono" style={{ fontSize: 11 }}>{c.freeDays}d</td>
                        <td className="mono fw600" style={{ fontSize: 12, color: c.daysLeft <= 3 ? '#ef4444' : c.daysLeft <= 7 ? '#f59e0b' : '#34d399' }}>
                          {c.daysLeft}d
                        </td>
                        <td className="mono" style={{ fontSize: 11 }}>€ {c.demurragePerDay}/d</td>
                        <td>
                          <Badge kind={c.daysLeft <= 3 ? 'danger' : c.daysLeft <= 7 ? 'warning' : 'success'}>
                            {c.daysLeft <= 3 ? 'kritisch' : c.daysLeft <= 7 ? 'beobachten' : 'ok'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
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
              Plausibilitätsprüfungen
            </div>
            <div className="card">
              <div className="card-body" style={{ padding: '8px 0' }}>
                {plausibilityChecks.map(pc => (
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

'use client';

import React from 'react';
import { Ic } from '@/components/ui/icons';
import { MOCK } from '@/lib/mock';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';

const NAV = [
  { group: 'group_overview', items: [
    { id: 'dashboard', icon: 'dashboard', label: 'nav_dashboard' },
    { id: 'cockpit', icon: 'activity', label: 'Cockpit' },
    { id: 'intelligence', icon: 'sparkle', label: 'Intelligence' },
    { id: 'strategy', icon: 'flag', label: 'Strategie' },
    { id: 'compliance_roadmap', icon: 'leaf', label: 'Compliance-Roadmap' },
    { id: 'capital', icon: 'finance', label: 'Capital' },
  ]},
  { group: 'group_sales', items: [
    { id: 'deals', icon: 'deals', label: 'nav_deals', count: () => MOCK.deals.length },
    { id: 'offers', icon: 'offer', label: 'nav_offers', count: () => MOCK.offers.length },
    { id: 'samples', icon: 'pkg', label: 'Muster' },
    { id: 'buyers', icon: 'buyer', label: 'nav_buyers', count: () => MOCK.buyers.length },
    { id: 'matching', icon: 'sparkle', label: 'Matching' },
  ]},
  { group: 'group_ops', items: [
    { id: 'orders', icon: 'box', label: 'nav_orders', count: () => MOCK.orders.filter((o) => !['done', 'paid'].includes(o.status)).length },
    { id: 'shipments', icon: 'ship', label: 'nav_shipments', count: () => MOCK.orders.filter((o) => ['in_export', 'shipped', 'in_transit', 'arrived'].includes(o.status)).length },
    { id: 'forwarders', icon: 'layers', label: 'Spediteure' },
    { id: 'calendar', icon: 'clock', label: 'Kalender' },
    { id: 'suppliers', icon: 'supplier', label: 'nav_suppliers', count: () => MOCK.suppliers.length },
    { id: 'products', icon: 'product', label: 'nav_products', count: () => MOCK.products.length },
    { id: 'quality', icon: 'quality', label: 'nav_quality' },
    { id: 'inventory', icon: 'inv', label: 'nav_inventory' },
    { id: 'tasks', icon: 'task', label: 'nav_tasks', count: () => MOCK.tasks.length },
  ]},
  { group: 'group_finance', items: [
    { id: 'compliance', icon: 'customs', label: 'nav_compliance' },
    { id: 'eudr', icon: 'leaf', label: 'EUDR' },
    { id: 'documents', icon: 'doc', label: 'nav_documents', count: () => MOCK.documents.length },
    { id: 'finance', icon: 'finance', label: 'nav_finance' },
    { id: 'tradefinance', icon: 'finance', label: 'Trade Finance' },
    { id: 'cashflow', icon: 'finance', label: 'Cashflow' },
    { id: 'market', icon: 'chart', label: 'Marktdaten' },
    { id: 'complaints', icon: 'bug', label: 'nav_complaints', count: () => MOCK.complaints.filter((c) => c.status !== 'geschlossen').length },
    { id: 'reports', icon: 'chart', label: 'nav_reports' },
    { id: 'heatmap', icon: 'layers', label: 'Heatmap' },
  ]},
  { group: 'group_admin', items: [
    { id: 'import', icon: 'upload', label: 'Daten-Import' },
    { id: 'settings', icon: 'settings', label: 'nav_settings' },
  ]},
];

interface SidebarProps {
  active: string;
  onNav: (view: string) => void;
  lang: Lang;
}

export const Sidebar = ({ active, onNav, lang }: SidebarProps) => (
  <nav className="side">
    {NAV.map((group) => (
      <div key={group.group} style={{ marginBottom: 6 }}>
        <div className="side-group">{t(lang, group.group) !== group.group ? t(lang, group.group) : group.group}</div>
        {group.items.map((it) => (
          <div
            key={it.id}
            className={`side-item ${active === it.id ? 'active' : ''}`}
            onClick={() => onNav(it.id)}
            title={t(lang, it.label) !== it.label ? t(lang, it.label) : it.label}
          >
            <span className="ico"><Ic name={it.icon} /></span>
            <span className="label">{t(lang, it.label) !== it.label ? t(lang, it.label) : it.label}</span>
            {it.count && <span className="count">{it.count()}</span>}
          </div>
        ))}
      </div>
    ))}
    <div className="side-foot">
      <div className="env">
        <span className="pulse" />
        <span>PROD · v2.4.1</span>
      </div>
    </div>
  </nav>
);

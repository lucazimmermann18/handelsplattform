'use client';

import React from 'react';
import { Ic } from '@/components/ui/icons';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';

const NAV = [
  { group: 'group_overview', items: [
    { id: 'dashboard',          icon: 'dashboard', label: 'nav_dashboard' },
    { id: 'company_builder',    icon: 'flag',      label: 'Company Builder' },
    { id: 'cockpit',            icon: 'activity',  label: 'Cockpit' },
    { id: 'intelligence',       icon: 'sparkle',   label: 'Intelligence' },
    { id: 'strategy',           icon: 'flag',      label: 'Strategie' },
    { id: 'compliance_roadmap', icon: 'leaf',      label: 'Compliance-Roadmap' },
    { id: 'capital',            icon: 'finance',   label: 'Capital' },
  ]},
  { group: 'group_sales', items: [
    { id: 'deals',    icon: 'deals',   label: 'nav_deals',   countKey: 'deals' },
    { id: 'offers',   icon: 'offer',   label: 'nav_offers',  countKey: 'offers' },
    { id: 'samples',  icon: 'pkg',     label: 'Muster' },
    { id: 'buyers',   icon: 'buyer',   label: 'nav_buyers',  countKey: 'buyers' },
    { id: 'matching', icon: 'sparkle', label: 'Matching' },
  ]},
  { group: 'group_ops', items: [
    { id: 'orders',     icon: 'box',      label: 'nav_orders',    countKey: 'orders_active' },
    { id: 'shipments',  icon: 'ship',     label: 'nav_shipments', countKey: 'shipments' },
    { id: 'forwarders',        icon: 'layers',   label: 'Spediteure' },
    { id: 'service_providers', icon: 'building', label: 'Dienstleister' },
    { id: 'calendar',   icon: 'clock',    label: 'Kalender' },
    { id: 'suppliers',  icon: 'supplier', label: 'nav_suppliers', countKey: 'suppliers' },
    { id: 'products',   icon: 'product',  label: 'nav_products',  countKey: 'products' },
    { id: 'quality',    icon: 'quality',  label: 'nav_quality' },
    { id: 'inventory',  icon: 'inv',      label: 'nav_inventory' },
    { id: 'tasks',      icon: 'task',     label: 'nav_tasks',     countKey: 'tasks' },
    { id: 'lots',           icon: 'layers',   label: 'Lots & Chargen' },
  ]},
  { group: 'group_finance', items: [
    { id: 'compliance',  icon: 'customs', label: 'nav_compliance' },
    { id: 'eudr',        icon: 'leaf',    label: 'EUDR' },
    { id: 'documents',   icon: 'doc',     label: 'nav_documents',   countKey: 'documents' },
    { id: 'finance',     icon: 'finance', label: 'nav_finance' },
    { id: 'tradefinance',icon: 'finance', label: 'Trade Finance' },
    { id: 'payables',    icon: 'finance', label: 'AR / AP' },
    { id: 'cbam',        icon: 'leaf',    label: 'CBAM / CO₂' },
    { id: 'cashflow',    icon: 'finance', label: 'Cashflow' },
    { id: 'insurance',   icon: 'doc',     label: 'Versicherung' },
    { id: 'cold_chain',  icon: 'ship',    label: 'Cold Chain' },
    { id: 'market',      icon: 'chart',   label: 'Marktdaten' },
    { id: 'complaints',  icon: 'bug',     label: 'nav_complaints', countKey: 'complaints_open' },
    { id: 'reports',     icon: 'chart',   label: 'nav_reports' },
    { id: 'heatmap',     icon: 'layers',  label: 'Heatmap' },
  ]},
  { group: 'group_admin', items: [
    { id: 'import',   icon: 'upload',   label: 'Daten-Import' },
    { id: 'settings', icon: 'settings', label: 'nav_settings' },
  ]},
];

interface SidebarProps {
  active: string;
  onNav: (view: string) => void;
  lang: Lang;
}

export const Sidebar = ({ active, onNav, lang }: SidebarProps) => {
  const { data } = useData();

  const getCount = (key: string | undefined): number | undefined => {
    if (!key || !data) return undefined;
    switch (key) {
      case 'deals':           return data.deals.length;
      case 'offers':          return data.offers.length;
      case 'buyers':          return data.buyers.length;
      case 'orders_active':   return data.orders.filter(o => !['done', 'paid'].includes(o.status)).length;
      case 'shipments':       return data.orders.filter(o => ['in_export', 'shipped', 'in_transit', 'arrived'].includes(o.status)).length;
      case 'suppliers':       return data.suppliers.length;
      case 'products':        return data.products.length;
      case 'tasks':           return data.tasks.length;
      case 'documents':       return data.documents.length;
      case 'complaints_open': return data.complaints.filter(c => c.status !== 'geschlossen').length;
      default:                return undefined;
    }
  };

  return (
    <nav className="side">
      {NAV.map((group) => (
        <div key={group.group} style={{ marginBottom: 6 }}>
          <div className="side-group">{t(lang, group.group) !== group.group ? t(lang, group.group) : group.group}</div>
          {group.items.map((it) => {
            const count = getCount((it as { countKey?: string }).countKey);
            return (
              <div
                key={it.id}
                className={`side-item ${active === it.id ? 'active' : ''}`}
                onClick={() => onNav(it.id)}
                title={t(lang, it.label) !== it.label ? t(lang, it.label) : it.label}
              >
                <span className="ico"><Ic name={it.icon} /></span>
                <span className="label">{t(lang, it.label) !== it.label ? t(lang, it.label) : it.label}</span>
                {count !== undefined && <span className="count">{count}</span>}
              </div>
            );
          })}
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
};

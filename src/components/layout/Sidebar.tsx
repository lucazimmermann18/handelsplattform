'use client';

import React from 'react';
import { Ic } from '@/components/ui/icons';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';

const NAV = [
  { group: 'group_overview', items: [
    { id: 'dashboard',          icon: 'dashboard', label: 'nav_dashboard' },
    { id: 'company_builder',    icon: 'flag',      label: 'nav_company_builder' },
    { id: 'business_plan',     icon: 'chart',     label: 'nav_business_plan' },
    { id: 'country_intelligence', icon: 'map',    label: 'nav_country_intelligence' },
    { id: 'cockpit',            icon: 'activity',  label: 'nav_cockpit' },
    { id: 'intelligence',       icon: 'sparkle',   label: 'nav_intelligence' },
    { id: 'strategy',           icon: 'flag',      label: 'nav_strategy' },
    { id: 'compliance_roadmap', icon: 'leaf',      label: 'nav_compliance_roadmap' },
    { id: 'capital',            icon: 'finance',   label: 'nav_capital' },
  ]},
  { group: 'group_sales', items: [
    { id: 'deals',    icon: 'deals',   label: 'nav_deals',   countKey: 'deals' },
    { id: 'offers',   icon: 'offer',   label: 'nav_offers',  countKey: 'offers' },
    { id: 'samples',  icon: 'pkg',     label: 'nav_samples' },
    { id: 'buyers',   icon: 'buyer',   label: 'nav_buyers',  countKey: 'buyers' },
    { id: 'matching', icon: 'sparkle', label: 'nav_matching' },
  ]},
  { group: 'group_ops', items: [
    { id: 'orders',            icon: 'box',      label: 'nav_orders',           countKey: 'orders_active' },
    { id: 'shipments',         icon: 'ship',     label: 'nav_shipments',        countKey: 'shipments' },
    { id: 'forwarders',        icon: 'layers',   label: 'nav_forwarders' },
    { id: 'service_providers', icon: 'building', label: 'nav_service_providers' },
    { id: 'calendar',          icon: 'clock',    label: 'nav_calendar' },
    { id: 'suppliers',         icon: 'supplier', label: 'nav_suppliers',        countKey: 'suppliers' },
    { id: 'supplier_scorecard', icon: 'chart',   label: 'nav_supplier_scorecard' },
    { id: 'products',          icon: 'product',  label: 'nav_products',         countKey: 'products' },
    { id: 'availability_planner', icon: 'leaf', label: 'nav_availability_planner' },
    { id: 'quality',           icon: 'quality',  label: 'nav_quality' },
    { id: 'inventory',         icon: 'inv',      label: 'nav_inventory' },
    { id: 'tasks',             icon: 'task',     label: 'nav_tasks',            countKey: 'tasks' },
    { id: 'lots',              icon: 'layers',   label: 'nav_lots' },
    { id: 'eudr_engine',       icon: 'leaf',     label: 'nav_eudr_engine' },
  ]},
  { group: 'group_finance', items: [
    { id: 'compliance',   icon: 'customs', label: 'nav_compliance' },
    { id: 'eudr',         icon: 'leaf',    label: 'nav_eudr' },
    { id: 'documents',    icon: 'doc',     label: 'nav_documents',  countKey: 'documents' },
    { id: 'finance',      icon: 'finance', label: 'nav_finance' },
    { id: 'tradefinance', icon: 'finance', label: 'nav_tradefinance' },
    { id: 'payables',     icon: 'finance', label: 'nav_payables' },
    { id: 'cbam',         icon: 'leaf',    label: 'nav_cbam' },
    { id: 'cashflow',     icon: 'finance', label: 'nav_cashflow' },
    { id: 'insurance',    icon: 'doc',     label: 'nav_insurance' },
    { id: 'cold_chain',   icon: 'ship',    label: 'nav_cold_chain' },
    { id: 'market',       icon: 'chart',   label: 'nav_market' },
    { id: 'complaints',   icon: 'bug',     label: 'nav_complaints', countKey: 'complaints_open' },
    { id: 'reports',      icon: 'chart',   label: 'nav_reports' },
    { id: 'heatmap',      icon: 'layers',  label: 'nav_heatmap' },
    { id: 'landed_cost', icon: 'finance',  label: 'nav_landed_cost' },
    { id: 'hs_lookup',   icon: 'customs',  label: 'nav_hs_lookup' },
    { id: 'screening',   icon: 'shield',   label: 'nav_screening' },
  ]},
  { group: 'group_admin', items: [
    { id: 'import',   icon: 'upload',   label: 'nav_import' },
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
          <div className="side-group">{t(lang, group.group)}</div>
          {group.items.map((it) => {
            const count = getCount((it as { countKey?: string }).countKey);
            return (
              <div
                key={it.id}
                className={`side-item ${active === it.id ? 'active' : ''}`}
                onClick={() => onNav(it.id)}
                title={t(lang, it.label)}
              >
                <span className="ico"><Ic name={it.icon} /></span>
                <span className="label">{t(lang, it.label)}</span>
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

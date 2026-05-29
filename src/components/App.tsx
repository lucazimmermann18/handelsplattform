'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Dashboard } from '@/components/views/Dashboard';
import { OrdersList, OrderDetail } from '@/components/views/Orders';
import { SuppliersList, SupplierDetail } from '@/components/views/Suppliers';
import { ShipmentsView } from '@/components/views/Shipments';
import { DealsView } from '@/components/views/Deals';
import { BuyersList, BuyerDetail } from '@/components/views/Buyers';
import { ProductsList, ProductDetail } from '@/components/views/Products';
import { OffersView } from '@/components/views/Offers';
import { TasksView } from '@/components/views/Tasks';
import { ComplaintsList, ComplaintDetail } from '@/components/views/Complaints';
import { QualityView } from '@/components/views/Quality';
import { InventoryView } from '@/components/views/Inventory';
import { DocumentsView } from '@/components/views/Documents';
import { FinanceView } from '@/components/views/Finance';
import { ReportsView } from '@/components/views/Reports';
import { ComplianceView } from '@/components/views/Compliance';
import { SettingsView } from '@/components/views/Settings';
import { IntelligenceView } from '@/components/views/Intelligence';
import { CockpitView } from '@/components/views/Cockpit';
import { CashflowView } from '@/components/views/Cashflow';
import { StrategyView } from '@/components/views/Strategy';
import { CapitalView } from '@/components/views/Capital';
import { ComplianceRoadmapView } from '@/components/views/ComplianceRoadmap';
import { TradeFinanceView } from '@/components/views/TradeFinance';
import { CalendarView } from '@/components/views/Calendar';
import { SamplesView } from '@/components/views/Samples';
import { ForwardersView } from '@/components/views/Forwarders';
import { MatchingView } from '@/components/views/Matching';
import { HeatmapView } from '@/components/views/Heatmap';
import { MarketView } from '@/components/views/Market';
import { ImportView } from '@/components/views/Import';
import { ColdChainView } from '@/components/views/ColdChain';
import { InsuranceView } from '@/components/views/Insurance';
import { EUDRView } from '@/components/views/EUDR';
import { DbHealthView } from '@/components/views/DbHealth';
import { LotsView } from '@/components/views/Lots';
import { PayablesView } from '@/components/views/Payables';
import { CBAMView } from '@/components/views/CBAM';
import { ServiceProvidersView } from '@/components/views/ServiceProviders';
import { CompanyBuilderView } from '@/components/views/CompanyBuilder';
import { BuyerFinderView } from '@/components/views/BuyerFinder';
import { BusinessPlanView } from '@/components/views/BusinessPlan';
import { LandedCostView } from '@/components/views/LandedCost';
import { HSLookupView } from '@/components/views/HSLookup';
import { ScreeningView } from '@/components/views/Screening';
import { SupplierScorecardView } from '@/components/views/SupplierScorecard';
import { EUDREngineView } from '@/components/views/EUDREngine';
import { EmailModal, type EmailModalData } from '@/components/ui/EmailModal';
import { CopilotDrawer } from '@/components/ui/CopilotDrawer';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { OrderWizard } from '@/components/ui/OrderWizard';
import { SupplierWizard } from '@/components/ui/SupplierWizard';
import { BuyerWizard } from '@/components/ui/BuyerWizard';
import { ProductWizard } from '@/components/ui/ProductWizard';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { LangContext } from '@/lib/lang-context';
import type { Order } from '@/lib/types';
import { useData } from '@/lib/data-context';
import { fmtCur } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';

interface Route {
  view: string;
  order?: Order;
  id?: string;
}

interface AppNotification {
  id: string;
  sev: 'critical' | 'warning' | 'info';
  icon: string;
  title: string;
  desc: string;
  nav: string;
}

export const App = () => {
  const { user, loading: authLoading, isConfigured } = useAuth();
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lang');
      if (stored === 'de' || stored === 'en') return stored;
    }
    return 'de';
  });
  const handleSetLang = (l: Lang) => {
    setLang(l);
    if (typeof window !== 'undefined') localStorage.setItem('lang', l);
  };

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'dark' | 'light') ?? 'dark';
    }
    return 'dark';
  });
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const [route, setRoute] = useState<Route>({ view: 'dashboard' });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [supplierWizardOpen, setSupplierWizardOpen] = useState(false);
  const [buyerWizardOpen, setBuyerWizardOpen] = useState(false);
  const [productWizardOpen, setProductWizardOpen] = useState(false);
  const [emailModal, setEmailModal] = useState<EmailModalData | null>(null);

  const { data: M } = useData();

  const notifications = useMemo((): AppNotification[] => {
    if (!M) return [];
    const today = new Date(M.todayBase);
    const items: AppNotification[] = [];
    M.orders.filter(o => o.status === 'problem').slice(0, 3).forEach(o => {
      items.push({ id: `p-${o.id}`, sev: 'critical', icon: 'danger', title: t(lang, 'notif_problem_order'), desc: `${o.id} — ${t(lang, 'notif_immediate')}`, nav: 'orders' });
    });
    M.orders.filter(o => o.paid < 50 && ['delivered', 'arrived'].includes(o.status)).slice(0, 3).forEach(o => {
      const amt = fmtCur(o.revenue * (100 - o.paid) / 100);
      items.push({ id: `pay-${o.id}`, sev: 'critical', icon: 'warn', title: t(lang, 'notif_overdue_payment'), desc: `${o.id} — ${amt} ${t(lang, 'notif_outstanding')}`, nav: 'finance' });
    });
    M.documents.filter(d => { if (!d.expires) return false; const exp = new Date(d.expires), diff = (exp.getTime() - today.getTime()) / 86400000; return diff >= 0 && diff <= 30; }).slice(0, 5).forEach(d => {
      const exp = new Date(d.expires!); const days = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
      items.push({ id: `doc-${d.id}`, sev: 'warning', icon: 'doc', title: d.name, desc: `${t(lang, 'notif_doc_expiring')} ${days} ${t(lang, 'notif_days')}`, nav: 'documents' });
    });
    M.tasks.filter(x => x.status !== 'erledigt' && new Date(x.due) < today).slice(0, 5).forEach(tk => {
      const days = Math.ceil((today.getTime() - new Date(tk.due).getTime()) / 86400000);
      items.push({ id: `tk-${tk.id}`, sev: 'warning', icon: 'clock', title: tk.t, desc: `${t(lang, 'notif_task_overdue')} ${days} ${t(lang, 'notif_days')}`, nav: 'tasks' });
    });
    M.tasks.filter(x => x.status !== 'erledigt' && new Date(x.due).toDateString() === today.toDateString()).slice(0, 5).forEach(tk => {
      items.push({ id: `tkd-${tk.id}`, sev: 'info', icon: 'task', title: tk.t, desc: t(lang, 'notif_task_today'), nav: 'tasks' });
    });
    return items;
  }, [M, lang]);

  const criticalCount = notifications.filter(n => n.sev === 'critical').length;
  const warningCount = notifications.filter(n => n.sev === 'warning').length;
  const notifBadgeCount = criticalCount + warningCount;

  // Auth guard: redirect to login when Supabase is configured but no user
  const redirectedRef = useRef(false);
  useEffect(() => {
    if (!authLoading && isConfigured && !user && !redirectedRef.current) {
      redirectedRef.current = true;
      window.location.href = '/login';
    }
  }, [authLoading, isConfigured, user]);

  const navigate = (view: string, extra: Partial<Route> = {}) => setRoute({ view, ...extra });
  const openOrder = (order: Order) => setRoute({ view: 'order_detail', order });

  // Global keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(true); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') { e.preventDefault(); setCopilotOpen((o) => !o); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') { e.preventDefault(); setWizardOpen(true); }
    };
    const oc = () => setCopilotOpen(true);
    const ow = () => setWizardOpen(true);
    const osw = () => setSupplierWizardOpen(true);
    const obw = () => setBuyerWizardOpen(true);
    const opw = () => setProductWizardOpen(true);
    const oe = (e: Event) => setEmailModal((e as CustomEvent<EmailModalData>).detail);
    window.addEventListener('keydown', h);
    window.addEventListener('open-copilot', oc);
    window.addEventListener('open-wizard', ow);
    window.addEventListener('open-supplier-wizard', osw);
    window.addEventListener('open-buyer-wizard', obw);
    window.addEventListener('open-product-wizard', opw);
    window.addEventListener('open-email', oe);
    return () => {
      window.removeEventListener('keydown', h);
      window.removeEventListener('open-copilot', oc);
      window.removeEventListener('open-wizard', ow);
      window.removeEventListener('open-supplier-wizard', osw);
      window.removeEventListener('open-buyer-wizard', obw);
      window.removeEventListener('open-product-wizard', opw);
      window.removeEventListener('open-email', oe);
    };
  }, []);

  const crumbs = useMemo(() => {
    const base = [t(lang, 'appName')];
    if (route.view === 'dashboard') return [...base, t(lang, 'nav_dashboard')];
    if (route.view === 'order_detail') return [...base, t(lang, 'nav_orders'), route.order?.id || ''];
    if (route.view === 'supplier_detail') return [...base, t(lang, 'nav_suppliers'), route.id || ''];
    if (route.view === 'buyer_detail') return [...base, t(lang, 'nav_buyers'), route.id || ''];
    if (route.view === 'product_detail') return [...base, t(lang, 'nav_products'), route.id || ''];
    const navMap: Record<string, string> = {
      orders: 'nav_orders', shipments: 'nav_shipments', deals: 'nav_deals', offers: 'nav_offers',
      buyers: 'nav_buyers', suppliers: 'nav_suppliers', products: 'nav_products', quality: 'nav_quality',
      inventory: 'nav_inventory', compliance: 'nav_compliance', documents: 'nav_documents',
      finance: 'nav_finance', tasks: 'nav_tasks', complaints: 'nav_complaints', reports: 'nav_reports',
      settings: 'nav_settings',
    };
    // Extended modules with dedicated nav_ keys
    const extNav: Record<string, string> = {
      eudr: 'nav_eudr', matching: 'nav_matching', market: 'nav_market',
      tradefinance: 'nav_tradefinance', calendar: 'nav_calendar', samples: 'nav_samples',
      forwarders: 'nav_forwarders', heatmap: 'nav_heatmap', intelligence: 'nav_intelligence',
      cockpit: 'bc_cockpit', cashflow: 'nav_cashflow', strategy: 'nav_strategy',
      compliance_roadmap: 'nav_compliance_roadmap', capital: 'nav_capital', import: 'nav_import',
      cold_chain: 'bc_cold_chain', insurance: 'bc_insurance', db_health: 'bc_db_health',
      lots: 'nav_lots', payables: 'nav_payables', cbam: 'nav_cbam',
      company_builder: 'nav_company_builder', service_providers: 'nav_service_providers',
      business_plan: 'nav_business_plan',
      supplier_scorecard: 'nav_supplier_scorecard',
      eudr_engine: 'nav_eudr_engine',
    };
    if (navMap[route.view]) return [...base, t(lang, navMap[route.view])];
    if (extNav[route.view]) return [...base, t(lang, extNav[route.view])];
    return [...base, t(lang, 'module')];
  }, [route, lang]);

  const activeNav = useMemo(() => {
    if (['order_detail'].includes(route.view)) return 'orders';
    if (['supplier_detail'].includes(route.view)) return 'suppliers';
    if (['buyer_detail'].includes(route.view)) return 'buyers';
    if (['product_detail'].includes(route.view)) return 'products';
    if (['complaint_detail'].includes(route.view)) return 'complaints';
    return route.view;
  }, [route.view]);

  const view = useMemo(() => {
    switch (route.view) {
      case 'dashboard':
        return <Dashboard lang={lang} onNav={navigate} onOpenOrder={openOrder} />;
      case 'orders':
        return <OrdersList lang={lang} onOpen={openOrder} />;
      case 'order_detail':
        return route.order
          ? <OrderDetail order={route.order} lang={lang} onBack={() => navigate('orders')} />
          : <OrdersList lang={lang} onOpen={openOrder} />;
      case 'shipments':
        return <ShipmentsView lang={lang} onOpenOrder={openOrder} />;
      case 'deals':
        return <DealsView lang={lang} />;
      case 'offers':
        return <OffersView lang={lang} />;
      case 'buyers':
        return <BuyerFinderView lang={lang} />;
      case 'suppliers':
        return <SuppliersList lang={lang} onOpen={(id) => navigate('supplier_detail', { id })} />;
      case 'products':
        return <ProductsList lang={lang} onOpen={(id) => navigate('product_detail', { id })} />;
      case 'buyer_detail':
        return route.id
          ? <BuyerDetail id={route.id} lang={lang} onBack={() => navigate('buyers')} />
          : <BuyersList lang={lang} onOpen={(id) => navigate('buyer_detail', { id })} />;
      case 'supplier_detail':
        return route.id
          ? <SupplierDetail id={route.id} lang={lang} onBack={() => navigate('suppliers')} />
          : <SuppliersList lang={lang} onOpen={(id) => navigate('supplier_detail', { id })} />;
      case 'product_detail':
        return route.id
          ? <ProductDetail id={route.id} lang={lang} onBack={() => navigate('products')} />
          : <ProductsList lang={lang} onOpen={(id) => navigate('product_detail', { id })} />;
      case 'quality':
        return <QualityView lang={lang} />;
      case 'inventory':
        return <InventoryView lang={lang} />;
      case 'compliance':
        return <ComplianceView lang={lang} />;
      case 'documents':
        return <DocumentsView lang={lang} />;
      case 'finance':
        return <FinanceView lang={lang} />;
      case 'tasks':
        return <TasksView lang={lang} />;
      case 'complaints':
        return <ComplaintsList lang={lang} onOpen={(id) => navigate('complaint_detail', { id })} />;
      case 'complaint_detail':
        return route.id
          ? <ComplaintDetail id={route.id} lang={lang} onBack={() => navigate('complaints')} />
          : <ComplaintsList lang={lang} onOpen={(id) => navigate('complaint_detail', { id })} />;
      case 'reports':
        return <ReportsView lang={lang} />;
      case 'settings':
        return <SettingsView lang={lang} onNav={navigate} />;
      case 'db_health':
        return <DbHealthView />;
      case 'import':
        return <ImportView lang={lang} onNav={navigate} />;
      case 'eudr':
        return <EUDRView lang={lang} />;
      case 'cold_chain':
        return <ColdChainView lang={lang} />;
      case 'insurance':
        return <InsuranceView lang={lang} />;
      case 'matching':
        return <MatchingView lang={lang} onNav={navigate} />;
      case 'heatmap':
        return <HeatmapView lang={lang} />;
      case 'market':
        return <MarketView lang={lang} />;
      case 'tradefinance':
        return <TradeFinanceView lang={lang} />;
      case 'calendar':
        return <CalendarView lang={lang} />;
      case 'samples':
        return <SamplesView lang={lang} />;
      case 'forwarders':
        return <ForwardersView lang={lang} />;
      case 'service_providers':
        return <ServiceProvidersView lang={lang} />;
      case 'intelligence':
        return <IntelligenceView lang={lang} onOpenOrder={openOrder} onNav={navigate} />;
      case 'cockpit':
        return <CockpitView lang={lang} onOpenOrder={openOrder} onNav={navigate} />;
      case 'cashflow':
        return <CashflowView lang={lang} />;
      case 'strategy':
        return <StrategyView lang={lang} />;
      case 'compliance_roadmap':
        return <ComplianceRoadmapView lang={lang} />;
      case 'capital':
        return <CapitalView lang={lang} />;
      case 'lots': return <LotsView lang={lang} />;
      case 'payables': return <PayablesView lang={lang} />;
      case 'cbam': return <CBAMView lang={lang} />;
      case 'company_builder': return <CompanyBuilderView lang={lang} />;
      case 'business_plan': return <BusinessPlanView lang={lang} onNav={navigate} />;
      case 'landed_cost': return <LandedCostView lang={lang} />;
      case 'hs_lookup': return <HSLookupView lang={lang} />;
      case 'screening': return <ScreeningView lang={lang} />;
      case 'supplier_scorecard': return <SupplierScorecardView lang={lang} />;
      case 'eudr_engine': return <EUDREngineView lang={lang} />;
      default:
        return <Dashboard lang={lang} onNav={navigate} onOpenOrder={openOrder} />;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, lang]);

  // Show blank while checking auth / redirecting to login
  if (isConfigured && (authLoading || !user)) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg, #0d0f1a)' }} />;
  }

  return (
    <LangContext.Provider value={lang}>
    <>
      <div className="app">
        {/* Logo */}
        <div className="logo-cell">
          <img src="/logo.svg" alt="Logo" className="logo-mark" />
          <div className="logo-text">
            EastAfrica<br />
            <span className="sub">Export OS</span>
          </div>
        </div>

        <Topbar
          lang={lang}
          setLang={handleSetLang}
          theme={theme}
          onThemeToggle={toggleTheme}
          breadcrumbs={crumbs}
          onPalette={() => setPaletteOpen(true)}
          onBell={() => setNotifOpen(true)}
          onCopilot={() => setCopilotOpen(true)}
          notifCount={notifBadgeCount}
        />

        <Sidebar active={activeNav} onNav={navigate} lang={lang} />

        <main className="main">{view}</main>

      </div>

      {/* Command Palette */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNav={(v, e) => navigate(v, e as Partial<Route>)}
      />

      {/* Notifications Drawer */}
      {notifOpen && (
        <div className="overlay" onClick={() => setNotifOpen(false)}>
          <div className="drawer" style={{ top: 44 }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <span style={{ fontWeight: 600 }}>{t(lang, 'notifications')}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8, fontSize: 10, color: '#34d399' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                {t(lang, 'notif_realtime')}
              </span>
              <button className="btn sm ghost" style={{ marginLeft: 'auto', fontSize: 11 }} onClick={() => {}}>
                {t(lang, 'notif_mark_all')}
              </button>
              <button className="btn sm ghost" onClick={() => setNotifOpen(false)}>✕</button>
            </div>
            <div className="drawer-body" style={{ padding: 0 }}>
              {notifications.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center' }}>
                  <Ic name="quality" size={24} color="#34d399" />
                  <div className="tx3" style={{ marginTop: 8, fontSize: 12 }}>{t(lang, 'no_notifications')}</div>
                </div>
              ) : (
                <>
                  {(['critical', 'warning', 'info'] as const).map(sev => {
                    const group = notifications.filter(n => n.sev === sev);
                    if (group.length === 0) return null;
                    const secLabel = sev === 'critical' ? t(lang, 'notif_critical_section') : sev === 'warning' ? t(lang, 'notif_warning_section') : t(lang, 'notif_info_section');
                    const secColor = sev === 'critical' ? '#ef4444' : sev === 'warning' ? '#f59e0b' : '#60a5fa';
                    return (
                      <div key={sev}>
                        <div style={{ padding: '6px 14px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 9.5, fontWeight: 700, color: secColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{secLabel}</span>
                          <span style={{ fontSize: 9.5, background: secColor, color: '#fff', borderRadius: 10, padding: '0 5px', fontWeight: 700 }}>{group.length}</span>
                        </div>
                        {group.map(n => (
                          <div key={n.id} style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: sev === 'critical' ? 'rgba(239,68,68,0.12)' : sev === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(96,165,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Ic name={n.icon} size={13} color={secColor} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{n.title}</div>
                              <div className="tx3" style={{ fontSize: 10.5, marginTop: 1 }}>{n.desc}</div>
                            </div>
                            <button className="btn sm ghost" style={{ fontSize: 10.5, whiteSpace: 'nowrap', flexShrink: 0 }} onClick={() => { setNotifOpen(false); navigate(n.nav); }}>
                              {t(lang, 'notif_view_btn')}
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Copilot Drawer */}
      <CopilotDrawer
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        onNav={navigate}
      />

      {/* Email Compose Modal */}
      {emailModal && <EmailModal initial={emailModal} onClose={() => setEmailModal(null)} />}

      {/* Order Wizard */}
      <OrderWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={() => navigate('orders')}
      />

      {/* Supplier Wizard */}
      <SupplierWizard
        open={supplierWizardOpen}
        onClose={() => setSupplierWizardOpen(false)}
        onSuccess={() => { setSupplierWizardOpen(false); navigate('suppliers'); }}
      />

      {/* Buyer Wizard */}
      <BuyerWizard
        open={buyerWizardOpen}
        onClose={() => setBuyerWizardOpen(false)}
        onSuccess={() => { setBuyerWizardOpen(false); navigate('buyers'); }}
      />

      {/* Product Wizard */}
      <ProductWizard
        open={productWizardOpen}
        onClose={() => setProductWizardOpen(false)}
        onSuccess={() => { setProductWizardOpen(false); navigate('products'); }}
      />
    </>
    </LangContext.Provider>
  );
};

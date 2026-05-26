'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { StatusBar } from '@/components/layout/StatusBar';
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
import { LotsView } from '@/components/views/Lots';
import { PayablesView } from '@/components/views/Payables';
import { VesselTrackingView } from '@/components/views/VesselTracking';
import { CBAMView } from '@/components/views/CBAM';
import { EmailModal, type EmailModalData } from '@/components/ui/EmailModal';
import { CopilotDrawer } from '@/components/ui/CopilotDrawer';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { OrderWizard } from '@/components/ui/OrderWizard';
import { SupplierWizard } from '@/components/ui/SupplierWizard';
import { BuyerWizard } from '@/components/ui/BuyerWizard';
import { ProductWizard } from '@/components/ui/ProductWizard';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import type { Order } from '@/lib/types';

interface Route {
  view: string;
  order?: Order;
  id?: string;
}


export const App = () => {
  const { user, loading: authLoading, isConfigured } = useAuth();
  const [lang, setLang] = useState<Lang>('de');
  const [route, setRoute] = useState<Route>({ view: 'dashboard' });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [supplierWizardOpen, setSupplierWizardOpen] = useState(false);
  const [buyerWizardOpen, setBuyerWizardOpen] = useState(false);
  const [productWizardOpen, setProductWizardOpen] = useState(false);
  const [emailModal, setEmailModal] = useState<EmailModalData | null>(null);

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
    const labelMap: Record<string, string> = {
      eudr: 'EUDR Compliance', matching: 'Matching', market: 'Marktdaten', tradefinance: 'Trade Finance',
      calendar: 'Kalender', samples: 'Muster', forwarders: 'Spediteure', heatmap: 'Heatmap',
      intelligence: 'Intelligence', cockpit: 'Operations Cockpit', cashflow: 'Cashflow',
      strategy: 'Strategie', compliance_roadmap: 'Compliance-Roadmap', capital: 'Capital', import: 'Daten-Import',
      cold_chain: 'Cold Chain Monitor', insurance: 'Versicherungs-Tracker',
      lots: 'Lots & Chargen', payables: 'AR / AP', vessel_tracking: 'Vessel Tracking', cbam: 'CBAM / CO₂',
    };
    if (navMap[route.view]) return [...base, t(lang, navMap[route.view])];
    if (labelMap[route.view]) return [...base, labelMap[route.view]];
    return [...base, 'Modul'];
  }, [route, lang]);

  const activeNav = useMemo(() => {
    if (['order_detail'].includes(route.view)) return 'orders';
    if (['supplier_detail'].includes(route.view)) return 'suppliers';
    if (['buyer_detail'].includes(route.view)) return 'buyers';
    if (['product_detail'].includes(route.view)) return 'products';
    if (['complaint_detail'].includes(route.view)) return 'complaints';
    if (['heatmap'].includes(route.view)) return 'reports';
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
        return <BuyersList lang={lang} onOpen={(id) => navigate('buyer_detail', { id })} />;
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
        return <SettingsView lang={lang} />;
      case 'import':
        return <ImportView lang={lang} />;
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
      case 'vessel_tracking': return <VesselTrackingView lang={lang} />;
      case 'cbam': return <CBAMView lang={lang} />;
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
          setLang={setLang}
          breadcrumbs={crumbs}
          onPalette={() => setPaletteOpen(true)}
          onBell={() => setNotifOpen(true)}
          onCopilot={() => setCopilotOpen(true)}
        />

        <Sidebar active={activeNav} onNav={navigate} lang={lang} />

        <main className="main">{view}</main>

        <StatusBar />
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
              <span style={{ fontWeight: 600 }}>Benachrichtigungen</span>
              <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={() => setNotifOpen(false)}>✕</button>
            </div>
            <div className="drawer-body">
              <div className="tx3 empty">Keine neuen Benachrichtigungen</div>
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
  );
};

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { StatusBar } from '@/components/layout/StatusBar';
import { Dashboard } from '@/components/views/Dashboard';
import { OrdersList, OrderDetail } from '@/components/views/Orders';
import { SuppliersList, SupplierDetail } from '@/components/views/Suppliers';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import type { Order } from '@/lib/types';

interface Route {
  view: string;
  order?: Order;
  id?: string;
}

// Placeholder for views not yet fully implemented
const ComingSoon = ({ view, onBack }: { view: string; onBack?: () => void }) => (
  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
    <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{view}</div>
    <div style={{ fontSize: 13, marginBottom: 20 }}>Dieses Modul wird in der nächsten Phase implementiert.</div>
    {onBack && <button className="btn" onClick={onBack}>← Zurück</button>}
  </div>
);

export const App = () => {
  const [lang, setLang] = useState<Lang>('de');
  const [route, setRoute] = useState<Route>({ view: 'dashboard' });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

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
    window.addEventListener('keydown', h);
    window.addEventListener('open-copilot', oc);
    window.addEventListener('open-wizard', ow);
    return () => {
      window.removeEventListener('keydown', h);
      window.removeEventListener('open-copilot', oc);
      window.removeEventListener('open-wizard', ow);
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
      eudr: 'EUDR', matching: 'Matching', market: 'Marktdaten', tradefinance: 'Trade Finance',
      calendar: 'Kalender', samples: 'Muster', forwarders: 'Spediteure', heatmap: 'Heatmap',
      intelligence: 'Intelligence', cockpit: 'Operations Cockpit', cashflow: 'Cashflow',
      strategy: 'Strategie', compliance_roadmap: 'Compliance-Roadmap', capital: 'Capital', import: 'Daten-Import',
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
        return <ComingSoon view="Shipments & Live-Karte" />;
      case 'deals':
        return <ComingSoon view="Deals (Kanban)" />;
      case 'offers':
        return <ComingSoon view="Angebote" />;
      case 'buyers':
        return <ComingSoon view="Käufer" />;
      case 'suppliers':
        return <SuppliersList lang={lang} onOpen={(id) => navigate('supplier_detail', { id })} />;
      case 'products':
        return <ComingSoon view="Produkte" />;
      case 'buyer_detail':
        return <ComingSoon view={`Käufer ${route.id}`} onBack={() => navigate('buyers')} />;
      case 'supplier_detail':
        return route.id
          ? <SupplierDetail id={route.id} lang={lang} onBack={() => navigate('suppliers')} />
          : <SuppliersList lang={lang} onOpen={(id) => navigate('supplier_detail', { id })} />;
      case 'product_detail':
        return <ComingSoon view={`Produkt ${route.id}`} onBack={() => navigate('products')} />;
      case 'quality':
        return <ComingSoon view="Qualitätsprüfung" />;
      case 'inventory':
        return <ComingSoon view="Lagerbestand" />;
      case 'compliance':
        return <ComingSoon view="Export & Zoll" />;
      case 'documents':
        return <ComingSoon view="Dokumente" />;
      case 'finance':
        return <ComingSoon view="Finanzen" />;
      case 'tasks':
        return <ComingSoon view="Aufgaben" />;
      case 'complaints':
        return <ComingSoon view="Reklamationen" />;
      case 'complaint_detail':
        return <ComingSoon view={`Reklamation ${route.id}`} onBack={() => navigate('complaints')} />;
      case 'reports':
        return <ComingSoon view="Reports" />;
      case 'settings':
        return <ComingSoon view="Einstellungen" />;
      case 'import':
        return <ComingSoon view="Daten-Import" />;
      case 'eudr':
        return <ComingSoon view="EUDR Compliance" />;
      case 'matching':
        return <ComingSoon view="Käufer-Produkt-Matching" />;
      case 'heatmap':
        return <ComingSoon view="Profitabilitäts-Heatmap" />;
      case 'market':
        return <ComingSoon view="Marktdaten" />;
      case 'tradefinance':
        return <ComingSoon view="Trade Finance" />;
      case 'calendar':
        return <ComingSoon view="Versand-Kalender" />;
      case 'samples':
        return <ComingSoon view="Musterbestellungen" />;
      case 'forwarders':
        return <ComingSoon view="Spediteure" />;
      case 'intelligence':
        return <ComingSoon view="Intelligence Hub" />;
      case 'cockpit':
        return <ComingSoon view="Operations Cockpit" />;
      case 'cashflow':
        return <ComingSoon view="Cashflow Forecast" />;
      case 'strategy':
        return <ComingSoon view="Strategy Hub" />;
      case 'compliance_roadmap':
        return <ComingSoon view="Compliance Roadmap" />;
      case 'capital':
        return <ComingSoon view="Capital Hub" />;
      default:
        return <Dashboard lang={lang} onNav={navigate} onOpenOrder={openOrder} />;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, lang]);

  return (
    <>
      <div className="app">
        {/* Logo */}
        <div className="logo-cell">
          <div className="logo-mark" />
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

      {/* Command Palette overlay */}
      {paletteOpen && (
        <div className="overlay" onClick={() => setPaletteOpen(false)}>
          <div className="cmd-palette" onClick={(e) => e.stopPropagation()}>
            <input autoFocus placeholder="Suche · Aufträge, Lieferanten, Module…" />
            <div className="results">
              {[
                { label: 'Dashboard', meta: 'Übersicht', view: 'dashboard' },
                { label: 'Aufträge', meta: 'nav_orders', view: 'orders' },
                { label: 'Shipments & Live-Karte', meta: 'Tracking', view: 'shipments' },
                { label: 'Intelligence Hub', meta: 'KI-Briefing · Risiko · Forecasts', view: 'intelligence' },
                { label: 'Operations Cockpit', meta: 'Bin ich auf Kurs?', view: 'cockpit' },
                { label: 'Käufer', meta: 'CRM', view: 'buyers' },
                { label: 'Lieferanten', meta: 'SRM', view: 'suppliers' },
                { label: 'Produkte', meta: 'Katalog', view: 'products' },
                { label: 'Deals (Kanban)', meta: 'Pipeline', view: 'deals' },
                { label: 'Finanzen', meta: 'Rechnungen · Zahlungen', view: 'finance' },
                { label: 'Compliance & Zoll', meta: 'HS-Codes · Zertifikate', view: 'compliance' },
                { label: 'Strategie', meta: 'OKRs · Roadmap', view: 'strategy' },
                { label: 'Capital Hub', meta: 'Investoren · Trade Finance', view: 'capital' },
              ].map((r, i) => (
                <div key={i} className="result-item" onClick={() => { navigate(r.view); setPaletteOpen(false); }}>
                  <div>
                    <div className="label">{r.label}</div>
                    <div className="meta">{r.meta}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
      {copilotOpen && (
        <div className="overlay" onClick={() => setCopilotOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(167,139,250,0.05))', borderBottom: '1px solid rgba(167,139,250,0.18)' }}>
              <span style={{ color: '#c4b5fd', fontWeight: 600 }}>✦ AI Copilot</span>
              <span className="tx3" style={{ fontSize: 11 }}>⌘J zum Schließen</span>
              <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={() => setCopilotOpen(false)}>✕</button>
            </div>
            <div className="drawer-body">
              <div className="ai-card" style={{ marginBottom: 12 }}>
                <div className="head">
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Wie kann ich helfen?</span>
                  <span className="pill">Beta</span>
                </div>
                <div className="tx2" style={{ fontSize: 12, lineHeight: 1.5 }}>
                  Stell mir Fragen zu Aufträgen, Lieferanten, Compliance oder lass mich Berichte generieren.
                </div>
              </div>
              <div className="empty tx3">Tippe eine Frage…</div>
            </div>
          </div>
        </div>
      )}

      {/* Order Wizard Modal */}
      {wizardOpen && (
        <div className="overlay" onClick={() => setWizardOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <span style={{ fontWeight: 600, fontSize: 14 }}>Neuer Auftrag</span>
              <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={() => setWizardOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="tx3">Auftrags-Wizard wird in der nächsten Phase implementiert.</div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setWizardOpen(false)}>Abbrechen</button>
              <button className="btn primary">Anlegen</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

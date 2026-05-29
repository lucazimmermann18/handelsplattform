'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '@/lib/data-context';
import { Ic } from '@/components/ui/icons';

interface NavItem {
  label: string;
  meta: string;
  view: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',              meta: 'Übersicht · KPIs',                    view: 'dashboard',          icon: 'chart' },
  { label: 'Aufträge',               meta: 'Lieferkette · Status · Dokumente',     view: 'orders',             icon: 'box' },
  { label: 'Shipments & Live-Karte', meta: 'Container-Tracking · Karte',           view: 'shipments',          icon: 'ship' },
  { label: 'Operations Cockpit',     meta: 'Bin ich auf Kurs?',                    view: 'cockpit',            icon: 'activity' },
  { label: 'Intelligence Hub',       meta: 'KI-Briefing · Risiko · Forecast',      view: 'intelligence',       icon: 'sparkle' },
  { label: 'Käufer (CRM)',           meta: 'Buyer Relations · Pipeline',           view: 'buyers',             icon: 'buyer' },
  { label: 'Lieferanten (SRM)',      meta: 'Supplier Management · Bewertung',      view: 'suppliers',          icon: 'supplier' },
  { label: 'Produkte',               meta: 'Katalog · Preise · Zertifikate',       view: 'products',           icon: 'product' },
  { label: 'Deals (Kanban)',         meta: 'Pipeline · Opportunity',              view: 'deals',              icon: 'deals' },
  { label: 'Angebote',               meta: 'Offerten · Preisblätter',             view: 'offers',             icon: 'offer' },
  { label: 'Finanzen',               meta: 'Rechnungen · P&L · Zahlungen',        view: 'finance',            icon: 'finance' },
  { label: 'Qualität',               meta: 'QC · Laborberichte · COA',            view: 'quality',            icon: 'quality' },
  { label: 'Lager (Inventory)',       meta: 'Bestände · SKUs',                     view: 'inventory',          icon: 'inv' },
  { label: 'Compliance & Zoll',      meta: 'HS-Codes · Zertifikate · EUDR',       view: 'compliance',         icon: 'task' },
  { label: 'Dokumente',              meta: 'COO · BL · Phyto · Upload',           view: 'documents',          icon: 'doc' },
  { label: 'Aufgaben',               meta: 'Tasks · Prioritäten · Team',          view: 'tasks',              icon: 'task' },
  { label: 'Reklamationen',          meta: 'Complaints · Qualitätsprobleme',      view: 'complaints',         icon: 'warn' },
  { label: 'Berichte',               meta: 'Reporting · Export · Analytics',      view: 'reports',            icon: 'chart' },
  { label: 'Einstellungen',          meta: 'Team · KI-Keys · Integrationen',      view: 'settings',           icon: 'settings' },
  { label: 'Trade Finance',          meta: 'Akkreditive · FX · Zahlungsplan',     view: 'tradefinance',       icon: 'finance' },
  { label: 'Strategie',              meta: 'OKRs · Roadmap · Märkte',             view: 'strategy',           icon: 'activity' },
  { label: 'Capital Hub',            meta: 'Investoren · Forecast · Updates',     view: 'capital',            icon: 'finance' },
  { label: 'KI-Matching',            meta: 'Käufer × Produkte · Matrix',          view: 'matching',           icon: 'sparkle' },
  { label: 'Marktpreise',            meta: 'Rohstoffe · Börsen · Live',           view: 'market',             icon: 'chart' },
  { label: 'Kalender',               meta: 'ETD · ETA · Termine',                view: 'calendar',           icon: 'clock' },
  { label: 'Muster (Samples)',        meta: 'Proben · Feedback · Tracking',        view: 'samples',            icon: 'pkg' },
  { label: 'Spediteure',             meta: 'Forwarder · Preise · Routen',         view: 'forwarders',         icon: 'ship' },
  { label: 'Compliance-Roadmap',     meta: 'Zertifizierung · Audits · EUDR',      view: 'compliance_roadmap', icon: 'task' },
  { label: 'Cold Chain',             meta: 'Kühlkette · Temperaturüberwachung',   view: 'cold_chain',         icon: 'quality' },
  { label: 'Daten-Import',           meta: 'CSV · Lieferanten · Produkte',        view: 'import',             icon: 'upload' },
  { label: 'Heatmap',                meta: 'Marge · Käufer × Produkte',           view: 'heatmap',            icon: 'chart' },
];

interface Result {
  id: string;
  label: string;
  meta: string;
  group: string;
  icon: string;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNav: (view: string, extra?: Record<string, unknown>) => void;
}

export function CommandPalette({ open, onClose, onNav }: CommandPaletteProps) {
  const { data: M } = useData();
  const [query, setQuery]           = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const results = useMemo((): Result[] => {
    const q = query.toLowerCase().trim();

    const nav: Result[] = NAV_ITEMS
      .filter(n => !q || n.label.toLowerCase().includes(q) || n.meta.toLowerCase().includes(q))
      .map(n => ({
        id: `nav:${n.view}`, label: n.label, meta: n.meta, group: 'Navigation',
        icon: n.icon, action: () => { onNav(n.view); onClose(); },
      }));

    if (!M) return nav;

    const orders: Result[] = M.orders
      .filter(o => !q || o.id.toLowerCase().includes(q) || o.productVariant.toLowerCase().includes(q) ||
        M.buyers.find(b => b.id === o.buyerId)?.name.toLowerCase().includes(q))
      .slice(0, q ? 8 : 3)
      .map(o => {
        const buyer = M.buyers.find(b => b.id === o.buyerId);
        return {
          id: `order:${o.id}`,
          label: o.id,
          meta: `${buyer?.name ?? o.buyerId} · ${o.productVariant} · ${o.status}`,
          group: 'Aufträge',
          icon: 'box',
          action: () => { onNav('order_detail', { order: o }); onClose(); },
        };
      });

    const buyers: Result[] = M.buyers
      .filter(b => !q || b.name.toLowerCase().includes(q) || b.city.toLowerCase().includes(q) || b.country.toLowerCase().includes(q))
      .slice(0, q ? 6 : 3)
      .map(b => ({
        id: `buyer:${b.id}`,
        label: b.name,
        meta: `${b.city} · ${b.country} · ${b.id}`,
        group: 'Käufer',
        icon: 'buyer',
        action: () => { onNav('buyer_detail', { id: b.id }); onClose(); },
      }));

    const suppliers: Result[] = M.suppliers
      .filter(s => !q || s.name.toLowerCase().includes(q) || s.region.toLowerCase().includes(q) || s.country.toLowerCase().includes(q))
      .slice(0, q ? 6 : 3)
      .map(s => ({
        id: `supplier:${s.id}`,
        label: s.name,
        meta: `${s.region} · ${s.country} · ${s.type}`,
        group: 'Lieferanten',
        icon: 'supplier',
        action: () => { onNav('supplier_detail', { id: s.id }); onClose(); },
      }));

    const products: Result[] = (M.products ?? [])
      .filter(p => !q || p.name.toLowerCase().includes(q) || (p.cat ?? '').toLowerCase().includes(q) || (p.hs ?? '').toLowerCase().includes(q))
      .slice(0, q ? 6 : 0)
      .map(p => ({
        id: `product:${p.id}`,
        label: p.name,
        meta: `${p.cat ?? ''} · HS ${p.hs ?? '—'} · ${p.unit}`,
        group: 'Produkte',
        icon: 'product',
        action: () => { onNav('products'); onClose(); },
      }));

    const documents: Result[] = (M.documents ?? [])
      .filter(d => !q || d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q) || (d.order ?? '').toLowerCase().includes(q))
      .slice(0, q ? 5 : 0)
      .map(d => ({
        id: `doc:${d.id}`,
        label: d.name,
        meta: `${d.type}${d.order ? ` · ${d.order}` : ''} · ${d.status}`,
        group: 'Dokumente',
        icon: 'doc',
        action: () => { onNav('documents'); onClose(); },
      }));

    const tasks: Result[] = (M.tasks ?? [])
      .filter(tk => !q || tk.t.toLowerCase().includes(q) || (tk.order ?? '').toLowerCase().includes(q) || tk.owner.toLowerCase().includes(q))
      .slice(0, q ? 5 : 0)
      .map(tk => ({
        id: `task:${tk.id}`,
        label: tk.t,
        meta: `${tk.order ?? '—'} · ${tk.owner} · ${tk.prio}`,
        group: 'Aufgaben',
        icon: 'task',
        action: () => { onNav('tasks'); onClose(); },
      }));

    return [...orders, ...buyers, ...suppliers, ...products, ...documents, ...tasks, ...nav];
  }, [query, M, onNav, onClose]);

  useEffect(() => { setSelectedIdx(0); }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter')     { e.preventDefault(); results[selectedIdx]?.action(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, selectedIdx, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  if (!open) return null;

  // Group results for display
  const groups: { name: string; items: (Result & { idx: number })[] }[] = [];
  let flatIdx = 0;
  const groupedMap = new Map<string, (Result & { idx: number })[]>();
  results.forEach(r => {
    const arr = groupedMap.get(r.group) ?? [];
    arr.push({ ...r, idx: flatIdx++ });
    groupedMap.set(r.group, arr);
  });
  const groupOrder = ['Aufträge', 'Käufer', 'Lieferanten', 'Produkte', 'Dokumente', 'Aufgaben', 'Navigation'];
  groupOrder.forEach(g => { if (groupedMap.has(g)) groups.push({ name: g, items: groupedMap.get(g)! }); });

  return (
    <div className="overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '10vh' }}>
      <div className="cmd-palette" onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Ic name="search" size={15} color="var(--text-3)" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Suche · Aufträge, Käufer, Lieferanten, Module…"
            style={{
              flex: 1, background: 'none', border: 'none', color: 'var(--text)',
              fontSize: 13.5, fontFamily: 'inherit', outline: 'none',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2 }}>
              <Ic name="x" size={12} />
            </button>
          )}
          <kbd style={{ fontSize: 10, padding: '2px 5px', background: 'rgba(255,255,255,0.08)', borderRadius: 4, color: 'var(--text-3)', border: '1px solid rgba(255,255,255,0.1)' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="results" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {results.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
              Keine Ergebnisse für &bdquo;{query}&ldquo;
            </div>
          ) : groups.map(group => (
            <div key={group.name}>
              <div style={{ padding: '8px 14px 3px', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {group.name}
              </div>
              {group.items.map(item => (
                <div
                  key={item.id}
                  data-idx={item.idx}
                  className={`result-item${item.idx === selectedIdx ? ' active' : ''}`}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIdx(item.idx)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Ic name={item.icon} size={13} color={item.idx === selectedIdx ? '#a78bfa' : 'var(--text-3)'} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="label" style={{ fontWeight: item.group !== 'Navigation' ? 600 : 400 }}>{item.label}</div>
                      <div className="meta" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.meta}</div>
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--text-3)', opacity: 0.5, flexShrink: 0 }}>{item.group}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '6px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 12, fontSize: 10.5, color: 'var(--text-3)' }}>
          <span><kbd style={{ fontFamily: 'inherit' }}>↑↓</kbd> navigieren</span>
          <span><kbd style={{ fontFamily: 'inherit' }}>↵</kbd> öffnen</span>
          <span><kbd style={{ fontFamily: 'inherit' }}>ESC</kbd> schließen</span>
          <span style={{ marginLeft: 'auto' }}>{results.length} Ergebnisse</span>
        </div>
      </div>
    </div>
  );
}

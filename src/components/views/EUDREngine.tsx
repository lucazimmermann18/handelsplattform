'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '@/lib/data-context';
import { t } from '@/lib/i18n';
import { Ic } from '@/components/ui/icons';
import type { Lang } from '@/lib/i18n';

interface Props { lang: Lang; }

interface FarmPlot {
  id: string;
  supplierId: string;
  supplierName: string;
  plotName: string;
  lat: number;
  lng: number;
  areaha: number;
  country: string;
  region: string;
  cadastralRef: string;
  forestStatus: 'verified_free' | 'pending' | 'flagged' | 'unknown';
  verificationDate: string;
  verificationRef: string;
  verificationMethod: 'satellite' | 'certificate' | 'ngo' | 'manual' | '';
  notes: string;
  createdAt: string;
}

interface LotFarmLink {
  id: string;
  lotId: string;
  lotName: string;
  plotIds: string[];
  splitPcts: Record<string, number>;
  notes: string;
}

interface DDSRecord {
  id: string;
  orderId: string;
  operatorName: string;
  eori: string;
  address: string;
  lots: string[];
  plots: string[];
  tracesRef: string;
  status: 'draft' | 'submitted' | 'accepted';
  createdAt: string;
  packageJson: string;
}

type Tab = 'plots' | 'lots' | 'dds' | 'archive';

const LS_PLOTS = 'eudr_farm_plots';
const LS_LINKS = 'eudr_lot_links';
const LS_DDS   = 'eudr_dds_records';

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function saveLS(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
function downloadText(filename: string, content: string, mime = 'text/plain') {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([content], { type: mime })), download: filename });
  a.click(); URL.revokeObjectURL(a.href);
}
function fmtDate(d: string) { return d ? new Date(d).toLocaleDateString('de-DE') : '—'; }
function addYears(d: string, years: number) { const dt = new Date(d); dt.setFullYear(dt.getFullYear() + years); return dt; }

const FOREST_STATUS_META = {
  verified_free: { label: 'Entwaldungsfrei ✓', color: '#34d399', bg: '#34d39922' },
  pending:       { label: 'Ausstehend',         color: '#fbbf24', bg: '#fbbf2422' },
  flagged:       { label: 'Auffällig ⚠',        color: '#f87171', bg: '#f8717122' },
  unknown:       { label: 'Ungeprüft',           color: 'var(--text-4)', bg: 'var(--border)' },
};
const DDS_STATUS_META = {
  draft:     { label: 'Entwurf',    color: 'var(--text-4)', bg: 'var(--border)' },
  submitted: { label: 'Eingereicht', color: '#60a5fa', bg: '#60a5fa22' },
  accepted:  { label: 'Akzeptiert', color: '#34d399', bg: '#34d39922' },
};

export const EUDREngineView = ({ lang }: Props) => {
  const { data: M } = useData();
  const [tab, setTab]         = useState<Tab>('plots');
  const [plots, setPlots]     = useState<FarmPlot[]>(() => loadLS(LS_PLOTS, []));
  const [links, setLinks]     = useState<LotFarmLink[]>(() => loadLS(LS_LINKS, []));
  const [ddsRecs, setDdsRecs] = useState<DDSRecord[]>(() => loadLS(LS_DDS, []));

  // Persist on change
  useEffect(() => { saveLS(LS_PLOTS, plots); }, [plots]);
  useEffect(() => { saveLS(LS_LINKS, links); }, [links]);
  useEffect(() => { saveLS(LS_DDS, ddsRecs); }, [ddsRecs]);

  // --- Tab 1: Farm Plots state ---
  const [showAddPlot, setShowAddPlot] = useState(false);
  const [editPlotId, setEditPlotId] = useState<string | null>(null);
  const emptyPlot: Omit<FarmPlot, 'id' | 'createdAt'> = {
    supplierId: '', supplierName: '', plotName: '', lat: 0, lng: 0, areaha: 0,
    country: '', region: '', cadastralRef: '', forestStatus: 'unknown',
    verificationDate: '', verificationRef: '', verificationMethod: '', notes: '',
  };
  const [plotForm, setPlotForm] = useState(emptyPlot);

  // --- Tab 2: Lot linkage state ---
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [assignedPlotIds, setAssignedPlotIds] = useState<string[]>([]);
  const [splitPcts, setSplitPcts] = useState<Record<string, number>>({});
  const [linkNotes, setLinkNotes] = useState('');

  // --- Tab 3: DDS Generator state ---
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [ddsOperator, setDdsOperator] = useState('');
  const [ddsEori, setDdsEori] = useState('');
  const [ddsAddress, setDdsAddress] = useState('');

  // --- Derived data ---
  const suppliers = useMemo(() => M?.suppliers ?? [], [M]);
  const lots      = useMemo(() => M?.lots ?? [], [M]);
  const orders    = useMemo(() => M?.orders ?? [], [M]);
  const products  = useMemo(() => M?.products ?? [], [M]);

  const ddsOrders = useMemo(() =>
    orders.filter(o => ['shipped', 'done', 'paid', 'in_transit', 'arrived'].includes(o.statusKey ?? o.status ?? '')),
  [orders]);

  const selectedLot = useMemo(() => lots.find(l => l.id === selectedLotId) ?? null, [lots, selectedLotId]);
  const currentLink = useMemo(() => links.find(l => l.lotId === selectedLotId) ?? null, [links, selectedLotId]);

  // When lot selected, pre-fill from existing link
  useEffect(() => {
    if (currentLink) {
      setAssignedPlotIds(currentLink.plotIds);
      setSplitPcts(currentLink.splitPcts);
      setLinkNotes(currentLink.notes);
    } else {
      setAssignedPlotIds([]); setSplitPcts({}); setLinkNotes('');
    }
  }, [currentLink, selectedLotId]);

  // Plots for selected lot's supplier
  const lotPlots = useMemo(() => {
    if (!selectedLot) return plots;
    return plots.filter(p => p.supplierId === selectedLot.supplierId);
  }, [plots, selectedLot]);

  // DDS generation
  const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId) ?? null, [orders, selectedOrderId]);
  const orderLots     = useMemo(() =>
    lots.filter(l => selectedOrder && l.linkedOrders?.includes(selectedOrder.id)),
  [lots, selectedOrder]);
  const orderLinks    = useMemo(() =>
    links.filter(l => orderLots.some(lot => lot.id === l.lotId)),
  [links, orderLots]);
  const orderPlotIds  = useMemo(() =>
    Array.from(new Set(orderLinks.flatMap(l => l.plotIds))),
  [orderLinks]);
  const orderPlots    = useMemo(() =>
    plots.filter(p => orderPlotIds.includes(p.id)),
  [plots, orderPlotIds]);

  const generateDDSText = () => {
    if (!selectedOrder) return '';
    const product  = products.find(p => p.id === selectedOrder.productId);
    const supplier = suppliers.find(s => s.id === selectedOrder.supplierId);
    const totalHa  = orderPlots.reduce((s, p) => s + p.areaha, 0);
    const freeHa   = orderPlots.filter(p => p.forestStatus === 'verified_free').reduce((s, p) => s + p.areaha, 0);
    const freePct  = totalHa > 0 ? Math.round((freeHa / totalHa) * 100) : 0;
    const border   = '═'.repeat(54);
    const div      = '─'.repeat(54);

    let txt = `DUE DILIGENCE STATEMENT — EU 2023/1115\n${border}\n\n`;
    txt += `OPERATOR\n  Name:         ${ddsOperator || '[Firmenname]'}\n  EORI:         ${ddsEori || '[EORI-Nummer]'}\n  Adresse:      ${ddsAddress || '[Adresse]'}\n\n`;
    txt += `PRODUKT-INFORMATION\n`;
    txt += `  Produkt:      ${product?.name ?? selectedOrder.productId}\n`;
    txt += `  HS-Code:      ${product?.hs ?? '—'}\n`;
    txt += `  Menge:        ${selectedOrder.qty} ${selectedOrder.unit}\n`;
    txt += `  Lieferant:    ${supplier?.name ?? selectedOrder.supplierId}\n`;
    txt += `  Ursprung:     ${product?.origin ?? supplier?.country ?? '—'}\n`;
    txt += `  Auftrag-ID:   ${selectedOrder.id}\n`;
    txt += `  ETD:          ${selectedOrder.etd ?? '—'}\n\n`;

    if (orderLots.length > 0) {
      txt += `LOTS IN DIESER SENDUNG\n${div}\n`;
      orderLots.forEach(lot => {
        txt += `  Lot-ID: ${lot.id} | ${lot.productName} | Ernte: ${lot.harvestDate ?? '—'} | ${lot.qty} ${lot.unit} | Grade ${lot.grade}\n`;
        const lotLink = links.find(l => l.lotId === lot.id);
        if (lotLink && lotLink.plotIds.length > 0) {
          const lotPlotObjs = plots.filter(p => lotLink.plotIds.includes(p.id));
          lotPlotObjs.forEach((p, i) => {
            const prefix = i === lotPlotObjs.length - 1 ? '    └' : '    ├';
            const fs = FOREST_STATUS_META[p.forestStatus];
            txt += `${prefix} ${p.id} | ${p.supplierName} | GPS: ${p.lat},${p.lng} | ${p.areaha}ha | ${fs.label}\n`;
          });
        }
      });
      txt += '\n';
    }

    txt += `AGGREGIERTE FARM-DATEN\n${div}\n`;
    txt += `  Anzahl Farm-Plots:     ${orderPlots.length}\n`;
    txt += `  Gesamtfläche:          ${totalHa.toFixed(2)} ha\n`;
    txt += `  Entwaldungsfrei (%):   ${freePct}% der Fläche verifiziert\n\n`;

    txt += `ERKLÄRUNG\n${div}\n`;
    txt += `  Ich bestätige, dass oben genannte Ware in Übereinstimmung mit\n`;
    txt += `  EU-Verordnung 2023/1115 erzeugt wurde und auf keinen Flächen\n`;
    txt += `  angebaut wurde, die nach dem 31.12.2020 entwaldet oder\n`;
    txt += `  waldgeschädigt wurden.\n\n`;
    txt += `TRACES-NT Referenz: [ausstehend]\nErstellt am:        ${new Date().toLocaleDateString('de-DE')}\n${border}\n`;
    return txt;
  };

  const handleSaveDDS = () => {
    if (!selectedOrder) return;
    const rec: DDSRecord = {
      id: 'DDS-' + uid().toUpperCase().slice(0, 8),
      orderId: selectedOrder.id,
      operatorName: ddsOperator,
      eori: ddsEori,
      address: ddsAddress,
      lots: orderLots.map(l => l.id),
      plots: orderPlotIds,
      tracesRef: '',
      status: 'draft',
      createdAt: new Date().toISOString(),
      packageJson: JSON.stringify({ order: selectedOrder, lots: orderLots, plots: orderPlots, operator: ddsOperator, eori: ddsEori }),
    };
    const next = [...ddsRecs, rec];
    setDdsRecs(next);
    alert(`DDS ${rec.id} gespeichert.`);
  };

  const handleSaveLink = () => {
    if (!selectedLotId || !selectedLot) return;
    const link: LotFarmLink = {
      id: currentLink?.id ?? uid(),
      lotId: selectedLotId,
      lotName: selectedLot.productName + ' / ' + selectedLotId,
      plotIds: assignedPlotIds,
      splitPcts,
      notes: linkNotes,
    };
    const next = links.filter(l => l.lotId !== selectedLotId).concat(link);
    setLinks(next);
  };

  const handleAddPlot = () => {
    if (!plotForm.plotName || !plotForm.supplierId) return;
    const sup = suppliers.find(s => s.id === plotForm.supplierId);
    const newPlot: FarmPlot = { ...plotForm, id: 'PLT-' + uid().toUpperCase().slice(0,8), supplierName: sup?.name ?? plotForm.supplierName, createdAt: new Date().toISOString() };
    if (editPlotId) {
      setPlots(plots.map(p => p.id === editPlotId ? { ...newPlot, id: editPlotId } : p));
      setEditPlotId(null);
    } else {
      setPlots([...plots, newPlot]);
    }
    setPlotForm(emptyPlot);
    setShowAddPlot(false);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'plots',   label: t(lang, 'ee_tab_plots') },
    { id: 'lots',    label: t(lang, 'ee_tab_lots') },
    { id: 'dds',     label: t(lang, 'ee_tab_dds') },
    { id: 'archive', label: t(lang, 'ee_tab_archive') },
  ];

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400 }}>
      {/* Header */}
      <div className="section-head" style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>{t(lang, 'ee_title')}</h1>
          <div className="sub">{t(lang, 'ee_subtitle')}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: 'var(--bg-2)', borderRadius: 8, padding: 4, marginBottom: 20, width: 'fit-content', border: '1px solid var(--border)' }}>
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            style={{ padding: '6px 18px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === tb.id ? 600 : 400, background: tab === tb.id ? 'var(--surface-2)' : 'transparent', color: tab === tb.id ? 'var(--text)' : 'var(--text-3)' }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Farm Plots ── */}
      {tab === 'plots' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{plots.length} Farm-Plot(s) erfasst</div>
            <button className="btn" onClick={() => { setShowAddPlot(true); setEditPlotId(null); setPlotForm(emptyPlot); }}>
              <Ic name="plus" size={13} /> {t(lang, 'ee_add_plot')}
            </button>
          </div>

          {plots.length === 0 ? (
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 40, textAlign: 'center', color: 'var(--text-4)' }}>
              Noch keine Farm-Plots erfasst. Klicken Sie auf &quot;+ Farm-Plot hinzufügen&quot; um zu beginnen.
            </div>
          ) : (
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Plot-ID', 'Lieferant', 'Plot-Name', 'GPS', 'Fläche (ha)', 'Land/Region', 'Wald-Status', 'Verif.-Datum', 'Aktionen'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plots.map(p => {
                    const fs = FOREST_STATUS_META[p.forestStatus];
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-3)' }}>{p.id}</td>
                        <td style={{ padding: '10px 12px' }}>{p.supplierName}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{p.plotName}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-3)' }}>{p.lat}, {p.lng}</td>
                        <td style={{ padding: '10px 12px' }}>{p.areaha}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-2)' }}>{p.country}{p.region ? ` / ${p.region}` : ''}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ background: fs.bg, color: fs.color, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{fs.label}</span>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-3)', fontSize: 12 }}>{fmtDate(p.verificationDate)}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <a href={`https://www.google.com/maps?q=${p.lat},${p.lng}`} target="_blank" rel="noreferrer"
                              style={{ fontSize: 11, color: '#60a5fa', textDecoration: 'none', background: '#60a5fa22', borderRadius: 4, padding: '2px 7px' }}>
                              {t(lang, 'ee_show_maps')}
                            </a>
                            <button onClick={() => { setEditPlotId(p.id); setPlotForm({ ...p }); setShowAddPlot(true); }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 12 }}>
                              <Ic name="edit" size={12} />
                            </button>
                            <button onClick={() => { if (confirm('Plot löschen?')) setPlots(plots.filter(x => x.id !== p.id)); }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 12 }}>
                              <Ic name="trash" size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* GPS Help Box */}
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-2)', marginBottom: 8 }}><Ic name="pin" size={13} /> {t(lang, 'ee_gps_help_title')}</div>
            <div>1. <b>Google Earth Pro</b> → Farm-Plot einzeichnen → Koordinaten ablesen</div>
            <div>2. <b>What3Words / QGIS</b> für genaue Parzellenerfassung</div>
            <div>3. <b>WRI Forest Watcher App</b> (kostenlos) → Patch tracken + Deforestation-Alert</div>
            <div>4. <b>Sentinel-2 Referenz:</b> apps.sentinel-hub.com → Szene-ID als Nachweis</div>
            <div style={{ marginTop: 8, color: '#fbbf24', fontWeight: 600 }}>{t(lang, 'ee_cutoff_note')}</div>
          </div>

          {/* Add/Edit Plot Modal */}
          {showAddPlot && (
            <div className="overlay" onClick={() => setShowAddPlot(false)}>
              <div className="modal" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
                  {editPlotId ? 'Farm-Plot bearbeiten' : t(lang, 'ee_add_plot')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ fontSize: 12, color: 'var(--text-3)' }}>{t(lang, 'ee_supplier')} *</label>
                    <select value={plotForm.supplierId}
                      onChange={e => { const sup = suppliers.find(s => s.id === e.target.value); setPlotForm(f => ({ ...f, supplierId: e.target.value, supplierName: sup?.name ?? '' })); }}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 8px', fontSize: 13, marginTop: 4 }}>
                      <option value="">— Lieferant wählen —</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ fontSize: 12, color: 'var(--text-3)' }}>{t(lang, 'ee_plot_name')} *</label>
                    <input value={plotForm.plotName} onChange={e => setPlotForm(f => ({ ...f, plotName: e.target.value }))}
                      placeholder="z.B. Kibire Block A"
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 8px', fontSize: 13, marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-3)' }}>{t(lang, 'ee_lat')} *</label>
                    <input type="number" step="0.000001" value={plotForm.lat}
                      onChange={e => setPlotForm(f => ({ ...f, lat: parseFloat(e.target.value) || 0 }))}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 8px', fontSize: 13, marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-3)' }}>{t(lang, 'ee_lng')} *</label>
                    <input type="number" step="0.000001" value={plotForm.lng}
                      onChange={e => setPlotForm(f => ({ ...f, lng: parseFloat(e.target.value) || 0 }))}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 8px', fontSize: 13, marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-3)' }}>{t(lang, 'ee_area_ha')}</label>
                    <input type="number" step="0.1" value={plotForm.areaha}
                      onChange={e => setPlotForm(f => ({ ...f, areaha: parseFloat(e.target.value) || 0 }))}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 8px', fontSize: 13, marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-3)' }}>{t(lang, 'ee_forest_status')}</label>
                    <select value={plotForm.forestStatus}
                      onChange={e => setPlotForm(f => ({ ...f, forestStatus: e.target.value as FarmPlot['forestStatus'] }))}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 8px', fontSize: 13, marginTop: 4 }}>
                      <option value="unknown">{t(lang, 'ee_status_unknown')}</option>
                      <option value="pending">{t(lang, 'ee_status_pending')}</option>
                      <option value="verified_free">{t(lang, 'ee_status_free')}</option>
                      <option value="flagged">{t(lang, 'ee_status_flagged')}</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-3)' }}>{t(lang, 'ee_country')}</label>
                    <input value={plotForm.country} onChange={e => setPlotForm(f => ({ ...f, country: e.target.value }))}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 8px', fontSize: 13, marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-3)' }}>{t(lang, 'ee_region')}</label>
                    <input value={plotForm.region} onChange={e => setPlotForm(f => ({ ...f, region: e.target.value }))}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 8px', fontSize: 13, marginTop: 4 }} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ fontSize: 12, color: 'var(--text-3)' }}>{t(lang, 'ee_cadastral')}</label>
                    <input value={plotForm.cadastralRef} onChange={e => setPlotForm(f => ({ ...f, cadastralRef: e.target.value }))}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 8px', fontSize: 13, marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-3)' }}>{t(lang, 'ee_verif_date')}</label>
                    <input type="date" value={plotForm.verificationDate} onChange={e => setPlotForm(f => ({ ...f, verificationDate: e.target.value }))}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 8px', fontSize: 13, marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-3)' }}>{t(lang, 'ee_verif_method')}</label>
                    <select value={plotForm.verificationMethod}
                      onChange={e => setPlotForm(f => ({ ...f, verificationMethod: e.target.value as FarmPlot['verificationMethod'] }))}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 8px', fontSize: 13, marginTop: 4 }}>
                      <option value="">— Methode wählen —</option>
                      <option value="satellite">{t(lang, 'ee_method_satellite')}</option>
                      <option value="certificate">{t(lang, 'ee_method_certificate')}</option>
                      <option value="ngo">{t(lang, 'ee_method_ngo')}</option>
                      <option value="manual">{t(lang, 'ee_method_manual')}</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ fontSize: 12, color: 'var(--text-3)' }}>{t(lang, 'ee_verif_ref')}</label>
                    <input value={plotForm.verificationRef} onChange={e => setPlotForm(f => ({ ...f, verificationRef: e.target.value }))}
                      placeholder="z.B. Sentinel-2 Szene-ID, Zert.-Nr."
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 8px', fontSize: 13, marginTop: 4 }} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ fontSize: 12, color: 'var(--text-3)' }}>{t(lang, 'ee_notes')}</label>
                    <textarea value={plotForm.notes} onChange={e => setPlotForm(f => ({ ...f, notes: e.target.value }))}
                      rows={2}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 8px', fontSize: 13, marginTop: 4, resize: 'vertical' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                  <button className="btn ghost" onClick={() => setShowAddPlot(false)}>Abbrechen</button>
                  <button className="btn" onClick={handleAddPlot}>Speichern</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Lot-zu-Farm ── */}
      {tab === 'lots' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Left: Lots list */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-2)' }}>Lots auswählen</div>
            {lots.length === 0 ? (
              <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 32, textAlign: 'center', color: 'var(--text-4)' }}>
                Keine Lots vorhanden. Lots im Lots-Modul anlegen.
              </div>
            ) : lots.map(lot => {
              const link = links.find(l => l.lotId === lot.id);
              return (
                <div key={lot.id}
                  onClick={() => setSelectedLotId(selectedLotId === lot.id ? null : lot.id)}
                  style={{ background: selectedLotId === lot.id ? 'var(--surface-2)' : 'var(--bg-2)', border: `1px solid ${selectedLotId === lot.id ? '#60a5fa' : 'var(--border)'}`, borderRadius: 8, padding: '10px 14px', marginBottom: 8, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{lot.productName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'monospace' }}>{lot.id}</div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {lot.qty} {lot.unit} · Grade {lot.grade}
                    </div>
                  </div>
                  {link && (
                    <div style={{ marginTop: 4, fontSize: 11, color: '#34d399' }}>✓ {link.plotIds.length} Plot(s) verknüpft</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Plot assignment */}
          <div>
            {!selectedLot ? (
              <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 40, textAlign: 'center', color: 'var(--text-4)' }}>
                ← Lot auswählen um Farm-Plots zuzuweisen
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-2)' }}>
                  Farm-Plots für: {selectedLot.productName}
                </div>

                {lotPlots.length === 0 ? (
                  <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, fontSize: 12, color: 'var(--text-4)', marginBottom: 12 }}>
                    Keine Farm-Plots für diesen Lieferanten vorhanden. Im Tab &quot;Farm-Plots&quot; hinzufügen.
                  </div>
                ) : lotPlots.map(p => {
                  const fs = FOREST_STATUS_META[p.forestStatus];
                  const checked = assignedPlotIds.includes(p.id);
                  return (
                    <div key={p.id} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="checkbox" checked={checked}
                          onChange={e => {
                            if (e.target.checked) setAssignedPlotIds(ids => [...ids, p.id]);
                            else { setAssignedPlotIds(ids => ids.filter(i => i !== p.id)); setSplitPcts(s => { const n = {...s}; delete n[p.id]; return n; }); }
                          }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{p.plotName}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{p.areaha} ha · {p.country}</div>
                        </div>
                        <span style={{ background: fs.bg, color: fs.color, borderRadius: 4, padding: '1px 7px', fontSize: 11 }}>{fs.label}</span>
                      </div>
                      {checked && (
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Anteil %:</span>
                          <input type="number" min={0} max={100} value={splitPcts[p.id] ?? ''}
                            onChange={e => setSplitPcts(s => ({ ...s, [p.id]: parseFloat(e.target.value) || 0 }))}
                            style={{ width: 70, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 4, padding: '3px 6px', fontSize: 12 }} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Notes */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-3)' }}>Notizen</label>
                  <textarea value={linkNotes} onChange={e => setLinkNotes(e.target.value)} rows={2}
                    style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 8px', fontSize: 13, marginTop: 4, resize: 'vertical' }} />
                </div>

                <button className="btn" onClick={handleSaveLink} style={{ width: '100%' }}>
                  {t(lang, 'ee_link_save')}
                </button>

                {/* Traceability summary */}
                {assignedPlotIds.length > 0 && (
                  <div style={{ marginTop: 14, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--text-3)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Traceability-Zusammenfassung</div>
                    {(() => {
                      const assigned = plots.filter(p => assignedPlotIds.includes(p.id));
                      const totalHa = assigned.reduce((s, p) => s + p.areaha, 0);
                      const freeCount = assigned.filter(p => p.forestStatus === 'verified_free').length;
                      return <div>Dieses Lot besteht aus Ware von <b>{assigned.length}</b> Farm-Plot(s) ({totalHa.toFixed(1)} ha gesamt, {freeCount}/{assigned.length} entwaldungsfrei verifiziert)</div>;
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 3: DDS Generator ── */}
      {tab === 'dds' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Left: Inputs */}
          <div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--text-3)' }}>{t(lang, 'ee_dds_select_order')}</label>
              <select value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 8px', fontSize: 13, marginTop: 4 }}>
                <option value="">— Auftrag wählen —</option>
                {ddsOrders.map(o => <option key={o.id} value={o.id}>{o.id} · {suppliers.find(s => s.id === o.supplierId)?.name ?? o.supplierId}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-3)' }}>{t(lang, 'ee_dds_operator')}</label>
              <input value={ddsOperator} onChange={e => setDdsOperator(e.target.value)} placeholder="EastAfrica Export GmbH"
                style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 8px', fontSize: 13, marginTop: 4 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-3)' }}>{t(lang, 'ee_dds_eori')}</label>
              <input value={ddsEori} onChange={e => setDdsEori(e.target.value)} placeholder="DE123456789"
                style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 8px', fontSize: 13, marginTop: 4 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text-3)' }}>Adresse</label>
              <input value={ddsAddress} onChange={e => setDdsAddress(e.target.value)} placeholder="Musterstr. 1, 10115 Berlin"
                style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 8px', fontSize: 13, marginTop: 4 }} />
            </div>
            {selectedOrder && (
              <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Sendungsübersicht</div>
                <div>Lots in Auftrag: <b>{orderLots.length}</b></div>
                <div>Verknüpfte Farm-Plots: <b>{orderPlotIds.length}</b></div>
                {orderPlots.length > 0 && (
                  <div>Entwaldungsfrei: <b style={{ color: '#34d399' }}>{orderPlots.filter(p => p.forestStatus === 'verified_free').length}/{orderPlots.length}</b></div>
                )}
                {orderLots.length === 0 && <div style={{ color: '#fbbf24', marginTop: 4 }}>⚠ Keine Lots mit diesem Auftrag verknüpft. Im Lots-Modul verknüpfen.</div>}
                {orderLots.length > 0 && orderPlotIds.length === 0 && <div style={{ color: '#fbbf24', marginTop: 4 }}>⚠ Lots noch nicht mit Farm-Plots verknüpft. Im Tab &quot;Lot-zu-Farm&quot; verknüpfen.</div>}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" onClick={handleSaveDDS} disabled={!selectedOrder}>
                <Ic name="doc" size={13} /> {t(lang, 'ee_dds_save')}
              </button>
              <button className="btn ghost" onClick={() => downloadText(`DDS-${selectedOrderId}-${Date.now()}.txt`, generateDDSText())} disabled={!selectedOrder}>
                <Ic name="download" size={13} /> {t(lang, 'ee_dds_export_txt')}
              </button>
              <button className="btn ghost" onClick={() => downloadText(`DDS-${selectedOrderId}-${Date.now()}.json`, JSON.stringify({ orderId: selectedOrderId, operator: ddsOperator, eori: ddsEori, lots: orderLots, plots: orderPlots }, null, 2), 'application/json')} disabled={!selectedOrder}>
                <Ic name="doc" size={13} /> {t(lang, 'ee_dds_export_json')}
              </button>
            </div>
          </div>

          {/* Right: Preview */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>DDS-Vorschau</div>
            <pre style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, fontSize: 11, color: 'var(--text-2)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: 1.6, minHeight: 200, maxHeight: 600, overflowY: 'auto' }}>
              {selectedOrder ? generateDDSText() : '← Auftrag auswählen um DDS-Vorschau zu generieren'}
            </pre>
          </div>
        </div>
      )}

      {/* ── Tab 4: Archive ── */}
      {tab === 'archive' && (
        <div>
          <div style={{ background: '#fbbf2422', border: '1px solid #fbbf24', borderRadius: 8, padding: '10px 16px', fontSize: 12, color: '#fbbf24', marginBottom: 16 }}>
            <b>⚠ {t(lang, 'ee_archive_retention_note')}</b>
            <br /><span style={{ color: 'var(--text-3)' }}>Obligatorisch ab: Dezember 2025 (Großunternehmen) · Juni 2026 (KMU)</span>
          </div>

          {ddsRecs.length === 0 ? (
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 40, textAlign: 'center', color: 'var(--text-4)' }}>
              Noch keine DDS-Pakete gespeichert. Im Tab &quot;DDS-Generator&quot; erstellen.
            </div>
          ) : (
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {[t(lang,'ee_archive_col_id'), t(lang,'ee_archive_col_order'), t(lang,'ee_archive_col_created'), 'Lots', 'Plots', t(lang,'ee_archive_col_status'), t(lang,'ee_archive_col_expiry'), 'Aktionen'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ddsRecs.map(rec => {
                    const expiry = addYears(rec.createdAt, 5);
                    const now = new Date();
                    const daysToExpiry = (expiry.getTime() - now.getTime()) / 86400000;
                    const expiryColor = daysToExpiry < 0 ? '#f87171' : daysToExpiry < 180 ? '#fbbf24' : 'var(--text-3)';
                    const sm = DDS_STATUS_META[rec.status];
                    return (
                      <tr key={rec.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{rec.id}</td>
                        <td style={{ padding: '10px 12px' }}>{rec.orderId}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-3)', fontSize: 12 }}>{fmtDate(rec.createdAt)}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-2)' }}>{rec.lots.length}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-2)' }}>{rec.plots.length}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ background: sm.bg, color: sm.color, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{sm.label}</span>
                        </td>
                        <td style={{ padding: '10px 12px', color: expiryColor, fontSize: 12 }}>{expiry.toLocaleDateString('de-DE')}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn sm ghost" onClick={() => downloadText(`DDS-${rec.id}.json`, rec.packageJson, 'application/json')}>
                              {t(lang, 'ee_download_dds')}
                            </button>
                            {rec.status === 'draft' && (
                              <button className="btn sm ghost" onClick={() => setDdsRecs(recs => recs.map(r => r.id === rec.id ? { ...r, status: 'submitted' } : r))}>
                                {t(lang, 'ee_mark_submitted')}
                              </button>
                            )}
                            <button onClick={() => {
                              if (daysToExpiry > 0 && daysToExpiry < 365 * 5) {
                                if (!confirm('Diese DDS ist noch nicht abgelaufen. Wirklich löschen?')) return;
                              }
                              setDdsRecs(recs => recs.filter(r => r.id !== rec.id));
                            }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171' }}>
                              <Ic name="trash" size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

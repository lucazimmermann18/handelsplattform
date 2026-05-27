'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtNum, fmtKg } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge, Stars } from '@/components/ui/primitives';
import type {
  Product, ProductVariant, ProductQcRow,
  ProductCert, ImportRestriction, ProductPackaging,
  ProductStorage, OriginRegion, MarketPrice, RequiredDoc,
} from '@/lib/types';

// ── Constants ──────────────────────────────────────────────────────────────────

const UNITS = ['kg', 't', 'Stk', 'L'];
const INCOTERM_OPTIONS = ['FOB', 'CIF', 'CFR', 'DAP', 'DDP', 'EXW', 'FCA', 'CPT', 'FAS'];
const CURRENCY_OPTIONS = ['EUR', 'USD', 'GBP', 'CHF'];
const EUDR_STATUSES = [
  { key: 'relevant'       as const, label: 'EUDR-relevant',  color: '#fbbf24' },
  { key: 'nicht_relevant' as const, label: 'Nicht relevant', color: '#34d399' },
  { key: 'unklar'         as const, label: 'Unklar',         color: '#94a3b8' },
];
const COMMON_CERT_NAMES = [
  'Fairtrade', 'Organic EU', 'Rainforest Alliance', 'UTZ', 'FLO-CERT',
  '4C', 'USDA Organic', 'JAS Organic', 'GlobalG.A.P.',
];
const DOC_TEMPLATES = [
  'Ursprungszeugnis', 'Phytosanitär-Zertifikat', 'EUDR-DDS',
  'COA (Analyse-Zertifikat)', 'Gewichtszertifikat', 'Fumigation Certificate',
  'Organic Certificate', 'Fairtrade Certificate', 'EUR.1 Präferenznachweis',
  'Packliste', 'Handelsrechnung', 'Konossement (B/L)',
];

// ── Shared styles ──────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};
const cellInput: React.CSSProperties = { ...inputStyle, padding: '5px 7px', fontSize: 12 };
const thStyle: React.CSSProperties = {
  padding: '5px 4px', textAlign: 'left', fontSize: 10.5, color: 'var(--text-3)',
  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
    color: 'var(--text-3)', marginBottom: 8,
  }}>
    {children}
  </div>
);

const DeleteBtn = ({ onClick }: { onClick: () => void }) => (
  <button
    className="btn sm ghost"
    onClick={onClick}
    style={{ color: '#f87171', padding: '3px 6px' }}
    title="Entfernen"
  >
    <Ic name="trash" size={12} />
  </button>
);

// ── QC template per category ───────────────────────────────────────────────────

function getQcRows(cat: string): ProductQcRow[] {
  if (cat === 'Kaffee') return [
    { p: 'Feuchtigkeit',        min: '10%',       tgt: '11.5%',     max: '12.5%',  eu: '12.5%' },
    { p: 'Defects (Specialty)', min: '—',          tgt: '4',         max: '8',      eu: '—' },
    { p: 'Cup Score (SCA)',     min: '85',          tgt: '87',        max: '—',      eu: '—' },
    { p: 'Ochratoxin A',        min: '—',          tgt: '<1 µg/kg',  max: '5 µg/kg', eu: '5 µg/kg' },
    { p: 'Größe',               min: 'Screen 15',  tgt: '17+',       max: '—',      eu: '—' },
  ];
  if (cat === 'Nüsse') return [
    { p: 'Feuchtigkeit',    min: '3%',  tgt: '4.2%',   max: '5%',   eu: '5%' },
    { p: 'Reinheit',        min: '99%', tgt: '99.5%',  max: '—',    eu: '—' },
    { p: 'Aflatoxin B1',    min: '—',   tgt: '<1 ppb', max: '2 ppb', eu: '2 µg/kg' },
    { p: 'Aflatoxin Total', min: '—',   tgt: '<2 ppb', max: '4 ppb', eu: '4 µg/kg' },
    { p: 'Salmonellen',     min: '—',   tgt: 'n.n.',   max: 'n.n.', eu: 'n.n. in 25g' },
    { p: 'Bruchanteil',     min: '—',   tgt: '3%',     max: '5%',   eu: '—' },
  ];
  return [
    { p: 'Feuchtigkeit',  min: '5%', tgt: '7%',         max: '8%', eu: '—' },
    { p: 'Fremdkörper',   min: '—',  tgt: '0.3%',       max: '0.5%', eu: '—' },
    { p: 'MRL Pestizide', min: '—',  tgt: 'EU-konform', max: '—',  eu: 'EU 396/2005' },
  ];
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────

type EditTab = 'grunddaten' | 'varianten' | 'qualitaet' | 'zoll' | 'logistik' | 'herkunft' | 'preise' | 'dokumente';

interface EditModalProps {
  product: Product;
  initialTab?: EditTab;
  onClose: () => void;
  onSaved: () => void;
}

const emptyVariant    = (): ProductVariant    => ({ v: '', grade: '', stock: 0 });
const emptyQcRow      = (): ProductQcRow      => ({ p: '', min: '—', tgt: '—', max: '—', eu: '—' });
const emptyCert       = (): ProductCert       => ({ name: '', issuer: '', certNo: '', validUntil: '' });
const emptyRestr      = (): ImportRestriction => ({ country: '', requirement: '', mandatory: true });
const emptyOrigin     = (): OriginRegion      => ({ country: '', region: '', share: '' });
const emptyMktPrice   = (): MarketPrice       => ({ market: '', price: '', currency: 'EUR', incoterm: 'FOB', validUntil: '' });
const emptyDoc        = (): RequiredDoc       => ({ docType: '', markets: 'EU', mandatory: true, notes: '' });

const EditModal = ({ product, initialTab = 'grunddaten', onClose, onSaved }: EditModalProps) => {
  const { data: M, refresh } = useData();
  const [tab, setTab] = useState<EditTab>(initialTab);

  // ── Grunddaten state ─────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: product.name, cat: product.cat, origin: product.origin,
    hs: product.hs, unit: product.unit, packaging: product.packaging,
    moq: product.moq, buyPrice: product.buyPrice, sellPrice: product.sellPrice,
    certs: product.certs.join(', '), exportReady: product.exportReady,
  });
  const set = (key: keyof typeof form, val: string | number | boolean) =>
    setForm(prev => ({ ...prev, [key]: val }));
  const margin = form.sellPrice > 0
    ? Math.round((form.sellPrice - form.buyPrice) / form.sellPrice * 100) : 0;

  // ── Varianten & QC state ─────────────────────────────────────────────────────
  const [variants, setVariants] = useState<ProductVariant[]>(
    product.variants.length > 0 ? product.variants : [emptyVariant()]
  );
  const [qualSpec, setQualSpec] = useState<ProductQcRow[]>(
    product.qualSpec ?? getQcRows(product.cat)
  );

  // ── Zoll & Regulatorik state ─────────────────────────────────────────────────
  const [eudrStatus, setEudrStatus] = useState<'relevant' | 'nicht_relevant' | 'unklar' | null>(
    product.eudrStatus ?? null
  );
  const [eudrCategory, setEudrCategory] = useState(product.eudrCategory ?? '');
  const [productCerts, setProductCerts] = useState<ProductCert[]>(product.productCerts ?? []);
  const [importRestr, setImportRestr] = useState<ImportRestriction[]>(product.importRestrictions ?? []);

  // ── Logistik & Verpackung state ──────────────────────────────────────────────
  const [pkgSpec, setPkgSpec] = useState<ProductPackaging>(product.packagingSpec ?? {
    bagType: '', fillWeight: '', palletizing: '', fcl20: '', fcl40: '',
  });
  const [storage, setStorage] = useState<ProductStorage>(product.storageConditions ?? {
    tempRange: '', humidity: '', shelfLife: '', notes: '',
  });

  // ── Herkunft & Beschaffung state ─────────────────────────────────────────────
  const [harvestSeason, setHarvestSeason] = useState(product.harvestSeason ?? '');
  const [originRegions, setOriginRegions] = useState<OriginRegion[]>(product.originRegions ?? []);
  const [linkedSupplierIds, setLinkedSupplierIds] = useState<string[]>(product.linkedSupplierIds ?? []);

  // ── Preise & Konditionen state ───────────────────────────────────────────────
  const [defaultIncoterms, setDefaultIncoterms] = useState<string[]>(product.defaultIncoterms ?? []);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>(product.marketPrices ?? []);

  // ── Pflichtdokumente state ───────────────────────────────────────────────────
  const [requiredDocs, setRequiredDocs] = useState<RequiredDoc[]>(product.requiredDocs ?? []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── cell updaters ────────────────────────────────────────────────────────────

  const updVariant  = (i: number, k: keyof ProductVariant, v: string | number) =>
    setVariants(p => p.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const updQc       = (i: number, k: keyof ProductQcRow, v: string) =>
    setQualSpec(p => p.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const updCert     = (i: number, k: keyof ProductCert, v: string) =>
    setProductCerts(p => p.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const updRestr    = (i: number, k: keyof ImportRestriction, v: string | boolean) =>
    setImportRestr(p => p.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const updOrigin   = (i: number, k: keyof OriginRegion, v: string) =>
    setOriginRegions(p => p.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const updMktPrice = (i: number, k: keyof MarketPrice, v: string) =>
    setMarketPrices(p => p.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const updDoc      = (i: number, k: keyof RequiredDoc, v: string | boolean) =>
    setRequiredDocs(p => p.map((x, j) => j === i ? { ...x, [k]: v } : x));

  const toggleIncoterm  = (it: string) =>
    setDefaultIncoterms(p => p.includes(it) ? p.filter(x => x !== it) : [...p, it]);
  const toggleSupplier  = (id: string) =>
    setLinkedSupplierIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  // ── save ─────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name ist erforderlich.'); setTab('grunddaten'); return; }
    setSaving(true); setError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const payload: Record<string, unknown> = {
        name: form.name, cat: form.cat, origin: form.origin, hs: form.hs,
        unit: form.unit, packaging: form.packaging, moq: form.moq,
        buy_price: form.buyPrice, sell_price: form.sellPrice, margin,
        export_ready: form.exportReady,
        certs: form.certs.split(',').map(s => s.trim()).filter(Boolean),
        variants: variants.filter(v => v.v.trim() || v.grade.trim() || v.stock > 0),
        qual_spec: qualSpec.filter(r => r.p.trim()),
        eudr_status: eudrStatus,
        eudr_category: eudrCategory || null,
        product_certs: productCerts.filter(c => c.name.trim()),
        import_restrictions: importRestr.filter(r => r.country.trim() || r.requirement.trim()),
        packaging_spec: pkgSpec,
        storage_conditions: storage,
        harvest_season: harvestSeason || null,
        origin_regions: originRegions.filter(r => r.country.trim() || r.region.trim()),
        linked_supplier_ids: linkedSupplierIds,
        default_incoterms: defaultIncoterms,
        market_prices: marketPrices.filter(p => p.market.trim()),
        required_docs: requiredDocs.filter(d => d.docType.trim()),
      };
      const { error: sbErr } = await sb.from('products').update(payload).eq('id', product.id);
      if (sbErr) throw new Error(sbErr.message);
      refresh();
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const TABS: { key: EditTab; label: string }[] = [
    { key: 'grunddaten', label: 'Grunddaten' },
    { key: 'varianten',  label: `Varianten (${variants.filter(v => v.v).length})` },
    { key: 'qualitaet',  label: `Qualität (${qualSpec.filter(r => r.p).length})` },
    { key: 'zoll',       label: 'Regulatorik' },
    { key: 'logistik',   label: 'Logistik' },
    { key: 'herkunft',   label: 'Herkunft' },
    { key: 'preise',     label: 'Preise' },
    { key: 'dokumente',  label: `Dokumente (${requiredDocs.filter(d => d.docType).length})` },
  ];

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <div className="overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '4vh' }}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ width: '94vw', maxWidth: 740, maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
      >
        {/* Header */}
        <div className="modal-head">
          <Ic name="product" size={14} />
          <span style={{ fontWeight: 700 }}>Produkt bearbeiten</span>
          <span className="mono tx3" style={{ fontSize: 11, marginLeft: 4 }}>· {product.id}</span>
          <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={onClose}>
            <Ic name="x" size={13} />
          </button>
        </div>

        {/* Tab bar — scrollable */}
        <div style={{
          display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '0 18px', gap: 2, overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {TABS.map(tb => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                padding: '9px 14px', fontSize: 12.5, fontWeight: tab === tb.key ? 600 : 400,
                color: tab === tb.key ? 'var(--text)' : 'var(--text-3)',
                borderBottom: tab === tb.key ? '2px solid #60a5fa' : '2px solid transparent',
                marginBottom: -1, transition: 'color 0.15s',
              }}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>

          {/* ── Grunddaten ────────────────────────────────────────────────────── */}
          {tab === 'grunddaten' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Name *</div>
                <input autoFocus type="text" value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Kategorie</div>
                  <input type="text" value={form.cat} onChange={e => set('cat', e.target.value)} placeholder="z.B. Kaffee" style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Herkunftsland</div>
                  <input type="text" value={form.origin} onChange={e => set('origin', e.target.value)} placeholder="z.B. TZ" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>HS-Code</div>
                  <input type="text" value={form.hs} onChange={e => set('hs', e.target.value)} placeholder="z.B. 0901.11" style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500 }}>Einheit</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {UNITS.map(u => (
                      <span key={u} className={`chip${form.unit === u ? ' on' : ''}`} onClick={() => set('unit', u)} style={{ cursor: 'pointer' }}>{u}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Verpackung</div>
                  <input type="text" value={form.packaging} onChange={e => set('packaging', e.target.value)} placeholder="z.B. 60 kg Jutesack" style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>MOQ</div>
                  <input type="text" value={form.moq} onChange={e => set('moq', e.target.value)} placeholder="z.B. 1000 kg" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Einkaufspreis (€)</div>
                  <input type="number" min={0} step={0.01} value={form.buyPrice || ''} onChange={e => set('buyPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Verkaufspreis (€)</div>
                  <input type="number" min={0} step={0.01} value={form.sellPrice || ''} onChange={e => set('sellPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" style={inputStyle} />
                </div>
              </div>
              <div style={{ padding: '7px 12px', borderRadius: 7, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 12.5 }}>
                <span style={{ color: 'var(--text-3)' }}>Marge: </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: margin >= 20 ? '#34d399' : margin >= 10 ? '#fbbf24' : margin > 0 ? '#f87171' : 'var(--text-3)' }}>
                  {margin}%
                </span>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>
                  Zertifikate <span style={{ fontWeight: 400 }}>(kommagetrennt · Kurzform für Übersicht)</span>
                </div>
                <input type="text" value={form.certs} onChange={e => set('certs', e.target.value)} placeholder="z.B. Fairtrade, Organic EU" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500 }}>Exportstatus</div>
                <span className={`chip${form.exportReady ? ' on' : ''}`} onClick={() => set('exportReady', !form.exportReady)} style={{ cursor: 'pointer' }}>Export bereit</span>
              </div>
            </div>
          )}

          {/* ── Varianten ─────────────────────────────────────────────────────── */}
          {tab === 'varianten' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="tx3" style={{ fontSize: 11.5 }}>
                Jede Variante steht für eine Qualitätsstufe oder Aufbereitungsform (z.B. &bdquo;Specialty SCA 87+&ldquo;, &bdquo;Bio Hulled&ldquo;).
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Variante / Name', 'Grade', `Bestand (${form.unit})`, ''].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '6px 4px' }}>
                        <input type="text" value={v.v} onChange={e => updVariant(i, 'v', e.target.value)} placeholder="z.B. Specialty SCA 87+" style={cellInput} />
                      </td>
                      <td style={{ padding: '6px 4px' }}>
                        <input type="text" value={v.grade} onChange={e => updVariant(i, 'grade', e.target.value)} placeholder="z.B. A / Bio" style={cellInput} />
                      </td>
                      <td style={{ padding: '6px 4px' }}>
                        <input type="number" min={0} step={1} value={v.stock || ''} onChange={e => updVariant(i, 'stock', parseFloat(e.target.value) || 0)} placeholder="0" style={{ ...cellInput, width: 90 }} />
                      </td>
                      <td style={{ padding: '6px 4px', textAlign: 'right' }}>
                        <DeleteBtn onClick={() => setVariants(p => p.filter((_, j) => j !== i))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setVariants(p => [...p, emptyVariant()])}>
                <Ic name="plus" size={12} /> Variante hinzufügen
              </button>
            </div>
          )}

          {/* ── Qualität ──────────────────────────────────────────────────────── */}
          {tab === 'qualitaet' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="tx3" style={{ fontSize: 11.5, flex: 1 }}>
                  Qualitätsparameter — werden im Produktdatenblatt und in der QS-Prüfung verwendet.
                </span>
                <button className="btn sm ghost" onClick={() => setQualSpec(getQcRows(form.cat || product.cat))}>
                  <Ic name="refresh" size={12} /> Vorlage ({form.cat || product.cat})
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Parameter', 'Min', 'Ziel', 'Max', 'EU-Grenzwert', ''].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {qualSpec.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {(['p', 'min', 'tgt', 'max', 'eu'] as (keyof ProductQcRow)[]).map(key => (
                        <td key={key} style={{ padding: '5px 4px' }}>
                          <input type="text" value={row[key]} onChange={e => updQc(i, key, e.target.value)} placeholder={key === 'p' ? 'Parameter' : '—'} style={{ ...cellInput, width: key === 'p' ? 140 : 80 }} />
                        </td>
                      ))}
                      <td style={{ padding: '5px 4px', textAlign: 'right' }}>
                        <DeleteBtn onClick={() => setQualSpec(p => p.filter((_, j) => j !== i))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setQualSpec(p => [...p, emptyQcRow()])}>
                <Ic name="plus" size={12} /> Parameter hinzufügen
              </button>
            </div>
          )}

          {/* ── Zoll & Regulatorik ────────────────────────────────────────────── */}
          {tab === 'zoll' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* EUDR */}
              <div>
                <SectionLabel>EUDR-Status</SectionLabel>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {EUDR_STATUSES.map(s => (
                    <button
                      key={s.key}
                      onClick={() => setEudrStatus(eudrStatus === s.key ? null : s.key)}
                      style={{
                        padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12.5,
                        border: `1px solid ${eudrStatus === s.key ? s.color : 'rgba(255,255,255,0.1)'}`,
                        background: eudrStatus === s.key ? `${s.color}18` : 'rgba(255,255,255,0.03)',
                        color: eudrStatus === s.key ? s.color : 'var(--text-3)',
                        fontWeight: eudrStatus === s.key ? 600 : 400, transition: 'all 0.15s',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>EUDR-Kategorie / Hinweis</div>
                <input type="text" value={eudrCategory} onChange={e => setEudrCategory(e.target.value)} placeholder="z.B. Holzprodukte Anhang I, Kategorie A" style={inputStyle} />
              </div>

              {/* Zertifizierungen */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <SectionLabel>Zertifizierungen mit Gültigkeit</SectionLabel>
                  <div style={{ flex: 1 }} />
                  <button className="btn sm" onClick={() => setProductCerts(p => [...p, emptyCert()])}>
                    <Ic name="plus" size={11} /> Hinzufügen
                  </button>
                </div>
                {productCerts.length === 0
                  ? <div className="tx3" style={{ fontSize: 11.5 }}>Noch keine Zertifizierungen gepflegt.</div>
                  : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          {['Zertifikat', 'Aussteller', 'Zert.-Nr.', 'Gültig bis', ''].map(h => <th key={h} style={thStyle}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {productCerts.map((c, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '5px 4px' }}>
                              <input type="text" list="cert-names" value={c.name} onChange={e => updCert(i, 'name', e.target.value)} placeholder="z.B. Fairtrade" style={{ ...cellInput, width: 140 }} />
                            </td>
                            <td style={{ padding: '5px 4px' }}>
                              <input type="text" value={c.issuer} onChange={e => updCert(i, 'issuer', e.target.value)} placeholder="z.B. FLO-CERT" style={{ ...cellInput, width: 110 }} />
                            </td>
                            <td style={{ padding: '5px 4px' }}>
                              <input type="text" value={c.certNo} onChange={e => updCert(i, 'certNo', e.target.value)} placeholder="Nr." style={{ ...cellInput, width: 90 }} />
                            </td>
                            <td style={{ padding: '5px 4px' }}>
                              <input type="date" value={c.validUntil} onChange={e => updCert(i, 'validUntil', e.target.value)} style={{ ...cellInput, width: 130 }} />
                            </td>
                            <td style={{ padding: '5px 4px', textAlign: 'right' }}>
                              <DeleteBtn onClick={() => setProductCerts(p => p.filter((_, j) => j !== i))} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                <datalist id="cert-names">
                  {COMMON_CERT_NAMES.map(n => <option key={n} value={n} />)}
                </datalist>
              </div>

              {/* Einfuhrbeschränkungen */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <SectionLabel>Länderspezifische Einfuhranforderungen</SectionLabel>
                  <div style={{ flex: 1 }} />
                  <button className="btn sm" onClick={() => setImportRestr(p => [...p, emptyRestr()])}>
                    <Ic name="plus" size={11} /> Hinzufügen
                  </button>
                </div>
                {importRestr.length === 0
                  ? <div className="tx3" style={{ fontSize: 11.5 }}>Noch keine länderspezifischen Anforderungen gepflegt.</div>
                  : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          {['Land', 'Anforderung', 'Pflicht', ''].map(h => <th key={h} style={thStyle}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {importRestr.map((r, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '5px 4px' }}>
                              <input type="text" value={r.country} onChange={e => updRestr(i, 'country', e.target.value)} placeholder="z.B. JP" style={{ ...cellInput, width: 60 }} />
                            </td>
                            <td style={{ padding: '5px 4px' }}>
                              <input type="text" value={r.requirement} onChange={e => updRestr(i, 'requirement', e.target.value)} placeholder="z.B. Phytosanitär-Zertifikat" style={cellInput} />
                            </td>
                            <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                              <input type="checkbox" checked={r.mandatory} onChange={e => updRestr(i, 'mandatory', e.target.checked)} style={{ accentColor: '#60a5fa', width: 15, height: 15 }} />
                            </td>
                            <td style={{ padding: '5px 4px', textAlign: 'right' }}>
                              <DeleteBtn onClick={() => setImportRestr(p => p.filter((_, j) => j !== i))} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </div>
            </div>
          )}

          {/* ── Logistik & Verpackung ─────────────────────────────────────────── */}
          {tab === 'logistik' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <SectionLabel>Verpackungsspezifikation</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {([
                    { k: 'bagType',    label: 'Verpackungstyp',         ph: 'z.B. Jutesack, GrainPro, Vakuum', full: true },
                    { k: 'fillWeight', label: 'Füllgewicht / Gebindegröße', ph: 'z.B. 60 kg' },
                    { k: 'palletizing',label: 'Palettierung',            ph: 'z.B. 50 Säcke = 3 MT/Palette', full: true },
                    { k: 'fcl20',      label: "20' FCL Beladung",        ph: 'z.B. 275 Säcke = 16,5 MT' },
                    { k: 'fcl40',      label: "40' FCL Beladung",        ph: 'z.B. 550 Säcke = 33 MT' },
                  ] as { k: keyof ProductPackaging; label: string; ph: string; full?: boolean }[]).map(({ k, label, ph, full }) => (
                    <div key={k} style={full ? { gridColumn: '1 / -1' } : {}}>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>{label}</div>
                      <input type="text" value={pkgSpec[k]} onChange={e => setPkgSpec(p => ({ ...p, [k]: e.target.value }))} placeholder={ph} style={inputStyle} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <SectionLabel>Lager- & Transportkonditionen</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {([
                    { k: 'tempRange',  label: 'Temperatur',                  ph: 'z.B. 15–25°C' },
                    { k: 'humidity',   label: 'Luftfeuchtigkeit',             ph: 'z.B. max. 65% rF' },
                    { k: 'shelfLife',  label: 'Haltbarkeit ab Verpackungsdatum', ph: 'z.B. 18 Monate' },
                    { k: 'notes',      label: 'Lagerhinweise',                ph: 'z.B. dunkel lagern, nicht neben Gewürzen', full: true },
                  ] as { k: keyof ProductStorage; label: string; ph: string; full?: boolean }[]).map(({ k, label, ph, full }) => (
                    <div key={k} style={full ? { gridColumn: '1 / -1' } : {}}>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>{label}</div>
                      <input type="text" value={storage[k]} onChange={e => setStorage(p => ({ ...p, [k]: e.target.value }))} placeholder={ph} style={inputStyle} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Herkunft & Beschaffung ────────────────────────────────────────── */}
          {tab === 'herkunft' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <SectionLabel>Erntesaison / Verfügbarkeit</SectionLabel>
                <input type="text" value={harvestSeason} onChange={e => setHarvestSeason(e.target.value)} placeholder="z.B. Oktober – März (Haupternte)" style={inputStyle} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <SectionLabel>Herkunftsregionen / Anbaugebiete</SectionLabel>
                  <div style={{ flex: 1 }} />
                  <button className="btn sm" onClick={() => setOriginRegions(p => [...p, emptyOrigin()])}>
                    <Ic name="plus" size={11} /> Hinzufügen
                  </button>
                </div>
                {originRegions.length === 0
                  ? <div className="tx3" style={{ fontSize: 11.5 }}>Noch keine Herkunftsregionen gepflegt.</div>
                  : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          {['Land', 'Region / Gebiet', 'Anteil', ''].map(h => <th key={h} style={thStyle}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {originRegions.map((r, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '5px 4px' }}>
                              <input type="text" value={r.country} onChange={e => updOrigin(i, 'country', e.target.value)} placeholder="z.B. TZ" style={{ ...cellInput, width: 60 }} />
                            </td>
                            <td style={{ padding: '5px 4px' }}>
                              <input type="text" value={r.region} onChange={e => updOrigin(i, 'region', e.target.value)} placeholder="z.B. Kilimanjaro, Moshi" style={cellInput} />
                            </td>
                            <td style={{ padding: '5px 4px' }}>
                              <input type="text" value={r.share} onChange={e => updOrigin(i, 'share', e.target.value)} placeholder="z.B. 60%" style={{ ...cellInput, width: 70 }} />
                            </td>
                            <td style={{ padding: '5px 4px', textAlign: 'right' }}>
                              <DeleteBtn onClick={() => setOriginRegions(p => p.filter((_, j) => j !== i))} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </div>
              <div>
                <SectionLabel>Verknüpfte Lieferanten</SectionLabel>
                {!M || M.suppliers.length === 0
                  ? <div className="tx3" style={{ fontSize: 11.5 }}>Keine Lieferanten im System.</div>
                  : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
                      {M.suppliers.map(s => (
                        <label key={s.id} style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6,
                          cursor: 'pointer', transition: 'all 0.15s',
                          background: linkedSupplierIds.includes(s.id) ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${linkedSupplierIds.includes(s.id) ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.05)'}`,
                        }}>
                          <input type="checkbox" checked={linkedSupplierIds.includes(s.id)} onChange={() => toggleSupplier(s.id)} style={{ accentColor: '#60a5fa' }} />
                          <span style={{ fontSize: 12.5, fontWeight: linkedSupplierIds.includes(s.id) ? 600 : 400 }}>{s.name}</span>
                          <span className="tx3 mono" style={{ fontSize: 10.5, marginLeft: 4 }}>{s.country}</span>
                          <span style={{ marginLeft: 'auto' }}><Badge kind={s.tier === 'A' ? 'success' : s.tier === 'B' ? 'neutral' : 'warning'}>{s.tier}</Badge></span>
                        </label>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* ── Preise & Konditionen ──────────────────────────────────────────── */}
          {tab === 'preise' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <SectionLabel>Standard Incoterms</SectionLabel>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {INCOTERM_OPTIONS.map(it => (
                    <span
                      key={it}
                      className={`chip${defaultIncoterms.includes(it) ? ' on' : ''}`}
                      onClick={() => toggleIncoterm(it)}
                      style={{ cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                    >
                      {it}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <SectionLabel>Preisliste je Zielmarkt</SectionLabel>
                  <div style={{ flex: 1 }} />
                  <button className="btn sm" onClick={() => setMarketPrices(p => [...p, emptyMktPrice()])}>
                    <Ic name="plus" size={11} /> Hinzufügen
                  </button>
                </div>
                {marketPrices.length === 0
                  ? <div className="tx3" style={{ fontSize: 11.5 }}>Noch keine Marktpreise gepflegt.</div>
                  : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          {['Markt / Land', 'Preis', 'Währung', 'Incoterm', 'Gültig bis', ''].map(h => <th key={h} style={thStyle}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {marketPrices.map((mp, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '5px 4px' }}>
                              <input type="text" value={mp.market} onChange={e => updMktPrice(i, 'market', e.target.value)} placeholder="z.B. DE, NL" style={{ ...cellInput, width: 90 }} />
                            </td>
                            <td style={{ padding: '5px 4px' }}>
                              <input type="text" value={mp.price} onChange={e => updMktPrice(i, 'price', e.target.value)} placeholder="4.20" style={{ ...cellInput, width: 70 }} />
                            </td>
                            <td style={{ padding: '5px 4px' }}>
                              <select value={mp.currency} onChange={e => updMktPrice(i, 'currency', e.target.value)} style={{ ...cellInput, width: 70, cursor: 'pointer' }}>
                                {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </td>
                            <td style={{ padding: '5px 4px' }}>
                              <select value={mp.incoterm} onChange={e => updMktPrice(i, 'incoterm', e.target.value)} style={{ ...cellInput, width: 75, cursor: 'pointer' }}>
                                {INCOTERM_OPTIONS.map(it => <option key={it} value={it}>{it}</option>)}
                              </select>
                            </td>
                            <td style={{ padding: '5px 4px' }}>
                              <input type="date" value={mp.validUntil} onChange={e => updMktPrice(i, 'validUntil', e.target.value)} style={{ ...cellInput, width: 130 }} />
                            </td>
                            <td style={{ padding: '5px 4px', textAlign: 'right' }}>
                              <DeleteBtn onClick={() => setMarketPrices(p => p.filter((_, j) => j !== i))} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </div>
            </div>
          )}

          {/* ── Pflichtdokumente ──────────────────────────────────────────────── */}
          {tab === 'dokumente' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="tx3" style={{ fontSize: 11.5 }}>
                Alle Dokumente, die für den Export dieses Produkts benötigt werden — je nach Zielmarkt.
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="tx3" style={{ fontSize: 11 }}>Schnell hinzufügen:</span>
                {DOC_TEMPLATES.filter(dt => !requiredDocs.some(d => d.docType === dt)).map(dt => (
                  <span
                    key={dt}
                    className="chip"
                    onClick={() => setRequiredDocs(p => [...p, { ...emptyDoc(), docType: dt }])}
                    style={{ cursor: 'pointer', fontSize: 11 }}
                  >
                    + {dt}
                  </span>
                ))}
              </div>
              {requiredDocs.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {['Dokumenttyp', 'Zielmärkte', 'Pflicht', 'Hinweis', ''].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {requiredDocs.map((d, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '5px 4px' }}>
                          <input type="text" list="doc-types" value={d.docType} onChange={e => updDoc(i, 'docType', e.target.value)} placeholder="Dokumenttyp" style={{ ...cellInput, width: 180 }} />
                        </td>
                        <td style={{ padding: '5px 4px' }}>
                          <input type="text" value={d.markets} onChange={e => updDoc(i, 'markets', e.target.value)} placeholder="z.B. EU, JP" style={{ ...cellInput, width: 80 }} />
                        </td>
                        <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                          <input type="checkbox" checked={d.mandatory} onChange={e => updDoc(i, 'mandatory', e.target.checked)} style={{ accentColor: '#60a5fa', width: 15, height: 15 }} />
                        </td>
                        <td style={{ padding: '5px 4px' }}>
                          <input type="text" value={d.notes} onChange={e => updDoc(i, 'notes', e.target.value)} placeholder="Hinweis..." style={cellInput} />
                        </td>
                        <td style={{ padding: '5px 4px', textAlign: 'right' }}>
                          <DeleteBtn onClick={() => setRequiredDocs(p => p.filter((_, j) => j !== i))} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setRequiredDocs(p => [...p, emptyDoc()])}>
                <Ic name="plus" size={12} /> Dokument hinzufügen
              </button>
              <datalist id="doc-types">
                {DOC_TEMPLATES.map(dt => <option key={dt} value={dt} />)}
              </datalist>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11.5, color: '#f87171' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose}>Abbrechen</button>
          <div style={{ flex: 1 }} />
          <button className="btn primary" onClick={handleSave} disabled={saving} style={{ minWidth: 120 }}>
            {saving
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 11, height: 11, border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Speichern…
                </span>
              : <><Ic name="check" size={13} /> Speichern</>
            }
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

// ── Products List ─────────────────────────────────────────────────────────────

interface ProductsListProps { lang: Lang; onOpen: (id: string) => void; }

export const ProductsList = ({ lang, onOpen }: ProductsListProps) => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const totalVariants = M.products.reduce((s, p) => s + p.variants.length, 0);

  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_products')}</h1>
        <div className="sub">{M.products.length} Produkte · {totalVariants} Varianten</div>
        <div className="right">
          <button className="btn primary" onClick={() => window.dispatchEvent(new CustomEvent('open-product-wizard'))}>
            <Ic name="plus" size={13} /> Neues Produkt
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {M.products.map(p => {
            const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
            const iconName = p.cat === 'Kaffee' ? 'coffee' : 'leaf';
            const eudrS = EUDR_STATUSES.find(s => s.key === p.eudrStatus);
            return (
              <div key={p.id} className="card" style={{ cursor: 'pointer' }} onClick={() => onOpen(p.id)}>
                <div className="card-head">
                  <Ic name={iconName} size={14} />
                  <span className="title">{p.name}</span>
                  <span className="meta">{p.cat}</span>
                  {!p.exportReady && <Badge kind="danger">nicht export</Badge>}
                  {eudrS && <Badge kind={eudrS.key === 'relevant' ? 'warning' : eudrS.key === 'nicht_relevant' ? 'success' : 'neutral'}>{eudrS.label}</Badge>}
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                    <div><div className="tx3" style={{ fontSize: 10 }}>HS-Code</div><div className="mono fw500" style={{ fontSize: 12 }}>{p.hs}</div></div>
                    <div><div className="tx3" style={{ fontSize: 10 }}>Ursprung</div><div className="mono" style={{ fontSize: 11 }}>{p.origin}</div></div>
                    <div><div className="tx3" style={{ fontSize: 10 }}>MOQ</div><div className="mono" style={{ fontSize: 11 }}>{p.moq}</div></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                    <div><div className="tx3" style={{ fontSize: 10 }}>EK</div><div className="mono fw500" style={{ fontSize: 12 }}>{p.buyPrice.toFixed(2)} €</div></div>
                    <div><div className="tx3" style={{ fontSize: 10 }}>VK</div><div className="mono fw500" style={{ fontSize: 12, color: '#34d399' }}>{p.sellPrice.toFixed(2)} €</div></div>
                    <div><div className="tx3" style={{ fontSize: 10 }}>Marge</div><div className="mono fw500" style={{ fontSize: 12, color: '#34d399' }}>{p.margin}%</div></div>
                  </div>
                  <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>
                    Varianten · {fmtKg(totalStock)} verfügbar
                  </div>
                  {p.variants.map((v, i) => (
                    <div key={i} className="row" style={{ padding: '4px 0', fontSize: 11.5, borderBottom: i < p.variants.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span>{v.v}</span>
                      <Badge kind="neutral">{v.grade}</Badge>
                      <span className="mono tx2" style={{ marginLeft: 'auto' }}>{fmtNum(v.stock)} {p.unit}</span>
                    </div>
                  ))}
                  <div className="sep" />
                  <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                    {p.certs.map((c, i) => <Badge key={i} kind="ocean">{c}</Badge>)}
                  </div>
                  <div className="row tx3" style={{ fontSize: 10.5, marginTop: 8 }}>
                    <span>{p.buyers} Käufer interessiert</span>
                    <span style={{ marginLeft: 'auto' }}>{p.suppliers} Lieferanten</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Product Detail ────────────────────────────────────────────────────────────

interface ProductDetailProps { id: string; lang: Lang; onBack: () => void; }

// cert expiry helpers
const certStatus = (validUntil: string): 'ok' | 'soon' | 'expired' | 'unknown' => {
  if (!validUntil) return 'unknown';
  const diff = (new Date(validUntil).getTime() - Date.now()) / 86400000;
  if (diff < 0) return 'expired';
  if (diff < 90) return 'soon';
  return 'ok';
};
const certStatusBadge = (s: ReturnType<typeof certStatus>) => ({
  ok: { kind: 'success' as const, label: 'Gültig' },
  soon: { kind: 'warning' as const, label: 'Bald abgelaufen' },
  expired: { kind: 'danger' as const, label: 'Abgelaufen' },
  unknown: { kind: 'neutral' as const, label: '—' },
}[s]);

export const ProductDetail = ({ id, lang, onBack }: ProductDetailProps) => {
  const { data: M, refresh } = useData();
  const [editOpen, setEditOpen]           = useState(false);
  const [editInitTab, setEditInitTab]     = useState<EditTab>('grunddaten');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [deleteError, setDeleteError]     = useState<string | null>(null);

  const openEdit = (tab: EditTab = 'grunddaten') => { setEditInitTab(tab); setEditOpen(true); };

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const p = M.products.find(x => x.id === id);
  if (!p) return <div className="empty">Produkt nicht gefunden</div>;

  const totalStock       = p.variants.reduce((s, v) => s + v.stock, 0);
  const buyersForProduct = M.buyers.filter(b =>
    b.interests.some(i => i.toLowerCase().includes(p.name.split(' ')[0].toLowerCase()))
  );
  const qcRows   = (p.qualSpec && p.qualSpec.length > 0) ? p.qualSpec : getQcRows(p.cat);
  const iconName = p.cat === 'Kaffee' ? 'coffee' : 'leaf';
  const eudrS    = EUDR_STATUSES.find(s => s.key === p.eudrStatus);
  const linkedSuppliers = M.suppliers.filter(s => p.linkedSupplierIds?.includes(s.id));

  const handleDelete = async () => {
    setDeleting(true); setDeleteError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { error: sbErr } = await createClient().from('products').delete().eq('id', p.id);
      if (sbErr) throw new Error(sbErr.message);
      refresh(); onBack();
    } catch (e) {
      setDeleteError((e as Error).message);
      setDeleting(false);
    }
  };

  const EditCardBtn = ({ tab, label }: { tab: EditTab; label?: string }) => (
    <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={() => openEdit(tab)}>
      <Ic name="edit" size={12} /> {label ?? 'Bearbeiten'}
    </button>
  );

  return (
    <div>
      <div className="section-head">
        <button className="btn ghost" onClick={onBack} style={{ padding: 4 }}>
          <Ic name="chevL" size={14} /> {t(lang, 'back')}
        </button>
        <h1 style={{ margin: 0, fontSize: 18 }}>{p.name}</h1>
        <Badge kind="neutral">{p.cat}</Badge>
        <Badge kind="info" dot>HS {p.hs}</Badge>
        {eudrS && <Badge kind={eudrS.key === 'relevant' ? 'warning' : eudrS.key === 'nicht_relevant' ? 'success' : 'neutral'} dot>{eudrS.label}</Badge>}
        {p.exportReady
          ? <Badge kind="success" dot>Export-ready</Badge>
          : <Badge kind="danger" dot>blockiert</Badge>}
        <div className="right">
          <button className="btn" onClick={() => window.print()}><Ic name="download" size={13} /> Datenblatt PDF</button>
          <button className="btn" onClick={() => openEdit('grunddaten')}><Ic name="edit" size={13} /> Bearbeiten</button>
          <button className="btn" style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }} onClick={() => setDeleteConfirm(true)}>
            <Ic name="trash" size={13} /> Löschen
          </button>
          <button className="btn primary" onClick={() => window.dispatchEvent(new CustomEvent('open-wizard', { detail: { productId: p.id } }))}>
            <Ic name="star" size={13} /> Angebot erstellen
          </button>
        </div>
      </div>

      {deleteConfirm && (
        <div style={{ margin: '0 16px 12px', padding: '12px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#f87171' }}>
            Produkt &quot;{p.name}&quot; ({p.id}) dauerhaft löschen?
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 10 }}>
            Diese Aktion kann nicht rückgängig gemacht werden.
          </div>
          {deleteError && <div style={{ fontSize: 11, color: '#f87171', marginBottom: 8 }}>{deleteError}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }} onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Löschen…' : <><Ic name="trash" size={12} /> Ja, löschen</>}
            </button>
            <button className="btn ghost" onClick={() => { setDeleteConfirm(false); setDeleteError(null); }}>Abbrechen</button>
          </div>
        </div>
      )}

      <div className="detail-grid">
        {/* ── LEFT ── */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Spezifikation */}
          <div className="card">
            <div className="card-head">
              <Ic name="info" size={14} /><span className="title">Spezifikation</span>
              <EditCardBtn tab="grunddaten" />
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="fields">
                  <div className="l">HS-Code</div><div className="v mono fw500">{p.hs || '—'}</div>
                  <div className="l">Ursprung</div><div className="v">{p.origin || '—'}</div>
                  <div className="l">Einheit</div><div className="v">{p.unit}</div>
                  <div className="l">Verpackung</div><div className="v">{p.packaging || '—'}</div>
                  <div className="l">MOQ</div><div className="v">{p.moq || '—'}</div>
                </div>
                <div className="fields">
                  <div className="l">Einkaufspreis</div>
                  <div className="v mono fw500">{p.buyPrice.toFixed(2)} €/{p.unit}</div>
                  <div className="l">Verkaufspreis</div>
                  <div className="v mono fw500" style={{ color: '#34d399' }}>{p.sellPrice.toFixed(2)} €/{p.unit}</div>
                  <div className="l">Zielmarge</div>
                  <div className="v mono fw500" style={{ color: '#34d399' }}>{p.margin}%</div>
                  <div className="l">EU-Status</div>
                  <div className="v">
                    <Badge kind={p.exportReady ? 'success' : 'danger'}>
                      {p.exportReady ? 'EU-konform' : 'blockiert'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Zoll & Regulatorik */}
          <div className="card">
            <div className="card-head">
              <Ic name="shield" size={14} /><span className="title">Zoll & Regulatorik</span>
              <EditCardBtn tab="zoll" />
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* EUDR */}
              <div>
                <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>EUDR-Status</div>
                {eudrS
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Badge kind={eudrS.key === 'relevant' ? 'warning' : eudrS.key === 'nicht_relevant' ? 'success' : 'neutral'}>{eudrS.label}</Badge>
                      {p.eudrCategory && <span className="tx2" style={{ fontSize: 11.5 }}>{p.eudrCategory}</span>}
                    </div>
                  : <span className="tx3" style={{ fontSize: 11.5 }}>Nicht gepflegt</span>}
              </div>
              {/* Certs */}
              {(p.productCerts && p.productCerts.length > 0) && (
                <div>
                  <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>Zertifizierungen</div>
                  <table className="table">
                    <thead>
                      <tr><th>Zertifikat</th><th>Aussteller</th><th>Zert.-Nr.</th><th>Gültig bis</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {p.productCerts.map((c, i) => {
                        const cs = certStatus(c.validUntil);
                        const csb = certStatusBadge(cs);
                        return (
                          <tr key={i}>
                            <td className="fw500">{c.name}</td>
                            <td className="tx2">{c.issuer || '—'}</td>
                            <td className="mono tx2" style={{ fontSize: 11 }}>{c.certNo || '—'}</td>
                            <td className="mono">{c.validUntil ? new Date(c.validUntil).toLocaleDateString('de-DE') : '—'}</td>
                            <td><Badge kind={csb.kind}>{csb.label}</Badge></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Import restrictions */}
              {(p.importRestrictions && p.importRestrictions.length > 0) && (
                <div>
                  <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>Einfuhranforderungen</div>
                  <table className="table">
                    <thead>
                      <tr><th>Land</th><th>Anforderung</th><th>Pflicht</th></tr>
                    </thead>
                    <tbody>
                      {p.importRestrictions.map((r, i) => (
                        <tr key={i}>
                          <td className="mono fw500">{r.country}</td>
                          <td>{r.requirement}</td>
                          <td>{r.mandatory ? <Badge kind="danger">Pflicht</Badge> : <Badge kind="neutral">Optional</Badge>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!eudrS && (!p.productCerts || p.productCerts.length === 0) && (!p.importRestrictions || p.importRestrictions.length === 0) && (
                <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
                  Noch keine regulatorischen Daten gepflegt.
                </div>
              )}
            </div>
          </div>

          {/* Logistik & Verpackung */}
          <div className="card">
            <div className="card-head">
              <Ic name="box" size={14} /><span className="title">Logistik & Verpackung</span>
              <EditCardBtn tab="logistik" />
            </div>
            <div className="card-body">
              {(p.packagingSpec && Object.values(p.packagingSpec).some(v => v)) || (p.storageConditions && Object.values(p.storageConditions).some(v => v)) ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {p.packagingSpec && Object.values(p.packagingSpec).some(v => v) && (
                    <div className="fields">
                      <div className="l" style={{ gridColumn: '1 / -1', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 2 }}>Verpackung</div>
                      {p.packagingSpec.bagType    && <><div className="l">Typ</div><div className="v">{p.packagingSpec.bagType}</div></>}
                      {p.packagingSpec.fillWeight && <><div className="l">Füllgewicht</div><div className="v mono">{p.packagingSpec.fillWeight}</div></>}
                      {p.packagingSpec.palletizing && <><div className="l">Palette</div><div className="v">{p.packagingSpec.palletizing}</div></>}
                      {p.packagingSpec.fcl20      && <><div className="l">20&apos; FCL</div><div className="v mono">{p.packagingSpec.fcl20}</div></>}
                      {p.packagingSpec.fcl40      && <><div className="l">40&apos; FCL</div><div className="v mono">{p.packagingSpec.fcl40}</div></>}
                    </div>
                  )}
                  {p.storageConditions && Object.values(p.storageConditions).some(v => v) && (
                    <div className="fields">
                      <div className="l" style={{ gridColumn: '1 / -1', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 2 }}>Lagerung</div>
                      {p.storageConditions.tempRange  && <><div className="l">Temperatur</div><div className="v mono">{p.storageConditions.tempRange}</div></>}
                      {p.storageConditions.humidity   && <><div className="l">Luftfeuchte</div><div className="v mono">{p.storageConditions.humidity}</div></>}
                      {p.storageConditions.shelfLife  && <><div className="l">Haltbarkeit</div><div className="v">{p.storageConditions.shelfLife}</div></>}
                      {p.storageConditions.notes      && <><div className="l">Hinweis</div><div className="v tx2" style={{ fontSize: 11 }}>{p.storageConditions.notes}</div></>}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
                  Noch keine Logistikdaten gepflegt.
                </div>
              )}
            </div>
          </div>

          {/* Varianten */}
          <div className="card">
            <div className="card-head">
              <Ic name="layers" size={14} />
              <span className="title">Varianten</span>
              <span className="meta">{fmtKg(totalStock)} verfügbar</span>
              <EditCardBtn tab="varianten" />
            </div>
            {p.variants.length > 0
              ? (
                <table className="table">
                  <thead>
                    <tr><th>Variante</th><th>Grade</th><th className="num">Bestand</th><th>EU-Status</th></tr>
                  </thead>
                  <tbody>
                    {p.variants.map((v, i) => (
                      <tr key={i}>
                        <td className="fw500">{v.v}</td>
                        <td><Badge kind="neutral">{v.grade}</Badge></td>
                        <td className="num fw500">{fmtNum(v.stock)} {p.unit}</td>
                        <td><Badge kind="success">OK</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
              : <div className="empty">Noch keine Varianten gepflegt.</div>}
          </div>

          {/* Qualitäts-Spezifikation */}
          <div className="card">
            <div className="card-head">
              <Ic name="quality" size={14} />
              <span className="title">Qualitäts-Spezifikation</span>
              <EditCardBtn tab="qualitaet" />
            </div>
            <div className="card-body">
              <table className="table">
                <thead>
                  <tr><th>Parameter</th><th>Min</th><th>Ziel</th><th>Max</th><th>EU-Grenzwert</th></tr>
                </thead>
                <tbody>
                  {qcRows.map((row, i) => (
                    <tr key={i}>
                      <td className="fw500">{row.p}</td>
                      <td className="mono">{row.min}</td>
                      <td className="mono fw500" style={{ color: '#34d399' }}>{row.tgt}</td>
                      <td className="mono">{row.max}</td>
                      <td className="mono tx2" style={{ fontSize: 11 }}>{row.eu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Image + quick certs */}
          <div className="card">
            <div style={{
              aspectRatio: '4/3',
              background: 'repeating-linear-gradient(45deg, #131927, #131927 8px, #0e131f 8px, #0e131f 16px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', borderRadius: '10px 10px 0 0',
            }}>
              <Ic name={iconName} size={40} color="#3b82f6" />
              <div className="tx3 mono" style={{ marginTop: 8, fontSize: 10 }}>PRODUCT_IMAGE_{p.id}</div>
            </div>
            <div className="card-body">
              <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Zertifikate</div>
              <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                {p.certs.length > 0
                  ? p.certs.map((c, i) => <Badge key={i} kind="ocean">{c}</Badge>)
                  : <span className="tx3" style={{ fontSize: 11 }}>Keine Zertifikate</span>}
              </div>
            </div>
          </div>

          {/* Herkunft & Beschaffung */}
          <div className="card">
            <div className="card-head">
              <Ic name="map" size={14} /><span className="title">Herkunft & Beschaffung</span>
              <EditCardBtn tab="herkunft" />
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {p.harvestSeason && (
                <div>
                  <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Erntesaison</div>
                  <div style={{ fontSize: 12.5 }}>{p.harvestSeason}</div>
                </div>
              )}
              {(p.originRegions && p.originRegions.length > 0) && (
                <div>
                  <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>Herkunftsregionen</div>
                  <table className="table">
                    <thead><tr><th>Land</th><th>Region</th><th>Anteil</th></tr></thead>
                    <tbody>
                      {p.originRegions.map((r, i) => (
                        <tr key={i}>
                          <td className="mono fw500">{r.country}</td>
                          <td>{r.region}</td>
                          <td className="mono">{r.share}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {linkedSuppliers.length > 0 && (
                <div>
                  <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>Verknüpfte Lieferanten</div>
                  {linkedSuppliers.map(s => (
                    <div key={s.id} className="row" style={{ padding: '5px 0', borderBottom: '1px solid var(--border)', gap: 8 }}>
                      <span className="mono tx3" style={{ fontSize: 10.5, width: 24 }}>{s.country}</span>
                      <span className="fw500" style={{ fontSize: 12 }}>{s.name}</span>
                      <span style={{ marginLeft: 'auto' }}><Badge kind={s.tier === 'A' ? 'success' : s.tier === 'B' ? 'neutral' : 'warning'}>{s.tier}</Badge></span>
                    </div>
                  ))}
                </div>
              )}
              {!p.harvestSeason && (!p.originRegions || p.originRegions.length === 0) && linkedSuppliers.length === 0 && (
                <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
                  Noch keine Herkunftsdaten gepflegt.
                </div>
              )}
            </div>
          </div>

          {/* Preise je Markt */}
          <div className="card">
            <div className="card-head">
              <Ic name="finance" size={14} /><span className="title">Preise je Markt</span>
              <EditCardBtn tab="preise" />
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(p.defaultIncoterms && p.defaultIncoterms.length > 0) && (
                <div>
                  <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>Standard Incoterms</div>
                  <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                    {p.defaultIncoterms.map(it => (
                      <span key={it} className="chip on" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{it}</span>
                    ))}
                  </div>
                </div>
              )}
              {(p.marketPrices && p.marketPrices.length > 0)
                ? (
                  <table className="table">
                    <thead>
                      <tr><th>Markt</th><th className="num">Preis</th><th>Incoterm</th><th>Gültig bis</th></tr>
                    </thead>
                    <tbody>
                      {p.marketPrices.map((mp, i) => (
                        <tr key={i}>
                          <td className="fw500">{mp.market}</td>
                          <td className="num mono fw500">{mp.price} {mp.currency}/{p.unit}</td>
                          <td><Badge kind="info">{mp.incoterm}</Badge></td>
                          <td className="tx2 mono" style={{ fontSize: 11 }}>
                            {mp.validUntil ? new Date(mp.validUntil).toLocaleDateString('de-DE') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
                : (!p.defaultIncoterms || p.defaultIncoterms.length === 0) && (
                  <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
                    Noch keine Marktpreise gepflegt.
                  </div>
                )}
            </div>
          </div>

          {/* Pflichtdokumente */}
          <div className="card">
            <div className="card-head">
              <Ic name="doc" size={14} /><span className="title">Pflichtdokumente</span>
              <EditCardBtn tab="dokumente" />
            </div>
            <div className="card-body">
              {(p.requiredDocs && p.requiredDocs.length > 0)
                ? (
                  <table className="table">
                    <thead>
                      <tr><th>Dokument</th><th>Märkte</th><th>Art</th><th>Hinweis</th></tr>
                    </thead>
                    <tbody>
                      {p.requiredDocs.map((d, i) => (
                        <tr key={i}>
                          <td className="fw500">{d.docType}</td>
                          <td className="mono tx2" style={{ fontSize: 11 }}>{d.markets}</td>
                          <td>{d.mandatory ? <Badge kind="danger">Pflicht</Badge> : <Badge kind="neutral">Optional</Badge>}</td>
                          <td className="tx2" style={{ fontSize: 11 }}>{d.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
                : (
                  <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
                    Noch keine Pflichtdokumente gepflegt.
                  </div>
                )}
            </div>
          </div>

          {/* Passende Käufer */}
          <div className="card">
            <div className="card-head">
              <Ic name="buyer" size={14} />
              <span className="title">Passende Käufer</span>
              <span className="meta">{buyersForProduct.length}</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {buyersForProduct.length === 0
                ? <div className="empty">Noch keine Käufer verknüpft</div>
                : buyersForProduct.map(b => (
                  <div key={b.id} className="row" style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', gap: 8 }}>
                    <span className="mono" style={{ fontSize: 11, width: 24 }}>{b.country}</span>
                    <div style={{ flex: 1 }}>
                      <div className="fw500" style={{ fontSize: 12 }}>{b.name.split(' ').slice(0, 3).join(' ')}</div>
                      <div className="tx3" style={{ fontSize: 10.5 }}>{b.industry}</div>
                    </div>
                    <Stars value={b.rating} />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {editOpen && (
        <EditModal
          product={p}
          initialTab={editInitTab}
          onClose={() => setEditOpen(false)}
          onSaved={() => setEditOpen(false)}
        />
      )}
    </div>
  );
};

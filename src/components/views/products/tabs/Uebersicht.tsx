'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/primitives';
import type { Product } from '@/lib/types';
import { useData } from '@/lib/data-context';
import type { ProductMaster, ProductStatus } from '../types';
import { PRODUCT_TYPES, STATUS_MAP, calcReadinessScore } from '../types';
import {
  SectionCard, FormField, FormGrid, FieldRow, BoolBadge, SaveError,
  inputStyle, textareaStyle, useSectionSave,
} from '../shared';

const UNITS = ['kg', 't', 'Stk', 'L'];
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];

interface TabProps { product: Product; master: ProductMaster; onSaved: () => void; }

// ── Export Readiness Score widget ─────────────────────────────────────────────

const ReadinessScore = ({ product, master }: { product: Product; master: ProductMaster }) => {
  const score = calcReadinessScore(master);
  const color  = score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';
  const label  = score >= 80 ? 'Export-ready' : score >= 50 ? 'In Arbeit' : 'Unvollständig';

  // per-section completeness
  const sections = [
    { name: 'Grunddaten',    done: !!(product.name && master.productType && master.descShort) },
    { name: 'Zoll',          done: !!(product.hs && master.cnCode && master.sanctionsCheck) },
    { name: 'Ursprung',      done: !!(product.origin && master.nonPrefOrigin) },
    { name: 'Spezifikation', done: !!(master.weightNet && master.qualityStandard) },
    { name: 'Verpackung',    done: !!(master.outerCarton && master.container20) },
    { name: 'Preise',        done: !!(master.targetSellPrice && master.marginPct) },
    { name: 'Incoterms',     done: !!(product.defaultIncoterms && product.defaultIncoterms.length > 0) },
    { name: 'Dokumente',     done: !!(product.requiredDocs && product.requiredDocs.length > 0) },
    { name: 'Compliance',    done: master.eudrCompliance !== undefined },
    { name: 'Qualität',      done: !!(product.qualSpec && product.qualSpec.length > 0) },
  ];

  return (
    <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ position: 'relative', width: 56, height: 56 }}>
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
            <circle cx="28" cy="28" r="22" fill="none" stroke={color} strokeWidth="5"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - score / 100)}`}
              strokeLinecap="round" transform="rotate(-90 28 28)" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color }}>
            {score}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Export Readiness</div>
          <Badge kind={score >= 80 ? 'success' : score >= 50 ? 'warning' : 'danger'}>{label}</Badge>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
        {sections.map(s => (
          <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5 }}>
            <span style={{ color: s.done ? '#34d399' : '#94a3b8', fontSize: 12 }}>
              {s.done ? '✓' : '○'}
            </span>
            <span className="tx3">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Tab component ─────────────────────────────────────────────────────────────

export const TabUebersicht = ({ product, master, onSaved }: TabProps) => {
  const { refresh } = useData();
  const { save, saving, error } = useSectionSave(product.id, () => { refresh(); onSaved(); });

  // ── Grunddaten edit state ──────────────────────────────────────────────────
  const [editGrund, setEditGrund] = useState(false);
  const [form, setForm] = useState({
    name:          product.name,
    nameInvoice:   master.nameInvoice    ?? '',
    descShort:     master.descShort      ?? '',
    descLong:      master.descLong       ?? '',
    brand:         master.brand          ?? '',
    manufacturer:  master.manufacturer   ?? '',
    skuInternal:   master.skuInternal    ?? product.hs ?? '',
    ean:           master.ean            ?? '',
    productType:   master.productType    ?? '',
    productStatus: (master.productStatus ?? 'active') as ProductStatus,
    hs:            product.hs,
    unit:          product.unit,
    internalNotes: master.internalNotes  ?? '',
    exportReady:   product.exportReady,
  });
  const set = (k: keyof typeof form, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const handleSaveGrund = async () => {
    await save(
      {
        nameInvoice: form.nameInvoice, descShort: form.descShort, descLong: form.descLong,
        brand: form.brand, manufacturer: form.manufacturer, skuInternal: form.skuInternal,
        ean: form.ean, productType: form.productType, productStatus: form.productStatus,
        internalNotes: form.internalNotes,
      },
      {
        name: form.name, hs: form.hs, unit: form.unit, export_ready: form.exportReady,
        product_type: form.productType, product_status: form.productStatus,
      }
    );
    setEditGrund(false);
  };

  // ── Preisübersicht edit state ─────────────────────────────────────────────
  const [editPreis, setEditPreis] = useState(false);
  const [preis, setPreis] = useState({
    buyPrice:  product.buyPrice,
    sellPrice: product.sellPrice,
    moq:       product.moq,
    currency:  master.currency ?? 'EUR',
  });
  const setP = (k: keyof typeof preis, v: string | number) => setPreis(p => ({ ...p, [k]: v }));

  const handleSavePreis = async () => {
    const margin = preis.sellPrice > 0
      ? Math.round((preis.sellPrice - preis.buyPrice) / preis.sellPrice * 100) : 0;
    await save({ currency: preis.currency }, {
      buy_price: preis.buyPrice, sell_price: preis.sellPrice,
      margin, moq: preis.moq,
    });
    setEditPreis(false);
  };

  const statusInfo = STATUS_MAP[form.productStatus] ?? STATUS_MAP['active'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Readiness Score */}
      <ReadinessScore product={product} master={master} />

      {/* Grunddaten */}
      <SectionCard
        icon="info" title="Grunddaten"
        editMode={editGrund}
        onEdit={() => setEditGrund(true)}
        onSave={handleSaveGrund}
        onCancel={() => setEditGrund(false)}
        saving={saving}
      >
        {editGrund ? (
          <>
            <FormGrid>
              <FormField label="Produktname (intern) *">
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle} autoFocus />
              </FormField>
              <FormField label="Name auf Exportdokumenten / Rechnung">
                <input type="text" value={form.nameInvoice} onChange={e => set('nameInvoice', e.target.value)} placeholder="z.B. ARABICA COFFEE GREEN BEANS" style={inputStyle} />
              </FormField>
              <FormField label="Produktart">
                <select value={form.productType} onChange={e => set('productType', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">— Bitte wählen —</option>
                  {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="Status">
                <select value={form.productStatus} onChange={e => set('productStatus', e.target.value as ProductStatus)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="draft">Entwurf</option>
                  <option value="active">Aktiv</option>
                  <option value="blocked">Gesperrt</option>
                  <option value="discontinued">Auslaufend</option>
                </select>
              </FormField>
              <FormField label="Kurzbeschreibung" full>
                <input type="text" value={form.descShort} onChange={e => set('descShort', e.target.value)} placeholder="max. 160 Zeichen" style={inputStyle} maxLength={160} />
              </FormField>
              <FormField label="Produktbeschreibung (lang)" full>
                <textarea value={form.descLong} onChange={e => set('descLong', e.target.value)} style={textareaStyle} placeholder="Ausführliche Produktbeschreibung für Datenblatt und Katalog..." />
              </FormField>
              <FormField label="Marke / Brand">
                <input type="text" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="z.B. Kibo Peaks" style={inputStyle} />
              </FormField>
              <FormField label="Hersteller / Produzent">
                <input type="text" value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} placeholder="z.B. Kilimanjaro Cooperative" style={inputStyle} />
              </FormField>
              <FormField label="Artikelnummer / SKU">
                <input type="text" value={form.skuInternal} onChange={e => set('skuInternal', e.target.value)} placeholder="z.B. KAF-001-WA" style={inputStyle} />
              </FormField>
              <FormField label="EAN / GTIN / Barcode">
                <input type="text" value={form.ean} onChange={e => set('ean', e.target.value)} placeholder="z.B. 4001234567890" style={inputStyle} />
              </FormField>
              <FormField label="HS-Code">
                <input type="text" value={form.hs} onChange={e => set('hs', e.target.value)} placeholder="z.B. 0901.11" style={inputStyle} />
              </FormField>
              <FormField label="Einheit">
                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  {UNITS.map(u => (
                    <span key={u} className={`chip${form.unit === u ? ' on' : ''}`} onClick={() => set('unit', u)} style={{ cursor: 'pointer' }}>{u}</span>
                  ))}
                </div>
              </FormField>
              <FormField label="Exportstatus">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={form.exportReady} onChange={e => set('exportReady', e.target.checked)} style={{ accentColor: '#60a5fa', width: 15, height: 15 }} />
                  Export-ready
                </label>
              </FormField>
              <FormField label="Interne Notizen" full>
                <textarea value={form.internalNotes} onChange={e => set('internalNotes', e.target.value)} style={textareaStyle} placeholder="Nur intern sichtbar — Hinweise, offene Punkte..." />
              </FormField>
            </FormGrid>
            <SaveError error={error} />
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="fields">
              <FieldRow label="Name intern"        value={product.name} />
              <FieldRow label="Name Exportdok."    value={master.nameInvoice} />
              <FieldRow label="Produktart"         value={master.productType} />
              <FieldRow label="Marke"              value={master.brand} />
              <FieldRow label="Hersteller"         value={master.manufacturer} />
              <FieldRow label="SKU"                value={master.skuInternal} mono />
              <FieldRow label="EAN"                value={master.ean} mono />
            </div>
            <div className="fields">
              <FieldRow label="HS-Code"   value={product.hs} mono />
              <FieldRow label="Einheit"   value={product.unit} />
              <div className="l">Status</div>
              <div className="v"><Badge kind={statusInfo.kind as string}>{statusInfo.label}</Badge></div>
              <div className="l">Export</div>
              <div className="v"><BoolBadge value={product.exportReady} trueLabel="Export-ready" falseLabel="Nicht bereit" /></div>
            </div>
            {master.descShort && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="l">Kurzbeschreibung</div>
                <div className="v tx2" style={{ fontSize: 12, marginTop: 2 }}>{master.descShort}</div>
              </div>
            )}
            {master.descLong && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="l">Langbeschreibung</div>
                <div className="v tx2" style={{ fontSize: 11.5, marginTop: 2, whiteSpace: 'pre-wrap' }}>{master.descLong}</div>
              </div>
            )}
            {master.internalNotes && (
              <div style={{ gridColumn: '1 / -1', padding: '8px 10px', borderRadius: 6, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
                <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 3 }}>Interne Notiz</div>
                <div className="tx2" style={{ fontSize: 12 }}>{master.internalNotes}</div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* Preisübersicht */}
      <SectionCard
        icon="finance" title="Preisübersicht"
        editMode={editPreis}
        onEdit={() => setEditPreis(true)}
        onSave={handleSavePreis}
        onCancel={() => setEditPreis(false)}
        saving={saving}
      >
        {editPreis ? (
          <>
            <FormGrid>
              <FormField label="Einkaufspreis">
                <input type="number" min={0} step={0.01} value={preis.buyPrice || ''} onChange={e => setP('buyPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" style={inputStyle} />
              </FormField>
              <FormField label="Verkaufspreis">
                <input type="number" min={0} step={0.01} value={preis.sellPrice || ''} onChange={e => setP('sellPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" style={inputStyle} />
              </FormField>
              <FormField label="MOQ">
                <input type="text" value={preis.moq} onChange={e => setP('moq', e.target.value)} placeholder="z.B. 1000 kg" style={inputStyle} />
              </FormField>
              <FormField label="Währung">
                <select value={preis.currency} onChange={e => setP('currency', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
            </FormGrid>
            {preis.sellPrice > 0 && (
              <div style={{ marginTop: 10, padding: '7px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', fontSize: 12.5 }}>
                <span className="tx3">Marge: </span>
                <span className="mono fw500" style={{ color: '#34d399' }}>
                  {Math.round((preis.sellPrice - preis.buyPrice) / preis.sellPrice * 100)}%
                </span>
              </div>
            )}
            <SaveError error={error} />
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Einkaufspreis', value: `${product.buyPrice.toFixed(2)} ${master.currency ?? 'EUR'}/${product.unit}` },
              { label: 'Verkaufspreis', value: `${product.sellPrice.toFixed(2)} ${master.currency ?? 'EUR'}/${product.unit}`, green: true },
              { label: 'Marge',         value: `${product.margin}%`, green: true },
              { label: 'MOQ',           value: product.moq },
            ].map(({ label, value, green }) => (
              <div key={label}>
                <div className="tx3" style={{ fontSize: 10 }}>{label}</div>
                <div className="mono fw500" style={{ fontSize: 14, color: green ? '#34d399' : 'var(--text)' }}>{value || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

    </div>
  );
};

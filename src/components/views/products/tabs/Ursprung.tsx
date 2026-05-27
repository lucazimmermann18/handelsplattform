'use client';
import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Ic } from '@/components/ui/icons';
import type { Product } from '@/lib/types';
import type { ProductMaster } from '../types';
import {
  SectionCard, FormField, FormGrid, FieldRow, SaveError,
  inputStyle, textareaStyle, labelStyle, useSectionSave, BoolBadge,
} from '../shared';

interface TabProps {
  product: Product;
  master: ProductMaster;
  onSaved: () => void;
}

// ── Tab: Ursprung & Lieferkette ───────────────────────────────────────────────

export const TabUrsprung = ({ product, master, onSaved }: TabProps) => {
  const { data, refresh } = useData();
  const { save, saving, error, setError } = useSectionSave(product.id, () => { refresh(); onSaved(); });

  const suppliers = data?.suppliers ?? [];

  // ── Section 1: Produktionsursprung ────────────────────────────────────────
  const [editProd, setEditProd] = useState(false);
  const [productionCountry,   setProductionCountry]   = useState(master.productionCountry   ?? '');
  const [manufacturerAddress, setManufacturerAddress] = useState(master.manufacturerAddress ?? '');
  const [farmCooperative,     setFarmCooperative]     = useState(master.farmCooperative     ?? '');
  const [batchOrigin,         setBatchOrigin]         = useState(master.batchOrigin         ?? '');

  const saveProd = async () => {
    await save({ productionCountry, manufacturerAddress, farmCooperative, batchOrigin });
    if (!error) setEditProd(false);
  };

  // ── Section 2: Ursprungsklassifizierung ───────────────────────────────────
  const [editClass, setEditClass] = useState(false);
  const [nonPrefOrigin, setNonPrefOrigin] = useState(master.nonPrefOrigin ?? '');
  const [prefOrigin,    setPrefOrigin]    = useState(master.prefOrigin    ?? '');

  const saveClass = async () => {
    await save({ nonPrefOrigin, prefOrigin });
    if (!error) setEditClass(false);
  };

  // ── Section 3: Dokumente & Nachweise ─────────────────────────────────────
  const [editDocs, setEditDocs] = useState(false);
  const [supplierDeclaration, setSupplierDeclaration] = useState(master.supplierDeclaration ?? false);
  const [cooRequired,         setCooRequired]         = useState(master.cooRequired         ?? false);
  const [traceabilityNotes,   setTraceabilityNotes]   = useState(master.traceabilityNotes   ?? '');

  const saveDocs = async () => {
    await save({ supplierDeclaration, cooRequired, traceabilityNotes });
    if (!error) setEditDocs(false);
  };

  // ── Linked suppliers resolved ─────────────────────────────────────────────
  const linkedSuppliers = (product.linkedSupplierIds ?? [])
    .map(id => suppliers.find(s => s.id === id))
    .filter(Boolean);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Ursprungsland read-only from product */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.15)', fontSize: 12.5 }}>
        <Ic name="map-pin" size={13} color="#34d399" />
        <span className="tx3">Ursprungsland (Produktstamm):</span>
        <span className="fw500" style={{ color: '#34d399', marginLeft: 4 }}>{product.origin || '—'}</span>
        <span className="tx3" style={{ marginLeft: 4 }}>{'· Wird im Tab „Übersicht“ gepflegt.'}</span>
      </div>

      {/* ── Produktionsursprung ──────────────────────────────────────────────── */}
      <SectionCard
        icon="map"
        title="Produktionsursprung"
        editMode={editProd}
        onEdit={() => { setError(null); setEditProd(true); }}
        onSave={saveProd}
        onCancel={() => setEditProd(false)}
        saving={saving}
        empty={!master.productionCountry && !master.manufacturerAddress && !master.farmCooperative && !master.batchOrigin}
        emptyText="Produktionsursprung noch nicht gepflegt."
      >
        {editProd ? (
          <>
            <FormGrid cols={2}>
              <FormField label="Produktionsland">
                <input value={productionCountry} onChange={e => setProductionCountry(e.target.value)}
                  placeholder="z. B. Äthiopien" style={inputStyle} />
              </FormField>
              <FormField label="Farm / Kooperative / Plantage">
                <input value={farmCooperative} onChange={e => setFarmCooperative(e.target.value)}
                  placeholder="z. B. Yirgacheffe Farmers Cooperative" style={inputStyle} />
              </FormField>
              <FormField label="Chargenherkunft">
                <input value={batchOrigin} onChange={e => setBatchOrigin(e.target.value)}
                  placeholder="z. B. Ernte 2024, Region Sidama" style={inputStyle} />
              </FormField>
              <FormField label="Herstelleradresse" full>
                <textarea value={manufacturerAddress} onChange={e => setManufacturerAddress(e.target.value)}
                  placeholder="Vollständige Adresse des Herstellers / der Farm" style={textareaStyle} />
              </FormField>
            </FormGrid>
            <SaveError error={error} />
          </>
        ) : (
          <div className="fields">
            <FieldRow label="Produktionsland"           value={master.productionCountry} />
            <FieldRow label="Farm / Kooperative"        value={master.farmCooperative} />
            <FieldRow label="Chargenherkunft"           value={master.batchOrigin} />
            <FieldRow label="Herstelleradresse"         value={master.manufacturerAddress} />
          </div>
        )}
      </SectionCard>

      {/* ── Ursprungsklassifizierung ─────────────────────────────────────────── */}
      <SectionCard
        icon="flag"
        title="Ursprungsklassifizierung"
        editMode={editClass}
        onEdit={() => { setError(null); setEditClass(true); }}
        onSave={saveClass}
        onCancel={() => setEditClass(false)}
        saving={saving}
        empty={!master.nonPrefOrigin && !master.prefOrigin}
        emptyText="Nichtpräferenzieller und präferenzieller Ursprung noch nicht gepflegt."
      >
        {editClass ? (
          <>
            <FormGrid cols={1}>
              <FormField label="Nichtpräferenzieller Ursprung">
                <textarea value={nonPrefOrigin} onChange={e => setNonPrefOrigin(e.target.value)}
                  placeholder="z. B. Ursprungsland gemäß Ursprungszeugnis (Form A, EUR.1)…" style={textareaStyle} />
              </FormField>
              <FormField label="Präferenzieller Ursprung">
                <textarea value={prefOrigin} onChange={e => setPrefOrigin(e.target.value)}
                  placeholder="z. B. Ursprung gemäß EPA / EBA Präferenzabkommen…" style={textareaStyle} />
              </FormField>
            </FormGrid>
            <SaveError error={error} />
          </>
        ) : (
          <div className="fields">
            <FieldRow label="Nichtpräferenzieller Ursprung" value={master.nonPrefOrigin} />
            <FieldRow label="Präferenzieller Ursprung"      value={master.prefOrigin} />
          </div>
        )}
      </SectionCard>

      {/* ── Dokumente & Rückverfolgbarkeit ───────────────────────────────────── */}
      <SectionCard
        icon="file-check"
        title="Dokumente & Rückverfolgbarkeit"
        editMode={editDocs}
        onEdit={() => { setError(null); setEditDocs(true); }}
        onSave={saveDocs}
        onCancel={() => setEditDocs(false)}
        saving={saving}
      >
        {editDocs ? (
          <>
            <FormGrid cols={2}>
              <div>
                <label style={labelStyle}>Lieferantenerklärung vorhanden</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={supplierDeclaration} onChange={e => setSupplierDeclaration(e.target.checked)} style={{ accentColor: '#60a5fa', width: 15, height: 15 }} />
                  Lieferantenerklärung liegt vor
                </label>
              </div>
              <div>
                <label style={labelStyle}>Ursprungszeugnis (CoO) erforderlich</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={cooRequired} onChange={e => setCooRequired(e.target.checked)} style={{ accentColor: '#60a5fa', width: 15, height: 15 }} />
                  Ursprungszeugnis ist Pflicht
                </label>
              </div>
              <FormField label="Nachweise zur Rückverfolgbarkeit" full>
                <textarea value={traceabilityNotes} onChange={e => setTraceabilityNotes(e.target.value)}
                  placeholder="z. B. Lot-Nummer, Audit-Trails, Chain-of-Custody-Zertifikate…" style={textareaStyle} />
              </FormField>
            </FormGrid>
            <SaveError error={error} />
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                <span className="tx3">Lieferantenerklärung:</span>
                <BoolBadge value={master.supplierDeclaration} trueLabel="Vorhanden" falseLabel="Fehlt" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                <span className="tx3">Ursprungszeugnis erforderlich:</span>
                <BoolBadge value={master.cooRequired} trueLabel="Ja" falseLabel="Nein" />
              </div>
            </div>
            {master.traceabilityNotes && (
              <div>
                <div style={{ ...labelStyle, marginBottom: 2 }}>Nachweise zur Rückverfolgbarkeit</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 }}>{master.traceabilityNotes}</div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── Verknüpfte Lieferanten ───────────────────────────────────────────── */}
      <SectionCard
        icon="users"
        title="Verknüpfte Lieferanten"
        badge={linkedSuppliers.length > 0 ? `${linkedSuppliers.length}` : undefined}
        empty={linkedSuppliers.length === 0}
        emptyText="Keine Lieferanten mit diesem Produkt verknüpft."
      >
        {linkedSuppliers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {linkedSuppliers.map(s => s && (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Ic name="building" size={13} color="var(--text-3)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="fw500" style={{ fontSize: 13 }}>{s.name}</div>
                  <div className="tx3" style={{ fontSize: 11.5 }}>{s.country}{s.city ? ` · ${s.city}` : ''}{s.type ? ` · ${s.type}` : ''}</div>
                </div>
                <span className={`chip${s.tier === 'A' ? ' on' : ''}`} style={{ fontSize: 11 }}>Tier {s.tier}</span>
                <span style={{ fontSize: 11.5, color: s.risk === 'niedrig' ? '#34d399' : s.risk === 'mittel' ? '#fbbf24' : '#f87171', fontWeight: 600 }}>
                  {s.risk === 'niedrig' ? 'Niedriges Risiko' : s.risk === 'mittel' ? 'Mittleres Risiko' : 'Hohes Risiko'}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

    </div>
  );
};

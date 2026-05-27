'use client';
import React, { useState } from 'react';
import { Ic } from '@/components/ui/icons';
import type { Product } from '@/lib/types';
import type { ProductMaster, LabelReq } from '../types';
import { SectionCard, FormField, FormGrid, DeleteBtn, FieldRow, SaveError, inputStyle, cellInput, textareaStyle, thStyle, useSectionSave } from '../shared';

interface TabProps { product: Product; master: ProductMaster; onSaved: () => void; }

export const TabVerpackung = ({ product, master, onSaved }: TabProps) => {
  const { save, saving, error, setError } = useSectionSave(product.id, onSaved);

  const [editPack, setEditPack] = useState(false);
  const [singlePackaging, setSingle]   = useState(master.singlePackaging ?? '');
  const [innerPackaging, setInner]     = useState(master.innerPackaging ?? '');
  const [outerCarton, setOuter]        = useState(master.outerCarton ?? '');
  const [palletDimensions, setPallet]  = useState(master.palletDimensions ?? '');
  const [packagingMaterial, setMat]    = useState(master.packagingMaterial ?? '');
  const [packagingWeight, setWeight]   = useState(master.packagingWeight ?? '');
  const [recyclingInfo, setRecycling]  = useState(master.recyclingInfo ?? '');

  const [editQty, setEditQty] = useState(false);
  const [piecesPerCarton, setPPC]    = useState(master.piecesPerCarton ?? '');
  const [cartonsPerPallet, setCPP]   = useState(master.cartonsPerPallet ?? '');
  const [piecesPerPallet, setPPP]    = useState(master.piecesPerPallet ?? '');
  const [container20, setC20]        = useState(master.container20 ?? '');
  const [container40, setC40]        = useState(master.container40 ?? '');
  const [container40hc, setC40hc]    = useState(master.container40hc ?? '');

  const [editLabel, setEditLabel] = useState(false);
  const [labelLanguages, setLangStr]  = useState(master.labelLanguages ?? '');
  const [minLabeling, setMinLabel]    = useState(master.minLabeling ?? '');
  const [labelingReqs, setLabelReqs]  = useState<LabelReq[]>(master.labelingReqs ?? []);

  const cancelPack = () => {
    setSingle(master.singlePackaging ?? ''); setInner(master.innerPackaging ?? '');
    setOuter(master.outerCarton ?? ''); setPallet(master.palletDimensions ?? '');
    setMat(master.packagingMaterial ?? ''); setWeight(master.packagingWeight ?? '');
    setRecycling(master.recyclingInfo ?? ''); setEditPack(false); setError(null);
  };
  const cancelQty = () => {
    setPPC(master.piecesPerCarton ?? ''); setCPP(master.cartonsPerPallet ?? '');
    setPPP(master.piecesPerPallet ?? ''); setC20(master.container20 ?? '');
    setC40(master.container40 ?? ''); setC40hc(master.container40hc ?? '');
    setEditQty(false); setError(null);
  };
  const cancelLabel = () => {
    setLangStr(master.labelLanguages ?? ''); setMinLabel(master.minLabeling ?? '');
    setLabelReqs(master.labelingReqs ?? []); setEditLabel(false); setError(null);
  };

  const savePack = async () => {
    await save({ singlePackaging, innerPackaging, outerCarton, palletDimensions, packagingMaterial, packagingWeight, recyclingInfo });
    setEditPack(false);
  };
  const saveQty = async () => {
    await save({ piecesPerCarton, cartonsPerPallet, piecesPerPallet, container20, container40, container40hc });
    setEditQty(false);
  };
  const saveLabel = async () => {
    await save({ labelLanguages, minLabeling, labelingReqs });
    setEditLabel(false);
  };

  const addLabelReq = () => setLabelReqs(r => [...r, { country: '', requirement: '' }]);
  const updateLabelReq = (i: number, field: keyof LabelReq, val: string) =>
    setLabelReqs(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));
  const removeLabelReq = (i: number) => setLabelReqs(r => r.filter((_, idx) => idx !== i));

  const packEmpty = !master.singlePackaging && !master.innerPackaging && !master.outerCarton;
  const qtyEmpty  = !master.piecesPerCarton && !master.container20 && !master.container40;
  const labelEmpty = !master.labelLanguages && !master.minLabeling && (!master.labelingReqs || master.labelingReqs.length === 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {(product.packagingSpec || product.storageConditions) && (
        <SectionCard icon="archive" title="Verpackung & Lagerung (Altdaten)" badge="Nur Anzeige">
          {product.packagingSpec && (
            <div className="fields" style={{ marginBottom: product.storageConditions ? 12 : 0 }}>
              <FieldRow label="Beuteltyp" value={product.packagingSpec.bagType} />
              <FieldRow label="Füllgewicht" value={product.packagingSpec.fillWeight} />
              <FieldRow label="Palettierung" value={product.packagingSpec.palletizing} />
              <FieldRow label="20ft FCL" value={product.packagingSpec.fcl20} />
              <FieldRow label="40ft FCL" value={product.packagingSpec.fcl40} />
            </div>
          )}
          {product.storageConditions && (
            <div className="fields">
              <FieldRow label="Temperaturbereich" value={product.storageConditions.tempRange} />
              <FieldRow label="Luftfeuchtigkeit" value={product.storageConditions.humidity} />
              <FieldRow label="Haltbarkeit" value={product.storageConditions.shelfLife} />
              <FieldRow label="Lagerhinweise" value={product.storageConditions.notes} />
            </div>
          )}
        </SectionCard>
      )}

      <SectionCard
        icon="box" title="Verpackungseinheiten"
        onEdit={() => setEditPack(true)} editMode={editPack}
        onSave={savePack} onCancel={cancelPack} saving={saving}
        empty={packEmpty} emptyText="Verpackungseinheiten noch nicht gepflegt."
      >
        {editPack ? (
          <>
            <FormGrid cols={2}>
              <FormField label="Einzelverpackung">
                <input style={inputStyle} value={singlePackaging} onChange={e => setSingle(e.target.value)} />
              </FormField>
              <FormField label="Innenverpackung">
                <input style={inputStyle} value={innerPackaging} onChange={e => setInner(e.target.value)} />
              </FormField>
              <FormField label="Umkarton">
                <input style={inputStyle} value={outerCarton} onChange={e => setOuter(e.target.value)} />
              </FormField>
              <FormField label="Palettenmaß">
                <input style={inputStyle} value={palletDimensions} onChange={e => setPallet(e.target.value)} />
              </FormField>
              <FormField label="Verpackungsmaterial">
                <input style={inputStyle} value={packagingMaterial} onChange={e => setMat(e.target.value)} />
              </FormField>
              <FormField label="Verpackungsgewicht">
                <input style={inputStyle} value={packagingWeight} onChange={e => setWeight(e.target.value)} />
              </FormField>
              <FormField label="Recyclingangaben" full>
                <textarea style={textareaStyle} value={recyclingInfo} onChange={e => setRecycling(e.target.value)} />
              </FormField>
            </FormGrid>
            <SaveError error={error} />
          </>
        ) : (
          <div className="fields">
            <FieldRow label="Einzelverpackung" value={master.singlePackaging} />
            <FieldRow label="Innenverpackung" value={master.innerPackaging} />
            <FieldRow label="Umkarton" value={master.outerCarton} />
            <FieldRow label="Palettenmaß" value={master.palletDimensions} />
            <FieldRow label="Verpackungsmaterial" value={master.packagingMaterial} />
            <FieldRow label="Verpackungsgewicht" value={master.packagingWeight} />
            <FieldRow label="Recyclingangaben" value={master.recyclingInfo} />
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon="grid" title="Mengenstruktur & Container"
        onEdit={() => setEditQty(true)} editMode={editQty}
        onSave={saveQty} onCancel={cancelQty} saving={saving}
        empty={qtyEmpty} emptyText="Mengenstruktur noch nicht gepflegt."
      >
        {editQty ? (
          <>
            <FormGrid cols={3}>
              <FormField label="Stück pro Karton">
                <input style={inputStyle} value={piecesPerCarton} onChange={e => setPPC(e.target.value)} />
              </FormField>
              <FormField label="Kartons pro Palette">
                <input style={inputStyle} value={cartonsPerPallet} onChange={e => setCPP(e.target.value)} />
              </FormField>
              <FormField label="Stück pro Palette">
                <input style={inputStyle} value={piecesPerPallet} onChange={e => setPPP(e.target.value)} />
              </FormField>
              <FormField label="20ft FCL Kapazität">
                <input style={inputStyle} value={container20} onChange={e => setC20(e.target.value)} />
              </FormField>
              <FormField label="40ft FCL Kapazität">
                <input style={inputStyle} value={container40} onChange={e => setC40(e.target.value)} />
              </FormField>
              <FormField label="40ft HC FCL Kapazität">
                <input style={inputStyle} value={container40hc} onChange={e => setC40hc(e.target.value)} />
              </FormField>
            </FormGrid>
            <SaveError error={error} />
          </>
        ) : (
          <div className="fields">
            <FieldRow label="Stück pro Karton" value={master.piecesPerCarton} />
            <FieldRow label="Kartons pro Palette" value={master.cartonsPerPallet} />
            <FieldRow label="Stück pro Palette" value={master.piecesPerPallet} />
            <FieldRow label="20ft FCL" value={master.container20} />
            <FieldRow label="40ft FCL" value={master.container40} />
            <FieldRow label="40ft HC FCL" value={master.container40hc} />
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon="tag" title="Etikettierung & Kennzeichnung"
        onEdit={() => setEditLabel(true)} editMode={editLabel}
        onSave={saveLabel} onCancel={cancelLabel} saving={saving}
        empty={labelEmpty} emptyText="Etikettierungsangaben noch nicht gepflegt."
      >
        {editLabel ? (
          <>
            <FormGrid cols={2}>
              <FormField label="Sprachen auf Etikett">
                <input style={inputStyle} value={labelLanguages} onChange={e => setLangStr(e.target.value)} placeholder="z.B. DE, EN, FR" />
              </FormField>
              <FormField label="Mindestkennzeichnung je Zielland" full>
                <textarea style={textareaStyle} value={minLabeling} onChange={e => setMinLabel(e.target.value)} />
              </FormField>
            </FormGrid>
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Länderspezifische Anforderungen</span>
                <button className="btn sm ghost" onClick={addLabelReq}><Ic name="plus" size={11} /> Hinzufügen</button>
              </div>
              {labelingReqs.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: '28%' }}>Land</th>
                      <th style={thStyle}>Anforderung</th>
                      <th style={{ ...thStyle, width: 36 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {labelingReqs.map((row, i) => (
                      <tr key={i}>
                        <td style={{ padding: '3px 4px 3px 0' }}>
                          <input style={cellInput} value={row.country} onChange={e => updateLabelReq(i, 'country', e.target.value)} placeholder="Land" />
                        </td>
                        <td style={{ padding: '3px 4px' }}>
                          <input style={cellInput} value={row.requirement} onChange={e => updateLabelReq(i, 'requirement', e.target.value)} placeholder="Anforderung" />
                        </td>
                        <td style={{ padding: '3px 0 3px 4px' }}><DeleteBtn onClick={() => removeLabelReq(i)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <SaveError error={error} />
          </>
        ) : (
          <>
            <div className="fields">
              <FieldRow label="Etikett-Sprachen" value={master.labelLanguages} />
              <FieldRow label="Mindestkennzeichnung" value={master.minLabeling} />
            </div>
            {master.labelingReqs && master.labelingReqs.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Länderspezifische Anforderungen</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: '28%' }}>Land</th>
                      <th style={thStyle}>Anforderung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {master.labelingReqs.map((row, i) => (
                      <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '5px 8px 5px 0', fontSize: 12 }}>{row.country}</td>
                        <td style={{ padding: '5px 0', fontSize: 12 }}>{row.requirement}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </SectionCard>

    </div>
  );
};

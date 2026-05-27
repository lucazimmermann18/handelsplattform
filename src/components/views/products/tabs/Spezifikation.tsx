'use client';
import React, { useState } from 'react';
import type { Product } from '@/lib/types';
import type { ProductMaster } from '../types';
import { SectionCard, FormField, FormGrid, BoolBadge, FieldRow, SaveError, inputStyle, textareaStyle, useSectionSave } from '../shared';

interface TabProps { product: Product; master: ProductMaster; onSaved: () => void; }

export const TabSpezifikation = ({ product, master, onSaved }: TabProps) => {
  const { save, saving, error, setError } = useSectionSave(product.id, onSaved);

  const [editMat, setEditMat] = useState(false);
  const [materials, setMaterials]     = useState(master.materials ?? '');
  const [ingredients, setIngredients] = useState(master.ingredients ?? '');
  const [variety, setVariety]         = useState(master.variety ?? '');
  const [processing, setProcessing]   = useState(master.processing ?? '');
  const [color, setColor]             = useState(master.color ?? '');

  const [editPhys, setEditPhys] = useState(false);
  const [dimensions, setDimensions]   = useState(master.dimensions ?? '');
  const [weightNet, setWeightNet]     = useState(master.weightNet ?? '');
  const [weightGross, setWeightGross] = useState(master.weightGross ?? '');
  const [volume, setVolume]           = useState(master.volume ?? '');
  const [density, setDensity]         = useState(master.density ?? '');

  const [editSafe, setEditSafe] = useState(false);
  const [allergens, setAllergens]         = useState(master.allergens ?? '');
  const [hasSds, setHasSds]               = useState(master.hasSds ?? false);
  const [qualityStandard, setQualityStd]  = useState(master.qualityStandard ?? '');
  const [hazardClass, setHazardClass]     = useState(master.hazardClass ?? '');

  const cancelMat = () => {
    setMaterials(master.materials ?? ''); setIngredients(master.ingredients ?? '');
    setVariety(master.variety ?? ''); setProcessing(master.processing ?? '');
    setColor(master.color ?? ''); setEditMat(false); setError(null);
  };
  const cancelPhys = () => {
    setDimensions(master.dimensions ?? ''); setWeightNet(master.weightNet ?? '');
    setWeightGross(master.weightGross ?? ''); setVolume(master.volume ?? '');
    setDensity(master.density ?? ''); setEditPhys(false); setError(null);
  };
  const cancelSafe = () => {
    setAllergens(master.allergens ?? ''); setHasSds(master.hasSds ?? false);
    setQualityStd(master.qualityStandard ?? ''); setHazardClass(master.hazardClass ?? '');
    setEditSafe(false); setError(null);
  };

  const saveMat = async () => {
    await save({ materials, ingredients, variety, processing, color });
    setEditMat(false);
  };
  const savePhys = async () => {
    await save({ dimensions, weightNet, weightGross, volume, density });
    setEditPhys(false);
  };
  const saveSafe = async () => {
    await save({ allergens, hasSds, qualityStandard, hazardClass });
    setEditSafe(false);
  };

  const matEmpty = !master.materials && !master.ingredients && !master.variety && !master.processing && !master.color;
  const physEmpty = !master.dimensions && !master.weightNet && !master.weightGross && !master.volume && !master.density;
  const safeEmpty = !master.allergens && master.hasSds === undefined && !master.qualityStandard && !master.hazardClass;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      <SectionCard
        icon="layers" title="Material & Zusammensetzung"
        onEdit={() => setEditMat(true)} editMode={editMat}
        onSave={saveMat} onCancel={cancelMat} saving={saving}
        empty={matEmpty} emptyText="Material und Zusammensetzung noch nicht gepflegt."
      >
        {editMat ? (
          <>
            <FormGrid cols={2}>
              <FormField label="Material / Inhaltsstoffe">
                <input style={inputStyle} value={materials} onChange={e => setMaterials(e.target.value)} />
              </FormField>
              <FormField label="Sorte">
                <input style={inputStyle} value={variety} onChange={e => setVariety(e.target.value)} />
              </FormField>
              <FormField label="Verarbeitung (z.B. Washed, Natural)">
                <input style={inputStyle} value={processing} onChange={e => setProcessing(e.target.value)} />
              </FormField>
              <FormField label="Farbe">
                <input style={inputStyle} value={color} onChange={e => setColor(e.target.value)} />
              </FormField>
              <FormField label="Inhaltsstoffe (Lebensmittel)" full>
                <textarea style={textareaStyle} value={ingredients} onChange={e => setIngredients(e.target.value)} />
              </FormField>
            </FormGrid>
            <SaveError error={error} />
          </>
        ) : (
          <div className="fields">
            <FieldRow label="Material" value={master.materials} />
            <FieldRow label="Inhaltsstoffe" value={master.ingredients} />
            <FieldRow label="Sorte" value={master.variety} />
            <FieldRow label="Verarbeitung" value={master.processing} />
            <FieldRow label="Farbe" value={master.color} />
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon="ruler" title="Physikalische Eigenschaften"
        onEdit={() => setEditPhys(true)} editMode={editPhys}
        onSave={savePhys} onCancel={cancelPhys} saving={saving}
        empty={physEmpty} emptyText="Physikalische Eigenschaften noch nicht gepflegt."
      >
        {editPhys ? (
          <>
            <FormGrid cols={2}>
              <FormField label="Maße / Größe (z.B. 60x40x20 cm)">
                <input style={inputStyle} value={dimensions} onChange={e => setDimensions(e.target.value)} />
              </FormField>
              <FormField label="Gewicht netto">
                <input style={inputStyle} value={weightNet} onChange={e => setWeightNet(e.target.value)} />
              </FormField>
              <FormField label="Gewicht brutto">
                <input style={inputStyle} value={weightGross} onChange={e => setWeightGross(e.target.value)} />
              </FormField>
              <FormField label="Volumen">
                <input style={inputStyle} value={volume} onChange={e => setVolume(e.target.value)} />
              </FormField>
              <FormField label="Dichte">
                <input style={inputStyle} value={density} onChange={e => setDensity(e.target.value)} />
              </FormField>
            </FormGrid>
            <SaveError error={error} />
          </>
        ) : (
          <div className="fields">
            <FieldRow label="Maße / Größe" value={master.dimensions} />
            <FieldRow label="Gewicht netto" value={master.weightNet} />
            <FieldRow label="Gewicht brutto" value={master.weightGross} />
            <FieldRow label="Volumen" value={master.volume} />
            <FieldRow label="Dichte" value={master.density} />
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon="shield" title="Sicherheit & Qualität"
        onEdit={() => setEditSafe(true)} editMode={editSafe}
        onSave={saveSafe} onCancel={cancelSafe} saving={saving}
        empty={safeEmpty} emptyText="Sicherheits- und Qualitätsangaben noch nicht gepflegt."
      >
        {editSafe ? (
          <>
            <FormGrid cols={2}>
              <FormField label="Allergene (kommagetrennt)" full>
                <input style={inputStyle} value={allergens} onChange={e => setAllergens(e.target.value)} placeholder="z.B. Nüsse, Gluten, Soja" />
              </FormField>
              <FormField label="Qualitätsstandard (z.B. ISO 9001, SCA Specialty)">
                <input style={inputStyle} value={qualityStandard} onChange={e => setQualityStd(e.target.value)} />
              </FormField>
              <FormField label="Gefahrenklasse">
                <input style={inputStyle} value={hazardClass} onChange={e => setHazardClass(e.target.value)} />
              </FormField>
              <FormField label="Sicherheitsdatenblatt vorhanden" full>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, paddingTop: 4 }}>
                  <input type="checkbox" checked={hasSds} onChange={e => setHasSds(e.target.checked)} style={{ accentColor: '#60a5fa', width: 15, height: 15 }} />
                  Sicherheitsdatenblatt (SDS) liegt vor
                </label>
              </FormField>
            </FormGrid>
            <SaveError error={error} />
          </>
        ) : (
          <div className="fields">
            <FieldRow label="Allergene" value={master.allergens} />
            <FieldRow label="Qualitätsstandard" value={master.qualityStandard} />
            <FieldRow label="Gefahrenklasse" value={master.hazardClass} />
            {master.hasSds !== undefined && (
              <>
                <div className="l">Sicherheitsdatenblatt</div>
                <div className="v"><BoolBadge value={master.hasSds} trueLabel="Vorhanden" falseLabel="Nicht vorhanden" /></div>
              </>
            )}
          </div>
        )}
      </SectionCard>

    </div>
  );
};

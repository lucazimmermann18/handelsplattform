'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import type { Supplier } from '@/lib/types';
import type { SupplierMaster, LandOwnership } from '../types';
import {
  SectionCard, FormField, FormGrid, FieldRow, BoolBadge, CheckFlag,
  SaveError, inputStyle, textareaStyle, useSectionSave,
} from '../shared';

interface TabProps { supplier: Supplier; master: SupplierMaster; onSaved: () => void; }

const INFRA_FLAGS: { key: keyof SupplierMaster; label: string }[] = [
  { key: 'hasIrrigation', label: 'Bewässerung vorhanden' },
  { key: 'hasProcessing', label: 'Verarbeitung vor Ort' },
  { key: 'hasStorage',    label: 'Lager vorhanden' },
  { key: 'hasElectricity', label: 'Stromanschluss' },
  { key: 'hasInternet',   label: 'Internet-/Mobilzugang' },
  { key: 'hasTransport',  label: 'Eigene Transportmittel' },
];

export const TabFarmBetrieb = ({ supplier, master, onSaved }: TabProps) => {
  const { refresh } = useData();
  const { save, saving, error, setError } = useSectionSave(supplier.id, refresh);

  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<Partial<SupplierMaster>>({});

  const enter = () => {
    setForm({
      farmSize:           master.farmSize ?? '',
      plotCount:          master.plotCount ?? '',
      employees:          master.employees ?? '',
      familyBusiness:     master.familyBusiness,
      landOwnership:      master.landOwnership,
      crops:              master.crops ?? '',
      harvestSeason:      master.harvestSeason ?? '',
      annualCapacity:     master.annualCapacity ?? '',
      hasIrrigation:      master.hasIrrigation ?? false,
      hasProcessing:      master.hasProcessing ?? false,
      hasStorage:         master.hasStorage ?? false,
      hasElectricity:     master.hasElectricity ?? false,
      hasInternet:        master.hasInternet ?? false,
      hasTransport:       master.hasTransport ?? false,
      processingDescription: master.processingDescription ?? '',
      storageDescription:    master.storageDescription ?? '',
      infrastructureNotes:   master.infrastructureNotes ?? '',
    });
    setEdit(true); setError(null);
  };

  const cancel = () => { setEdit(false); setError(null); };

  const doSave = async () => {
    await save(form);
    setEdit(false);
    onSaved();
  };

  const set = (k: keyof SupplierMaster, v: string | boolean | undefined) =>
    setForm(f => ({ ...f, [k]: v }));

  const farmEmpty = !master.farmSize && !master.crops && !master.annualCapacity && !master.employees;
  const infraEmpty = !master.hasIrrigation && !master.hasProcessing && !master.hasStorage &&
    !master.hasElectricity && !master.hasInternet && !master.hasTransport;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Farm-Grunddaten */}
      <SectionCard
        icon="leaf" title="Farm & Betrieb"
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
        empty={farmEmpty} emptyText="Farm-Daten noch nicht gepflegt."
      >
        {edit ? (
          <FormGrid cols={2}>
            <FormField label="Farmgröße (z.B. 12 ha)">
              <input style={inputStyle} value={form.farmSize ?? ''} onChange={e => set('farmSize', e.target.value)} placeholder="z.B. 12,5 ha" />
            </FormField>
            <FormField label="Anzahl Plots / Felder">
              <input style={inputStyle} value={form.plotCount ?? ''} onChange={e => set('plotCount', e.target.value)} placeholder="z.B. 4" />
            </FormField>
            <FormField label="Mitarbeiter (Anzahl oder Spanne)">
              <input style={inputStyle} value={form.employees ?? ''} onChange={e => set('employees', e.target.value)} placeholder="z.B. 5–15 saisonal" />
            </FormField>
            <FormField label="Eigentum / Pacht">
              <select style={inputStyle} value={form.landOwnership ?? ''} onChange={e => set('landOwnership', e.target.value as LandOwnership || undefined)}>
                <option value="">— Auswählen —</option>
                <option value="Eigentum">Eigentum</option>
                <option value="Pacht">Pacht</option>
                <option value="Gemischt">Gemischt</option>
              </select>
            </FormField>
            <FormField label="Familienunternehmen">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', paddingTop: 4 }}>
                <input type="checkbox" checked={!!form.familyBusiness} onChange={e => set('familyBusiness', e.target.checked)} style={{ accentColor: '#60a5fa', width: 15, height: 15 }} />
                Ja, Familienbetrieb
              </label>
            </FormField>
            <FormField label="Angebaute Produkte & Sorten" full>
              <input style={inputStyle} value={form.crops ?? ''} onChange={e => set('crops', e.target.value)} placeholder="z.B. Arabica, Macadamia, Gewürznelken" />
            </FormField>
            <FormField label="Erntezeitraum">
              <input style={inputStyle} value={form.harvestSeason ?? ''} onChange={e => set('harvestSeason', e.target.value)} placeholder="z.B. Oktober–Dezember" />
            </FormField>
            <FormField label="Jahreskapazität (Schätzung)">
              <input style={inputStyle} value={form.annualCapacity ?? ''} onChange={e => set('annualCapacity', e.target.value)} placeholder="z.B. 20 t / Jahr" />
            </FormField>
            <SaveError error={error} />
          </FormGrid>
        ) : (
          <div className="fields">
            <FieldRow label="Farmgröße"      value={master.farmSize} />
            <FieldRow label="Anzahl Plots"   value={master.plotCount} />
            <FieldRow label="Mitarbeiter"    value={master.employees} />
            <FieldRow label="Eigentum"       value={master.landOwnership} />
            <div className="l">Familienbetrieb</div>
            <div className="v"><BoolBadge value={master.familyBusiness} /></div>
            <FieldRow label="Produkte / Sorten" value={master.crops} />
            <FieldRow label="Erntezeitraum"     value={master.harvestSeason} />
            <FieldRow label="Jahreskapazität"   value={master.annualCapacity} />
          </div>
        )}
      </SectionCard>

      {/* Infrastruktur */}
      <SectionCard
        icon="box" title="Infrastruktur"
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
        empty={infraEmpty} emptyText="Infrastruktur noch nicht erfasst."
      >
        {edit ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            {INFRA_FLAGS.map(({ key, label }) => (
              <CheckFlag
                key={key} label={label}
                value={!!(form[key] as boolean | undefined)}
                onChange={v => set(key, v)}
                editMode={edit}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            {INFRA_FLAGS.map(({ key, label }) => (
              <CheckFlag
                key={key} label={label}
                value={!!(master[key] as boolean | undefined)}
                onChange={() => {}}
                editMode={false}
              />
            ))}
          </div>
        )}
        <SaveError error={error} />
      </SectionCard>

      {/* Verarbeitung & Lager */}
      <SectionCard
        icon="layers" title="Verarbeitung & Lager"
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
        empty={!master.processingDescription && !master.storageDescription && !master.infrastructureNotes}
        emptyText="Verarbeitungs- und Lagerdaten noch nicht gepflegt."
      >
        {edit ? (
          <FormGrid cols={1}>
            <FormField label="Verarbeitung vor Ort (Beschreibung)">
              <textarea style={textareaStyle} value={form.processingDescription ?? ''} onChange={e => set('processingDescription', e.target.value)} placeholder="z.B. Nasswäsche, Trocknung auf erhöhten Betten, Sortierung nach Größe…" />
            </FormField>
            <FormField label="Lagerung (Beschreibung)">
              <textarea style={textareaStyle} value={form.storageDescription ?? ''} onChange={e => set('storageDescription', e.target.value)} placeholder="z.B. Trockenlager, Jutesäcke, max. 6 Monate…" />
            </FormField>
            <FormField label="Infrastruktur-Notizen">
              <textarea style={textareaStyle} value={form.infrastructureNotes ?? ''} onChange={e => set('infrastructureNotes', e.target.value)} placeholder="Besonderheiten, Herausforderungen, Verbesserungspotenzial…" />
            </FormField>
            <SaveError error={error} />
          </FormGrid>
        ) : (
          <div className="fields">
            <FieldRow label="Verarbeitung"  value={master.processingDescription} />
            <FieldRow label="Lagerung"       value={master.storageDescription} />
            <FieldRow label="Notizen"        value={master.infrastructureNotes} />
          </div>
        )}
      </SectionCard>

    </div>
  );
};

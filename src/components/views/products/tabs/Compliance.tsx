'use client';
import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Badge } from '@/components/ui/primitives';
import type { Product } from '@/lib/types';
import type { ProductMaster } from '../types';
import { SectionCard, FormField, FormGrid, FieldRow, CheckFlag, SaveError, inputStyle, textareaStyle, thStyle, labelStyle, useSectionSave } from '../shared';

interface TabProps { product: Product; master: ProductMaster; onSaved: () => void; }

const EUDR_LABEL: Record<string, string> = {
  relevant: 'Relevant', nicht_relevant: 'Nicht relevant', unklar: 'Unklar',
};
const EUDR_KIND: Record<string, string> = {
  relevant: 'danger', nicht_relevant: 'success', unklar: 'warning',
};

export function TabCompliance({ product, master, onSaved }: TabProps) {
  const { refresh } = useData();
  const { save: saveMaster, saving, error, setError } = useSectionSave(product.id, refresh);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<ProductMaster>>({});

  const enter = () => {
    setForm({
      ceRequired:        master.ceRequired,
      reachRelevant:     master.reachRelevant,
      rohsRelevant:      master.rohsRelevant,
      foodLawRelevant:   master.foodLawRelevant,
      bioRegulation:     master.bioRegulation,
      eudrCompliance:    master.eudrCompliance,
      productSafetyReqs: master.productSafetyReqs ?? '',
      ageRestriction:    master.ageRestriction ?? '',
      dangerousGoods:    master.dangerousGoods,
      exportControl:     master.exportControl,
      sanctionsRelevant: master.sanctionsRelevant,
      complianceNotes:   master.complianceNotes ?? '',
    });
    setEditMode(true);
    setError(null);
  };

  const cancel = () => { setEditMode(false); setError(null); };

  const save = async () => {
    await saveMaster(form);
    setEditMode(false);
    onSaved();
  };

  const setFlag = (key: keyof ProductMaster, v: boolean) => setForm(f => ({ ...f, [key]: v }));
  const setText = (key: keyof ProductMaster, v: string)  => setForm(f => ({ ...f, [key]: v }));

  const flags: { key: keyof ProductMaster; label: string }[] = [
    { key: 'ceRequired',      label: 'CE-Kennzeichnungspflicht' },
    { key: 'reachRelevant',   label: 'REACH-Verordnung' },
    { key: 'rohsRelevant',    label: 'RoHS-Richtlinie' },
    { key: 'foodLawRelevant', label: 'Lebensmittelrecht' },
    { key: 'bioRegulation',   label: 'Bio-Verordnung (EG 834/2007)' },
    { key: 'eudrCompliance',  label: 'EUDR-Konformität' },
    { key: 'dangerousGoods',  label: 'Gefahrgutrecht (ADR/IMDG)' },
    { key: 'exportControl',   label: 'Exportkontrolle (Dual-Use)' },
    { key: 'sanctionsRelevant', label: 'Sanktionslisten-Relevanz' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(product.eudrStatus || product.eudrCategory || (product.importRestrictions?.length ?? 0) > 0) && (
        <SectionCard icon="globe" title="Referenzdaten (Produkt)">
          <div className="kv-grid" style={{ fontSize: 12.5 }}>
            {product.eudrStatus && (
              <>
                <div className="l">EUDR-Status</div>
                <div className="v">
                  <Badge kind={EUDR_KIND[product.eudrStatus] ?? 'neutral'}>
                    {EUDR_LABEL[product.eudrStatus] ?? product.eudrStatus}
                  </Badge>
                </div>
              </>
            )}
            <FieldRow label="EUDR-Kategorie" value={product.eudrCategory} />
          </div>
          {(product.importRestrictions?.length ?? 0) > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ ...labelStyle, marginBottom: 6 }}>Einfuhrbeschränkungen</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: '25%' }}>Land</th>
                    <th style={thStyle}>Anforderung</th>
                    <th style={{ ...thStyle, width: '14%' }}>Pflicht</th>
                  </tr>
                </thead>
                <tbody>
                  {product.importRestrictions!.map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '4px 4px', fontSize: 12 }}>{r.country}</td>
                      <td style={{ padding: '4px 4px', fontSize: 12 }}>{r.requirement}</td>
                      <td style={{ padding: '4px 4px' }}>
                        <Badge kind={r.mandatory ? 'danger' : 'neutral'}>{r.mandatory ? 'Pflicht' : 'Optional'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      <SectionCard
        icon="shield"
        title="Compliance-Flags"
        editMode={editMode}
        onEdit={enter}
        onSave={save}
        onCancel={cancel}
        saving={saving}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0 24px' }}>
          {flags.map(({ key, label }) => (
            <CheckFlag
              key={key}
              label={label}
              value={editMode ? !!(form[key] as boolean | undefined) : !!(master[key] as boolean | undefined)}
              onChange={v => setFlag(key, v)}
              editMode={editMode}
            />
          ))}
        </div>
        <SaveError error={error} />
      </SectionCard>

      <SectionCard
        icon="file-text"
        title="Details & Anforderungen"
        editMode={editMode}
        onEdit={enter}
        onSave={save}
        onCancel={cancel}
        saving={saving}
      >
        {editMode ? (
          <FormGrid cols={2}>
            <FormField label="Produktsicherheitsanforderungen">
              <input
                style={inputStyle}
                value={form.productSafetyReqs ?? ''}
                onChange={e => setText('productSafetyReqs', e.target.value)}
                placeholder="z.B. EN 71, PSA-Verordnung…"
              />
            </FormField>
            <FormField label="Altersbeschränkungen">
              <input
                style={inputStyle}
                value={form.ageRestriction ?? ''}
                onChange={e => setText('ageRestriction', e.target.value)}
                placeholder="z.B. Ab 18 Jahren"
              />
            </FormField>
            <FormField label="Zielland-spezifische Anforderungen / Notizen" full>
              <textarea
                style={textareaStyle}
                value={form.complianceNotes ?? ''}
                onChange={e => setText('complianceNotes', e.target.value)}
                placeholder="Besondere Vorschriften, Zulassungen, Marktspezifika…"
              />
            </FormField>
          </FormGrid>
        ) : (
          <div className="kv-grid" style={{ fontSize: 12.5 }}>
            <FieldRow label="Produktsicherheit" value={master.productSafetyReqs} />
            <FieldRow label="Altersbeschränkungen" value={master.ageRestriction} />
            <FieldRow label="Notizen & Anforderungen" value={master.complianceNotes} />
            {!master.productSafetyReqs && !master.ageRestriction && !master.complianceNotes && (
              <div style={{ gridColumn: '1/-1', color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
                Noch keine Details gepflegt.
              </div>
            )}
          </div>
        )}
        <SaveError error={error} />
      </SectionCard>
    </div>
  );
}

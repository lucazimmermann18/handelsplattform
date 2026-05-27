'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Badge } from '@/components/ui/primitives';
import { Ic } from '@/components/ui/icons';
import type { Supplier } from '@/lib/types';
import type { SupplierMaster, TrustLevel } from '../types';
import { TRUST_LEVEL_MAP } from '../types';
import {
  SectionCard, FormField, FormGrid, FieldRow, BoolBadge,
  SaveError, inputStyle, textareaStyle, useSectionSave,
} from '../shared';

interface TabProps { supplier: Supplier; master: SupplierMaster; onSaved: () => void; }

export const TabVertrauen = ({ supplier, master, onSaved }: TabProps) => {
  const { refresh } = useData();
  const { save, saving, error, setError } = useSectionSave(supplier.id, refresh);

  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<Partial<SupplierMaster>>({});

  const enter = () => {
    setForm({
      trustLevel:           master.trustLevel,
      whatsappPreferred:    master.whatsappPreferred ?? false,
      preferredContactTime: master.preferredContactTime ?? '',
      languages:            master.languages ?? '',
      partnerSince:         master.partnerSince ?? '',
      visitFrequency:       master.visitFrequency ?? '',
      lastVisitDate:        master.lastVisitDate ?? '',
      strengthsNotes:       master.strengthsNotes ?? '',
      weaknessesNotes:      master.weaknessesNotes ?? '',
      culturalNotes:        master.culturalNotes ?? '',
      localReferences:      master.localReferences ?? '',
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

  const tl = edit ? (form.trustLevel as TrustLevel | undefined) : master.trustLevel;
  const tlInfo = tl ? TRUST_LEVEL_MAP[tl] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Vertrauensstufe */}
      <SectionCard
        icon="star" title="Vertrauensstufe & Beziehung"
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
      >
        {/* Trust Level Selector */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500 }}>VERTRAUENSSTUFE</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {(['hoch', 'mittel', 'niedrig', 'neu'] as TrustLevel[]).map(level => {
              const info = TRUST_LEVEL_MAP[level];
              const active = tl === level;
              return (
                <div
                  key={level}
                  onClick={() => edit && set('trustLevel', level)}
                  style={{
                    padding: '10px', borderRadius: 8, cursor: edit ? 'pointer' : 'default',
                    background: active ? `${info.color}15` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? `${info.color}50` : 'rgba(255,255,255,0.07)'}`,
                    textAlign: 'center', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 4 }}>
                    {level === 'hoch' ? '🟢' : level === 'mittel' ? '🟡' : level === 'niedrig' ? '🔴' : '⚪'}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: active ? info.color : 'var(--text-3)' }}>
                    {info.label}
                  </div>
                </div>
              );
            })}
          </div>
          {tlInfo && !edit && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Badge kind={tlInfo.kind}>{tlInfo.label}</Badge>
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12 }}>
          {edit ? (
            <FormGrid cols={2}>
              <FormField label="Partner seit">
                <input style={inputStyle} value={form.partnerSince ?? ''} onChange={e => set('partnerSince', e.target.value)} placeholder="z.B. 2021-03" />
              </FormField>
              <FormField label="Besuchsfrequenz">
                <input style={inputStyle} value={form.visitFrequency ?? ''} onChange={e => set('visitFrequency', e.target.value)} placeholder="z.B. 2× pro Jahr" />
              </FormField>
              <FormField label="Letzter Besuch">
                <input type="date" style={inputStyle} value={form.lastVisitDate ?? ''} onChange={e => set('lastVisitDate', e.target.value)} />
              </FormField>
              <FormField label="Sprachen">
                <input style={inputStyle} value={form.languages ?? ''} onChange={e => set('languages', e.target.value)} placeholder="z.B. Swahili, Englisch" />
              </FormField>
              <FormField label="WhatsApp bevorzugt">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', paddingTop: 6 }}>
                  <input type="checkbox" checked={!!form.whatsappPreferred} onChange={e => set('whatsappPreferred', e.target.checked)} style={{ accentColor: '#25d366', width: 15, height: 15 }} />
                  Kommunikation hauptsächlich über WhatsApp
                </label>
              </FormField>
              <FormField label="Beste Kontaktzeit">
                <input style={inputStyle} value={form.preferredContactTime ?? ''} onChange={e => set('preferredContactTime', e.target.value)} placeholder="z.B. Werktags 8–12 Uhr EAT" />
              </FormField>
            </FormGrid>
          ) : (
            <div className="fields">
              <FieldRow label="Partner seit"         value={master.partnerSince} />
              <FieldRow label="Besuchsfrequenz"      value={master.visitFrequency} />
              <FieldRow label="Letzter Besuch"       value={master.lastVisitDate} />
              <FieldRow label="Sprachen"             value={master.languages} />
              <div className="l">WhatsApp bevorzugt</div>
              <div className="v"><BoolBadge value={master.whatsappPreferred} trueLabel="Ja" falseLabel="Nein" /></div>
              <FieldRow label="Beste Kontaktzeit"    value={master.preferredContactTime} />
            </div>
          )}
        </div>
        <SaveError error={error} />
      </SectionCard>

      {/* Stärken & Schwächen */}
      <SectionCard
        icon="quality" title="Stärken, Schwächen & Kulturelle Hinweise"
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
        empty={!master.strengthsNotes && !master.weaknessesNotes && !master.culturalNotes && !master.localReferences}
        emptyText="Noch keine Beziehungsnotizen gepflegt."
      >
        {edit ? (
          <FormGrid cols={1}>
            <FormField label="Stärken des Lieferanten">
              <textarea style={textareaStyle} value={form.strengthsNotes ?? ''} onChange={e => set('strengthsNotes', e.target.value)} placeholder="z.B. Sehr zuverlässig bei Qualität, immer pünktlich bei Ernte, gute Sortierung…" />
            </FormField>
            <FormField label="Schwächen / Herausforderungen">
              <textarea style={textareaStyle} value={form.weaknessesNotes ?? ''} onChange={e => set('weaknessesNotes', e.target.value)} placeholder="z.B. Dokumente dauern länger, schlechte Internetverbindung, informelle Preisverhandlungen…" />
            </FormField>
            <FormField label="Kulturelle Hinweise & lokale Besonderheiten">
              <textarea style={textareaStyle} value={form.culturalNotes ?? ''} onChange={e => set('culturalNotes', e.target.value)} placeholder="z.B. Antworten nur über WhatsApp, Netz oft schlecht, Gespräche immer mit persönlichem Smalltalk beginnen, Entscheidungen brauchen Zeit…" />
            </FormField>
            <FormField label="Lokale Referenzen / Bürgen">
              <textarea style={textareaStyle} value={form.localReferences ?? ''} onChange={e => set('localReferences', e.target.value)} placeholder="z.B. Empfohlen durch Kooperative XYZ, Kontakt zu TACRI (Tansania)…" />
            </FormField>
            <SaveError error={error} />
          </FormGrid>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {master.strengthsNotes && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Ic name="check" size={12} color="#34d399" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#34d399' }}>Stärken</span>
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-2)' }}>{master.strengthsNotes}</div>
              </div>
            )}
            {master.weaknessesNotes && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Ic name="alert" size={12} color="#fbbf24" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#fbbf24' }}>Herausforderungen</span>
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-2)' }}>{master.weaknessesNotes}</div>
              </div>
            )}
            {master.culturalNotes && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Ic name="info" size={12} color="#60a5fa" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa' }}>Kulturelle Hinweise</span>
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-2)' }}>{master.culturalNotes}</div>
              </div>
            )}
            {master.localReferences && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Ic name="buyer" size={12} color="#a78bfa" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa' }}>Lokale Referenzen</span>
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-2)' }}>{master.localReferences}</div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

    </div>
  );
};

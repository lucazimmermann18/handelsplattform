'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Badge } from '@/components/ui/primitives';
import { t } from '@/lib/i18n';
import { useLang } from '@/lib/lang-context';
import type { ServiceProvider } from '@/lib/types';
import type { ProviderMaster, ProviderCategory } from '../types';
import { PROCESS_PHASES, PROVIDER_SUBCATEGORIES, PROVIDER_CATEGORIES } from '../types';
import {
  SectionCard, FormField, FormGrid, FieldRow, CheckFlag,
  SaveError, inputStyle, textareaStyle, useSectionSave,
} from '../shared';

interface TabProps { provider: ServiceProvider; master: ProviderMaster; onSaved: () => void; }

const ALL_SUBCATEGORIES: string[] = Array.from(
  new Set(
    PROVIDER_CATEGORIES.flatMap((cat: ProviderCategory) => PROVIDER_SUBCATEGORIES[cat])
  )
);

export const TabLeistungen = ({ provider: _provider, master, onSaved }: TabProps) => {
  const lang = useLang();
  const { refresh } = useData();
  const { save, saving, error, setError } = useSectionSave(_provider.id, refresh);

  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<Partial<ProviderMaster>>({});

  const enter = () => {
    setForm({
      services: master.services ?? [],
      specialization: master.specialization ?? '',
      exportExperience: master.exportExperience ?? false,
      euImportExperience: master.euImportExperience ?? false,
      tanzaniaExperience: master.tanzaniaExperience ?? false,
      agriExperience: master.agriExperience ?? false,
      bioFairtradeExperience: master.bioFairtradeExperience ?? false,
      minVolume: master.minVolume ?? '',
      maxVolume: master.maxVolume ?? '',
      hasSLA: master.hasSLA ?? false,
      slaDetails: master.slaDetails ?? '',
      serviceNotes: master.serviceNotes ?? '',
      countryCoverage: master.countryCoverage ?? [],
      portsCoverage: master.portsCoverage ?? [],
      productFocus: master.productFocus ?? [],
      processPhases: master.processPhases ?? [],
      isSinglePointOfFailure: master.isSinglePointOfFailure ?? false,
      hasBackupProvider: master.hasBackupProvider ?? false,
      backupProviderName: master.backupProviderName ?? '',
      criticalityReason: master.criticalityReason ?? '',
      hasSubcontractors: master.hasSubcontractors ?? false,
      subcontractorDetails: master.subcontractorDetails ?? '',
    });
    setEdit(true);
    setError(null);
  };

  const cancel = () => { setEdit(false); setError(null); };

  const doSave = async () => { await save(form); setEdit(false); onSaved(); };

  const set = (k: keyof ProviderMaster, v: string | boolean | number | undefined) =>
    setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      <SectionCard
        icon="layers" title={t(lang, 'sp_leistungen_scope')}
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
      >
        {edit ? (
          <FormGrid cols={2}>
            <FormField label={t(lang, 'sp_leistungen_services_label')} full>
              <textarea
                style={textareaStyle}
                value={(form.services ?? []).join(', ')}
                onChange={e => set('services', e.target.value.split(',').map(s => s.trim()).filter(Boolean) as unknown as undefined)}
              />
              <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {ALL_SUBCATEGORIES.map(sub => {
                  const active = (form.services ?? []).includes(sub);
                  return (
                    <button
                      key={sub}
                      className={`btn sm ${active ? 'primary' : 'ghost'}`}
                      style={{ fontSize: 10 }}
                      onClick={() => {
                        const cur = form.services ?? [];
                        const next = active ? cur.filter(s => s !== sub) : [...cur, sub];
                        set('services', next as unknown as undefined);
                      }}
                    >{sub}</button>
                  );
                })}
              </div>
            </FormField>
            <FormField label={t(lang, 'sp_leistungen_spec')} full>
              <textarea style={textareaStyle} value={form.specialization ?? ''} onChange={e => set('specialization', e.target.value)} />
            </FormField>
            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              <CheckFlag label={t(lang, 'sp_leistungen_export_exp')} value={!!form.exportExperience} onChange={v => set('exportExperience', v)} editMode={edit} />
              <CheckFlag label={t(lang, 'sp_leistungen_eu_exp')} value={!!form.euImportExperience} onChange={v => set('euImportExperience', v)} editMode={edit} />
              <CheckFlag label={t(lang, 'sp_leistungen_tz_exp')} value={!!form.tanzaniaExperience} onChange={v => set('tanzaniaExperience', v)} editMode={edit} />
              <CheckFlag label={t(lang, 'sp_leistungen_agri_exp')} value={!!form.agriExperience} onChange={v => set('agriExperience', v)} editMode={edit} />
              <CheckFlag label={t(lang, 'sp_leistungen_bio_exp')} value={!!form.bioFairtradeExperience} onChange={v => set('bioFairtradeExperience', v)} editMode={edit} />
            </div>
            <FormField label={t(lang, 'sp_leistungen_min_vol')}>
              <input style={inputStyle} value={form.minVolume ?? ''} onChange={e => set('minVolume', e.target.value)} />
            </FormField>
            <FormField label={t(lang, 'sp_leistungen_max_vol')}>
              <input style={inputStyle} value={form.maxVolume ?? ''} onChange={e => set('maxVolume', e.target.value)} />
            </FormField>
            <div style={{ gridColumn: '1 / -1' }}>
              <CheckFlag label={t(lang, 'sp_leistungen_sla')} value={!!form.hasSLA} onChange={v => set('hasSLA', v)} editMode={edit} />
            </div>
            {form.hasSLA && (
              <FormField label={t(lang, 'sp_leistungen_sla_details')} full>
                <textarea style={textareaStyle} value={form.slaDetails ?? ''} onChange={e => set('slaDetails', e.target.value)} />
              </FormField>
            )}
            <FormField label={t(lang, 'sp_leistungen_notes')} full>
              <textarea style={textareaStyle} value={form.serviceNotes ?? ''} onChange={e => set('serviceNotes', e.target.value)} />
            </FormField>
            <SaveError error={error} />
          </FormGrid>
        ) : (
          <div>
            {(master.services ?? []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                {(master.services ?? []).map(s => <Badge key={s} kind="neutral">{s}</Badge>)}
              </div>
            )}
            <div className="fields">
              <FieldRow label={t(lang, 'sp_leistungen_spec')} value={master.specialization} />
              <div className="l">{t(lang, 'sp_leistungen_export_exp')}</div>
              <div className="v"><CheckFlag label={t(lang, 'sp_leistungen_export_exp')} value={!!master.exportExperience} editMode={false} /></div>
              <div className="l">{t(lang, 'sp_leistungen_eu_exp')}</div>
              <div className="v"><CheckFlag label={t(lang, 'sp_leistungen_eu_exp')} value={!!master.euImportExperience} editMode={false} /></div>
              <div className="l">{t(lang, 'sp_leistungen_tz_exp')}</div>
              <div className="v"><CheckFlag label={t(lang, 'sp_leistungen_tz_exp')} value={!!master.tanzaniaExperience} editMode={false} /></div>
              <div className="l">{t(lang, 'sp_leistungen_agri_exp')}</div>
              <div className="v"><CheckFlag label={t(lang, 'sp_leistungen_agri_exp')} value={!!master.agriExperience} editMode={false} /></div>
              <div className="l">{t(lang, 'sp_leistungen_bio_exp')}</div>
              <div className="v"><CheckFlag label={t(lang, 'sp_leistungen_bio_exp')} value={!!master.bioFairtradeExperience} editMode={false} /></div>
              <FieldRow label={t(lang, 'sp_leistungen_min_vol')} value={master.minVolume} />
              <FieldRow label={t(lang, 'sp_leistungen_max_vol')} value={master.maxVolume} />
              <div className="l">{t(lang, 'sp_leistungen_sla')}</div>
              <div className="v"><CheckFlag label={t(lang, 'sp_leistungen_sla')} value={!!master.hasSLA} editMode={false} /></div>
              {master.hasSLA && <FieldRow label={t(lang, 'sp_leistungen_sla_details')} value={master.slaDetails} />}
              <FieldRow label={t(lang, 'sp_leistungen_notes')} value={master.serviceNotes} />
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon="ship" title={t(lang, 'sp_leistungen_routes_title')}
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
      >
        {edit ? (
          <FormGrid cols={1}>
            <FormField label={t(lang, 'sp_leistungen_countries')}>
              <textarea
                style={textareaStyle}
                value={(form.countryCoverage ?? []).join(', ')}
                onChange={e => set('countryCoverage', e.target.value.split(',').map(s => s.trim()).filter(Boolean) as unknown as undefined)}
              />
            </FormField>
            <FormField label={t(lang, 'sp_leistungen_ports')}>
              <textarea
                style={textareaStyle}
                value={(form.portsCoverage ?? []).join(', ')}
                onChange={e => set('portsCoverage', e.target.value.split(',').map(s => s.trim()).filter(Boolean) as unknown as undefined)}
              />
            </FormField>
            <FormField label={t(lang, 'sp_leistungen_products_field')}>
              <textarea
                style={textareaStyle}
                value={(form.productFocus ?? []).join(', ')}
                onChange={e => set('productFocus', e.target.value.split(',').map(s => s.trim()).filter(Boolean) as unknown as undefined)}
              />
            </FormField>
            <SaveError error={error} />
          </FormGrid>
        ) : (
          <div className="fields">
            <div className="l">{t(lang, 'sp_leistungen_countries_label')}</div>
            <div className="v">
              {(master.countryCoverage ?? []).length > 0
                ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(master.countryCoverage ?? []).map(c => <Badge key={c} kind="neutral">{c}</Badge>)}
                  </div>
                : '—'}
            </div>
            <div className="l">{t(lang, 'sp_leistungen_ports_label')}</div>
            <div className="v">
              {(master.portsCoverage ?? []).length > 0
                ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(master.portsCoverage ?? []).map(p => <Badge key={p} kind="neutral">{p}</Badge>)}
                  </div>
                : '—'}
            </div>
            <div className="l">{t(lang, 'sp_leistungen_products_label')}</div>
            <div className="v">
              {(master.productFocus ?? []).length > 0
                ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(master.productFocus ?? []).map(p => <Badge key={p} kind="neutral">{p}</Badge>)}
                  </div>
                : '—'}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon="flag" title={t(lang, 'sp_leistungen_process_title')}
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
      >
        {edit ? (
          <FormGrid cols={1}>
            <FormField label={t(lang, 'sp_leistungen_phases_label')}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {PROCESS_PHASES.map(phase => {
                  const active = (form.processPhases ?? []).includes(phase);
                  return (
                    <button
                      key={phase}
                      className={`btn sm ${active ? 'primary' : 'ghost'}`}
                      style={{ fontSize: 11 }}
                      onClick={() => {
                        const cur = form.processPhases ?? [];
                        set('processPhases', (active ? cur.filter(p => p !== phase) : [...cur, phase]) as unknown as undefined);
                      }}
                    >{phase}</button>
                  );
                })}
              </div>
            </FormField>
            <div>
              <CheckFlag label={t(lang, 'sp_leistungen_spof')} value={!!form.isSinglePointOfFailure} onChange={v => set('isSinglePointOfFailure', v)} editMode={edit} />
              <CheckFlag label={t(lang, 'sp_leistungen_backup')} value={!!form.hasBackupProvider} onChange={v => set('hasBackupProvider', v)} editMode={edit} />
            </div>
            {form.hasBackupProvider && (
              <FormField label={t(lang, 'sp_leistungen_backup_name')}>
                <input style={inputStyle} value={form.backupProviderName ?? ''} onChange={e => set('backupProviderName', e.target.value)} />
              </FormField>
            )}
            <FormField label={t(lang, 'sp_leistungen_crit_reason')}>
              <textarea style={textareaStyle} value={form.criticalityReason ?? ''} onChange={e => set('criticalityReason', e.target.value)} />
            </FormField>
            <div>
              <CheckFlag label={t(lang, 'sp_leistungen_subcontractors')} value={!!form.hasSubcontractors} onChange={v => set('hasSubcontractors', v)} editMode={edit} />
            </div>
            {form.hasSubcontractors && (
              <FormField label={t(lang, 'sp_leistungen_sub_details')}>
                <textarea style={textareaStyle} value={form.subcontractorDetails ?? ''} onChange={e => set('subcontractorDetails', e.target.value)} />
              </FormField>
            )}
            <SaveError error={error} />
          </FormGrid>
        ) : (
          <div>
            {(master.processPhases ?? []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                {(master.processPhases ?? []).map(p => <Badge key={p} kind="neutral">{p}</Badge>)}
              </div>
            )}
            <div className="fields">
              <div className="l">{t(lang, 'sp_leistungen_spof_label')}</div>
              <div className="v">
                {master.isSinglePointOfFailure
                  ? <Badge kind="danger">{t(lang, 'sp_leistungen_spof')}</Badge>
                  : <Badge kind="neutral">{t(lang, 'sp_leistungen_no_spof')}</Badge>}
              </div>
              <div className="l">{t(lang, 'sp_leistungen_backup_label')}</div>
              <div className="v"><CheckFlag label={t(lang, 'sp_leistungen_backup')} value={!!master.hasBackupProvider} editMode={false} /></div>
              {master.hasBackupProvider && <FieldRow label={t(lang, 'sp_leistungen_backup_name')} value={master.backupProviderName} />}
              <FieldRow label={t(lang, 'sp_leistungen_crit_reason')} value={master.criticalityReason} />
              <div className="l">{t(lang, 'sp_leistungen_sub_label')}</div>
              <div className="v"><CheckFlag label={t(lang, 'sp_leistungen_subcontractors')} value={!!master.hasSubcontractors} editMode={false} /></div>
              {master.hasSubcontractors && <FieldRow label={t(lang, 'sp_leistungen_sub_details')} value={master.subcontractorDetails} />}
            </div>
          </div>
        )}
      </SectionCard>

    </div>
  );
};

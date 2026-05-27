'use client';
import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Badge } from '@/components/ui/primitives';
import type { Product } from '@/lib/types';
import type { ProductMaster } from '../types';
import { SectionCard, FormField, FormGrid, BoolBadge, FieldRow, SaveError, inputStyle, textareaStyle, thStyle, useSectionSave } from '../shared';

interface TabProps { product: Product; master: ProductMaster; onSaved: () => void; }

const RELEASE_BADGE: Record<string, { label: string; kind: string }> = {
  released: { label: 'Freigegeben', kind: 'success' },
  blocked:  { label: 'Gesperrt',    kind: 'danger'  },
  pending:  { label: 'Ausstehend',  kind: 'warning' },
};

export function TabQualitaet({ product, master, onSaved }: TabProps) {
  const { refresh } = useData();
  const { save: saveMaster, saving, error, setError } = useSectionSave(product.id, refresh);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<ProductMaster>>({});

  const enter = () => {
    setForm({
      qualityClass:         master.qualityClass ?? '',
      qualityReleaseStatus: master.qualityReleaseStatus,
      samplingRules:        master.samplingRules ?? '',
      complaintRate:        master.complaintRate ?? '',
      warehouseLocation:    master.warehouseLocation ?? '',
      minStock:             master.minStock ?? '',
      stockMethod:          master.stockMethod,
      bestBefore:           master.bestBefore ?? '',
      stackable:            master.stackable,
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

  const setText  = (key: keyof ProductMaster, v: string)  => setForm(f => ({ ...f, [key]: v }));
  const setBool  = (key: keyof ProductMaster, v: boolean) => setForm(f => ({ ...f, [key]: v }));

  const releaseStatus = editMode ? form.qualityReleaseStatus : master.qualityReleaseStatus;
  const releaseBadge  = releaseStatus ? RELEASE_BADGE[releaseStatus] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(product.qualSpec?.length ?? 0) > 0 && (
        <SectionCard icon="activity" title="QC-Parameter (Referenz)">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Parameter</th>
                <th style={{ ...thStyle, width: '16%', textAlign: 'center' as const }}>Min</th>
                <th style={{ ...thStyle, width: '16%', textAlign: 'center' as const }}>Ziel</th>
                <th style={{ ...thStyle, width: '16%', textAlign: 'center' as const }}>Max</th>
                <th style={{ ...thStyle, width: '22%' }}>EU-Grenzwert</th>
              </tr>
            </thead>
            <tbody>
              {product.qualSpec!.map((row, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '4px 4px', fontSize: 12.5 }}>{row.p}</td>
                  <td style={{ padding: '4px 4px', fontSize: 12, textAlign: 'center', color: 'var(--text-2)' }}>{row.min || '—'}</td>
                  <td style={{ padding: '4px 4px', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>{row.tgt || '—'}</td>
                  <td style={{ padding: '4px 4px', fontSize: 12, textAlign: 'center', color: 'var(--text-2)' }}>{row.max || '—'}</td>
                  <td style={{ padding: '4px 4px', fontSize: 12, color: 'var(--text-2)' }}>{row.eu || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}

      <SectionCard
        icon="award"
        title="Qualitätsfreigabe & Klasse"
        editMode={editMode}
        onEdit={enter}
        onSave={save}
        onCancel={cancel}
        saving={saving}
        badge={releaseBadge ? releaseBadge.label : undefined}
      >
        {editMode ? (
          <FormGrid cols={2}>
            <FormField label="Qualitätsklasse">
              <input
                style={inputStyle}
                value={form.qualityClass ?? ''}
                onChange={e => setText('qualityClass', e.target.value)}
                placeholder="z.B. Klasse A, Premium, Grade 1…"
              />
            </FormField>
            <FormField label="Qualitätsfreigabe-Status">
              <select
                style={inputStyle}
                value={form.qualityReleaseStatus ?? ''}
                onChange={e => setForm(f => ({ ...f, qualityReleaseStatus: e.target.value as ProductMaster['qualityReleaseStatus'] }))}
              >
                <option value="">— Auswählen —</option>
                <option value="released">Freigegeben</option>
                <option value="blocked">Gesperrt</option>
                <option value="pending">Ausstehend</option>
              </select>
            </FormField>
          </FormGrid>
        ) : (
          <div className="kv-grid" style={{ fontSize: 12.5 }}>
            <FieldRow label="Qualitätsklasse" value={master.qualityClass} />
            <div className="l">Freigabe-Status</div>
            <div className="v">
              {releaseBadge
                ? <Badge kind={releaseBadge.kind}>{releaseBadge.label}</Badge>
                : <span style={{ color: 'var(--text-3)' }}>—</span>}
            </div>
            {!master.qualityClass && !master.qualityReleaseStatus && (
              <div style={{ gridColumn: '1/-1', color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '6px 0' }}>
                Noch nicht gepflegt.
              </div>
            )}
          </div>
        )}
        <SaveError error={error} />
      </SectionCard>

      <SectionCard
        icon="check-circle"
        title="Prüfung & Sampling"
        editMode={editMode}
        onEdit={enter}
        onSave={save}
        onCancel={cancel}
        saving={saving}
      >
        {editMode ? (
          <FormGrid cols={2}>
            <FormField label="Sampling-Regeln" full>
              <textarea
                style={textareaStyle}
                value={form.samplingRules ?? ''}
                onChange={e => setText('samplingRules', e.target.value)}
                placeholder="z.B. AQL 2.5, Stichprobenplan, Ziehungsintervall…"
              />
            </FormField>
            <FormField label="Reklamationsquote">
              <input
                style={inputStyle}
                value={form.complaintRate ?? ''}
                onChange={e => setText('complaintRate', e.target.value)}
                placeholder="z.B. < 0,5 %"
              />
            </FormField>
          </FormGrid>
        ) : (
          <div className="kv-grid" style={{ fontSize: 12.5 }}>
            <FieldRow label="Sampling-Regeln"   value={master.samplingRules} />
            <FieldRow label="Reklamationsquote" value={master.complaintRate} />
            {!master.samplingRules && !master.complaintRate && (
              <div style={{ gridColumn: '1/-1', color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '6px 0' }}>
                Noch nicht gepflegt.
              </div>
            )}
          </div>
        )}
        <SaveError error={error} />
      </SectionCard>

      <SectionCard
        icon="package"
        title="Lager & Logistik"
        editMode={editMode}
        onEdit={enter}
        onSave={save}
        onCancel={cancel}
        saving={saving}
      >
        {editMode ? (
          <FormGrid cols={2}>
            <FormField label="Lagerort">
              <input style={inputStyle} value={form.warehouseLocation ?? ''} onChange={e => setText('warehouseLocation', e.target.value)} placeholder="z.B. Halle 3, Regal B-12" />
            </FormField>
            <FormField label="Mindestbestand">
              <input style={inputStyle} value={form.minStock ?? ''} onChange={e => setText('minStock', e.target.value)} placeholder="z.B. 500 kg" />
            </FormField>
            <FormField label="Lagermethode">
              <select
                style={inputStyle}
                value={form.stockMethod ?? ''}
                onChange={e => setForm(f => ({ ...f, stockMethod: e.target.value as ProductMaster['stockMethod'] }))}
              >
                <option value="">— Auswählen —</option>
                <option value="FIFO">FIFO – First In, First Out</option>
                <option value="FEFO">FEFO – First Expired, First Out</option>
              </select>
            </FormField>
            <FormField label="MHD / Ablaufdatum">
              <input style={inputStyle} value={form.bestBefore ?? ''} onChange={e => setText('bestBefore', e.target.value)} placeholder="z.B. 18 Monate ab Produktion" />
            </FormField>
            <FormField label="Stapelbarkeit">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!form.stackable}
                  onChange={e => setBool('stackable', e.target.checked)}
                  style={{ accentColor: '#60a5fa', width: 15, height: 15 }}
                />
                Stapelbar
              </label>
            </FormField>
          </FormGrid>
        ) : (
          <div className="kv-grid" style={{ fontSize: 12.5 }}>
            <FieldRow label="Lagerort"       value={master.warehouseLocation} />
            <FieldRow label="Mindestbestand" value={master.minStock} />
            <FieldRow label="Lagermethode"   value={master.stockMethod} />
            <FieldRow label="MHD"            value={master.bestBefore} />
            <div className="l">Stapelbarkeit</div>
            <div className="v">
              <BoolBadge value={master.stackable} trueLabel="Stapelbar" falseLabel="Nicht stapelbar" />
            </div>
            {!master.warehouseLocation && !master.minStock && !master.stockMethod && !master.bestBefore && master.stackable === undefined && (
              <div style={{ gridColumn: '1/-1', color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '6px 0' }}>
                Noch nicht gepflegt.
              </div>
            )}
          </div>
        )}
        <SaveError error={error} />
      </SectionCard>
    </div>
  );
}

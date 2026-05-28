'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import type { ServiceProvider } from '@/lib/types';
import type { ProviderMaster, PerformanceEntry } from '../types';
import {
  SectionCard, FormField, FormGrid, FieldRow,
  SaveError, DeleteBtn, cellInput, thStyle, textareaStyle, useSectionSave,
} from '../shared';

interface TabProps { provider: ServiceProvider; master: ProviderMaster; onSaved: () => void; }

const emptyPerf = (): PerformanceEntry => ({ period: '', rating: 3, onTimeRate: '', issueCount: 0, costDeviation: '', notes: '' });

const Stars = ({ rating }: { rating: number }) => (
  <span>{Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ color: i < rating ? '#fbbf24' : '#3a4455', fontSize: 13 }}>★</span>
  ))}</span>
);

export const TabPerformance = ({ provider: _provider, master, onSaved }: TabProps) => {
  const { refresh } = useData();
  const { save, saving, error, setError } = useSectionSave(_provider.id, refresh);

  const [edit, setEdit] = useState(false);
  const [performance, setPerformance] = useState<PerformanceEntry[]>(master.performance ?? []);
  const [form, setForm] = useState<Partial<ProviderMaster>>({});

  const enter = () => {
    setPerformance(master.performance ?? []);
    setForm({
      overallRating: master.overallRating ?? undefined,
      totalOrders: master.totalOrders ?? undefined,
      reliabilityScore: master.reliabilityScore ?? undefined,
      communicationScore: master.communicationScore ?? undefined,
      lessonsLearned: master.lessonsLearned ?? '',
    });
    setEdit(true);
    setError(null);
  };

  const cancel = () => { setEdit(false); setError(null); };

  const doSave = async () => {
    await save({ ...form, performance });
    setEdit(false);
    onSaved();
  };

  const set = (k: keyof ProviderMaster, v: string | number | undefined) =>
    setForm(f => ({ ...f, [k]: v }));

  const updPerf = (i: number, field: keyof PerformanceEntry, val: string | number) =>
    setPerformance(p => p.map((x, idx) => idx === i ? { ...x, [field]: val } : x));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {master.overallRating !== undefined && master.overallRating !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', marginBottom: 12 }}>
          <div style={{ fontSize: 32 }}><Stars rating={Math.round(master.overallRating ?? 0)} /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{master.overallRating?.toFixed(1) ?? '—'} / 5</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{master.totalOrders ?? 0} Aufträge · Zuverlässigkeit: {master.reliabilityScore ?? '—'}</div>
          </div>
        </div>
      )}

      <SectionCard
        icon="chart" title="Performance-Verlauf"
        badge={`${performance.length} Einträge`}
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
      >
        {(performance.length === 0 && !edit) ? (
          <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
            Noch keine Performance-Daten erfasst.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '14%' }}>Zeitraum</th>
                <th style={{ ...thStyle, width: '12%' }}>Bewertung</th>
                <th style={{ ...thStyle, width: '12%' }}>Pünktlichkeit</th>
                <th style={{ ...thStyle, width: '10%' }}>Probleme</th>
                <th style={{ ...thStyle, width: '12%' }}>Kostenabw.</th>
                <th style={thStyle}>Notizen</th>
                {edit && <th style={{ ...thStyle, width: 36 }} />}
              </tr>
            </thead>
            <tbody>
              {performance.map((p, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '5px 4px' }}>
                    {edit
                      ? <input style={cellInput} value={p.period} onChange={e => updPerf(i, 'period', e.target.value)} placeholder="z.B. Q1 2024" />
                      : <span style={{ fontSize: 12 }}>{p.period || '—'}</span>}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {edit
                      ? <input type="number" min={1} max={5} style={cellInput} value={p.rating} onChange={e => updPerf(i, 'rating', Number(e.target.value))} />
                      : <Stars rating={p.rating} />}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {edit
                      ? <input style={cellInput} value={p.onTimeRate} onChange={e => updPerf(i, 'onTimeRate', e.target.value)} placeholder="z.B. 95%" />
                      : <span style={{ fontSize: 12 }}>{p.onTimeRate || '—'}</span>}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {edit
                      ? <input type="number" min={0} style={cellInput} value={p.issueCount} onChange={e => updPerf(i, 'issueCount', Number(e.target.value))} />
                      : <span style={{ fontSize: 12 }}>{p.issueCount}</span>}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {edit
                      ? <input style={cellInput} value={p.costDeviation} onChange={e => updPerf(i, 'costDeviation', e.target.value)} placeholder="z.B. +2%" />
                      : <span style={{ fontSize: 12 }}>{p.costDeviation || '—'}</span>}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {edit
                      ? <input style={cellInput} value={p.notes} onChange={e => updPerf(i, 'notes', e.target.value)} placeholder="Notizen…" />
                      : <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.notes || '—'}</span>}
                  </td>
                  {edit && (
                    <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                      <DeleteBtn onClick={() => setPerformance(p => p.filter((_, j) => j !== i))} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {edit && (
          <button className="btn sm ghost" style={{ marginTop: 10 }} onClick={() => setPerformance(p => [...p, emptyPerf()])}>
            + Eintrag hinzufügen
          </button>
        )}
      </SectionCard>

      <SectionCard
        icon="quality" title="KPIs & Lessons Learned"
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
      >
        {edit ? (
          <FormGrid cols={2}>
            <FormField label="Gesamtbewertung (1–5)">
              <input type="number" min={1} max={5} step={0.1} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box' }} value={form.overallRating ?? ''} onChange={e => set('overallRating', e.target.value === '' ? undefined : Number(e.target.value))} />
            </FormField>
            <FormField label="Gesamtaufträge">
              <input type="number" min={0} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box' }} value={form.totalOrders ?? ''} onChange={e => set('totalOrders', e.target.value === '' ? undefined : Number(e.target.value))} />
            </FormField>
            <FormField label="Zuverlässigkeit">
              <input style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box' }} value={form.reliabilityScore !== undefined && form.reliabilityScore !== null ? String(form.reliabilityScore) : ''} onChange={e => set('reliabilityScore', e.target.value)} placeholder="z.B. 94%" />
            </FormField>
            <FormField label="Kommunikationsqualität">
              <input style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box' }} value={form.communicationScore !== undefined && form.communicationScore !== null ? String(form.communicationScore) : ''} onChange={e => set('communicationScore', e.target.value)} placeholder="z.B. 88%" />
            </FormField>
            <FormField label="Lessons Learned" full>
              <textarea style={textareaStyle} value={form.lessonsLearned ?? ''} onChange={e => set('lessonsLearned', e.target.value)} placeholder="Was hat gut funktioniert? Was sollte verbessert werden?" />
            </FormField>
            <SaveError error={error} />
          </FormGrid>
        ) : (
          <div className="fields">
            <FieldRow label="Gesamtbewertung" value={master.overallRating !== undefined && master.overallRating !== null ? `${master.overallRating} / 5` : undefined} />
            <FieldRow label="Gesamtaufträge" value={master.totalOrders !== undefined && master.totalOrders !== null ? String(master.totalOrders) : undefined} />
            <FieldRow label="Zuverlässigkeit" value={master.reliabilityScore !== undefined && master.reliabilityScore !== null ? String(master.reliabilityScore) : undefined} />
            <FieldRow label="Kommunikationsqualität" value={master.communicationScore !== undefined && master.communicationScore !== null ? String(master.communicationScore) : undefined} />
            <FieldRow label="Lessons Learned" value={master.lessonsLearned} />
          </div>
        )}
      </SectionCard>

    </div>
  );
};

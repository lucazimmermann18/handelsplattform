'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Badge } from '@/components/ui/primitives';
import { Ic } from '@/components/ui/icons';
import type { ServiceProvider } from '@/lib/types';
import type { ProviderMaster, RiskEntry, RiskLevel } from '../types';
import { RISK_MAP, RISK_TYPES } from '../types';
import {
  SectionCard, FormField, FormGrid, FieldRow, CheckFlag,
  SaveError, DeleteBtn, cellInput, thStyle, textareaStyle, useSectionSave,
} from '../shared';

interface TabProps { provider: ServiceProvider; master: ProviderMaster; onSaved: () => void; }

export const TabRisiko = ({ provider, master, onSaved }: TabProps) => {
  const { refresh } = useData();
  const { save, saving, error, setError } = useSectionSave(provider.id, refresh);

  const [edit, setEdit] = useState(false);
  const [risks, setRisks] = useState<RiskEntry[]>(master.risks ?? []);
  const [form, setForm] = useState<Partial<ProviderMaster>>({});

  const enter = () => {
    setRisks(master.risks ?? []);
    setForm({
      sanctionCheckDone: master.sanctionCheckDone ?? false,
      sanctionCheckDate: master.sanctionCheckDate ?? '',
      sanctionCheckBy: master.sanctionCheckBy ?? '',
      ownershipKnown: master.ownershipKnown ?? false,
      conflictsOfInterest: master.conflictsOfInterest ?? false,
      overallRiskScore: master.overallRiskScore ?? undefined,
      complianceNotes: master.complianceNotes ?? '',
    });
    setEdit(true);
    setError(null);
  };

  const cancel = () => { setEdit(false); setError(null); };

  const doSave = async () => {
    await save({ ...form, risks });
    setEdit(false);
    onSaved();
  };

  const set = (k: keyof ProviderMaster, v: string | boolean | number | undefined) =>
    setForm(f => ({ ...f, [k]: v }));

  const updRisk = (i: number, field: keyof RiskEntry, val: string) =>
    setRisks(r => r.map((x, idx) => idx === i ? { ...x, [field]: val } : x));

  const overallRisk = (): RiskLevel => {
    if (!risks.length) return 'niedrig';
    if (risks.some(r => r.level === 'kritisch')) return 'kritisch';
    if (risks.filter(r => r.level === 'hoch').length >= 2) return 'hoch';
    if (risks.some(r => r.level === 'hoch') || risks.filter(r => r.level === 'mittel').length >= 2) return 'mittel';
    return 'niedrig';
  };

  const displayRisks = edit ? risks : (master.risks ?? []);
  const level = overallRisk();
  const riskColor = RISK_MAP[level].color;

  const scoreColor = (s: number) => s <= 30 ? '#34d399' : s <= 60 ? '#fbbf24' : '#f87171';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      <div style={{ padding: '14px 16px', borderRadius: 10, background: `${riskColor}0d`, border: `1px solid ${riskColor}30`, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${riskColor}20`, border: `2px solid ${riskColor}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Ic name="alert" size={20} color={riskColor} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: riskColor, marginBottom: 2 }}>
            Gesamtrisiko: {level.charAt(0).toUpperCase() + level.slice(1)}
          </div>
          <div className="tx3" style={{ fontSize: 11.5 }}>
            {displayRisks.length} Risiken erfasst ·{' '}
            {displayRisks.filter(r => r.level === 'kritisch').length} kritisch ·{' '}
            {displayRisks.filter(r => r.level === 'hoch').length} hoch ·{' '}
            {displayRisks.filter(r => r.level === 'mittel').length} mittel ·{' '}
            {displayRisks.filter(r => r.level === 'niedrig').length} niedrig
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Badge kind={RISK_MAP[level].kind as 'success' | 'warning' | 'danger'} dot>{RISK_MAP[level].label}</Badge>
        </div>
      </div>

      <SectionCard
        icon="alert" title="Risikobewertung"
        badge={displayRisks.length ? `${displayRisks.length} Risiken` : undefined}
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
      >
        {edit && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>SCHNELL HINZUFÜGEN</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {RISK_TYPES.map(rt => {
                const exists = risks.some(r => r.riskType === rt);
                return (
                  <button
                    key={rt}
                    className={`btn sm ${exists ? 'primary' : 'ghost'}`}
                    style={{ fontSize: 11 }}
                    onClick={() => {
                      if (!exists) setRisks(r => [...r, { riskType: rt, level: 'mittel', description: '', mitigation: '', owner: '', nextReview: '' }]);
                    }}
                  >
                    {exists && <Ic name="check" size={10} />} {rt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {displayRisks.length === 0 && !edit ? (
          <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
            Noch keine Risiken erfasst.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '18%' }}>Risikoart</th>
                <th style={{ ...thStyle, width: '10%' }}>Level</th>
                <th style={{ ...thStyle, width: '25%' }}>Beschreibung</th>
                <th style={{ ...thStyle, width: '25%' }}>Gegenmaßnahme</th>
                <th style={thStyle}>Verantwortlicher</th>
                {edit && <th style={{ ...thStyle, width: 36 }} />}
              </tr>
            </thead>
            <tbody>
              {displayRisks.map((risk, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '5px 4px' }}>
                    {edit
                      ? <select style={cellInput} value={risk.riskType} onChange={e => updRisk(i, 'riskType', e.target.value)}>
                          <option value="">— Risikoart —</option>
                          {RISK_TYPES.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                        </select>
                      : <span style={{ fontSize: 12 }}>{risk.riskType || '—'}</span>}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {edit
                      ? <select style={{ ...cellInput, color: RISK_MAP[risk.level as RiskLevel]?.color }} value={risk.level} onChange={e => updRisk(i, 'level', e.target.value)}>
                          <option value="niedrig">Niedrig</option>
                          <option value="mittel">Mittel</option>
                          <option value="hoch">Hoch</option>
                          <option value="kritisch">Kritisch</option>
                        </select>
                      : <Badge kind={RISK_MAP[risk.level as RiskLevel]?.kind as 'success' | 'warning' | 'danger'} dot>{risk.level}</Badge>}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {edit
                      ? <input style={cellInput} value={risk.description} onChange={e => updRisk(i, 'description', e.target.value)} placeholder="Was ist das Risiko?" />
                      : <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{risk.description || '—'}</span>}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {edit
                      ? <input style={cellInput} value={risk.mitigation} onChange={e => updRisk(i, 'mitigation', e.target.value)} placeholder="Wie wird es gemindert?" />
                      : <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{risk.mitigation || '—'}</span>}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {edit
                      ? <input style={cellInput} value={risk.owner} onChange={e => updRisk(i, 'owner', e.target.value)} placeholder="Verantwortlich" />
                      : <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{risk.owner || '—'}</span>}
                  </td>
                  {edit && (
                    <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                      <DeleteBtn onClick={() => setRisks(r => r.filter((_, j) => j !== i))} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {edit && (
          <button className="btn sm ghost" style={{ marginTop: 10 }} onClick={() => setRisks(r => [...r, { riskType: '', level: 'mittel', description: '', mitigation: '', owner: '', nextReview: '' }])}>
            <Ic name="plus" size={12} /> Risiko hinzufügen
          </button>
        )}
      </SectionCard>

      <SectionCard
        icon="shield" title="Compliance & Sanktionsprüfung"
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
      >
        {edit ? (
          <FormGrid cols={2}>
            <FormField label="Sanktionsprüfung durchgeführt">
              <CheckFlag label="Sanktionsprüfung durchgeführt" value={!!form.sanctionCheckDone} onChange={v => set('sanctionCheckDone', v)} editMode />
            </FormField>
            <FormField label="Sanktionsprüfung Datum">
              <input type="date" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box' }} value={form.sanctionCheckDate ?? ''} onChange={e => set('sanctionCheckDate', e.target.value)} />
            </FormField>
            <FormField label="Geprüft von">
              <input style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box' }} value={form.sanctionCheckBy ?? ''} onChange={e => set('sanctionCheckBy', e.target.value)} />
            </FormField>
            <FormField label="Eigentümerstruktur bekannt">
              <CheckFlag label="Eigentümerstruktur bekannt" value={!!form.ownershipKnown} onChange={v => set('ownershipKnown', v)} editMode />
            </FormField>
            <FormField label="Interessenkonflikte vorhanden">
              <CheckFlag label="Interessenkonflikte vorhanden" value={!!form.conflictsOfInterest} onChange={v => set('conflictsOfInterest', v)} editMode />
            </FormField>
            <FormField label="Risiko-Score (0–100)">
              <input type="number" min={0} max={100} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box' }} value={form.overallRiskScore ?? ''} onChange={e => set('overallRiskScore', e.target.value === '' ? undefined : Number(e.target.value))} />
            </FormField>
            <FormField label="Compliance-Notizen" full>
              <textarea style={textareaStyle} value={form.complianceNotes ?? ''} onChange={e => set('complianceNotes', e.target.value)} placeholder="Besonderheiten, offene Punkte, nächste Schritte…" />
            </FormField>
            <SaveError error={error} />
          </FormGrid>
        ) : (
          <div className="fields">
            <div className="l">Sanktionsprüfung</div>
            <div className="v"><CheckFlag label="Sanktionsprüfung durchgeführt" value={!!master.sanctionCheckDone} /></div>
            <FieldRow label="Sanktionsprüfung Datum" value={master.sanctionCheckDate} />
            <FieldRow label="Geprüft von" value={master.sanctionCheckBy} />
            <div className="l">Eigentümerstruktur</div>
            <div className="v"><CheckFlag label="Eigentümerstruktur bekannt" value={!!master.ownershipKnown} /></div>
            <div className="l">Interessenkonflikte</div>
            <div className="v"><CheckFlag label="Interessenkonflikte vorhanden" value={!!master.conflictsOfInterest} /></div>
            <div className="l">Risiko-Score</div>
            <div className="v">
              {master.overallRiskScore !== undefined && master.overallRiskScore !== null
                ? <span style={{ fontWeight: 700, fontSize: 14, color: scoreColor(master.overallRiskScore) }}>{master.overallRiskScore}</span>
                : <span style={{ color: 'var(--text-3)' }}>—</span>}
            </div>
            <FieldRow label="Compliance-Notizen" value={master.complianceNotes} />
          </div>
        )}
      </SectionCard>

    </div>
  );
};

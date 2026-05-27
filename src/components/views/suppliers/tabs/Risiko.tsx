'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Badge } from '@/components/ui/primitives';
import { Ic } from '@/components/ui/icons';
import type { Supplier } from '@/lib/types';
import type { SupplierMaster, RiskItem, RiskLevel } from '../types';
import { RISK_CATEGORIES } from '../types';
import {
  SectionCard, FormField, FormGrid, DeleteBtn,
  SaveError, textareaStyle, cellInput, thStyle, useSectionSave,
} from '../shared';

interface TabProps { supplier: Supplier; master: SupplierMaster; onSaved: () => void; }

const emptyRisk = (): RiskItem => ({ category: '', level: 'mittel', description: '', mitigation: '' });

const riskColor = (level: RiskLevel) =>
  level === 'niedrig' ? '#34d399' : level === 'mittel' ? '#fbbf24' : '#f87171';

const overallRiskLevel = (risks: RiskItem[]): RiskLevel => {
  if (!risks.length) return 'niedrig';
  const high = risks.filter(r => r.level === 'hoch').length;
  const mid  = risks.filter(r => r.level === 'mittel').length;
  if (high >= 2 || (high >= 1 && mid >= 2)) return 'hoch';
  if (high >= 1 || mid >= 2) return 'mittel';
  return 'niedrig';
};

export const TabRisiko = ({ supplier, master, onSaved }: TabProps) => {
  const { refresh } = useData();
  const { save, saving, error, setError } = useSectionSave(supplier.id, refresh);

  const [edit, setEdit] = useState(false);
  const [risks, setRisks] = useState<RiskItem[]>(master.risks ?? []);
  const [notes, setNotes] = useState(master.overallRiskNotes ?? '');

  const enter = () => {
    setRisks(master.risks ?? []);
    setNotes(master.overallRiskNotes ?? '');
    setEdit(true); setError(null);
  };

  const cancel = () => { setEdit(false); setError(null); };

  const doSave = async () => {
    await save({ risks, overallRiskNotes: notes });
    setEdit(false);
    onSaved();
  };

  const updRisk = (i: number, field: keyof RiskItem, val: string) =>
    setRisks(r => r.map((x, idx) => idx === i ? { ...x, [field]: val } : x));

  const overall = overallRiskLevel(edit ? risks : (master.risks ?? []));
  const displayRisks = edit ? risks : (master.risks ?? []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Overall Risk Summary */}
      <div style={{ padding: '14px 16px', borderRadius: 10, background: `${riskColor(overall)}0d`, border: `1px solid ${riskColor(overall)}30`, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${riskColor(overall)}20`, border: `2px solid ${riskColor(overall)}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Ic name="alert" size={20} color={riskColor(overall)} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: riskColor(overall), marginBottom: 2 }}>
            Gesamtrisiko: {overall.charAt(0).toUpperCase() + overall.slice(1)}
          </div>
          <div className="tx3" style={{ fontSize: 11.5 }}>
            {displayRisks.length} Risiken erfasst ·{' '}
            {displayRisks.filter(r => r.level === 'hoch').length} hoch ·{' '}
            {displayRisks.filter(r => r.level === 'mittel').length} mittel ·{' '}
            {displayRisks.filter(r => r.level === 'niedrig').length} niedrig
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <Badge kind={overall === 'niedrig' ? 'success' : overall === 'mittel' ? 'warning' : 'danger'} dot>
            {overall}
          </Badge>
        </div>
      </div>

      {/* Risiko-Tabelle */}
      <SectionCard
        icon="alert" title="Risikoprofil"
        badge={displayRisks.length ? `${displayRisks.length} Risiken` : undefined}
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
      >
        {/* Quick-Add Kategorien */}
        {edit && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>SCHNELL HINZUFÜGEN</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {RISK_CATEGORIES.map(cat => {
                const exists = risks.some(r => r.category === cat);
                return (
                  <button
                    key={cat}
                    className={`btn sm ${exists ? 'primary' : 'ghost'}`}
                    style={{ fontSize: 11 }}
                    onClick={() => {
                      if (!exists) setRisks(r => [...r, { ...emptyRisk(), category: cat }]);
                    }}
                  >
                    {exists && <Ic name="check" size={10} />} {cat}
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
                <th style={{ ...thStyle, width: '20%' }}>Kategorie</th>
                <th style={{ ...thStyle, width: '10%' }}>Level</th>
                <th style={{ ...thStyle, width: '35%' }}>Beschreibung</th>
                <th style={thStyle}>Gegenmaßnahme</th>
                {edit && <th style={{ ...thStyle, width: 36 }} />}
              </tr>
            </thead>
            <tbody>
              {displayRisks.map((risk, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '5px 4px' }}>
                    {edit
                      ? <select style={cellInput} value={risk.category} onChange={e => updRisk(i, 'category', e.target.value)}>
                          <option value="">— Kategorie —</option>
                          {RISK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      : <span style={{ fontSize: 12 }}>{risk.category}</span>}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {edit
                      ? <select style={{ ...cellInput, color: riskColor(risk.level as RiskLevel) }} value={risk.level} onChange={e => updRisk(i, 'level', e.target.value)}>
                          <option value="niedrig">Niedrig</option>
                          <option value="mittel">Mittel</option>
                          <option value="hoch">Hoch</option>
                        </select>
                      : <Badge kind={risk.level === 'niedrig' ? 'success' : risk.level === 'mittel' ? 'warning' : 'danger'} dot>{risk.level}</Badge>}
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
          <button className="btn sm ghost" style={{ marginTop: 10 }} onClick={() => setRisks(r => [...r, emptyRisk()])}>
            <Ic name="plus" size={12} /> Risiko hinzufügen
          </button>
        )}

        {/* Gesamtnotizen */}
        {edit ? (
          <FormGrid cols={1}>
            <FormField label="Gesamtrisikoeinschätzung / Notizen">
              <textarea
                style={{ ...textareaStyle, marginTop: 12 }}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Übergeordnete Risikobeurteilung, Trends, Eskalationspfade…"
              />
            </FormField>
            <SaveError error={error} />
          </FormGrid>
        ) : master.overallRiskNotes ? (
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
            {master.overallRiskNotes}
          </div>
        ) : null}
      </SectionCard>

    </div>
  );
};

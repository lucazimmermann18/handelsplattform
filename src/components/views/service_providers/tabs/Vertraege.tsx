'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Badge } from '@/components/ui/primitives';
import { Ic } from '@/components/ui/icons';
import type { ServiceProvider } from '@/lib/types';
import type { ProviderMaster, ContractEntry, ContractStatus } from '../types';
import { CONTRACT_TYPES, CONTRACT_STATUS_MAP } from '../types';
import {
  SectionCard, SaveError, DeleteBtn, cellInput, thStyle, textareaStyle,
  useSectionSave,
} from '../shared';

interface TabProps { provider: ServiceProvider; master: ProviderMaster; onSaved: () => void; }

export const TabVertraege = ({ provider, master, onSaved }: TabProps) => {
  const { refresh } = useData();
  const { save, saving, error, setError } = useSectionSave(provider.id, refresh);

  const [edit, setEdit] = useState(false);
  const [contracts, setContracts] = useState<ContractEntry[]>(master.contracts ?? []);
  const [notes, setNotes] = useState(master.contractNotes ?? '');

  const emptyContract = (): ContractEntry => ({
    contractType: '', startDate: '', endDate: '', autoRenew: false,
    noticeDays: '', jurisdiction: '', status: 'fehlt', notes: '',
  });

  const contractExpiresSoon = (endDate: string) => {
    if (!endDate) return false;
    const days = Math.floor((new Date(endDate).getTime() - Date.now()) / 86400000);
    return days >= 0 && days < 60;
  };

  const contractExpired = (endDate: string) => {
    if (!endDate) return false;
    return new Date(endDate).getTime() < Date.now();
  };

  const enter = () => { setContracts(master.contracts ?? []); setNotes(master.contractNotes ?? ''); setEdit(true); setError(null); };
  const cancel = () => { setContracts(master.contracts ?? []); setNotes(master.contractNotes ?? ''); setEdit(false); setError(null); };

  const doSave = async () => {
    await save({ contracts, contractNotes: notes });
    setEdit(false);
    onSaved();
  };

  const update = (i: number, field: keyof ContractEntry, value: string | boolean) =>
    setContracts(cs => cs.map((c, idx) => idx === i ? { ...c, [field]: value } : c));

  const remove = (i: number) => setContracts(cs => cs.filter((_, idx) => idx !== i));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionCard
        icon="doc"
        title="Verträge & Vereinbarungen"
        badge={`${contracts.length} Verträge`}
        editMode={edit}
        onEdit={enter}
        onSave={doSave}
        onCancel={cancel}
        saving={saving}
      >
        {!edit && contracts.some(c => contractExpiresSoon(c.endDate) || contractExpired(c.endDate)) && (
          <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 12, color: '#f87171' }}>
            ⚠ Ein oder mehrere Verträge sind abgelaufen oder laufen bald ab.
          </div>
        )}

        {contracts.length === 0 && !edit ? (
          <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '10px 0' }}>
            Noch keine Verträge gepflegt.
            <button className="btn sm ghost" style={{ marginLeft: 8 }} onClick={enter}>
              <Ic name="plus" size={11} /> Jetzt pflegen
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '18%' }}>Vertragsart</th>
                <th style={{ ...thStyle, width: '10%' }}>Von</th>
                <th style={{ ...thStyle, width: '12%' }}>Bis</th>
                <th style={{ ...thStyle, width: '12%' }}>Status</th>
                <th style={{ ...thStyle, width: '10%' }}>Kündigung</th>
                <th style={{ ...thStyle, width: '13%' }}>Gericht</th>
                <th style={thStyle}>Notizen</th>
                {edit && <th style={{ ...thStyle, width: 36 }} />}
              </tr>
            </thead>
            <tbody>
              {contracts.map((c, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '5px 4px' }}>
                    {edit ? (
                      <select style={cellInput} value={c.contractType} onChange={e => update(i, 'contractType', e.target.value)}>
                        <option value="">— Typ —</option>
                        {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    ) : (
                      <span style={{ fontSize: 12.5 }}>{c.contractType || '—'}</span>
                    )}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {edit ? (
                      <input type="date" style={cellInput} value={c.startDate} onChange={e => update(i, 'startDate', e.target.value)} />
                    ) : (
                      <span style={{ fontSize: 12 }}>{c.startDate || '—'}</span>
                    )}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {edit ? (
                      <input type="date" style={cellInput} value={c.endDate} onChange={e => update(i, 'endDate', e.target.value)} />
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 12, color: contractExpired(c.endDate) ? '#f87171' : undefined }}>
                          {c.endDate || '—'}
                        </span>
                        {contractExpiresSoon(c.endDate) && !contractExpired(c.endDate) && (
                          <Badge kind="warning">Bald</Badge>
                        )}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {edit ? (
                      <select style={cellInput} value={c.status} onChange={e => update(i, 'status', e.target.value as ContractStatus)}>
                        {(Object.keys(CONTRACT_STATUS_MAP) as ContractStatus[]).map(s => (
                          <option key={s} value={s}>{CONTRACT_STATUS_MAP[s].label}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge kind={CONTRACT_STATUS_MAP[c.status]?.kind ?? 'neutral'}>
                        {CONTRACT_STATUS_MAP[c.status]?.label ?? c.status}
                      </Badge>
                    )}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {edit ? (
                      <input style={cellInput} value={c.noticeDays} onChange={e => update(i, 'noticeDays', e.target.value)} placeholder="Tage" />
                    ) : (
                      <span style={{ fontSize: 12 }}>{c.noticeDays ? `${c.noticeDays} Tage` : '—'}</span>
                    )}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {edit ? (
                      <input style={cellInput} value={c.jurisdiction} onChange={e => update(i, 'jurisdiction', e.target.value)} placeholder="z.B. DE" />
                    ) : (
                      <span style={{ fontSize: 12 }}>{c.jurisdiction || '—'}</span>
                    )}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {edit ? (
                      <input style={cellInput} value={c.notes} onChange={e => update(i, 'notes', e.target.value)} placeholder="Notizen…" />
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.notes || '—'}</span>
                    )}
                  </td>
                  {edit && (
                    <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                      <DeleteBtn onClick={() => remove(i)} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {edit && (
          <>
            <button
              className="btn sm ghost"
              style={{ marginTop: 10 }}
              onClick={() => setContracts(cs => [...cs, emptyContract()])}
            >
              <Ic name="plus" size={12} /> Vertrag hinzufügen
            </button>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 500 }}>Vertragsnotizen</div>
              <textarea style={textareaStyle} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Allgemeine Hinweise zu Verträgen…" />
            </div>
          </>
        )}

        {!edit && notes && (
          <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 500 }}>VERTRAGSNOTIZEN</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>{notes}</div>
          </div>
        )}

        <SaveError error={error} />
      </SectionCard>
    </div>
  );
};

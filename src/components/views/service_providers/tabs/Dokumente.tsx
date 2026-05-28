'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Badge } from '@/components/ui/primitives';
import { Ic } from '@/components/ui/icons';
import type { ServiceProvider } from '@/lib/types';
import type { ProviderMaster, DocEntry, DocStatus } from '../types';
import { DOC_TYPES, DOC_STATUS_MAP } from '../types';
import {
  SectionCard, SaveError, DeleteBtn, cellInput, thStyle, textareaStyle,
  useSectionSave,
} from '../shared';

interface TabProps { provider: ServiceProvider; master: ProviderMaster; onSaved: () => void; }

export const TabDokumente = ({ provider, master, onSaved }: TabProps) => {
  const { refresh } = useData();
  const { save, saving, error, setError } = useSectionSave(provider.id, refresh);

  const [edit, setEdit] = useState(false);
  const [documents, setDocuments] = useState<DocEntry[]>(master.documents ?? []);
  const [docNotes, setDocNotes] = useState(master.documentNotes ?? '');

  const emptyDoc = (): DocEntry => ({
    docType: '', status: 'fehlt', issueDate: '', expiryDate: '',
    verifiedBy: '', verifiedDate: '', notes: '', isCritical: false,
  });

  const missing = documents.filter(d => d.status === 'fehlt' || d.status === 'abgelaufen').length;
  const verified = documents.filter(d => d.status === 'geprüft').length;

  const docExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate).getTime() < Date.now();
  };

  const docExpiresSoon = (expiryDate: string) => {
    if (!expiryDate) return false;
    const days = Math.floor((new Date(expiryDate).getTime() - Date.now()) / 86400000);
    return days >= 0 && days < 30;
  };

  const enter = () => { setDocuments(master.documents ?? []); setDocNotes(master.documentNotes ?? ''); setEdit(true); setError(null); };
  const cancel = () => { setDocuments(master.documents ?? []); setDocNotes(master.documentNotes ?? ''); setEdit(false); setError(null); };

  const doSave = async () => {
    await save({ documents, documentNotes: docNotes });
    setEdit(false);
    onSaved();
  };

  const update = (i: number, field: keyof DocEntry, value: string | boolean) =>
    setDocuments(ds => ds.map((d, idx) => idx === i ? { ...d, [field]: value } : d));

  const remove = (i: number) => setDocuments(ds => ds.filter((_, idx) => idx !== i));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionCard
        icon="doc"
        title="Dokumente & Nachweise"
        badge={missing > 0 ? `${missing} fehlen` : undefined}
        editMode={edit}
        onEdit={enter}
        onSave={doSave}
        onCancel={cancel}
        saving={saving}
      >
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#34d399' }}>{verified} geprüft</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>·</div>
          <div style={{ fontSize: 12, color: missing > 0 ? '#f87171' : 'var(--text-3)' }}>{missing} fehlen / abgelaufen</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>·</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{documents.length} gesamt</div>
        </div>

        {documents.length === 0 && !edit ? (
          <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '10px 0' }}>
            Noch keine Dokumente gepflegt.
            <button className="btn sm ghost" style={{ marginLeft: 8 }} onClick={enter}>
              <Ic name="plus" size={11} /> Jetzt pflegen
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '20%' }}>Dokumententyp</th>
                <th style={{ ...thStyle, width: '12%' }}>Status</th>
                <th style={{ ...thStyle, width: '10%' }}>Ausgestellt</th>
                <th style={{ ...thStyle, width: '12%' }}>Ablauf</th>
                <th style={{ ...thStyle, width: '14%' }}>Geprüft von</th>
                <th style={thStyle}>Notizen</th>
                {edit && <th style={{ ...thStyle, width: 36 }} />}
              </tr>
            </thead>
            <tbody>
              {documents.map((d, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '5px 4px' }}>
                    {edit ? (
                      <select style={cellInput} value={d.docType} onChange={e => update(i, 'docType', e.target.value)}>
                        <option value="">— Typ —</option>
                        {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 12.5 }}>{d.docType || '—'}</span>
                        {d.isCritical && <Badge kind="danger">Kritisch</Badge>}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {edit ? (
                      <select style={cellInput} value={d.status} onChange={e => update(i, 'status', e.target.value as DocStatus)}>
                        {(Object.keys(DOC_STATUS_MAP) as DocStatus[]).map(s => (
                          <option key={s} value={s}>{DOC_STATUS_MAP[s].label}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge kind={DOC_STATUS_MAP[d.status]?.kind ?? 'neutral'}>
                        {DOC_STATUS_MAP[d.status]?.label ?? d.status}
                      </Badge>
                    )}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {edit ? (
                      <input type="date" style={cellInput} value={d.issueDate} onChange={e => update(i, 'issueDate', e.target.value)} />
                    ) : (
                      <span style={{ fontSize: 12 }}>{d.issueDate || '—'}</span>
                    )}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {edit ? (
                      <input type="date" style={cellInput} value={d.expiryDate} onChange={e => update(i, 'expiryDate', e.target.value)} />
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 12, color: docExpired(d.expiryDate) ? '#f87171' : docExpiresSoon(d.expiryDate) ? '#fbbf24' : undefined }}>
                          {d.expiryDate || '—'}
                        </span>
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {edit ? (
                      <input style={cellInput} value={d.verifiedBy} onChange={e => update(i, 'verifiedBy', e.target.value)} placeholder="Name…" />
                    ) : (
                      <span style={{ fontSize: 12 }}>{d.verifiedBy || '—'}</span>
                    )}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {edit ? (
                      <input style={cellInput} value={d.notes} onChange={e => update(i, 'notes', e.target.value)} placeholder="Notizen…" />
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{d.notes || '—'}</span>
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
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>SCHNELL HINZUFÜGEN</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {DOC_TYPES.map(dt => {
                  const exists = documents.some(d => d.docType === dt);
                  return (
                    <button
                      key={dt}
                      className={`btn sm ${exists ? 'primary' : 'ghost'}`}
                      style={{ fontSize: 11 }}
                      onClick={() => { if (!exists) setDocuments(ds => [...ds, { ...emptyDoc(), docType: dt }]); }}
                    >
                      {exists && <Ic name="check" size={10} />} {dt}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              className="btn sm ghost"
              style={{ marginTop: 10 }}
              onClick={() => setDocuments(ds => [...ds, emptyDoc()])}
            >
              <Ic name="plus" size={12} /> Zeile hinzufügen
            </button>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 500 }}>Dokumentennotizen</div>
              <textarea style={textareaStyle} value={docNotes} onChange={e => setDocNotes(e.target.value)} placeholder="Allgemeine Hinweise zu Dokumenten…" />
            </div>
          </>
        )}

        {!edit && docNotes && (
          <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 500 }}>DOKUMENTENNOTIZEN</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>{docNotes}</div>
          </div>
        )}

        <SaveError error={error} />
      </SectionCard>
    </div>
  );
};

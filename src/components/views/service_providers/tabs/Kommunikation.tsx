'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Badge } from '@/components/ui/primitives';
import type { ServiceProvider } from '@/lib/types';
import type { ProviderMaster, CommEntry, CommChannel } from '../types';
import {
  SectionCard, SaveError, DeleteBtn, cellInput, thStyle, useSectionSave,
} from '../shared';

interface TabProps { provider: ServiceProvider; master: ProviderMaster; onSaved: () => void; }

export const TabKommunikation = ({ provider, master, onSaved }: TabProps) => {
  const { refresh } = useData();
  const { save, saving, error, setError } = useSectionSave(provider.id, refresh);

  const [edit, setEdit] = useState(false);
  const [comms, setComms] = useState<CommEntry[]>(master.communications ?? []);

  const enter = () => {
    setComms(master.communications ?? []);
    setEdit(true);
    setError(null);
  };

  const cancel = () => { setEdit(false); setError(null); };

  const doSave = async () => {
    await save({ communications: comms });
    setEdit(false);
    onSaved();
  };

  const emptyComm = (): CommEntry => ({
    date: new Date().toISOString().slice(0, 10),
    channel: 'email',
    contactName: '',
    subject: '',
    summary: '',
    result: '',
    nextStep: '',
    author: '',
  });

  const channelIcon = (ch: CommChannel) => {
    const icons: Record<CommChannel, string> = {
      email: '✉',
      telefon: '☎',
      whatsapp: '📱',
      meeting: '🤝',
      videocall: '📹',
      besuch: '🏢',
      notiz: '📝',
    };
    return icons[ch] ?? '📝';
  };

  const channelKind = (ch: CommChannel) =>
    ch === 'whatsapp' ? 'success'
    : ch === 'email' ? 'info'
    : ch === 'meeting' || ch === 'besuch' ? 'warning'
    : 'neutral';

  const upd = (i: number, field: keyof CommEntry, val: string) =>
    setComms(cs => cs.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  return (
    <SectionCard
      icon="chat"
      title="Kommunikationshistorie"
      badge={comms.length ? `${comms.length} Einträge` : undefined}
      editMode={edit}
      onEdit={enter}
      onSave={doSave}
      onCancel={cancel}
      saving={saving}
    >
      {edit ? (
        <>
          {comms.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 110 }}>Datum</th>
                    <th style={{ ...thStyle, width: 110 }}>Kanal</th>
                    <th style={thStyle}>Kontakt</th>
                    <th style={thStyle}>Betreff</th>
                    <th style={thStyle}>Zusammenfassung</th>
                    <th style={thStyle}>Ergebnis</th>
                    <th style={thStyle}>Nächster Schritt</th>
                    <th style={{ ...thStyle, width: 28 }} />
                  </tr>
                </thead>
                <tbody>
                  {comms.map((c, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '4px 4px 4px 0' }}>
                        <input
                          type="date"
                          style={cellInput}
                          value={c.date}
                          onChange={e => upd(i, 'date', e.target.value)}
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <select
                          style={cellInput}
                          value={c.channel}
                          onChange={e => upd(i, 'channel', e.target.value)}
                        >
                          <option value="email">email</option>
                          <option value="telefon">telefon</option>
                          <option value="whatsapp">whatsapp</option>
                          <option value="meeting">meeting</option>
                          <option value="videocall">videocall</option>
                          <option value="besuch">besuch</option>
                          <option value="notiz">notiz</option>
                        </select>
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input
                          style={cellInput}
                          value={c.contactName}
                          onChange={e => upd(i, 'contactName', e.target.value)}
                          placeholder="Kontakt"
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input
                          style={cellInput}
                          value={c.subject}
                          onChange={e => upd(i, 'subject', e.target.value)}
                          placeholder="Betreff"
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input
                          style={cellInput}
                          value={c.summary}
                          onChange={e => upd(i, 'summary', e.target.value)}
                          placeholder="Zusammenfassung"
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input
                          style={cellInput}
                          value={c.result}
                          onChange={e => upd(i, 'result', e.target.value)}
                          placeholder="Ergebnis"
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input
                          style={cellInput}
                          value={c.nextStep}
                          onChange={e => upd(i, 'nextStep', e.target.value)}
                          placeholder="Nächster Schritt"
                        />
                      </td>
                      <td style={{ padding: '4px 0 4px 4px', textAlign: 'center' }}>
                        <DeleteBtn onClick={() => setComms(cs => cs.filter((_, j) => j !== i))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button
            className="btn sm ghost"
            style={{ marginTop: 10 }}
            onClick={() => setComms(cs => [...cs, emptyComm()])}
          >
            + Eintrag hinzufügen
          </button>
          <SaveError error={error} />
        </>
      ) : comms.length === 0 ? (
        <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
          Noch keine Kommunikation erfasst.
        </div>
      ) : (
        <>
          {[...comms].sort((a, b) => b.date.localeCompare(a.date)).map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: i < comms.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div style={{ fontSize: 20, flexShrink: 0, width: 32, textAlign: 'center', paddingTop: 2 }}>{channelIcon(c.channel)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.date}</span>
                  <Badge kind={channelKind(c.channel)}>{c.channel}</Badge>
                  {c.contactName && <span style={{ fontSize: 12, color: 'var(--text-2)' }}>mit {c.contactName}</span>}
                  {c.author && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>· {c.author}</span>}
                </div>
                {c.subject && <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{c.subject}</div>}
                {c.summary && <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 4 }}>{c.summary}</div>}
                <div style={{ display: 'flex', gap: 16, fontSize: 11.5 }}>
                  {c.result && <span style={{ color: '#34d399' }}>Ergebnis: {c.result}</span>}
                  {c.nextStep && <span style={{ color: '#fbbf24' }}>Nächster Schritt: {c.nextStep}</span>}
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </SectionCard>
  );
};

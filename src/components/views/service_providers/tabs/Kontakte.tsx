'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Badge } from '@/components/ui/primitives';
import type { ServiceProvider } from '@/lib/types';
import type { ProviderMaster, ContactPerson } from '../types';
import { CONTACT_ROLES } from '../types';
import {
  SectionCard, DeleteBtn, SaveError, cellInput, thStyle, useSectionSave,
} from '../shared';

interface TabProps { provider: ServiceProvider; master: ProviderMaster; onSaved: () => void; }

const emptyContact = (): ContactPerson => ({
  name: '', role: '', email: '', phone: '', whatsapp: '', language: '', isPrimary: false, canDecide: 'unklar', notes: '',
});

export const TabKontakte = ({ provider, master, onSaved }: TabProps) => {
  const { refresh } = useData();
  const { save, saving, error, setError } = useSectionSave(provider.id, refresh);

  const [edit, setEdit] = useState(false);
  const [contacts, setContacts] = useState<ContactPerson[]>(master.contacts ?? []);

  const enter = () => {
    setContacts(master.contacts ?? []);
    setEdit(true); setError(null);
  };

  const cancel = () => { setEdit(false); setError(null); };

  const doSave = async () => {
    await save({ contacts });
    setEdit(false);
    onSaved();
  };

  const upd = (i: number, field: keyof ContactPerson, val: string | boolean) =>
    setContacts(c => c.map((x, idx) => idx === i ? { ...x, [field]: val } : x));

  return (
    <SectionCard
      icon="person" title="Ansprechpartner"
      badge={contacts.length ? `${contacts.length} Kontakte` : undefined}
      editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
    >
      {edit ? (
        <>
          {contacts.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Rolle</th>
                    <th style={thStyle}>E-Mail</th>
                    <th style={thStyle}>Telefon</th>
                    <th style={thStyle}>WhatsApp</th>
                    <th style={thStyle}>Sprache</th>
                    <th style={thStyle}>Entscheid.</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Haupt</th>
                    <th style={{ ...thStyle, width: 28 }} />
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '4px 4px 4px 0' }}>
                        <input style={cellInput} value={c.name} onChange={e => upd(i, 'name', e.target.value)} placeholder="Name" />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <select style={cellInput} value={c.role} onChange={e => upd(i, 'role', e.target.value)}>
                          <option value="">— Rolle —</option>
                          {CONTACT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input style={cellInput} value={c.email} onChange={e => upd(i, 'email', e.target.value)} placeholder="E-Mail" />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input style={cellInput} value={c.phone} onChange={e => upd(i, 'phone', e.target.value)} placeholder="Telefon" />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input style={cellInput} value={c.whatsapp ?? ''} onChange={e => upd(i, 'whatsapp', e.target.value)} placeholder="WhatsApp" />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input style={cellInput} value={c.language ?? ''} onChange={e => upd(i, 'language', e.target.value)} placeholder="Sprache" />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <select style={cellInput} value={c.canDecide ?? 'unklar'} onChange={e => upd(i, 'canDecide', e.target.value)}>
                          <option value="ja">ja</option>
                          <option value="nein">nein</option>
                          <option value="teilweise">teilweise</option>
                          <option value="unklar">unklar</option>
                        </select>
                      </td>
                      <td style={{ padding: '4px', textAlign: 'center' }}>
                        <input type="checkbox" checked={!!c.isPrimary} onChange={e => upd(i, 'isPrimary', e.target.checked)} />
                      </td>
                      <td style={{ padding: '4px 0 4px 4px', textAlign: 'center' }}>
                        <DeleteBtn onClick={() => setContacts(c => c.filter((_, j) => j !== i))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button className="btn sm ghost" style={{ marginTop: 10 }} onClick={() => setContacts(c => [...c, emptyContact()])}>
            + Kontakt hinzufügen
          </button>
          <SaveError error={error} />
        </>
      ) : contacts.length === 0 ? (
        <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
          Noch keine Ansprechpartner erfasst.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {contacts.map((c, i) => (
            <div key={i} style={{ padding: '12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name || '—'}</div>
                {c.isPrimary && <Badge kind="success">Haupt</Badge>}
                {c.isEmergency && <Badge kind="warning">Notfall</Badge>}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 4 }}>{c.role || '—'}</div>
              {c.email && <div style={{ fontSize: 12 }}>✉ {c.email}</div>}
              {c.phone && <div style={{ fontSize: 12 }}>☎ {c.phone}</div>}
              {c.whatsapp && <div style={{ fontSize: 12 }}>📱 {c.whatsapp}</div>}
              <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {c.language && <Badge>{c.language}</Badge>}
                {c.canDecide && c.canDecide !== 'unklar' && <Badge kind={c.canDecide === 'ja' ? 'success' : 'warning'}>Entscheidung: {c.canDecide}</Badge>}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
};

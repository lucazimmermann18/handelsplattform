'use client';
import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import type { Product } from '@/lib/types';
import type { ProductMaster } from '../types';
import { SectionCard, DeleteBtn, SaveError, cellInput, thStyle, labelStyle } from '../shared';
import type { RequiredDoc } from '@/lib/types';

const QUICK_TYPES = [
  'Handelsrechnung', 'Packliste', 'Ursprungszeugnis', 'EUR.1 / Ursprungserklärung',
  'Lieferantenerklärung', 'Bill of Lading', 'Versicherungszertifikat',
  'Phytosanitär-Zertifikat', 'Veterinärzertifikat', 'Analysezertifikat',
  'Qualitätszertifikat', 'Sicherheitsdatenblatt', 'Konformitätserklärung',
  'CE-Dokumentation', 'Organic Certificate', 'Fairtrade Certificate',
  'Rainforest Alliance Certificate',
];

const emptyDoc = (): RequiredDoc => ({ docType: '', markets: '', mandatory: false, notes: '' });

interface TabProps { product: Product; master: ProductMaster; onSaved: () => void; }

export function TabDokumente({ product, onSaved }: TabProps) {
  const { refresh } = useData();
  const [docs, setDocs] = useState<RequiredDoc[]>(product.requiredDocs ?? []);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enter = () => { setDocs(product.requiredDocs ?? []); setEditMode(true); setError(null); };
  const cancel = () => { setDocs(product.requiredDocs ?? []); setEditMode(false); setError(null); };

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const { error: sbErr } = await sb.from('products').update({ required_docs: docs }).eq('id', product.id);
      if (sbErr) throw new Error(sbErr.message);
      refresh();
      setEditMode(false);
      onSaved();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  const update = (i: number, field: keyof RequiredDoc, value: string | boolean) =>
    setDocs(d => d.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const remove = (i: number) => setDocs(d => d.filter((_, idx) => idx !== i));

  const addQuick = (docType: string) => {
    if (docs.some(d => d.docType === docType)) return;
    setDocs(d => [...d, { ...emptyDoc(), docType }]);
    if (!editMode) setEditMode(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionCard
        icon="file-text"
        title="Pflichtdokumente"
        badge={docs.length ? `${docs.length} Dokumente` : undefined}
        editMode={editMode}
        onEdit={enter}
        onSave={save}
        onCancel={cancel}
        saving={saving}
      >
        {editMode && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...labelStyle, marginBottom: 6 }}>Schnell hinzufügen</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {QUICK_TYPES.map(qt => {
                const active = docs.some(d => d.docType === qt);
                return (
                  <button
                    key={qt}
                    className={`btn sm ${active ? 'primary' : 'ghost'}`}
                    onClick={() => addQuick(qt)}
                    style={{ fontSize: 11 }}
                  >
                    {active && <Ic name="check" size={10} />} {qt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {docs.length === 0 && !editMode ? (
          <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '10px 0' }}>
            Noch keine Pflichtdokumente gepflegt.
            <button className="btn sm ghost" style={{ marginLeft: 8 }} onClick={enter}>
              <Ic name="plus" size={11} /> Jetzt pflegen
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '28%' }}>Dokument</th>
                <th style={{ ...thStyle, width: '22%' }}>Märkte</th>
                <th style={{ ...thStyle, width: '12%' }}>Pflicht</th>
                <th style={thStyle}>Hinweise</th>
                {editMode && <th style={{ ...thStyle, width: 36 }} />}
              </tr>
            </thead>
            <tbody>
              {docs.map((doc, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '5px 4px' }}>
                    {editMode
                      ? <input style={cellInput} value={doc.docType} onChange={e => update(i, 'docType', e.target.value)} placeholder="Dokumententyp" />
                      : <span style={{ fontSize: 12.5 }}>{doc.docType}</span>}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {editMode
                      ? <input style={cellInput} value={doc.markets} onChange={e => update(i, 'markets', e.target.value)} placeholder="z.B. EU, USA" />
                      : <span style={{ fontSize: 12 }}>{doc.markets || '—'}</span>}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {editMode
                      ? <input type="checkbox" checked={doc.mandatory} onChange={e => update(i, 'mandatory', e.target.checked)} style={{ accentColor: '#60a5fa' }} />
                      : <Badge kind={doc.mandatory ? 'danger' : 'neutral'}>{doc.mandatory ? 'Pflicht' : 'Optional'}</Badge>}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {editMode
                      ? <input style={cellInput} value={doc.notes} onChange={e => update(i, 'notes', e.target.value)} placeholder="Hinweise…" />
                      : <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{doc.notes || '—'}</span>}
                  </td>
                  {editMode && (
                    <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                      <DeleteBtn onClick={() => remove(i)} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {editMode && (
          <button
            className="btn sm ghost"
            style={{ marginTop: 10 }}
            onClick={() => setDocs(d => [...d, emptyDoc()])}
          >
            <Ic name="plus" size={12} /> Zeile hinzufügen
          </button>
        )}

        <SaveError error={error} />
      </SectionCard>
    </div>
  );
}

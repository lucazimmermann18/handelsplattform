'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Badge } from '@/components/ui/primitives';
import { Ic } from '@/components/ui/icons';
import type { Supplier } from '@/lib/types';
import type { SupplierMaster, CertEntry, DocLevel } from '../types';
import { DOC_LEVEL_MAP } from '../types';
import {
  SectionCard, FormField, FormGrid, FieldRow, CheckFlag,
  DeleteBtn, SaveError, inputStyle, textareaStyle, cellInput, thStyle, useSectionSave,
} from '../shared';

interface TabProps { supplier: Supplier; master: SupplierMaster; onSaved: () => void; }

const emptyCert = (): CertEntry => ({ name: '', issuer: '', validFrom: '', validUntil: '', docLevel: 2, notes: '' });

const certStatus = (validUntil: string): { kind: string; label: string } => {
  if (!validUntil) return { kind: 'neutral', label: 'Kein Datum' };
  const days = Math.floor((new Date(validUntil).getTime() - Date.now()) / 86400000);
  if (days < 0)  return { kind: 'danger',  label: 'Abgelaufen' };
  if (days < 60) return { kind: 'warning', label: `${days}d` };
  return { kind: 'success', label: 'Gültig' };
};

export const TabCompliance = ({ supplier, master, onSaved }: TabProps) => {
  const { refresh } = useData();
  const { save, saving, error, setError } = useSectionSave(supplier.id, refresh);

  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<Partial<SupplierMaster>>({});
  const [certs, setCerts] = useState<CertEntry[]>(master.certs ?? []);

  const enter = () => {
    setCerts(master.certs ?? []);
    setForm({
      docLevel:            master.docLevel,
      exportLicense:       master.exportLicense ?? '',
      exportLicenseExpiry: master.exportLicenseExpiry ?? '',
      bankVerified:        master.bankVerified ?? false,
      taxIdVerified:       master.taxIdVerified ?? false,
      registrationVerified: master.registrationVerified ?? false,
      complianceNotes:     master.complianceNotes ?? '',
    });
    setEdit(true); setError(null);
  };

  const cancel = () => { setEdit(false); setError(null); };

  const doSave = async () => {
    await save({ ...form, certs });
    setEdit(false);
    onSaved();
  };

  const set = (k: keyof SupplierMaster, v: string | boolean | number | undefined) =>
    setForm(f => ({ ...f, [k]: v }));

  const updCert = (i: number, field: keyof CertEntry, val: string | number) =>
    setCerts(c => c.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  const dl = edit ? (form.docLevel as DocLevel | undefined) : master.docLevel;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Dokument-Level */}
      <SectionCard
        icon="shield" title="Dokumentenstatus & Verifizierungen"
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
      >
        {/* Doc Level Indicator */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500 }}>DOKUMENTENSTATUS-LEVEL</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {([1, 2, 3, 4] as DocLevel[]).map(level => {
              const info = DOC_LEVEL_MAP[level];
              const active = dl === level;
              return (
                <div
                  key={level}
                  onClick={() => edit && set('docLevel', level)}
                  style={{
                    padding: '10px 10px', borderRadius: 8, cursor: edit ? 'pointer' : 'default',
                    background: active ? `rgba(${level === 1 ? '52,211,153' : level === 2 ? '251,191,36' : level === 3 ? '96,165,250' : '248,113,113'},0.12)` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? (level === 1 ? '#34d399' : level === 2 ? '#fbbf24' : level === 3 ? '#60a5fa' : '#f87171') : 'rgba(255,255,255,0.07)'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 3, color: active ? 'var(--text)' : 'var(--text-3)' }}>Level {level}</div>
                  <Badge kind={info.kind}>{level === 1 ? 'Vollständig' : level === 2 ? 'Teilweise' : level === 3 ? 'Lokal' : 'Unbestätigt'}</Badge>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 5, lineHeight: 1.4 }}>{info.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12 }}>
          {edit ? (
            <FormGrid cols={2}>
              <FormField label="Exportlizenz-Nr.">
                <input style={inputStyle} value={form.exportLicense ?? ''} onChange={e => set('exportLicense', e.target.value)} placeholder="z.B. TZ-EXP-2024-1234" />
              </FormField>
              <FormField label="Exportlizenz gültig bis">
                <input type="date" style={inputStyle} value={form.exportLicenseExpiry ?? ''} onChange={e => set('exportLicenseExpiry', e.target.value)} />
              </FormField>
              <FormField label="Verifikationen" full>
                <CheckFlag label="Bankverbindung verifiziert"   value={!!form.bankVerified}        onChange={v => set('bankVerified', v)}        editMode />
                <CheckFlag label="Steuer-ID (TIN) verifiziert"  value={!!form.taxIdVerified}       onChange={v => set('taxIdVerified', v)}       editMode />
                <CheckFlag label="Handelsregister verifiziert"  value={!!form.registrationVerified} onChange={v => set('registrationVerified', v)} editMode />
              </FormField>
              <FormField label="Compliance-Notizen" full>
                <textarea style={textareaStyle} value={form.complianceNotes ?? ''} onChange={e => set('complianceNotes', e.target.value)} placeholder="Besonderheiten, offene Punkte, nächste Schritte…" />
              </FormField>
            </FormGrid>
          ) : (
            <div className="fields">
              <FieldRow label="Exportlizenz"      value={master.exportLicense} />
              <FieldRow label="Exportlizenz bis"  value={master.exportLicenseExpiry} />
              <div className="l">Bank verifiziert</div>
              <div className="v">{master.bankVerified ? <Badge kind="success">✓ Verifiziert</Badge> : <Badge kind="neutral">Ausstehend</Badge>}</div>
              <div className="l">Steuer-ID (TIN)</div>
              <div className="v">{master.taxIdVerified ? <Badge kind="success">✓ Verifiziert</Badge> : <Badge kind="neutral">Ausstehend</Badge>}</div>
              <div className="l">Handelsregister</div>
              <div className="v">{master.registrationVerified ? <Badge kind="success">✓ Verifiziert</Badge> : <Badge kind="neutral">Ausstehend</Badge>}</div>
              <FieldRow label="Compliance-Notizen" value={master.complianceNotes} />
            </div>
          )}
        </div>
        <SaveError error={error} />
      </SectionCard>

      {/* Zertifikate */}
      <SectionCard
        icon="leaf" title="Zertifikate & Gültigkeiten"
        badge={certs.length ? `${certs.length} Zertifikate` : undefined}
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
        empty={!master.certs || master.certs.length === 0}
        emptyText="Noch keine Zertifikate erfasst."
      >
        {certs.length > 0 || edit ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '22%' }}>Zertifikat</th>
                <th style={{ ...thStyle, width: '18%' }}>Aussteller</th>
                <th style={{ ...thStyle, width: '12%' }}>Gültig von</th>
                <th style={{ ...thStyle, width: '12%' }}>Gültig bis</th>
                <th style={{ ...thStyle, width: '10%' }}>Status</th>
                <th style={thStyle}>Hinweise</th>
                {edit && <th style={{ ...thStyle, width: 36 }} />}
              </tr>
            </thead>
            <tbody>
              {certs.map((cert, i) => {
                const st = certStatus(cert.validUntil);
                return (
                  <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '5px 4px' }}>
                      {edit
                        ? <input style={cellInput} value={cert.name} onChange={e => updCert(i, 'name', e.target.value)} placeholder="z.B. Organic" />
                        : <span style={{ fontSize: 12.5, fontWeight: 500 }}>{cert.name}</span>}
                    </td>
                    <td style={{ padding: '5px 4px' }}>
                      {edit
                        ? <input style={cellInput} value={cert.issuer} onChange={e => updCert(i, 'issuer', e.target.value)} placeholder="z.B. KRAV" />
                        : <span style={{ fontSize: 12 }}>{cert.issuer || '—'}</span>}
                    </td>
                    <td style={{ padding: '5px 4px' }}>
                      {edit
                        ? <input type="date" style={cellInput} value={cert.validFrom} onChange={e => updCert(i, 'validFrom', e.target.value)} />
                        : <span className="mono" style={{ fontSize: 11 }}>{cert.validFrom || '—'}</span>}
                    </td>
                    <td style={{ padding: '5px 4px' }}>
                      {edit
                        ? <input type="date" style={cellInput} value={cert.validUntil} onChange={e => updCert(i, 'validUntil', e.target.value)} />
                        : <span className="mono" style={{ fontSize: 11 }}>{cert.validUntil || '—'}</span>}
                    </td>
                    <td style={{ padding: '5px 4px' }}>
                      {!edit && <Badge kind={st.kind} dot>{st.label}</Badge>}
                    </td>
                    <td style={{ padding: '5px 4px' }}>
                      {edit
                        ? <input style={cellInput} value={cert.notes} onChange={e => updCert(i, 'notes', e.target.value)} placeholder="Hinweise…" />
                        : <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{cert.notes || '—'}</span>}
                    </td>
                    {edit && (
                      <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                        <DeleteBtn onClick={() => setCerts(c => c.filter((_, j) => j !== i))} />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
        {edit && (
          <button
            className="btn sm ghost"
            style={{ marginTop: 10 }}
            onClick={() => setCerts(c => [...c, emptyCert()])}
          >
            <Ic name="plus" size={12} /> Zertifikat hinzufügen
          </button>
        )}
      </SectionCard>

    </div>
  );
};

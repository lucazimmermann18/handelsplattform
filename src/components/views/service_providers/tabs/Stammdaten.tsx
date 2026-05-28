'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import type { ServiceProvider } from '@/lib/types';
import type { ProviderMaster } from '../types';
import {
  SectionCard, FormField, FormGrid, FieldRow, CheckFlag,
  SaveError, inputStyle, textareaStyle, useSectionSave,
} from '../shared';

interface TabProps { provider: ServiceProvider; master: ProviderMaster; onSaved: () => void; }

export const TabStammdaten = ({ provider, master, onSaved }: TabProps) => {
  const { refresh } = useData();
  const { save, saving, error, setError } = useSectionSave(provider.id, refresh);

  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<Partial<ProviderMaster>>({});

  const enter = () => {
    setForm({
      legalName: master.legalName ?? '',
      legalForm: master.legalForm ?? '',
      founded: master.founded ?? '',
      employees: master.employees ?? '',
      vatId: master.vatId ?? '',
      eoriNumber: master.eoriNumber ?? '',
      dunsNumber: master.dunsNumber ?? '',
      description: master.description ?? '',
      internalNotes: master.internalNotes ?? '',
      bankName: master.bankName ?? '',
      bankAccountHolder: master.bankAccountHolder ?? '',
      iban: master.iban ?? '',
      swiftBic: master.swiftBic ?? '',
      bankCountry: master.bankCountry ?? '',
      paymentCurrency: master.paymentCurrency ?? '',
      paymentTermDays: master.paymentTermDays ?? '',
      paymentMethod: master.paymentMethod ?? '',
      bankVerified: master.bankVerified ?? false,
      bankVerifiedBy: master.bankVerifiedBy ?? '',
      bankVerifiedDate: master.bankVerifiedDate ?? '',
    });
    setEdit(true);
    setError(null);
  };

  const cancel = () => { setEdit(false); setError(null); };

  const doSave = async () => { await save(form); setEdit(false); onSaved(); };

  const set = (k: keyof ProviderMaster, v: string | boolean | number | undefined) =>
    setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      <SectionCard
        icon="building" title="Firmendaten & Registrierung"
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
      >
        {edit ? (
          <FormGrid cols={2}>
            <FormField label="Rechtlicher Firmenname">
              <input style={inputStyle} value={form.legalName ?? ''} onChange={e => set('legalName', e.target.value)} />
            </FormField>
            <FormField label="Rechtsform">
              <select style={inputStyle} value={form.legalForm ?? ''} onChange={e => set('legalForm', e.target.value)}>
                <option value="">— Auswählen —</option>
                <option value="GmbH">GmbH</option>
                <option value="Ltd">Ltd</option>
                <option value="Sole Trader">Sole Trader</option>
                <option value="AG">AG</option>
                <option value="other">Sonstige</option>
              </select>
            </FormField>
            <FormField label="Gründungsjahr">
              <input style={inputStyle} value={form.founded ?? ''} onChange={e => set('founded', e.target.value)} placeholder="z.B. 2010" />
            </FormField>
            <FormField label="Mitarbeiter">
              <input style={inputStyle} value={form.employees ?? ''} onChange={e => set('employees', e.target.value)} placeholder="z.B. 25" />
            </FormField>
            <FormField label="VAT-ID / Umsatzsteuer-ID">
              <input style={inputStyle} value={form.vatId ?? ''} onChange={e => set('vatId', e.target.value)} />
            </FormField>
            <FormField label="EORI-Nummer">
              <input style={inputStyle} value={form.eoriNumber ?? ''} onChange={e => set('eoriNumber', e.target.value)} />
            </FormField>
            <FormField label="D-U-N-S Number">
              <input style={inputStyle} value={form.dunsNumber ?? ''} onChange={e => set('dunsNumber', e.target.value)} />
            </FormField>
            <FormField label="Unternehmensbeschreibung" full>
              <textarea style={textareaStyle} value={form.description ?? ''} onChange={e => set('description', e.target.value)} />
            </FormField>
            <FormField label="Interne Notizen" full>
              <textarea style={textareaStyle} value={form.internalNotes ?? ''} onChange={e => set('internalNotes', e.target.value)} />
            </FormField>
            <SaveError error={error} />
          </FormGrid>
        ) : (
          <div className="fields">
            <FieldRow label="Rechtlicher Firmenname" value={master.legalName} />
            <FieldRow label="Rechtsform" value={master.legalForm} />
            <FieldRow label="Gründungsjahr" value={master.founded} />
            <FieldRow label="Mitarbeiter" value={master.employees} />
            <FieldRow label="VAT-ID / Umsatzsteuer-ID" value={master.vatId} />
            <FieldRow label="EORI-Nummer" value={master.eoriNumber} />
            <FieldRow label="D-U-N-S Number" value={master.dunsNumber} />
            <FieldRow label="Unternehmensbeschreibung" value={master.description} />
            <FieldRow label="Interne Notizen" value={master.internalNotes} />
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon="finance" title="Bankdaten & Zahlung"
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
      >
        <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 12, color: '#fbbf24' }}>
          ⚠ Bankdaten sind sensibel. Änderungen müssen telefonisch verifiziert werden.
        </div>
        {edit ? (
          <FormGrid cols={2}>
            <FormField label="Bankname">
              <input style={inputStyle} value={form.bankName ?? ''} onChange={e => set('bankName', e.target.value)} />
            </FormField>
            <FormField label="Kontoinhaber">
              <input style={inputStyle} value={form.bankAccountHolder ?? ''} onChange={e => set('bankAccountHolder', e.target.value)} />
            </FormField>
            <FormField label="IBAN">
              <input style={inputStyle} value={form.iban ?? ''} onChange={e => set('iban', e.target.value)} />
            </FormField>
            <FormField label="SWIFT / BIC">
              <input style={inputStyle} value={form.swiftBic ?? ''} onChange={e => set('swiftBic', e.target.value)} />
            </FormField>
            <FormField label="Bankland">
              <input style={inputStyle} value={form.bankCountry ?? ''} onChange={e => set('bankCountry', e.target.value)} />
            </FormField>
            <FormField label="Zahlungswährung">
              <input style={inputStyle} value={form.paymentCurrency ?? ''} onChange={e => set('paymentCurrency', e.target.value)} placeholder="z.B. EUR" />
            </FormField>
            <FormField label="Zahlungsziel (Tage)">
              <input style={inputStyle} value={form.paymentTermDays ?? ''} onChange={e => set('paymentTermDays', e.target.value)} placeholder="z.B. 30" />
            </FormField>
            <FormField label="Zahlungsmethode">
              <input style={inputStyle} value={form.paymentMethod ?? ''} onChange={e => set('paymentMethod', e.target.value)} placeholder="z.B. Überweisung, PayPal" />
            </FormField>
            <div style={{ gridColumn: '1 / -1' }}>
              <CheckFlag
                label="Bank verifiziert"
                value={!!form.bankVerified}
                onChange={v => set('bankVerified', v)}
                editMode={edit}
              />
            </div>
            <FormField label="Verifiziert von">
              <input style={inputStyle} value={form.bankVerifiedBy ?? ''} onChange={e => set('bankVerifiedBy', e.target.value)} />
            </FormField>
            <FormField label="Verifizierungsdatum">
              <input style={inputStyle} value={form.bankVerifiedDate ?? ''} onChange={e => set('bankVerifiedDate', e.target.value)} placeholder="YYYY-MM-DD" />
            </FormField>
            <SaveError error={error} />
          </FormGrid>
        ) : (
          <div className="fields">
            <FieldRow label="Bankname" value={master.bankName} />
            <FieldRow label="Kontoinhaber" value={master.bankAccountHolder} />
            <div className="l">IBAN</div>
            <div className="v" style={{ fontFamily: 'monospace', fontSize: 12.5 }}>{master.iban || '—'}</div>
            <FieldRow label="SWIFT / BIC" value={master.swiftBic} />
            <FieldRow label="Bankland" value={master.bankCountry} />
            <FieldRow label="Zahlungswährung" value={master.paymentCurrency} />
            <FieldRow label="Zahlungsziel (Tage)" value={master.paymentTermDays} />
            <FieldRow label="Zahlungsmethode" value={master.paymentMethod} />
            <div className="l">Bank verifiziert</div>
            <div className="v">
              <CheckFlag label="Bank verifiziert" value={!!master.bankVerified} editMode={false} />
            </div>
            {master.bankVerified && (
              <>
                <FieldRow label="Verifiziert von" value={master.bankVerifiedBy} />
                <FieldRow label="Verifizierungsdatum" value={master.bankVerifiedDate} />
              </>
            )}
          </div>
        )}
      </SectionCard>

    </div>
  );
};

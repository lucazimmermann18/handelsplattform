'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import type { ServiceProvider } from '@/lib/types';
import type { ProviderMaster, PricingItem } from '../types';
import { PRICING_MODELS } from '../types';
import {
  SectionCard, FormField, FormGrid, FieldRow, CheckFlag, DeleteBtn,
  SaveError, inputStyle, textareaStyle, cellInput, thStyle, useSectionSave,
} from '../shared';

interface TabProps { provider: ServiceProvider; master: ProviderMaster; onSaved: () => void; }

const emptyPricing = (): PricingItem => ({
  serviceType: '', model: 'Fixpreis', amount: '', currency: 'EUR', unit: '', notes: '',
});

export const TabPreise = ({ provider, master, onSaved }: TabProps) => {
  const { refresh } = useData();
  const { save, saving, error, setError } = useSectionSave(provider.id, refresh);

  const [edit, setEdit] = useState(false);
  const [pricing, setPricing] = useState<PricingItem[]>(master.pricing ?? []);
  const [form, setForm] = useState<Partial<ProviderMaster>>({});

  const enter = () => {
    setPricing(master.pricing ?? []);
    setForm({
      paymentTermDays:        master.paymentTermDays ?? '',
      paymentMethod:          master.paymentMethod ?? '',
      priceCurrency:          master.priceCurrency ?? '',
      priceValidUntil:        master.priceValidUntil ?? '',
      advancePaymentRequired: master.advancePaymentRequired ?? false,
      reverseChargeRelevant:  master.reverseChargeRelevant ?? false,
      pricingNotes:           master.pricingNotes ?? '',
    });
    setEdit(true); setError(null);
  };

  const cancel = () => { setEdit(false); setError(null); };

  const doSave = async () => {
    await save({ ...form, pricing });
    setEdit(false);
    onSaved();
  };

  const set = (k: keyof ProviderMaster, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const updPricing = (i: number, field: keyof PricingItem, val: string) =>
    setPricing(p => p.map((x, idx) => idx === i ? { ...x, [field]: val } : x));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      <SectionCard
        icon="finance" title="Preistabelle"
        badge={pricing.length ? `${pricing.length} Positionen` : undefined}
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
      >
        {edit ? (
          <>
            {pricing.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Leistung</th>
                      <th style={thStyle}>Modell</th>
                      <th style={thStyle}>Betrag</th>
                      <th style={thStyle}>Währung</th>
                      <th style={thStyle}>Einheit</th>
                      <th style={thStyle}>Hinweise</th>
                      <th style={{ ...thStyle, width: 28 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {pricing.map((p, i) => (
                      <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '4px 4px 4px 0' }}>
                          <input style={cellInput} value={p.serviceType} onChange={e => updPricing(i, 'serviceType', e.target.value)} placeholder="Leistung" />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <select style={cellInput} value={p.model} onChange={e => updPricing(i, 'model', e.target.value)}>
                            {PRICING_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input style={cellInput} value={p.amount} onChange={e => updPricing(i, 'amount', e.target.value)} placeholder="0.00" />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input style={cellInput} value={p.currency} onChange={e => updPricing(i, 'currency', e.target.value)} placeholder="EUR" />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input style={cellInput} value={p.unit} onChange={e => updPricing(i, 'unit', e.target.value)} placeholder="Einheit" />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input style={cellInput} value={p.notes} onChange={e => updPricing(i, 'notes', e.target.value)} placeholder="Hinweise" />
                        </td>
                        <td style={{ padding: '4px 0 4px 4px', textAlign: 'center' }}>
                          <DeleteBtn onClick={() => setPricing(p => p.filter((_, j) => j !== i))} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button className="btn sm ghost" style={{ marginTop: 10 }} onClick={() => setPricing(p => [...p, emptyPricing()])}>
              + Position hinzufügen
            </button>
            <SaveError error={error} />
          </>
        ) : pricing.length === 0 ? (
          <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
            Noch keine Preispositionen erfasst.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Leistung</th>
                <th style={thStyle}>Modell</th>
                <th style={thStyle}>Betrag</th>
                <th style={thStyle}>Währung</th>
                <th style={thStyle}>Einheit</th>
                <th style={thStyle}>Hinweise</th>
              </tr>
            </thead>
            <tbody>
              {pricing.map((p, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '5px 4px 5px 0', fontSize: 12 }}>{p.serviceType || '—'}</td>
                  <td style={{ padding: '5px 4px', fontSize: 12 }}>{p.model}</td>
                  <td style={{ padding: '5px 4px', fontSize: 12 }}>{p.amount || '—'}</td>
                  <td style={{ padding: '5px 4px', fontSize: 12 }}>{p.currency}</td>
                  <td style={{ padding: '5px 4px', fontSize: 12 }}>{p.unit || '—'}</td>
                  <td style={{ padding: '5px 0', fontSize: 12, color: 'var(--text-3)' }}>{p.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      <SectionCard
        icon="doc" title="Zahlungskonditionen"
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
      >
        {edit ? (
          <FormGrid cols={2}>
            <FormField label="Zahlungsziel in Tagen">
              <input style={inputStyle} value={form.paymentTermDays ?? ''} onChange={e => set('paymentTermDays', e.target.value)} placeholder="z.B. 30" />
            </FormField>
            <FormField label="Zahlungsart">
              <select style={inputStyle} value={form.paymentMethod ?? ''} onChange={e => set('paymentMethod', e.target.value)}>
                <option value="">— Auswählen —</option>
                <option value="Überweisung">Überweisung</option>
                <option value="L/C">L/C</option>
                <option value="D/A">D/A</option>
                <option value="D/P">D/P</option>
                <option value="Open Account">Open Account</option>
              </select>
            </FormField>
            <FormField label="Währung">
              <select style={inputStyle} value={form.priceCurrency ?? ''} onChange={e => set('priceCurrency', e.target.value)}>
                <option value="">— Auswählen —</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="TZS">TZS</option>
                <option value="GBP">GBP</option>
              </select>
            </FormField>
            <FormField label="Preis gültig bis">
              <input type="date" style={inputStyle} value={form.priceValidUntil ?? ''} onChange={e => set('priceValidUntil', e.target.value)} />
            </FormField>
            <div style={{ gridColumn: '1 / -1' }}>
              <CheckFlag
                label="Vorauszahlung erforderlich"
                value={!!form.advancePaymentRequired}
                onChange={v => set('advancePaymentRequired', v)}
                editMode={true}
              />
              <CheckFlag
                label="Reverse Charge relevant"
                value={!!form.reverseChargeRelevant}
                onChange={v => set('reverseChargeRelevant', v)}
                editMode={true}
              />
            </div>
            <FormField label="Preisnotizen" full>
              <textarea style={textareaStyle} value={form.pricingNotes ?? ''} onChange={e => set('pricingNotes', e.target.value)} placeholder="Konditionsdetails, Rabatte, Sonderregelungen…" />
            </FormField>
            <SaveError error={error} />
          </FormGrid>
        ) : (
          <div className="fields">
            <FieldRow label="Zahlungsziel" value={master.paymentTermDays ? `${master.paymentTermDays} Tage` : undefined} />
            <FieldRow label="Zahlungsart" value={master.paymentMethod} />
            <FieldRow label="Währung" value={master.priceCurrency} />
            <FieldRow label="Preis gültig bis" value={master.priceValidUntil} />
            <div className="l">Vorauszahlung</div>
            <div className="v">
              <CheckFlag label="Vorauszahlung erforderlich" value={!!master.advancePaymentRequired} onChange={() => {}} editMode={false} />
            </div>
            <div className="l">Reverse Charge</div>
            <div className="v">
              <CheckFlag label="Reverse Charge relevant" value={!!master.reverseChargeRelevant} onChange={() => {}} editMode={false} />
            </div>
            <FieldRow label="Notizen" value={master.pricingNotes} />
          </div>
        )}
      </SectionCard>

    </div>
  );
};

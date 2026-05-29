'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { t } from '@/lib/i18n';
import { useLang } from '@/lib/lang-context';
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
  const lang = useLang();
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
        icon="finance" title={t(lang, 'sp_preise_table_title')}
        badge={pricing.length ? `${pricing.length} ${t(lang, 'sp_preise_positions')}` : undefined}
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
      >
        {edit ? (
          <>
            {pricing.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>{t(lang, 'sp_preise_service')}</th>
                      <th style={thStyle}>{t(lang, 'sp_preise_model')}</th>
                      <th style={thStyle}>{t(lang, 'sp_preise_amount')}</th>
                      <th style={thStyle}>{t(lang, 'sp_preise_currency')}</th>
                      <th style={thStyle}>{t(lang, 'sp_preise_unit')}</th>
                      <th style={thStyle}>{t(lang, 'sp_preise_notes')}</th>
                      <th style={{ ...thStyle, width: 28 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {pricing.map((p, i) => (
                      <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '4px 4px 4px 0' }}>
                          <input style={cellInput} value={p.serviceType} onChange={e => updPricing(i, 'serviceType', e.target.value)} placeholder={t(lang, 'sp_preise_service')} />
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
                          <input style={cellInput} value={p.unit} onChange={e => updPricing(i, 'unit', e.target.value)} placeholder={t(lang, 'sp_preise_unit')} />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input style={cellInput} value={p.notes} onChange={e => updPricing(i, 'notes', e.target.value)} placeholder={t(lang, 'sp_preise_notes')} />
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
              {t(lang, 'sp_preise_add')}
            </button>
            <SaveError error={error} />
          </>
        ) : pricing.length === 0 ? (
          <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
            {t(lang, 'sp_preise_no_data')}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>{t(lang, 'sp_preise_service')}</th>
                <th style={thStyle}>{t(lang, 'sp_preise_model')}</th>
                <th style={thStyle}>{t(lang, 'sp_preise_amount')}</th>
                <th style={thStyle}>{t(lang, 'sp_preise_currency')}</th>
                <th style={thStyle}>{t(lang, 'sp_preise_unit')}</th>
                <th style={thStyle}>{t(lang, 'sp_preise_notes')}</th>
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
        icon="doc" title={t(lang, 'sp_preise_payment_title')}
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
      >
        {edit ? (
          <FormGrid cols={2}>
            <FormField label={t(lang, 'sp_preise_payment_days')}>
              <input style={inputStyle} value={form.paymentTermDays ?? ''} onChange={e => set('paymentTermDays', e.target.value)} placeholder="z.B. 30" />
            </FormField>
            <FormField label={t(lang, 'sp_preise_payment_method')}>
              <select style={inputStyle} value={form.paymentMethod ?? ''} onChange={e => set('paymentMethod', e.target.value)}>
                <option value="">{t(lang, 'sp_preise_select')}</option>
                <option value="Überweisung">Überweisung</option>
                <option value="L/C">L/C</option>
                <option value="D/A">D/A</option>
                <option value="D/P">D/P</option>
                <option value="Open Account">Open Account</option>
              </select>
            </FormField>
            <FormField label={t(lang, 'sp_preise_currency')}>
              <select style={inputStyle} value={form.priceCurrency ?? ''} onChange={e => set('priceCurrency', e.target.value)}>
                <option value="">{t(lang, 'sp_preise_select')}</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="TZS">TZS</option>
                <option value="GBP">GBP</option>
              </select>
            </FormField>
            <FormField label={t(lang, 'sp_preise_valid_until')}>
              <input type="date" style={inputStyle} value={form.priceValidUntil ?? ''} onChange={e => set('priceValidUntil', e.target.value)} />
            </FormField>
            <div style={{ gridColumn: '1 / -1' }}>
              <CheckFlag
                label={t(lang, 'sp_preise_advance')}
                value={!!form.advancePaymentRequired}
                onChange={v => set('advancePaymentRequired', v)}
                editMode={true}
              />
              <CheckFlag
                label={t(lang, 'sp_preise_reverse_charge')}
                value={!!form.reverseChargeRelevant}
                onChange={v => set('reverseChargeRelevant', v)}
                editMode={true}
              />
            </div>
            <FormField label={t(lang, 'sp_preise_price_notes')} full>
              <textarea style={textareaStyle} value={form.pricingNotes ?? ''} onChange={e => set('pricingNotes', e.target.value)} />
            </FormField>
            <SaveError error={error} />
          </FormGrid>
        ) : (
          <div className="fields">
            <FieldRow label={t(lang, 'sp_preise_payment_label')} value={master.paymentTermDays ? `${master.paymentTermDays} ${t(lang, 'sp_preise_days_suffix')}` : undefined} />
            <FieldRow label={t(lang, 'sp_preise_payment_method')} value={master.paymentMethod} />
            <FieldRow label={t(lang, 'sp_preise_currency')} value={master.priceCurrency} />
            <FieldRow label={t(lang, 'sp_preise_valid_until')} value={master.priceValidUntil} />
            <div className="l">{t(lang, 'sp_preise_advance_label')}</div>
            <div className="v">
              <CheckFlag label={t(lang, 'sp_preise_advance')} value={!!master.advancePaymentRequired} onChange={() => {}} editMode={false} />
            </div>
            <div className="l">{t(lang, 'sp_preise_reverse_label')}</div>
            <div className="v">
              <CheckFlag label={t(lang, 'sp_preise_reverse_charge')} value={!!master.reverseChargeRelevant} onChange={() => {}} editMode={false} />
            </div>
            <FieldRow label={t(lang, 'sp_preise_notes')} value={master.pricingNotes} />
          </div>
        )}
      </SectionCard>

    </div>
  );
};

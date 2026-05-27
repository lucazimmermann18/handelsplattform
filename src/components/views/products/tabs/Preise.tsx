'use client';
import React, { useState, useEffect } from 'react';
import { Ic } from '@/components/ui/icons';
import type { Product } from '@/lib/types';
import type { ProductMaster, PriceTier } from '../types';
import { SectionCard, FormField, FormGrid, DeleteBtn, FieldRow, SaveError, inputStyle, cellInput, thStyle, useSectionSave } from '../shared';

interface TabProps { product: Product; master: ProductMaster; onSaved: () => void; }

const COST_FIELDS: { key: keyof ProductMaster; label: string }[] = [
  { key: 'costPackaging',    label: 'Verpackungskosten' },
  { key: 'costInland',       label: 'Inlandstransport' },
  { key: 'costExportCustoms',label: 'Exportabfertigung' },
  { key: 'costFreight',      label: 'Seefracht / Luftfracht' },
  { key: 'costInsurance',    label: 'Versicherung' },
  { key: 'costDuties',       label: 'Zoll' },
  { key: 'costTaxes',        label: 'Steuern' },
  { key: 'costStorage',      label: 'Lagerkosten' },
  { key: 'costFinancing',    label: 'Finanzierungskosten' },
  { key: 'costCommission',   label: 'Provisionen' },
];

type CostState = Record<string, string>;

function sumCosts(costs: CostState): number {
  return Object.values(costs).reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
}

export const TabPreise = ({ product, master, onSaved }: TabProps) => {
  const { save, saving, error, setError } = useSectionSave(product.id, onSaved);

  const [editTiers, setEditTiers] = useState(false);
  const [currency, setCurrency]   = useState(master.currency ?? 'EUR');
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>(master.priceTiers ?? []);

  const [editCalc, setEditCalc] = useState(false);
  const initCosts = (): CostState => Object.fromEntries(
    COST_FIELDS.map(({ key }) => [key, (master[key] as string) ?? ''])
  );
  const [costs, setCosts]                   = useState<CostState>(initCosts);
  const [targetSellPrice, setTargetPrice]   = useState(master.targetSellPrice ?? '');
  const [contributionMargin, setContribMgn] = useState(master.contributionMargin ?? '');
  const [breakevenQty, setBreakevenQty]     = useState(master.breakevenQty ?? '');
  const [marginAbs, setMarginAbs]           = useState(master.marginAbs ?? '');
  const [marginPct, setMarginPct]           = useState(master.marginPct ?? '');

  useEffect(() => {
    if (!editCalc) return;
    const total = sumCosts(costs);
    const sell  = parseFloat(targetSellPrice) || 0;
    const abs   = sell - total;
    const pct   = sell > 0 ? (abs / sell) * 100 : 0;
    setMarginAbs(sell > 0 || total > 0 ? abs.toFixed(2) : '');
    setMarginPct(sell > 0 || total > 0 ? pct.toFixed(2) : '');
  }, [costs, targetSellPrice, editCalc]);

  const cancelTiers = () => {
    setCurrency(master.currency ?? 'EUR'); setPriceTiers(master.priceTiers ?? []);
    setEditTiers(false); setError(null);
  };
  const cancelCalc = () => {
    setCosts(initCosts()); setTargetPrice(master.targetSellPrice ?? '');
    setContribMgn(master.contributionMargin ?? ''); setBreakevenQty(master.breakevenQty ?? '');
    setMarginAbs(master.marginAbs ?? ''); setMarginPct(master.marginPct ?? '');
    setEditCalc(false); setError(null);
  };

  const saveTiers = async () => {
    await save({ currency, priceTiers });
    setEditTiers(false);
  };
  const saveCalc = async () => {
    const patch = Object.fromEntries(COST_FIELDS.map(({ key }) => [key, costs[key]])) as Partial<ProductMaster>;
    await save({ ...patch, targetSellPrice, marginAbs, marginPct, contributionMargin, breakevenQty });
    setEditCalc(false);
  };

  const addTier  = () => setPriceTiers(t => [...t, { qty: '', price: '' }]);
  const updTier  = (i: number, f: keyof PriceTier, v: string) =>
    setPriceTiers(t => t.map((row, idx) => idx === i ? { ...row, [f]: v } : row));
  const delTier  = (i: number) => setPriceTiers(t => t.filter((_, idx) => idx !== i));
  const setCost  = (key: string, val: string) => setCosts(c => ({ ...c, [key]: val }));

  const tiersEmpty = !master.priceTiers || master.priceTiers.length === 0;
  const calcEmpty  = !master.targetSellPrice && !master.costFreight;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {(product.buyPrice || product.sellPrice || product.margin) ? (
        <SectionCard icon="dollar-sign" title="Referenzpreise (Altdaten)" badge="Nur Anzeige">
          <div className="fields">
            {product.buyPrice  ? <FieldRow label="Einkaufspreis" value={`${product.buyPrice}`} /> : null}
            {product.sellPrice ? <FieldRow label="Verkaufspreis" value={`${product.sellPrice}`} /> : null}
            {product.margin    ? <FieldRow label="Marge" value={`${product.margin} %`} /> : null}
          </div>
        </SectionCard>
      ) : null}

      {product.marketPrices && product.marketPrices.length > 0 && (
        <SectionCard icon="trending-up" title="Marktpreise (Altdaten)" badge="Nur Anzeige">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Markt</th>
                <th style={thStyle}>Preis</th>
                <th style={thStyle}>Währung</th>
                <th style={thStyle}>Incoterm</th>
                <th style={thStyle}>Gültig bis</th>
              </tr>
            </thead>
            <tbody>
              {product.marketPrices.map((mp, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '5px 8px 5px 0', fontSize: 12 }}>{mp.market}</td>
                  <td style={{ padding: '5px 8px', fontSize: 12 }}>{mp.price}</td>
                  <td style={{ padding: '5px 8px', fontSize: 12 }}>{mp.currency}</td>
                  <td style={{ padding: '5px 8px', fontSize: 12 }}>{mp.incoterm}</td>
                  <td style={{ padding: '5px 0', fontSize: 12 }}>{mp.validUntil}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}

      <SectionCard
        icon="layers" title="Preisstaffeln"
        onEdit={() => setEditTiers(true)} editMode={editTiers}
        onSave={saveTiers} onCancel={cancelTiers} saving={saving}
        empty={tiersEmpty} emptyText="Preisstaffeln noch nicht gepflegt."
      >
        {editTiers ? (
          <>
            <FormGrid cols={2}>
              <FormField label="Währung">
                <input style={inputStyle} value={currency} onChange={e => setCurrency(e.target.value)} placeholder="EUR" />
              </FormField>
            </FormGrid>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Staffelpreise</span>
                <button className="btn sm ghost" onClick={addTier}><Ic name="plus" size={11} /> Stufe hinzufügen</button>
              </div>
              {priceTiers.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: '45%' }}>Ab Menge</th>
                      <th style={thStyle}>Preis</th>
                      <th style={{ ...thStyle, width: 36 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {priceTiers.map((row, i) => (
                      <tr key={i}>
                        <td style={{ padding: '3px 4px 3px 0' }}>
                          <input style={cellInput} value={row.qty} onChange={e => updTier(i, 'qty', e.target.value)} placeholder="z.B. 100" />
                        </td>
                        <td style={{ padding: '3px 4px' }}>
                          <input style={cellInput} value={row.price} onChange={e => updTier(i, 'price', e.target.value)} placeholder="z.B. 4.50" />
                        </td>
                        <td style={{ padding: '3px 0 3px 4px' }}><DeleteBtn onClick={() => delTier(i)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <SaveError error={error} />
          </>
        ) : (
          <>
            <div className="fields">
              <FieldRow label="Währung" value={master.currency} />
            </div>
            {master.priceTiers && master.priceTiers.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: '45%' }}>Ab Menge</th>
                    <th style={thStyle}>Preis</th>
                  </tr>
                </thead>
                <tbody>
                  {master.priceTiers.map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '5px 8px 5px 0', fontSize: 12 }}>{row.qty}</td>
                      <td style={{ padding: '5px 0', fontSize: 12 }}>{row.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </SectionCard>

      <SectionCard
        icon="calculator" title="Kalkulation & Marge"
        onEdit={() => setEditCalc(true)} editMode={editCalc}
        onSave={saveCalc} onCancel={cancelCalc} saving={saving}
        empty={calcEmpty} emptyText="Kalkulation noch nicht gepflegt."
      >
        {editCalc ? (
          <>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Kostenstruktur</div>
              <FormGrid cols={2}>
                {COST_FIELDS.map(({ key, label }) => (
                  <FormField key={key} label={label}>
                    <input style={inputStyle} value={costs[key]} onChange={e => setCost(key, e.target.value)} placeholder="0.00" />
                  </FormField>
                ))}
              </FormGrid>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Zielkalkulation</div>
              <FormGrid cols={2}>
                <FormField label="Ziel-Verkaufspreis">
                  <input style={inputStyle} value={targetSellPrice} onChange={e => setTargetPrice(e.target.value)} placeholder="0.00" />
                </FormField>
                <FormField label="Marge absolut (auto)">
                  <input style={{ ...inputStyle, opacity: 0.6 }} value={marginAbs} readOnly />
                </FormField>
                <FormField label="Marge % (auto)">
                  <input style={{ ...inputStyle, opacity: 0.6 }} value={marginPct} readOnly />
                </FormField>
                <FormField label="Deckungsbeitrag">
                  <input style={inputStyle} value={contributionMargin} onChange={e => setContribMgn(e.target.value)} placeholder="0.00" />
                </FormField>
                <FormField label="Break-even-Menge">
                  <input style={inputStyle} value={breakevenQty} onChange={e => setBreakevenQty(e.target.value)} placeholder="Stück" />
                </FormField>
              </FormGrid>
            </div>
            <SaveError error={error} />
          </>
        ) : (
          <>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Kostenstruktur</div>
            <div className="fields">
              {COST_FIELDS.map(({ key, label }) =>
                master[key] ? <FieldRow key={key} label={label} value={master[key] as string} /> : null
              )}
            </div>
            {(master.targetSellPrice || master.marginAbs || master.marginPct || master.contributionMargin || master.breakevenQty) && (
              <>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '12px 0 8px' }}>Zielkalkulation</div>
                <div className="fields">
                  <FieldRow label="Ziel-Verkaufspreis" value={master.targetSellPrice} />
                  <FieldRow label="Marge absolut" value={master.marginAbs} />
                  <FieldRow label="Marge %" value={master.marginPct} />
                  <FieldRow label="Deckungsbeitrag" value={master.contributionMargin} />
                  <FieldRow label="Break-even-Menge" value={master.breakevenQty} />
                </div>
              </>
            )}
          </>
        )}
      </SectionCard>

    </div>
  );
};

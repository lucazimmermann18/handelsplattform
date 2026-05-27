'use client';
import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Ic } from '@/components/ui/icons';
import type { Product } from '@/lib/types';
import type { ProductMaster, DutyRate, VatRate, OriginRule } from '../types';
import {
  SectionCard, FormField, FormGrid, DeleteBtn, FieldRow, SaveError,
  inputStyle, cellInput, thStyle, labelStyle, textareaStyle, useSectionSave,
  BoolBadge,
} from '../shared';

interface TabProps {
  product: Product;
  master: ProductMaster;
  onSaved: () => void;
}

const emptyDutyRate  = (): DutyRate   => ({ country: '', rate: '', note: '' });
const emptyVatRate   = (): VatRate    => ({ country: '', rate: '' });
const emptyOriginRule = (): OriginRule => ({ agreement: '', rule: '' });

// ── Tab: Zoll & Klassifizierung ───────────────────────────────────────────────

export const TabZoll = ({ product, master, onSaved }: TabProps) => {
  const { refresh } = useData();
  const { save, saving, error, setError } = useSectionSave(product.id, () => { refresh(); onSaved(); });

  // ── Section 1: Klassifizierung ────────────────────────────────────────────
  const [editKlass, setEditKlass] = useState(false);
  const [cnCode,      setCnCode]      = useState(master.cnCode      ?? '');
  const [taricCode,   setTaricCode]   = useState(master.taricCode   ?? '');
  const [customsDesc, setCustomsDesc] = useState(master.customsDesc ?? '');

  const saveKlass = async () => {
    await save({ cnCode, taricCode, customsDesc });
    if (!error) setEditKlass(false);
  };

  // ── Section 2: Zollsätze & Einfuhrumsatzsteuer ────────────────────────────
  const [editRates, setEditRates] = useState(false);
  const [dutyRates, setDutyRates] = useState<DutyRate[]>(master.dutyRates ?? []);
  const [vatRates,  setVatRates]  = useState<VatRate[]>(master.vatRates   ?? []);

  const saveRates = async () => {
    await save({ dutyRates, vatRates });
    if (!error) setEditRates(false);
  };

  // ── Section 3: Beschränkungen & Lizenzen ─────────────────────────────────
  const [editRestr, setEditRestr] = useState(false);
  const [exportRestrictions, setExportRestrictions] = useState(master.exportRestrictions ?? '');
  const [importRestrictions, setImportRestrictions] = useState(master.importRestrictions ?? '');
  const [requiredLicenses,   setRequiredLicenses]   = useState(master.requiredLicenses   ?? '');

  const saveRestr = async () => {
    await save({ exportRestrictions, importRestrictions, requiredLicenses });
    if (!error) setEditRestr(false);
  };

  // ── Section 4: Compliance & Sonderregelungen ──────────────────────────────
  const [editComp, setEditComp] = useState(false);
  const [antiDumping,           setAntiDumping]           = useState(master.antiDumping           ?? '');
  const [sanctionsCheck,        setSanctionsCheck]        = useState(master.sanctionsCheck        ?? '');
  const [dualUse,               setDualUse]               = useState(master.dualUse               ?? false);
  const [preferenceEligibility, setPreferenceEligibility] = useState(master.preferenceEligibility ?? '');

  const saveComp = async () => {
    await save({ antiDumping, sanctionsCheck, dualUse, preferenceEligibility });
    if (!error) setEditComp(false);
  };

  // ── Section 5: Ursprungsregeln ────────────────────────────────────────────
  const [editOrigin, setEditOrigin] = useState(false);
  const [originRules, setOriginRules] = useState<OriginRule[]>(master.originRules ?? []);

  const saveOrigin = async () => {
    await save({ originRules });
    if (!error) setEditOrigin(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* HS-Code read-only info from product */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.15)', fontSize: 12.5 }}>
        <Ic name="info" size={13} color="#60a5fa" />
        <span className="tx3">HS-Code (Übersicht):</span>
        <span className="mono fw500" style={{ color: '#60a5fa', marginLeft: 4 }}>{product.hs || '—'}</span>
        <span className="tx3" style={{ marginLeft: 4 }}>{'· Wird im Tab „Übersicht" gepflegt.'}</span>
      </div>

      {/* ── Klassifizierung ─────────────────────────────────────────────────── */}
      <SectionCard
        icon="tag"
        title="Klassifizierung"
        editMode={editKlass}
        onEdit={() => { setError(null); setEditKlass(true); }}
        onSave={saveKlass}
        onCancel={() => setEditKlass(false)}
        saving={saving}
        empty={!master.cnCode && !master.taricCode && !master.customsDesc}
        emptyText="CN-Code und TARIC noch nicht gepflegt."
      >
        {editKlass ? (
          <>
            <FormGrid cols={2}>
              <FormField label="CN-Code (8-stellig)">
                <input value={cnCode} onChange={e => setCnCode(e.target.value)}
                  placeholder="z. B. 09011100" maxLength={8} style={inputStyle} className="mono" />
              </FormField>
              <FormField label="TARIC-Code (10-stellig)">
                <input value={taricCode} onChange={e => setTaricCode(e.target.value)}
                  placeholder="z. B. 0901110010" maxLength={10} style={inputStyle} className="mono" />
              </FormField>
              <FormField label="Zollbeschreibung" full>
                <textarea value={customsDesc} onChange={e => setCustomsDesc(e.target.value)}
                  placeholder="Offizielle Zollbeschreibung der Ware" style={textareaStyle} />
              </FormField>
            </FormGrid>
            <SaveError error={error} />
          </>
        ) : (
          <div className="fields">
            <FieldRow label="CN-Code"      value={master.cnCode}      mono />
            <FieldRow label="TARIC-Code"   value={master.taricCode}   mono />
            <FieldRow label="Zollbeschreibung" value={master.customsDesc} />
          </div>
        )}
      </SectionCard>

      {/* ── Zollsätze & EUSt ────────────────────────────────────────────────── */}
      <SectionCard
        icon="percent"
        title="Zollsätze & Einfuhrumsatzsteuer"
        badge={`${(master.dutyRates ?? []).length + (master.vatRates ?? []).length} Einträge`}
        editMode={editRates}
        onEdit={() => { setError(null); setEditRates(true); }}
        onSave={saveRates}
        onCancel={() => setEditRates(false)}
        saving={saving}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Zollsätze */}
          <div>
            <div style={{ ...labelStyle, marginBottom: 6 }}>Zollsatz je Zielland</div>
            {editRates ? (
              <>
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Land</th>
                      <th style={thStyle}>Zollsatz</th>
                      <th style={thStyle}>Hinweis</th>
                      <th style={{ ...thStyle, width: 32 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {dutyRates.map((r, i) => (
                      <tr key={i}>
                        <td><input value={r.country} onChange={e => setDutyRates(p => p.map((x, j) => j === i ? { ...x, country: e.target.value } : x))} style={cellInput} placeholder="DE, EU, …" /></td>
                        <td><input value={r.rate}    onChange={e => setDutyRates(p => p.map((x, j) => j === i ? { ...x, rate: e.target.value } : x))}    style={cellInput} placeholder="0 %" /></td>
                        <td><input value={r.note ?? ''} onChange={e => setDutyRates(p => p.map((x, j) => j === i ? { ...x, note: e.target.value } : x))} style={cellInput} /></td>
                        <td><DeleteBtn onClick={() => setDutyRates(p => p.filter((_, j) => j !== i))} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="btn sm ghost" style={{ marginTop: 6 }} onClick={() => setDutyRates(p => [...p, emptyDutyRate()])}>
                  <Ic name="plus" size={11} /> Hinzufügen
                </button>
              </>
            ) : (master.dutyRates ?? []).length > 0 ? (
              <table className="table" style={{ width: '100%' }}>
                <thead><tr><th style={thStyle}>Land</th><th style={thStyle}>Satz</th><th style={thStyle}>Hinweis</th></tr></thead>
                <tbody>
                  {(master.dutyRates ?? []).map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: 12 }}>{r.country}</td>
                      <td className="mono" style={{ fontSize: 12 }}>{r.rate}</td>
                      <td className="tx3" style={{ fontSize: 11.5 }}>{r.note ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <span className="tx3" style={{ fontSize: 12 }}>Noch nicht gepflegt.</span>}
          </div>

          {/* EUSt */}
          <div>
            <div style={{ ...labelStyle, marginBottom: 6 }}>Einfuhrumsatzsteuer je Land</div>
            {editRates ? (
              <>
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Land</th>
                      <th style={thStyle}>Steuersatz</th>
                      <th style={{ ...thStyle, width: 32 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {vatRates.map((r, i) => (
                      <tr key={i}>
                        <td><input value={r.country} onChange={e => setVatRates(p => p.map((x, j) => j === i ? { ...x, country: e.target.value } : x))} style={cellInput} placeholder="DE, EU, …" /></td>
                        <td><input value={r.rate}    onChange={e => setVatRates(p => p.map((x, j) => j === i ? { ...x, rate: e.target.value } : x))}    style={cellInput} placeholder="19 %" /></td>
                        <td><DeleteBtn onClick={() => setVatRates(p => p.filter((_, j) => j !== i))} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="btn sm ghost" style={{ marginTop: 6 }} onClick={() => setVatRates(p => [...p, emptyVatRate()])}>
                  <Ic name="plus" size={11} /> Hinzufügen
                </button>
              </>
            ) : (master.vatRates ?? []).length > 0 ? (
              <table className="table" style={{ width: '100%' }}>
                <thead><tr><th style={thStyle}>Land</th><th style={thStyle}>Steuersatz</th></tr></thead>
                <tbody>
                  {(master.vatRates ?? []).map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: 12 }}>{r.country}</td>
                      <td className="mono" style={{ fontSize: 12 }}>{r.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <span className="tx3" style={{ fontSize: 12 }}>Noch nicht gepflegt.</span>}
          </div>
        </div>
        <SaveError error={error} />
      </SectionCard>

      {/* ── Beschränkungen & Lizenzen ────────────────────────────────────────── */}
      <SectionCard
        icon="shield"
        title="Beschränkungen & Lizenzen"
        editMode={editRestr}
        onEdit={() => { setError(null); setEditRestr(true); }}
        onSave={saveRestr}
        onCancel={() => setEditRestr(false)}
        saving={saving}
        empty={!master.exportRestrictions && !master.importRestrictions && !master.requiredLicenses}
        emptyText="Keine Beschränkungen oder Lizenzen eingetragen."
      >
        {editRestr ? (
          <>
            <FormGrid cols={1}>
              <FormField label="Exportbeschränkungen">
                <textarea value={exportRestrictions} onChange={e => setExportRestrictions(e.target.value)} style={textareaStyle} placeholder="z. B. Genehmigungspflicht für bestimmte Zielmärkte…" />
              </FormField>
              <FormField label="Importbeschränkungen">
                <textarea value={importRestrictions} onChange={e => setImportRestrictions(e.target.value)} style={textareaStyle} placeholder="z. B. Einfuhrverbote, Kontingente…" />
              </FormField>
              <FormField label="Erforderliche Lizenzen">
                <textarea value={requiredLicenses} onChange={e => setRequiredLicenses(e.target.value)} style={textareaStyle} placeholder="z. B. Exportlizenz, Phytosanitäre Bescheinigung…" />
              </FormField>
            </FormGrid>
            <SaveError error={error} />
          </>
        ) : (
          <div className="fields">
            <FieldRow label="Exportbeschränkungen" value={master.exportRestrictions} />
            <FieldRow label="Importbeschränkungen" value={master.importRestrictions} />
            <FieldRow label="Erforderliche Lizenzen" value={master.requiredLicenses} />
          </div>
        )}
      </SectionCard>

      {/* ── Compliance & Sonderregelungen ────────────────────────────────────── */}
      <SectionCard
        icon="alert-triangle"
        title="Compliance & Sonderregelungen"
        editMode={editComp}
        onEdit={() => { setError(null); setEditComp(true); }}
        onSave={saveComp}
        onCancel={() => setEditComp(false)}
        saving={saving}
      >
        {editComp ? (
          <>
            <FormGrid cols={1}>
              <FormField label="Anti-Dumping-Maßnahmen">
                <textarea value={antiDumping} onChange={e => setAntiDumping(e.target.value)} style={textareaStyle} placeholder="z. B. Anti-Dumping-Zölle, Ausgleichsmaßnahmen…" />
              </FormField>
              <FormField label="Sanktionsprüfung">
                <textarea value={sanctionsCheck} onChange={e => setSanctionsCheck(e.target.value)} style={textareaStyle} placeholder="Ergebnis der Sanktionsprüfung (OFAC, EU, UN)…" />
              </FormField>
              <FormField label="Präferenzberechtigung">
                <textarea value={preferenceEligibility} onChange={e => setPreferenceEligibility(e.target.value)} style={textareaStyle} placeholder="z. B. GSP, EBA, EPA-Abkommen…" />
              </FormField>
              <div>
                <label style={labelStyle}>Dual-Use-Gut</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={dualUse} onChange={e => setDualUse(e.target.checked)} style={{ accentColor: '#60a5fa', width: 15, height: 15 }} />
                  Dieses Produkt unterliegt der Dual-Use-Verordnung
                </label>
              </div>
            </FormGrid>
            <SaveError error={error} />
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="fields">
              <FieldRow label="Anti-Dumping"        value={master.antiDumping} />
              <FieldRow label="Sanktionsprüfung"    value={master.sanctionsCheck} />
              <FieldRow label="Präferenzberechtigung" value={master.preferenceEligibility} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 12.5 }}>
              <span className="tx3">Dual-Use-Gut:</span>
              <BoolBadge value={master.dualUse} trueLabel="Ja — relevant" falseLabel="Nein" />
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Ursprungsregeln je Handelsabkommen ───────────────────────────────── */}
      <SectionCard
        icon="git-branch"
        title="Ursprungsregeln je Handelsabkommen"
        badge={`${(master.originRules ?? []).length} Regeln`}
        editMode={editOrigin}
        onEdit={() => { setError(null); setEditOrigin(true); }}
        onSave={saveOrigin}
        onCancel={() => setEditOrigin(false)}
        saving={saving}
        empty={(master.originRules ?? []).length === 0}
        emptyText="Noch keine Ursprungsregeln hinterlegt."
      >
        {editOrigin ? (
          <>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Handelsabkommen</th>
                  <th style={thStyle}>Ursprungsregel</th>
                  <th style={{ ...thStyle, width: 32 }} />
                </tr>
              </thead>
              <tbody>
                {originRules.map((r, i) => (
                  <tr key={i}>
                    <td><input value={r.agreement} onChange={e => setOriginRules(p => p.map((x, j) => j === i ? { ...x, agreement: e.target.value } : x))} style={cellInput} placeholder="z. B. EU-EAC EPA" /></td>
                    <td><input value={r.rule}      onChange={e => setOriginRules(p => p.map((x, j) => j === i ? { ...x, rule: e.target.value } : x))}      style={cellInput} placeholder="z. B. Vollständige Gewinnung" /></td>
                    <td><DeleteBtn onClick={() => setOriginRules(p => p.filter((_, j) => j !== i))} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn sm ghost" style={{ marginTop: 6 }} onClick={() => setOriginRules(p => [...p, emptyOriginRule()])}>
              <Ic name="plus" size={11} /> Hinzufügen
            </button>
            <SaveError error={error} />
          </>
        ) : (master.originRules ?? []).length > 0 && (
          <table className="table" style={{ width: '100%' }}>
            <thead><tr><th style={thStyle}>Handelsabkommen</th><th style={thStyle}>Ursprungsregel</th></tr></thead>
            <tbody>
              {(master.originRules ?? []).map((r, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 12 }}>{r.agreement}</td>
                  <td style={{ fontSize: 12 }}>{r.rule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

    </div>
  );
};

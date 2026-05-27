'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Badge } from '@/components/ui/primitives';
import { Ic } from '@/components/ui/icons';
import type { Supplier } from '@/lib/types';
import type { SupplierMaster, EUDRStatus, DeforestationRisk } from '../types';
import { EUDR_STATUS_MAP } from '../types';
import {
  SectionCard, FormField, FormGrid, FieldRow, BoolBadge, CheckFlag,
  SaveError, inputStyle, textareaStyle, useSectionSave,
} from '../shared';

interface TabProps { supplier: Supplier; master: SupplierMaster; onSaved: () => void; }

export const TabGeoEUDR = ({ supplier, master, onSaved }: TabProps) => {
  const { refresh } = useData();
  const { save, saving, error, setError } = useSectionSave(supplier.id, refresh);

  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<Partial<SupplierMaster>>({});

  const enter = () => {
    setForm({
      gpsLat:              master.gpsLat ?? '',
      gpsLon:              master.gpsLon ?? '',
      gpsVerified:         master.gpsVerified ?? false,
      gpsVerifiedDate:     master.gpsVerifiedDate ?? '',
      gpsVerifiedBy:       master.gpsVerifiedBy ?? '',
      eudrStatus:          master.eudrStatus,
      eudrDeclared:        master.eudrDeclared ?? false,
      eudrDeclarationDate: master.eudrDeclarationDate ?? '',
      deforestationRisk:   master.deforestationRisk,
      deforestationNotes:  master.deforestationNotes ?? '',
      landUseSince:        master.landUseSince ?? '',
      nearProtectedArea:   master.nearProtectedArea ?? false,
      geoNotes:            master.geoNotes ?? '',
    });
    setEdit(true); setError(null);
  };

  const cancel = () => { setEdit(false); setError(null); };

  const doSave = async () => {
    await save(form);
    setEdit(false);
    onSaved();
  };

  const set = (k: keyof SupplierMaster, v: string | boolean | undefined) =>
    setForm(f => ({ ...f, [k]: v }));

  const gpsEmpty = !master.gpsLat && !master.gpsLon;
  const eudrEmpty = !master.eudrStatus && !master.deforestationRisk;
  const eudrInfo = master.eudrStatus ? EUDR_STATUS_MAP[master.eudrStatus] : null;

  const deforestKind = (r?: DeforestationRisk) =>
    r === 'niedrig' ? 'success' : r === 'mittel' ? 'warning' : r === 'hoch' ? 'danger' : 'neutral';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* EUDR Info Banner */}
      <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Ic name="info" size={14} color="#60a5fa" />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 3 }}>EUDR — EU-Entwaldungsverordnung</div>
            <div className="tx3" style={{ fontSize: 11.5, lineHeight: 1.5 }}>
              Ab 2025 müssen für EUDR-relevante Rohstoffe (Kaffee, Kakao, Soja, Holz, Palmöl, Rinder, Kautschuk)
              GPS-Koordinaten der Produktionsflächen sowie Nachweise zur Entwaldungsfreiheit vorliegen.
            </div>
          </div>
        </div>
      </div>

      {/* GPS */}
      <SectionCard
        icon="map" title="GPS & Standort"
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
        empty={gpsEmpty} emptyText="GPS-Koordinaten noch nicht erfasst."
      >
        {edit ? (
          <FormGrid cols={2}>
            <FormField label="Breitengrad (Latitude)">
              <input style={inputStyle} value={form.gpsLat ?? ''} onChange={e => set('gpsLat', e.target.value)} placeholder="-3.3869" />
            </FormField>
            <FormField label="Längengrad (Longitude)">
              <input style={inputStyle} value={form.gpsLon ?? ''} onChange={e => set('gpsLon', e.target.value)} placeholder="36.6830" />
            </FormField>
            <FormField label="GPS verifiziert durch">
              <input style={inputStyle} value={form.gpsVerifiedBy ?? ''} onChange={e => set('gpsVerifiedBy', e.target.value)} placeholder="z.B. Max Müller, Feldbesuch" />
            </FormField>
            <FormField label="Verifizierungsdatum">
              <input type="date" style={inputStyle} value={form.gpsVerifiedDate ?? ''} onChange={e => set('gpsVerifiedDate', e.target.value)} />
            </FormField>
            <FormField label="GPS-Verifikation" full>
              <CheckFlag
                label="GPS-Koordinaten vor Ort verifiziert"
                value={!!form.gpsVerified}
                onChange={v => set('gpsVerified', v)}
                editMode={true}
              />
            </FormField>
            <FormField label="Landnutzung bekannt seit">
              <input style={inputStyle} value={form.landUseSince ?? ''} onChange={e => set('landUseSince', e.target.value)} placeholder="z.B. 2010" />
            </FormField>
            <FormField label="Nähe zu Schutzgebiet" full>
              <CheckFlag
                label="Produktionsfläche grenzt an Schutzgebiet oder Wald"
                value={!!form.nearProtectedArea}
                onChange={v => set('nearProtectedArea', v)}
                editMode={true}
              />
            </FormField>
            <FormField label="Geo-Notizen" full>
              <textarea style={textareaStyle} value={form.geoNotes ?? ''} onChange={e => set('geoNotes', e.target.value)} placeholder="Besonderheiten, Polygondaten-Quelle, Anmerkungen…" />
            </FormField>
            <SaveError error={error} />
          </FormGrid>
        ) : (
          <>
            {master.gpsLat && master.gpsLon && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 12px', borderRadius: 8, background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)' }}>
                <Ic name="map" size={14} color="#34d399" />
                <span className="mono fw500" style={{ fontSize: 13 }}>{master.gpsLat}, {master.gpsLon}</span>
                {master.gpsVerified && <Badge kind="success" dot>Verifiziert</Badge>}
                <a
                  href={`https://www.google.com/maps?q=${master.gpsLat},${master.gpsLon}`}
                  target="_blank" rel="noopener noreferrer"
                  className="btn sm ghost"
                  style={{ textDecoration: 'none', marginLeft: 'auto', fontSize: 11 }}
                >
                  Google Maps
                </a>
              </div>
            )}
            <div className="fields">
              <FieldRow label="Verifiziert durch" value={master.gpsVerifiedBy} />
              <FieldRow label="Verifizierungsdatum" value={master.gpsVerifiedDate} />
              <FieldRow label="Landnutzung seit"   value={master.landUseSince} />
              <div className="l">Nähe Schutzgebiet</div>
              <div className="v"><BoolBadge value={master.nearProtectedArea} trueLabel="Ja — prüfen!" falseLabel="Nein" /></div>
              <FieldRow label="Geo-Notizen" value={master.geoNotes} />
            </div>
          </>
        )}
      </SectionCard>

      {/* EUDR */}
      <SectionCard
        icon="shield" title="EUDR-Status & Entwaldung"
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
        empty={eudrEmpty} emptyText="EUDR-Status noch nicht erfasst."
      >
        {edit ? (
          <FormGrid cols={2}>
            <FormField label="EUDR-Konformitätsstatus">
              <select style={inputStyle} value={form.eudrStatus ?? ''} onChange={e => set('eudrStatus', e.target.value as EUDRStatus || undefined)}>
                <option value="">— Auswählen —</option>
                <option value="konform">Konform</option>
                <option value="in_pruefung">In Prüfung</option>
                <option value="nicht_konform">Nicht konform</option>
                <option value="nicht_relevant">Nicht relevant (Produkt nicht EUDR-pflichtig)</option>
              </select>
            </FormField>
            <FormField label="Entwaldungsrisiko">
              <select style={inputStyle} value={form.deforestationRisk ?? ''} onChange={e => set('deforestationRisk', e.target.value as DeforestationRisk || undefined)}>
                <option value="">— Auswählen —</option>
                <option value="niedrig">Niedrig</option>
                <option value="mittel">Mittel</option>
                <option value="hoch">Hoch</option>
                <option value="unbekannt">Unbekannt</option>
              </select>
            </FormField>
            <FormField label="EUDR-Deklaration vorhanden" full>
              <CheckFlag
                label="Sorgfaltspflichterklärung liegt vor"
                value={!!form.eudrDeclared}
                onChange={v => set('eudrDeclared', v)}
                editMode={true}
              />
            </FormField>
            <FormField label="Datum der Deklaration">
              <input type="date" style={inputStyle} value={form.eudrDeclarationDate ?? ''} onChange={e => set('eudrDeclarationDate', e.target.value)} />
            </FormField>
            <FormField label="Entwaldungs-Notizen" full>
              <textarea style={textareaStyle} value={form.deforestationNotes ?? ''} onChange={e => set('deforestationNotes', e.target.value)} placeholder="Quellen, Satellitendaten, Auditergebnisse…" />
            </FormField>
            <SaveError error={error} />
          </FormGrid>
        ) : (
          <div className="fields">
            <div className="l">EUDR-Status</div>
            <div className="v">
              {eudrInfo ? <Badge kind={eudrInfo.kind}>{eudrInfo.label}</Badge> : <span className="tx3">—</span>}
            </div>
            <div className="l">Entwaldungsrisiko</div>
            <div className="v">
              {master.deforestationRisk
                ? <Badge kind={deforestKind(master.deforestationRisk)}>{master.deforestationRisk}</Badge>
                : <span className="tx3">—</span>}
            </div>
            <div className="l">Deklaration</div>
            <div className="v"><BoolBadge value={master.eudrDeclared} trueLabel="Vorhanden" falseLabel="Fehlt" /></div>
            <FieldRow label="Deklarationsdatum" value={master.eudrDeclarationDate} />
            <FieldRow label="Notizen"            value={master.deforestationNotes} />
          </div>
        )}
      </SectionCard>

    </div>
  );
};

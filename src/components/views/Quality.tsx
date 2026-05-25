'use client';

import React, { useState } from 'react';
import { MOCK } from '@/lib/mock';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import type { QualityCheck } from '@/lib/types';

interface QualityViewProps {
  lang: Lang;
}

export const QualityView = ({ lang }: QualityViewProps) => {
  const M = MOCK;
  const [selected, setSelected] = useState<QualityCheck>(M.quality[0]);

  const kpis = [
    { l: 'Freigegeben', v: M.quality.filter(q => q.status === 'released').length, c: '#34d399' },
    { l: 'In Prüfung', v: M.quality.filter(q => q.status === 'in_progress').length, c: '#fbbf24' },
    { l: 'Gesperrt', v: M.quality.filter(q => q.status === 'blocked').length, c: '#f87171' },
    { l: 'Prüfungen gesamt', v: M.quality.length, c: '#60a5fa' },
  ];

  const sup = M.suppliers.find(x => x.id === selected?.supplier);

  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_quality')}</h1>
        <div className="sub">
          {M.quality.length} Prüfungen · {M.quality.filter(q => q.status === 'released').length} freigegeben · {M.quality.filter(q => q.status === 'blocked').length} gesperrt
        </div>
        <div className="right">
          <button className="btn"><Ic name="download" size={13} /> Bericht</button>
          <button className="btn primary"><Ic name="plus" size={13} /> Neue Prüfung</button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
          {kpis.map((k, i) => (
            <div key={i} className="tile kacheln" style={{ padding: 9 }}>
              <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase' }}>{k.l}</div>
              <div className="mono fw600" style={{ fontSize: 20, color: k.c, marginTop: 2 }}>{k.v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 12 }}>
          {/* Table */}
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>QC-ID</th>
                  <th>Charge · Produkt</th>
                  <th>Lieferant</th>
                  <th>Datum</th>
                  <th>Schlüsselwerte</th>
                  <th>Labor · Prüfer</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {M.quality.map(q => {
                  const s = M.suppliers.find(x => x.id === q.supplier);
                  const isSel = selected?.id === q.id;
                  return (
                    <tr
                      key={q.id}
                      onClick={() => setSelected(q)}
                      style={{ cursor: 'pointer', background: isSel ? 'rgba(59,130,246,0.06)' : undefined, borderLeft: isSel ? '2px solid #3b82f6' : undefined }}
                    >
                      <td><span className="id fw500">{q.id}</span></td>
                      <td>
                        <div className="mono">{q.batch}</div>
                        <div className="tx3" style={{ fontSize: 10.5 }}>{q.product}</div>
                      </td>
                      <td>
                        <div>{s?.name?.split(' ').slice(0, 3).join(' ')}</div>
                        <div className="tx3" style={{ fontSize: 10.5 }}>{s?.region}</div>
                      </td>
                      <td className="mono tx2" style={{ fontSize: 11 }}>{fmtDate(q.date)}</td>
                      <td className="mono" style={{ fontSize: 10.5 }}>
                        {q.moisture && <span>H₂O: <span className="tx2">{q.moisture}</span> </span>}
                        {q.purity && <span>· P: <span className="tx2">{q.purity}</span> </span>}
                        {q.foreign && <span>· FM: <span className="tx2">{q.foreign}</span></span>}
                        {q.cup && <span>Cup: <span className="tx2">{q.cup}</span></span>}
                        {q.temp && <span>T: <span className="tx2">{q.temp}</span></span>}
                        {q.dryMatter && <span>DM: <span className="tx2">{q.dryMatter}</span></span>}
                      </td>
                      <td>
                        <div className="tx2" style={{ fontSize: 11 }}>{q.lab}</div>
                        <div className="tx3" style={{ fontSize: 10 }}>{q.inspector}</div>
                      </td>
                      <td>
                        {q.grade && <Badge kind="neutral">{q.grade}</Badge>}
                      </td>
                      <td>
                        {q.status === 'released' && <Badge kind="success" dot>Freigegeben</Badge>}
                        {q.status === 'in_progress' && <Badge kind="warning" dot>Läuft</Badge>}
                        {q.status === 'blocked' && <Badge kind="danger" dot>Gesperrt</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="card">
              <div className="card-head">
                <Ic name="quality" size={14} />
                <span className="title">{selected.id}</span>
                {selected.status === 'released' && <Badge kind="success" dot>Freigegeben</Badge>}
                {selected.status === 'blocked' && <Badge kind="danger" dot>Gesperrt</Badge>}
                {selected.status === 'in_progress' && <Badge kind="warning" dot>Läuft</Badge>}
              </div>
              <div className="card-body">
                <div className="fields">
                  <div className="l">Charge</div><div className="v mono">{selected.batch}</div>
                  <div className="l">Produkt</div><div className="v">{selected.product}</div>
                  <div className="l">Lieferant</div><div className="v">{sup?.name}</div>
                  <div className="l">Datum</div><div className="v mono">{fmtDate(selected.date)}</div>
                  {selected.moisture && <><div className="l">Feuchtigkeit</div><div className="v mono">{selected.moisture} <span className="tx3">(max 5%)</span></div></>}
                  {selected.purity && <><div className="l">Reinheit</div><div className="v mono">{selected.purity}</div></>}
                  {selected.foreign && <><div className="l">Fremdkörper</div><div className="v mono">{selected.foreign}</div></>}
                  {selected.oil && <><div className="l">Ölgehalt</div><div className="v mono">{selected.oil}</div></>}
                  {selected.cup && <><div className="l">Cup Score (SCA)</div><div className="v mono fw500" style={{ color: '#34d399' }}>{selected.cup}</div></>}
                  {selected.dryMatter && <><div className="l">Trockensubstanz</div><div className="v mono">{selected.dryMatter}</div></>}
                  {selected.firmness && <><div className="l">Festigkeit</div><div className="v mono">{selected.firmness}</div></>}
                  {selected.temp && <><div className="l">Temperatur</div><div className="v mono">{selected.temp}</div></>}
                  {selected.pH && <><div className="l">pH-Wert</div><div className="v mono">{selected.pH}</div></>}
                  {(selected.purity || selected.foreign) && <><div className="l">Aflatoxin</div><div className="v mono"><span style={{ color: '#34d399' }}>&lt; 2 ppb</span> <span className="tx3">(EU max 5)</span></div></>}
                  <div className="l">Labor</div><div className="v">{selected.lab}</div>
                  <div className="l">Prüfer</div><div className="v">{selected.inspector}</div>
                  <div className="l">Bericht</div><div className="v"><Badge kind="success">COA_{selected.batch}.pdf</Badge></div>
                </div>

                {selected.notes && (
                  <>
                    <div className="sep" />
                    <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Notizen</div>
                    <div className="tx2" style={{ fontSize: 11.5 }}>{selected.notes}</div>
                  </>
                )}

                <div className="sep" />
                <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>Sensorik</div>
                <div className="row" style={{ flexWrap: 'wrap', gap: 4 }}>
                  <Badge kind="success">Farbe ✓</Badge>
                  <Badge kind="success">Geruch ✓</Badge>
                  <Badge kind="success">Form ✓</Badge>
                  <Badge kind="success">Glanz ✓</Badge>
                </div>

                <div className="sep" />
                <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>Foto-Dokumentation</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ aspectRatio: '1', background: 'repeating-linear-gradient(45deg, #1a2233, #1a2233 6px, #131927 6px, #131927 12px)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                      <span className="tx3 mono" style={{ fontSize: 9 }}>IMG_{i}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

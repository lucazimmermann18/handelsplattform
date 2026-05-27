'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import type { QualityCheck } from '@/lib/types';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { ConfirmDelete } from '@/components/ui/ConfirmDelete';
import { GenericEditModal, type FieldDef } from '@/components/ui/GenericEditModal';

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: 13,
  padding: '7px 10px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
};

interface QualityViewProps {
  lang: Lang;
}

export const QualityView = ({ lang }: QualityViewProps) => {
  const { data: M, refresh } = useData();
  const [selected, setSelected] = useState<QualityCheck | null>(null);
  const [newCheck, setNewCheck] = useState(false);
  const [form, setForm] = useState({
    batch: '', product: '', supplierId: '', checkDate: '',
    moisture: '', purity: '', foreign: '', oil: '',
    lab: '', inspector: '', grade: '', notes: '', status: 'in_progress' as string,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const resetForm = () => setForm({
    batch: '', product: '', supplierId: '', checkDate: '',
    moisture: '', purity: '', foreign: '', oil: '',
    lab: '', inspector: '', grade: '', notes: '', status: 'in_progress',
  });

  const handleExport = () => {
    const headers = ['QC-ID','Charge','Produkt','Lieferant','Datum','Feuchtigkeit','Reinheit','Fremdkörper','Öl','Cup-Score','Labor','Prüfer','Grade','Status','Notizen'];
    const rows = M!.quality.map(q => {
      const sup = M!.suppliers.find(x => x.id === q.supplier);
      return [q.id, q.batch, q.product, sup?.name ?? q.supplier, q.date, q.moisture ?? '', q.purity ?? '', q.foreign ?? '', q.oil ?? '', q.cup ?? '', q.lab, q.inspector, q.grade, q.status, q.notes];
    });
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `qualitaet-bericht-${new Date().toISOString().slice(0,10)}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const handleSaveCheck = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const id = `QC-${Date.now().toString().slice(-6)}`;
      const { error } = await sb.from('quality_checks').insert({
        id,
        batch: form.batch,
        product: form.product,
        supplier_id: form.supplierId || null,
        check_date: form.checkDate,
        moisture: form.moisture || null,
        purity: form.purity || null,
        foreign_matter: form.foreign || null,
        oil: form.oil || null,
        lab: form.lab || null,
        inspector: form.inspector || null,
        status: form.status,
        grade: form.grade || null,
        notes: form.notes || null,
      });
      if (error) throw error;
      setNewCheck(false);
      resetForm();
      refresh();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const sel = selected ?? M.quality[0];

  const kpis = [
    { l: 'Freigegeben', v: M.quality.filter(q => q.status === 'released').length, c: '#34d399' },
    { l: 'In Prüfung', v: M.quality.filter(q => q.status === 'in_progress').length, c: '#fbbf24' },
    { l: 'Gesperrt', v: M.quality.filter(q => q.status === 'blocked').length, c: '#f87171' },
    { l: 'Prüfungen gesamt', v: M.quality.length, c: '#60a5fa' },
  ];

  const sup = M.suppliers.find(x => x.id === sel?.supplier);

  return (
    <>
      <div>
        <div className="section-head">
          <h1>{t(lang, 'nav_quality')}</h1>
          <div className="sub">
            {M.quality.length} Prüfungen · {M.quality.filter(q => q.status === 'released').length} freigegeben · {M.quality.filter(q => q.status === 'blocked').length} gesperrt
          </div>
          <div className="right">
            <button className="btn" onClick={handleExport}><Ic name="download" size={13} /> Bericht</button>
            <button className="btn primary" onClick={() => setNewCheck(true)}><Ic name="plus" size={13} /> Neue Prüfung</button>
          </div>
        </div>

        <div style={{ padding: '0 16px 12px' }}>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
            {kpis.map((k, i) => (
              <div key={i} className="card" style={{ padding: 9 }}>
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
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {M.quality.map(q => {
                    const s = M.suppliers.find(x => x.id === q.supplier);
                    const isSel = sel?.id === q.id;
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
                        <td onClick={e => e.stopPropagation()}>
                          <ActionMenu onEdit={() => setEditId(q.id)} onDelete={() => setDeleteId(q.id)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Detail Panel */}
            {sel && (
              <div className="card">
                <div className="card-head">
                  <Ic name="quality" size={14} />
                  <span className="title">{sel.id}</span>
                  {sel.status === 'released' && <Badge kind="success" dot>Freigegeben</Badge>}
                  {sel.status === 'blocked' && <Badge kind="danger" dot>Gesperrt</Badge>}
                  {sel.status === 'in_progress' && <Badge kind="warning" dot>Läuft</Badge>}
                </div>
                <div className="card-body">
                  <div className="fields">
                    <div className="l">Charge</div><div className="v mono">{sel.batch}</div>
                    <div className="l">Produkt</div><div className="v">{sel.product}</div>
                    <div className="l">Lieferant</div><div className="v">{sup?.name}</div>
                    <div className="l">Datum</div><div className="v mono">{fmtDate(sel.date)}</div>
                    {sel.moisture && <><div className="l">Feuchtigkeit</div><div className="v mono">{sel.moisture} <span className="tx3">(max 5%)</span></div></>}
                    {sel.purity && <><div className="l">Reinheit</div><div className="v mono">{sel.purity}</div></>}
                    {sel.foreign && <><div className="l">Fremdkörper</div><div className="v mono">{sel.foreign}</div></>}
                    {sel.oil && <><div className="l">Ölgehalt</div><div className="v mono">{sel.oil}</div></>}
                    {sel.cup && <><div className="l">Cup Score (SCA)</div><div className="v mono fw500" style={{ color: '#34d399' }}>{sel.cup}</div></>}
                    {sel.dryMatter && <><div className="l">Trockensubstanz</div><div className="v mono">{sel.dryMatter}</div></>}
                    {sel.firmness && <><div className="l">Festigkeit</div><div className="v mono">{sel.firmness}</div></>}
                    {sel.temp && <><div className="l">Temperatur</div><div className="v mono">{sel.temp}</div></>}
                    {sel.pH && <><div className="l">pH-Wert</div><div className="v mono">{sel.pH}</div></>}
                    {(sel.purity || sel.foreign) && <><div className="l">Aflatoxin</div><div className="v mono"><span style={{ color: '#34d399' }}>&lt; 2 ppb</span> <span className="tx3">(EU max 5)</span></div></>}
                    <div className="l">Labor</div><div className="v">{sel.lab}</div>
                    <div className="l">Prüfer</div><div className="v">{sel.inspector}</div>
                    <div className="l">Bericht</div><div className="v"><Badge kind="success">COA_{sel.batch}.pdf</Badge></div>
                  </div>

                  {sel.notes && (
                    <>
                      <div className="sep" />
                      <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Notizen</div>
                      <div className="tx2" style={{ fontSize: 11.5 }}>{sel.notes}</div>
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

      {newCheck && (
        <div className="overlay" onClick={() => setNewCheck(false)} style={{ alignItems: 'flex-start', paddingTop: '8vh' }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 520, padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ic name="quality" size={15} color="#fbbf24" />
              <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>Neue Qualitätsprüfung</span>
              <button className="btn sm ghost" onClick={() => setNewCheck(false)}><Ic name="x" size={12} /></button>
            </div>

            {/* Body */}
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Row 1: Charge + Produkt */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Charge</div>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="z.B. BATCH-2026-042"
                    value={form.batch}
                    onChange={e => setForm(f => ({ ...f, batch: e.target.value }))}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Produkt</div>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="Produktname"
                    value={form.product}
                    onChange={e => setForm(f => ({ ...f, product: e.target.value }))}
                  />
                </div>
              </div>

              {/* Lieferant */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Lieferant</div>
                <select
                  style={inputStyle}
                  value={form.supplierId}
                  onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
                >
                  <option value="">— Lieferant wählen (optional) —</option>
                  {M.suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} · {s.country}</option>
                  ))}
                </select>
              </div>

              {/* Row: Datum + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Datum</div>
                  <input
                    type="date"
                    style={inputStyle}
                    value={form.checkDate}
                    onChange={e => setForm(f => ({ ...f, checkDate: e.target.value }))}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Status</div>
                  <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                    {(['in_progress', 'released', 'blocked'] as const).map(s => (
                      <span
                        key={s}
                        className={`chip${form.status === s ? ' on' : ''}`}
                        onClick={() => setForm(f => ({ ...f, status: s }))}
                        style={{ cursor: 'pointer' }}
                      >
                        {s === 'in_progress' ? 'Läuft' : s === 'released' ? 'Freigabe' : 'Gesperrt'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Messwerte section */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 6 }}>Messwerte <span style={{ textTransform: 'none', opacity: 0.6 }}>(optional)</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Feuchtigkeit</div>
                    <input
                      type="text"
                      style={inputStyle}
                      placeholder="z.B. 4.2%"
                      value={form.moisture}
                      onChange={e => setForm(f => ({ ...f, moisture: e.target.value }))}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Reinheit</div>
                    <input
                      type="text"
                      style={inputStyle}
                      placeholder="z.B. 98.5%"
                      value={form.purity}
                      onChange={e => setForm(f => ({ ...f, purity: e.target.value }))}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Fremdkörper</div>
                    <input
                      type="text"
                      style={inputStyle}
                      placeholder="z.B. 0.3%"
                      value={form.foreign}
                      onChange={e => setForm(f => ({ ...f, foreign: e.target.value }))}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Ölgehalt</div>
                    <input
                      type="text"
                      style={inputStyle}
                      placeholder="z.B. 1.1%"
                      value={form.oil}
                      onChange={e => setForm(f => ({ ...f, oil: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Labor + Prüfer */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Labor</div>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="Laborname"
                    value={form.lab}
                    onChange={e => setForm(f => ({ ...f, lab: e.target.value }))}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Prüfer</div>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="Name des Prüfers"
                    value={form.inspector}
                    onChange={e => setForm(f => ({ ...f, inspector: e.target.value }))}
                  />
                </div>
              </div>

              {/* Grade */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Grade</div>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="AA, A, B..."
                    value={form.grade}
                    onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                  />
                </div>
                <div />
              </div>

              {/* Notizen */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Notizen</div>
                <textarea
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder="Zusätzliche Anmerkungen…"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              {saveError && (
                <div style={{ fontSize: 11.5, color: '#f87171', padding: '6px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: 6 }}>{saveError}</div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 18px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn ghost" onClick={() => { setNewCheck(false); resetForm(); }}>Abbrechen</button>
              <button
                className="btn primary"
                disabled={!form.batch || !form.product || !form.checkDate || saving}
                onClick={handleSaveCheck}
              >
                {saving ? 'Speichern…' : 'Prüfung anlegen'}
              </button>
            </div>
          </div>
        </div>
      )}
      {editId && (() => {
        const r = M.quality.find(x => x.id === editId);
        if (!r) return null;
        const fields: FieldDef[] = [
          { key: 'batch', label: 'Charge', type: 'text', span: 2 },
          { key: 'product', label: 'Produkt', type: 'text' },
          { key: 'grade', label: 'Grade', type: 'text' },
          { key: 'status', label: 'Status', type: 'select', options: [
            { value: 'in_progress', label: 'In Prüfung' }, { value: 'released', label: 'Freigegeben' }, { value: 'blocked', label: 'Gesperrt' },
          ] },
          { key: 'moisture', label: 'Feuchtigkeit', type: 'text' },
          { key: 'purity', label: 'Reinheit', type: 'text' },
          { key: 'lab', label: 'Labor', type: 'text' },
          { key: 'inspector', label: 'Prüfer', type: 'text' },
          { key: 'notes', label: 'Notizen', type: 'textarea', span: 2 },
        ];
        return <GenericEditModal title="Qualitätsprüfung bearbeiten" subtitle={r.id} record={r as unknown as Record<string, unknown>} fields={fields} table="quality_checks" onClose={() => setEditId(null)} onSaved={() => setEditId(null)} />;
      })()}
      {deleteId && (() => {
        const r = M.quality.find(x => x.id === deleteId);
        return r ? <ConfirmDelete label={`QC '${r.batch}'`} table="quality_checks" id={deleteId} onClose={() => setDeleteId(null)} onDeleted={() => setDeleteId(null)} /> : null;
      })()}
    </>
  );
};

'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { ConfirmDelete } from '@/components/ui/ConfirmDelete';
import { GenericEditModal, type FieldDef } from '@/components/ui/GenericEditModal';

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

// ────────────────────────────────────────────────────────────
// Complaints List
// ────────────────────────────────────────────────────────────

interface ComplaintsListProps {
  lang: Lang;
  onOpen: (id: string) => void;
}

const SEV_KIND: Record<string, string> = { kritisch: 'danger', mittel: 'warning', gering: 'info' };
const STATUS_META: Record<string, { kind: string }> = {
  'in Bearbeitung': { kind: 'warning' },
  'gelöst':         { kind: 'success' },
  'geschlossen':    { kind: 'neutral' },
};

export const ComplaintsList = ({ lang, onOpen }: ComplaintsListProps) => {
  const { data: M, refresh } = useData();
  const [newCase, setNewCase] = useState(false);
  const [form, setForm] = useState({ title: '', orderId: '', buyerId: '', cat: 'Qualität', sev: 'mittel', owner: '', impact: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const open = M.complaints.filter(c => c.status !== 'geschlossen').length;

  const handleSave = async () => {
    if (!form.title) return;
    setSaving(true); setSaveError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { error } = await createClient().from('complaints').insert({
        id: `REC-${Date.now().toString().slice(-5)}`,
        order_id: form.orderId || null, buyer_id: form.buyerId || null,
        category: form.cat, severity: form.sev, title: form.title,
        owner: form.owner || 'Admin', status: 'in Bearbeitung',
        opened_at: new Date().toISOString(), impact: form.impact || '0 €',
      });
      if (error) throw new Error(error.message);
      setNewCase(false); setForm({ title: '', orderId: '', buyerId: '', cat: 'Qualität', sev: 'mittel', owner: '', impact: '' });
      refresh();
    } catch (e) { setSaveError((e as Error).message); }
    finally { setSaving(false); }
  };

  const kpis = [
    { l: 'Offen',          v: open,                                                         c: '#f87171' },
    { l: 'In Bearbeitung', v: M.complaints.filter(c => c.status === 'in Bearbeitung').length, c: '#fbbf24' },
    { l: 'Gelöst',         v: M.complaints.filter(c => c.status === 'gelöst').length,         c: '#34d399' },
    { l: 'Kritisch',       v: M.complaints.filter(c => c.sev === 'kritisch').length,          c: '#f87171' },
    { l: 'Fälle gesamt',   v: M.complaints.length,                                            c: 'var(--text-2)' },
  ];

  return (
    <>
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_complaints')}</h1>
        <div className="sub">{M.complaints.length} Fälle · {open} offen</div>
        <div className="right">
          <button className="btn primary" onClick={() => setNewCase(true)}><Ic name="plus" size={13} /> Neuer Fall</button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
          {kpis.map((k, i) => (
            <div key={i} className="tile kacheln" style={{ padding: 9 }}>
              <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase' }}>{k.l}</div>
              <div className="mono fw600" style={{ fontSize: 20, color: k.c, marginTop: 2 }}>{k.v}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Fall</th>
                <th>Auftrag · Käufer</th>
                <th>Kategorie</th>
                <th>Beschreibung</th>
                <th>Schwere</th>
                <th>Verantwortlich</th>
                <th>Eröffnet</th>
                <th>Kostenwirkung</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {M.complaints.map(c => {
                const b = M.buyers.find(x => x.id === c.buyer);
                const isCritical = c.sev === 'kritisch' && c.status !== 'geschlossen';
                const meta = STATUS_META[c.status];
                return (
                  <tr
                    key={c.id}
                    style={{ cursor: 'pointer', background: isCritical ? 'rgba(248,113,113,0.04)' : undefined }}
                    onClick={() => onOpen(c.id)}
                  >
                    <td><span className="id fw500">{c.id}</span></td>
                    <td>
                      <div className="mono" style={{ fontSize: 11 }}>{c.order}</div>
                      <div className="tx3" style={{ fontSize: 10.5 }}>{b?.name?.split(' ').slice(0, 3).join(' ')}</div>
                    </td>
                    <td><Badge kind="neutral">{c.cat}</Badge></td>
                    <td className="tx2" style={{ fontSize: 12, maxWidth: 260 }}>{c.t}</td>
                    <td>
                      <Badge kind={SEV_KIND[c.sev] ?? 'neutral'} dot>{c.sev}</Badge>
                    </td>
                    <td style={{ fontSize: 12 }}>{c.owner}</td>
                    <td className="mono tx2" style={{ fontSize: 11 }}>{fmtDate(c.opened)}</td>
                    <td className="mono fw500" style={{ fontSize: 12, color: '#f87171' }}>{c.impact}</td>
                    <td>
                      {meta && <Badge kind={meta.kind} dot>{c.status}</Badge>}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <ActionMenu onEdit={() => setEditId(c.id)} onDelete={() => setDeleteId(c.id)} />
                    </td>
                  </tr>
                );
              })}
              {M.complaints.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)', fontSize: 12 }}>
                    Noch keine Reklamationen erfasst
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {/* New Complaint Modal */}
    {newCase && (
      <div className="overlay" onClick={() => setNewCase(false)} style={{ alignItems: 'flex-start', paddingTop: '8vh' }}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 460, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ic name="warn" size={14} color="#f87171" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Neuer Reklamationsfall</span>
            <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={() => setNewCase(false)}><Ic name="x" size={13} /></button>
          </div>
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Beschreibung *</div>
              <input autoFocus value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Was ist das Problem?" style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Käufer</div>
                <select value={form.buyerId} onChange={e => setForm(p => ({ ...p, buyerId: e.target.value }))} style={inputStyle}>
                  <option value="">— wählen —</option>
                  {M.buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Auftrag</div>
                <select value={form.orderId} onChange={e => setForm(p => ({ ...p, orderId: e.target.value }))} style={inputStyle}>
                  <option value="">— wählen —</option>
                  {M.orders.slice(0,15).map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                </select>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Kategorie</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {['Qualität','Logistik','Lieferung','Dokumente','Preis','Sonstiges'].map(c => (
                  <span key={c} className={`chip${form.cat === c ? ' on' : ''}`} onClick={() => setForm(p => ({ ...p, cat: c }))} style={{ cursor: 'pointer' }}>{c}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Schwere</div>
              <div style={{ display: 'flex', gap: 5 }}>
                {['gering','mittel','kritisch'].map(s => (
                  <span key={s} className={`chip${form.sev === s ? ' on' : ''}`} onClick={() => setForm(p => ({ ...p, sev: s }))} style={{ cursor: 'pointer' }}>{s}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Verantwortlich</div>
                <input value={form.owner} onChange={e => setForm(p => ({ ...p, owner: e.target.value }))} placeholder="Admin" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Kostenwirkung</div>
                <input value={form.impact} onChange={e => setForm(p => ({ ...p, impact: e.target.value }))} placeholder="z.B. 2.500 €" style={inputStyle} />
              </div>
            </div>
            {saveError && <div style={{ fontSize: 11.5, color: '#f87171', padding: '6px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: 6 }}>{saveError}</div>}
          </div>
          <div style={{ padding: '10px 18px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn ghost" onClick={() => setNewCase(false)}>Abbrechen</button>
            <button className="btn primary" onClick={handleSave} disabled={saving || !form.title}>
              {saving ? 'Speichern…' : <><Ic name="plus" size={13} /> Fall anlegen</>}
            </button>
          </div>
        </div>
      </div>
    )}
    {editId && (() => {
      const r = M.complaints.find(x => x.id === editId);
      if (!r) return null;
      const fields: FieldDef[] = [
        { key: 't', label: 'Beschreibung', type: 'textarea', dbKey: 'title', span: 2 },
        { key: 'cat', label: 'Kategorie', type: 'select', dbKey: 'category', options: [
          { value: 'Qualität', label: 'Qualität' }, { value: 'Logistik', label: 'Logistik' },
          { value: 'Lieferung', label: 'Lieferung' }, { value: 'Dokumente', label: 'Dokumente' },
          { value: 'Preis', label: 'Preis' }, { value: 'Sonstiges', label: 'Sonstiges' },
        ] },
        { key: 'sev', label: 'Schwere', type: 'select', dbKey: 'severity', options: [
          { value: 'gering', label: 'Gering' }, { value: 'mittel', label: 'Mittel' }, { value: 'kritisch', label: 'Kritisch' },
        ] },
        { key: 'owner', label: 'Verantwortlich', type: 'text' },
        { key: 'status', label: 'Status', type: 'select', options: [
          { value: 'in Bearbeitung', label: 'In Bearbeitung' }, { value: 'gelöst', label: 'Gelöst' }, { value: 'geschlossen', label: 'Geschlossen' },
        ] },
        { key: 'impact', label: 'Kostenwirkung', type: 'text' },
      ];
      return <GenericEditModal title="Reklamation bearbeiten" subtitle={r.id} record={r as unknown as Record<string, unknown>} fields={fields} table="complaints" onClose={() => setEditId(null)} onSaved={() => setEditId(null)} />;
    })()}
    {deleteId && (() => {
      const r = M.complaints.find(x => x.id === deleteId);
      return r ? <ConfirmDelete label={`Reklamation '${r.id}'`} table="complaints" id={deleteId} onClose={() => setDeleteId(null)} onDeleted={() => setDeleteId(null)} /> : null;
    })()}
  </>
  );
};

// ────────────────────────────────────────────────────────────
// Complaint Detail
// ────────────────────────────────────────────────────────────

interface ComplaintDetailProps {
  id: string;
  lang: Lang;
  onBack: () => void;
}

export const ComplaintDetail = ({ id, lang, onBack }: ComplaintDetailProps) => {
  const { data: M, refresh } = useData();
  const [solveOpen, setSolveOpen] = useState(false);
  const [solveNote, setSolveNote] = useState('');
  const [solveSaving, setSolveSaving] = useState(false);
  const [solveError, setSolveError] = useState<string | null>(null);
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const c = M.complaints.find(x => x.id === id) ?? M.complaints[0];
  if (!c) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Keine Reklamation gefunden.</div>;
  const order = M.orders.find(o => o.id === c.order);
  const buyer = M.buyers.find(b => b.id === c.buyer);

  const timeline = [
    { text: 'Fall eröffnet',                    meta: `${c.owner} · ${fmtDate(c.opened)}`,                    s: 'done'   },
    { text: 'Lieferant kontaktiert',             meta: 'WhatsApp + E-Mail · vor 3 Tagen',                      s: 'done'   },
    { text: 'Vor-Ort-Inspektion angefordert',    meta: 'Bureau Veritas · ETA Inspekteur vor 2 Tagen',          s: 'done'   },
    { text: 'Antwort Lieferant erhalten',        meta: 'EU-Vet-Approval wird beantragt · ETA 8 Wochen',        s: 'done'   },
    { text: 'Alternative Beschaffung prüfen',    meta: 'Kenya Source-Optionen · läuft',                        s: 'active' },
    { text: 'Käufer-Lösung verhandeln',          meta: 'Ersatz Charge oder Stornierung',                       s: 'future' },
    { text: 'Fall abschließen',                  meta: '',                                                      s: 'future' },
  ];

  const evidence = [
    { lbl: 'EU Vet Cert · fehlend',   tag: 'doc'  },
    { lbl: 'Iringa Slaughterhouse',   tag: 'foto' },
    { lbl: 'Kühlkette Log',           tag: 'doc'  },
    { lbl: 'Container Inspect.',      tag: 'foto' },
    { lbl: 'TRACES Screenshot',       tag: 'doc'  },
    { lbl: 'Korrespondenz',           tag: 'mail' },
  ];

  const handleSolve = async () => {
    setSolveSaving(true); setSolveError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { error } = await createClient().from('complaints').update({ status: 'gelöst' }).eq('id', c.id);
      if (error) throw new Error(error.message);
      setSolveOpen(false); setSolveNote(''); refresh();
    } catch (e) { setSolveError((e as Error).message); }
    finally { setSolveSaving(false); }
  };

  return (
    <>
    <div>
      <div className="section-head">
        <button className="btn ghost" onClick={onBack} style={{ padding: 4 }}>
          <Ic name="chevL" size={14} /> {t(lang, 'back')}
        </button>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 17, margin: 0 }}>{c.id}</h1>
        <Badge kind={SEV_KIND[c.sev] ?? 'neutral'} dot>{c.sev}</Badge>
        <div className="tx2" style={{ fontSize: 13 }}>{c.t}</div>
        <div className="right">
          <button className="btn" onClick={() => window.dispatchEvent(new CustomEvent('open-email', { detail: {
            type: 'complaint_notification', to: buyer?.email ?? '', subject: `Reklamation ${c.id} — ${c.t}`,
            recipientName: buyer?.name ?? '', data: { complaintId: c.id },
          }}))}><Ic name="mail" size={13} /> Käufer informieren</button>
          <button className="btn primary" onClick={() => setSolveOpen(true)}><Ic name="task" size={13} /> Lösung dokumentieren</button>
        </div>
      </div>

      <div className="detail-grid">
        {/* ── LEFT ── */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Fall-Übersicht */}
          <div className="card">
            <div className="card-head"><Ic name="bug" size={14} /><span className="title">Fall-Übersicht</span></div>
            <div className="card-body">
              <div className="fields">
                <div className="l">Auftrag</div><div className="v mono">{c.order}</div>
                <div className="l">Käufer</div><div className="v">{buyer?.name}</div>
                <div className="l">Produkt</div><div className="v">{order?.productVariant ?? '—'}</div>
                <div className="l">Charge</div><div className="v mono">{order?.batch ?? '—'}</div>
                <div className="l">Kategorie</div><div className="v"><Badge kind="neutral">{c.cat}</Badge></div>
                <div className="l">Schweregrad</div><div className="v"><Badge kind={SEV_KIND[c.sev] ?? 'neutral'} dot>{c.sev}</Badge></div>
                <div className="l">Verantwortlich</div><div className="v">{c.owner}</div>
                <div className="l">Eröffnet</div><div className="v mono">{fmtDate(c.opened)}</div>
                <div className="l">Kostenwirkung</div><div className="v mono fw500" style={{ color: '#f87171' }}>{c.impact}</div>
              </div>
            </div>
          </div>

          {/* Maßnahmen-Timeline */}
          <div className="card">
            <div className="card-head"><Ic name="activity" size={14} /><span className="title">Maßnahmen-Historie</span></div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="timeline" style={{ padding: 14 }}>
                {timeline.map((e, i) => (
                  <div key={i} className={`ev ${e.s}`}>
                    <div className="t">{e.text}</div>
                    {e.meta && <div className="m">{e.meta}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Beweismittel */}
          <div className="card">
            <div className="card-head"><Ic name="upload" size={14} /><span className="title">Foto-Doku &amp; Beweismittel</span></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {evidence.map((p, i) => (
                  <div key={i} style={{ aspectRatio: '1', background: 'repeating-linear-gradient(45deg, #131927, #131927 6px, #0e131f 6px, #0e131f 12px)', borderRadius: 6, padding: 8, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border)', cursor: 'pointer' }}>
                    <Badge kind="neutral">{p.tag}</Badge>
                    <div className="tx3 mono" style={{ fontSize: 9.5 }}>{p.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* AI Root Cause */}
          <div className="ai-card">
            <div className="head">
              <span className="pill">AI</span>
              <span className="fw600" style={{ fontSize: 12 }}>Root Cause Analyse</span>
            </div>
            <div className="tx2" style={{ fontSize: 11.5, lineHeight: 1.6 }}>
              Hauptursache: <span className="fw500" style={{ color: '#e6eaf2' }}>EU-Vet-Approval beim Lieferanten nie vollständig erlangt</span>. Auftrag wurde unter falscher Annahme angenommen.
              <br /><br />
              Empfehlungen:<br />
              <span style={{ display: 'block', marginTop: 4, paddingLeft: 8, borderLeft: '2px solid rgba(167,139,250,0.3)' }}>
                • Lieferant aus aktiver Liste nehmen bis EU-Listung<br />
                • Käufer: Ersatz aus alternativer Quelle prüfen<br />
                • Internes SOP: Vet-Approval als Hard-Gate beim Onboarding<br />
                • Reklamations-Reserve: 8% des Auftragswerts buchen
              </span>
            </div>
          </div>

          {/* Kostenwirkung */}
          <div className="card">
            <div className="card-head"><Ic name="finance" size={14} /><span className="title">Kostenwirkung</span></div>
            <div className="card-body">
              <div className="fields">
                <div className="l">Blockierter Umsatz</div>
                <div className="v mono fw500" style={{ color: '#f87171' }}>{c.impact}</div>
                <div className="l">Verlorene Marge</div>
                <div className="v mono">est. ~18%</div>
                <div className="l">Storno-Kosten</div>
                <div className="v mono">3.400 €</div>
                <div className="l">Versicherung</div>
                <div className="v mono" style={{ color: '#34d399' }}>−12.000 € (möglich)</div>
                <div className="l">Lieferanten-Belastung</div>
                <div className="v">prüfen</div>
              </div>
            </div>
          </div>

          {/* Weitere Fälle */}
          <div className="card">
            <div className="card-head"><Ic name="layers" size={14} /><span className="title">Weitere Fälle</span></div>
            <div className="card-body" style={{ padding: 0 }}>
              {M.complaints.filter(cc => cc.id !== c.id).map(cc => (
                <div key={cc.id} className="row" style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', gap: 8 }}>
                  <span className="id" style={{ fontSize: 11 }}>{cc.id}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11.5 }}>{cc.t}</div>
                    <div className="tx3" style={{ fontSize: 10 }}>{cc.cat}</div>
                  </div>
                  <Badge kind={cc.status === 'gelöst' ? 'success' : cc.status === 'in Bearbeitung' ? 'warning' : 'neutral'} dot>
                    {cc.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    {solveOpen && (
      <div className="overlay" onClick={() => setSolveOpen(false)} style={{ alignItems: 'flex-start', paddingTop: '8vh' }}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 460, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ic name="task" size={14} color="#34d399" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Lösung dokumentieren · {c.id}</span>
            <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={() => setSolveOpen(false)}><Ic name="x" size={13} /></button>
          </div>
          <div style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Lösungsbeschreibung</div>
            <textarea
              autoFocus
              value={solveNote}
              onChange={e => setSolveNote(e.target.value)}
              placeholder="Wie wurde der Fall gelöst? Maßnahmen, Ergebnis, Lessons Learned…"
              rows={5}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 10 }}>
              Status wird auf <strong style={{ color: '#34d399' }}>Gelöst</strong> gesetzt.
            </div>
            {solveError && <div style={{ fontSize: 11.5, color: '#f87171', padding: '6px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: 6, marginTop: 10 }}>{solveError}</div>}
          </div>
          <div style={{ padding: '10px 18px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn ghost" onClick={() => setSolveOpen(false)}>Abbrechen</button>
            <button className="btn primary" onClick={handleSolve} disabled={solveSaving || !solveNote.trim()}>
              {solveSaving ? 'Speichern…' : <><Ic name="task" size={13} /> Fall abschließen</>}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Badge } from '@/components/ui/primitives';
import { Ic } from '@/components/ui/icons';
import { fmtDate } from '@/lib/utils';
import type { Supplier } from '@/lib/types';
import type { SupplierMaster } from '../types';

interface TabProps { supplier: Supplier; master: SupplierMaster; onSaved: () => void; }

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

const commTypeIcon = (tp: string) => {
  if (tp === 'email')    return 'mail';
  if (tp === 'call')     return 'phone';
  if (tp === 'meeting')  return 'buyer';
  if (tp === 'whatsapp') return 'phone';
  return 'doc';
};

export const TabKommunikation = ({ supplier }: TabProps) => {
  const { data: M, refresh } = useData();

  const [commOpen, setCommOpen] = useState(false);
  const [commForm, setCommForm] = useState({
    type: 'note' as 'email' | 'call' | 'meeting' | 'note' | 'whatsapp',
    direction: 'out' as 'in' | 'out' | 'internal',
    date: new Date().toISOString().slice(0, 10),
    subject: '', body: '', author: 'Admin',
  });
  const [commSaving, setCommSaving] = useState(false);
  const [commError, setCommError] = useState<string | null>(null);

  const [visitOpen, setVisitOpen] = useState(false);
  const [visitForm, setVisitForm] = useState({
    type: 'Field Visit', date: '', inspector: 'Admin', notes: '', result: 'ausstehend',
  });
  const [visitSaving, setVisitSaving] = useState(false);

  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<'note'|'email'|'call'>('note');
  const [noteSaving, setNoteSaving] = useState(false);

  if (!M) return null;

  const notes  = M.supplierNotes.filter(n => n.supplier_id === supplier.id);
  const visits = M.fieldVisits.filter(v => v.supplier_id === supplier.id);
  const comms  = (M.communications ?? [])
    .filter(c => c.contactId === supplier.id && c.contactType === 'supplier')
    .sort((a, b) => b.date.localeCompare(a.date));

  const saveComm = async () => {
    setCommSaving(true); setCommError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { error } = await createClient().from('communications').insert({
        contact_id: supplier.id, contact_type: 'supplier',
        type: commForm.type, direction: commForm.direction,
        date: commForm.date, subject: commForm.subject,
        body: commForm.body, author: commForm.author,
      });
      if (error) throw new Error(error.message);
      setCommOpen(false);
      setCommForm({ type: 'note', direction: 'out', date: new Date().toISOString().slice(0, 10), subject: '', body: '', author: 'Admin' });
      refresh();
    } catch (e) { setCommError((e as Error).message); }
    finally { setCommSaving(false); }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    setNoteSaving(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      await createClient().from('supplier_notes').insert({
        supplier_id: supplier.id, author: 'Admin', content: noteText, type: noteType,
      });
      setNoteText('');
      refresh();
    } catch (_e) {}
    setNoteSaving(false);
  };

  const addVisit = async () => {
    if (!visitForm.date) return;
    setVisitSaving(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { error } = await createClient().from('field_visits').insert({
        supplier_id: supplier.id, type: visitForm.type, visit_date: visitForm.date,
        inspector: visitForm.inspector, notes: visitForm.notes, result: visitForm.result,
      });
      if (error) throw new Error(error.message);
      setVisitOpen(false);
      setVisitForm({ type: 'Field Visit', date: '', inspector: 'Admin', notes: '', result: 'ausstehend' });
      refresh();
    } catch (_e) {}
    setVisitSaving(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Kommunikation (strukturiert) */}
      <div className="card">
        <div className="card-head">
          <Ic name="mail" size={14} />
          <span className="title">Kommunikation</span>
          <span className="meta">{comms.length} Einträge</span>
          <button className="btn sm primary" style={{ marginLeft: 'auto' }} onClick={() => setCommOpen(true)}>
            <Ic name="plus" size={12} /> Erfassen
          </button>
        </div>
        <div className="card-body">
          {comms.length === 0 ? (
            <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '10px 0' }}>
              Noch keine Kommunikation erfasst.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {comms.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < comms.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ic name={commTypeIcon(c.type)} size={12} color="#34d399" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{c.subject || '(kein Betreff)'}</span>
                      <Badge kind={c.direction === 'in' ? 'success' : c.direction === 'out' ? 'info' : 'neutral'}>
                        {c.direction === 'in' ? 'Eingehend' : c.direction === 'out' ? 'Ausgehend' : 'Intern'}
                      </Badge>
                      <span className="tx3 mono" style={{ fontSize: 10, marginLeft: 'auto' }}>{fmtDate(c.date)}</span>
                    </div>
                    <div className="tx2" style={{ fontSize: 11.5, lineHeight: 1.5 }}>{c.body}</div>
                    <div className="tx3" style={{ fontSize: 10, marginTop: 2 }}>{c.author}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notizen */}
      <div className="card">
        <div className="card-head">
          <Ic name="doc" size={14} />
          <span className="title">Notizen & Gesprächsprotokoll</span>
          <span className="meta">{notes.length} Einträge</span>
        </div>
        <div className="card-body">
          {notes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {notes.map(n => (
                <div key={n.id} style={{ display: 'flex', gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ic name={n.type === 'email' ? 'mail' : n.type === 'call' ? 'phone' : 'doc'} size={11} color="#5d667d" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 500 }}>{n.author}</span>
                      <Badge kind={n.type === 'email' ? 'info' : n.type === 'call' ? 'success' : 'neutral'}>
                        {n.type === 'note' ? 'Notiz' : n.type === 'email' ? 'E-Mail' : 'Anruf'}
                      </Badge>
                      <span className="tx3 mono" style={{ fontSize: 10, marginLeft: 'auto' }}>
                        {new Date(n.created_at).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{n.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ borderTop: notes.length > 0 ? '1px solid var(--border)' : 'none', paddingTop: notes.length > 0 ? 12 : 0 }}>
            <div style={{ display: 'flex', gap: 5, marginBottom: 7 }}>
              {(['note','email','call'] as const).map(tp => (
                <span
                  key={tp}
                  className={`chip${noteType === tp ? ' on' : ''}`}
                  onClick={() => setNoteType(tp)}
                  style={{ cursor: 'pointer', fontSize: 11 }}
                >
                  {tp === 'note' ? 'Notiz' : tp === 'email' ? 'E-Mail' : 'Anruf'}
                </span>
              ))}
            </div>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Notiz, E-Mail oder Gesprächsprotokoll erfassen…"
              rows={2}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 7 }}>
              <button className="btn primary sm" onClick={addNote} disabled={noteSaving || !noteText.trim()}>
                {noteSaving ? 'Speichern…' : <><Ic name="plus" size={11} /> Hinzufügen</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Field Visits */}
      <div className="card">
        <div className="card-head">
          <Ic name="pin" size={14} />
          <span className="title">Field Visits & Audits</span>
          <span className="meta">{visits.length} Besuche</span>
          <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={() => setVisitOpen(true)}>
            <Ic name="plus" size={11} /> Besuch erfassen
          </button>
        </div>
        {visits.length === 0 && !visitOpen ? (
          <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
            Noch keine Field Visits erfasst.
          </div>
        ) : (
          <div style={{ padding: '0 16px 12px' }}>
            {visits.map((v, i) => (
              <div key={v.id} style={{ padding: '10px 0', borderBottom: i < visits.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Badge kind={v.type === 'Audit' ? 'warning' : 'info'}>{v.type}</Badge>
                  <span className="mono tx3" style={{ fontSize: 10 }}>{new Date(v.visit_date).toLocaleDateString('de-DE')}</span>
                  <Badge kind={v.result === 'positiv' ? 'success' : v.result === 'negativ' ? 'danger' : 'neutral'}>{v.result}</Badge>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{v.inspector}{v.notes ? ` · ${v.notes}` : ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Kommunikation */}
      {commOpen && (
        <div className="overlay" onClick={() => setCommOpen(false)}>
          <div className="modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <Ic name="mail" size={15} color="#34d399" />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Kommunikation erfassen</span>
              <button className="btn ghost" style={{ marginLeft: 'auto', padding: 4 }} onClick={() => setCommOpen(false)}>
                <Ic name="x" size={13} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Typ</div>
                  <select style={inputStyle} value={commForm.type} onChange={e => setCommForm(f => ({ ...f, type: e.target.value as typeof commForm.type }))}>
                    <option value="email">E-Mail</option>
                    <option value="call">Anruf</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="meeting">Meeting</option>
                    <option value="note">Notiz</option>
                  </select>
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Richtung</div>
                  <select style={inputStyle} value={commForm.direction} onChange={e => setCommForm(f => ({ ...f, direction: e.target.value as typeof commForm.direction }))}>
                    <option value="in">Eingehend</option>
                    <option value="out">Ausgehend</option>
                    <option value="internal">Intern</option>
                  </select>
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Datum</div>
                  <input type="date" style={inputStyle} value={commForm.date} onChange={e => setCommForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Autor</div>
                  <input style={inputStyle} value={commForm.author} onChange={e => setCommForm(f => ({ ...f, author: e.target.value }))} />
                </div>
              </div>
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Betreff</div>
                <input style={inputStyle} value={commForm.subject} onChange={e => setCommForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Inhalt</div>
                <textarea rows={4} style={{ ...inputStyle, resize: 'vertical' }} value={commForm.body} onChange={e => setCommForm(f => ({ ...f, body: e.target.value }))} />
              </div>
              {commError && <div style={{ color: '#f87171', fontSize: 12 }}>{commError}</div>}
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setCommOpen(false)}>Abbrechen</button>
              <button className="btn primary" onClick={saveComm} disabled={commSaving}>{commSaving ? 'Speichern…' : 'Speichern'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Field Visit */}
      {visitOpen && (
        <div className="overlay" onClick={() => setVisitOpen(false)}>
          <div className="modal" style={{ width: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <Ic name="pin" size={15} color="#34d399" />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Field Visit erfassen</span>
              <button className="btn ghost" style={{ marginLeft: 'auto', padding: 4 }} onClick={() => setVisitOpen(false)}>
                <Ic name="x" size={13} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 6 }}>Typ</div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {(['Field Visit','Audit','Inspektion'] as const).map(tp => (
                    <span key={tp} className={`chip${visitForm.type === tp ? ' on' : ''}`} onClick={() => setVisitForm(f => ({ ...f, type: tp }))} style={{ cursor: 'pointer', fontSize: 11 }}>{tp}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Datum</div>
                <input type="date" style={inputStyle} value={visitForm.date} onChange={e => setVisitForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Inspektor</div>
                <input style={inputStyle} value={visitForm.inspector} onChange={e => setVisitForm(f => ({ ...f, inspector: e.target.value }))} />
              </div>
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 6 }}>Ergebnis</div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {(['positiv','ausstehend','negativ'] as const).map(r => (
                    <span key={r} className={`chip${visitForm.result === r ? ' on' : ''}`} onClick={() => setVisitForm(f => ({ ...f, result: r }))} style={{ cursor: 'pointer', fontSize: 11 }}>{r}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Notizen</div>
                <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} value={visitForm.notes} onChange={e => setVisitForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setVisitOpen(false)}>Abbrechen</button>
              <button className="btn primary" onClick={addVisit} disabled={!visitForm.date || visitSaving}>
                {visitSaving ? 'Speichern…' : 'Erfassen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

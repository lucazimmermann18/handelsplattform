'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtDate, fmtNum } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge, Stars, BarChart, StatusBadge } from '@/components/ui/primitives';

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

// --- Suppliers List ---

interface SuppliersListProps {
  lang: Lang;
  onOpen: (id: string) => void;
}

export const SuppliersList = ({ lang, onOpen }: SuppliersListProps) => {
  const { data: M, refresh } = useData();
  const [mapOpen, setMapOpen] = useState(false);

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  void refresh; // available if needed

  const handleExport = () => {
    const headers = ['ID','Name','Typ','Land','Region','Stadt','Kontakt','Email','Kapazität','Tier','Score','Risiko','Status'];
    const rows = M.suppliers.map(s => [s.id, s.name, s.type, s.country, s.region, s.city, s.contact, s.email, s.capacity, s.tier, s.score, s.risk, s.status]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `lieferanten-${new Date().toISOString().slice(0,10)}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const kpis = [
    { l: 'Aktiv', v: M.suppliers.filter(s => s.status === 'aktiv').length, c: '#34d399' },
    { l: 'In Prüfung', v: M.suppliers.filter(s => s.status === 'in Prüfung').length, c: '#fbbf24' },
    { l: 'Tier A', v: M.suppliers.filter(s => s.tier === 'A').length, c: '#60a5fa' },
    { l: 'Ø Score', v: M.suppliers.length > 0 ? (M.suppliers.reduce((s, x) => s + x.score, 0) / M.suppliers.length).toFixed(1) : '—', c: '#a78bfa' },
    { l: 'Hochrisiko', v: M.suppliers.filter(s => s.risk === 'hoch').length, c: '#f87171' },
  ];

  const getCountryCoords = (country: string, idx: number): { x: number; y: number } => {
    const jx = ((idx * 13) % 20) - 10;
    const jy = ((idx * 17) % 20) - 10;
    if (country === 'TZ' || country.toLowerCase().includes('tanzania')) return { x: 180 + jx, y: 200 + jy };
    if (country === 'KE' || country.toLowerCase().includes('kenya')) return { x: 200 + jx, y: 160 + jy };
    if (country === 'UG' || country.toLowerCase().includes('uganda')) return { x: 160 + jx, y: 155 + jy };
    return { x: 150 + jx, y: 180 + jy };
  };

  return (
    <>
      <div>
        <div className="section-head">
          <h1>{t(lang, 'nav_suppliers')}</h1>
          <div className="sub">{M.suppliers.length} Lieferanten · 3 Länder · {M.suppliers.filter(s => s.tier === 'A').length} Tier-A</div>
          <div className="right">
            <button className="btn" onClick={() => setMapOpen(true)}><Ic name="map" size={13} /> Karte</button>
            <button className="btn" onClick={handleExport}><Ic name="download" size={13} /> {t(lang, 'export')}</button>
            <button className="btn primary" onClick={() => window.dispatchEvent(new CustomEvent('open-supplier-wizard'))}><Ic name="plus" size={13} /> Neuer Lieferant</button>
          </div>
        </div>

        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
            {kpis.map((k, i) => (
              <div key={i} className="tile kacheln" style={{ padding: 9 }}>
                <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase' }}>{k.l}</div>
                <div className="mono fw600" style={{ fontSize: 18, color: k.c, marginTop: 2 }}>{k.v}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Lieferant</th>
                  <th>Typ · Region</th>
                  <th>Produkte</th>
                  <th>Score</th>
                  <th>Kapazität</th>
                  <th>Zertifikate</th>
                  <th>Letzte Lieferung</th>
                  <th>Risiko</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {M.suppliers.map(s => (
                  <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => onOpen(s.id)}>
                    <td>
                      <div className="fw500">{s.name}</div>
                      <div className="tx3 mono" style={{ fontSize: 10 }}>{s.id} · {s.contact}</div>
                    </td>
                    <td>
                      <div>{s.type}</div>
                      <div className="tx3" style={{ fontSize: 10.5 }}>{s.region}, {s.country}</div>
                    </td>
                    <td>
                      <div className="tx2" style={{ fontSize: 11.5 }}>
                        {s.products.slice(0, 2).join(', ')}{s.products.length > 2 ? ` +${s.products.length - 2}` : ''}
                      </div>
                    </td>
                    <td>
                      <div className="row"><Stars value={Math.round(s.score)} /></div>
                      <div className="tx3 mono" style={{ fontSize: 10 }}>{s.score.toFixed(1)} · Tier {s.tier}</div>
                    </td>
                    <td className="mono tx2" style={{ fontSize: 11 }}>{s.capacity}</td>
                    <td>
                      <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                        {s.certs.slice(0, 2).map((c, i) => (
                          <Badge key={i} kind={c.includes('pending') ? 'warning' : 'success'}>{c.split(' ')[0]}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="mono tx2" style={{ fontSize: 11 }}>{fmtDate(s.lastDelivery)}</td>
                    <td>
                      <Badge kind={s.risk === 'niedrig' ? 'success' : s.risk === 'mittel' ? 'warning' : 'danger'} dot>
                        {s.risk}
                      </Badge>
                    </td>
                    <td>
                      <Badge kind={s.status === 'aktiv' ? 'success' : 'warning'} dot>{s.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Map Modal */}
      {mapOpen && (
        <div className="overlay" onClick={() => setMapOpen(false)}>
          <div className="modal" style={{ width: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <Ic name="map" size={15} color="#22d3ee" />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Lieferanten-Karte</span>
              <button className="btn ghost" style={{ marginLeft: 'auto', padding: 4 }} onClick={() => setMapOpen(false)}>
                <Ic name="x" size={13} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Left: Africa SVG map */}
                <div>
                  <svg width="280" height="320" viewBox="0 0 280 320" style={{ display: 'block' }}>
                    <rect width="280" height="320" fill="rgba(6,9,15,0.6)" rx="6" />
                    <path
                      d="M100,20 L160,10 L200,30 L230,60 L240,100 L250,150 L230,200 L200,240 L160,280 L120,300 L80,280 L50,240 L30,200 L20,150 L30,100 L60,60 Z"
                      fill="rgba(34,211,238,0.07)"
                      stroke="rgba(34,211,238,0.3)"
                      strokeWidth="1"
                    />
                    {M.suppliers.map((s, idx) => {
                      const { x, y } = getCountryCoords(s.country, idx);
                      return (
                        <g key={s.id}>
                          <circle cx={x} cy={y} r="5" fill="#60a5fa" opacity="0.8" />
                          <title>{s.name} · {s.city}, {s.country}</title>
                        </g>
                      );
                    })}
                    <text x="140" y="310" fill="#5d667d" fontFamily="Geist Mono" fontSize="8" textAnchor="middle">Afrika · vereinfacht</text>
                  </svg>
                </div>
                {/* Right: supplier list */}
                <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {M.suppliers.map(s => (
                    <div key={s.id} style={{ padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 6, border: '1px solid var(--border)' }}>
                      <div className="fw500" style={{ fontSize: 12, marginBottom: 2 }}>{s.name}</div>
                      <div className="tx3" style={{ fontSize: 10.5, marginBottom: 5 }}>{s.city}, {s.country}</div>
                      <a
                        href={'https://www.google.com/maps/search/' + encodeURIComponent(s.city + ', ' + s.country)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn sm"
                        style={{ textDecoration: 'none', fontSize: 10 }}
                        onClick={e => e.stopPropagation()}
                      >
                        <Ic name="map" size={10} /> Google Maps
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// --- Supplier Detail ---

interface SupplierDetailProps {
  id: string;
  lang: Lang;
  onBack: () => void;
}

export const SupplierDetail = ({ id, lang, onBack }: SupplierDetailProps) => {
  const { data: M, refresh } = useData();
  const s = M?.suppliers.find(x => x.id === id);
  const orders = M && s ? M.orders.filter(o => o.supplierId === s.id) : [];

  const [detailTab, setDetailTab] = useState<'overview' | 'comms'>('overview');
  const [commModalOpen, setCommModalOpen] = useState(false);
  const [commForm, setCommForm] = useState({
    type: 'note' as 'email' | 'call' | 'meeting' | 'note' | 'whatsapp',
    direction: 'out' as 'in' | 'out' | 'internal',
    date: new Date().toISOString().slice(0, 10),
    subject: '', body: '', author: 'Admin',
  });
  const [commSaving, setCommSaving] = useState(false);
  const [commError, setCommError] = useState<string | null>(null);

  const handleSaveComm = async () => {
    setCommSaving(true); setCommError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { error } = await createClient().from('communications').insert({
        contact_id: id, contact_type: 'supplier',
        type: commForm.type, direction: commForm.direction,
        date: commForm.date, subject: commForm.subject,
        body: commForm.body, author: commForm.author,
      });
      if (error) throw new Error(error.message);
      setCommModalOpen(false);
      setCommForm({ type: 'note', direction: 'out', date: new Date().toISOString().slice(0, 10), subject: '', body: '', author: 'Admin' });
      refresh();
    } catch (e) { setCommError((e as Error).message); }
    finally { setCommSaving(false); }
  };

  const commTypeIcon = (tp: string) => {
    if (tp === 'email') return 'mail';
    if (tp === 'call') return 'phone';
    if (tp === 'meeting') return 'buyer';
    if (tp === 'whatsapp') return 'phone';
    return 'doc';
  };

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', type: '', country: '', region: '', city: '', contact: '', phone: '', email: '', capacity: '', tier: 'B' as 'A'|'B'|'C', risk: 'niedrig' as 'niedrig'|'mittel'|'hoch', status: 'aktiv' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string|null>(null);

  // Notes state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notes, setNotes] = useState<{id:string; author:string; content:string; type:string; created_at:string}[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'note'|'email'|'call'>('note');
  const [noteSaving, setNoteSaving] = useState(false);

  // Field visits state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [visits, setVisits] = useState<{id:string; type:string; visit_date:string; inspector:string; result:string; notes:string}[]>([]);
  const [visitOpen, setVisitOpen] = useState(false);
  const [visitForm, setVisitForm] = useState({ type: 'Field Visit', date: '', inspector: 'Admin', notes: '', result: 'ausstehend' });
  const [visitSaving, setVisitSaving] = useState(false);

  const seed = s ? s.id.charCodeAt(s.id.length - 1) : 0;
  const priceHistory = useMemo(() =>
    Array.from({ length: 12 }).map((_, i) => ({
      m: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i],
      v: parseFloat((4 + Math.sin(i / 2 + seed * 0.1) * 0.4 + (((seed * (i + 1) * 17) % 100) / 500)).toFixed(2)),
    })),
    [seed]
  );

  // Load notes
  useEffect(() => {
    let mounted = true;
    const loadNotes = async () => {
      setNotesLoading(true);
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const { data } = await createClient().from('supplier_notes')
          .select('*').eq('supplier_id', id).order('created_at', { ascending: true });
        if (mounted) setNotes(data ?? []);
      } catch (_e) {}
      if (mounted) setNotesLoading(false);
    };
    loadNotes();
    return () => { mounted = false; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load visits
  const loadVisits = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { data } = await createClient().from('field_visits')
        .select('*').eq('supplier_id', id).order('visit_date', { ascending: false });
      setVisits(data ?? []);
    } catch (_e) {}
  };
  useEffect(() => { loadVisits(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  if (!s) return <div className="empty">Lieferant nicht gefunden</div>;

  const circumference = 2 * Math.PI * 38;
  const scoreDash = (s.score / 5) * circumference;

  const openEdit = () => {
    setEditForm({ name: s.name, type: s.type, country: s.country, region: s.region, city: s.city, contact: s.contact, phone: s.phone, email: s.email, capacity: s.capacity, tier: s.tier, risk: s.risk, status: s.status });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    setEditSaving(true); setEditError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { error } = await createClient().from('suppliers').update({
        name: editForm.name, type: editForm.type,
        country: editForm.country, region: editForm.region, city: editForm.city,
        contact: editForm.contact, phone: editForm.phone, email: editForm.email,
        capacity: editForm.capacity, tier: editForm.tier,
        risk: editForm.risk, status: editForm.status,
      }).eq('id', s.id);
      if (error) throw new Error(error.message);
      setEditOpen(false);
      refresh();
    } catch (e) { setEditError((e as Error).message); }
    finally { setEditSaving(false); }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setNoteSaving(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { data: inserted } = await createClient().from('supplier_notes').insert({
        supplier_id: id, author: 'Admin', content: newNote, type: noteType,
      }).select().single();
      if (inserted) setNotes(prev => [...prev, inserted]);
      setNewNote('');
    } catch (_e) {}
    setNoteSaving(false);
  };

  const handleAddVisit = async () => {
    if (!visitForm.date) return;
    setVisitSaving(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { error } = await createClient().from('field_visits').insert({
        supplier_id: id, type: visitForm.type, visit_date: visitForm.date,
        inspector: visitForm.inspector, notes: visitForm.notes, result: visitForm.result,
      });
      if (error) throw new Error(error.message);
      setVisitOpen(false);
      setVisitForm({ type: 'Field Visit', date: '', inspector: 'Admin', notes: '', result: 'ausstehend' });
      await loadVisits();
    } catch (_e) {}
    setVisitSaving(false);
  };

  return (
    <>
      <div>
        <div className="section-head">
          <button className="btn ghost" onClick={onBack} style={{ padding: 4 }}>
            <Ic name="chevL" size={14} /> {t(lang, 'back')}
          </button>
          <div style={{
            width: 44, height: 44, borderRadius: 8,
            background: 'linear-gradient(135deg, #1a2540, #0e1828)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, color: '#60a5fa', fontFamily: 'Geist Mono',
          }}>
            {s.country.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18 }}>{s.name}</h1>
            <div className="tx3" style={{ fontSize: 12 }}>{s.id} · {s.type} · {s.region}, {s.country}</div>
          </div>
          <Badge kind="success" dot>{s.status}</Badge>
          <Badge kind={s.risk === 'niedrig' ? 'success' : s.risk === 'mittel' ? 'warning' : 'danger'}>
            Risiko {s.risk}
          </Badge>
          <div className="right">
            <button className="btn" onClick={() => window.open('https://www.google.com/maps/search/' + encodeURIComponent(s.city + ', ' + s.country), '_blank')}>
              <Ic name="map" size={13} /> Auf Karte
            </button>
            <button className="btn" onClick={() => { if (s.phone) window.open('tel:' + s.phone.replace(/\s/g, ''), '_blank'); }}>
              <Ic name="phone" size={13} /> Anrufen
            </button>
            <button className="btn primary" onClick={openEdit}>
              <Ic name="edit" size={13} /> Bearbeiten
            </button>
          </div>
        </div>

        <div style={{ padding: '0 0 0 16px' }}>
          <div className="tabs" style={{ marginBottom: 0 }}>
            <div className={`tab${detailTab === 'overview' ? ' on' : ''}`} onClick={() => setDetailTab('overview')}>
              <Ic name="supplier" size={12} /> Übersicht
            </div>
            <div className={`tab${detailTab === 'comms' ? ' on' : ''}`} onClick={() => setDetailTab('comms')}>
              <Ic name="mail" size={12} /> Kommunikation
            </div>
          </div>
        </div>

        {detailTab === 'comms' && (
          <div style={{ padding: '16px 16px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button className="btn primary" onClick={() => setCommModalOpen(true)}>
                <Ic name="plus" size={13} /> Kommunikation erfassen
              </button>
            </div>
            {(() => {
              const comms = (M.communications ?? []).filter(c => c.contactId === id && c.contactType === 'supplier')
                .sort((a, b) => b.date.localeCompare(a.date));
              if (comms.length === 0) return (
                <div className="card" style={{ padding: '40px 16px', textAlign: 'center' }}>
                  <Ic name="mail" size={28} color="var(--text-3)" />
                  <div className="tx3" style={{ fontSize: 12, marginTop: 8 }}>Noch keine Kommunikation erfasst</div>
                  <div className="tx3" style={{ fontSize: 11, marginTop: 4 }}>Klicken Sie auf &quot;Kommunikation erfassen&quot; um zu beginnen.</div>
                </div>
              );
              return (
                <div className="card">
                  <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {comms.map((c, i) => (
                      <div key={c.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < comms.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Ic name={commTypeIcon(c.type)} size={13} color="#34d399" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="row" style={{ gap: 6, marginBottom: 3 }}>
                            <span className="fw600" style={{ fontSize: 12 }}>{c.subject || '(kein Betreff)'}</span>
                            <Badge kind={c.direction === 'in' ? 'success' : c.direction === 'out' ? 'info' : 'neutral'}>
                              {c.direction === 'in' ? 'Eingehend' : c.direction === 'out' ? 'Ausgehend' : 'Intern'}
                            </Badge>
                            <span className="tx3 mono" style={{ fontSize: 10, marginLeft: 'auto' }}>{fmtDate(c.date)}</span>
                          </div>
                          <div className="tx2" style={{ fontSize: 11.5, lineHeight: 1.5, marginBottom: 3 }}>{c.body}</div>
                          <div className="tx3" style={{ fontSize: 10 }}>{c.author}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {detailTab === 'overview' && <div className="detail-grid">
          {/* ---- LEFT COLUMN ---- */}
          <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Farm Map */}
            <div className="card">
              <div className="card-head">
                <Ic name="map" size={14} />
                <span className="title">Standort &amp; Farm-Karte</span>
                <span className="meta">GPS · EUDR-konform</span>
              </div>
              <div style={{ height: 260, position: 'relative', background: 'radial-gradient(ellipse at 60% 40%, #0b1320 0%, #06090f 100%)', overflow: 'hidden' }}>
                <svg viewBox="0 0 600 260" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <pattern id="topo" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M0,20 Q10,15 20,20 T40,20" fill="none" stroke="rgba(34,197,94,0.04)" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="600" height="260" fill="url(#topo)" />
                  {/* River */}
                  <path d="M50,200 Q150,180 250,200 T450,200 L600,210 L600,260 L0,260 L0,210 Z" fill="rgba(34,211,238,0.06)" />
                  <path d="M100,80 Q200,100 300,80 T500,100" fill="none" stroke="rgba(34,211,238,0.2)" strokeWidth="1.5" strokeLinecap="round" />
                  <text x="430" y="92" fill="#22d3ee" fontFamily="Geist Mono" fontSize="9">Pangani River</text>
                  {/* Road */}
                  <path d="M0,130 Q200,140 400,130 L600,130" fill="none" stroke="rgba(245,158,11,0.18)" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="100" y="125" fill="#f59e0b" fontFamily="Geist Mono" fontSize="8">B144 · Arusha–Moshi</text>
                  {/* Farm plots */}
                  {[
                    { x: 220, y: 110, label: 'Plot A · 12.4 ha · Arabica', score: 'A' },
                    { x: 290, y: 140, label: 'Plot B · 8.2 ha · Macadamia', score: 'A' },
                    { x: 340, y: 105, label: 'Plot C · 6.1 ha · Arabica', score: 'B' },
                    { x: 380, y: 150, label: 'Plot D · 4.8 ha · Mixed', score: 'A' },
                  ].map((f, i) => (
                    <g key={i}>
                      <rect x={f.x - 18} y={f.y - 12} width="36" height="24" fill="rgba(52,211,153,0.18)" stroke="#34d399" strokeWidth="0.8" rx="2" />
                      <text x={f.x} y={f.y - 16} fill="#34d399" fontFamily="Geist Mono" fontSize="8" textAnchor="middle">{f.label}</text>
                    </g>
                  ))}
                  {/* HQ pin */}
                  <g transform="translate(290, 130)">
                    <circle r="14" fill="rgba(59,130,246,0.2)" />
                    <circle r="6" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
                    <text y="-20" fill="white" fontFamily="Geist" fontSize="10" fontWeight="600" textAnchor="middle">{s.name.split(' ')[0]} HQ</text>
                    <text y="26" fill="#8893a8" fontFamily="Geist Mono" fontSize="8" textAnchor="middle">-3.3869, 36.6830</text>
                  </g>
                  {/* Compass */}
                  <g transform="translate(560, 30)">
                    <text x="0" y="0" fill="#5d667d" fontFamily="Geist Mono" fontSize="9" textAnchor="middle">N</text>
                    <line x1="0" y1="3" x2="0" y2="14" stroke="#5d667d" />
                    <path d="M-3,13 L0,3 L3,13 Z" fill="#5d667d" />
                  </g>
                </svg>
                <div style={{ position: 'absolute', left: 12, bottom: 12, background: 'rgba(8,14,24,0.8)', backdropFilter: 'blur(8px)', padding: 8, borderRadius: 4, fontSize: 10, fontFamily: 'Geist Mono', color: '#34d399' }}>
                  <div className="row"><span className="dot" style={{ background: '#34d399' }} />4 Farm-Plots · 31.5 ha</div>
                  <div className="row" style={{ marginTop: 2 }}><span className="dot" style={{ background: '#3b82f6' }} />GPS verifiziert · 12.05.2026</div>
                </div>
                <div style={{ position: 'absolute', right: 12, top: 12, background: 'rgba(8,14,24,0.8)', backdropFilter: 'blur(8px)', padding: '6px 9px', borderRadius: 4, fontSize: 10, fontFamily: 'Geist Mono', color: '#22d3ee' }}>
                  <span style={{ color: '#22d3ee' }}>● LIVE</span> Satelliten-Imagery · Sentinel-2
                </div>
              </div>
            </div>

            {/* Price History */}
            <div className="card">
              <div className="card-head">
                <Ic name="chart" size={14} />
                <span className="title">Einkaufspreis-Verlauf · 12 Monate</span>
                <div style={{ marginLeft: 'auto' }} className="row">
                  <Badge kind="info">EK €/kg</Badge>
                  <span className="tx3 mono" style={{ fontSize: 11 }}>Ø 4,18 €/kg · ±6%</span>
                </div>
              </div>
              <div className="card-body">
                <BarChart data={priceHistory} w={680} h={130} color="#3b82f6" lblKey="m" valKey="v" />
              </div>
            </div>

            {/* Order History */}
            <div className="card">
              <div className="card-head">
                <Ic name="history" size={14} />
                <span className="title">Lieferhistorie</span>
                <span className="meta">{orders.length} Aufträge</span>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Auftrag</th>
                    <th>Produkt</th>
                    <th className="num">Menge</th>
                    <th>Charge</th>
                    <th>QC</th>
                    <th>Status</th>
                    <th>Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 && (
                    <tr><td colSpan={7} className="empty">Keine Aufträge bisher</td></tr>
                  )}
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td><span className="id">{o.id}</span></td>
                      <td>{o.productVariant}</td>
                      <td className="num">{fmtNum(o.qty)} {o.unit}</td>
                      <td className="mono">{o.batch}</td>
                      <td><Badge kind="success" dot>Pass</Badge></td>
                      <td><StatusBadge s={o.status} lang={lang} /></td>
                      <td className="mono tx2" style={{ fontSize: 11 }}>{fmtDate(o.created)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Communication */}
            <div className="card">
              <div className="card-head">
                <Ic name="mail" size={14} />
                <span className="title">Kommunikation &amp; Notizen</span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                {/* Timeline */}
                {notesLoading ? (
                  <div className="tx3" style={{ fontSize: 12, padding: '8px 0' }}>Lädt…</div>
                ) : notes.length === 0 ? (
                  <div className="tx3" style={{ fontSize: 12, marginBottom: 12 }}>Noch keine Notizen erfasst.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {notes.map(n => (
                      <div key={n.id} style={{ display: 'flex', gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Ic name={n.type === 'email' ? 'mail' : n.type === 'call' ? 'phone' : 'doc'} size={11} color="#5d667d" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="row" style={{ gap: 6, marginBottom: 2 }}>
                            <span className="fw500" style={{ fontSize: 11.5 }}>{n.author}</span>
                            <Badge kind={n.type === 'email' ? 'info' : n.type === 'call' ? 'success' : 'neutral'}>{n.type === 'note' ? 'Notiz' : n.type === 'email' ? 'E-Mail' : 'Anruf'}</Badge>
                            <span className="tx3 mono" style={{ fontSize: 10, marginLeft: 'auto' }}>{new Date(n.created_at).toLocaleDateString('de-DE')}</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{n.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Add form */}
                <div style={{ borderTop: notes.length > 0 ? '1px solid var(--border)' : 'none', paddingTop: notes.length > 0 ? 10 : 0 }}>
                  <div className="row" style={{ gap: 5, marginBottom: 7 }}>
                    {(['note','email','call'] as const).map(tp => (
                      <span key={tp} className={`chip${noteType === tp ? ' on' : ''}`} onClick={() => setNoteType(tp)} style={{ cursor: 'pointer', fontSize: 11 }}>
                        {tp === 'note' ? 'Notiz' : tp === 'email' ? 'E-Mail' : 'Anruf'}
                      </span>
                    ))}
                  </div>
                  <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Notiz, E-Mail oder Anruf erfassen…" rows={2}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical' }} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 7 }}>
                    <button className="btn primary sm" onClick={handleAddNote} disabled={noteSaving || !newNote.trim()}>
                      {noteSaving ? 'Speichern…' : <><Ic name="plus" size={11} /> Hinzufügen</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---- RIGHT COLUMN ---- */}
          <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Scoring Ring */}
            <div className="card">
              <div className="card-head"><Ic name="star" size={14} /><span className="title">Scoring</span></div>
              <div className="card-body">
                <div className="row" style={{ marginBottom: 10 }}>
                  <div className="risk-ring">
                    <svg width="90" height="90" viewBox="0 0 90 90">
                      <circle cx="45" cy="45" r="38" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="none" />
                      <circle
                        cx="45" cy="45" r="38"
                        stroke="#34d399" strokeWidth="6" fill="none"
                        strokeDasharray={`${scoreDash} ${circumference}`}
                        transform="rotate(-90 45 45)"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="v">
                      <div className="num">{s.score.toFixed(1)}</div>
                      <div className="lbl">SCORE</div>
                    </div>
                  </div>
                  <div style={{ flex: 1, marginLeft: 16 }}>
                    <div className="row tx2" style={{ marginBottom: 3 }}><span style={{ flex: 1, fontSize: 11.5 }}>Qualität</span><Stars value={s.qual} /></div>
                    <div className="row tx2" style={{ marginBottom: 3 }}><span style={{ flex: 1, fontSize: 11.5 }}>Lieferzuverlässigkeit</span><Stars value={s.rel} /></div>
                    <div className="row tx2" style={{ marginBottom: 3 }}><span style={{ flex: 1, fontSize: 11.5 }}>Kommunikation</span><Stars value={s.comm} /></div>
                    <div className="row tx2" style={{ marginBottom: 3 }}><span style={{ flex: 1, fontSize: 11.5 }}>Preisstabilität</span><Stars value={s.price} /></div>
                    <div className="row tx2"><span style={{ flex: 1, fontSize: 11.5 }}>Dokumentation</span><Stars value={s.docs} /></div>
                  </div>
                </div>
                <div className="sep" />
                <div className="row" style={{ fontSize: 11.5, marginBottom: 6 }}>
                  <span className="tx3">Tier</span>
                  <Badge kind="success">Tier {s.tier}</Badge>
                </div>
                <div className="row" style={{ fontSize: 11.5, marginBottom: 6 }}>
                  <span className="tx3">Compliance-Risiko</span>
                  <Badge kind={s.risk === 'niedrig' ? 'success' : s.risk === 'mittel' ? 'warning' : 'danger'} dot>{s.risk}</Badge>
                </div>
                <div className="row" style={{ fontSize: 11.5 }}>
                  <span className="tx3">Aktiv seit</span>
                  <span className="mono">2022-09</span>
                </div>
              </div>
            </div>

            {/* Stammdaten */}
            <div className="card">
              <div className="card-head"><Ic name="info" size={14} /><span className="title">Stammdaten</span></div>
              <div className="card-body">
                <div className="fields">
                  <div className="l">Ansprechpartner</div><div className="v">{s.contact}</div>
                  <div className="l">Telefon</div><div className="v mono">{s.phone}</div>
                  <div className="l">E-Mail</div><div className="v mono" style={{ fontSize: 11 }}>{s.email}</div>
                  {s.whatsapp && <><div className="l">WhatsApp</div><div className="v mono">{s.whatsapp}</div></>}
                  <div className="l">Sprachen</div><div className="v">{s.language || 'sw / en'}</div>
                  <div className="l">Kapazität</div><div className="v mono">{s.capacity}</div>
                  <div className="l">Bankdaten</div><div className="v"><Badge kind="success">verifiziert</Badge></div>
                  <div className="l">Steuer-ID</div><div className="v mono">TZ-TIN-2247-{s.id.slice(-3)}</div>
                  <div className="l">Registrierung</div><div className="v mono">BRELA #{(seed * 7 + 100000) % 999999}</div>
                </div>
              </div>
            </div>

            {/* Zertifikate */}
            <div className="card">
              <div className="card-head">
                <Ic name="leaf" size={14} />
                <span className="title">Zertifikate</span>
                <span className="meta">{s.certs.length}</span>
              </div>
              <div className="card-body">
                {s.certs.map((c, i) => (
                  <div key={i} className="row" style={{ padding: '7px 0', borderBottom: i < s.certs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <Ic name="leaf" size={12} color="#34d399" />
                    <div style={{ flex: 1 }}>
                      <div className="fw500" style={{ fontSize: 12 }}>{c}</div>
                      <div className="tx3 mono" style={{ fontSize: 10 }}>gültig bis {2027 - i}-04-{20 - i}</div>
                    </div>
                    <Badge kind={c.includes('pending') ? 'warning' : 'success'} dot>
                      {c.includes('pending') ? 'pending' : 'gültig'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Field Visits */}
            <div className="card">
              <div className="card-head">
                <Ic name="pin" size={14} />
                <span className="title">Field Visits &amp; Audits</span>
                <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => setVisitOpen(true)}>
                  <Ic name="plus" size={11} /> Hinzufügen
                </button>
              </div>
              {visits.length === 0 && !visitOpen ? (
                <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                  <div className="tx3" style={{ fontSize: 12 }}>Noch keine Field Visits erfasst</div>
                </div>
              ) : (
                <div style={{ padding: '0 16px 12px' }}>
                  {visits.map(v => (
                    <div key={v.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div className="row" style={{ gap: 6, marginBottom: 2 }}>
                          <Badge kind={v.type === 'Audit' ? 'warning' : 'info'}>{v.type}</Badge>
                          <span className="mono tx3" style={{ fontSize: 10 }}>{new Date(v.visit_date).toLocaleDateString('de-DE')}</span>
                          <Badge kind={v.result === 'positiv' ? 'success' : v.result === 'negativ' ? 'danger' : 'neutral'}>{v.result}</Badge>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{v.inspector}{v.notes ? ` · ${v.notes}` : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>}
      </div>

      {commModalOpen && (
        <div className="overlay" onClick={() => setCommModalOpen(false)}>
          <div className="modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <Ic name="mail" size={15} color="#34d399" />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Kommunikation erfassen</span>
              <button className="btn ghost" style={{ marginLeft: 'auto', padding: 4 }} onClick={() => setCommModalOpen(false)}>
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
                    <option value="meeting">Meeting</option>
                    <option value="note">Notiz</option>
                    <option value="whatsapp">WhatsApp</option>
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
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
              <button className="btn" onClick={() => setCommModalOpen(false)}>Abbrechen</button>
              <button className="btn primary" onClick={handleSaveComm} disabled={commSaving}>
                {commSaving ? 'Speichern…' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && (
        <div className="overlay" onClick={() => setEditOpen(false)}>
          <div className="modal" style={{ width: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <Ic name="edit" size={15} color="#60a5fa" />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Lieferant bearbeiten</span>
              <button className="btn ghost" style={{ marginLeft: 'auto', padding: 4 }} onClick={() => setEditOpen(false)}>
                <Ic name="x" size={13} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Name full width */}
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Name</div>
                <input style={inputStyle} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              {/* Typ + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Typ</div>
                  <select style={inputStyle} value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}>
                    <option>Produzent</option>
                    <option>Exporteur</option>
                    <option>Kooperative</option>
                    <option>Händler</option>
                  </select>
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Status</div>
                  <select style={inputStyle} value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="aktiv">aktiv</option>
                    <option value="inaktiv">inaktiv</option>
                    <option value="in Prüfung">in Prüfung</option>
                  </select>
                </div>
              </div>
              {/* Land + Region */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Land</div>
                  <input style={inputStyle} value={editForm.country} onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))} />
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Region</div>
                  <input style={inputStyle} value={editForm.region} onChange={e => setEditForm(f => ({ ...f, region: e.target.value }))} />
                </div>
              </div>
              {/* Stadt + Kapazität */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Stadt</div>
                  <input style={inputStyle} value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Kapazität</div>
                  <input style={inputStyle} value={editForm.capacity} onChange={e => setEditForm(f => ({ ...f, capacity: e.target.value }))} />
                </div>
              </div>
              {/* Ansprechpartner + Telefon */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Ansprechpartner</div>
                  <input style={inputStyle} value={editForm.contact} onChange={e => setEditForm(f => ({ ...f, contact: e.target.value }))} />
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Telefon</div>
                  <input style={inputStyle} value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              {/* E-Mail full width */}
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>E-Mail</div>
                <input style={inputStyle} value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              {/* Tier + Risiko chips on same row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 6 }}>Tier</div>
                  <div className="row" style={{ gap: 5 }}>
                    {(['A','B','C'] as const).map(t => (
                      <span key={t} className={`chip${editForm.tier === t ? ' on' : ''}`} onClick={() => setEditForm(f => ({ ...f, tier: t }))} style={{ cursor: 'pointer' }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 6 }}>Risiko</div>
                  <div className="row" style={{ gap: 5 }}>
                    {(['niedrig','mittel','hoch'] as const).map(r => (
                      <span key={r} className={`chip${editForm.risk === r ? ' on' : ''}`} onClick={() => setEditForm(f => ({ ...f, risk: r }))} style={{ cursor: 'pointer', fontSize: 11 }}>{r}</span>
                    ))}
                  </div>
                </div>
              </div>
              {editError && <div style={{ color: '#f87171', fontSize: 12 }}>{editError}</div>}
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setEditOpen(false)}>Abbrechen</button>
              <button className="btn primary" onClick={handleEditSave} disabled={editSaving}>
                {editSaving ? 'Speichern…' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field Visit Modal */}
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
              {/* Type chips */}
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 6 }}>Typ</div>
                <div className="row" style={{ gap: 5 }}>
                  {(['Field Visit','Audit','Inspektion'] as const).map(tp => (
                    <span key={tp} className={`chip${visitForm.type === tp ? ' on' : ''}`} onClick={() => setVisitForm(f => ({ ...f, type: tp }))} style={{ cursor: 'pointer', fontSize: 11 }}>{tp}</span>
                  ))}
                </div>
              </div>
              {/* Date */}
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Datum</div>
                <input type="date" style={inputStyle} value={visitForm.date} onChange={e => setVisitForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              {/* Inspector */}
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Inspektor</div>
                <input style={inputStyle} value={visitForm.inspector} onChange={e => setVisitForm(f => ({ ...f, inspector: e.target.value }))} />
              </div>
              {/* Result chips */}
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 6 }}>Ergebnis</div>
                <div className="row" style={{ gap: 5 }}>
                  {(['positiv','ausstehend','negativ'] as const).map(r => (
                    <span key={r} className={`chip${visitForm.result === r ? ' on' : ''}`} onClick={() => setVisitForm(f => ({ ...f, result: r }))} style={{ cursor: 'pointer', fontSize: 11 }}>{r}</span>
                  ))}
                </div>
              </div>
              {/* Notes */}
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Notizen</div>
                <textarea rows={2} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical' }} value={visitForm.notes} onChange={e => setVisitForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setVisitOpen(false)}>Abbrechen</button>
              <button className="btn primary" onClick={handleAddVisit} disabled={!visitForm.date || visitSaving}>
                {visitSaving ? 'Speichern…' : 'Erfassen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

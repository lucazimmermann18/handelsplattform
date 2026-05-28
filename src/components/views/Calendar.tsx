'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

interface CalendarViewProps { lang: Lang; }

// ── Event types & colors ──────────────────────────────────────────────────────

type EventSource = 'etd' | 'eta' | 'followup' | 'task' | 'quality' | 'visit' | 'appointment' | 'deadline';

interface CalEvent {
  label: string;
  source: EventSource;
  id: string;
  sublabel?: string;
}

const SOURCE_CONFIG: Record<EventSource, { label: string; color: string; bg: string }> = {
  etd:         { label: 'ETD',           color: '#3b82f6', bg: '#3b82f620' },
  eta:         { label: 'ETA',           color: '#34d399', bg: '#34d39920' },
  followup:    { label: 'Follow-up',     color: '#a78bfa', bg: '#a78bfa20' },
  task:        { label: 'Aufgabe',       color: '#f97316', bg: '#f9731620' },
  quality:     { label: 'QC-Prüfung',   color: '#fbbf24', bg: '#fbbf2420' },
  visit:       { label: 'Field Visit',  color: '#06b6d4', bg: '#06b6d420' },
  appointment: { label: 'Termin',       color: '#ec4899', bg: '#ec489920' },
  deadline:    { label: 'Deadline',     color: '#f87171', bg: '#f8717120' },
};

const ALL_SOURCES = Object.keys(SOURCE_CONFIG) as EventSource[];
const MONTH_NAMES = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const MONTH_SHORT = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const DAY_HEADERS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// ── Appointment form state ────────────────────────────────────────────────────

interface AppForm {
  id?: string;
  title: string;
  date: string;
  endDate: string;
  type: string;
  description: string;
  owner: string;
}

const emptyForm = (date = ''): AppForm => ({
  title: '', date, endDate: '', type: 'termin', description: '', owner: 'Admin',
});

const EVENT_TYPES = [
  { value: 'termin',   label: 'Termin',     color: '#ec4899' },
  { value: 'deadline', label: 'Deadline',   color: '#f87171' },
  { value: 'reise',    label: 'Reise',      color: '#f97316' },
  { value: 'meeting',  label: 'Meeting',    color: '#3b82f6' },
  { value: 'ernte',    label: 'Erntezeit',  color: '#fbbf24' },
  { value: 'intern',   label: 'Intern',     color: '#94a3b8' },
];

const typeToSource = (type: string): EventSource =>
  type === 'deadline' ? 'deadline' : 'appointment';

// ── Main component ────────────────────────────────────────────────────────────

export const CalendarView = ({ lang: _lang }: CalendarViewProps) => {
  const { data: M, refresh } = useData();
  const now = new Date();
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState<Set<EventSource>>(new Set(ALL_SOURCES));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [appModal, setAppModal] = useState<{ open: boolean; form: AppForm } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // ── Month calculation (before any early return) ────────────────────────────

  const baseDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const YEAR  = baseDate.getFullYear();
  const MONTH = baseDate.getMonth();
  const firstDay    = (new Date(YEAR, MONTH, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate();
  const isToday = (day: number) => day === now.getDate() && MONTH === now.getMonth() && YEAR === now.getFullYear();

  // ── Build event map (must be before early return) ──────────────────────────

  const eventMap = useMemo(() => {
    if (!M) return {} as Record<number, CalEvent[]>;
    const map: Record<number, CalEvent[]> = {};
    const add = (dateStr: string | null | undefined, ev: CalEvent) => {
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      if (d.getFullYear() === YEAR && d.getMonth() === MONTH) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(ev);
      }
    };

    if (filters.has('etd'))    M.orders.forEach(o => add(o.etd, { label: `ETD ${o.id.slice(-6)}`, source: 'etd', id: o.id, sublabel: M.products.find(p => p.id === o.productId)?.name }));
    if (filters.has('eta'))    M.orders.forEach(o => add(o.eta, { label: `ETA ${o.id.slice(-6)}`, source: 'eta', id: o.id, sublabel: M.buyers.find(b => b.id === o.buyerId)?.name }));
    if (filters.has('followup')) M.deals.forEach(d => add(d.nextFollow, { label: `Follow-up ${d.id.slice(-4)}`, source: 'followup', id: d.id, sublabel: M.buyers.find(b => b.id === d.buyerId)?.name }));
    if (filters.has('task'))   M.tasks.forEach(t => add(t.due, { label: t.t, source: 'task', id: t.id, sublabel: t.owner }));
    if (filters.has('quality')) M.quality.forEach(q => add(q.date, { label: `QC ${q.batch}`, source: 'quality', id: q.id, sublabel: q.product }));
    if (filters.has('visit'))  M.fieldVisits.forEach(v => add(v.visit_date, { label: `Visit: ${M.suppliers.find(s => s.id === v.supplier_id)?.name?.split(' ')[0] ?? 'Lieferant'}`, source: 'visit', id: v.id }));
    if (filters.has('appointment') || filters.has('deadline')) {
      M.calendarEvents.forEach(e => {
        const src = typeToSource(e.type);
        if (filters.has(src)) {
          add(e.date, { label: e.title, source: src, id: e.id, sublabel: e.owner !== 'Admin' ? e.owner : undefined });
        }
      });
    }
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [M, YEAR, MONTH, filters]);

  // ── Upcoming events (must be before early return) ──────────────────────────

  const upcoming = useMemo(() => {
    if (!M) return [] as { date: Date; ev: CalEvent }[];
    const today = new Date(); today.setHours(0,0,0,0);
    const limit = new Date(today); limit.setDate(limit.getDate() + 60);
    const allEvents: { date: Date; ev: CalEvent }[] = [];
    const tryAdd = (dateStr: string | null | undefined, ev: CalEvent) => {
      if (!dateStr) return;
      const d = new Date(dateStr); d.setHours(0,0,0,0);
      if (d >= today && d <= limit) allEvents.push({ date: d, ev });
    };
    M.orders.forEach(o => {
      tryAdd(o.etd, { label: `ETD ${o.id.slice(-6)}`, source: 'etd', id: o.id, sublabel: M.products.find(p => p.id === o.productId)?.name });
      tryAdd(o.eta, { label: `ETA ${o.id.slice(-6)}`, source: 'eta', id: o.id, sublabel: M.buyers.find(b => b.id === o.buyerId)?.name });
    });
    M.deals.forEach(d => tryAdd(d.nextFollow, { label: `Follow-up ${d.id.slice(-4)}`, source: 'followup', id: d.id }));
    M.tasks.forEach(t => tryAdd(t.due, { label: t.t, source: 'task', id: t.id, sublabel: t.prio === 'hoch' ? '🔴 Hoch' : undefined }));
    M.fieldVisits.forEach(v => tryAdd(v.visit_date, { label: `Visit: ${M.suppliers.find(s => s.id === v.supplier_id)?.name?.split(' ')[0] ?? 'Lieferant'}`, source: 'visit', id: v.id }));
    M.calendarEvents.forEach(e => tryAdd(e.date, { label: e.title, source: typeToSource(e.type), id: e.id, sublabel: e.description?.slice(0, 40) }));
    return allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [M]);

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  // ── Calendar grid cells ─────────────────────────────────────────────────────

  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array(totalCells - firstDay - daysInMonth).fill(null),
  ];

  // ── Harvest seasons from products ──────────────────────────────────────────

  const harvestProducts = M.products.filter(p => p.harvestSeason);

  // ── Toggle filter ──────────────────────────────────────────────────────────

  const toggleFilter = (src: EventSource) => {
    setFilters(prev => {
      const next = new Set(prev);
      if (next.has(src)) next.delete(src); else next.add(src);
      return next;
    });
  };

  // ── Day popup events ───────────────────────────────────────────────────────

  const selectedEvents = selectedDay ? (eventMap[selectedDay] ?? []) : [];
  const selectedDateStr = selectedDay ? `${YEAR}-${String(MONTH + 1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}` : '';

  // ── Save appointment ───────────────────────────────────────────────────────

  const saveAppointment = async (form: AppForm) => {
    if (!form.title || !form.date) return;
    setSaving(true); setSaveError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      if (form.id) {
        const { error } = await sb.from('calendar_events').update({
          title: form.title, date: form.date,
          end_date: form.endDate || null, type: form.type,
          description: form.description || null, owner: form.owner,
          all_day: true,
        }).eq('id', form.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await sb.from('calendar_events').insert({
          title: form.title, date: form.date,
          end_date: form.endDate || null, type: form.type,
          description: form.description || null, owner: form.owner,
          all_day: true,
        });
        if (error) throw new Error(error.message);
      }
      setAppModal(null);
      setSelectedDay(null);
      refresh();
    } catch (e) { setSaveError((e as Error).message); }
    finally { setSaving(false); }
  };

  const deleteEvent = async (id: string) => {
    setDeleting(id);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      await sb.from('calendar_events').delete().eq('id', id);
      refresh();
    } finally { setDeleting(null); }
  };

  const totalThisMonth = Object.values(eventMap).reduce((s, a) => s + a.length, 0);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="section-head">
        <h1>Kalender</h1>
        <div className="sub">{MONTH_NAMES[MONTH]} {YEAR} · {totalThisMonth} Events · {upcoming.length} in den nächsten 60 Tagen</div>
        <div className="right" style={{ display: 'flex', gap: 8 }}>
          <button className="btn ghost" onClick={() => { setOffset(0); }}>Heute</button>
          <button className="btn ghost" onClick={() => setOffset(o => o - 1)}>
            <Ic name="chevL" size={14} /> {MONTH_SHORT[(MONTH - 1 + 12) % 12]}
          </button>
          <button className="btn ghost" onClick={() => setOffset(o => o + 1)}>
            {MONTH_SHORT[(MONTH + 1) % 12]} <Ic name="chevR" size={14} />
          </button>
          <button className="btn primary" onClick={() => setAppModal({ open: true, form: emptyForm(new Date().toISOString().slice(0,10)) })}>
            <Ic name="plus" size={13} /> Termin
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px 24px' }}>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {ALL_SOURCES.map(src => {
            const cfg = SOURCE_CONFIG[src];
            const active = filters.has(src);
            return (
              <button
                key={src}
                onClick={() => toggleFilter(src)}
                style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 11.5, cursor: 'pointer',
                  border: `1px solid ${active ? cfg.color : 'rgba(255,255,255,0.1)'}`,
                  background: active ? cfg.bg : 'transparent',
                  color: active ? cfg.color : 'var(--text-3)',
                  display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit',
                  transition: 'all 0.12s',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? cfg.color : 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                {cfg.label}
              </button>
            );
          })}
          <button
            onClick={() => setFilters(new Set(ALL_SOURCES))}
            style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11.5, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-3)', fontFamily: 'inherit' }}
          >
            Alle
          </button>
          <button
            onClick={() => setFilters(new Set())}
            style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11.5, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-3)', fontFamily: 'inherit' }}
          >
            Keine
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 12 }}>

          {/* Calendar grid */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{MONTH_NAMES[MONTH]} {YEAR}</span>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{totalThisMonth} Events</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
              {DAY_HEADERS.map(h => (
                <div key={h} style={{ padding: '8px 4px', textAlign: 'center', fontSize: 10.5, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {h}
                </div>
              ))}
              {cells.map((day, idx) => {
                const events = day ? (eventMap[day] ?? []) : [];
                const shown = events.slice(0, 3);
                const extra = events.length - shown.length;
                const sel = day === selectedDay;
                const past = day ? new Date(YEAR, MONTH, day) < new Date(now.getFullYear(), now.getMonth(), now.getDate()) : false;
                return (
                  <div
                    key={idx}
                    onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                    style={{
                      background: sel ? 'rgba(59,130,246,0.08)' : day ? 'var(--surface)' : 'rgba(255,255,255,0.01)',
                      minHeight: 90,
                      padding: '6px 5px 4px',
                      opacity: day ? (past ? 0.6 : 1) : 0.2,
                      cursor: day ? 'pointer' : 'default',
                      borderRight: (idx + 1) % 7 !== 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      outline: sel ? '1px solid rgba(59,130,246,0.4)' : 'none',
                      outlineOffset: -1,
                      transition: 'background 0.1s',
                    }}
                  >
                    {day && (
                      <>
                        <div style={{
                          fontSize: 12, fontWeight: isToday(day) ? 700 : 400,
                          color: isToday(day) ? '#fff' : sel ? 'var(--accent)' : 'var(--text)',
                          width: 22, height: 22, borderRadius: '50%',
                          background: isToday(day) ? 'var(--accent)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginBottom: 3,
                        }}>
                          {day}
                        </div>
                        {shown.map((ev, ei) => {
                          const cfg = SOURCE_CONFIG[ev.source];
                          return (
                            <div key={ei} style={{
                              fontSize: 9.5, padding: '2px 4px', borderRadius: 3, marginBottom: 2,
                              background: cfg.bg, borderLeft: `2px solid ${cfg.color}`,
                              color: cfg.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {ev.label}
                            </div>
                          );
                        })}
                        {extra > 0 && <div style={{ fontSize: 9.5, color: 'var(--text-3)' }}>+{extra}</div>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Selected day detail */}
            {selectedDay && (
              <div className="card">
                <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 22, lineHeight: 1 }}>{selectedDay}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{MONTH_NAMES[MONTH]}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{YEAR}</div>
                  </div>
                  <button className="btn sm primary" style={{ marginLeft: 'auto' }}
                    onClick={() => setAppModal({ open: true, form: emptyForm(selectedDateStr) })}>
                    <Ic name="plus" size={11} /> Termin
                  </button>
                </div>
                <div style={{ padding: '10px 12px' }}>
                  {selectedEvents.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '12px 0' }}>
                      Keine Events — Termin hinzufügen?
                    </div>
                  ) : (
                    selectedEvents.map((ev, i) => {
                      const cfg = SOURCE_CONFIG[ev.source];
                      const customEvent = M.calendarEvents.find(ce => ce.id === ev.id);
                      return (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, paddingBottom: 8, borderBottom: i < selectedEvents.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                          <div style={{ width: 3, borderRadius: 2, background: cfg.color, flexShrink: 0, alignSelf: 'stretch', minHeight: 32 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 2 }}>{ev.label}</div>
                            {ev.sublabel && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{ev.sublabel}</div>}
                            <Badge kind="neutral">{cfg.label}</Badge>
                          </div>
                          {customEvent && (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => setAppModal({ open: true, form: { id: customEvent.id, title: customEvent.title, date: customEvent.date, endDate: customEvent.endDate ?? '', type: customEvent.type, description: customEvent.description ?? '', owner: customEvent.owner } })}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '2px 4px' }}>
                                <Ic name="edit" size={11} />
                              </button>
                              <button onClick={() => deleteEvent(customEvent.id)} disabled={deleting === customEvent.id}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: '2px 4px' }}>
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Upcoming events */}
            <div className="card">
              <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ic name="clock" size={13} color="var(--text-3)" />
                Nächste 60 Tage
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>{upcoming.length} Events</span>
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto', padding: '8px 12px' }}>
                {upcoming.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>Keine Events</div>
                ) : (
                  upcoming.slice(0, 20).map(({ date, ev }, i) => {
                    const cfg = SOURCE_CONFIG[ev.source];
                    const isThisMonth = date.getMonth() === MONTH && date.getFullYear() === YEAR;
                    return (
                      <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, paddingBottom: 8, borderBottom: i < Math.min(upcoming.length, 20) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <div style={{ width: 32, flexShrink: 0, textAlign: 'center' }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: isThisMonth ? cfg.color : 'var(--text)' }}>{date.getDate()}</div>
                          <div style={{ fontSize: 9.5, color: 'var(--text-3)' }}>{MONTH_SHORT[date.getMonth()]}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.label}</div>
                          <div style={{ fontSize: 10.5, color: cfg.color }}>{cfg.label}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Harvest seasons */}
            {harvestProducts.length > 0 && (
              <div className="card">
                <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Ic name="leaf" size={13} color="#fbbf24" />
                  Erntezeiten
                </div>
                <div style={{ padding: '10px 12px' }}>
                  {harvestProducts.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 2 }}>{p.harvestSeason}</div>
                      </div>
                      <Badge kind="warning">{p.origin}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Appointment modal */}
      {appModal?.open && (
        <div className="overlay" onClick={() => setAppModal(null)} style={{ alignItems: 'flex-start', paddingTop: '8vh' }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 460, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ic name="clock" size={14} color="#ec4899" />
              <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>
                {appModal.form.id ? 'Termin bearbeiten' : 'Neuer Termin'}
              </span>
              <button className="btn sm ghost" onClick={() => setAppModal(null)}><Ic name="x" size={12} /></button>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Title */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Titel *</div>
                <input
                  value={appModal.form.title}
                  onChange={e => setAppModal(m => m ? { ...m, form: { ...m.form, title: e.target.value } } : m)}
                  placeholder="Terminbezeichnung"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box' as const }}
                />
              </div>
              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Datum *</div>
                  <input type="date" value={appModal.form.date}
                    onChange={e => setAppModal(m => m ? { ...m, form: { ...m.form, date: e.target.value } } : m)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Enddatum (optional)</div>
                  <input type="date" value={appModal.form.endDate}
                    onChange={e => setAppModal(m => m ? { ...m, form: { ...m.form, endDate: e.target.value } } : m)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
                </div>
              </div>
              {/* Type + Owner */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Typ</div>
                  <select value={appModal.form.type}
                    onChange={e => setAppModal(m => m ? { ...m, form: { ...m.form, type: e.target.value } } : m)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box' as const }}>
                    {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Verantwortlicher</div>
                  <input value={appModal.form.owner}
                    onChange={e => setAppModal(m => m ? { ...m, form: { ...m.form, owner: e.target.value } } : m)}
                    placeholder="Admin"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
                </div>
              </div>
              {/* Description */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Beschreibung (optional)</div>
                <textarea rows={3} value={appModal.form.description}
                  onChange={e => setAppModal(m => m ? { ...m, form: { ...m.form, description: e.target.value } } : m)}
                  placeholder="Details, Agenda, Hinweise…"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 12.5, padding: '8px 10px', outline: 'none', width: '100%', boxSizing: 'border-box' as const, resize: 'vertical', minHeight: 68 }} />
              </div>
              {saveError && <div style={{ color: '#f87171', fontSize: 12 }}>{saveError}</div>}
            </div>
            <div style={{ padding: '10px 18px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn ghost" onClick={() => setAppModal(null)}>Abbrechen</button>
              <button className="btn primary"
                disabled={!appModal.form.title || !appModal.form.date || saving}
                onClick={() => saveAppointment(appModal.form)}>
                {saving ? 'Speichern…' : appModal.form.id ? 'Speichern' : 'Termin anlegen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

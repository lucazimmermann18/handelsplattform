'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

interface CalendarViewProps { lang: Lang; }

interface CalEvent {
  label: string;
  type: 'etd' | 'eta' | 'deal';
  id: string;
}

const MONTH_NAMES = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const MONTH_SHORT = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];

export const CalendarView = ({ lang: _lang }: CalendarViewProps) => {
  const { data: M } = useData();
  const [offset, setOffset] = useState(1); // 0=May2026, 1=Jun2026, etc. relative to May2026
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const baseDate = new Date('2026-05-01');
  baseDate.setMonth(baseDate.getMonth() + offset);
  const YEAR  = baseDate.getFullYear();
  const MONTH = baseDate.getMonth();

  const firstDay    = (new Date(YEAR, MONTH, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate();

  // Build event map: day → CalEvent[]
  const eventMap: Record<number, CalEvent[]> = {};

  const addEvent = (dateStr: string, ev: CalEvent) => {
    const d = new Date(dateStr);
    if (d.getFullYear() === YEAR && d.getMonth() === MONTH) {
      const day = d.getDate();
      if (!eventMap[day]) eventMap[day] = [];
      eventMap[day].push(ev);
    }
  };

  M.orders.forEach(o => {
    if (o.etd) addEvent(o.etd, { label: `ETD ${o.id.replace('ORD-2026-', '')}`, type: 'etd', id: o.id });
    if (o.eta) addEvent(o.eta, { label: `ETA ${o.id.replace('ORD-2026-', '')}`, type: 'eta', id: o.id });
  });

  M.deals.forEach(d => {
    if (d.nextFollow) addEvent(d.nextFollow, { label: `Follow ${d.id.replace('D-2026-', '')}`, type: 'deal', id: d.id });
  });

  const eventColor: Record<string, string> = {
    etd: '#3b82f6',
    eta: '#34d399',
    deal: '#a78bfa',
  };

  // Build cells: empty prefix + days + fill to complete week
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array(totalCells - firstDay - daysInMonth).fill(null),
  ];

  const dayHeaders = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const today   = new Date('2026-05-24');
  const isToday = (day: number) => day === today.getDate() && MONTH === today.getMonth() && YEAR === today.getFullYear();

  return (
    <div>
      <div className="section-head">
        <h1>Kalender</h1>
        <div className="sub">{MONTH_NAMES[MONTH]} {YEAR} · ETDs, ETAs, Follow-ups</div>
        <div className="right">
          <button className="btn" onClick={() => setOffset(o => o - 1)}>
            <Ic name="chevL" size={14} /> {MONTH_SHORT[(MONTH - 1 + 12) % 12]}
          </button>
          <button className="btn" onClick={() => setOffset(o => o + 1)}>
            {MONTH_SHORT[(MONTH + 1) % 12]} <Ic name="chevR" size={14} />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
      <div className="card">
        <div className="card-head" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{MONTH_NAMES[MONTH]} {YEAR}</span>
          <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#3b82f6', display: 'inline-block' }} />
              ETD
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#34d399', display: 'inline-block' }} />
              ETA
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#a78bfa', display: 'inline-block' }} />
              Follow-up
            </span>
          </div>
        </div>

        {/* Day headers */}
        <div className="cal" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'var(--border)' }}>
          {dayHeaders.map(h => (
            <div key={h} style={{
              background: 'var(--surface)',
              padding: '8px 4px',
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.05em',
            }}>
              {h}
            </div>
          ))}

          {cells.map((day, idx) => {
            const events = day ? (eventMap[day] ?? []) : [];
            const shown = events.slice(0, 3);
            const extra = events.length - shown.length;
            return (
              <div
                key={idx}
                className="cal-cell"
                style={{
                  background: day ? 'var(--surface)' : 'var(--surface-2)',
                  minHeight: 96,
                  padding: '6px 6px 4px',
                  opacity: day ? 1 : 0.3,
                  position: 'relative',
                }}
              >
                {day && (
                  <>
                    <div
                      className="cal-day"
                      style={{
                        fontSize: 12,
                        fontWeight: isToday(day) ? 700 : 400,
                        color: isToday(day) ? 'var(--accent)' : 'var(--text)',
                        marginBottom: 4,
                        width: 22, height: 22,
                        borderRadius: '50%',
                        background: isToday(day) ? 'var(--accent)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {day}
                    </div>
                    {shown.map((ev, ei) => (
                      <div
                        key={ei}
                        className="cal-event"
                        style={{
                          fontSize: 10,
                          padding: '2px 4px',
                          borderRadius: 3,
                          marginBottom: 2,
                          background: eventColor[ev.type] + '22',
                          borderLeft: `2px solid ${eventColor[ev.type]}`,
                          color: eventColor[ev.type],
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {ev.label}
                      </div>
                    ))}
                    {extra > 0 && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        +{extra} weitere
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming events list */}
      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-head">
          <Ic name="clock" size={14} />
          <span className="title">Nächste Ereignisse</span>
          <span className="meta">{Object.values(eventMap).reduce((s, a) => s + a.length, 0)} Events diesen Monat</span>
        </div>
        <div className="card-body">
          {Object.keys(eventMap).length === 0 ? (
            <div className="tx3" style={{ fontSize: 12, padding: '12px 0', textAlign: 'center' }}>
              Keine Ereignisse in diesem Monat
            </div>
          ) : (
            Object.entries(eventMap)
              .sort(([a], [b]) => Number(a) - Number(b))
              .slice(0, 8)
              .map(([day, events]) => (
                <div key={day} className="row" style={{ gap: 16, padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                  <div style={{ width: 40, flexShrink: 0, textAlign: 'center' }}>
                    <div className="mono fw600" style={{ fontSize: 18 }}>{day}</div>
                    <div className="tx3" style={{ fontSize: 11 }}>{MONTH_SHORT[MONTH]}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {events.map((ev, i) => (
                      <div key={i} className="row" style={{ gap: 8, marginBottom: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: eventColor[ev.type], flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5 }}>{ev.label}</span>
                        <Badge kind={ev.type === 'etd' ? 'info' : ev.type === 'eta' ? 'success' : 'neutral'}>
                          {ev.type.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

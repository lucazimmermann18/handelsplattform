'use client';

import React from 'react';
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

export const CalendarView = ({ lang }: CalendarViewProps) => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  // June 2026: month index 5 (0-based)
  const YEAR = 2026;
  const MONTH = 5; // June

  // firstDay: (new Date('2026-06-01').getDay() + 6) % 7 = (0 + 6) % 7 = 6? No: June 1 2026 is Monday
  // Sunday=0, Monday=1 ... getDay() for Monday=1 → (1+6)%7 = 0
  const firstDay = (new Date(YEAR, MONTH, 1).getDay() + 6) % 7; // 0 = Monday
  const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate(); // 30

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
  const today = new Date('2026-05-24');
  const isToday = (day: number) => day === today.getDate() && MONTH === today.getMonth() && YEAR === today.getFullYear();

  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h1 className="view-title">Kalender</h1>
          <p className="view-sub">Juni 2026 · ETDs, ETAs, Follow-ups</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost"><Ic name="chevL" size={14} /> Mai</button>
          <button className="btn-ghost">Jul <Ic name="chevR" size={14} /></button>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ justifyContent: 'space-between' }}>
          <span className="card-title" style={{ fontSize: 16, fontWeight: 700 }}>Juni 2026</span>
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
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <span className="card-title"><Ic name="clock" size={14} /> Nächste Ereignisse</span>
        </div>
        <div>
          {Object.entries(eventMap)
            .sort(([a], [b]) => Number(a) - Number(b))
            .slice(0, 8)
            .map(([day, events]) => (
              <div key={day} style={{ display: 'flex', gap: 16, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 48, flexShrink: 0, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{day}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Jun</div>
                </div>
                <div style={{ flex: 1 }}>
                  {events.map((ev, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: eventColor[ev.type], flexShrink: 0 }} />
                      <span style={{ fontSize: 13 }}>{ev.label}</span>
                      <Badge kind={ev.type === 'etd' ? 'info' : ev.type === 'eta' ? 'success' : 'neutral'}>
                        {ev.type.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

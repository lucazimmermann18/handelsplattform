'use client';

import React, { useState } from 'react';
import { MOCK } from '@/lib/mock';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

const PRIO_ORDER: Record<string, number> = { hoch: 0, mittel: 1, niedrig: 2 };
const STATUS_FILTERS = ['alle', 'offen', 'in_progress', 'wartet'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const STATUS_LABEL: Record<string, string> = {
  offen: 'Offen', in_progress: 'In Arbeit', wartet: 'Wartet',
};

interface TasksViewProps {
  lang: Lang;
}

export const TasksView = ({ lang }: TasksViewProps) => {
  const M = MOCK;
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<StatusFilter>('alle');

  const today = new Date(M.todayBase);
  today.setHours(0, 0, 0, 0);

  const isOverdue = (due: string) => {
    const d = new Date(due);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const isDueToday = (due: string) => {
    const d = new Date(due);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };

  const toggle = (id: string) =>
    setChecked(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const sorted = [...M.tasks].sort((a, b) => (PRIO_ORDER[a.prio] ?? 3) - (PRIO_ORDER[b.prio] ?? 3));
  const filtered = filter === 'alle' ? sorted : sorted.filter(tk => tk.status === filter);

  const kpis = [
    { l: 'Gesamt', v: M.tasks.length, c: 'var(--text-2)' },
    { l: 'Hohe Prio', v: M.tasks.filter(tk => tk.prio === 'hoch').length, c: '#f87171' },
    { l: 'Fällig heute', v: M.tasks.filter(tk => isDueToday(tk.due)).length, c: '#fbbf24' },
    { l: 'In Arbeit', v: M.tasks.filter(tk => tk.status === 'in_progress').length, c: '#60a5fa' },
    { l: 'Überfällig', v: M.tasks.filter(tk => isOverdue(tk.due) && tk.status !== 'done').length, c: '#f87171' },
  ];

  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_tasks')}</h1>
        <div className="sub">
          {M.tasks.length} Aufgaben · {M.tasks.filter(x => x.prio === 'hoch').length} hoch · {M.tasks.filter(x => x.status === 'wartet').length} wartet
        </div>
        <div className="right">
          <button className="btn primary"><Ic name="plus" size={13} /> Neue Aufgabe</button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
          {kpis.map((k, i) => (
            <div key={i} className="tile kacheln" style={{ padding: 9 }}>
              <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase' }}>{k.l}</div>
              <div className="mono fw600" style={{ fontSize: 20, color: k.c, marginTop: 2 }}>{k.v}</div>
            </div>
          ))}
        </div>

        {/* Filter chips */}
        <div className="row" style={{ gap: 6, marginBottom: 12 }}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              className={`btn sm${filter === f ? ' primary' : ' ghost'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'alle' ? 'Alle' : STATUS_LABEL[f]}
              {f !== 'alle' && (
                <span className="mono" style={{ marginLeft: 4, opacity: 0.7 }}>
                  {M.tasks.filter(tk => tk.status === f).length}
                </span>
              )}
            </button>
          ))}
          {checked.size > 0 && (
            <button className="btn sm ghost" style={{ marginLeft: 'auto', color: '#34d399' }}
              onClick={() => setChecked(new Set())}>
              {checked.size} erledigt · Zurücksetzen
            </button>
          )}
        </div>

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 26 }}></th>
                <th>Aufgabe</th>
                <th>Auftrag</th>
                <th>Verantwortlich</th>
                <th>Priorität</th>
                <th>Fällig</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tk => {
                const done = checked.has(tk.id);
                const overdue = isOverdue(tk.due) && !done;
                const dueToday = isDueToday(tk.due) && !done;
                return (
                  <tr
                    key={tk.id}
                    style={{
                      opacity: done ? 0.45 : 1,
                      background: overdue ? 'rgba(248,113,113,0.04)' : dueToday ? 'rgba(251,191,36,0.04)' : undefined,
                    }}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => toggle(tk.id)}
                        style={{ accentColor: '#3b82f6', cursor: 'pointer' }}
                      />
                    </td>
                    <td>
                      <div className="fw500" style={{ textDecoration: done ? 'line-through' : undefined }}>{tk.t}</div>
                      <div className="tx3 mono" style={{ fontSize: 10 }}>{tk.id}</div>
                    </td>
                    <td className="mono" style={{ fontSize: 11 }}>{tk.order || '—'}</td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: '#60a5fa', fontFamily: 'Geist Mono', flexShrink: 0 }}>
                          {tk.owner.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </div>
                        <span style={{ fontSize: 12 }}>{tk.owner}</span>
                      </div>
                    </td>
                    <td>
                      <Badge kind={tk.prio === 'hoch' ? 'danger' : tk.prio === 'mittel' ? 'warning' : 'neutral'} dot>
                        {tk.prio}
                      </Badge>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: 11, color: overdue ? '#f87171' : dueToday ? '#fbbf24' : undefined }}>
                        {overdue && <Ic name="clock" size={10} color="#f87171" />}{' '}
                        {fmtDate(tk.due)}
                      </span>
                    </td>
                    <td>
                      {done
                        ? <Badge kind="success" dot>Erledigt</Badge>
                        : tk.status === 'offen' ? <Badge kind="neutral">Offen</Badge>
                        : tk.status === 'in_progress' ? <Badge kind="info" dot>In Arbeit</Badge>
                        : <Badge kind="warning" dot>Wartet</Badge>}
                    </td>
                    <td>
                      <button className="btn sm ghost"><Ic name="more" size={11} /></button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="empty">Keine Aufgaben in dieser Kategorie</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

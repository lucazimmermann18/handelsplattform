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
import { InlineEditCell } from '@/components/ui/InlineEditCell';

const PRIO_ORDER: Record<string, number> = { hoch: 0, mittel: 1, niedrig: 2 };
const STATUS_FILTERS = ['alle', 'offen', 'in_progress', 'wartet'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

interface TasksViewProps {
  lang: Lang;
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

export const TasksView = ({ lang }: TasksViewProps) => {
  const { data: M, refresh } = useData();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<StatusFilter>('alle');
  const [newTask, setNewTask] = useState(false);
  const [form, setForm] = useState({ title: '', orderId: '', owner: '', prio: 'mittel' as 'hoch'|'mittel'|'niedrig', due: '' });
  const [taskMenu, setTaskMenu] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const handleStatusChange = async (taskId: string, status: string) => {
    setTaskMenu(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      await createClient().from('tasks').update({ status }).eq('id', taskId);
      refresh();
    } catch { /* silent */ }
  };

  const handleSaveTask = async () => {
    if (!form.title || !form.due) return;
    setSaving(true); setSaveError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { error } = await createClient().from('tasks').insert({
        id: `TSK-${Date.now().toString().slice(-6)}`,
        title: form.title, order_id: form.orderId || null,
        owner: form.owner || 'Admin', priority: form.prio,
        due_date: form.due, status: 'offen',
      });
      if (error) throw new Error(error.message);
      setNewTask(false); setForm({ title: '', orderId: '', owner: '', prio: 'mittel', due: '' });
      refresh();
    } catch (e) { setSaveError((e as Error).message); }
    finally { setSaving(false); }
  };

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
    setChecked(prev => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });

  const sorted = [...M.tasks].sort((a, b) => (PRIO_ORDER[a.prio] ?? 3) - (PRIO_ORDER[b.prio] ?? 3));
  const filtered = filter === 'alle' ? sorted : sorted.filter(tk => tk.status === filter);

  const statusLabel = (s: string) => {
    if (s === 'offen') return t(lang, 'tasks_status_open');
    if (s === 'in_progress') return t(lang, 'tasks_status_in_progress');
    if (s === 'wartet') return t(lang, 'tasks_status_waiting');
    return s;
  };

  const kpis = [
    { l: t(lang, 'tasks_kpi_total'), v: M.tasks.length, c: 'var(--text-2)' },
    { l: t(lang, 'tasks_kpi_high_prio'), v: M.tasks.filter(tk => tk.prio === 'hoch').length, c: '#f87171' },
    { l: t(lang, 'tasks_kpi_due_today'), v: M.tasks.filter(tk => isDueToday(tk.due)).length, c: '#fbbf24' },
    { l: t(lang, 'tasks_kpi_in_progress'), v: M.tasks.filter(tk => tk.status === 'in_progress').length, c: '#60a5fa' },
    { l: t(lang, 'tasks_kpi_overdue'), v: M.tasks.filter(tk => isOverdue(tk.due) && tk.status !== 'done').length, c: '#f87171' },
  ];

  return (
    <>
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_tasks')}</h1>
        <div className="sub">
          {M.tasks.length} {t(lang, 'tasks_sub_tasks')} · {M.tasks.filter(x => x.prio === 'hoch').length} {t(lang, 'tasks_sub_high')} · {M.tasks.filter(x => x.status === 'wartet').length} {t(lang, 'tasks_sub_waiting')}
        </div>
        <div className="right">
          <button className="btn primary" onClick={() => setNewTask(true)}><Ic name="plus" size={13} /> {t(lang, 'tasks_new')}</button>
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
              {f === 'alle' ? t(lang, 'all') : statusLabel(f)}
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
              {checked.size} {t(lang, 'tasks_checked_reset')}
            </button>
          )}
        </div>

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 26 }}></th>
                <th>{t(lang, 'tasks_col_task')}</th>
                <th>{t(lang, 'tasks_col_order')}</th>
                <th>{t(lang, 'tasks_col_owner')}</th>
                <th>{t(lang, 'tasks_col_priority')}</th>
                <th>{t(lang, 'tasks_col_due')}</th>
                <th>{t(lang, 'tasks_col_status')}</th>
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
                      <InlineEditCell
                        table="tasks" id={tk.id} column="priority"
                        value={tk.prio} type="select"
                        options={[
                          { value: 'hoch',     label: t(lang, 'tasks_prio_high') },
                          { value: 'mittel',   label: t(lang, 'tasks_prio_medium') },
                          { value: 'niedrig',  label: t(lang, 'tasks_prio_low') },
                        ]}
                        renderValue={v => (
                          <Badge kind={v === 'hoch' ? 'danger' : v === 'mittel' ? 'warning' : 'neutral'} dot>
                            {v === 'hoch' ? t(lang, 'tasks_prio_high') : v === 'mittel' ? t(lang, 'tasks_prio_medium') : t(lang, 'tasks_prio_low')}
                          </Badge>
                        )}
                      />
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: 11, color: overdue ? '#f87171' : dueToday ? '#fbbf24' : undefined }}>
                        {overdue && <Ic name="clock" size={10} color="#f87171" />}{' '}
                        {fmtDate(tk.due)}
                      </span>
                    </td>
                    <td>
                      <InlineEditCell
                        table="tasks" id={tk.id} column="status"
                        value={tk.status} type="select"
                        options={[
                          { value: 'offen',       label: t(lang, 'tasks_status_open') },
                          { value: 'in_progress', label: t(lang, 'tasks_status_in_progress') },
                          { value: 'wartet',      label: t(lang, 'tasks_status_waiting') },
                          { value: 'done',        label: t(lang, 'tasks_status_done') },
                        ]}
                        renderValue={v => done
                          ? <Badge kind="success" dot>{t(lang, 'tasks_status_done')}</Badge>
                          : v === 'offen' ? <Badge kind="neutral">{t(lang, 'tasks_status_open')}</Badge>
                          : v === 'in_progress' ? <Badge kind="info" dot>{t(lang, 'tasks_status_in_progress')}</Badge>
                          : <Badge kind="warning" dot>{t(lang, 'tasks_status_waiting')}</Badge>
                        }
                      />
                    </td>
                    <td style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <button className="btn sm ghost" onClick={e => { e.stopPropagation(); setTaskMenu(taskMenu === tk.id ? null : tk.id); }}>
                          <Ic name="more" size={11} />
                        </button>
                        {taskMenu === tk.id && (
                          <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setTaskMenu(null)} />
                            <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 100, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 4, minWidth: 150, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>
                              {(['offen', 'in_progress', 'wartet'] as const).filter(s => s !== tk.status).map(s => (
                                <button key={s} className="btn sm ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 11, padding: '5px 10px' }}
                                  onClick={() => handleStatusChange(tk.id, s)}>
                                  → {statusLabel(s)}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                        <ActionMenu onEdit={() => setEditId(tk.id)} onDelete={() => setDeleteId(tk.id)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="empty">{t(lang, 'tasks_empty')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {/* New Task Modal */}
    {newTask && (
      <div className="overlay" onClick={() => setNewTask(false)} style={{ alignItems: 'flex-start', paddingTop: '8vh' }}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 440, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ic name="task" size={14} color="#60a5fa" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>{t(lang, 'tasks_modal_title')}</span>
            <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={() => setNewTask(false)}><Ic name="x" size={13} /></button>
          </div>
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>{t(lang, 'tasks_lbl_title_req')}</div>
              <input autoFocus value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder={t(lang, 'tasks_placeholder_what')} style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>{t(lang, 'tasks_lbl_priority')}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['hoch','mittel','niedrig'] as const).map(p => (
                  <span key={p} className={`chip${form.prio === p ? ' on' : ''}`} onClick={() => setForm(prev => ({ ...prev, prio: p }))} style={{ cursor: 'pointer' }}>
                    {p === 'hoch' ? t(lang, 'tasks_prio_high') : p === 'mittel' ? t(lang, 'tasks_prio_medium') : t(lang, 'tasks_prio_low')}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>{t(lang, 'tasks_lbl_due_req')}</div>
                <input type="date" value={form.due} onChange={e => setForm(p => ({ ...p, due: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>{t(lang, 'tasks_lbl_owner')}</div>
                <input value={form.owner} onChange={e => setForm(p => ({ ...p, owner: e.target.value }))} placeholder="Admin" style={inputStyle} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>{t(lang, 'tasks_lbl_order_opt')}</div>
              <select value={form.orderId} onChange={e => setForm(p => ({ ...p, orderId: e.target.value }))} style={inputStyle}>
                <option value="">{t(lang, 'tasks_no_order')}</option>
                {M.orders.slice(0, 20).map(o => <option key={o.id} value={o.id}>{o.id} · {o.productVariant}</option>)}
              </select>
            </div>
            {saveError && <div style={{ fontSize: 11.5, color: '#f87171', padding: '6px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: 6 }}>{saveError}</div>}
          </div>
          <div style={{ padding: '10px 18px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn ghost" onClick={() => setNewTask(false)}>{t(lang, 'cancel')}</button>
            <button className="btn primary" onClick={handleSaveTask} disabled={saving || !form.title || !form.due}>
              {saving ? `${t(lang, 'save')}…` : <><Ic name="plus" size={13} /> {t(lang, 'tasks_btn_create')}</>}
            </button>
          </div>
        </div>
      </div>
    )}
    {editId && (() => {
      const r = M.tasks.find(x => x.id === editId);
      if (!r) return null;
      const fields: FieldDef[] = [
        { key: 't', label: t(lang, 'tasks_edit_lbl_title'), type: 'text', required: true, dbKey: 'title', span: 2 },
        { key: 'owner', label: t(lang, 'tasks_edit_lbl_owner'), type: 'text' },
        { key: 'prio', label: t(lang, 'tasks_edit_lbl_priority'), type: 'select', dbKey: 'priority', options: [
          { value: 'hoch', label: t(lang, 'tasks_prio_high_cap') },
          { value: 'mittel', label: t(lang, 'tasks_prio_medium_cap') },
          { value: 'niedrig', label: t(lang, 'tasks_prio_low_cap') },
        ] },
        { key: 'due', label: t(lang, 'tasks_edit_lbl_due'), type: 'date', dbKey: 'due_date' },
        { key: 'status', label: t(lang, 'tasks_edit_lbl_status'), type: 'select', options: [
          { value: 'offen', label: t(lang, 'tasks_status_open') },
          { value: 'in_progress', label: t(lang, 'tasks_status_in_progress') },
          { value: 'wartet', label: t(lang, 'tasks_status_waiting') },
          { value: 'done', label: t(lang, 'tasks_status_done') },
        ] },
      ];
      return <GenericEditModal title={t(lang, 'tasks_edit_title_modal')} subtitle={r.t} record={r as unknown as Record<string, unknown>} fields={fields} table="tasks" onClose={() => setEditId(null)} onSaved={() => setEditId(null)} />;
    })()}
    {deleteId && (() => {
      const r = M.tasks.find(x => x.id === deleteId);
      return r ? <ConfirmDelete label={`'${r.t}'`} table="tasks" id={deleteId} onClose={() => setDeleteId(null)} onDeleted={() => setDeleteId(null)} /> : null;
    })()}
  </>
  );
};

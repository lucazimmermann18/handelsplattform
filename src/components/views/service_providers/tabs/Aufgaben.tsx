'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Badge } from '@/components/ui/primitives';
import { t } from '@/lib/i18n';
import { useLang } from '@/lib/lang-context';
import type { ServiceProvider } from '@/lib/types';
import type { ProviderMaster, TaskEntry, TaskStatus, TaskPriority } from '../types';
import {
  SectionCard, SaveError, DeleteBtn, cellInput, thStyle, useSectionSave,
} from '../shared';

interface TabProps { provider: ServiceProvider; master: ProviderMaster; onSaved: () => void; }

const emptyTask = (): TaskEntry => ({ title: '', description: '', priority: 'mittel', dueDate: '', owner: '', status: 'offen', notes: '' });

const prioColor = (p: TaskPriority) => p === 'hoch' ? '#f87171' : p === 'mittel' ? '#fbbf24' : '#94a3b8';

const statusKind = (s: TaskStatus) => s === 'erledigt' ? 'success' : s === 'in_bearbeitung' ? 'info' : s === 'verschoben' ? 'neutral' : 'warning';

const isOverdue = (t: TaskEntry) => t.status !== 'erledigt' && t.dueDate && new Date(t.dueDate).getTime() < Date.now();

export const TabAufgaben = ({ provider, master, onSaved }: TabProps) => {
  const lang = useLang();
  const { refresh } = useData();
  const { save, saving, error, setError } = useSectionSave(provider.id, refresh);

  const [edit, setEdit] = useState(false);
  const [tasks, setTasks] = useState<TaskEntry[]>(master.tasks ?? []);
  const [filter, setFilter] = useState<'alle' | 'offen'>('offen');

  const enter = () => {
    setTasks(master.tasks ?? []);
    setEdit(true);
    setError(null);
  };

  const cancel = () => { setEdit(false); setError(null); };

  const doSave = async () => {
    await save({ tasks });
    setEdit(false);
    onSaved();
  };

  const updTask = (i: number, field: keyof TaskEntry, val: string) =>
    setTasks(ts => ts.map((x, idx) => idx === i ? { ...x, [field]: val } : x));

  const displayTasks = filter === 'offen'
    ? tasks.filter(t => t.status !== 'erledigt')
    : tasks;

  const openCount = tasks.filter(t => t.status !== 'erledigt').length;

  return (
    <SectionCard
      icon="task"
      title={t(lang, 'sp_tab_tasks_title')}
      badge={`${openCount} ${t(lang, 'sp_tab_tasks_open_badge')}`}
      editMode={edit}
      onEdit={enter}
      onSave={doSave}
      onCancel={cancel}
      saving={saving}
    >
      {!edit && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <button
            className={`btn sm ${filter === 'offen' ? 'primary' : 'ghost'}`}
            onClick={() => setFilter('offen')}
          >{t(lang, 'sp_tab_task_open')}</button>
          <button
            className={`btn sm ${filter === 'alle' ? 'primary' : 'ghost'}`}
            onClick={() => setFilter('alle')}
          >{t(lang, 'sp_tab_task_all')}</button>
        </div>
      )}

      {!edit ? (
        <>
          {displayTasks.length === 0 ? (
            <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
              {t(lang, 'sp_tab_no_tasks')}
            </div>
          ) : (
            displayTasks.map((task, i) => (
              <div key={i} style={{ padding: '12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${isOverdue(task) ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.07)'}`, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ width: 3, height: '100%', minHeight: 40, background: prioColor(task.priority), borderRadius: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{task.title}</span>
                      <Badge kind={statusKind(task.status)}>{task.status}</Badge>
                      {isOverdue(task) && <Badge kind="danger">{t(lang, 'sp_tab_task_overdue')}</Badge>}
                    </div>
                    {task.description && <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>{task.description}</div>}
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                      {task.dueDate && <span>📅 {task.dueDate}</span>}
                      {task.owner && <span style={{ marginLeft: 12 }}>👤 {task.owner}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      ) : (
        <>
          {tasks.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>{t(lang, 'sp_tab_task_col')}</th>
                    <th style={thStyle}>{t(lang, 'sp_tab_desc')}</th>
                    <th style={{ ...thStyle, width: 100 }}>{t(lang, 'sp_tab_priority')}</th>
                    <th style={{ ...thStyle, width: 120 }}>{t(lang, 'sp_tab_due')}</th>
                    <th style={thStyle}>{t(lang, 'sp_tab_owner')}</th>
                    <th style={{ ...thStyle, width: 120 }}>{t(lang, 'sp_tab_status')}</th>
                    <th style={{ ...thStyle, width: 28 }} />
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '5px 4px' }}>
                        <input style={cellInput} value={task.title} onChange={e => updTask(i, 'title', e.target.value)} placeholder="Titel" />
                      </td>
                      <td style={{ padding: '5px 4px' }}>
                        <input style={cellInput} value={task.description} onChange={e => updTask(i, 'description', e.target.value)} placeholder="Beschreibung" />
                      </td>
                      <td style={{ padding: '5px 4px' }}>
                        <select style={cellInput} value={task.priority} onChange={e => updTask(i, 'priority', e.target.value)}>
                          <option value="hoch">hoch</option>
                          <option value="mittel">mittel</option>
                          <option value="niedrig">niedrig</option>
                        </select>
                      </td>
                      <td style={{ padding: '5px 4px' }}>
                        <input type="date" style={cellInput} value={task.dueDate} onChange={e => updTask(i, 'dueDate', e.target.value)} />
                      </td>
                      <td style={{ padding: '5px 4px' }}>
                        <input style={cellInput} value={task.owner} onChange={e => updTask(i, 'owner', e.target.value)} placeholder="Verantwortlich" />
                      </td>
                      <td style={{ padding: '5px 4px' }}>
                        <select style={cellInput} value={task.status} onChange={e => updTask(i, 'status', e.target.value)}>
                          <option value="offen">offen</option>
                          <option value="in_bearbeitung">in_bearbeitung</option>
                          <option value="erledigt">erledigt</option>
                          <option value="verschoben">verschoben</option>
                        </select>
                      </td>
                      <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                        <DeleteBtn onClick={() => setTasks(ts => ts.filter((_, j) => j !== i))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button className="btn sm ghost" style={{ marginTop: 10 }} onClick={() => setTasks(ts => [...ts, emptyTask()])}>
            {t(lang, 'sp_tab_add_task')}
          </button>
        </>
      )}

      <SaveError error={error} />
    </SectionCard>
  );
};

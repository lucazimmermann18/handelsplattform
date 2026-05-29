'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/icons';
import type { SetupTask } from '@/lib/types';
import { CB_SECTIONS, STATUS_MAP, calcSectionScore } from './types';
import type { CBStatus, CBPriority, CBDocQuality } from './types';
import { StatusBadge, PriorityBadge, DocQualityBadge, BlockerTag, StatusDot, StatusSelect, SectionProgress, inputStyle, textareaStyle } from './shared';
import { t as tr } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';
import { useLang } from '@/lib/lang-context';

interface CBSectionProps {
  sectionKey: string;
  onBack: () => void;
  lang: Lang;
  onTask?: (taskId: string) => void;
}

// ── Task modal ─────────────────────────────────────────────────────────────────

interface TaskModalProps {
  task: Partial<SetupTask> & { section: string };
  onSave: (t: Partial<SetupTask>) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

const TaskModal = ({ task, onSave, onClose, saving }: TaskModalProps) => {
  const lang = useLang();
  const [form, setForm] = useState<Partial<SetupTask>>({ ...task });
  const set = (k: keyof SetupTask, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const labelStyle: React.CSSProperties = { fontSize: 11, color: 'var(--text-3)', marginBottom: 4, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--bg-2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, width: '100%', maxWidth: 620, maxHeight: '90vh', overflow: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{task.id ? tr(lang, 'cb_edit_task') : tr(lang, 'cb_new_task')}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={labelStyle}>{tr(lang, 'title')} *</label>
            <input style={inputStyle} value={form.title ?? ''} onChange={e => set('title', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>{tr(lang, 'description')}</label>
            <textarea style={textareaStyle} value={form.description ?? ''} onChange={e => set('description', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>{tr(lang, 'why_important')}</label>
            <textarea style={{ ...textareaStyle, minHeight: 56 }} value={form.whyImportant ?? ''} onChange={e => set('whyImportant', e.target.value)} placeholder={tr(lang, 'context_reason')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{tr(lang, 'status')}</label>
              <StatusSelect value={form.status ?? 'open'} onChange={v => set('status', v)} />
            </div>
            <div>
              <label style={labelStyle}>{tr(lang, 'priority')}</label>
              <select style={{ ...inputStyle, fontSize: 12 }} value={form.priority ?? 'mittel'} onChange={e => set('priority', e.target.value as CBPriority)}>
                <option value="kritisch">{tr(lang, 'cb_priority_k')}</option>
                <option value="hoch">{tr(lang, 'cb_priority_h')}</option>
                <option value="mittel">{tr(lang, 'cb_priority_m')}</option>
                <option value="niedrig">{tr(lang, 'cb_priority_l')}</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>{tr(lang, 'doc_quality')}</label>
              <select style={{ ...inputStyle, fontSize: 12 }} value={form.docQuality ?? 'ungeprüft'} onChange={e => set('docQuality', e.target.value as CBDocQuality)}>
                <option value="ungeprüft">{tr(lang, 'dq_unchecked')}</option>
                <option value="teilweise">{tr(lang, 'dq_partial')}</option>
                <option value="vollständig">{tr(lang, 'dq_complete')}</option>
                <option value="extern_geprüft">{tr(lang, 'dq_extern')}</option>
                <option value="veraltet">{tr(lang, 'dq_outdated')}</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>{tr(lang, 'cb_due_date')}</label>
              <input type="date" style={{ ...inputStyle, fontSize: 12 }} value={form.dueDate ?? ''} onChange={e => set('dueDate', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>{tr(lang, 'cb_owner')}</label>
              <input style={inputStyle} value={form.owner ?? ''} onChange={e => set('owner', e.target.value)} placeholder="Name" />
            </div>
            <div>
              <label style={labelStyle}>{tr(lang, 'cb_advisor')}</label>
              <input style={inputStyle} value={form.externalAdvisor ?? ''} onChange={e => set('externalAdvisor', e.target.value)} placeholder={tr(lang, 'advisor_hint')} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>{tr(lang, 'evidence_required')}</label>
            <input style={inputStyle} value={form.evidenceRequired ?? ''} onChange={e => set('evidenceRequired', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>{tr(lang, 'evidence_notes')}</label>
            <textarea style={{ ...textareaStyle, minHeight: 56 }} value={form.evidenceNotes ?? ''} onChange={e => set('evidenceNotes', e.target.value)} placeholder={tr(lang, 'where_is_doc')} />
          </div>
          <div>
            <label style={labelStyle}>{tr(lang, 'internal_notes')}</label>
            <textarea style={textareaStyle} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={form.blockerGoLive ?? false} onChange={e => set('blockerGoLive', e.target.checked)} />
              {tr(lang, 'cb_blocker_go')}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={form.blockerFirstDeal ?? false} onChange={e => set('blockerFirstDeal', e.target.checked)} />
              {tr(lang, 'cb_blocker_deal')}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={form.required ?? false} onChange={e => set('required', e.target.checked)} />
              {tr(lang, 'required_task')}
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>{tr(lang, 'cancel')}</button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.title?.trim()}
            style={{ padding: '8px 18px', borderRadius: 6, background: '#60a5fa', border: 'none', color: '#0d0f1a', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? `${tr(lang, 'save')}…` : tr(lang, 'save')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Task row ───────────────────────────────────────────────────────────────────

const TaskRow = ({ task, onEdit, onStatusCycle, onDelete, onWorkspace }: {
  task: SetupTask;
  onEdit: (t: SetupTask) => void;
  onStatusCycle: (t: SetupTask) => void;
  onDelete: (id: string) => void;
  onWorkspace?: (taskId: string) => void;
}) => {
  const lang = useLang();
  const STATUS_CYCLE: CBStatus[] = ['open', 'in_progress', 'submitted', 'waiting', 'done', 'not_relevant'];
  const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(task.status as CBStatus) + 1) % STATUS_CYCLE.length];
  const isDone = task.status === 'done';
  const isNA = task.status === 'not_relevant';

  // Read workspace progress from localStorage for display
  const wsState = typeof window !== 'undefined' ? (() => { try { const raw = localStorage.getItem(`cb_workspace_${task.id}`); return raw ? JSON.parse(raw) : null; } catch { return null; } })() : null;
  const wsAnswered = wsState ? Object.values(wsState.answers ?? {}).filter(Boolean).length : 0;
  const wsHasArtifact = !!wsState?.artifact;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: onWorkspace ? '20px 1fr auto auto auto auto' : '20px 1fr auto auto auto', alignItems: 'start', gap: 10,
      padding: '12px 14px', borderRadius: 8,
      background: isDone ? 'rgba(52,211,153,0.04)' : isNA ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isDone ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.07)'}`,
      opacity: isNA ? 0.5 : 1,
      transition: 'opacity 0.15s',
    }}>
      <div style={{ paddingTop: 2 }}>
        <StatusDot status={task.status} onClick={() => onStatusCycle({ ...task, status: next })} />
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: isDone ? 'var(--text-2)' : 'var(--text)', textDecoration: isDone ? 'line-through' : 'none' }}>
            {task.title}
          </span>
          {task.blockerGoLive && <BlockerTag label="Go-Live" />}
          {task.blockerFirstDeal && <BlockerTag label="Deal" />}
        </div>
        {task.description && (
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 6px', lineHeight: 1.5 }}>{task.description}</p>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
          {task.docQuality && task.docQuality !== 'ungeprüft' && <DocQualityBadge quality={task.docQuality} />}
          {task.owner && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>👤 {task.owner}</span>}
          {task.dueDate && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>📅 {task.dueDate}</span>}
          {task.externalAdvisor && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>⚖️ {task.externalAdvisor}</span>}
        </div>
        {task.evidenceRequired && (
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-3)', padding: '4px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 4, border: '1px dashed rgba(255,255,255,0.1)' }}>
            {tr(lang, 'cb_evidence')}: {task.evidenceRequired}
            {task.evidenceNotes && <span style={{ color: 'var(--text-4)' }}> — {task.evidenceNotes}</span>}
          </div>
        )}
        {wsState && (
          <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--text-4)' }}>
            <div style={{ width: 40, height: 3, borderRadius: 2, background: 'var(--surface-3)' }}>
              <div style={{ width: `${Math.min(100, wsAnswered * 20)}%`, height: '100%', background: '#60a5fa', borderRadius: 2 }} />
            </div>
            {wsAnswered > 0 && <span>{wsAnswered} Schr.</span>}
            {wsHasArtifact && <span style={{ color: '#10b981' }}>✓ Dokument</span>}
          </div>
        )}
        {task.notes && (
          <p style={{ fontSize: 11, color: 'var(--text-4)', margin: '6px 0 0', fontStyle: 'italic' }}>{task.notes}</p>
        )}
      </div>

      {onWorkspace && (
        <button onClick={() => onWorkspace(task.id)} title={tr(lang, 'cb_workspace_open')}
          style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 6, color: '#60a5fa', cursor: 'pointer', padding: '4px 10px', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
          <Ic name="sparkle" size={10} /> {tr(lang, 'cb_workspace_open')}
        </button>
      )}
      <button onClick={() => onEdit(task)} title={tr(lang, 'edit')}
        style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>✏️</button>
      <div />
      <button onClick={() => onDelete(task.id)} title={tr(lang, 'delete')}
        style={{ background: 'none', border: 'none', color: 'rgba(248,113,113,0.5)', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>🗑</button>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

export const CBSection = ({ sectionKey, onBack, lang, onTask }: CBSectionProps) => {
  const { data: M, refresh } = useData();
  const [modal, setModal] = useState<Partial<SetupTask> | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<CBStatus | 'all'>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (!M) return null;

  const section = CB_SECTIONS.find(s => s.key === sectionKey)!;
  const tasks = M.setupTasks.filter(t => t.section === sectionKey)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const score = calcSectionScore(tasks);

  const statusCounts = tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  const openNew = () => setModal({ section: sectionKey, status: 'open', priority: 'mittel', docQuality: 'ungeprüft', required: false, blockerGoLive: false, blockerFirstDeal: false, sortOrder: tasks.length + 1 });
  const openEdit = (t: SetupTask) => setModal(t);

  const handleSave = async (form: Partial<SetupTask>) => {
    if (!form.title?.trim()) return;
    setSaving(true);
    try {
      const sb = createClient();
      const payload: Record<string, unknown> = {
        section: sectionKey,
        title: form.title,
        description: form.description ?? null,
        why_important: form.whyImportant ?? null,
        required: form.required ?? false,
        priority: form.priority ?? 'mittel',
        phase: form.phase ?? 'setup',
        status: form.status ?? 'open',
        owner: form.owner ?? null,
        due_date: form.dueDate ?? null,
        blocker_go_live: form.blockerGoLive ?? false,
        blocker_first_deal: form.blockerFirstDeal ?? false,
        evidence_required: form.evidenceRequired ?? null,
        evidence_notes: form.evidenceNotes ?? null,
        doc_quality: form.docQuality ?? 'ungeprüft',
        external_advisor: form.externalAdvisor ?? null,
        notes: form.notes ?? null,
        sort_order: form.sortOrder ?? tasks.length + 1,
      };

      if (form.id) {
        await sb.from('setup_tasks').update(payload).eq('id', form.id);
      } else {
        await sb.from('setup_tasks').insert(payload);
      }
      await refresh();
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusCycle = async (task: SetupTask & { status: CBStatus }) => {
    const sb = createClient();
    await sb.from('setup_tasks').update({ status: task.status }).eq('id', task.id);
    await refresh();
  };

  const handleDelete = async (id: string) => {
    const sb = createClient();
    await sb.from('setup_tasks').delete().eq('id', id);
    await refresh();
    setConfirmDelete(null);
  };

  const filterBtnStyle = (active: boolean, color?: string): React.CSSProperties => ({
    padding: '4px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: active ? 700 : 400, cursor: 'pointer',
    background: active ? (color ? `${color}22` : 'rgba(255,255,255,0.1)') : 'transparent',
    border: `1px solid ${active ? (color ?? 'rgba(255,255,255,0.2)') : 'rgba(255,255,255,0.08)'}`,
    color: active ? (color ?? 'var(--text)') : 'var(--text-3)',
  });

  return (
    <div style={{ padding: '24px 28px', maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={onBack} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 10px', color: 'var(--text-2)', cursor: 'pointer', fontSize: 13 }}>← {tr(lang, 'back')}</button>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: `${section.color}22`, border: `1px solid ${section.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic name={section.icon} size={16} color={section.color} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{section.label}</h2>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            {tasks.length} {tr(lang, 'tasks')} · {statusCounts['done'] ?? 0} {tr(lang, 'cb_done').toLowerCase()}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Geist Mono', color: section.color }}>{score}%</div>
          <SectionProgress done={statusCounts['done'] ?? 0} total={tasks.filter(t => t.status !== 'not_relevant').length} color={section.color} />
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <button style={filterBtnStyle(filter === 'all')} onClick={() => setFilter('all')}>{tr(lang, 'all')} ({tasks.length})</button>
        {(Object.entries(STATUS_MAP) as [CBStatus, typeof STATUS_MAP[CBStatus]][]).map(([k, v]) => {
          const cnt = statusCounts[k] ?? 0;
          if (!cnt) return null;
          return <button key={k} style={filterBtnStyle(filter === k, v.color)} onClick={() => setFilter(filter === k ? 'all' : k)}>{v.label} ({cnt})</button>;
        })}
        <div style={{ flex: 1 }} />
        <button onClick={openNew} style={{ padding: '5px 14px', borderRadius: 6, background: section.color, border: 'none', color: '#0d0f1a', cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>
          {tr(lang, 'cb_new_task')}
        </button>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)' }}>
          {filter === 'all' ? tr(lang, 'cb_no_tasks') : tr(lang, 'cb_no_tasks_filter')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onEdit={openEdit}
              onStatusCycle={handleStatusCycle}
              onDelete={(id) => setConfirmDelete(id)}
              onWorkspace={onTask}
            />
          ))}
        </div>
      )}

      {/* Task modal */}
      {modal && (
        <TaskModal
          task={modal as Partial<SetupTask> & { section: string }}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 28, maxWidth: 360, width: '100%' }}>
            <p style={{ margin: '0 0 20px', fontSize: 14 }}>{tr(lang, 'confirm_delete')}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '7px 16px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>{tr(lang, 'cancel')}</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ padding: '7px 16px', borderRadius: 6, background: '#f87171', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>{tr(lang, 'delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

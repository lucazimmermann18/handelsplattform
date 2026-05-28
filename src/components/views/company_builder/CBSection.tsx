'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/icons';
import type { SetupTask } from '@/lib/types';
import { CB_SECTIONS, STATUS_MAP, calcSectionScore } from './types';
import type { CBStatus, CBPriority, CBDocQuality } from './types';
import { StatusBadge, PriorityBadge, DocQualityBadge, BlockerTag, StatusDot, StatusSelect, SectionProgress, inputStyle, textareaStyle } from './shared';
import type { Lang } from '@/lib/i18n';

interface CBSectionProps {
  sectionKey: string;
  onBack: () => void;
  lang: Lang;
}

// ── Task modal ─────────────────────────────────────────────────────────────────

interface TaskModalProps {
  task: Partial<SetupTask> & { section: string };
  onSave: (t: Partial<SetupTask>) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

const TaskModal = ({ task, onSave, onClose, saving }: TaskModalProps) => {
  const [form, setForm] = useState<Partial<SetupTask>>({ ...task });
  const set = (k: keyof SetupTask, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const labelStyle: React.CSSProperties = { fontSize: 11, color: 'var(--text-3)', marginBottom: 4, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--bg-2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, width: '100%', maxWidth: 620, maxHeight: '90vh', overflow: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{task.id ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={labelStyle}>Titel *</label>
            <input style={inputStyle} value={form.title ?? ''} onChange={e => set('title', e.target.value)} placeholder="Aufgabentitel" />
          </div>
          <div>
            <label style={labelStyle}>Beschreibung</label>
            <textarea style={textareaStyle} value={form.description ?? ''} onChange={e => set('description', e.target.value)} placeholder="Was ist zu tun?" />
          </div>
          <div>
            <label style={labelStyle}>Warum wichtig?</label>
            <textarea style={{ ...textareaStyle, minHeight: 56 }} value={form.whyImportant ?? ''} onChange={e => set('whyImportant', e.target.value)} placeholder="Begründung / Kontext" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Status</label>
              <StatusSelect value={form.status ?? 'open'} onChange={v => set('status', v)} />
            </div>
            <div>
              <label style={labelStyle}>Priorität</label>
              <select style={{ ...inputStyle, fontSize: 12 }} value={form.priority ?? 'mittel'} onChange={e => set('priority', e.target.value as CBPriority)}>
                <option value="kritisch">Kritisch</option>
                <option value="hoch">Hoch</option>
                <option value="mittel">Mittel</option>
                <option value="niedrig">Niedrig</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Dokumentqualität</label>
              <select style={{ ...inputStyle, fontSize: 12 }} value={form.docQuality ?? 'ungeprüft'} onChange={e => set('docQuality', e.target.value as CBDocQuality)}>
                <option value="ungeprüft">Ungeprüft</option>
                <option value="teilweise">Teilweise</option>
                <option value="vollständig">Vollständig</option>
                <option value="extern_geprüft">Extern geprüft</option>
                <option value="veraltet">Veraltet</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Fällig am</label>
              <input type="date" style={{ ...inputStyle, fontSize: 12 }} value={form.dueDate ?? ''} onChange={e => set('dueDate', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Verantwortlich</label>
              <input style={inputStyle} value={form.owner ?? ''} onChange={e => set('owner', e.target.value)} placeholder="Name" />
            </div>
            <div>
              <label style={labelStyle}>Externer Berater</label>
              <input style={inputStyle} value={form.externalAdvisor ?? ''} onChange={e => set('externalAdvisor', e.target.value)} placeholder="Anwalt / Steuerberater" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Nachweis erforderlich</label>
            <input style={inputStyle} value={form.evidenceRequired ?? ''} onChange={e => set('evidenceRequired', e.target.value)} placeholder="z.B. Scan Gewerbeschein" />
          </div>
          <div>
            <label style={labelStyle}>Nachweis-Notizen</label>
            <textarea style={{ ...textareaStyle, minHeight: 56 }} value={form.evidenceNotes ?? ''} onChange={e => set('evidenceNotes', e.target.value)} placeholder="Wo liegt das Dokument?" />
          </div>
          <div>
            <label style={labelStyle}>Interne Notizen</label>
            <textarea style={textareaStyle} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={form.blockerGoLive ?? false} onChange={e => set('blockerGoLive', e.target.checked)} />
              Blocker Go-Live
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={form.blockerFirstDeal ?? false} onChange={e => set('blockerFirstDeal', e.target.checked)} />
              Blocker Erster Deal
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={form.required ?? false} onChange={e => set('required', e.target.checked)} />
              Pflichtaufgabe
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>Abbrechen</button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.title?.trim()}
            style={{ padding: '8px 18px', borderRadius: 6, background: '#60a5fa', border: 'none', color: '#0d0f1a', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Task row ───────────────────────────────────────────────────────────────────

const TaskRow = ({ task, onEdit, onStatusCycle, onDelete }: {
  task: SetupTask;
  onEdit: (t: SetupTask) => void;
  onStatusCycle: (t: SetupTask) => void;
  onDelete: (id: string) => void;
}) => {
  const STATUS_CYCLE: CBStatus[] = ['open', 'in_progress', 'submitted', 'waiting', 'done', 'not_relevant'];
  const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(task.status as CBStatus) + 1) % STATUS_CYCLE.length];
  const isDone = task.status === 'done';
  const isNA = task.status === 'not_relevant';

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '20px 1fr auto auto auto', alignItems: 'start', gap: 10,
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
            Nachweis: {task.evidenceRequired}
            {task.evidenceNotes && <span style={{ color: 'var(--text-4)' }}> — {task.evidenceNotes}</span>}
          </div>
        )}
        {task.notes && (
          <p style={{ fontSize: 11, color: 'var(--text-4)', margin: '6px 0 0', fontStyle: 'italic' }}>{task.notes}</p>
        )}
      </div>

      <button onClick={() => onEdit(task)} title="Bearbeiten"
        style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>✏️</button>
      <div />
      <button onClick={() => onDelete(task.id)} title="Löschen"
        style={{ background: 'none', border: 'none', color: 'rgba(248,113,113,0.5)', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>🗑</button>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

export const CBSection = ({ sectionKey, onBack, lang: _lang }: CBSectionProps) => {
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
        <button onClick={onBack} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 10px', color: 'var(--text-2)', cursor: 'pointer', fontSize: 13 }}>← Zurück</button>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: `${section.color}22`, border: `1px solid ${section.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic name={section.icon} size={16} color={section.color} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{section.label}</h2>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            {tasks.length} Aufgaben · {statusCounts['done'] ?? 0} erledigt
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Geist Mono', color: section.color }}>{score}%</div>
          <SectionProgress done={statusCounts['done'] ?? 0} total={tasks.filter(t => t.status !== 'not_relevant').length} color={section.color} />
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <button style={filterBtnStyle(filter === 'all')} onClick={() => setFilter('all')}>Alle ({tasks.length})</button>
        {(Object.entries(STATUS_MAP) as [CBStatus, typeof STATUS_MAP[CBStatus]][]).map(([k, v]) => {
          const cnt = statusCounts[k] ?? 0;
          if (!cnt) return null;
          return <button key={k} style={filterBtnStyle(filter === k, v.color)} onClick={() => setFilter(filter === k ? 'all' : k)}>{v.label} ({cnt})</button>;
        })}
        <div style={{ flex: 1 }} />
        <button onClick={openNew} style={{ padding: '5px 14px', borderRadius: 6, background: section.color, border: 'none', color: '#0d0f1a', cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>
          + Aufgabe
        </button>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)' }}>
          {filter === 'all' ? 'Noch keine Aufgaben. Klicke "+ Aufgabe" um zu beginnen.' : 'Keine Aufgaben mit diesem Filter.'}
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
            <p style={{ margin: '0 0 20px', fontSize: 14 }}>Aufgabe wirklich löschen?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '7px 16px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>Abbrechen</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ padding: '7px 16px', borderRadius: 6, background: '#f87171', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Löschen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

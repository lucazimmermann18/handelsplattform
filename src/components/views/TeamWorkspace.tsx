'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/lib/data-context';
import { t } from '@/lib/i18n';
import type { TeamMeeting, ActionItem, ActionItemUpdate } from '@/lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const MEETING_TYPES = ['weekly', 'strategy', 'customer', 'supplier', 'other'] as const;
const PRIORITIES = ['high', 'medium', 'low'] as const;
const ACTION_STATUSES = ['open', 'in_progress', 'done', 'cancelled'] as const;

const PRIORITY_COLORS: Record<string, string> = {
  high: '#dc2626', medium: '#d97706', low: '#16a34a',
};
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open:        { bg: '#e0f2fe', text: '#0369a1' },
  in_progress: { bg: '#fef3c7', text: '#92400e' },
  done:        { bg: '#dcfce7', text: '#166534' },
  cancelled:   { bg: '#f1f5f9', text: '#64748b' },
};
const MEETING_TYPE_COLORS: Record<string, string> = {
  weekly: '#2d6a4f', strategy: '#1d6fa4', customer: '#7c3aed', supplier: '#d97706', other: '#64748b',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface TeamWorkspaceViewProps {
  lang: 'de' | 'en';
}

// ─── Helper functions ─────────────────────────────────────────────────────────

function avatarInitials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function isDueToday(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate).toDateString() === new Date().toDateString();
}

function formatDateShort(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatDateTime(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TeamWorkspaceView({ lang }: TeamWorkspaceViewProps) {
  const { data, refresh } = useData();

  // Tab
  const [tab, setTab] = useState<'meetings' | 'actions' | 'team'>('meetings');

  // Meeting form
  const [showMeetingForm, setShowMeetingForm] = useState<boolean>(false);
  const [editMeeting, setEditMeeting] = useState<TeamMeeting | null>(null);
  const [mTitle, setMTitle] = useState<string>('');
  const [mType, setMType] = useState<string>('weekly');
  const [mDate, setMDate] = useState<string>('');
  const [mDuration, setMDuration] = useState<number>(60);
  const [mLocation, setMLocation] = useState<string>('');
  const [mAttendees, setMAttendees] = useState<string[]>([]);
  const [mAgenda, setMAgenda] = useState<string>('');
  const [savingMeeting, setSavingMeeting] = useState<boolean>(false);

  // Meeting detail panel
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState<boolean>(false);
  const [decisionDraft, setDecisionDraft] = useState<string>('');
  const [decisions, setDecisions] = useState<string[]>([]);

  // Past section collapsed
  const [pastExpanded, setPastExpanded] = useState<boolean>(false);

  // Action items
  const [actionView, setActionView] = useState<'kanban' | 'table'>('kanban');
  const [showActionForm, setShowActionForm] = useState<boolean>(false);
  const [editAction, setEditAction] = useState<ActionItem | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [aTitle, setATitle] = useState<string>('');
  const [aDesc, setADesc] = useState<string>('');
  const [aAssignee, setAAssignee] = useState<string>('');
  const [aDue, setADue] = useState<string>('');
  const [aPriority, setAPriority] = useState<string>('medium');
  const [aMeetingId, setAMeetingId] = useState<string>('');
  const [savingAction, setSavingAction] = useState<boolean>(false);

  // Update thread
  const [updateDraft, setUpdateDraft] = useState<string>('');
  const [postingUpdate, setPostingUpdate] = useState<boolean>(false);

  // Filters
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Delete confirm
  const [confirmDeleteMeeting, setConfirmDeleteMeeting] = useState<string | null>(null);
  const [confirmDeleteAction, setConfirmDeleteAction] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Current user
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      const sb = createClient();
      sb.auth.getUser().then(({ data: authData }) => {
        if (!authData.user) return;
        const uid = authData.user.id;
        const email = authData.user.email ?? '';
        const name =
          (authData.user.user_metadata?.full_name as string | undefined) ||
          email.split('@')[0] ||
          'User';
        setCurrentUserId(uid);
        setCurrentUserName(name);
        // Upsert profile so Team tab shows all logged-in users
        sb.from('profiles').upsert(
          { id: uid, email, display_name: name, updated_at: new Date().toISOString() },
          { onConflict: 'id', ignoreDuplicates: false }
        ).then(() => { /* refresh handled by realtime */ });
      });
    });
  }, []);

  // Load notes when meeting selected
  useEffect(() => {
    if (!selectedMeetingId || !data) return;
    const notes = data.meetingNotes.find(n => n.meetingId === selectedMeetingId);
    setNotesDraft(notes?.content ?? '');
    setDecisions(notes?.decisions ?? []);
  }, [selectedMeetingId, data]);

  if (!data) return <div style={{ padding: 32, color: 'var(--text-3)' }}>Loading…</div>;

  // ─── DB Operations ──────────────────────────────────────────────────────────

  function openNewMeeting() {
    setEditMeeting(null);
    setMTitle(''); setMType('weekly'); setMDate(''); setMDuration(60);
    setMLocation(''); setMAttendees([]); setMAgenda('');
    setShowMeetingForm(true);
  }

  function openEditMeeting(m: TeamMeeting) {
    setEditMeeting(m);
    setMTitle(m.title); setMType(m.meetingType);
    setMDate(m.scheduledAt ? m.scheduledAt.slice(0, 16) : '');
    setMDuration(m.durationMinutes);
    setMLocation(m.location); setMAttendees(m.attendeeIds); setMAgenda(m.agenda);
    setShowMeetingForm(true);
  }

  async function saveMeeting() {
    if (!mTitle.trim() || !mDate) return;
    setSavingMeeting(true);
    const { createClient } = await import('@/lib/supabase/client');
    const sb = createClient();
    const payload = {
      title: mTitle.trim(), meeting_type: mType,
      scheduled_at: new Date(mDate).toISOString(),
      duration_minutes: mDuration, location: mLocation.trim(),
      attendee_ids: mAttendees, agenda: mAgenda.trim(),
      status: 'planned', updated_at: new Date().toISOString(),
    };
    if (editMeeting) {
      await sb.from('team_meetings').update(payload).eq('id', editMeeting.id);
    } else {
      await sb.from('team_meetings').insert({ ...payload, created_by: currentUserId });
    }
    setSavingMeeting(false);
    setShowMeetingForm(false);
    refresh();
  }

  async function markMeetingDone(id: string) {
    const { createClient } = await import('@/lib/supabase/client');
    await createClient().from('team_meetings').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', id);
    refresh();
  }

  async function deleteMeeting(id: string) {
    setDeletingId(id);
    const { createClient } = await import('@/lib/supabase/client');
    await createClient().from('team_meetings').delete().eq('id', id);
    setDeletingId(null);
    setConfirmDeleteMeeting(null);
    if (selectedMeetingId === id) setSelectedMeetingId(null);
    refresh();
  }

  async function saveNotes(meetingId: string) {
    if (!data) return;
    setSavingNotes(true);
    const { createClient } = await import('@/lib/supabase/client');
    const sb = createClient();
    const existing = data.meetingNotes.find(n => n.meetingId === meetingId);
    const payload = {
      meeting_id: meetingId, content: notesDraft, decisions,
      updated_by: currentUserId, updated_at: new Date().toISOString(),
    };
    if (existing) {
      await sb.from('meeting_notes').update(payload).eq('id', existing.id);
    } else {
      await sb.from('meeting_notes').insert(payload);
    }
    setSavingNotes(false);
    refresh();
  }

  function openNewAction(meetingId?: string) {
    setEditAction(null);
    setATitle(''); setADesc(''); setAAssignee(''); setADue('');
    setAPriority('medium'); setAMeetingId(meetingId ?? '');
    setShowActionForm(true);
  }

  function openEditAction(a: ActionItem) {
    setEditAction(a);
    setATitle(a.title); setADesc(a.description ?? '');
    setAAssignee(a.assigneeId ?? ''); setADue(a.dueDate ?? '');
    setAPriority(a.priority); setAMeetingId(a.meetingId ?? '');
    setShowActionForm(true);
  }

  async function saveAction() {
    if (!aTitle.trim()) return;
    setSavingAction(true);
    const { createClient } = await import('@/lib/supabase/client');
    const sb = createClient();
    const payload = {
      title: aTitle.trim(), description: aDesc.trim(),
      assignee_id: aAssignee || null, due_date: aDue || null,
      priority: aPriority, meeting_id: aMeetingId || null,
      updated_at: new Date().toISOString(),
    };
    if (editAction) {
      await sb.from('action_items').update(payload).eq('id', editAction.id);
    } else {
      await sb.from('action_items').insert({ ...payload, status: 'open', created_by: currentUserId });
    }
    setSavingAction(false);
    setShowActionForm(false);
    refresh();
  }

  async function moveAction(id: string, newStatus: string) {
    const { createClient } = await import('@/lib/supabase/client');
    await createClient().from('action_items').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    refresh();
  }

  async function deleteAction(id: string) {
    setDeletingId(id);
    const { createClient } = await import('@/lib/supabase/client');
    await createClient().from('action_items').delete().eq('id', id);
    setDeletingId(null);
    setConfirmDeleteAction(null);
    if (selectedActionId === id) setSelectedActionId(null);
    refresh();
  }

  async function postUpdate() {
    if (!updateDraft.trim() || !selectedActionId) return;
    setPostingUpdate(true);
    const { createClient } = await import('@/lib/supabase/client');
    await createClient().from('action_item_updates').insert({
      action_item_id: selectedActionId,
      content: updateDraft.trim(),
      author_id: currentUserId,
      author_name: currentUserName,
    });
    setUpdateDraft('');
    setPostingUpdate(false);
    refresh();
  }

  // ─── Derived data ───────────────────────────────────────────────────────────

  const profiles = data.profiles;
  const meetings = data.teamMeetings;
  const upcomingMeetings = meetings
    .filter(m => m.status === 'planned')
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const pastMeetings = meetings
    .filter(m => m.status === 'completed' || m.status === 'cancelled')
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));

  const allActions = data.actionItems.filter(a => {
    if (filterAssignee !== 'all' && a.assigneeId !== filterAssignee) return false;
    if (filterPriority !== 'all' && a.priority !== filterPriority) return false;
    return true;
  });

  const selectedMeeting = selectedMeetingId ? meetings.find(m => m.id === selectedMeetingId) : null;
  const selectedAction = selectedActionId ? data.actionItems.find(a => a.id === selectedActionId) : null;
  const actionUpdates: ActionItemUpdate[] = selectedActionId
    ? data.actionItemUpdates.filter(u => u.actionItemId === selectedActionId)
    : [];

  function getProfile(id: string | null) {
    if (!id) return null;
    return profiles.find(p => p.id === id) ?? null;
  }

  // ─── Sub-renders ────────────────────────────────────────────────────────────

  function renderAvatar(id: string, size: number = 32) {
    const profile = getProfile(id);
    const name = profile?.displayName || '?';
    const color = profile?.avatarColor || '#2d6a4f';
    return (
      <div key={id} style={{
        width: size, height: size, borderRadius: '50%', background: color,
        color: '#fff', fontSize: size * 0.38, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '2px solid var(--bg)', flexShrink: 0,
      }}>
        {avatarInitials(name)}
      </div>
    );
  }

  function renderStatusBadge(status: string) {
    const col = STATUS_COLORS[status] ?? { bg: '#f1f5f9', text: '#64748b' };
    const label = t(lang, `tw_action_status_${status}`);
    return (
      <span style={{
        background: col.bg, color: col.text,
        borderRadius: 100, padding: '2px 8px', fontSize: 11, fontWeight: 600,
      }}>{label}</span>
    );
  }

  function renderPriorityBadge(priority: string) {
    return (
      <span style={{
        color: PRIORITY_COLORS[priority] ?? '#64748b',
        fontSize: 11, fontWeight: 700,
      }}>● {t(lang, `tw_action_priority_${priority}`)}</span>
    );
  }

  function renderMeetingCard(m: TeamMeeting) {
    const typeColor = MEETING_TYPE_COLORS[m.meetingType] ?? '#64748b';
    const isDeleting = deletingId === m.id;
    const attendeeProfiles = m.attendeeIds.slice(0, 3).map(id => getProfile(id));
    const extraCount = m.attendeeIds.length > 3 ? m.attendeeIds.length - 3 : 0;

    return (
      <div key={m.id} style={{
        background: 'var(--bg-2)', borderRadius: 8,
        border: '1px solid var(--border)', padding: 12, marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{
                background: typeColor, color: '#fff',
                borderRadius: 100, padding: '2px 8px', fontSize: 11, fontWeight: 600,
              }}>{t(lang, `tw_meeting_type_${m.meetingType}`)}</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {formatDateTime(m.scheduledAt)}
              </span>
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: 'var(--text)' }}>
              {m.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {m.durationMinutes > 0 && <span>⏱ {m.durationMinutes} {t(lang, 'tw_minutes_short')}</span>}
              {m.location && <span>📍 {m.location}</span>}
            </div>
            {m.attendeeIds.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                {attendeeProfiles.map((p, i) => (
                  p ? <div key={m.attendeeIds[i]} style={{
                    width: 24, height: 24, borderRadius: '50%', background: p.avatarColor,
                    color: '#fff', fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--bg)',
                  }}>{avatarInitials(p.displayName)}</div> : null
                ))}
                {extraCount > 0 && (
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', background: 'var(--surface-2)',
                    color: 'var(--text-3)', fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>+{extraCount}</div>
                )}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedMeetingId(m.id)}
            style={{
              padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)',
              background: 'var(--bg)', color: 'var(--text)', fontSize: 12, cursor: 'pointer',
            }}>
            {t(lang, 'tw_open_detail')}
          </button>
          <button
            onClick={() => openEditMeeting(m)}
            style={{
              padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)',
              background: 'var(--bg)', color: 'var(--text)', fontSize: 12, cursor: 'pointer',
            }}>✏</button>
          {m.status === 'planned' && (
            <button
              onClick={() => markMeetingDone(m.id)}
              style={{
                padding: '4px 10px', borderRadius: 6, border: '1px solid #2d6a4f',
                background: 'transparent', color: '#2d6a4f', fontSize: 12, cursor: 'pointer',
              }}>
              {t(lang, 'tw_mark_done')}
            </button>
          )}
          {confirmDeleteMeeting === m.id ? (
            <>
              <button
                onClick={() => deleteMeeting(m.id)}
                disabled={isDeleting}
                style={{
                  padding: '4px 10px', borderRadius: 6, border: 'none',
                  background: '#dc2626', color: '#fff', fontSize: 12, cursor: 'pointer',
                }}>
                {isDeleting ? '…' : t(lang, 'tw_confirm_delete')}
              </button>
              <button
                onClick={() => setConfirmDeleteMeeting(null)}
                style={{
                  padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)',
                  background: 'var(--bg)', color: 'var(--text)', fontSize: 12, cursor: 'pointer',
                }}>
                {t(lang, 'tw_cancel')}
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDeleteMeeting(m.id)}
              style={{
                padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)',
                background: 'var(--bg)', color: '#dc2626', fontSize: 12, cursor: 'pointer',
              }}>🗑</button>
          )}
        </div>
      </div>
    );
  }

  function renderMeetingDetailPanel() {
    if (!selectedMeeting || !data) return null;
    const m = selectedMeeting;
    const meetingActions = data.actionItems.filter(a => a.meetingId === m.id);
    return (
      <div style={{
        width: 420, borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--bg-2)', borderBottom: '1px solid var(--border)',
          padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <button
              onClick={() => setSelectedMeetingId(null)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-3)', fontSize: 16, padding: 0,
              }}>←</button>
            <span style={{
              background: MEETING_TYPE_COLORS[m.meetingType] ?? '#64748b',
              color: '#fff', borderRadius: 100, padding: '2px 8px',
              fontSize: 11, fontWeight: 600,
            }}>{t(lang, `tw_meeting_type_${m.meetingType}`)}</span>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', flex: 1 }}>{m.title}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>
            {formatDateTime(m.scheduledAt)}
            {m.durationMinutes > 0 && ` · ${m.durationMinutes} ${t(lang, 'tw_minutes_short')}`}
            {m.location && ` · ${m.location}`}
          </div>
          {m.attendeeIds.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {m.attendeeIds.map(id => renderAvatar(id, 28))}
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {/* Agenda */}
          {m.agenda && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                {t(lang, 'tw_meeting_agenda')}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {m.agenda}
              </div>
            </div>
          )}

          {/* Notes */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              {t(lang, 'tw_meeting_notes')}
            </div>
            <textarea
              value={notesDraft}
              onChange={e => setNotesDraft(e.target.value)}
              rows={5}
              placeholder="…"
              style={{
                width: '100%', borderRadius: 6, border: '1px solid var(--border)',
                background: 'var(--bg)', color: 'var(--text)', fontSize: 13,
                padding: 8, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                onClick={() => saveNotes(m.id)}
                disabled={savingNotes}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: 'none',
                  background: '#2d6a4f', color: '#fff', fontSize: 12, cursor: 'pointer',
                }}>
                {savingNotes ? '…' : t(lang, 'tw_save_notes')}
              </button>
            </div>
          </div>

          {/* Decisions */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              {t(lang, 'tw_meeting_decisions')}
            </div>
            {decisions.map((d, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4,
              }}>
                <span style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 2 }}>•</span>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{d}</span>
                <button
                  onClick={() => {
                    const next = decisions.filter((_, idx) => idx !== i);
                    setDecisions(next);
                  }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-3)', fontSize: 14, padding: '0 2px',
                  }}>×</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <input
                value={decisionDraft}
                onChange={e => setDecisionDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && decisionDraft.trim()) {
                    setDecisions([...decisions, decisionDraft.trim()]);
                    setDecisionDraft('');
                  }
                }}
                placeholder={t(lang, 'tw_add_decision')}
                style={{
                  flex: 1, borderRadius: 6, border: '1px solid var(--border)',
                  background: 'var(--bg)', color: 'var(--text)', fontSize: 12, padding: '6px 8px',
                }}
              />
              <button
                onClick={() => {
                  if (decisionDraft.trim()) {
                    setDecisions([...decisions, decisionDraft.trim()]);
                    setDecisionDraft('');
                  }
                }}
                style={{
                  padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)',
                  background: 'var(--bg)', color: 'var(--text)', fontSize: 12, cursor: 'pointer',
                }}>+</button>
            </div>
          </div>

          {/* Action items from this meeting */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1 }}>
                {t(lang, 'tw_meeting_action_items')}
              </div>
              <button
                onClick={() => { setTab('actions'); openNewAction(m.id); }}
                style={{
                  padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)',
                  background: 'var(--bg)', color: 'var(--text)', fontSize: 11, cursor: 'pointer',
                }}>+</button>
            </div>
            {meetingActions.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{t(lang, 'tw_no_actions')}</div>
            )}
            {meetingActions.map(a => {
              const assignee = getProfile(a.assigneeId);
              return (
                <div key={a.id} style={{
                  background: 'var(--surface-2)', borderRadius: 6,
                  border: '1px solid var(--border-2)', padding: '8px 10px', marginBottom: 6,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                      {assignee && <span>👤 {assignee.displayName}</span>}
                      {a.dueDate && <span>📅 {formatDateShort(a.dueDate)}</span>}
                      {renderStatusBadge(a.status)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {a.status !== 'done' && (
                      <button
                        onClick={() => moveAction(a.id, 'done')}
                        title="Done"
                        style={{
                          padding: '2px 6px', borderRadius: 4, border: '1px solid #16a34a',
                          background: 'transparent', color: '#16a34a', fontSize: 11, cursor: 'pointer',
                        }}>✓</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderActionDetailPanel() {
    if (!selectedAction) return null;
    const a = selectedAction;
    const assignee = getProfile(a.assigneeId);
    const linkedMeeting = a.meetingId ? meetings.find(m => m.id === a.meetingId) : null;
    return (
      <div style={{
        width: 420, borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--bg-2)', borderBottom: '1px solid var(--border)',
          padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <button
              onClick={() => setSelectedActionId(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 16, padding: 0 }}>←</button>
            {renderStatusBadge(a.status)}
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 8 }}>{a.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
            <span>👤 {assignee ? assignee.displayName : t(lang, 'tw_no_assignee')}</span>
            {a.dueDate && (
              <span style={{
                color: isOverdue(a.dueDate) ? '#dc2626' : isDueToday(a.dueDate) ? '#d97706' : 'var(--text-3)',
              }}>📅 {formatDateShort(a.dueDate)}</span>
            )}
            {renderPriorityBadge(a.priority)}
          </div>
          {/* Status buttons */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {ACTION_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => moveAction(a.id, s)}
                style={{
                  padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                  border: `1px solid ${a.status === s ? STATUS_COLORS[s]?.text ?? '#2d6a4f' : 'var(--border)'}`,
                  background: a.status === s ? (STATUS_COLORS[s]?.bg ?? 'var(--bg-2)') : 'var(--bg)',
                  color: a.status === s ? (STATUS_COLORS[s]?.text ?? 'var(--text)') : 'var(--text-3)',
                  fontWeight: a.status === s ? 700 : 400,
                }}>
                {t(lang, `tw_action_status_${s}`)}
              </button>
            ))}
            <button
              onClick={() => openEditAction(a)}
              style={{
                padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)',
                background: 'var(--bg)', color: 'var(--text)', fontSize: 11, cursor: 'pointer', marginLeft: 'auto',
              }}>✏</button>
          </div>
          {/* Linked meeting */}
          {linkedMeeting && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>
              🔗 {t(lang, 'tw_linked_meeting')}: {' '}
              <button
                onClick={() => { setTab('meetings'); setSelectedMeetingId(linkedMeeting.id); setSelectedActionId(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2d6a4f', fontSize: 12, padding: 0, textDecoration: 'underline' }}>
                {linkedMeeting.title}
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {/* Description */}
          {a.description && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                {t(lang, 'tw_action_desc')}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {a.description}
              </div>
            </div>
          )}

          {/* Updates thread */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              {t(lang, 'tw_add_update')}
            </div>
            {actionUpdates.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>{t(lang, 'tw_no_updates')}</div>
            )}
            {actionUpdates.map(u => (
              <div key={u.id} style={{
                background: 'var(--surface-2)', borderRadius: 6, border: '1px solid var(--border-2)',
                padding: '8px 10px', marginBottom: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: getProfile(u.authorId)?.avatarColor ?? '#2d6a4f',
                    color: '#fff', fontSize: 9, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>{avatarInitials(u.authorName || '?')}</div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{u.authorName}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto' }}>
                    {new Date(u.createdAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {u.content}
                </div>
              </div>
            ))}
            {/* Post update */}
            <textarea
              value={updateDraft}
              onChange={e => setUpdateDraft(e.target.value)}
              placeholder={t(lang, 'tw_update_placeholder')}
              rows={3}
              style={{
                width: '100%', borderRadius: 6, border: '1px solid var(--border)',
                background: 'var(--bg)', color: 'var(--text)', fontSize: 13,
                padding: 8, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 6,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={postUpdate}
                disabled={postingUpdate || !updateDraft.trim()}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: 'none',
                  background: '#2d6a4f', color: '#fff', fontSize: 12, cursor: 'pointer',
                  opacity: postingUpdate || !updateDraft.trim() ? 0.5 : 1,
                }}>
                {postingUpdate ? '…' : t(lang, 'tw_post_update')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderKanbanCard(a: ActionItem) {
    const assignee = getProfile(a.assigneeId);
    const statusIdx = ACTION_STATUSES.indexOf(a.status as typeof ACTION_STATUSES[number]);
    const isDeleting = deletingId === a.id;

    return (
      <div key={a.id} style={{
        background: 'var(--bg-2)', borderRadius: 8,
        border: '1px solid var(--border)', padding: 12, marginBottom: 8,
      }}>
        <div style={{ marginBottom: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
          {renderPriorityBadge(a.priority)}
        </div>
        <div
          style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 6, cursor: 'pointer' }}
          onClick={() => setSelectedActionId(a.id)}
        >
          {a.title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <span>👤 {assignee ? assignee.displayName : t(lang, 'tw_no_assignee')}</span>
          {a.dueDate && (
            <span style={{
              color: isOverdue(a.dueDate) ? '#dc2626' : isDueToday(a.dueDate) ? '#d97706' : 'var(--text-3)',
              fontWeight: (isOverdue(a.dueDate) || isDueToday(a.dueDate)) ? 700 : 400,
            }}>
              📅 {formatDateShort(a.dueDate)}
              {isOverdue(a.dueDate) && ' ' + t(lang, 'tw_overdue')}
              {isDueToday(a.dueDate) && ' ' + t(lang, 'tw_due_today')}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {statusIdx > 0 && (
            <button
              onClick={() => moveAction(a.id, ACTION_STATUSES[statusIdx - 1])}
              style={{
                padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)',
                background: 'var(--bg)', color: 'var(--text-3)', fontSize: 11, cursor: 'pointer',
              }}>← {t(lang, `tw_action_status_${ACTION_STATUSES[statusIdx - 1]}`)}</button>
          )}
          {statusIdx < ACTION_STATUSES.length - 1 && a.status !== 'done' && (
            <button
              onClick={() => moveAction(a.id, ACTION_STATUSES[statusIdx + 1])}
              style={{
                padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)',
                background: 'var(--bg)', color: 'var(--text-3)', fontSize: 11, cursor: 'pointer',
              }}>{t(lang, `tw_action_status_${ACTION_STATUSES[statusIdx + 1]}`)} →</button>
          )}
          <button
            onClick={() => openEditAction(a)}
            style={{
              padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)',
              background: 'var(--bg)', color: 'var(--text)', fontSize: 11, cursor: 'pointer', marginLeft: 'auto',
            }}>✏</button>
          {confirmDeleteAction === a.id ? (
            <>
              <button
                onClick={() => deleteAction(a.id)}
                disabled={isDeleting}
                style={{
                  padding: '2px 6px', borderRadius: 4, border: 'none',
                  background: '#dc2626', color: '#fff', fontSize: 11, cursor: 'pointer',
                }}>{isDeleting ? '…' : '✓'}</button>
              <button
                onClick={() => setConfirmDeleteAction(null)}
                style={{
                  padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)',
                  background: 'var(--bg)', color: 'var(--text)', fontSize: 11, cursor: 'pointer',
                }}>×</button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDeleteAction(a.id)}
              style={{
                padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)',
                background: 'var(--bg)', color: '#dc2626', fontSize: 11, cursor: 'pointer',
              }}>🗑</button>
          )}
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '16px 24px 0', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ marginBottom: 4 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{t(lang, 'tw_title')}</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>{t(lang, 'tw_subtitle')}</p>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginTop: 12 }}>
          {(['meetings', 'actions', 'team'] as const).map(tabId => {
            const labelKey = `tw_tab_${tabId}`;
            const isActive = tab === tabId;
            return (
              <button
                key={tabId}
                onClick={() => { setTab(tabId); setSelectedMeetingId(null); setSelectedActionId(null); }}
                style={{
                  padding: '8px 16px', background: 'none', cursor: 'pointer',
                  border: 'none', borderBottom: isActive ? '2px solid #2d6a4f' : '2px solid transparent',
                  color: isActive ? '#2d6a4f' : 'var(--text-3)',
                  fontWeight: isActive ? 600 : 400, fontSize: 14,
                  marginBottom: -1,
                }}>
                {t(lang, labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

          {/* ── Meetings Tab ── */}
          {tab === 'meetings' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button
                  onClick={openNewMeeting}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none',
                    background: '#2d6a4f', color: '#fff', fontSize: 13,
                    fontWeight: 600, cursor: 'pointer',
                  }}>
                  + {t(lang, 'tw_new_meeting')}
                </button>
              </div>

              {/* Upcoming */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {t(lang, 'tw_upcoming')} ({upcomingMeetings.length})
                </h3>
                {upcomingMeetings.length === 0 && (
                  <div style={{ color: 'var(--text-3)', fontSize: 13 }}>{t(lang, 'tw_no_meetings')}</div>
                )}
                {upcomingMeetings.map(renderMeetingCard)}
              </div>

              {/* Past */}
              <div>
                <button
                  onClick={() => setPastExpanded(!pastExpanded)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 13, fontWeight: 700, color: 'var(--text-2)',
                    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
                    padding: 0,
                  }}>
                  {pastExpanded ? '▼' : '▶'} {t(lang, 'tw_past')} ({pastMeetings.length})
                </button>
                {pastExpanded && pastMeetings.map(renderMeetingCard)}
              </div>
            </div>
          )}

          {/* ── Actions Tab ── */}
          {tab === 'actions' && (
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                {/* View toggle */}
                <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                  {(['kanban', 'table'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setActionView(v)}
                      style={{
                        padding: '6px 12px', background: actionView === v ? '#2d6a4f' : 'var(--bg)',
                        color: actionView === v ? '#fff' : 'var(--text-3)',
                        border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: actionView === v ? 600 : 400,
                      }}>
                      {t(lang, `tw_${v}_view`)}
                    </button>
                  ))}
                </div>

                {/* Filters */}
                <select
                  value={filterAssignee}
                  onChange={e => setFilterAssignee(e.target.value)}
                  style={{
                    padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)',
                    background: 'var(--bg)', color: 'var(--text)', fontSize: 12, cursor: 'pointer',
                  }}>
                  <option value="all">{t(lang, 'tw_filter_assignee')}: {t(lang, 'tw_filter_all')}</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.displayName}</option>
                  ))}
                </select>
                <select
                  value={filterPriority}
                  onChange={e => setFilterPriority(e.target.value)}
                  style={{
                    padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)',
                    background: 'var(--bg)', color: 'var(--text)', fontSize: 12, cursor: 'pointer',
                  }}>
                  <option value="all">{t(lang, 'tw_filter_priority')}: {t(lang, 'tw_filter_all')}</option>
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{t(lang, `tw_action_priority_${p}`)}</option>
                  ))}
                </select>

                <div style={{ marginLeft: 'auto' }}>
                  <button
                    onClick={() => openNewAction()}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: 'none',
                      background: '#2d6a4f', color: '#fff', fontSize: 13,
                      fontWeight: 600, cursor: 'pointer',
                    }}>
                    + {t(lang, 'tw_new_action')}
                  </button>
                </div>
              </div>

              {/* Kanban */}
              {actionView === 'kanban' && (
                <div style={{ display: 'flex', gap: 12, overflow: 'auto', alignItems: 'flex-start' }}>
                  {(['open', 'in_progress', 'done'] as const).map(colStatus => {
                    const colItems = allActions.filter(a => a.status === colStatus);
                    return (
                      <div key={colStatus} style={{
                        flex: 1, minWidth: 220,
                        background: 'var(--surface-2)', borderRadius: 8,
                        border: '1px solid var(--border)',
                      }}>
                        <div style={{
                          padding: '10px 12px', borderBottom: '1px solid var(--border)',
                          fontWeight: 700, fontSize: 13, color: 'var(--text)',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                          {t(lang, `tw_action_status_${colStatus}`)}
                          <span style={{
                            background: STATUS_COLORS[colStatus]?.bg ?? 'var(--surface-3)',
                            color: STATUS_COLORS[colStatus]?.text ?? 'var(--text-3)',
                            borderRadius: 100, padding: '0 6px', fontSize: 11, fontWeight: 700,
                          }}>{colItems.length}</span>
                        </div>
                        <div style={{ padding: 10 }}>
                          {colItems.length === 0 && (
                            <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '12px 0' }}>—</div>
                          )}
                          {colItems.map(renderKanbanCard)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Table */}
              {actionView === 'table' && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)' }}>
                        {[
                          t(lang, 'tw_action_title'), t(lang, 'tw_action_assignee'),
                          t(lang, 'tw_action_due'), t(lang, 'tw_action_priority'),
                          'Status', t(lang, 'tw_linked_meeting'), '',
                        ].map((col, i) => (
                          <th key={i} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allActions.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ padding: 20, color: 'var(--text-3)', textAlign: 'center' }}>
                            {t(lang, 'tw_no_actions')}
                          </td>
                        </tr>
                      )}
                      {allActions.map(a => {
                        const assignee = getProfile(a.assigneeId);
                        const linkedMeeting = a.meetingId ? meetings.find(m => m.id === a.meetingId) : null;
                        return (
                          <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}
                              onClick={() => setSelectedActionId(a.id)}>
                              {a.title}
                            </td>
                            <td style={{ padding: '8px 10px', color: 'var(--text-2)' }}>
                              {assignee ? assignee.displayName : '—'}
                            </td>
                            <td style={{ padding: '8px 10px', color: isOverdue(a.dueDate) ? '#dc2626' : isDueToday(a.dueDate) ? '#d97706' : 'var(--text-2)', whiteSpace: 'nowrap' }}>
                              {a.dueDate ? formatDateShort(a.dueDate) : '—'}
                            </td>
                            <td style={{ padding: '8px 10px' }}>{renderPriorityBadge(a.priority)}</td>
                            <td style={{ padding: '8px 10px' }}>{renderStatusBadge(a.status)}</td>
                            <td style={{ padding: '8px 10px', color: 'var(--text-2)' }}>
                              {linkedMeeting ? linkedMeeting.title : '—'}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button onClick={() => openEditAction(a)} style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 11, cursor: 'pointer' }}>✏</button>
                                {confirmDeleteAction === a.id ? (
                                  <>
                                    <button onClick={() => deleteAction(a.id)} disabled={deletingId === a.id} style={{ padding: '2px 6px', borderRadius: 4, border: 'none', background: '#dc2626', color: '#fff', fontSize: 11, cursor: 'pointer' }}>{deletingId === a.id ? '…' : '✓'}</button>
                                    <button onClick={() => setConfirmDeleteAction(null)} style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 11, cursor: 'pointer' }}>×</button>
                                  </>
                                ) : (
                                  <button onClick={() => setConfirmDeleteAction(a.id)} style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', color: '#dc2626', fontSize: 11, cursor: 'pointer' }}>🗑</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Team Tab ── */}
          {tab === 'team' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
                {t(lang, 'tw_team_members')}
              </h3>
              {profiles.length === 0 && (
                <div style={{
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: 24, color: 'var(--text-3)', fontSize: 13,
                  textAlign: 'center',
                }}>
                  {t(lang, 'tw_no_profiles')}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {profiles.map(p => (
                  <div key={p.id} style={{
                    background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)',
                    padding: '20px 16px', textAlign: 'center',
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: p.avatarColor, color: '#fff',
                      fontSize: 18, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 10px',
                    }}>
                      {avatarInitials(p.displayName)}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>
                      {p.displayName || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, wordBreak: 'break-all' }}>
                      {p.email}
                    </div>
                    <span style={{
                      background: p.role === 'admin' ? '#fef3c7' : 'var(--surface-2)',
                      color: p.role === 'admin' ? '#92400e' : 'var(--text-3)',
                      borderRadius: 100, padding: '2px 8px', fontSize: 11, fontWeight: 600,
                    }}>
                      {t(lang, `tw_profile_role_${p.role}`) || p.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right detail panel */}
        {tab === 'meetings' && selectedMeetingId && renderMeetingDetailPanel()}
        {tab === 'actions' && selectedActionId && renderActionDetailPanel()}
      </div>

      {/* Meeting Form Modal */}
      {showMeetingForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            maxWidth: 560, width: '90%', background: 'var(--bg)',
            borderRadius: 12, padding: 24, maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
              {editMeeting ? t(lang, 'tw_edit_meeting') : t(lang, 'tw_new_meeting')}
            </h2>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
                {t(lang, 'tw_meeting_title')} *
              </label>
              <input
                value={mTitle}
                onChange={e => setMTitle(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
                  {t(lang, 'tw_meeting_type')}
                </label>
                <select
                  value={mType}
                  onChange={e => setMType(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }}>
                  {MEETING_TYPES.map(mt => (
                    <option key={mt} value={mt}>{t(lang, `tw_meeting_type_${mt}`)}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
                  {t(lang, 'tw_meeting_duration')}
                </label>
                <input
                  type="number"
                  value={mDuration}
                  onChange={e => setMDuration(parseInt(e.target.value) || 60)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
                {t(lang, 'tw_meeting_date')} *
              </label>
              <input
                type="datetime-local"
                value={mDate}
                onChange={e => setMDate(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
                {t(lang, 'tw_meeting_location')}
              </label>
              <input
                value={mLocation}
                onChange={e => setMLocation(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
                {t(lang, 'tw_meeting_attendees')}
              </label>
              {profiles.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{t(lang, 'tw_no_profiles')}</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 150, overflowY: 'auto' }}>
                {profiles.map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>
                    <input
                      type="checkbox"
                      checked={mAttendees.includes(p.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setMAttendees(Array.from(new Set([...mAttendees, p.id])));
                        } else {
                          setMAttendees(mAttendees.filter(id => id !== p.id));
                        }
                      }}
                    />
                    {p.displayName} ({p.email})
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
                {t(lang, 'tw_meeting_agenda')}
              </label>
              <textarea
                value={mAgenda}
                onChange={e => setMAgenda(e.target.value)}
                rows={4}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowMeetingForm(false)}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}>
                {t(lang, 'tw_cancel')}
              </button>
              <button
                onClick={saveMeeting}
                disabled={savingMeeting || !mTitle.trim() || !mDate}
                style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#2d6a4f', color: '#fff', fontSize: 13, cursor: 'pointer', opacity: savingMeeting || !mTitle.trim() || !mDate ? 0.5 : 1 }}>
                {savingMeeting ? '…' : t(lang, 'tw_save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Form Modal */}
      {showActionForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            maxWidth: 560, width: '90%', background: 'var(--bg)',
            borderRadius: 12, padding: 24, maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
              {editAction ? t(lang, 'tw_edit_action') : t(lang, 'tw_new_action')}
            </h2>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
                {t(lang, 'tw_action_title')} *
              </label>
              <input
                value={aTitle}
                onChange={e => setATitle(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
                {t(lang, 'tw_action_desc')}
              </label>
              <textarea
                value={aDesc}
                onChange={e => setADesc(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
                  {t(lang, 'tw_action_assignee')}
                </label>
                <select
                  value={aAssignee}
                  onChange={e => setAAssignee(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }}>
                  <option value="">{t(lang, 'tw_no_assignee')}</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.displayName}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
                  {t(lang, 'tw_action_due')}
                </label>
                <input
                  type="date"
                  value={aDue}
                  onChange={e => setADue(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
                  {t(lang, 'tw_action_priority')}
                </label>
                <select
                  value={aPriority}
                  onChange={e => setAPriority(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }}>
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{t(lang, `tw_action_priority_${p}`)}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
                  {t(lang, 'tw_linked_meeting')}
                </label>
                <select
                  value={aMeetingId}
                  onChange={e => setAMeetingId(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }}>
                  <option value="">— {lang === 'de' ? 'Kein Meeting' : 'No meeting'} —</option>
                  {meetings.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowActionForm(false)}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}>
                {t(lang, 'tw_cancel')}
              </button>
              <button
                onClick={saveAction}
                disabled={savingAction || !aTitle.trim()}
                style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#2d6a4f', color: '#fff', fontSize: 13, cursor: 'pointer', opacity: savingAction || !aTitle.trim() ? 0.5 : 1 }}>
                {savingAction ? '…' : t(lang, 'tw_save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

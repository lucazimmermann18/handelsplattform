'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import type { Supplier } from '@/lib/types';
import type { SupplierMaster, DevStep, OnboardingItem, ExportReadiness } from '../types';
import { EXPORT_READINESS_STAGES, DEFAULT_ONBOARDING_ITEMS } from '../types';
import { SectionCard, FormField, FormGrid, DeleteBtn, SaveError, textareaStyle, cellInput, thStyle, useSectionSave } from '../shared';

interface TabProps { supplier: Supplier; master: SupplierMaster; onSaved: () => void; }

// ── Helpers ────────────────────────────────────────────────────────────────────

const stepStatusColor = (s: DevStep['status']) =>
  s === 'done' ? '#34d399' : s === 'in_progress' ? '#60a5fa' : 'rgba(255,255,255,0.2)';

const stepStatusLabel: Record<DevStep['status'], string> = {
  open: 'Offen', in_progress: 'In Arbeit', done: 'Erledigt',
};

const prioColor = (p?: DevStep['priority']) =>
  p === 'hoch' ? '#f87171' : p === 'mittel' ? '#fbbf24' : '#94a3b8';

const newStep = (): DevStep => ({
  id: `step-${Date.now()}`,
  title: '', owner: '', due: '', status: 'open', priority: 'mittel', notes: '',
});

const DEFAULT_CATEGORIES = Array.from(new Set(DEFAULT_ONBOARDING_ITEMS.map(i => i.category)));

// ── Readiness Pipeline selector ───────────────────────────────────────────────

const ReadinessPipeline = ({
  value, onChange, readonly,
}: { value?: ExportReadiness; onChange?: (v: ExportReadiness) => void; readonly?: boolean }) => (
  <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
    {EXPORT_READINESS_STAGES.map((stage, i) => {
      const active = stage.key === value;
      return (
        <button
          key={stage.key}
          onClick={() => !readonly && onChange?.(stage.key)}
          disabled={readonly}
          title={stage.desc}
          style={{
            flex: 1, padding: '10px 6px', border: 'none', cursor: readonly ? 'default' : 'pointer',
            fontFamily: 'inherit', fontSize: 10.5, fontWeight: active ? 700 : 400, lineHeight: 1.3,
            background: active ? `${stage.color}22` : 'rgba(255,255,255,0.02)',
            color: active ? stage.color : 'var(--text-3)',
            borderRight: i < EXPORT_READINESS_STAGES.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            transition: 'all 0.15s', textAlign: 'center',
            boxShadow: active ? `inset 0 -2px 0 ${stage.color}` : 'none',
          }}
        >
          <div style={{ marginBottom: 2 }}>
            {active && <span style={{ fontSize: 8 }}>▶ </span>}
            {stage.shortLabel}
          </div>
          {active && (
            <div style={{ fontSize: 8.5, fontWeight: 400, color: stage.color, opacity: 0.8 }}>
              ✓ Aktuell
            </div>
          )}
        </button>
      );
    })}
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────

export const TabEntwicklung = ({ supplier, master, onSaved }: TabProps) => {
  const { refresh } = useData();
  const { save, saving, error, setError } = useSectionSave(supplier.id, refresh);

  // ── Readiness edit state ─────────────────────────────────────────────────────
  const [readinessEdit, setReadinessEdit] = useState(false);
  const [draftReadiness, setDraftReadiness] = useState<ExportReadiness>('not_ready');

  const enterReadiness = () => {
    setDraftReadiness(master.exportReadiness ?? 'not_ready');
    setReadinessEdit(true); setError(null);
  };
  const saveReadiness = async () => {
    await save({ exportReadiness: draftReadiness });
    setReadinessEdit(false); onSaved();
  };

  // ── Onboarding edit state ────────────────────────────────────────────────────
  const [onbEdit, setOnbEdit] = useState(false);
  const [onbItems, setOnbItems] = useState<OnboardingItem[]>([]);

  const getOnboardingItems = (): OnboardingItem[] => {
    const saved = master.onboardingItems ?? [];
    return DEFAULT_ONBOARDING_ITEMS.map(def => {
      const found = saved.find(x => x.id === def.id);
      return found ?? { ...def, done: false, notes: '' };
    });
  };

  const enterOnb = () => {
    setOnbItems(getOnboardingItems());
    setOnbEdit(true); setError(null);
  };
  const saveOnb = async () => {
    await save({ onboardingItems: onbItems });
    setOnbEdit(false); onSaved();
  };

  // ── Dev steps edit state ─────────────────────────────────────────────────────
  const [stepsEdit, setStepsEdit] = useState(false);
  const [steps, setSteps] = useState<DevStep[]>([]);
  const [devNotes, setDevNotes] = useState('');

  const enterSteps = () => {
    setSteps(master.devSteps ?? []);
    setDevNotes(master.developmentNotes ?? '');
    setStepsEdit(true); setError(null);
  };
  const saveSteps = async () => {
    await save({ devSteps: steps, developmentNotes: devNotes });
    setStepsEdit(false); onSaved();
  };

  const updStep = (i: number, patch: Partial<DevStep>) =>
    setSteps(ss => ss.map((x, idx) => idx === i ? { ...x, ...patch } : x));

  // ── Computed values ──────────────────────────────────────────────────────────
  const currentReadiness = master.exportReadiness;
  const readinessStage = EXPORT_READINESS_STAGES.find(s => s.key === currentReadiness);
  const displayOnb = getOnboardingItems();
  const doneCount = displayOnb.filter(i => i.done).length;
  const totalCount = displayOnb.length;
  const onbPct = Math.round((doneCount / totalCount) * 100);
  const displaySteps = master.devSteps ?? [];
  const openSteps = displaySteps.filter(s => s.status !== 'done').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Exportfähigkeit ──────────────────────────────────────────────────── */}
      <SectionCard
        icon="star" title="Exportfähigkeit"
        editMode={readinessEdit} onEdit={enterReadiness}
        onSave={saveReadiness} onCancel={() => setReadinessEdit(false)} saving={saving}
      >
        {/* Status banner */}
        {currentReadiness && !readinessEdit ? (
          <div style={{
            padding: '14px 16px', borderRadius: 8, marginBottom: 14,
            background: `${readinessStage!.color}10`,
            border: `1px solid ${readinessStage!.color}30`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: `${readinessStage!.color}20`,
              border: `2px solid ${readinessStage!.color}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: 18 }}>
                {['🔴','🟠','🟡','🟢','✅','⭐'][EXPORT_READINESS_STAGES.findIndex(s => s.key === currentReadiness)]}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: readinessStage!.color }}>
                {readinessStage!.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.4 }}>
                {readinessStage!.desc}
              </div>
            </div>
          </div>
        ) : !currentReadiness && !readinessEdit ? (
          <div style={{ color: 'var(--text-3)', fontSize: 12, marginBottom: 12 }}>
            Noch keine Exportfähigkeit eingestellt.
          </div>
        ) : null}

        <ReadinessPipeline
          value={readinessEdit ? draftReadiness : currentReadiness}
          onChange={setDraftReadiness}
          readonly={!readinessEdit}
        />

        {readinessEdit && (
          <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
            {EXPORT_READINESS_STAGES.find(s => s.key === draftReadiness)?.desc}
          </div>
        )}
        <SaveError error={error} />
      </SectionCard>

      {/* ── Onboarding-Checkliste ─────────────────────────────────────────────── */}
      <SectionCard
        icon="check" title="Onboarding-Checkliste"
        badge={`${doneCount}/${totalCount} · ${onbPct}%`}
        editMode={onbEdit} onEdit={enterOnb}
        onSave={saveOnb} onCancel={() => setOnbEdit(false)} saving={saving}
      >
        {/* Progress bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Fortschritt</span>
            <span style={{ fontSize: 11, fontFamily: 'Geist Mono', color: onbPct === 100 ? '#34d399' : onbPct >= 60 ? '#fbbf24' : 'var(--text-3)' }}>
              {onbPct}%
            </span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{
              width: `${onbPct}%`, height: '100%', borderRadius: 3, transition: 'width 0.4s',
              background: onbPct === 100 ? '#34d399' : onbPct >= 60 ? '#fbbf24' : '#60a5fa',
            }} />
          </div>
        </div>

        {DEFAULT_CATEGORIES.map(cat => {
          const catItems = (onbEdit ? onbItems : displayOnb).filter(i => i.category === cat);
          return (
            <div key={cat} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                {cat}
              </div>
              {catItems.map(item => {
                const idx = onbEdit ? onbItems.findIndex(x => x.id === item.id) : -1;
                return (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 8px', borderRadius: 6,
                    background: item.done ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.02)',
                    marginBottom: 4,
                    border: `1px solid ${item.done ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)'}`,
                  }}>
                    {onbEdit ? (
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={e => setOnbItems(items => items.map((x, i) => i === idx ? { ...x, done: e.target.checked } : x))}
                        style={{ accentColor: '#34d399', marginTop: 2, width: 14, height: 14, flexShrink: 0, cursor: 'pointer' }}
                      />
                    ) : (
                      <div style={{
                        width: 16, height: 16, borderRadius: 3, flexShrink: 0, marginTop: 1,
                        background: item.done ? '#34d399' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${item.done ? '#34d399' : 'rgba(255,255,255,0.12)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {item.done && <Ic name="check" size={9} color="white" />}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 12.5, color: item.done ? 'var(--text)' : 'var(--text-2)' }}>
                        {item.label}
                      </span>
                      {onbEdit && (
                        <input
                          value={onbItems[idx]?.notes ?? ''}
                          onChange={e => setOnbItems(items => items.map((x, i) => i === idx ? { ...x, notes: e.target.value } : x))}
                          placeholder="Notiz…"
                          style={{
                            display: 'block', marginTop: 3,
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 4, color: 'var(--text)', fontFamily: 'inherit', fontSize: 11.5,
                            padding: '3px 7px', outline: 'none', width: '100%', boxSizing: 'border-box',
                          }}
                        />
                      )}
                      {!onbEdit && item.notes && (
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, fontStyle: 'italic' }}>{item.notes}</div>
                      )}
                    </div>
                    {item.done && !onbEdit && (
                      <Badge kind="success">✓</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
        <SaveError error={error} />
      </SectionCard>

      {/* ── Entwicklungsplan ─────────────────────────────────────────────────── */}
      <SectionCard
        icon="clock" title="Entwicklungsplan"
        badge={displaySteps.length > 0 ? `${openSteps} offen · ${displaySteps.length - openSteps} erledigt` : undefined}
        editMode={stepsEdit} onEdit={enterSteps}
        onSave={saveSteps} onCancel={() => setStepsEdit(false)} saving={saving}
      >
        {displaySteps.length === 0 && !stepsEdit ? (
          <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
            Noch keine Entwicklungsschritte definiert.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 24 }} />
                <th style={thStyle}>Schritt / Aufgabe</th>
                <th style={{ ...thStyle, width: '12%' }}>Prio</th>
                <th style={{ ...thStyle, width: '15%' }}>Verantwortlich</th>
                <th style={{ ...thStyle, width: '12%' }}>Fällig</th>
                <th style={{ ...thStyle, width: '12%' }}>Status</th>
                {stepsEdit && <th style={{ ...thStyle, width: 32 }} />}
              </tr>
            </thead>
            <tbody>
              {(stepsEdit ? steps : displaySteps).map((step, i) => (
                <tr key={step.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', opacity: step.status === 'done' ? 0.6 : 1 }}>
                  <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                    <div style={{
                      width: 12, height: 12, borderRadius: '50%', margin: '0 auto',
                      background: stepStatusColor(step.status),
                      border: `2px solid ${stepStatusColor(step.status)}`,
                    }} />
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {stepsEdit
                      ? <input style={cellInput} value={step.title} onChange={e => updStep(i, { title: e.target.value })} placeholder="Beschreibung des Schritts…" />
                      : <span style={{ fontSize: 12.5, fontWeight: step.status === 'done' ? 400 : 500, textDecoration: step.status === 'done' ? 'line-through' : 'none' }}>{step.title || '—'}</span>}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {stepsEdit
                      ? <select style={{ ...cellInput, fontSize: 11 }} value={step.priority ?? 'mittel'} onChange={e => updStep(i, { priority: e.target.value as DevStep['priority'] })}>
                          <option value="hoch">Hoch</option>
                          <option value="mittel">Mittel</option>
                          <option value="niedrig">Niedrig</option>
                        </select>
                      : <span style={{ fontSize: 11.5, color: prioColor(step.priority), fontWeight: 600 }}>
                          {step.priority === 'hoch' ? '↑ Hoch' : step.priority === 'mittel' ? '→ Mittel' : '↓ Niedrig'}
                        </span>}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {stepsEdit
                      ? <input style={cellInput} value={step.owner ?? ''} onChange={e => updStep(i, { owner: e.target.value })} placeholder="Person" />
                      : <span style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{step.owner || '—'}</span>}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {stepsEdit
                      ? <input type="date" style={{ ...cellInput, fontSize: 11 }} value={step.due ?? ''} onChange={e => updStep(i, { due: e.target.value })} />
                      : <span style={{ fontSize: 11, fontFamily: 'Geist Mono', color: 'var(--text-3)' }}>
                          {step.due ? step.due.slice(0, 10) : '—'}
                        </span>}
                  </td>
                  <td style={{ padding: '5px 4px' }}>
                    {stepsEdit
                      ? <select style={cellInput} value={step.status} onChange={e => updStep(i, { status: e.target.value as DevStep['status'] })}>
                          <option value="open">Offen</option>
                          <option value="in_progress">In Arbeit</option>
                          <option value="done">Erledigt</option>
                        </select>
                      : <span style={{ fontSize: 11, color: stepStatusColor(step.status), fontWeight: 600 }}>
                          {stepStatusLabel[step.status]}
                        </span>}
                  </td>
                  {stepsEdit && (
                    <td style={{ padding: '5px 4px' }}>
                      <DeleteBtn onClick={() => setSteps(ss => ss.filter((_, j) => j !== i))} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {stepsEdit && (
          <button className="btn sm ghost" style={{ marginTop: 10 }} onClick={() => setSteps(ss => [...ss, newStep()])}>
            <Ic name="plus" size={12} /> Schritt hinzufügen
          </button>
        )}

        {/* Development notes */}
        {stepsEdit ? (
          <FormGrid cols={1} >
            <FormField label="Entwicklungsnotizen / Strategie" >
              <textarea
                style={{ ...textareaStyle, marginTop: 4 }}
                value={devNotes}
                onChange={e => setDevNotes(e.target.value)}
                placeholder="Übergeordnete Strategie, Prioritäten, Kontext für Entwicklungsplan…"
              />
            </FormField>
          </FormGrid>
        ) : master.developmentNotes ? (
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
            {master.developmentNotes}
          </div>
        ) : null}
        <SaveError error={error} />
      </SectionCard>
    </div>
  );
};

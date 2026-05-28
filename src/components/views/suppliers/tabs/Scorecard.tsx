'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Ic } from '@/components/ui/icons';
import type { Supplier } from '@/lib/types';
import type { SupplierMaster, ScorecardEntry } from '../types';
import { SCORECARD_CRITERIA, EXPORT_READINESS_STAGES } from '../types';
import { SectionCard, SaveError, useSectionSave, textareaStyle } from '../shared';

interface TabProps { supplier: Supplier; master: SupplierMaster; onSaved: () => void; }

// ── Star Rating ───────────────────────────────────────────────────────────────

const StarRating = ({
  value, onChange, readonly,
}: { value: number; onChange?: (v: number) => void; readonly?: boolean }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 2 }} onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map(n => {
        const active = n <= (hovered || value);
        return (
          <span
            key={n}
            onMouseEnter={() => !readonly && setHovered(n)}
            onClick={() => !readonly && onChange?.(n)}
            style={{
              fontSize: 15, cursor: readonly ? 'default' : 'pointer',
              color: active ? '#fbbf24' : 'rgba(255,255,255,0.12)',
              transition: 'color 0.1s',
              lineHeight: 1,
            }}
          >
            ★
          </span>
        );
      })}
    </div>
  );
};

// ── Score bar ─────────────────────────────────────────────────────────────────

const ScoreBar = ({ score, max }: { score: number; max: number }) => {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const color = pct >= 75 ? '#34d399' : pct >= 50 ? '#fbbf24' : pct >= 30 ? '#fb923c' : '#f87171';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Geist Mono', color, minWidth: 36, textAlign: 'right' }}>
        {score}<span style={{ fontSize: 9, fontWeight: 400, color: 'var(--text-3)' }}>/{max}</span>
      </span>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const TabScorecard = ({ supplier, master, onSaved }: TabProps) => {
  const { refresh } = useData();
  const { save, saving, error, setError } = useSectionSave(supplier.id, refresh);

  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState<Record<string, ScorecardEntry>>({});
  const [devNotes, setDevNotes] = useState('');

  const current = master.scorecard ?? {};

  const enter = () => {
    setDraft(
      Object.fromEntries(SCORECARD_CRITERIA.map(c => [
        c.key,
        { score: current[c.key]?.score ?? 0, notes: current[c.key]?.notes ?? '' },
      ]))
    );
    setDevNotes(master.developmentNotes ?? '');
    setEdit(true);
    setError(null);
  };

  const cancel = () => { setEdit(false); setError(null); };

  const doSave = async () => {
    await save({ scorecard: draft, developmentNotes: devNotes });
    setEdit(false);
    onSaved();
  };

  const totalScore = SCORECARD_CRITERIA.reduce((s, c) => s + (current[c.key]?.score ?? 0), 0);
  const maxScore = SCORECARD_CRITERIA.length * 5;
  const pct = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const scoreColor = pct >= 75 ? '#34d399' : pct >= 50 ? '#fbbf24' : pct >= 30 ? '#fb923c' : '#f87171';
  const filledCount = SCORECARD_CRITERIA.filter(c => (current[c.key]?.score ?? 0) > 0).length;

  // Suggested readiness stage based on score
  const suggestedStage = EXPORT_READINESS_STAGES.find((_, i, arr) => {
    const threshold = (i + 1) / arr.length;
    return pct / 100 <= threshold;
  }) ?? EXPORT_READINESS_STAGES[EXPORT_READINESS_STAGES.length - 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Score summary panel */}
      <div style={{
        padding: '18px 20px', borderRadius: 10,
        background: `${scoreColor}08`, border: `1px solid ${scoreColor}25`,
        display: 'flex', alignItems: 'center', gap: 24,
      }}>
        {/* Big score circle */}
        <div style={{ flexShrink: 0, position: 'relative', width: 90, height: 90 }}>
          <svg width="90" height="90" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r="36" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="none" />
            <circle
              cx="45" cy="45" r="36"
              stroke={scoreColor} strokeWidth="6" fill="none"
              strokeDasharray={`${(pct / 100) * 2 * Math.PI * 36} ${2 * Math.PI * 36}`}
              transform="rotate(-90 45 45)" strokeLinecap="round"
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 19, fontWeight: 700, fontFamily: 'Geist Mono', color: scoreColor, lineHeight: 1 }}>
              {Math.round(pct)}
            </span>
            <span style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.05em' }}>Punkte %</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: scoreColor }}>
            {totalScore} / {maxScore} Punkte
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10 }}>
            {filledCount} von {SCORECARD_CRITERIA.length} Kriterien bewertet
          </div>
          <ScoreBar score={totalScore} max={maxScore} />
        </div>

        {/* Suggested stage */}
        {filledCount >= 5 && (
          <div style={{ flexShrink: 0, padding: '10px 14px', borderRadius: 8, background: `${suggestedStage.color}12`, border: `1px solid ${suggestedStage.color}30`, textAlign: 'center', minWidth: 140 }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Empfohlene Stufe</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: suggestedStage.color }}>{suggestedStage.label}</div>
          </div>
        )}
      </div>

      {/* Criteria grid */}
      <SectionCard
        icon="star" title="Scorecard"
        badge={filledCount > 0 ? `${filledCount}/${SCORECARD_CRITERIA.length} bewertet` : undefined}
        editMode={edit} onEdit={enter} onSave={doSave} onCancel={cancel} saving={saving}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {SCORECARD_CRITERIA.map(c => {
            const entry = edit ? draft[c.key] : current[c.key];
            const score = entry?.score ?? 0;
            const notes = entry?.notes ?? '';
            return (
              <div
                key={c.key}
                style={{
                  padding: '12px 14px', borderRadius: 8,
                  background: score > 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <Ic name={c.icon} size={13} color="var(--text-3)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 1 }}>{c.label}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)', lineHeight: 1.4 }}>{c.desc}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StarRating
                    value={score}
                    readonly={!edit}
                    onChange={v => setDraft(d => ({ ...d, [c.key]: { ...d[c.key], score: v } }))}
                  />
                  {score > 0 && (
                    <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'Geist Mono' }}>
                      {score}/5
                    </span>
                  )}
                  {!score && !edit && (
                    <span style={{ fontSize: 10.5, color: 'var(--text-4)' }}>Noch nicht bewertet</span>
                  )}
                </div>
                {edit && (
                  <input
                    value={notes}
                    onChange={e => setDraft(d => ({ ...d, [c.key]: { ...d[c.key], notes: e.target.value } }))}
                    placeholder="Notiz (optional)…"
                    style={{
                      marginTop: 6,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 4, color: 'var(--text)', fontFamily: 'inherit', fontSize: 11.5,
                      padding: '4px 7px', outline: 'none', width: '100%', boxSizing: 'border-box',
                    }}
                  />
                )}
                {!edit && notes && (
                  <div style={{ marginTop: 5, fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic', lineHeight: 1.4 }}>
                    {notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Development notes */}
        {edit && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 500 }}>
              Gesamteinschätzung / Notizen
            </div>
            <textarea
              style={textareaStyle}
              value={devNotes}
              onChange={e => setDevNotes(e.target.value)}
              placeholder="Zusammenfassung, Trends, besondere Stärken oder Schwächen…"
            />
          </div>
        )}
        {!edit && master.developmentNotes && (
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
            {master.developmentNotes}
          </div>
        )}
        <SaveError error={error} />
      </SectionCard>
    </div>
  );
};

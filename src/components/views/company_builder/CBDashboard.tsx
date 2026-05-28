'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Ic } from '@/components/ui/icons';
import { CB_SECTIONS, PRIORITY_MAP, calcReadiness, calcSectionScore, calcPhase } from './types';
import { StatusBadge, SectionProgress } from './shared';
import { DEFAULT_TASKS } from './defaultTasks';

interface CBDashboardProps {
  onSection: (key: string) => void;
  onGoLive: () => void;
}

// ── Readiness ring ─────────────────────────────────────────────────────────────

const ReadinessRing = ({ pct }: { pct: number }) => {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 80 ? '#34d399' : pct >= 50 ? '#60a5fa' : pct >= 25 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
        <circle cx="65" cy="65" r={r} stroke={color} strokeWidth="8" fill="none"
          strokeDasharray={`${dash} ${circ}`} transform="rotate(-90 65 65)" strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <span style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Geist Mono', color, lineHeight: 1 }}>{pct}</span>
        <span style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Readiness</span>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

export const CBDashboard = ({ onSection, onGoLive }: CBDashboardProps) => {
  const { data: M, refresh } = useData();
  const [seeding, setSeeding] = useState(false);

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const tasks = M.setupTasks;
  const readiness = calcReadiness(tasks);
  const phase = calcPhase(readiness);
  const criticalBlockers = tasks.filter(t =>
    t.blockerGoLive && t.status !== 'done' && t.status !== 'not_relevant'
  );
  const totalOpen = tasks.filter(t => t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting').length;

  // Prioritized next actions: kritisch first, then hoch, not done/irrelevant, limit 8
  const nextActions = [...tasks]
    .filter(t => t.status !== 'done' && t.status !== 'not_relevant')
    .sort((a, b) => {
      const po: Record<string, number> = { kritisch: 0, hoch: 1, mittel: 2, niedrig: 3 };
      return (po[a.priority] ?? 9) - (po[b.priority] ?? 9);
    })
    .slice(0, 8);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const rows = DEFAULT_TASKS.map(t => ({
        section: t.section,
        title: t.title,
        description: t.description,
        why_important: t.whyImportant,
        required: t.required,
        priority: t.priority,
        phase: t.phase,
        status: 'open',
        blocker_go_live: t.blockerGoLive,
        blocker_first_deal: t.blockerFirstDeal,
        evidence_required: t.evidenceRequired ?? null,
        external_advisor: t.externalAdvisor ?? null,
        doc_quality: 'ungeprüft',
        sort_order: t.sortOrder,
      }));
      await sb.from('setup_tasks').insert(rows);
      refresh();
    } finally { setSeeding(false); }
  };

  const isEmpty = tasks.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Top status banner ──────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 20, alignItems: 'center',
        padding: '18px 22px', borderRadius: 12,
        background: `linear-gradient(135deg, rgba(96,165,250,0.06) 0%, rgba(167,139,250,0.06) 100%)`,
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <ReadinessRing pct={readiness} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>{phase.emoji}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Phase: {phase.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{phase.desc}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-2)' }}>
              {tasks.filter(t => t.status === 'done').length}/{tasks.length} Aufgaben erledigt
            </span>
            <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-2)' }}>
              {totalOpen} in Bearbeitung / offen
            </span>
            {criticalBlockers.length > 0 && (
              <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontWeight: 600 }}>
                ⚠ {criticalBlockers.length} kritische Blocker
              </span>
            )}
          </div>
        </div>

        <button className="btn primary" onClick={onGoLive}>
          <Ic name="check" size={13} /> Go-Live-Check
        </button>
      </div>

      {/* ── Seed button (only when empty) ─────────────────────────────────── */}
      {isEmpty && (
        <div style={{ padding: '24px 20px', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.15)', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🗺️</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Company Builder noch nicht initialisiert</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16, maxWidth: 400, margin: '0 auto 16px' }}>
            Lade {DEFAULT_TASKS.length} Standard-Aufbaupunkte für ein professionelles Exportgeschäft. Alle Punkte sind anpassbar.
          </div>
          <button className="btn primary" onClick={handleSeed} disabled={seeding}>
            <Ic name="plus" size={13} /> {seeding ? 'Initialisieren…' : 'Standard-Aufbauplan laden'}
          </button>
        </div>
      )}

      {/* ── Two-column layout: sections grid + next actions ──────────────── */}
      {!isEmpty && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14, alignItems: 'start' }}>

          {/* Section cards 4×2 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {CB_SECTIONS.map(section => {
              const st = tasks.filter(t => t.section === section.key);
              const relevant = st.filter(t => t.status !== 'not_relevant');
              const done = relevant.filter(t => t.status === 'done').length;
              const sectionScore = calcSectionScore(st);
              const blockers = st.filter(t => t.blockerGoLive && t.status !== 'done' && t.status !== 'not_relevant');
              const topOpen = st
                .filter(t => t.status !== 'done' && t.status !== 'not_relevant')
                .sort((a, b) => {
                  const po: Record<string, number> = { kritisch: 0, hoch: 1, mittel: 2, niedrig: 3 };
                  return (po[a.priority] ?? 9) - (po[b.priority] ?? 9);
                })
                .slice(0, 3);

              return (
                <div
                  key={section.key}
                  onClick={() => onSection(section.key)}
                  style={{
                    padding: '14px', borderRadius: 10, cursor: 'pointer',
                    background: 'var(--surface-2)',
                    border: `1px solid ${sectionScore === 100 ? section.color + '40' : 'rgba(255,255,255,0.07)'}`,
                    transition: 'border-color 0.15s, transform 0.1s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${section.color}50`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = sectionScore === 100 ? `${section.color}40` : 'rgba(255,255,255,0.07)'; }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: `${section.color}18`, border: `1px solid ${section.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Ic name={section.icon} size={13} color={section.color} />
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.3, flex: 1 }}>{section.label}</span>
                    {sectionScore === 100 && <span style={{ fontSize: 13 }}>✅</span>}
                  </div>

                  {/* Progress */}
                  <SectionProgress done={done} total={relevant.length} color={section.color} />
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>
                    {done}/{relevant.length} erledigt
                  </div>

                  {/* Blocker warning */}
                  {blockers.length > 0 && (
                    <div style={{ marginTop: 6, fontSize: 10, color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Ic name="alert" size={9} color="#f87171" /> {blockers.length} Blocker offen
                    </div>
                  )}

                  {/* Top tasks */}
                  {topOpen.length > 0 && (
                    <div style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
                      {topOpen.map((t, i) => (
                        <div key={i} style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4, lineHeight: 1.3 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: PRIORITY_MAP[t.priority as keyof typeof PRIORITY_MAP]?.color ?? '#94a3b8', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right panel: critical blockers + next actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Critical blockers */}
            {criticalBlockers.length > 0 && (
              <div className="card">
                <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Ic name="alert" size={13} color="#f87171" />
                  <span style={{ fontWeight: 600, fontSize: 12.5, color: '#f87171' }}>Go-Live Blocker</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, background: 'rgba(248,113,113,0.15)', color: '#f87171', padding: '1px 6px', borderRadius: 8 }}>{criticalBlockers.length}</span>
                </div>
                <div style={{ padding: '8px 12px' }}>
                  {criticalBlockers.slice(0, 6).map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, paddingBottom: 8, borderBottom: i < Math.min(criticalBlockers.length, 6) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', flexShrink: 0, marginTop: 4 }} />
                      <div>
                        <div style={{ fontSize: 11.5, fontWeight: 500, lineHeight: 1.3, marginBottom: 2 }}>{t.title}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{CB_SECTIONS.find(s => s.key === t.section)?.label}</div>
                      </div>
                    </div>
                  ))}
                  {criticalBlockers.length > 6 && (
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)', textAlign: 'center', padding: '4px 0' }}>
                      +{criticalBlockers.length - 6} weitere Blocker
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Next actions */}
            <div className="card">
              <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ic name="clock" size={13} color="var(--text-3)" />
                <span style={{ fontWeight: 600, fontSize: 12.5 }}>Nächste Schritte</span>
              </div>
              <div style={{ padding: '8px 12px' }}>
                {nextActions.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '12px 0' }}>
                    🎉 Alle Aufgaben erledigt!
                  </div>
                ) : nextActions.map((t, i) => (
                  <div
                    key={i}
                    onClick={() => onSection(t.section)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, paddingBottom: 8, borderBottom: i < nextActions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer' }}
                  >
                    <div style={{ marginTop: 2 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3, background: `${PRIORITY_MAP[t.priority as keyof typeof PRIORITY_MAP]?.color ?? '#94a3b8'}18`, color: PRIORITY_MAP[t.priority as keyof typeof PRIORITY_MAP]?.color ?? '#94a3b8', display: 'block', textAlign: 'center' }}>
                        {i + 1}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 500, lineHeight: 1.3, marginBottom: 1 }}>{t.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
                        {CB_SECTIONS.find(s => s.key === t.section)?.label}
                        {t.priority === 'kritisch' && <span style={{ color: '#f87171', marginLeft: 4 }}>· Kritisch</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Suppress unused import warning
const _unused: typeof StatusBadge = StatusBadge;
void _unused;

'use client';

import React from 'react';
import { useData } from '@/lib/data-context';
import { Ic } from '@/components/ui/icons';
import { CB_SECTIONS, CB_PHASES, STATUS_MAP, calcReadiness, calcSectionScore, calcPhase } from './types';
import type { CBStatus } from './types';
import { StatusBadge, PriorityBadge, BlockerTag, SectionProgress } from './shared';
import { t as tr } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';

interface CBGoLiveProps {
  onBack: () => void;
  onSection: (key: string) => void;
  lang: Lang;
}

// ── Phase timeline ─────────────────────────────────────────────────────────────

const PhaseTimeline = ({ readiness }: { readiness: number }) => {
  const current = calcPhase(readiness);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 8 }}>
      {CB_PHASES.map((ph, i) => {
        const reached = readiness >= ph.min;
        const isCurrent = ph.key === current.key;
        const isLast = i === CB_PHASES.length - 1;
        return (
          <React.Fragment key={ph.key}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 100 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: reached ? (isCurrent ? '#60a5fa' : 'rgba(52,211,153,0.15)') : 'rgba(255,255,255,0.05)',
                border: `2px solid ${isCurrent ? '#60a5fa' : reached ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, transition: 'all 0.3s',
                boxShadow: isCurrent ? '0 0 16px rgba(96,165,250,0.4)' : 'none',
              }}>
                {ph.emoji}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: reached ? (isCurrent ? '#60a5fa' : '#34d399') : 'var(--text-3)' }}>{ph.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-4)' }}>{ph.min}%+</div>
              </div>
            </div>
            {!isLast && (
              <div style={{ flex: 1, height: 2, background: reached && readiness >= CB_PHASES[i + 1].min ? '#34d399' : 'rgba(255,255,255,0.07)', minWidth: 24, transition: 'background 0.3s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

export const CBGoLive = ({ onBack, onSection, lang }: CBGoLiveProps) => {
  const { data: M } = useData();

  if (!M) return null;

  const tasks = M.setupTasks;
  const readiness = calcReadiness(tasks);
  const phase = calcPhase(readiness);

  const criticalBlockers = tasks.filter(t => t.blockerGoLive && t.status !== 'done' && t.status !== 'not_relevant');
  const dealBlockers = tasks.filter(t => t.blockerFirstDeal && t.status !== 'done' && t.status !== 'not_relevant');
  const criticalOpen = tasks.filter(t => t.priority === 'kritisch' && t.status !== 'done' && t.status !== 'not_relevant');

  const sectionScores = CB_SECTIONS.map(s => {
    const sTasks = tasks.filter(t => t.section === s.key);
    const score = calcSectionScore(sTasks);
    const blockers = sTasks.filter(t => (t.blockerGoLive || t.blockerFirstDeal) && t.status !== 'done' && t.status !== 'not_relevant');
    const open = sTasks.filter(t => t.status !== 'done' && t.status !== 'not_relevant').length;
    return { ...s, score, blockers, open, total: sTasks.length };
  });

  const statusGroups = Object.entries(
    tasks.reduce<Record<CBStatus, number>>((acc, t) => {
      acc[t.status as CBStatus] = (acc[t.status as CBStatus] ?? 0) + 1;
      return acc;
    }, {} as Record<CBStatus, number>)
  );

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, padding: 20,
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={onBack} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 10px', color: 'var(--text-2)', cursor: 'pointer', fontSize: 13 }}>← {tr(lang, 'back')}</button>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Go-Live Readiness Center</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>{tr(lang, 'cb_golive_subtitle')}</p>
        </div>
      </div>

      {/* Phase progress */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 4 }}>{tr(lang, 'cb_current_phase')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 24 }}>{phase.emoji}</span>
              <span style={{ fontSize: 20, fontWeight: 700 }}>{phase.label}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{phase.desc}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'Geist Mono', color: readiness >= 80 ? '#34d399' : readiness >= 50 ? '#60a5fa' : '#fbbf24' }}>{readiness}%</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{tr(lang, 'cb_total_readiness')}</div>
          </div>
        </div>
        <PhaseTimeline readiness={readiness} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: tr(lang, 'total'), value: tasks.length, color: 'var(--text-2)' },
          { label: tr(lang, 'cb_done'), value: tasks.filter(task => task.status === 'done').length, color: '#34d399' },
          { label: tr(lang, 'cb_go_live_blockers'), value: criticalBlockers.length, color: criticalBlockers.length > 0 ? '#f87171' : '#34d399' },
          { label: tr(lang, 'cb_deal_blockers'), value: dealBlockers.length, color: dealBlockers.length > 0 ? '#fb923c' : '#34d399' },
        ].map(s => (
          <div key={s.label} style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Geist Mono', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Go-Live Blockers */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#f87171' }}>
            <span>🚫</span> Go-Live Blocker ({criticalBlockers.length})
          </div>
          {criticalBlockers.length === 0 ? (
            <div style={{ color: '#34d399', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>✅ {tr(lang, 'cb_all_golive_done')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {criticalBlockers.map(t => (
                <div key={t.id} style={{ padding: '8px 10px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{t.title}</span>
                    <PriorityBadge priority={t.priority} />
                  </div>
                  {t.description && <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '4px 0 0' }}>{t.description}</p>}
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <StatusBadge status={t.status} />
                    {t.owner && <span style={{ fontSize: 10.5, color: 'var(--text-4)' }}>👤 {t.owner}</span>}
                    {t.dueDate && <span style={{ fontSize: 10.5, color: 'var(--text-4)' }}>📅 {t.dueDate}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* First-Deal Blockers */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#fb923c' }}>
            <span>🤝</span> Erster-Deal Blocker ({dealBlockers.length})
          </div>
          {dealBlockers.length === 0 ? (
            <div style={{ color: '#34d399', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>✅ {tr(lang, 'cb_all_deal_done')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dealBlockers.map(t => (
                <div key={t.id} style={{ padding: '8px 10px', background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.15)', borderRadius: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{t.title}</span>
                    <PriorityBadge priority={t.priority} />
                  </div>
                  {t.description && <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '4px 0 0' }}>{t.description}</p>}
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <StatusBadge status={t.status} />
                    {t.owner && <span style={{ fontSize: 10.5, color: 'var(--text-4)' }}>👤 {t.owner}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section scores */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>{tr(lang, 'cb_section_progress')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {sectionScores.map(s => (
            <div key={s.key} style={{ cursor: 'pointer' }} onClick={() => onSection(s.key)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: `${s.color}22`, border: `1px solid ${s.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ic name={s.icon} size={12} color={s.color} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, flex: 1 }}>{s.label}</span>
                <span style={{ fontSize: 12, fontFamily: 'Geist Mono', color: s.score === 100 ? '#34d399' : s.color, fontWeight: 700 }}>{s.score}%</span>
                {s.blockers.length > 0 && <BlockerTag label={`${s.blockers.length} Blocker`} />}
              </div>
              <SectionProgress done={s.total - s.open} total={s.total} color={s.color} />
            </div>
          ))}
        </div>
      </div>

      {/* Critical tasks */}
      {criticalOpen.length > 0 && (
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#f87171' }}>⚡</span> {tr(lang, 'cb_critical_open')} ({criticalOpen.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {criticalOpen.map(t => (
              <div key={t.id} style={{
                padding: '10px 12px', background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.12)', borderRadius: 8,
                display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'start', gap: 10,
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{t.title}</span>
                    {t.blockerGoLive && <BlockerTag label="Go-Live" />}
                    {t.blockerFirstDeal && <BlockerTag label="Deal" />}
                  </div>
                  {t.description && <p style={{ fontSize: 11.5, color: 'var(--text-3)', margin: '2px 0 4px' }}>{t.description}</p>}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <StatusBadge status={t.status} />
                    <span style={{ fontSize: 10.5, color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {CB_SECTIONS.find(s => s.key === t.section)?.label}
                    </span>
                    {t.owner && <span style={{ fontSize: 10.5, color: 'var(--text-4)' }}>👤 {t.owner}</span>}
                    {t.dueDate && <span style={{ fontSize: 10.5, color: 'var(--text-4)' }}>📅 {t.dueDate}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status distribution */}
      <div style={{ ...cardStyle, marginTop: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>{tr(lang, 'cb_status_overview')}</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {statusGroups.map(([status, count]) => {
            const info = STATUS_MAP[status as CBStatus];
            if (!info) return null;
            return (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 6, background: `${info.color}12`, border: `1px solid ${info.color}28` }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: info.color }} />
                <span style={{ fontSize: 12, color: info.color, fontWeight: 600 }}>{info.label}</span>
                <span style={{ fontSize: 13, fontFamily: 'Geist Mono', fontWeight: 700, color: 'var(--text)' }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

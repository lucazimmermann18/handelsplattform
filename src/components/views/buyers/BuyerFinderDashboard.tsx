'use client';

import React, { useMemo } from 'react';
import { useData } from '@/lib/data-context';
import type { Buyer } from '@/lib/types';
import { PIPELINE_STAGES, ACTIVE_STAGES, PRIORITY_MAP, getStageInfo, calcTotalScore, getScoreColor } from './types';

interface Props {
  onSection: (view: 'pipeline' | 'list') => void;
  onBuyer: (id: string) => void;
}

// ── KPI Tile ───────────────────────────────────────────────────────────────────

const Tile = ({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) => (
  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 18px' }}>
    <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Geist Mono', color: color ?? 'var(--text)', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 5 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: color ?? 'var(--text-3)', marginTop: 3 }}>{sub}</div>}
  </div>
);

// ── Main ───────────────────────────────────────────────────────────────────────

export const BuyerFinderDashboard = ({ onSection, onBuyer }: Props) => {
  const { data: M } = useData();

  const buyers: Buyer[] = useMemo(() => M?.buyers ?? [], [M]);

  const today = new Date().toISOString().slice(0, 10);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    PIPELINE_STAGES.forEach(s => { counts[s.key] = 0; });
    buyers.forEach(b => {
      const stage = b.pipelineStage ?? 'recherchiert';
      counts[stage] = (counts[stage] ?? 0) + 1;
    });
    return counts;
  }, [buyers]);

  const followUpsToday = useMemo(() =>
    buyers.filter(b => b.nextFollowUp && b.nextFollowUp <= today && b.pipelineStage !== 'gewonnen' && b.pipelineStage !== 'verloren')
      .sort((a, b) => (a.nextFollowUp ?? '').localeCompare(b.nextFollowUp ?? '')),
    [buyers, today]);

  const missingFollowUp = useMemo(() =>
    buyers.filter(b => {
      const stage = b.pipelineStage ?? 'recherchiert';
      return !b.nextFollowUp && ['kontaktiert', 'antwort', 'interessiert'].includes(stage);
    }).slice(0, 4),
    [buyers]);

  const hotBuyers = useMemo(() =>
    buyers.filter(b => ['interessiert', 'muster_angebot', 'verhandlung'].includes(b.pipelineStage ?? ''))
      .sort((a, b) => calcTotalScore(b.fitScore ?? 0, b.commercialScore ?? 0, b.engagementScore ?? 0, b.riskScore ?? 0)
        - calcTotalScore(a.fitScore ?? 0, a.commercialScore ?? 0, a.engagementScore ?? 0, a.riskScore ?? 0))
      .slice(0, 5),
    [buyers]);

  const segmentData = useMemo(() => {
    const map: Record<string, { total: number; qualifiziert: number; interessiert: number; gewonnen: number }> = {};
    buyers.forEach(b => {
      const type = b.buyerType ?? 'Typ unbekannt';
      if (!map[type]) map[type] = { total: 0, qualifiziert: 0, interessiert: 0, gewonnen: 0 };
      map[type].total++;
      const stage = b.pipelineStage ?? 'recherchiert';
      if (['qualifiziert', 'kontaktiert', 'antwort', 'interessiert', 'muster_angebot', 'verhandlung', 'gewonnen'].includes(stage)) map[type].qualifiziert++;
      if (['interessiert', 'muster_angebot', 'verhandlung', 'gewonnen'].includes(stage)) map[type].interessiert++;
      if (stage === 'gewonnen') map[type].gewonnen++;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total).slice(0, 8);
  }, [buyers]);

  const maxStage = ACTIVE_STAGES.reduce((max, s) => Math.max(max, stageCounts[s.key] ?? 0), 0) || 1;

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const qualified  = stageCounts['qualifiziert'] ?? 0;
  const contacted  = stageCounts['kontaktiert'] ?? 0;
  const interested = (stageCounts['interessiert'] ?? 0) + (stageCounts['muster_angebot'] ?? 0);
  const won        = stageCounts['gewonnen'] ?? 0;

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Buyer Finder</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>Akquise-Dashboard — Käufer von Recherche bis Deal</p>
        </div>
        <button onClick={() => onSection('pipeline')}
          style={{ padding: '7px 16px', borderRadius: 6, background: '#60a5fa', border: 'none', color: '#0d0f1a', cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>
          Pipeline-Kanban
        </button>
        <button onClick={() => onSection('list')}
          style={{ padding: '7px 16px', borderRadius: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text)', cursor: 'pointer', fontSize: 12.5 }}>
          Alle Käufer
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 18 }}>
        <Tile label="Käufer gesamt" value={buyers.length} color="var(--text)" />
        <Tile label="Qualifiziert" value={qualified} color="#60a5fa" />
        <Tile label="Kontaktiert" value={contacted} color="#a78bfa" />
        <Tile label="Interessiert" value={interested} color="#fb923c" />
        <Tile label="Gewonnen" value={won} color="#34d399" />
        <Tile label="Follow-ups fällig" value={followUpsToday.length} color={followUpsToday.length > 0 ? '#f87171' : '#34d399'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Funnel */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Akquise-Funnel</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ACTIVE_STAGES.map(stage => {
              const count = stageCounts[stage.key] ?? 0;
              const pct = maxStage > 0 ? (count / maxStage) * 100 : 0;
              return (
                <div key={stage.key} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 28px', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 12 }}>{stage.emoji}</span>
                    <span style={{ fontSize: 11.5, color: count > 0 ? 'var(--text-2)' : 'var(--text-4)', fontWeight: count > 0 ? 600 : 400 }}>{stage.label}</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: count > 0 ? stage.color : 'transparent', borderRadius: 4, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: 11.5, fontFamily: 'Geist Mono', color: count > 0 ? stage.color : 'var(--text-4)', textAlign: 'right', fontWeight: 700 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Follow-ups today */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${followUpsToday.length > 0 ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 10, color: followUpsToday.length > 0 ? '#f87171' : 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🔔</span> Follow-ups fällig ({followUpsToday.length})
            </div>
            {followUpsToday.length === 0 ? (
              <div style={{ fontSize: 12, color: '#34d399' }}>✅ Alle Follow-ups erledigt</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {followUpsToday.slice(0, 5).map(b => {
                  const info = getStageInfo(b.pipelineStage ?? 'recherchiert');
                  return (
                    <div key={b.id} onClick={() => onBuyer(b.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, background: 'rgba(248,113,113,0.06)', cursor: 'pointer' }}>
                      <span style={{ fontSize: 12 }}>{info.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{b.name}</div>
                        {b.nextAction && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{b.nextAction}</div>}
                      </div>
                      <span style={{ fontSize: 10, color: '#f87171' }}>{b.nextFollowUp}</span>
                    </div>
                  );
                })}
                {followUpsToday.length > 5 && <div style={{ fontSize: 11, color: 'var(--text-4)', textAlign: 'center' }}>+{followUpsToday.length - 5} weitere</div>}
              </div>
            )}
          </div>

          {/* Hot buyers */}
          {hotBuyers.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 10, color: '#fb923c', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>⭐</span> Heiße Kontakte ({hotBuyers.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {hotBuyers.map(b => {
                  const info = getStageInfo(b.pipelineStage ?? 'recherchiert');
                  const score = calcTotalScore(b.fitScore ?? 0, b.commercialScore ?? 0, b.engagementScore ?? 0, b.riskScore ?? 0);
                  const scoreColor = getScoreColor(score);
                  return (
                    <div key={b.id} onClick={() => onBuyer(b.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                      <span style={{ fontSize: 12 }}>{info.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{b.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{b.buyerType ?? b.industry} · {b.country}</div>
                      </div>
                      {score > 0 && (
                        <span style={{ fontSize: 11.5, fontFamily: 'Geist Mono', fontWeight: 700, color: scoreColor, padding: '1px 6px', background: `${scoreColor}18`, borderRadius: 4 }}>{score}</span>
                      )}
                      <span style={{ fontSize: 10, color: info.color, padding: '1px 5px', background: `${info.color}15`, borderRadius: 4 }}>{info.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Missing follow-up hint */}
          {missingFollowUp.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: '#fbbf24' }}>⚠ Kein Follow-up-Datum gesetzt</div>
              {missingFollowUp.map(b => (
                <div key={b.id} onClick={() => onBuyer(b.id)}
                  style={{ fontSize: 12, color: 'var(--text-3)', padding: '3px 0', cursor: 'pointer' }}>
                  → {b.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Segment breakdown */}
      {segmentData.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Käufer nach Segment</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600 }}>Segment</th>
                <th style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 600 }}>Gesamt</th>
                <th style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 600 }}>Qualifiziert</th>
                <th style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 600 }}>Interessiert</th>
                <th style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 600 }}>Gewonnen</th>
                <th style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 600 }}>Konversion</th>
              </tr>
            </thead>
            <tbody>
              {segmentData.map(([type, d]) => {
                const conv = d.total > 0 ? Math.round((d.interessiert / d.total) * 100) : 0;
                const convColor = conv >= 30 ? '#34d399' : conv >= 15 ? '#fbbf24' : 'var(--text-3)';
                return (
                  <tr key={type} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px 8px', fontWeight: 500 }}>{type}</td>
                    <td style={{ padding: '8px 8px', textAlign: 'right', fontFamily: 'Geist Mono' }}>{d.total}</td>
                    <td style={{ padding: '8px 8px', textAlign: 'right', fontFamily: 'Geist Mono', color: '#60a5fa' }}>{d.qualifiziert}</td>
                    <td style={{ padding: '8px 8px', textAlign: 'right', fontFamily: 'Geist Mono', color: '#fb923c' }}>{d.interessiert}</td>
                    <td style={{ padding: '8px 8px', textAlign: 'right', fontFamily: 'Geist Mono', color: '#34d399' }}>{d.gewonnen}</td>
                    <td style={{ padding: '8px 8px', textAlign: 'right', fontFamily: 'Geist Mono', color: convColor, fontWeight: 700 }}>{conv}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Priority breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 16 }}>
        {(Object.entries(PRIORITY_MAP) as [string, { label: string; color: string }][]).map(([k, v]) => {
          const count = buyers.filter(b => (b.priority ?? 'mittel') === k).length;
          return (
            <div key={k} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${v.color}22`, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: v.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Geist Mono', color: v.color }}>{count}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{v.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

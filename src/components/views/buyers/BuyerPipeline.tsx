'use client';

import React, { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useData } from '@/lib/data-context';
import type { Buyer } from '@/lib/types';
import { PIPELINE_STAGES, getStageInfo, getScoreColor, calcTotalScore } from './types';
import type { BuyerPipelineStage } from './types';

interface Props {
  onBuyer: (id: string) => void;
  onRefresh: () => void;
}

// ── Buyer card ─────────────────────────────────────────────────────────────────

const BuyerCard = ({ buyer, onOpen, onMove, stages }: {
  buyer: Buyer;
  onOpen: (id: string) => void;
  onMove: (id: string, stage: BuyerPipelineStage) => void;
  stages: typeof PIPELINE_STAGES;
}) => {
  const [showMove, setShowMove] = useState(false);
  const score = calcTotalScore(buyer.fitScore ?? 0, buyer.commercialScore ?? 0, buyer.engagementScore ?? 0, buyer.riskScore ?? 0);
  const scoreColor = getScoreColor(score);
  const stageInfo = getStageInfo(buyer.pipelineStage ?? 'recherchiert');
  const today = new Date().toISOString().slice(0, 10);
  const overdue = buyer.nextFollowUp && buyer.nextFollowUp <= today;

  return (
    <div style={{
      padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${overdue ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.08)'}`,
      cursor: 'pointer', position: 'relative',
      transition: 'background 0.15s',
    }}
      onClick={() => onOpen(buyer.id)}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 12.5, lineHeight: 1.3, marginBottom: 2 }}>{buyer.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{buyer.buyerType ?? buyer.industry}{buyer.country ? ` · ${buyer.country}` : ''}</div>
        </div>
        {score > 0 && (
          <span style={{ fontSize: 11, fontFamily: 'Geist Mono', fontWeight: 700, color: scoreColor, background: `${scoreColor}18`, padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>{score}</span>
        )}
      </div>

      {buyer.interests && buyer.interests.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
          {buyer.interests.slice(0, 2).map((int, i) => (
            <span key={i} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 10, background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>{int}</span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
        {overdue ? (
          <span style={{ fontSize: 10.5, color: '#f87171' }}>🔔 {buyer.nextFollowUp}</span>
        ) : buyer.nextFollowUp ? (
          <span style={{ fontSize: 10.5, color: 'var(--text-4)' }}>📅 {buyer.nextFollowUp}</span>
        ) : <span />}

        <div onClick={e => { e.stopPropagation(); setShowMove(s => !s); }}
          style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: `${stageInfo.color}18`, color: stageInfo.color, cursor: 'pointer', fontWeight: 600, border: `1px solid ${stageInfo.color}30` }}>
          Stufe ▾
        </div>
      </div>

      {showMove && (
        <div onClick={e => e.stopPropagation()}
          style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 4, background: 'var(--bg-2)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: 6, zIndex: 100, minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {stages.map(s => (
            <div key={s.key}
              onClick={() => { onMove(buyer.id, s.key); setShowMove(false); }}
              style={{ padding: '5px 10px', borderRadius: 5, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: s.key === (buyer.pipelineStage ?? 'recherchiert') ? s.color : 'var(--text-2)', background: s.key === (buyer.pipelineStage ?? 'recherchiert') ? `${s.color}15` : 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.background = `${s.color}12`)}
              onMouseLeave={e => (e.currentTarget.style.background = s.key === (buyer.pipelineStage ?? 'recherchiert') ? `${s.color}15` : 'transparent')}
            >
              <span>{s.emoji}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

export const BuyerPipeline = ({ onBuyer, onRefresh }: Props) => {
  const { data: M } = useData();
  const [filter, setFilter] = useState('');

  const buyers: Buyer[] = useMemo(() => {
    if (!M) return [];
    const q = filter.toLowerCase();
    return q ? M.buyers.filter(b => b.name.toLowerCase().includes(q) || (b.buyerType ?? b.industry ?? '').toLowerCase().includes(q)) : M.buyers;
  }, [M, filter]);

  const byStage = useMemo(() => {
    const map: Record<string, Buyer[]> = {};
    PIPELINE_STAGES.forEach(s => { map[s.key] = []; });
    buyers.forEach(b => {
      const stage = b.pipelineStage ?? 'recherchiert';
      if (map[stage]) map[stage].push(b);
    });
    return map;
  }, [buyers]);

  const handleMove = async (buyerId: string, stage: BuyerPipelineStage) => {
    await createClient().from('buyers').update({ pipeline_stage: stage }).eq('id', buyerId);
    onRefresh();
  };

  if (!M) return null;

  return (
    <div style={{ padding: '16px 24px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Pipeline-Kanban</h3>
        <input
          value={filter} onChange={e => setFilter(e.target.value)}
          placeholder="Käufer filtern…"
          style={{ padding: '5px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', fontSize: 12.5, outline: 'none', width: 200 }}
        />
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 'auto' }}>{buyers.length} Käufer</div>
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{ display: 'flex', gap: 10, minWidth: 'max-content', alignItems: 'flex-start' }}>
          {PIPELINE_STAGES.map(stage => {
            const list = byStage[stage.key] ?? [];
            return (
              <div key={stage.key} style={{ width: 210, flexShrink: 0 }}>
                {/* Column header */}
                <div style={{
                  padding: '8px 12px', borderRadius: '8px 8px 0 0', marginBottom: 0,
                  background: `${stage.color}18`, border: `1px solid ${stage.color}33`,
                  borderBottom: 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{stage.emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: stage.color, flex: 1 }}>{stage.label}</span>
                    <span style={{ fontSize: 12, fontFamily: 'Geist Mono', color: stage.color, fontWeight: 800, background: `${stage.color}25`, padding: '0 5px', borderRadius: 4 }}>{list.length}</span>
                  </div>
                </div>

                {/* Cards column */}
                <div style={{
                  minHeight: 100, padding: '8px', background: 'rgba(255,255,255,0.015)',
                  border: `1px solid ${stage.color}22`, borderTop: 'none', borderRadius: '0 0 8px 8px',
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  {list.length === 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-4)', textAlign: 'center', padding: '14px 0', fontStyle: 'italic' }}>Leer</div>
                  )}
                  {list.map(b => (
                    <BuyerCard key={b.id} buyer={b} onOpen={onBuyer} onMove={handleMove} stages={PIPELINE_STAGES} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

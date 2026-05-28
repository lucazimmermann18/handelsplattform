'use client';

import React from 'react';
import { Badge } from '@/components/ui/primitives';
import type { CBStatus, CBPriority, CBDocQuality } from './types';
import { STATUS_MAP, PRIORITY_MAP, DOC_QUALITY_MAP } from './types';

// ── StatusBadge ────────────────────────────────────────────────────────────────

export const StatusBadge = ({ status }: { status: string }) => {
  const info = STATUS_MAP[status as CBStatus] ?? { label: status, kind: 'neutral' };
  return <Badge kind={info.kind}>{info.label}</Badge>;
};

// ── PriorityBadge ──────────────────────────────────────────────────────────────

export const PriorityBadge = ({ priority }: { priority: string }) => {
  const info = PRIORITY_MAP[priority as CBPriority] ?? { label: priority, color: '#94a3b8' };
  return (
    <span style={{
      padding: '1px 7px', borderRadius: 10, fontSize: 10.5, fontWeight: 700,
      color: info.color, background: `${info.color}18`,
      border: `1px solid ${info.color}30`,
    }}>
      {info.label}
    </span>
  );
};

// ── DocQualityBadge ────────────────────────────────────────────────────────────

export const DocQualityBadge = ({ quality }: { quality: string }) => {
  const info = DOC_QUALITY_MAP[quality as CBDocQuality] ?? { label: quality, kind: 'neutral' };
  return <Badge kind={info.kind}>{info.label}</Badge>;
};

// ── BlockerTag ─────────────────────────────────────────────────────────────────

export const BlockerTag = ({ label }: { label: string }) => (
  <span style={{
    padding: '1px 6px', borderRadius: 4, fontSize: 9.5, fontWeight: 700,
    background: 'rgba(248,113,113,0.12)', color: '#f87171',
    border: '1px solid rgba(248,113,113,0.3)',
  }}>
    {label}
  </span>
);

// ── SectionProgress ────────────────────────────────────────────────────────────

export const SectionProgress = ({
  done, total, color,
}: { done: number; total: number; color: string }) => {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 10.5, fontFamily: 'Geist Mono', color: pct === 100 ? color : 'var(--text-3)', minWidth: 32, textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  );
};

// ── StatusSelect ───────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 12.5,
  padding: '6px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

export const StatusSelect = ({
  value, onChange,
}: { value: string; onChange: (v: CBStatus) => void }) => (
  <select style={{ ...inputStyle, fontSize: 12 }} value={value} onChange={e => onChange(e.target.value as CBStatus)}>
    <option value="open">Offen</option>
    <option value="in_progress">In Arbeit</option>
    <option value="submitted">Eingereicht</option>
    <option value="waiting">Wartet auf Antwort</option>
    <option value="done">Erledigt</option>
    <option value="not_relevant">Nicht relevant</option>
  </select>
);

// ── Quick status toggle dot ────────────────────────────────────────────────────

export const StatusDot = ({
  status, onClick,
}: { status: string; onClick?: () => void }) => {
  const info = STATUS_MAP[status as CBStatus] ?? { color: '#94a3b8', label: status };
  return (
    <div
      onClick={onClick}
      title={info.label}
      style={{
        width: 10, height: 10, borderRadius: '50%',
        background: status === 'done' ? info.color : 'transparent',
        border: `2px solid ${info.color}`,
        flexShrink: 0, cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.15s',
      }}
    />
  );
};

// ── Shared input styles ────────────────────────────────────────────────────────

export { inputStyle };
export const textareaStyle: React.CSSProperties = {
  ...inputStyle, fontSize: 12.5, padding: '8px 10px',
  resize: 'vertical', minHeight: 72, lineHeight: 1.5,
};

'use client';

import React from 'react';
import { MOCK } from '@/lib/mock';
import type { Lang } from '@/lib/i18n';
import { t as translate } from '@/lib/i18n';

// Badge
interface BadgeProps {
  kind?: string;
  dot?: boolean;
  children: React.ReactNode;
}
export const Badge = ({ kind = 'neutral', dot = false, children }: BadgeProps) => (
  <span className={`badge ${kind}`}>
    {dot && <span className="dot" />}
    {children}
  </span>
);

// Stars
export const Stars = ({ value = 0, max = 5 }: { value?: number; max?: number }) => (
  <span className="stars">
    {Array.from({ length: max }).map((_, i) => (
      <svg key={i} className={'s' + (i < value ? '' : ' off')} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z" />
      </svg>
    ))}
  </span>
);

// Sparkline
interface SparklineProps {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
  fill?: boolean;
}
export const Sparkline = ({ data, w = 80, h = 24, color = '#3b82f6', fill = true }: SparklineProps) => {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 2) - 1}`).join(' ');
  const fillPts = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {fill && <polyline points={fillPts} fill={color} fillOpacity="0.12" stroke="none" />}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// BarChart
interface BarEntry {
  [key: string]: number | string;
}
interface BarChartProps {
  data: BarEntry[];
  w?: number;
  h?: number;
  color?: string;
  secondColor?: string;
  valKey?: string;
  val2Key?: string | null;
  lblKey?: string;
}
export const BarChart = ({ data, w = 380, h = 130, color = '#3b82f6', secondColor = '#22d3ee', valKey = 'v', val2Key = null, lblKey = 'm' }: BarChartProps) => {
  const all = data.flatMap(d => [d[valKey] as number, val2Key ? d[val2Key] as number : 0]).filter(v => v != null);
  const max = Math.max(...all) * 1.15;
  const bw = w / data.length;
  const ih = h - 22;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {[0.25, 0.5, 0.75].map((p, i) => <line key={i} x1="0" x2={w} y1={ih * (1 - p)} y2={ih * (1 - p)} stroke="rgba(255,255,255,0.04)" />)}
      {data.map((d, i) => {
        const v = d[valKey] as number;
        const v2 = val2Key ? d[val2Key] as number : null;
        const vh = (v / max) * ih;
        const v2h = v2 != null ? (v2 / max) * ih : 0;
        const x = i * bw;
        const barW = bw * 0.34;
        return (
          <g key={i}>
            <rect x={x + bw * 0.18} y={ih - vh} width={barW} height={vh} fill={color} rx="1" />
            {v2 != null && <rect x={x + bw * 0.18 + barW + 2} y={ih - v2h} width={barW} height={v2h} fill={secondColor} rx="1" />}
            <text x={x + bw / 2} y={h - 6} fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle">{d[lblKey] as string}</text>
          </g>
        );
      })}
    </svg>
  );
};

// Donut
interface DonutSlice { v: number; color: string; label?: string; }
export const Donut = ({ data, size = 110, thickness = 14 }: { data: DonutSlice[]; size?: number; thickness?: number }) => {
  const total = data.reduce((s, d) => s + d.v, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let off = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.05)" strokeWidth={thickness} fill="none" />
      {data.map((d, i) => {
        const len = (d.v / total) * c;
        const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} stroke={d.color} strokeWidth={thickness} fill="none" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-off} transform={`rotate(-90 ${size / 2} ${size / 2})`} />;
        off += len;
        return el;
      })}
    </svg>
  );
};

// StatusBadge
export const StatusBadge = ({ s, lang }: { s: string; lang: Lang }) => {
  const kindMap = MOCK.statusBadge as Record<string, string>;
  return <Badge kind={kindMap[s] || 'neutral'} dot>{translate(lang, `s_${s}`)}</Badge>;
};

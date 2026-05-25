'use client';

import React from 'react';
import type { Lang } from '@/lib/i18n';
import { Sparkline } from '@/components/ui/primitives';

interface MarketViewProps { lang: Lang; }

const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez', 'Jan', 'Feb', 'Mär', 'Apr', 'Mai'];

const series = [
  { name: 'Coffee C (Arabica)', unit: '$ / lb', last: 2.34, change: '+12.4%', color: '#a78bfa', data: months.map((_m, i) => 1.9 + Math.sin(i / 3) * 0.3 + i * 0.04), exch: 'ICE NY', ourPrice: 6.10, ourUnit: '€/kg' },
  { name: 'Robusta', unit: '$ / t', last: 3984, change: '+18.2%', color: '#60a5fa', data: months.map((_m, i) => 3000 + i * 80 + Math.sin(i / 2) * 200), exch: 'ICE EU' },
  { name: 'Cocoa', unit: '$ / t', last: 9420, change: '+82%', color: '#fbbf24', data: months.map((_m, i) => 5500 + i * 350 + Math.sin(i / 2) * 400), exch: 'ICE NY' },
  { name: 'Sugar #11', unit: 'c / lb', last: 17.84, change: '-4.2%', color: '#34d399', data: months.map((_m, i) => 22 - i * 0.4 + Math.sin(i / 2) * 1.2), exch: 'ICE NY', ourPrice: 0.92, ourUnit: '€/kg' },
  { name: 'Cashew (Vietnam W320)', unit: '$ / lb', last: 3.42, change: '+5.1%', color: '#22d3ee', data: months.map((_m, i) => 3.0 + Math.sin(i / 2.5) * 0.25 + i * 0.03), exch: 'Spot Mumbai', ourPrice: 9.40, ourUnit: '€/kg' },
  { name: 'Sesame (Tanzania FOB)', unit: '$ / t', last: 1820, change: '+9.0%', color: '#f87171', data: months.map((_m, i) => 1500 + i * 30 + Math.sin(i / 3) * 80), exch: 'Spot DAR', ourPrice: 2.20, ourUnit: '€/kg' },
  { name: 'Macadamia (CME Index)', unit: '$ / lb', last: 6.18, change: '+11.2%', color: '#e0b765', data: months.map((_m, i) => 5.4 + Math.sin(i / 2) * 0.3 + i * 0.05), exch: 'CME' },
  { name: 'Brent Crude', unit: '$ / bbl', last: 81.42, change: '-2.4%', color: '#5d667d', data: months.map((_m, i) => 85 - i * 0.4 + Math.sin(i / 2) * 3), exch: 'ICE EU' },
];

const isPositive = (change: string) => change.startsWith('+');

export const MarketView = ({ lang: _lang }: MarketViewProps) => {
  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h1 className="view-title">Marktpreise</h1>
          <p className="view-sub">Rohstoffpreise · Internationale Börsen · Live</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>LIVE · 14:22</span>
        </div>
      </div>

      {/* Ticker Bar */}
      <div style={{
        background: 'var(--surface-2)',
        borderRadius: 8,
        padding: '8px 16px',
        marginBottom: 16,
        overflowX: 'auto',
        whiteSpace: 'nowrap',
      }}>
        <div style={{ display: 'inline-flex', gap: 32, alignItems: 'center' }}>
          {series.map(s => (
            <span key={s.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{s.name.split(' ')[0]}</span>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{s.last}</span>
              <span style={{ fontSize: 11, color: isPositive(s.change) ? '#34d399' : '#f87171', fontWeight: 600 }}>{s.change}</span>
              <Sparkline data={s.data} w={60} h={20} color={s.color} fill={false} />
            </span>
          ))}
        </div>
      </div>

      {/* 4-column card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {series.map(s => (
          <div key={s.name} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{s.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.exch}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {typeof s.last === 'number' && s.last > 100
                    ? s.last.toLocaleString('de-DE')
                    : s.last}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.unit}</div>
              </div>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: isPositive(s.change) ? '#34d399' : '#f87171',
              }}>
                {s.change}
              </div>
            </div>

            <Sparkline data={s.data} w={180} h={48} color={s.color} />

            {s.ourPrice && (
              <div style={{
                background: 'var(--surface-2)',
                borderRadius: 6,
                padding: '6px 8px',
                fontSize: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Unser VK</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {s.ourPrice} {s.ourUnit}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
        Quelle: Refinitiv · letzte Aktualisierung 14:22 · LIVE
      </div>
    </div>
  );
};

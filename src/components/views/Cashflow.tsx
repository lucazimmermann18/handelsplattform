'use client';

import React, { useMemo } from 'react';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtCur, fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import { useData } from '@/lib/data-context';

interface CashflowViewProps {
  lang: Lang;
}

interface CashEntry {
  date: string;
  label: string;
  amount: number;
  category: string;
}

// ── Build daily series ────────────────────────────────────────────────────────

interface DayEntry {
  date: string;
  label: string;
  inflow: number;
  outflow: number;
  balance: number;
}

function buildSeries(startBalance: number, inflows: CashEntry[], outflows: CashEntry[]): DayEntry[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const days: DayEntry[] = [];
  let balance = startBalance;

  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });

    const inflow = inflows.filter(e => e.date === dateStr).reduce((s, e) => s + e.amount, 0);
    const outflow = outflows.filter(e => e.date === dateStr).reduce((s, e) => s + e.amount, 0);
    balance = balance + inflow - outflow;
    days.push({ date: dateStr, label, inflow, outflow, balance });
  }
  return days;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const CashflowView = ({ lang }: CashflowViewProps) => {
  const { data: M } = useData();
  const START_BALANCE = 142000;

  // Derive inflows & outflows from live order data
  const { INFLOWS, OUTFLOWS } = useMemo((): { INFLOWS: CashEntry[]; OUTFLOWS: CashEntry[] } => {
    if (!M) return { INFLOWS: [], OUTFLOWS: [] };

    const today = new Date();
    const horizon = new Date(today);
    horizon.setDate(today.getDate() + 30);
    const INFLOWS: CashEntry[] = [];
    const OUTFLOWS: CashEntry[] = [];

    M.orders.forEach(o => {
      if (o.revenue <= 0) return;
      const paidPct = Math.max(0, Math.min(100, o.paid));
      const outstanding = Math.round(o.revenue * (100 - paidPct) / 100);

      // ── Inflows: expected payment receipts ──
      if (outstanding > 0) {
        let payDate: Date | null = null;
        if (['delivered', 'arrived'].includes(o.status)) {
          // Overdue / just delivered → expect in 7 days
          payDate = new Date(today);
          payDate.setDate(today.getDate() + 7);
        } else if (o.eta) {
          const eta = new Date(o.eta);
          if (!isNaN(eta.getTime())) {
            // Payment due 30 days after delivery (standard T/T terms)
            payDate = new Date(eta);
            payDate.setDate(eta.getDate() + 30);
          }
        }
        if (payDate && payDate >= today && payDate <= horizon) {
          const buyerName = M.buyers.find(b => b.id === o.buyerId)?.name ?? o.buyerId;
          INFLOWS.push({
            date: payDate.toISOString().slice(0, 10),
            label: `${buyerName} — ${paidPct > 0 ? 'Rest' : ''}zahlung ${o.id}`,
            amount: outstanding,
            category: paidPct > 0 ? 'Restzahlung' : 'Zahlungseingang',
          });
        }
      }

      // ── Outflows: procurement costs for upcoming shipments ──
      const procCost = o.costGoods ?? Math.round((o.revenue - o.profit) * 0.7);
      if (procCost > 500 && ['in_procurement', 'in_quality', 'ready', 'in_export'].includes(o.status)) {
        const etd = o.etd ? new Date(o.etd) : null;
        // Supplier payment = 14 days before ETD (or today+7 if no ETD)
        const payDate = etd && !isNaN(etd.getTime())
          ? new Date(etd.getTime() - 14 * 86400000)
          : new Date(today.getTime() + 7 * 86400000);
        if (payDate >= today && payDate <= horizon) {
          const supplierName = M.suppliers.find(s => s.id === o.supplierId)?.name ?? 'Lieferant';
          OUTFLOWS.push({
            date: payDate.toISOString().slice(0, 10),
            label: `${supplierName} — Einkauf ${o.id}`,
            amount: procCost,
            category: 'Einkauf',
          });
          // Logistics cost
          const logCost = o.costLogistics ?? 0;
          if (logCost > 0) {
            const logDate = etd && !isNaN(etd.getTime()) ? new Date(etd) : payDate;
            if (logDate >= today && logDate <= horizon) {
              OUTFLOWS.push({
                date: logDate.toISOString().slice(0, 10),
                label: `Fracht / Logistik ${o.id}`,
                amount: logCost,
                category: 'Logistik',
              });
            }
          }
        }
      }
    });

    INFLOWS.sort((a, b) => a.date.localeCompare(b.date));
    OUTFLOWS.sort((a, b) => a.date.localeCompare(b.date));
    return { INFLOWS, OUTFLOWS };
  }, [M]);

  const series = buildSeries(START_BALANCE, INFLOWS, OUTFLOWS);

  const exportCSV = () => {
    const rows: string[][] = [
      ['Typ', 'Datum', 'Beschreibung', 'Kategorie', 'Betrag (EUR)'],
      ...INFLOWS.map(e => ['Cash-In', e.date, e.label, e.category, String(e.amount)]),
      ...OUTFLOWS.map(e => ['Cash-Out', e.date, e.label, e.category, String(-e.amount)]),
    ];
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'cashflow-forecast.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const totalIn = INFLOWS.reduce((s, e) => s + e.amount, 0);
  const totalOut = OUTFLOWS.reduce((s, e) => s + e.amount, 0);
  const netto = totalIn - totalOut;
  const minBalance = Math.min(...series.map(d => d.balance));
  const maxBalance = Math.max(...series.map(d => d.balance));
  const endBalance = series[series.length - 1].balance;

  // ── SVG Chart ──
  const W = 1100;
  const H = 200;
  const PAD_L = 60;
  const PAD_R = 10;
  const PAD_T = 12;
  const PAD_B = 28;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const balMin = Math.min(minBalance, 0) - 5000;
  const balMax = maxBalance + 20000;
  const balRange = balMax - balMin || 1;

  const xOf = (i: number) => PAD_L + (i / (series.length - 1)) * chartW;
  const yOf = (v: number) => PAD_T + chartH - ((v - balMin) / balRange) * chartH;

  const balancePts = series.map((d, i) => `${xOf(i)},${yOf(d.balance)}`).join(' ');

  const barW = chartW / series.length * 0.35;

  return (
    <div>
      <div className="section-head">
        <h1>Cashflow Forecast</h1>
        <div className="sub">30-Tage-Liquiditätsplanung · Cash-In · Cash-Out · KI-Warnung</div>
        <div className="right">
          <button className="btn" onClick={exportCSV}><Ic name="download" size={13} /> {t(lang, 'export')}</button>
        </div>
      </div>

      <div style={{ padding: '0 16px 16px' }}>

        {/* ── KPI Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
          <div className="card" style={{ padding: 14, borderLeft: '3px solid #34d399' }}>
            <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cash-In (30d)</div>
            <div className="mono fw700" style={{ fontSize: 22, color: '#34d399', marginTop: 4 }}>{fmtCur(totalIn)}</div>
            <div className="tx3" style={{ fontSize: 11, marginTop: 4 }}>{INFLOWS.length} Eingänge</div>
          </div>
          <div className="card" style={{ padding: 14, borderLeft: '3px solid #f87171' }}>
            <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cash-Out (30d)</div>
            <div className="mono fw700" style={{ fontSize: 22, color: '#f87171', marginTop: 4 }}>{fmtCur(totalOut)}</div>
            <div className="tx3" style={{ fontSize: 11, marginTop: 4 }}>{OUTFLOWS.length} Ausgänge</div>
          </div>
          <div className="card" style={{ padding: 14, borderLeft: `3px solid ${netto >= 0 ? '#60a5fa' : '#f87171'}` }}>
            <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Netto (30d)</div>
            <div className="mono fw700" style={{ fontSize: 22, color: netto >= 0 ? '#60a5fa' : '#f87171', marginTop: 4 }}>{netto >= 0 ? '+' : ''}{fmtCur(netto)}</div>
            <div className="tx3" style={{ fontSize: 11, marginTop: 4 }}>Endbestand: {fmtCur(endBalance)}</div>
          </div>
          <div className="card" style={{ padding: 14, borderLeft: `3px solid ${minBalance < 80000 ? '#ef4444' : '#fbbf24'}` }}>
            <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tiefster Stand</div>
            <div className="mono fw700" style={{ fontSize: 22, color: minBalance < 80000 ? '#ef4444' : '#fbbf24', marginTop: 4 }}>{fmtCur(minBalance)}</div>
            <div className="tx3" style={{ fontSize: 11, marginTop: 4 }}>{minBalance < 80000 ? '⚠ Unter Schwelle 80k' : 'Über Mindestschwelle'}</div>
          </div>
        </div>

        {/* ── AI Liquidity Warning ── */}
        {minBalance < 80000 && (
          <div className="ai-card" style={{ padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, #ef4444, #f87171)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ic name="warn" size={16} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>KI · Liquiditätswarnung</span>
                  <Badge kind="danger">kritisch</Badge>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#fca5a5' }}>
                  Liquidität fällt unter 80.000 € — Maßnahmen empfohlen
                </div>
                <div className="tx2" style={{ fontSize: 11.5, lineHeight: 1.6 }}>
                  Der prognostizierte Tiefststand von <strong style={{ color: '#fca5a5' }}>{fmtCur(minBalance)}</strong> liegt unter der empfohlenen Mindestreserve von 80.000 €.
                  Empfehlung: Mediterraneo-Zahlung eskalieren ({fmtCur(23920)}) und/oder Anzahlung Antwerpen Building Supplies beschleunigen.
                  Alternativ: Kurzfristige Trade-Finance-Linie prüfen.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SVG Chart ── */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-head">
            <Ic name="activity" size={14} />
            <span className="title">Liquiditätsverlauf — 30 Tage ({series[0]?.label} – {series[series.length - 1]?.label})</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                <span style={{ width: 16, height: 3, background: '#60a5fa', display: 'inline-block', borderRadius: 2 }} /> Bestand
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                <span style={{ width: 10, height: 10, background: '#34d399', display: 'inline-block', borderRadius: 1 }} /> Cash-In
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                <span style={{ width: 10, height: 10, background: '#f87171', display: 'inline-block', borderRadius: 1 }} /> Cash-Out
              </span>
            </div>
          </div>
          <div className="card-body" style={{ padding: '8px 0 0' }}>
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 200 }}>
              {/* Grid lines */}
              {[0.25, 0.5, 0.75, 1].map((p, i) => (
                <line key={i} x1={PAD_L} x2={W - PAD_R} y1={PAD_T + chartH * (1 - p)} y2={PAD_T + chartH * (1 - p)} stroke="rgba(255,255,255,0.04)" />
              ))}
              {/* 80k threshold */}
              <line x1={PAD_L} x2={W - PAD_R} y1={yOf(80000)} y2={yOf(80000)} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.5" />
              <text x={PAD_L + 4} y={yOf(80000) - 3} fill="#ef4444" fontSize={8} opacity={0.7}>80k Minimum</text>

              {/* Inflow bars */}
              {series.map((d, i) => {
                if (d.inflow === 0) return null;
                const bh = (d.inflow / balRange) * chartH;
                const by = yOf(d.balance) - bh;
                return <rect key={`in-${i}`} x={xOf(i) - barW - 1} y={by} width={barW} height={bh} fill="#34d399" opacity="0.7" rx="1" />;
              })}

              {/* Outflow bars */}
              {series.map((d, i) => {
                if (d.outflow === 0) return null;
                const bh = (d.outflow / balRange) * chartH;
                const by = yOf(d.balance);
                return <rect key={`out-${i}`} x={xOf(i) + 1} y={by} width={barW} height={bh} fill="#f87171" opacity="0.7" rx="1" />;
              })}

              {/* Balance polyline */}
              <polyline points={balancePts} fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

              {/* Y-axis labels */}
              {[balMin + balRange * 0.25, balMin + balRange * 0.5, balMin + balRange * 0.75, balMax].map((v, i) => (
                <text key={i} x={PAD_L - 4} y={yOf(v) + 3} textAnchor="end" fontSize={8} fill="rgba(255,255,255,0.3)">
                  {v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v).toString()}
                </text>
              ))}

              {/* X-axis labels — every 5 days */}
              {series.filter((_, i) => i % 5 === 0).map((d, i) => (
                <text key={i} x={xOf(i * 5)} y={H - 6} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.3)">{d.label}</text>
              ))}
            </svg>
          </div>
        </div>

        {/* ── Cash-In / Cash-Out Tables ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Cash-In */}
          <div className="card">
            <div className="card-head">
              <Ic name="finance" size={14} />
              <span className="title" style={{ color: '#34d399' }}>Cash-In — Erwartete Eingänge</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <table className="tbl" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Beschreibung</th>
                    <th>Kategorie</th>
                    <th style={{ textAlign: 'right' }}>Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {INFLOWS.map((e, i) => (
                    <tr key={i}>
                      <td className="mono" style={{ fontSize: 11 }}>{fmtDate(e.date)}</td>
                      <td style={{ fontSize: 11 }}>{e.label}</td>
                      <td><Badge kind={e.category === 'Erwartet' ? 'neutral' : e.category === 'LC' ? 'ocean' : 'success'}>{e.category}</Badge></td>
                      <td className="mono fw600" style={{ fontSize: 12, color: '#34d399', textAlign: 'right' }}>+{fmtCur(e.amount)}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <td colSpan={3} style={{ fontWeight: 600, fontSize: 11, padding: '8px 12px' }}>Gesamt</td>
                    <td className="mono fw700" style={{ fontSize: 13, color: '#34d399', textAlign: 'right', padding: '8px 12px' }}>+{fmtCur(totalIn)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Cash-Out */}
          <div className="card">
            <div className="card-head">
              <Ic name="pkg" size={14} />
              <span className="title" style={{ color: '#f87171' }}>Cash-Out — Geplante Ausgaben</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <table className="tbl" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Beschreibung</th>
                    <th>Kategorie</th>
                    <th style={{ textAlign: 'right' }}>Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {OUTFLOWS.map((e, i) => (
                    <tr key={i}>
                      <td className="mono" style={{ fontSize: 11 }}>{fmtDate(e.date)}</td>
                      <td style={{ fontSize: 11 }}>{e.label}</td>
                      <td><Badge kind={e.category === 'Einkauf' ? 'info' : e.category === 'Logistik' ? 'ocean' : 'neutral'}>{e.category}</Badge></td>
                      <td className="mono fw600" style={{ fontSize: 12, color: '#f87171', textAlign: 'right' }}>-{fmtCur(e.amount)}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <td colSpan={3} style={{ fontWeight: 600, fontSize: 11, padding: '8px 12px' }}>Gesamt</td>
                    <td className="mono fw700" style={{ fontSize: 13, color: '#f87171', textAlign: 'right', padding: '8px 12px' }}>-{fmtCur(totalOut)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

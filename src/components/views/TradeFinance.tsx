'use client';

import React from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtCur, fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

interface TradeFinanceViewProps { lang: Lang; }

const lcs = [
  { id: 'LC-2026-014', bank: 'Standard Bank · TZ', buyer: 'BUY-002', order: 'ORD-2026-0144', amount: 61000, type: 'Sight LC', status: 'issued', expiry: '2026-07-30', confirmed: true },
  { id: 'LC-2026-012', bank: 'Commerzbank', buyer: 'BUY-007', order: 'ORD-2026-0142', amount: 55200, type: 'Sight LC', status: 'utilized', expiry: '2026-06-15', confirmed: true },
  { id: 'LC-2026-009', bank: 'BNP Paribas', buyer: 'BUY-023', order: 'ORD-2026-0137', amount: 23920, type: 'CAD', status: 'pending', expiry: '2026-06-30', confirmed: false },
  { id: 'LC-2026-008', bank: 'ING Bank', buyer: 'BUY-011', order: 'ORD-2026-0139', amount: 17400, type: 'Net 30', status: 'settled', expiry: '—', confirmed: false },
];

const fxPositions = [
  { pair: 'EUR/USD', rate: 1.0842, hedged: 320000, exposure: 480000, instrument: 'Forward 3M', maturity: '2026-08-15' },
  { pair: 'EUR/GBP', rate: 0.8421, hedged: 90000, exposure: 92000, instrument: 'Spot', maturity: '—' },
  { pair: 'EUR/TZS', rate: 2847.3, hedged: 0, exposure: 280000, instrument: '—', maturity: '—' },
];

const statusKind: Record<string, string> = {
  issued: 'info',
  utilized: 'success',
  pending: 'warning',
  settled: 'neutral',
};

const paymentSteps = [
  { label: 'Anzahlung (30%)', pct: 30, amount: 18300, status: 'done', date: '2026-05-02' },
  { label: 'Gegen Dokumente (40%)', pct: 40, amount: 24400, status: 'pending', date: '2026-06-08' },
  { label: 'Nach Ankunft (30%)', pct: 30, amount: 18300, status: 'upcoming', date: '2026-07-15' },
];

export const TradeFinanceView = ({ lang }: TradeFinanceViewProps) => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const buyerName = (id: string) => M.buyers.find(b => b.id === id)?.name ?? id;

  const totalLCAmount = lcs.reduce((s, lc) => s + lc.amount, 0);
  const fxExposure = fxPositions.reduce((s, fx) => s + fx.exposure, 0);
  const fxHedged = fxPositions.reduce((s, fx) => s + fx.hedged, 0);
  const hedgedPct = Math.round((fxHedged / fxExposure) * 100);

  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h1 className="view-title">Trade Finance</h1>
          <p className="view-sub">Akkreditive · Zahlungsplan · FX-Hedging</p>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="kpi-row">
        <div className="kpi-tile">
          <div className="kpi-icon"><Ic name="finance" size={18} /></div>
          <div className="kpi-val">{lcs.filter(l => l.status !== 'settled').length}</div>
          <div className="kpi-lbl">Aktive LCs</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-icon"><Ic name="pkg" size={18} /></div>
          <div className="kpi-val">{fmtCur(totalLCAmount)}</div>
          <div className="kpi-lbl">Gebundene Liquidität</div>
        </div>
        <div className="kpi-tile warn">
          <div className="kpi-icon"><Ic name="activity" size={18} /></div>
          <div className="kpi-val">€ 852k</div>
          <div className="kpi-lbl">FX-Exposure</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-icon"><Ic name="quality" size={18} /></div>
          <div className="kpi-val">{hedgedPct}%</div>
          <div className="kpi-lbl">Gehedgt</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-icon"><Ic name="chart" size={18} /></div>
          <div className="kpi-val">{fmtCur(112000)}</div>
          <div className="kpi-lbl">Factoring</div>
        </div>
      </div>

      {/* Letters of Credit Table */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title"><Ic name="doc" size={14} /> Akkreditive (LC)</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>LC-ID</th>
              <th>Bank · Typ</th>
              <th>Käufer · Auftrag</th>
              <th>Betrag</th>
              <th>Confirmed</th>
              <th>Verfall</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {lcs.map(lc => (
              <tr key={lc.id}>
                <td><span className="mono">{lc.id}</span></td>
                <td>
                  <div>{lc.bank}</div>
                  <div className="sub">{lc.type}</div>
                </td>
                <td>
                  <div>{buyerName(lc.buyer)}</div>
                  <div className="sub mono">{lc.order}</div>
                </td>
                <td><strong>{fmtCur(lc.amount)}</strong></td>
                <td>
                  {lc.confirmed
                    ? <Badge kind="success">Confirmed</Badge>
                    : <Badge kind="neutral">Unconfirmed</Badge>}
                </td>
                <td>{lc.expiry === '—' ? '—' : fmtDate(lc.expiry)}</td>
                <td><Badge kind={statusKind[lc.status] ?? 'neutral'}>{lc.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Payment Plan */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Ic name="task" size={14} /> Zahlungsplan · ORD-2026-0144</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {paymentSteps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < paymentSteps.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: step.status === 'done' ? 'var(--success)' : step.status === 'pending' ? 'var(--warning)' : 'var(--surface-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{step.label}</div>
                  <div className="sub">{step.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{fmtCur(step.amount)}</div>
                  <div className="sub">{step.pct}%</div>
                </div>
                {step.status === 'done' && <Ic name="quality" size={16} color="var(--success)" />}
                {step.status === 'pending' && <Ic name="clock" size={16} color="var(--warning)" />}
                {step.status === 'upcoming' && <Ic name="clock" size={16} color="var(--text-muted)" />}
              </div>
            ))}
          </div>
        </div>

        {/* FX Hedging */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Ic name="activity" size={14} /> FX-Hedging</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Paar</th>
                <th>Kurs</th>
                <th>Gehedgt / Exposure</th>
                <th>Instrument</th>
                <th>Fälligkeit</th>
              </tr>
            </thead>
            <tbody>
              {fxPositions.map(fx => {
                const pct = fx.exposure > 0 ? Math.round((fx.hedged / fx.exposure) * 100) : 0;
                return (
                  <tr key={fx.pair}>
                    <td><strong>{fx.pair}</strong></td>
                    <td className="mono">{fx.rate.toLocaleString('de-DE', { maximumFractionDigits: 4 })}</td>
                    <td>
                      <div style={{ fontSize: 11, marginBottom: 4 }}>{fmtCur(fx.hedged)} / {fmtCur(fx.exposure)}</div>
                      <div style={{ background: 'var(--border)', borderRadius: 4, height: 6, width: 120 }}>
                        <div style={{ background: pct >= 80 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)', borderRadius: 4, height: 6, width: `${pct}%` }} />
                      </div>
                      <div style={{ fontSize: 10, marginTop: 2 }}>{pct}%</div>
                    </td>
                    <td>{fx.instrument}</td>
                    <td>{fx.maturity === '—' ? '—' : fmtDate(fx.maturity)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

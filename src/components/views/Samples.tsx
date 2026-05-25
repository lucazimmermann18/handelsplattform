'use client';

import React from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

interface SamplesViewProps { lang: Lang; }

const samples = [
  { id: 'SMP-2026-018', product: 'Macadamia Style 1L', buyer: 'BUY-019', qty: '500g', supplier: 'SUP-094', courier: 'DHL Express', tracking: 'JVGL0044188-228', sent: '2026-05-19', status: 'delivered', feedback: 'positiv · weitergehen' },
  { id: 'SMP-2026-017', product: 'Cashew Organic W320', buyer: 'BUY-002', qty: '1kg', supplier: 'SUP-024', courier: 'FedEx IP', tracking: 'FX-77821-114', sent: '2026-05-21', status: 'in_transit', feedback: '—' },
  { id: 'SMP-2026-016', product: 'Specialty Arabica Karongi', buyer: 'BUY-007', qty: '300g', supplier: 'SUP-101', courier: 'DHL Express', tracking: 'JVGL0044188-198', sent: '2026-05-15', status: 'delivered', feedback: 'Cup 87 · akzeptiert' },
  { id: 'SMP-2026-015', product: 'Sesame Organic Hulled', buyer: 'BUY-052', qty: '750g', supplier: 'SUP-052', courier: 'TNT', tracking: 'GE-44871-002', sent: '2026-05-12', status: 'feedback_pending', feedback: 'erwartet' },
  { id: 'SMP-2026-013', product: 'Brown Sugar Demerara', buyer: 'BUY-023', qty: '2kg', supplier: 'SUP-061', courier: 'DHL Economy', tracking: 'EX-1124-882', sent: '2026-05-08', status: 'rejected', feedback: 'Polarisation zu niedrig' },
  { id: 'SMP-2026-012', product: 'Cloves Premium', buyer: 'BUY-011', qty: '250g', supplier: 'SUP-040', courier: 'DHL Express', tracking: 'JVGL0044188-101', sent: '2026-05-03', status: 'delivered', feedback: 'akzeptiert · Auftrag erteilt' },
];

const statusKind: Record<string, string> = {
  delivered: 'success',
  in_transit: 'ocean',
  feedback_pending: 'warning',
  rejected: 'danger',
};

const statusLabel: Record<string, string> = {
  delivered: 'Geliefert',
  in_transit: 'Unterwegs',
  feedback_pending: 'Feedback offen',
  rejected: 'Abgelehnt',
};

export const SamplesView = ({ lang }: SamplesViewProps) => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const buyerName = (id: string) => M.buyers.find(b => b.id === id)?.name ?? id;

  const total = samples.length;
  const inTransit = samples.filter(s => s.status === 'in_transit').length;
  const feedbackPending = samples.filter(s => s.status === 'feedback_pending').length;
  const accepted = samples.filter(s => s.feedback.toLowerCase().includes('akzeptiert')).length;
  const rejected = samples.filter(s => s.status === 'rejected').length;

  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h1 className="view-title">Musterverwaltung</h1>
          <p className="view-sub">Versendete Warenproben · Status · Feedback</p>
        </div>
        <button className="btn-primary"><Ic name="plus" size={14} /> Muster erfassen</button>
      </div>

      {/* KPI Tiles */}
      <div className="kpi-row">
        <div className="kpi-tile">
          <div className="kpi-icon"><Ic name="box" size={18} /></div>
          <div className="kpi-val">{total}</div>
          <div className="kpi-lbl">Gesendet</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-icon"><Ic name="ship" size={18} /></div>
          <div className="kpi-val">{inTransit}</div>
          <div className="kpi-lbl">Auf dem Weg</div>
        </div>
        <div className="kpi-tile warn">
          <div className="kpi-icon"><Ic name="clock" size={18} /></div>
          <div className="kpi-val">{feedbackPending}</div>
          <div className="kpi-lbl">Feedback offen</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-icon"><Ic name="quality" size={18} /></div>
          <div className="kpi-val">{accepted}</div>
          <div className="kpi-lbl">Akzeptiert</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-icon"><Ic name="danger" size={18} /></div>
          <div className="kpi-val">{rejected}</div>
          <div className="kpi-lbl">Abgelehnt</div>
        </div>
      </div>

      {/* Samples Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><Ic name="pkg" size={14} /> Alle Muster</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Sample-ID</th>
              <th>Produkt</th>
              <th>Menge</th>
              <th>Käufer</th>
              <th>Versand</th>
              <th>Tracking</th>
              <th>Status</th>
              <th>Feedback</th>
            </tr>
          </thead>
          <tbody>
            {samples.map(s => (
              <tr key={s.id}>
                <td><span className="mono">{s.id}</span></td>
                <td>
                  <div style={{ fontWeight: 500 }}>{s.product}</div>
                </td>
                <td>{s.qty}</td>
                <td>
                  <div style={{ fontSize: 13 }}>{buyerName(s.buyer)}</div>
                  <div className="sub mono">{s.buyer}</div>
                </td>
                <td>
                  <div>{fmtDate(s.sent)}</div>
                  <div className="sub">{s.courier}</div>
                </td>
                <td><span className="mono" style={{ fontSize: 11 }}>{s.tracking}</span></td>
                <td>
                  <Badge kind={statusKind[s.status] ?? 'neutral'}>{statusLabel[s.status] ?? s.status}</Badge>
                </td>
                <td>
                  <span style={{
                    fontSize: 12,
                    color: s.feedback.toLowerCase().includes('akzeptiert') ? 'var(--success)'
                      : s.feedback === '—' ? 'var(--text-muted)'
                      : s.status === 'rejected' ? 'var(--danger)'
                      : 'var(--text)',
                  }}>
                    {s.feedback}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge, Stars } from '@/components/ui/primitives';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { ConfirmDelete } from '@/components/ui/ConfirmDelete';
import type { SupplierMaster } from './types';
import { calcTrustScore, DOC_LEVEL_MAP, TRUST_LEVEL_MAP, EUDR_STATUS_MAP } from './types';

interface SuppliersListProps { lang: Lang; onOpen: (id: string) => void; }

export const SuppliersList = ({ lang, onOpen }: SuppliersListProps) => {
  const { data: M } = useData();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const withMaster = M.suppliers.map(s => {
    const master: SupplierMaster = (s as unknown as { supplier_master?: SupplierMaster }).supplier_master ?? {};
    return { ...s, master, trustScore: calcTrustScore(master) };
  });

  const kpis = [
    { l: 'Aktiv',          v: M.suppliers.filter(s => s.status === 'aktiv').length,       c: '#34d399' },
    { l: 'GPS verifiziert', v: withMaster.filter(s => s.master.gpsVerified).length,        c: '#60a5fa' },
    { l: 'EUDR-konform',   v: withMaster.filter(s => s.master.eudrStatus === 'konform').length, c: '#a78bfa' },
    { l: 'Tier A',         v: M.suppliers.filter(s => s.tier === 'A').length,              c: '#fbbf24' },
    { l: 'Hochrisiko',     v: M.suppliers.filter(s => s.risk === 'hoch').length,           c: '#f87171' },
  ];

  const handleExport = () => {
    const headers = ['ID','Name','Typ','Land','Region','Trust-Score','EUDR','Doc-Level','Status'];
    const rows = withMaster.map(s => [
      s.id, s.name, s.type, s.country, s.region, s.trustScore,
      s.master.eudrStatus ?? '—', s.master.docLevel ?? '—', s.status,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `lieferanten-${new Date().toISOString().slice(0,10)}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <div>
        <div className="section-head">
          <h1>{t(lang, 'nav_suppliers')}</h1>
          <div className="sub">
            {M.suppliers.length} Lieferanten · {new Set(M.suppliers.map(s => s.country)).size} Länder ·{' '}
            {withMaster.filter(s => s.master.gpsVerified).length} GPS-verifiziert
          </div>
          <div className="right">
            <button className="btn" onClick={handleExport}><Ic name="download" size={13} /> Export</button>
            <button className="btn primary" onClick={() => window.dispatchEvent(new CustomEvent('open-supplier-wizard'))}>
              <Ic name="plus" size={13} /> Neuer Lieferant
            </button>
          </div>
        </div>

        <div style={{ padding: '0 16px 12px' }}>
          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
            {kpis.map((k, i) => (
              <div key={i} className="tile kacheln" style={{ padding: 9 }}>
                <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase' }}>{k.l}</div>
                <div className="mono fw600" style={{ fontSize: 18, color: k.c, marginTop: 2 }}>{k.v}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Lieferant</th>
                  <th>Typ · Standort</th>
                  <th>Trust</th>
                  <th>Vertrauen</th>
                  <th>EUDR</th>
                  <th>Dok.-Level</th>
                  <th>Score</th>
                  <th>Letzte Lieferung</th>
                  <th>Risiko</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {withMaster.map(s => {
                  const tl = s.master.trustLevel;
                  const es = s.master.eudrStatus;
                  const dl = s.master.docLevel;
                  const trustInfo = tl ? TRUST_LEVEL_MAP[tl] : null;
                  const eudrInfo  = es ? EUDR_STATUS_MAP[es] : null;
                  const docInfo   = dl ? DOC_LEVEL_MAP[dl]   : null;
                  const scoreColor = s.trustScore >= 70 ? '#34d399' : s.trustScore >= 40 ? '#fbbf24' : '#f87171';

                  return (
                    <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => onOpen(s.id)}>
                      <td>
                        <div className="fw500">{s.name}</div>
                        <div className="tx3 mono" style={{ fontSize: 10 }}>{s.id} · {s.contact}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>{s.type}</div>
                        <div className="tx3" style={{ fontSize: 10.5 }}>{s.region}, {s.country}</div>
                      </td>
                      <td>
                        <span className="mono fw700" style={{ fontSize: 13, color: scoreColor }}>{s.trustScore}</span>
                        <span className="tx3" style={{ fontSize: 9, marginLeft: 2 }}>/100</span>
                      </td>
                      <td>
                        {trustInfo
                          ? <Badge kind={trustInfo.kind}>{trustInfo.label.split(' ')[0]}</Badge>
                          : <span className="tx3" style={{ fontSize: 11 }}>—</span>}
                      </td>
                      <td>
                        {eudrInfo
                          ? <Badge kind={eudrInfo.kind}>{eudrInfo.label}</Badge>
                          : <span className="tx3" style={{ fontSize: 11 }}>—</span>}
                      </td>
                      <td>
                        {docInfo
                          ? <Badge kind={docInfo.kind}>Level {dl}</Badge>
                          : <span className="tx3" style={{ fontSize: 11 }}>—</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Stars value={Math.round(s.score)} />
                          <span className="mono tx3" style={{ fontSize: 10 }}>{s.score.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="mono tx2" style={{ fontSize: 11 }}>{fmtDate(s.lastDelivery)}</td>
                      <td>
                        <Badge kind={s.risk === 'niedrig' ? 'success' : s.risk === 'mittel' ? 'warning' : 'danger'} dot>
                          {s.risk}
                        </Badge>
                      </td>
                      <td>
                        <Badge kind={s.status === 'aktiv' ? 'success' : 'neutral'} dot>{s.status}</Badge>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <ActionMenu onEdit={() => onOpen(s.id)} onDelete={() => setDeleteId(s.id)} editLabel="Details öffnen" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {deleteId && (() => {
        const s = M.suppliers.find(x => x.id === deleteId);
        return s ? (
          <ConfirmDelete label={`Lieferant '${s.name}'`} table="suppliers" id={deleteId} onClose={() => setDeleteId(null)} onDeleted={() => setDeleteId(null)} />
        ) : null;
      })()}
    </>
  );
};

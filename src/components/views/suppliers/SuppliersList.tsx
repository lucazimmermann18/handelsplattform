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
import { calcTrustScore, DOC_LEVEL_MAP, TRUST_LEVEL_MAP, EUDR_STATUS_MAP, EXPORT_READINESS_STAGES, READINESS_MAP, DEFAULT_ONBOARDING_ITEMS } from './types';

interface SuppliersListProps { lang: Lang; onOpen: (id: string) => void; }

type ViewMode = 'table' | 'pipeline';

export const SuppliersList = ({ lang, onOpen }: SuppliersListProps) => {
  const { data: M } = useData();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const withMaster = M.suppliers.map(s => {
    const master: SupplierMaster = (s as unknown as { supplier_master?: SupplierMaster }).supplier_master ?? {};
    const onbItems = DEFAULT_ONBOARDING_ITEMS.map(def => {
      const found = (master.onboardingItems ?? []).find(x => x.id === def.id);
      return found ?? { ...def, done: false };
    });
    const onbDone = onbItems.filter(i => i.done).length;
    const onbTotal = onbItems.length;
    return { ...s, master, trustScore: calcTrustScore(master), onbDone, onbTotal };
  });

  const filtered = withMaster.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.type.toLowerCase().includes(search.toLowerCase()) ||
    s.country.toLowerCase().includes(search.toLowerCase())
  );

  const kpis = [
    { l: 'Aktiv',           v: M.suppliers.filter(s => s.status === 'aktiv').length,       c: '#34d399' },
    { l: 'GPS verifiziert', v: withMaster.filter(s => s.master.gpsVerified).length,         c: '#60a5fa' },
    { l: 'EUDR-konform',    v: withMaster.filter(s => s.master.eudrStatus === 'konform').length, c: '#a78bfa' },
    { l: 'Exportfähig+',    v: withMaster.filter(s => ['deal_ready','fully_ready','strategic'].includes(s.master.exportReadiness ?? '')).length, c: '#fbbf24' },
    { l: 'Hochrisiko',      v: M.suppliers.filter(s => s.risk === 'hoch').length,           c: '#f87171' },
  ];

  const handleExport = () => {
    const headers = ['ID','Name','Typ','Land','Region','Trust-Score','Exportfähigkeit','EUDR','Doc-Level','Status'];
    const rows = withMaster.map(s => [
      s.id, s.name, s.type, s.country, s.region, s.trustScore,
      s.master.exportReadiness ?? '—', s.master.eudrStatus ?? '—',
      s.master.docLevel ?? '—', s.status,
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
            {/* View toggle */}
            <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              {(['table','pipeline'] as ViewMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  style={{
                    padding: '5px 12px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
                    background: viewMode === m ? 'rgba(96,165,250,0.15)' : 'transparent',
                    color: viewMode === m ? '#60a5fa' : 'var(--text-3)',
                    fontWeight: viewMode === m ? 600 : 400,
                  }}
                >
                  {m === 'table' ? '≡ Tabelle' : '⬛ Pipeline'}
                </button>
              ))}
            </div>
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

          {/* Search */}
          <div style={{ marginBottom: 10, display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
              <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <Ic name="search" size={13} color="var(--text-3)" />
              </span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Suche nach Name, Typ, Land…"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 12.5, padding: '6px 10px 6px 30px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* ── TABLE VIEW ───────────────────────────────────────────────────── */}
          {viewMode === 'table' && (
            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Lieferant</th>
                    <th>Typ · Standort</th>
                    <th>Trust</th>
                    <th>Exportfähigkeit</th>
                    <th>EUDR</th>
                    <th>Onboarding</th>
                    <th>Score</th>
                    <th>Letzte Lieferung</th>
                    <th>Risiko</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const es  = s.master.eudrStatus;
                    const er  = s.master.exportReadiness;
                    const eudrInfo     = es ? EUDR_STATUS_MAP[es] : null;
                    const readinessInfo = er ? READINESS_MAP[er] : null;
                    const scoreColor = s.trustScore >= 70 ? '#34d399' : s.trustScore >= 40 ? '#fbbf24' : '#f87171';
                    const onbPct = Math.round((s.onbDone / s.onbTotal) * 100);

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
                          {readinessInfo
                            ? <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 10.5, fontWeight: 600, color: readinessInfo.color, background: `${readinessInfo.color}15`, border: `1px solid ${readinessInfo.color}25`, whiteSpace: 'nowrap' }}>
                                {readinessInfo.label}
                              </span>
                            : <span className="tx3" style={{ fontSize: 11 }}>—</span>}
                        </td>
                        <td>
                          {eudrInfo
                            ? <Badge kind={eudrInfo.kind}>{eudrInfo.label}</Badge>
                            : <span className="tx3" style={{ fontSize: 11 }}>—</span>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 50, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                              <div style={{ width: `${onbPct}%`, height: '100%', background: onbPct === 100 ? '#34d399' : onbPct >= 60 ? '#fbbf24' : '#60a5fa', borderRadius: 2 }} />
                            </div>
                            <span className="mono tx3" style={{ fontSize: 10 }}>{onbPct}%</span>
                          </div>
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
                        <td onClick={e => e.stopPropagation()}>
                          <ActionMenu onEdit={() => onOpen(s.id)} onDelete={() => setDeleteId(s.id)} editLabel="Details öffnen" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── PIPELINE VIEW ────────────────────────────────────────────────── */}
          {viewMode === 'pipeline' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
              {EXPORT_READINESS_STAGES.map(stage => {
                const stageSuppliers = filtered.filter(s => (s.master.exportReadiness ?? 'not_ready') === stage.key);
                return (
                  <div key={stage.key}>
                    {/* Column header */}
                    <div style={{
                      padding: '8px 10px 10px',
                      borderRadius: '8px 8px 0 0',
                      background: `${stage.color}10`,
                      border: `1px solid ${stage.color}25`,
                      borderBottom: `2px solid ${stage.color}60`,
                      marginBottom: 6,
                    }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: stage.color, marginBottom: 2 }}>
                        {stage.shortLabel}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
                        {stageSuppliers.length} Lieferant{stageSuppliers.length !== 1 ? 'en' : ''}
                      </div>
                    </div>

                    {/* Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {stageSuppliers.length === 0 ? (
                        <div style={{ padding: '14px 10px', textAlign: 'center', fontSize: 11, color: 'var(--text-4)', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 7 }}>
                          Keine
                        </div>
                      ) : stageSuppliers.map(s => {
                        const scoreColor = s.trustScore >= 70 ? '#34d399' : s.trustScore >= 40 ? '#fbbf24' : '#f87171';
                        const onbPct = Math.round((s.onbDone / s.onbTotal) * 100);
                        const tl = s.master.trustLevel;
                        const tlInfo = tl ? TRUST_LEVEL_MAP[tl] : null;
                        const dl = s.master.docLevel;
                        const dlInfo = dl ? DOC_LEVEL_MAP[dl] : null;
                        return (
                          <div
                            key={s.id}
                            onClick={() => onOpen(s.id)}
                            style={{
                              padding: '10px 11px', borderRadius: 7, cursor: 'pointer',
                              background: 'var(--surface-2)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              transition: 'border-color 0.15s, transform 0.1s',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${stage.color}50`; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
                          >
                            {/* Name + tier */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4, marginBottom: 5 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, flex: 1 }}>{s.name}</div>
                              <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: `${s.tier === 'A' ? '#fbbf24' : s.tier === 'B' ? '#60a5fa' : '#94a3b8'}20`, color: s.tier === 'A' ? '#fbbf24' : s.tier === 'B' ? '#60a5fa' : '#94a3b8', flexShrink: 0 }}>
                                {s.tier}
                              </span>
                            </div>

                            {/* Type + country */}
                            <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 7, lineHeight: 1.3 }}>
                              {s.type} · {s.country}
                            </div>

                            {/* Trust score */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                              <span style={{ fontSize: 11, fontFamily: 'Geist Mono', fontWeight: 700, color: scoreColor }}>{s.trustScore}</span>
                              <span style={{ fontSize: 9, color: 'var(--text-4)' }}>Trust</span>
                              {tlInfo && <Badge kind={tlInfo.kind}>{tlInfo.label.split(' ')[0]}</Badge>}
                            </div>

                            {/* Onboarding progress */}
                            <div style={{ marginBottom: 5 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ fontSize: 9.5, color: 'var(--text-4)' }}>Onboarding</span>
                                <span style={{ fontSize: 9.5, fontFamily: 'Geist Mono', color: onbPct === 100 ? '#34d399' : 'var(--text-3)' }}>{onbPct}%</span>
                              </div>
                              <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                                <div style={{ width: `${onbPct}%`, height: '100%', background: onbPct === 100 ? '#34d399' : onbPct >= 60 ? '#fbbf24' : '#60a5fa', borderRadius: 2 }} />
                              </div>
                            </div>

                            {/* Doc level badge */}
                            {dlInfo && (
                              <div style={{ marginTop: 4 }}>
                                <Badge kind={dlInfo.kind}>Level {dl}</Badge>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

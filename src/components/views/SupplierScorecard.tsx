'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/lib/data-context';
import { t } from '@/lib/i18n';
import { Ic } from '@/components/ui/icons';
import type { Lang } from '@/lib/i18n';

interface Props { lang: Lang; }

type ViewMode = 'table' | 'cards';
type TierFilter = 'all' | 'A' | 'B' | 'C';
type PeriodFilter = 'all' | '90d' | '6m';

interface SupplierKPIs {
  supplierId: string;
  supplierName: string;
  tier: string;
  country: string;
  lastDelivery: string;
  totalOrders: number;
  completed: number;
  onTime: number;
  otif: number | null;
  qualScore: number | null;
  complaintRate: number | null;
  avgCycleDays: number | null;
  overall: number;
}

function scoreColor(v: number | null): string {
  if (v === null) return 'var(--text-4)';
  if (v >= 90) return '#34d399';
  if (v >= 70) return '#fbbf24';
  return '#f87171';
}

export const SupplierScorecardView = ({ lang }: Props) => {
  const { data: M } = useData();
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const kpis = useMemo((): SupplierKPIs[] => {
    if (!M) return [];
    const now = Date.now();
    const cutoff = periodFilter === '90d' ? now - 90 * 86400000 :
                   periodFilter === '6m'  ? now - 180 * 86400000 : 0;

    return M.suppliers.map(sup => {
      const myOrders = M.orders.filter(o => {
        if (o.supplierId !== sup.id) return false;
        if (cutoff > 0) {
          const ts = new Date(o.created).getTime();
          if (isNaN(ts) || ts < cutoff) return false;
        }
        return true;
      });
      const completed = myOrders.filter(o => ['done', 'paid'].includes(o.statusKey ?? o.status ?? ''));
      const onTime = completed.filter(o => !o.problem);
      const otif = completed.length > 0 ? Math.round((onTime.length / completed.length) * 100) : null;

      const supQCs = M.quality.filter(qc =>
        qc.supplier?.toLowerCase() === sup.name?.toLowerCase()
      );
      const qualScore = supQCs.length > 0
        ? Math.round(supQCs.reduce((s, q) =>
            s + (q.grade === 'A' ? 95 : q.grade === 'B' ? 80 : q.grade === 'C' ? 65 : 50), 0
          ) / supQCs.length)
        : null;

      const complaints = completed.filter(o => o.problem).length;
      const complaintRate = completed.length > 0 ? Math.round((complaints / completed.length) * 100) : null;

      const cycleTimes: number[] = completed
        .map(o => {
          const diff = (new Date(o.eta).getTime() - new Date(o.created).getTime()) / 86400000;
          return isNaN(diff) ? null : diff;
        })
        .filter((d): d is number => d !== null);
      const avgCycleDays = cycleTimes.length > 0
        ? Math.round(cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length)
        : null;

      const overall = otif !== null && qualScore !== null && complaintRate !== null
        ? Math.round(otif * 0.4 + qualScore * 0.4 + (100 - complaintRate) * 0.2)
        : otif ?? qualScore ?? 0;

      return {
        supplierId: sup.id,
        supplierName: sup.name,
        tier: sup.tier ?? '—',
        country: sup.country ?? '—',
        lastDelivery: sup.lastDelivery ?? '—',
        totalOrders: myOrders.length,
        completed: completed.length,
        onTime: onTime.length,
        otif,
        qualScore,
        complaintRate,
        avgCycleDays,
        overall,
      };
    });
  }, [M, periodFilter]);

  const filtered = useMemo(() =>
    tierFilter === 'all' ? kpis : kpis.filter(k => k.tier === tierFilter),
  [kpis, tierFilter]);

  const fleetOtif = useMemo(() => {
    const withData = filtered.filter(k => k.otif !== null);
    return withData.length > 0
      ? Math.round(withData.reduce((s, k) => s + (k.otif ?? 0), 0) / withData.length)
      : null;
  }, [filtered]);

  const best  = useMemo(() => [...filtered].sort((a, b) => b.overall - a.overall)[0] ?? null, [filtered]);
  const worst = useMemo(() => [...filtered].filter(k => k.completed > 0).sort((a, b) => a.overall - b.overall)[0] ?? null, [filtered]);
  const totalCompleted = useMemo(() => filtered.reduce((s, k) => s + k.completed, 0), [filtered]);

  const selected = useMemo(() => filtered.find(k => k.supplierId === selectedId) ?? null, [filtered, selectedId]);
  const selectedOrders = useMemo(() => {
    if (!M || !selectedId) return [];
    return M.orders
      .filter(o => o.supplierId === selectedId)
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
      .slice(0, 5);
  }, [M, selectedId]);

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const otifBadge = (v: number | null) => (
    <span style={{ background: scoreColor(v) + '22', color: scoreColor(v), borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
      {v !== null ? `${v}%` : '—'}
    </span>
  );

  const scoreBadge = (v: number) => (
    <span style={{ background: scoreColor(v) + '22', color: scoreColor(v), borderRadius: 20, padding: '3px 10px', fontSize: 13, fontWeight: 700 }}>
      {v}
    </span>
  );

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {/* Header */}
        <div className="section-head">
          <div>
            <h1 style={{ margin: 0 }}>{t(lang, 'ss_title')}</h1>
            <div className="sub">{t(lang, 'ss_subtitle')}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
            {/* Period filter */}
            <select
              value={periodFilter}
              onChange={e => setPeriodFilter(e.target.value as PeriodFilter)}
              style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '4px 8px', fontSize: 12 }}
            >
              <option value="all">{t(lang, 'ss_period_all')}</option>
              <option value="90d">{t(lang, 'ss_period_90d')}</option>
              <option value="6m">{t(lang, 'ss_period_6m')}</option>
            </select>
            {/* Tier filter */}
            <select
              value={tierFilter}
              onChange={e => setTierFilter(e.target.value as TierFilter)}
              style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '4px 8px', fontSize: 12 }}
            >
              <option value="all">{t(lang, 'ss_period_all')} Tiers</option>
              <option value="A">Tier A</option>
              <option value="B">Tier B</option>
              <option value="C">Tier C</option>
            </select>
            {/* View toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
              {(['table', 'cards'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  style={{ background: viewMode === m ? 'var(--surface-2)' : 'transparent', border: 'none', color: viewMode === m ? 'var(--text)' : 'var(--text-3)', padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}
                >
                  <Ic name={m === 'table' ? 'layers' : 'dashboard'} size={13} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary tiles */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{t(lang, 'ss_fleet_otif')}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: scoreColor(fleetOtif) }}>{fleetOtif !== null ? `${fleetOtif}%` : '—'}</div>
          </div>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{t(lang, 'ss_best_supplier')}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#34d399' }}>{best?.supplierName ?? '—'}</div>
            {best && <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Score: {best.overall}</div>}
          </div>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{t(lang, 'ss_critical_supplier')}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f87171' }}>{worst?.supplierName ?? '—'}</div>
            {worst && <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Score: {worst.overall}</div>}
          </div>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{t(lang, 'ss_total_deliveries')}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{totalCompleted}</div>
          </div>
        </div>

        {/* Table view */}
        {viewMode === 'table' && (
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {[
                    t(lang, 'ss_col_supplier'), t(lang, 'ss_col_tier'), t(lang, 'ss_col_country'),
                    t(lang, 'ss_col_orders'), t(lang, 'ss_col_completed'),
                    t(lang, 'ss_col_otif'), t(lang, 'ss_col_quality'),
                    t(lang, 'ss_col_complaints'), t(lang, 'ss_col_cycle'), t(lang, 'ss_col_score')
                  ].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(k => (
                  <tr
                    key={k.supplierId}
                    onClick={() => setSelectedId(selectedId === k.supplierId ? null : k.supplierId)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: selectedId === k.supplierId ? 'var(--surface-2)' : 'transparent' }}
                  >
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{k.supplierName}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: k.tier === 'A' ? '#34d39922' : k.tier === 'B' ? '#fbbf2422' : '#f8717122', color: k.tier === 'A' ? '#34d399' : k.tier === 'B' ? '#fbbf24' : '#f87171', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{k.tier}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-2)' }}>{k.country}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-2)' }}>{k.totalOrders}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-2)' }}>{k.completed}</td>
                    <td style={{ padding: '10px 12px' }}>{otifBadge(k.otif)}</td>
                    <td style={{ padding: '10px 12px' }}>{otifBadge(k.qualScore)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: k.complaintRate !== null && k.complaintRate > 10 ? '#f87171' : 'var(--text-2)' }}>
                        {k.complaintRate !== null ? `${k.complaintRate}%` : '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-2)' }}>
                      {k.avgCycleDays !== null ? `${k.avgCycleDays}d` : '—'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>{scoreBadge(k.overall)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={10} style={{ padding: 32, textAlign: 'center', color: 'var(--text-4)' }}>{t(lang, 'ss_no_data')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Cards view */}
        {viewMode === 'cards' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {filtered.map(k => (
              <div
                key={k.supplierId}
                onClick={() => setSelectedId(selectedId === k.supplierId ? null : k.supplierId)}
                style={{ background: 'var(--bg-2)', border: `1px solid ${selectedId === k.supplierId ? scoreColor(k.overall) : 'var(--border)'}`, borderRadius: 10, padding: 16, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{k.supplierName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{k.country}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ background: k.tier === 'A' ? '#34d39922' : k.tier === 'B' ? '#fbbf2422' : '#f8717122', color: k.tier === 'A' ? '#34d399' : k.tier === 'B' ? '#fbbf24' : '#f87171', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{k.tier}</span>
                    {scoreBadge(k.overall)}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[
                    { label: t(lang, 'ss_otif_label'), value: k.otif !== null ? `${k.otif}%` : '—', color: scoreColor(k.otif) },
                    { label: t(lang, 'ss_quality_label'), value: k.qualScore !== null ? `${k.qualScore}%` : '—', color: scoreColor(k.qualScore) },
                    { label: t(lang, 'ss_complaint_label'), value: k.complaintRate !== null ? `${k.complaintRate}%` : '—', color: k.complaintRate !== null && k.complaintRate > 10 ? '#f87171' : 'var(--text-2)' },
                    { label: t(lang, 'ss_cycle_label'), value: k.avgCycleDays !== null ? `${k.avgCycleDays}d` : '—', color: 'var(--text-2)' },
                  ].map(kpi => (
                    <div key={kpi.label} style={{ background: 'var(--bg)', borderRadius: 6, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-4)', marginBottom: 2 }}>{kpi.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
                    </div>
                  ))}
                </div>
                {/* Score bar */}
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${k.overall}%`, height: '100%', background: scoreColor(k.overall), borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>{k.completed} {t(lang, 'ss_col_completed')} · {k.totalOrders} {t(lang, 'ss_col_orders')}</div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', color: 'var(--text-4)' }}>{t(lang, 'ss_no_data')}</div>
            )}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{ width: 340, borderLeft: '1px solid var(--border)', background: 'var(--bg-2)', overflowY: 'auto', padding: 20, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{t(lang, 'ss_detail_title')}</div>
            <button onClick={() => setSelectedId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 16 }}>✕</button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{selected.supplierName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{selected.country} · Tier {selected.tier}</div>
            {selected.lastDelivery !== '—' && (
              <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>Letzte Lieferung: {selected.lastDelivery}</div>
            )}
          </div>

          {/* KPI grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'OTIF', value: selected.otif !== null ? `${selected.otif}%` : '—', color: scoreColor(selected.otif) },
              { label: t(lang, 'ss_quality_label'), value: selected.qualScore !== null ? `${selected.qualScore}%` : '—', color: scoreColor(selected.qualScore) },
              { label: t(lang, 'ss_complaint_label'), value: selected.complaintRate !== null ? `${selected.complaintRate}%` : '—', color: selected.complaintRate !== null && selected.complaintRate > 10 ? '#f87171' : 'var(--text-2)' },
              { label: t(lang, 'ss_cycle_label'), value: selected.avgCycleDays !== null ? `${selected.avgCycleDays}d` : '—', color: 'var(--text-2)' },
            ].map(kpi => (
              <div key={kpi.label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-4)', marginBottom: 4 }}>{kpi.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Overall score bar */}
          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Overall Score</span>
              <span style={{ fontWeight: 700, color: scoreColor(selected.overall) }}>{selected.overall}</span>
            </div>
            <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${selected.overall}%`, height: '100%', background: scoreColor(selected.overall), borderRadius: 3 }} />
            </div>
          </div>

          {/* Last 5 orders */}
          {selectedOrders.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t(lang, 'ss_last_orders')}</div>
              {selectedOrders.map(o => (
                <div key={o.id} style={{ background: 'var(--bg)', borderRadius: 6, padding: '8px 10px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{o.id}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-4)' }}>ETA: {o.eta ?? '—'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{o.statusKey ?? o.status}</span>
                    {o.problem && <Ic name="warn" size={13} color="#f87171" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

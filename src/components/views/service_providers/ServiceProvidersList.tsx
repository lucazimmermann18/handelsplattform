'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/lib/data-context';
import { Badge } from '@/components/ui/primitives';
import { Ic } from '@/components/ui/icons';
import { GenericEditModal, type FieldDef } from '@/components/ui/GenericEditModal';
import { ConfirmDelete } from '@/components/ui/ConfirmDelete';
import { ActionMenu } from '@/components/ui/ActionMenu';
import type { ServiceProvider } from '@/lib/types';
import type { ProviderMaster } from './types';
import { PROVIDER_CATEGORIES, STATUS_MAP, RISK_MAP } from './types';

import { t } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';
interface Props { onSelect: (p: ServiceProvider) => void; lang: Lang; }

const Stars = ({ rating }: { rating: number }) => (
  <span>{Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ color: i < rating ? '#fbbf24' : '#3a4455', fontSize: 12 }}>★</span>
  ))}</span>
);

export const ServiceProvidersList = ({ onSelect, lang }: Props) => {
  const { data: M, refresh } = useData();
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [addOpen, setAddOpen]       = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);

  const providerFields: FieldDef[] = [
    { key: 'company_name',  label: t(lang, 'sp_company_name'),    type: 'text',   required: true, span: 2 },
    { key: 'display_name',  label: t(lang, 'sp_display_name'),    type: 'text',   span: 2 },
    { key: 'category',      label: t(lang, 'sp_col_category'),    type: 'select',
      options: PROVIDER_CATEGORIES.map(c => ({ value: c, label: c })) },
    { key: 'subcategory',   label: t(lang, 'sp_subcategory'),     type: 'text' },
    { key: 'country',       label: t(lang, 'sp_country'),         type: 'text' },
    { key: 'city',          label: t(lang, 'sp_city'),            type: 'text' },
    { key: 'status',        label: t(lang, 'status'),             type: 'select',
      options: Object.entries(STATUS_MAP).map(([v, i]) => ({ value: v, label: i.label })) },
    { key: 'risk_level',    label: t(lang, 'sp_risk_level_label'), type: 'select',
      options: [
        { value: 'niedrig', label: t(lang, 'cb_priority_l') }, { value: 'mittel', label: t(lang, 'cb_priority_m') },
        { value: 'hoch', label: t(lang, 'cb_priority_h') }, { value: 'kritisch', label: t(lang, 'cb_priority_k') },
      ] },
    { key: 'criticality',   label: t(lang, 'sp_criticality_label'), type: 'select',
      options: [
        { value: 'niedrig', label: t(lang, 'cb_priority_l') }, { value: 'mittel', label: t(lang, 'cb_priority_m') },
        { value: 'hoch', label: t(lang, 'cb_priority_h') }, { value: 'geschäftskritisch', label: lang === 'de' ? 'Geschäftskritisch' : 'Business critical' },
      ] },
    { key: 'website',       label: 'Website',                    type: 'text',   span: 2 },
    { key: 'notes',         label: t(lang, 'notes'),             type: 'textarea', span: 2 },
  ];

  const providers = M?.serviceProviders ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return providers.filter(p => {
      if (q && !p.companyName.toLowerCase().includes(q) && !(p.displayName ?? '').toLowerCase().includes(q) && !p.country.toLowerCase().includes(q)) return false;
      if (catFilter && p.category !== catFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (riskFilter && p.riskLevel !== riskFilter) return false;
      return true;
    });
  }, [providers, search, catFilter, statusFilter, riskFilter]);

  // KPIs
  const aktiv        = providers.filter(p => p.status === 'aktiv').length;
  const inPruefung   = providers.filter(p => p.status === 'in_pruefung').length;
  const hochrisiko   = providers.filter(p => p.riskLevel === 'hoch' || p.riskLevel === 'kritisch').length;
  const missingDocs  = providers.filter(p => {
    const m = (p.provider_master ?? {}) as ProviderMaster;
    return (m.documents ?? []).some(d => d.status === 'fehlt' || d.status === 'abgelaufen');
  }).length;
  const expiringContracts = providers.filter(p => {
    const m = (p.provider_master ?? {}) as ProviderMaster;
    return (m.contracts ?? []).some(c => {
      if (!c.endDate) return false;
      const days = Math.floor((new Date(c.endDate).getTime() - Date.now()) / 86400000);
      return days >= 0 && days < 60;
    });
  }).length;
  const notFreigegeben = providers.filter(p => p.status === 'lead' || p.status === 'angefragt' || p.status === 'in_pruefung').length;

  const kpis = [
    { l: t(lang, 'sp_col_provider'),       v: providers.length, c: 'var(--text-2)' },
    { l: t(lang, 'sp_aktiv'),              v: aktiv,            c: '#34d399' },
    { l: t(lang, 'sp_in_pruefung'),        v: inPruefung,       c: '#fbbf24' },
    { l: t(lang, 'sp_hochrisiko'),         v: hochrisiko,       c: '#f87171' },
    { l: t(lang, 'sp_docs_missing'),       v: missingDocs,      c: hochrisiko > 0 ? '#f87171' : '#fbbf24' },
    { l: t(lang, 'sp_contracts_expiring'), v: expiringContracts,c: expiringContracts > 0 ? '#fbbf24' : 'var(--text-3)' },
    { l: t(lang, 'sp_not_approved'),       v: notFreigegeben,   c: notFreigegeben > 0 ? '#fbbf24' : 'var(--text-3)' },
  ];

  // CSV export
  const exportCSV = () => {
    const headers = ['ID', t(lang, 'sp_company_name'), t(lang, 'sp_col_category'), t(lang, 'sp_country'), t(lang, 'sp_city'), t(lang, 'status'), t(lang, 'sp_risk_level_label'), t(lang, 'sp_criticality_label'), t(lang, 'sp_col_rating')];
    const rows = filtered.map(p => [
      p.id, p.companyName, p.category, p.country, p.city ?? '',
      p.status, p.riskLevel, p.criticality, p.overallRating ?? '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'dienstleister.csv'; a.click();
  };

  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'sp_heading')}</h1>
        <div className="sub">{t(lang, 'sp_heading_sub')}</div>
        <div className="right" style={{ display: 'flex', gap: 8 }}>
          <button className="btn ghost" onClick={exportCSV}><Ic name="upload" size={12} /> CSV</button>
          <button className="btn primary" onClick={() => setAddOpen(true)}>
            <Ic name="plus" size={13} /> {t(lang, 'sp_new_provider')}
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px 24px' }}>
        {/* KPI tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 12 }}>
          {kpis.map((k, i) => (
            <div key={i} className="card" style={{ padding: '12px 14px' }}>
              <div className="tx3" style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{k.l}</div>
              <div className="mono fw600" style={{ fontSize: 20, color: k.c }}>{k.v === 0 ? '—' : k.v}</div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <Ic name="search" size={13} color="var(--text-3)" />
            </span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t(lang, 'sp_search')}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 12.5, padding: '7px 10px 7px 32px', width: '100%', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 12.5, padding: '7px 10px', outline: 'none' }}>
            <option value="">{t(lang, 'sp_all_categories')}</option>
            {PROVIDER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 12.5, padding: '7px 10px', outline: 'none' }}>
            <option value="">{t(lang, 'sp_all_status')}</option>
            {Object.entries(STATUS_MAP).map(([v, i]) => <option key={v} value={v}>{i.label}</option>)}
          </select>
          <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 12.5, padding: '7px 10px', outline: 'none' }}>
            <option value="">{t(lang, 'sp_all_risks')}</option>
            {Object.entries(RISK_MAP).map(([v, i]) => <option key={v} value={v}>{i.label}</option>)}
          </select>
          {(search || catFilter || statusFilter || riskFilter) && (
            <button className="btn sm ghost" onClick={() => { setSearch(''); setCatFilter(''); setStatusFilter(''); setRiskFilter(''); }}>
              {t(lang, 'sp_reset_filter')}
            </button>
          )}
        </div>

        {/* Empty state */}
        {providers.length === 0 && (
          <div className="card">
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Ic name="building" size={36} color="var(--text-3)" />
              <div className="fw600" style={{ fontSize: 14, marginBottom: 6, marginTop: 12 }}>{t(lang, 'sp_empty_title')}</div>
              <div className="tx3" style={{ fontSize: 12, marginBottom: 16 }}>
                {t(lang, 'sp_empty_sub')}
              </div>
              <button className="btn primary" onClick={() => setAddOpen(true)}>
                <Ic name="plus" size={13} /> {t(lang, 'sp_add_first')}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {filtered.length > 0 && (
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {[t(lang,'sp_col_provider'), t(lang,'sp_col_category'), t(lang,'sp_col_location'), t(lang,'status'), t(lang,'sp_risk_level_label'), t(lang,'sp_criticality_label'), t(lang,'sp_col_contacts'), t(lang,'sp_col_rating'), t(lang,'sp_col_tasks'), t(lang,'sp_col_actions')].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const m = (p.provider_master ?? {}) as ProviderMaster;
                    const openTasks = (m.tasks ?? []).filter(t => t.status !== 'erledigt').length;
                    const si = STATUS_MAP[p.status as keyof typeof STATUS_MAP] ?? { label: p.status, kind: 'neutral' };
                    const ri = RISK_MAP[p.riskLevel as keyof typeof RISK_MAP] ?? { label: p.riskLevel, kind: 'neutral', color: '#94a3b8' };
                    const primaryContact = (m.contacts ?? []).find(c => c.isPrimary) ?? (m.contacts ?? [])[0];
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                        onClick={() => onSelect(p)}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{p.displayName || p.companyName}</div>
                          {p.subcategory && <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 1 }}>{p.subcategory}</div>}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <Badge>{p.category}</Badge>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                          {[p.city, p.country].filter(Boolean).join(', ') || '—'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <Badge kind={si.kind} dot>{si.label}</Badge>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <Badge kind={ri.kind}>{ri.label}</Badge>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{p.criticality}</span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {primaryContact ? (
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 500 }}>{primaryContact.name}</div>
                              <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{primaryContact.role}</div>
                            </div>
                          ) : <span style={{ color: 'var(--text-3)' }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {p.overallRating ? <Stars rating={Math.round(p.overallRating)} /> : <span style={{ color: 'var(--text-3)' }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {openTasks > 0
                            ? <Badge kind="warning">{openTasks}</Badge>
                            : <span style={{ color: 'var(--text-3)' }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 12px' }} onClick={e => e.stopPropagation()}>
                          <ActionMenu onEdit={() => setEditId(p.id)} onDelete={() => setDeleteId(p.id)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {filtered.length} {t(lang, 'sp_of')} {providers.length} {t(lang, 'sp_providers_label')}
            </div>
          </div>
        )}

        {providers.length > 0 && filtered.length === 0 && (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)' }}>
            {t(lang, 'sp_no_results')}
          </div>
        )}
      </div>

      {addOpen && (
        <GenericEditModal
          title={t(lang, 'sp_new_provider')}
          subtitle={t(lang, 'sp_heading')}
          record={{}}
          fields={providerFields}
          table="service_providers"
          onClose={() => setAddOpen(false)}
          onSaved={() => { setAddOpen(false); refresh(); }}
        />
      )}

      {editId && (() => {
        const p = providers.find(x => x.id === editId);
        if (!p) return null;
        return (
          <GenericEditModal
            title={t(lang, 'sp_edit_provider')}
            subtitle={p.displayName || p.companyName}
            record={p as unknown as Record<string, unknown>}
            fields={providerFields}
            table="service_providers"
            onClose={() => setEditId(null)}
            onSaved={() => { setEditId(null); refresh(); }}
          />
        );
      })()}

      {deleteId && (() => {
        const p = providers.find(x => x.id === deleteId);
        return p ? (
          <ConfirmDelete
            label={`${t(lang, 'sp_col_provider')} '${p.displayName || p.companyName}'`}
            table="service_providers"
            id={deleteId}
            onClose={() => setDeleteId(null)}
            onDeleted={() => { setDeleteId(null); refresh(); }}
          />
        ) : null;
      })()}
    </div>
  );
};

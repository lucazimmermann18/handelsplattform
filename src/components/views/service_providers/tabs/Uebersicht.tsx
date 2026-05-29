'use client';

import React from 'react';
import { Badge } from '@/components/ui/primitives';
import { Ic } from '@/components/ui/icons';
import { t } from '@/lib/i18n';
import { useLang } from '@/lib/lang-context';
import type { ServiceProvider } from '@/lib/types';
import type { ProviderMaster } from '../types';
import { STATUS_MAP, RISK_MAP, CRITICALITY_MAP } from '../types';

interface TabProps { provider: ServiceProvider; master: ProviderMaster; }

const Stars = ({ rating }: { rating: number }) => (
  <span>{Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ color: i < rating ? '#fbbf24' : '#3a4455', fontSize: 14 }}>★</span>
  ))}</span>
);

const InfoCard = ({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) => (
  <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <Ic name={icon} size={13} color="var(--text-3)" />
      <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
    </div>
    <div style={{ fontSize: 14, fontWeight: 700, color: color ?? 'var(--text)' }}>{value}</div>
  </div>
);

export const TabUebersicht = ({ provider, master }: TabProps) => {
  const lang = useLang();
  const statusInfo = STATUS_MAP[provider.status as keyof typeof STATUS_MAP] ?? { label: provider.status, kind: 'neutral' };
  const riskInfo = RISK_MAP[provider.riskLevel as keyof typeof RISK_MAP] ?? { label: provider.riskLevel, kind: 'neutral', color: '#94a3b8' };
  const critInfo = CRITICALITY_MAP[provider.criticality as keyof typeof CRITICALITY_MAP] ?? { label: provider.criticality, kind: 'neutral' };

  const openTasks = (master.tasks ?? []).filter(t => t.status !== 'erledigt').length;
  const missingDocs = (master.documents ?? []).filter(d => d.status === 'fehlt' || d.status === 'abgelaufen').length;
  const expiringContracts = (master.contracts ?? []).filter(c => {
    if (!c.endDate) return false;
    const days = Math.floor((new Date(c.endDate).getTime() - Date.now()) / 86400000);
    return days >= 0 && days < 60;
  }).length;
  const expiredContracts = (master.contracts ?? []).filter(c => c.endDate && new Date(c.endDate).getTime() < Date.now()).length;
  const primaryContact = (master.contacts ?? []).find(c => c.isPrimary) ?? (master.contacts ?? [])[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Status header */}
      <div style={{ padding: '16px', borderRadius: 10, background: `${riskInfo.color}0a`, border: `1px solid ${riskInfo.color}25`, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${riskInfo.color}18`, border: `2px solid ${riskInfo.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Ic name="building" size={22} color={riskInfo.color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{provider.displayName || provider.companyName}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {provider.category}{provider.subcategory ? ` · ${provider.subcategory}` : ''}
            {(provider.city || provider.country) && ` · ${[provider.city, provider.country].filter(Boolean).join(', ')}`}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          <Badge kind={statusInfo.kind} dot>{statusInfo.label}</Badge>
          <Badge kind={riskInfo.kind}>{t(lang, 'sp_risk_label')}{riskInfo.label}</Badge>
          <Badge kind={critInfo.kind}>{t(lang, 'sp_crit_label')}{critInfo.label}</Badge>
        </div>
      </div>

      {/* Alerts */}
      {(missingDocs > 0 || expiringContracts > 0 || expiredContracts > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {missingDocs > 0 && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', fontSize: 12.5, color: '#f87171', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ic name="alert" size={14} color="#f87171" />
              {missingDocs} {missingDocs > 1 ? t(lang, 'sp_uebersicht_doc_missing_multi') : t(lang, 'sp_uebersicht_doc_missing_one')}
            </div>
          )}
          {(expiringContracts > 0 || expiredContracts > 0) && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', fontSize: 12.5, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ic name="clock" size={14} color="#fbbf24" />
              {expiredContracts > 0 ? `${expiredContracts} ${expiredContracts > 1 ? t(lang, 'sp_uebersicht_contract_expired_multi') : t(lang, 'sp_uebersicht_contract_expired_one')}` : ''}
              {expiringContracts > 0 ? `${expiringContracts} ${expiringContracts > 1 ? t(lang, 'sp_uebersicht_contract_expiring_multi') : t(lang, 'sp_uebersicht_contract_expiring_one')}` : ''}
            </div>
          )}
        </div>
      )}

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <InfoCard icon="quality" label={t(lang, 'sp_kpi_rating')}
          value={master.overallRating ? `${master.overallRating.toFixed(1)} / 5` : '—'}
          color="#fbbf24" />
        <InfoCard icon="task" label={t(lang, 'sp_kpi_open_tasks')}
          value={String(openTasks)}
          color={openTasks > 0 ? '#fbbf24' : '#34d399'} />
        <InfoCard icon="doc" label={t(lang, 'sp_kpi_docs_missing')}
          value={String(missingDocs)}
          color={missingDocs > 0 ? '#f87171' : '#34d399'} />
        <InfoCard icon="layers" label={t(lang, 'sp_kpi_total_orders')}
          value={master.totalOrders ? String(master.totalOrders) : '—'}
          color="var(--text-2)" />
      </div>

      {/* Rating + primary contact */}
      <div style={{ display: 'grid', gridTemplateColumns: master.overallRating ? '1fr 1fr' : '1fr', gap: 12 }}>
        {master.overallRating && (
          <div className="card" style={{ padding: '14px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{t(lang, 'sp_uebersicht_rating_section')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Stars rating={Math.round(master.overallRating)} />
              <span style={{ fontWeight: 700, fontSize: 16, color: '#fbbf24' }}>{master.overallRating.toFixed(1)}</span>
            </div>
            {master.reliabilityScore && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>{t(lang, 'sp_reliability')}: {master.reliabilityScore} · {t(lang, 'sp_comm_score')}: {master.communicationScore ?? '—'}</div>
            )}
          </div>
        )}

        {primaryContact && (
          <div className="card" style={{ padding: '14px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{t(lang, 'sp_main_contact')}</div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{primaryContact.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 6 }}>{primaryContact.role}</div>
            {primaryContact.email && <div style={{ fontSize: 12, marginBottom: 2 }}>✉ {primaryContact.email}</div>}
            {primaryContact.phone && <div style={{ fontSize: 12, marginBottom: 2 }}>☎ {primaryContact.phone}</div>}
            {primaryContact.whatsapp && <div style={{ fontSize: 12 }}>📱 {primaryContact.whatsapp}</div>}
          </div>
        )}
      </div>

      {/* Process phases */}
      {(master.processPhases ?? []).length > 0 && (
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{t(lang, 'sp_process_phases')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {(master.processPhases ?? []).map(p => <Badge key={p} kind="info">{p}</Badge>)}
          </div>
        </div>
      )}

      {/* Open tasks preview */}
      {openTasks > 0 && (
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>{t(lang, 'sp_open_tasks_section')}</div>
          {(master.tasks ?? []).filter(t => t.status !== 'erledigt').slice(0, 3).map((task, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '8px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ width: 3, height: 28, borderRadius: 2, background: task.priority === 'hoch' ? '#f87171' : task.priority === 'mittel' ? '#fbbf24' : '#94a3b8', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{task.title}</div>
                {task.dueDate && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t(lang, 'sp_due_label')}{task.dueDate}</div>}
              </div>
            </div>
          ))}
          {openTasks > 3 && <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4 }}>+{openTasks - 3} {t(lang, 'sp_more_tasks')}</div>}
        </div>
      )}

      {/* Internal notes */}
      {master.internalNotes && (
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{t(lang, 'sp_internal_notes')}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6 }}>{master.internalNotes}</div>
        </div>
      )}

    </div>
  );
};

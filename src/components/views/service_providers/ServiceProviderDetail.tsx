'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Badge } from '@/components/ui/primitives';
import { Ic } from '@/components/ui/icons';
import { GenericEditModal, type FieldDef } from '@/components/ui/GenericEditModal';
import { ConfirmDelete } from '@/components/ui/ConfirmDelete';
import type { ServiceProvider } from '@/lib/types';
import type { ProviderMaster } from './types';
import { STATUS_MAP, RISK_MAP, PROVIDER_CATEGORIES } from './types';
import { TabUebersicht } from './tabs/Uebersicht';
import { TabStammdaten } from './tabs/Stammdaten';
import { TabLeistungen } from './tabs/Leistungen';
import { TabKontakte } from './tabs/Kontakte';
import { TabPreise } from './tabs/Preise';
import { TabVertraege } from './tabs/Vertraege';
import { TabDokumente } from './tabs/Dokumente';
import { TabRisiko } from './tabs/Risiko';
import { TabPerformance } from './tabs/Performance';
import { TabKommunikation } from './tabs/Kommunikation';
import { TabAufgaben } from './tabs/Aufgaben';

interface Props {
  provider: ServiceProvider;
  onBack: () => void;
  onDeleted: () => void;
}

type TabId = 'uebersicht' | 'stammdaten' | 'leistungen' | 'kontakte' | 'preise' | 'vertraege' | 'dokumente' | 'risiko' | 'performance' | 'komm' | 'aufgaben';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'uebersicht',  label: 'Übersicht',   icon: 'dashboard' },
  { id: 'stammdaten',  label: 'Stammdaten',  icon: 'building'  },
  { id: 'leistungen',  label: 'Leistungen',  icon: 'layers'    },
  { id: 'kontakte',    label: 'Kontakte',    icon: 'person'    },
  { id: 'preise',      label: 'Preise',      icon: 'finance'   },
  { id: 'vertraege',   label: 'Verträge',    icon: 'doc'       },
  { id: 'dokumente',   label: 'Dokumente',   icon: 'doc'       },
  { id: 'risiko',      label: 'Risiko',      icon: 'alert'     },
  { id: 'performance', label: 'Performance', icon: 'quality'   },
  { id: 'komm',        label: 'Kommunikation', icon: 'chat'    },
  { id: 'aufgaben',    label: 'Aufgaben',    icon: 'task'      },
];

export const ServiceProviderDetail = ({ provider, onBack, onDeleted }: Props) => {
  const { refresh } = useData();
  const [tab, setTab] = useState<TabId>('uebersicht');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const master = (provider.provider_master ?? {}) as unknown as ProviderMaster;
  const statusInfo = STATUS_MAP[provider.status as keyof typeof STATUS_MAP] ?? { label: provider.status, kind: 'neutral' };
  const riskInfo   = RISK_MAP[provider.riskLevel as keyof typeof RISK_MAP]   ?? { label: provider.riskLevel, kind: 'neutral', color: '#94a3b8' };

  const openTasks  = (master.tasks ?? []).filter(t => t.status !== 'erledigt').length;
  const missingDocs = (master.documents ?? []).filter(d => d.status === 'fehlt' || d.status === 'abgelaufen').length;

  const editFields: FieldDef[] = [
    { key: 'company_name',  label: 'Firmenname',    type: 'text',   required: true, span: 2 },
    { key: 'display_name',  label: 'Anzeigename',   type: 'text',   span: 2 },
    { key: 'category',      label: 'Kategorie',     type: 'select',
      options: PROVIDER_CATEGORIES.map(c => ({ value: c, label: c })) },
    { key: 'subcategory',   label: 'Unterkategorie', type: 'text' },
    { key: 'country',       label: 'Land',          type: 'text' },
    { key: 'city',          label: 'Stadt',         type: 'text' },
    { key: 'region',        label: 'Region',        type: 'text' },
    { key: 'website',       label: 'Website',       type: 'text' },
    { key: 'status',        label: 'Status',        type: 'select',
      options: Object.entries(STATUS_MAP).map(([v, i]) => ({ value: v, label: i.label })) },
    { key: 'risk_level',    label: 'Risiko',        type: 'select',
      options: [
        { value: 'niedrig', label: 'Niedrig' }, { value: 'mittel', label: 'Mittel' },
        { value: 'hoch', label: 'Hoch' }, { value: 'kritisch', label: 'Kritisch' },
      ] },
    { key: 'criticality',   label: 'Kritikalität',  type: 'select',
      options: [
        { value: 'niedrig', label: 'Niedrig' }, { value: 'mittel', label: 'Mittel' },
        { value: 'hoch', label: 'Hoch' }, { value: 'geschäftskritisch', label: 'Geschäftskritisch' },
      ] },
    { key: 'notes',         label: 'Notizen',       type: 'textarea', span: 2 },
  ];

  const tabBadge = (id: TabId): number | undefined => {
    if (id === 'aufgaben') return openTasks || undefined;
    if (id === 'dokumente') return missingDocs || undefined;
    return undefined;
  };

  return (
    <div>
      {/* Header */}
      <div className="section-head">
        <button className="btn ghost" onClick={onBack} style={{ marginRight: 6 }}>
          <Ic name="back" size={13} /> Zurück
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, marginBottom: 2 }}>{provider.displayName || provider.companyName}</h1>
          <div className="sub">
            {provider.category}
            {provider.subcategory && ` · ${provider.subcategory}`}
            {(provider.city || provider.country) && ` · ${[provider.city, provider.country].filter(Boolean).join(', ')}`}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge kind={statusInfo.kind} dot>{statusInfo.label}</Badge>
          <Badge kind={riskInfo.kind}>Risiko: {riskInfo.label}</Badge>
          {provider.overallRating && (
            <Badge kind="warning">★ {provider.overallRating.toFixed(1)}</Badge>
          )}
          <button className="btn sm ghost" onClick={() => setEditOpen(true)}>
            <Ic name="edit" size={12} /> Bearbeiten
          </button>
          <button className="btn sm ghost" onClick={() => setDeleteOpen(true)} style={{ color: '#f87171' }}>
            <Ic name="trash" size={12} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 16px', marginBottom: 0 }}>
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid rgba(255,255,255,0.07)', overflowX: 'auto' }}>
          {TABS.map(t => {
            const badge = tabBadge(t.id);
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '9px 14px', background: 'none', border: 'none',
                  borderBottom: `2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`,
                  color: tab === t.id ? 'var(--text)' : 'var(--text-3)',
                  cursor: 'pointer', fontSize: 12.5, fontWeight: tab === t.id ? 600 : 400,
                  whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5,
                  transition: 'color 0.15s',
                }}
              >
                <Ic name={t.icon} size={12} />
                {t.label}
                {badge !== undefined && (
                  <span style={{ background: '#f87171', color: '#fff', borderRadius: 8, fontSize: 9, padding: '1px 5px', fontWeight: 700 }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: '12px 16px 24px' }}>
        {tab === 'uebersicht'  && <TabUebersicht  provider={provider} master={master} />}
        {tab === 'stammdaten'  && <TabStammdaten  provider={provider} master={master} onSaved={refresh} />}
        {tab === 'leistungen'  && <TabLeistungen  provider={provider} master={master} onSaved={refresh} />}
        {tab === 'kontakte'    && <TabKontakte    provider={provider} master={master} onSaved={refresh} />}
        {tab === 'preise'      && <TabPreise      provider={provider} master={master} onSaved={refresh} />}
        {tab === 'vertraege'   && <TabVertraege   provider={provider} master={master} onSaved={refresh} />}
        {tab === 'dokumente'   && <TabDokumente   provider={provider} master={master} onSaved={refresh} />}
        {tab === 'risiko'      && <TabRisiko      provider={provider} master={master} onSaved={refresh} />}
        {tab === 'performance' && <TabPerformance provider={provider} master={master} onSaved={refresh} />}
        {tab === 'komm'        && <TabKommunikation provider={provider} master={master} onSaved={refresh} />}
        {tab === 'aufgaben'    && <TabAufgaben    provider={provider} master={master} onSaved={refresh} />}
      </div>

      {editOpen && (
        <GenericEditModal
          title="Dienstleister bearbeiten"
          subtitle={provider.displayName || provider.companyName}
          record={provider as unknown as Record<string, unknown>}
          fields={editFields}
          table="service_providers"
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); refresh(); }}
        />
      )}
      {deleteOpen && (
        <ConfirmDelete
          label={`Dienstleister '${provider.displayName || provider.companyName}'`}
          table="service_providers"
          id={provider.id}
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => { setDeleteOpen(false); onDeleted(); }}
        />
      )}
    </div>
  );
};

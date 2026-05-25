'use client';

import React, { useState } from 'react';
import { MOCK } from '@/lib/mock';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

const TYPE_FILTERS = ['alle', 'Vertrag', 'Zertifikat', 'Transportdokument', 'Laborbericht'] as const;
type TypeFilter = typeof TYPE_FILTERS[number];

const STATUS_META: Record<string, { kind: string; label: string }> = {
  'gültig':    { kind: 'success', label: 'Gültig' },
  'läuft ab':  { kind: 'warning', label: 'Läuft ab' },
  'fehlt':     { kind: 'danger',  label: 'Fehlt' },
  'Entwurf':   { kind: 'info',    label: 'Entwurf' },
};

const TYPE_ICON: Record<string, string> = {
  'Vertrag': 'doc', 'Zertifikat': 'leaf', 'Transportdokument': 'ship',
  'Laborbericht': 'quality', 'Genehmigung': 'flag',
};

interface DocumentsViewProps {
  lang: Lang;
}

export const DocumentsView = ({ lang }: DocumentsViewProps) => {
  const M = MOCK;
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('alle');

  const filtered = typeFilter === 'alle'
    ? M.documents
    : M.documents.filter(d => d.type === typeFilter);

  const kpis = [
    { l: 'Gültig',    v: M.documents.filter(d => d.status === 'gültig').length,     c: '#34d399' },
    { l: 'Läuft ab',  v: M.documents.filter(d => d.status === 'läuft ab').length,   c: '#fbbf24' },
    { l: 'Fehlt',     v: M.documents.filter(d => d.status === 'fehlt').length,       c: '#f87171' },
    { l: 'Entwürfe',  v: M.documents.filter(d => d.status === 'Entwurf').length,    c: '#60a5fa' },
    { l: 'Verträge',  v: M.documents.filter(d => d.type === 'Vertrag').length,       c: '#a78bfa' },
  ];

  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_documents')}</h1>
        <div className="sub">{M.documents.length} Dokumente · Versionierung · Ablaufkontrolle</div>
        <div className="right">
          <button className="btn"><Ic name="filter" size={13} /> {t(lang, 'filter')}</button>
          <button className="btn primary"><Ic name="upload" size={13} /> Hochladen</button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
          {kpis.map((k, i) => (
            <div key={i} className="tile kacheln" style={{ padding: 9 }}>
              <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase' }}>{k.l}</div>
              <div className="mono fw600" style={{ fontSize: 20, color: k.c, marginTop: 2 }}>{k.v}</div>
            </div>
          ))}
        </div>

        {/* Type filter chips */}
        <div className="row" style={{ gap: 6, marginBottom: 12 }}>
          {TYPE_FILTERS.map(f => (
            <button key={f} className={`btn sm${typeFilter === f ? ' primary' : ' ghost'}`} onClick={() => setTypeFilter(f)}>
              {f === 'alle' ? 'Alle Typen' : f}
              {f !== 'alle' && (
                <span className="mono" style={{ opacity: 0.7, marginLeft: 3 }}>
                  {M.documents.filter(d => d.type === f).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Dokument</th>
                <th>Typ</th>
                <th>Verknüpft mit</th>
                <th>Ausgestellt</th>
                <th>Ablauf</th>
                <th>Größe</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const meta = STATUS_META[d.status];
                const expiring = d.status === 'läuft ab';
                const missing = d.status === 'fehlt';
                const iconName = TYPE_ICON[d.type] ?? 'doc';
                return (
                  <tr
                    key={d.id}
                    style={{
                      background: missing ? 'rgba(248,113,113,0.03)' : expiring ? 'rgba(251,191,36,0.03)' : undefined,
                    }}
                  >
                    <td>
                      <div className="row" style={{ gap: 7 }}>
                        <Ic name={iconName} size={13} color="#5d667d" />
                        <div>
                          <div className="fw500">{d.name}</div>
                          <div className="tx3 mono" style={{ fontSize: 10 }}>{d.id}</div>
                        </div>
                      </div>
                    </td>
                    <td><Badge kind="neutral">{d.type}</Badge></td>
                    <td className="mono" style={{ fontSize: 11 }}>{d.order || '—'}</td>
                    <td className="mono tx2" style={{ fontSize: 11 }}>{fmtDate(d.issued)}</td>
                    <td>
                      <span className="mono tx2" style={{ fontSize: 11, color: expiring ? '#fbbf24' : missing ? '#f87171' : undefined }}>
                        {expiring && <Ic name="clock" size={10} color="#fbbf24" />}{' '}
                        {d.expires ? fmtDate(d.expires) : '—'}
                      </span>
                    </td>
                    <td className="mono tx3" style={{ fontSize: 11 }}>{d.size}</td>
                    <td>
                      {meta && <Badge kind={meta.kind} dot>{meta.label}</Badge>}
                    </td>
                    <td>
                      <div className="row" style={{ gap: 4 }}>
                        {!missing && <button className="btn sm ghost"><Ic name="download" size={11} /></button>}
                        <button className="btn sm ghost"><Ic name="more" size={11} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="empty">Keine Dokumente in dieser Kategorie</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

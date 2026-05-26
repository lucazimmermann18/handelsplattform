'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import { UploadModal } from '@/components/ui/UploadModal';

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
  const { data: M } = useData();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('alle');
  const [statusFilter, setStatusFilter] = useState<string>('alle');
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [docMenu, setDocMenu] = useState<string | null>(null);
  const [dlNote, setDlNote] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const handleDownload = (name: string) => {
    setDlNote(`"${name}" — kein Datei-Storage hinterlegt`);
    setTimeout(() => setDlNote(null), 2500);
  };

  const filtered = M.documents.filter(d => {
    if (typeFilter !== 'alle' && d.type !== typeFilter) return false;
    if (statusFilter !== 'alle' && d.status !== statusFilter) return false;
    return true;
  });

  const kpis = [
    { l: 'Gültig',    v: M.documents.filter(d => d.status === 'gültig').length,     c: '#34d399' },
    { l: 'Läuft ab',  v: M.documents.filter(d => d.status === 'läuft ab').length,   c: '#fbbf24' },
    { l: 'Fehlt',     v: M.documents.filter(d => d.status === 'fehlt').length,       c: '#f87171' },
    { l: 'Entwürfe',  v: M.documents.filter(d => d.status === 'Entwurf').length,    c: '#60a5fa' },
    { l: 'Verträge',  v: M.documents.filter(d => d.type === 'Vertrag').length,       c: '#a78bfa' },
  ];

  return (
  <>
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_documents')}</h1>
        <div className="sub">{M.documents.length} Dokumente · Versionierung · Ablaufkontrolle</div>
        <div className="right">
          <button className={`btn${showStatusFilter ? ' primary' : ''}`} onClick={() => setShowStatusFilter(s => !s)}><Ic name="filter" size={13} /> {t(lang, 'filter')}</button>
          <button className="btn primary" onClick={() => setUploadOpen(true)}><Ic name="upload" size={13} /> Hochladen</button>
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
        <div className="row" style={{ gap: 6, marginBottom: 6 }}>
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

        {showStatusFilter && (
          <div className="row" style={{ gap: 6, marginBottom: 10, paddingTop: 4 }}>
            {['alle', 'gültig', 'läuft ab', 'fehlt', 'Entwurf'].map(f => (
              <button key={f} className={`btn sm${statusFilter === f ? ' primary' : ' ghost'}`} onClick={() => setStatusFilter(f)}>
                {f === 'alle' ? 'Alle Status' : f}
                {f !== 'alle' && (
                  <span className="mono" style={{ opacity: 0.7, marginLeft: 3 }}>
                    {M.documents.filter(d => d.status === f).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {dlNote && (
          <div style={{ padding: '8px 12px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, marginBottom: 10, fontSize: 12, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Ic name="info" size={12} color="#fbbf24" /> {dlNote}
          </div>
        )}

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
                        {!missing && (
                          <button className="btn sm ghost" onClick={() => handleDownload(d.name)}>
                            <Ic name="download" size={11} />
                          </button>
                        )}
                        <div style={{ position: 'relative' }}>
                          <button className="btn sm ghost" onClick={e => { e.stopPropagation(); setDocMenu(docMenu === d.id ? null : d.id); }}>
                            <Ic name="more" size={11} />
                          </button>
                          {docMenu === d.id && (
                            <>
                              <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setDocMenu(null)} />
                              <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 100, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 4, minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>
                                <button className="btn sm ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 11, padding: '5px 10px' }}
                                  onClick={() => { void navigator.clipboard.writeText(d.id); setDocMenu(null); }}>
                                  <Ic name="doc" size={11} /> ID kopieren
                                </button>
                                <button className="btn sm ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 11, padding: '5px 10px' }}
                                  onClick={() => { handleDownload(d.name); setDocMenu(null); }}>
                                  <Ic name="info" size={11} /> Details
                                </button>
                              </div>
                            </>
                          )}
                        </div>
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
    {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} />}
  </>
  );
};

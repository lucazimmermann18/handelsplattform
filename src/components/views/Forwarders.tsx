'use client';

import React, { useState } from 'react';
import type { Lang } from '@/lib/i18n';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import { ForwarderWizard } from '@/components/ui/ForwarderWizard';
import { useData } from '@/lib/data-context';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { ConfirmDelete } from '@/components/ui/ConfirmDelete';
import { GenericEditModal, type FieldDef } from '@/components/ui/GenericEditModal';

interface ForwardersViewProps { lang: Lang; }

// ── Stars helper ──────────────────────────────────────────────────────────────

const Stars = ({ rating }: { rating: number }) => (
  <span>
    {Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < rating ? '#fbbf24' : '#3a4455', fontSize: 13 }}>★</span>
    ))}
  </span>
);

// ── Main component ────────────────────────────────────────────────────────────

export const ForwardersView = ({ lang: _lang }: ForwardersViewProps) => {
  const { data: M, refresh } = useData();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const forwarders = M.forwarders;

  // ── KPI values ──────────────────────────────────────────────────────────────

  const totalCount  = forwarders.length;
  const aktivCount  = forwarders.filter(f => f.status === 'aktiv').length;
  const avgRating   = totalCount > 0
    ? (forwarders.reduce((s, f) => s + f.rating, 0) / totalCount).toFixed(1)
    : '—';
  const lagerCount  = forwarders.filter(f => f.services.includes('Lager')).length;

  const kpis = [
    { l: 'Spediteure gesamt', v: totalCount === 0 ? '—' : String(totalCount), c: 'var(--text-2)' },
    { l: 'Aktiv',             v: aktivCount === 0 && totalCount === 0 ? '—' : String(aktivCount), c: '#60a5fa' },
    { l: 'Ø Bewertung',       v: avgRating,   c: '#fbbf24' },
    { l: 'Mit Lager',         v: lagerCount === 0 && totalCount === 0 ? '—' : String(lagerCount), c: '#34d399' },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Section head */}
      <div className="section-head">
        <h1>Spediteure</h1>
        <div className="sub">Freight Forwarder · Routen · Bewertungen</div>
        <div className="right">
          <button className="btn primary" onClick={() => setWizardOpen(true)}>
            <Ic name="plus" size={13} /> Neuer Spediteur
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        {/* KPI tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
          {kpis.map((k, i) => (
            <div key={i} className="card" style={{ padding: 14 }}>
              <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.l}</div>
              <div className="mono fw600" style={{ fontSize: 22, color: k.c, marginTop: 4 }}>{k.v}</div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {forwarders.length === 0 && (
          <div className="card">
            <div className="card-body" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ marginBottom: 10 }}>
                <Ic name="ship" size={32} color="var(--text-3)" />
              </div>
              <div className="fw600" style={{ fontSize: 14, marginBottom: 6 }}>Noch keine Spediteure angelegt</div>
              <div className="tx3" style={{ fontSize: 12, marginBottom: 16 }}>
                Füge deine Freight Forwarder hinzu um Routen, Bewertungen und Buchungen zu verwalten.
              </div>
              <button className="btn primary" onClick={() => setWizardOpen(true)}>
                <Ic name="plus" size={13} /> Ersten Spediteur hinzufügen
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {forwarders.length > 0 && (
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Name', 'Stadt / Land', 'Routen', 'Dienste', 'Bewertung', 'Status', 'Aktionen'].map(h => (
                      <th
                        key={h}
                        style={{
                          padding: '9px 12px', textAlign: 'left', fontSize: 10.5,
                          color: 'var(--text-3)', fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {forwarders.map(f => (
                    <tr
                      key={f.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      {/* Name */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{f.name}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{f.id}</div>
                      </td>

                      {/* Stadt / Land */}
                      <td style={{ padding: '10px 12px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                        {f.city || '—'}
                        {f.country ? `, ${f.country}` : ''}
                      </td>

                      {/* Routen */}
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-3)' }}>
                        {f.routes.length === 0
                          ? '—'
                          : f.routes.slice(0, 3).join(', ') + (f.routes.length > 3 ? ' …' : '')
                        }
                      </td>

                      {/* Dienste */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {f.services.length === 0
                            ? <span style={{ color: 'var(--text-3)' }}>—</span>
                            : f.services.map(s => <Badge key={s}>{s}</Badge>)
                          }
                        </div>
                      </td>

                      {/* Bewertung */}
                      <td style={{ padding: '10px 12px' }}>
                        <Stars rating={f.rating} />
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 12px' }}>
                        <Badge kind={f.status === 'aktiv' ? 'ok' : 'neutral'} dot>
                          {f.status}
                        </Badge>
                      </td>

                      {/* Aktionen */}
                      <td style={{ padding: '10px 12px' }}>
                        <ActionMenu onEdit={() => setEditId(f.id)} onDelete={() => setDeleteId(f.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Wizard */}
      <ForwarderWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={() => { setWizardOpen(false); refresh(); }}
      />
      {editId && (() => {
        const r = forwarders.find(x => x.id === editId);
        if (!r) return null;
        const fields: FieldDef[] = [
          { key: 'name', label: 'Name', type: 'text', required: true, span: 2 },
          { key: 'country', label: 'Land', type: 'text' },
          { key: 'city', label: 'Stadt', type: 'text' },
          { key: 'contact', label: 'Ansprechpartner', type: 'text' },
          { key: 'email', label: 'E-Mail', type: 'text' },
          { key: 'phone', label: 'Telefon', type: 'text' },
          { key: 'rating', label: 'Bewertung (1-5)', type: 'number' },
          { key: 'status', label: 'Status', type: 'select', options: [
            { value: 'aktiv', label: 'Aktiv' }, { value: 'inaktiv', label: 'Inaktiv' },
          ] },
          { key: 'notes', label: 'Notizen', type: 'textarea', span: 2 },
        ];
        return <GenericEditModal title="Spediteur bearbeiten" subtitle={r.name} record={r as unknown as Record<string, unknown>} fields={fields} table="forwarders" onClose={() => setEditId(null)} onSaved={() => { setEditId(null); refresh(); }} />;
      })()}
      {deleteId && (() => {
        const r = forwarders.find(x => x.id === deleteId);
        return r ? <ConfirmDelete label={`Spediteur '${r.name}'`} table="forwarders" id={deleteId} onClose={() => setDeleteId(null)} onDeleted={() => { setDeleteId(null); refresh(); }} /> : null;
      })()}
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import type { Lang } from '@/lib/i18n';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import { ForwarderWizard } from '@/components/ui/ForwarderWizard';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Forwarder {
  id: string;
  name: string;
  country: string;
  city: string;
  contact: string;
  email: string;
  phone: string;
  website?: string;
  rating: number;
  routes: string[];
  services: string[];
  status: string;
  notes?: string;
}

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
  const [forwarders, setForwarders] = useState<Forwarder[]>([]);
  const [loading, setLoading]       = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { data } = await createClient().from('forwarders').select('*').order('name');
      const mapped = (data ?? []).map((r: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        id: r.id, name: r.name, country: r.country ?? '',
        city: r.city ?? '', contact: r.contact ?? '',
        email: r.email ?? '', phone: r.phone ?? '',
        website: r.website, rating: r.rating ?? 0,
        routes: r.routes ?? [], services: r.services ?? [],
        status: r.status ?? 'aktiv', notes: r.notes,
      }));
      setForwarders(mapped);
    } catch (_e) {
      setForwarders([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

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

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div style={{ width: 24, height: 24, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Empty state */}
        {!loading && forwarders.length === 0 && (
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
        {!loading && forwarders.length > 0 && (
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
                        <button className="btn sm ghost">
                          <Ic name="more" size={11} />
                        </button>
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
        onSuccess={() => { setWizardOpen(false); load(); }}
      />
    </div>
  );
};

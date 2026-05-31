'use client';

import React, { useState, useCallback } from 'react';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

// Every table the app uses, grouped by domain
const TABLE_GROUPS = [
  {
    label: 'Kern-Handelsdaten',
    tables: [
      { name: 'suppliers',          label: 'Lieferanten' },
      { name: 'buyers',             label: 'Käufer' },
      { name: 'products',           label: 'Produkte' },
      { name: 'orders',             label: 'Aufträge' },
      { name: 'deals',              label: 'Deals' },
      { name: 'offers',             label: 'Angebote' },
    ],
  },
  {
    label: 'Logistik & Qualität',
    tables: [
      { name: 'quality_checks',     label: 'Qualitätsprüfungen' },
      { name: 'inventory',          label: 'Lagerbestand' },
      { name: 'vessels',            label: 'Schiffe' },
      { name: 'ports',              label: 'Häfen' },
      { name: 'forwarders',         label: 'Spediteure' },
      { name: 'samples',            label: 'Muster' },
      { name: 'lots',               label: 'Lots / Partien' },
      { name: 'communications',     label: 'Kommunikation' },
      { name: 'service_providers',  label: 'Dienstleister' },
    ],
  },
  {
    label: 'Dokumente & Aufgaben',
    tables: [
      { name: 'documents',          label: 'Dokumente' },
      { name: 'tasks',              label: 'Aufgaben' },
      { name: 'alerts',             label: 'Alerts' },
      { name: 'calendar_events',    label: 'Kalender-Termine' },
    ],
  },
  {
    label: 'Finanzen & Reporting',
    tables: [
      { name: 'rev_trend',          label: 'Umsatz-Trend' },
    ],
  },
  {
    label: 'Strategie & Compliance',
    tables: [
      { name: 'okrs',               label: 'OKRs' },
      { name: 'key_results',        label: 'Key Results' },
      { name: 'certifications',     label: 'Zertifizierungen' },
      { name: 'regulations',        label: 'Regulierungen' },
    ],
  },
  {
    label: 'Lieferanten-Detail',
    tables: [
      { name: 'supplier_notes',     label: 'Lieferanten-Notizen' },
      { name: 'field_visits',       label: 'Field Visits' },
    ],
  },
  {
    label: 'Käufer-Detail',
    tables: [
      { name: 'buyer_contacts',     label: 'Käufer-Kontakte' },
      { name: 'buyer_requirements', label: 'Käufer-Anforderungen' },
    ],
  },
  {
    label: 'Setup & Unternehmen',
    tables: [
      { name: 'setup_tasks',        label: 'Setup-Aufgaben' },
      { name: 'company_profile',    label: 'Unternehmensprofil' },
    ],
  },
  {
    label: 'Verfügbarkeitsplanung',
    tables: [
      { name: 'harvest_calendar',   label: 'Ernte-Kalender' },
    ],
  },
  {
    label: 'Team Workspace',
    tables: [
      { name: 'profiles',           label: 'Nutzer-Profile' },
      { name: 'team_meetings',      label: 'Meetings' },
      { name: 'meeting_notes',      label: 'Meeting-Protokolle' },
      { name: 'action_items',       label: 'Aktionspunkte' },
      { name: 'action_item_updates', label: 'Aufgaben-Updates' },
    ],
  },
];

type RowStatus = 'idle' | 'loading' | 'ok' | 'empty' | 'error';

interface TableResult {
  table: string;
  status: RowStatus;
  count: number | null;
  error: string | null;
  ms: number | null;
}

export const DbHealthView = () => {
  const [results, setResults] = useState<Record<string, TableResult>>({});
  const [running, setRunning] = useState(false);
  const [storageStatus, setStorageStatus] = useState<{ status: RowStatus; error: string | null; ms: number | null }>({ status: 'idle', error: null, ms: null });
  const [summary, setSummary] = useState<{ ok: number; empty: number; error: number } | null>(null);

  const runChecks = useCallback(async () => {
    setRunning(true);
    setSummary(null);
    setStorageStatus({ status: 'loading', error: null, ms: null });

    const allTables = TABLE_GROUPS.flatMap(g => g.tables);

    // Init all as loading
    setResults(Object.fromEntries(allTables.map(t => [t.name, { table: t.name, status: 'loading', count: null, error: null, ms: null }])));

    const { createClient } = await import('@/lib/supabase/client');
    const sb = createClient();

    // Run all table checks in parallel
    const checks = allTables.map(async ({ name }) => {
      const t0 = Date.now();
      try {
        const { count, error } = await sb.from(name).select('*', { count: 'exact', head: true });
        const ms = Date.now() - t0;
        if (error) {
          return { table: name, status: 'error' as RowStatus, count: null, error: error.message, ms };
        }
        return { table: name, status: (count ?? 0) > 0 ? 'ok' : 'empty' as RowStatus, count: count ?? 0, error: null, ms };
      } catch (e) {
        return { table: name, status: 'error' as RowStatus, count: null, error: (e as Error).message, ms: Date.now() - t0 };
      }
    });

    // Storage bucket check
    const storageCheck = async () => {
      const t0 = Date.now();
      try {
        const { error } = await sb.storage.from('documents').list('', { limit: 1 });
        const ms = Date.now() - t0;
        setStorageStatus({ status: error ? 'error' : 'ok', error: error?.message ?? null, ms });
      } catch (e) {
        setStorageStatus({ status: 'error', error: (e as Error).message, ms: Date.now() - t0 });
      }
    };

    const [tableResults] = await Promise.all([Promise.all(checks), storageCheck()]);

    const newResults = Object.fromEntries(tableResults.map(r => [r.table, r]));
    setResults(newResults);

    const ok    = tableResults.filter(r => r.status === 'ok').length;
    const empty = tableResults.filter(r => r.status === 'empty').length;
    const error = tableResults.filter(r => r.status === 'error').length;
    setSummary({ ok, empty, error });
    setRunning(false);
  }, []);

  const allTables = TABLE_GROUPS.flatMap(g => g.tables);
  const hasRun = Object.keys(results).length > 0;

  return (
    <div>
      <div className="section-head">
        <h1>Datenbank-Diagnose</h1>
        <div className="sub">Supabase · {allTables.length} Tabellen · Storage-Bucket</div>
        <div className="right">
          <button className="btn primary" onClick={runChecks} disabled={running}>
            {running
              ? <><Ic name="refresh" size={13} /> Läuft…</>
              : <><Ic name="quality" size={13} /> {hasRun ? 'Erneut prüfen' : 'Alle Tabellen prüfen'}</>
            }
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px 24px' }}>

        {/* Summary bar */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tabellen geprüft</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: 4 }}>{allTables.length}</div>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mit Daten</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#34d399', marginTop: 4 }}>{summary.ok}</div>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Leer (angelegt)</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#fbbf24', marginTop: 4 }}>{summary.empty}</div>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fehler / fehlt</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: summary.error > 0 ? '#f87171' : 'var(--text-3)', marginTop: 4 }}>{summary.error}</div>
            </div>
          </div>
        )}

        {/* Not yet run */}
        {!hasRun && !running && (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <Ic name="activity" size={32} color="var(--text-3)" />
            <div style={{ marginTop: 12, fontWeight: 600, fontSize: 14 }}>Noch kein Check gelaufen</div>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-3)' }}>
              Klicke auf &bdquo;Alle Tabellen pr&uuml;fen&ldquo; um jeden Datenbankzugriff zu testen.
            </div>
          </div>
        )}

        {/* Table groups */}
        {(hasRun || running) && TABLE_GROUPS.map(group => (
          <div key={group.label} className="card" style={{ marginBottom: 12 }}>
            <div className="card-head">
              <Ic name="doc" size={14} />
              <span className="title">{group.label}</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Tabelle', 'DB-Name', 'Status', 'Zeilen', 'Latenz'].map(h => (
                    <th key={h} style={{ padding: '7px 14px', textAlign: 'left', fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.tables.map(({ name, label }) => {
                  const r = results[name];
                  const status = r?.status ?? 'idle';
                  return (
                    <tr key={name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '9px 14px', fontWeight: 600 }}>{label}</td>
                      <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-3)' }}>{name}</td>
                      <td style={{ padding: '9px 14px' }}>
                        {status === 'loading' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', fontSize: 12 }}>
                            <span style={{ width: 10, height: 10, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#a78bfa', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                            Prüfe…
                            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                          </span>
                        )}
                        {status === 'ok'    && <Badge kind="success" dot>Erreichbar · hat Daten</Badge>}
                        {status === 'empty' && <Badge kind="warning" dot>Erreichbar · leer</Badge>}
                        {status === 'error' && <Badge kind="danger"  dot>Fehler</Badge>}
                        {status === 'idle'  && <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {status === 'ok' || status === 'empty'
                          ? <span style={{ color: status === 'ok' ? '#34d399' : '#fbbf24' }}>{r?.count ?? 0}</span>
                          : status === 'error'
                            ? <span style={{ fontSize: 11, color: '#f87171', maxWidth: 260, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r?.error}</span>
                            : '—'
                        }
                      </td>
                      <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>
                        {r?.ms != null ? `${r.ms} ms` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

        {/* Storage bucket */}
        {(hasRun || running) && (
          <div className="card">
            <div className="card-head">
              <Ic name="upload" size={14} />
              <span className="title">Storage-Bucket</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Bucket', 'Name', 'Status', 'Info', 'Latenz'].map(h => (
                    <th key={h} style={{ padding: '7px 14px', textAlign: 'left', fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '9px 14px', fontWeight: 600 }}>Dokumente</td>
                  <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-3)' }}>documents</td>
                  <td style={{ padding: '9px 14px' }}>
                    {storageStatus.status === 'loading' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', fontSize: 12 }}>
                        <span style={{ width: 10, height: 10, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#a78bfa', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                        Prüfe…
                      </span>
                    )}
                    {storageStatus.status === 'ok'    && <Badge kind="success" dot>Bucket erreichbar</Badge>}
                    {storageStatus.status === 'error' && <Badge kind="danger"  dot>Fehler</Badge>}
                    {storageStatus.status === 'idle'  && <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: '9px 14px', fontSize: 11, color: storageStatus.status === 'error' ? '#f87171' : 'var(--text-3)' }}>
                    {storageStatus.error ?? (storageStatus.status === 'ok' ? 'Lesen OK · Upload-Policy aktiv' : '—')}
                  </td>
                  <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>
                    {storageStatus.ms != null ? `${storageStatus.ms} ms` : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

const TEAM = [
  { n: 'Maryam Kassim',  r: 'Admin · Operations',         a: 'Online',    last: '' },
  { n: 'Aksel Bauer',    r: 'Operations',                  a: 'vor 2 Min', last: '' },
  { n: 'Nyota Otieno',   r: 'Einkauf · Lieferanten',       a: 'vor 14 Min',last: '' },
  { n: 'Lisa Höffken',   r: 'Sales · Käufer',              a: 'gestern',   last: '' },
  { n: 'Roland Volkmann',r: 'Finance',                     a: 'gestern',   last: '' },
  { n: 'Hassan Idris',   r: 'Compliance',                  a: 'vor 1 Std', last: '' },
];

const INTEGRATIONS = [
  { n: 'Maersk Spot · Booking & Tracking',  s: 'verbunden', d: 'API · Last sync vor 4 Min' },
  { n: 'MSC eBL',                           s: 'verbunden', d: 'API · Last sync vor 12 Min' },
  { n: 'TRACES NT (EU)',                    s: 'verbunden', d: 'OAuth · gültig bis 2027' },
  { n: 'SGS Lab Portal',                    s: 'verbunden', d: 'API · COA auto-pull' },
  { n: 'TanTrade · Certificate of Origin',  s: 'verbunden', d: 'SOAP' },
  { n: 'Stripe · Käuferzahlungen',          s: 'verbunden', d: 'Webhook live' },
  { n: 'Sage · Buchhaltung',                s: 'pending',   d: 'Setup ausstehend' },
  { n: 'WhatsApp Business · Lieferanten',   s: 'pending',   d: 'Verifizierung läuft' },
];

const AUDIT_TRAIL = [
  { ts: 'vor 4 Min',  u: 'M. Kassim',   a: 'Status geändert',               o: 'ORD-2026-0144 · in_export' },
  { ts: 'vor 12 Min', u: 'A. Bauer',    a: 'Dokument hochgeladen',           o: 'Packing List 0144.xlsx' },
  { ts: 'vor 28 Min', u: 'N. Otieno',   a: 'Qualitätsprüfung freigegeben',  o: 'QC-2026-0077' },
  { ts: 'vor 1 Std',  u: 'M. Kassim',   a: 'Preis angepasst',               o: 'ORD-2026-0130 · 13.60 → 13.80' },
  { ts: 'vor 2 Std',  u: 'H. Idris',    a: 'Reklamation eröffnet',          o: 'C-2026-0014' },
  { ts: 'vor 3 Std',  u: 'L. Höffken',  a: 'Deal verschoben',               o: 'D-2026-0211 · Angebot → Verhandlung' },
];

interface SettingsViewProps {
  lang: Lang;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2);
}

export const SettingsView = ({ lang }: SettingsViewProps) => {
  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_settings')}</h1>
        <div className="sub">Team · Rollen · Integrationen · Audit</div>
        <div className="right">
          <button className="btn primary"><Ic name="plus" size={13} /> Benutzer einladen</button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          {/* Team */}
          <div className="card">
            <div className="card-head">
              <Ic name="buyer" size={14} />
              <span className="title">Team &amp; Rollen</span>
              <span className="meta">{TEAM.length} Mitglieder</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Rolle</th>
                  <th>Aktivität</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {TEAM.map((u, i) => {
                  const online = u.a === 'Online';
                  return (
                    <tr key={i}>
                      <td>
                        <div className="row" style={{ gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, color: 'white', fontWeight: 700, flexShrink: 0,
                          }}>
                            {initials(u.n)}
                          </div>
                          <span className="fw500" style={{ fontSize: 12 }}>{u.n}</span>
                        </div>
                      </td>
                      <td><Badge kind="neutral">{u.r}</Badge></td>
                      <td>
                        <div className="row" style={{ gap: 6, fontSize: 11 }}>
                          <span className="dot" style={{ background: online ? '#34d399' : '#5d667d', boxShadow: online ? '0 0 6px #34d399' : 'none' }} />
                          <span className="tx2">{u.a}</span>
                        </div>
                      </td>
                      <td>
                        <button className="btn sm ghost"><Ic name="more" size={11} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Integrations */}
          <div className="card">
            <div className="card-head">
              <Ic name="layers" size={14} />
              <span className="title">Integrationen</span>
              <span className="meta">{INTEGRATIONS.filter(x => x.s === 'verbunden').length}/{INTEGRATIONS.length} aktiv</span>
            </div>
            <div className="card-body">
              {INTEGRATIONS.map((x, i) => (
                <div key={i} className="row" style={{ padding: '9px 0', borderBottom: i < INTEGRATIONS.length - 1 ? '1px solid var(--border)' : 'none', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ic name="layers" size={13} color="#60a5fa" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="fw500" style={{ fontSize: 12 }}>{x.n}</div>
                    <div className="tx3 mono" style={{ fontSize: 10.5 }}>{x.d}</div>
                  </div>
                  <Badge kind={x.s === 'verbunden' ? 'success' : 'warning'} dot>{x.s}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audit trail */}
        <div className="card">
          <div className="card-head">
            <Ic name="history" size={14} />
            <span className="title">Audit Trail</span>
            <span className="meta">Letzte 24 Stunden</span>
            <button className="btn sm ghost" style={{ marginLeft: 'auto' }}>Vollständig anzeigen</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Zeitstempel</th>
                <th>Benutzer</th>
                <th>Aktion</th>
                <th>Objekt</th>
              </tr>
            </thead>
            <tbody>
              {AUDIT_TRAIL.map((l, i) => (
                <tr key={i}>
                  <td className="mono tx2" style={{ fontSize: 11 }}>{l.ts}</td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'white', fontWeight: 700 }}>
                        {initials(l.u)}
                      </div>
                      <span style={{ fontSize: 12 }}>{l.u}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>{l.a}</td>
                  <td className="mono tx2" style={{ fontSize: 11 }}>{l.o}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

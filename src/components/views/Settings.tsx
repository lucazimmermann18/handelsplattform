'use client';

import React, { useState } from 'react';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import { useData } from '@/lib/data-context';

const TEAM: { n: string; r: string; a: string }[] = [];

const INTEGRATIONS = [
  { n: 'Supabase · Datenbank',   s: 'konfiguriert', d: 'PostgreSQL · RLS aktiv' },
  { n: 'Resend · E-Mail',        s: 'konfiguriert', d: 'Transactional Email' },
];

const AUDIT_TRAIL: { ts: string; u: string; a: string; o: string }[] = [];

interface SettingsViewProps {
  lang: Lang;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2);
}

export const SettingsView = ({ lang }: SettingsViewProps) => {
  const { isConnected, error: dbError, loading: dbLoading, lastSync, supabaseUrl, refresh } = useData();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteResult(null);
    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, name: inviteName, role: inviteRole }),
      });
      const json = await res.json();
      if (res.ok) {
        setInviteResult({ ok: true, msg: `Einladung an ${inviteEmail} wurde gesendet.` });
        setInviteEmail(''); setInviteName('');
      } else {
        setInviteResult({ ok: false, msg: json.error ?? 'Fehler beim Einladen.' });
      }
    } catch {
      setInviteResult({ ok: false, msg: 'Netzwerkfehler.' });
    } finally {
      setInviting(false);
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 10px', boxSizing: 'border-box',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 5, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none',
  };

  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_settings')}</h1>
        <div className="sub">Team · Rollen · Integrationen · Audit</div>
        <div className="right">
          <button className="btn primary" onClick={() => { setInviteOpen(true); setInviteResult(null); }}>
            <Ic name="plus" size={13} /> Benutzer einladen
          </button>
        </div>
      </div>

      {/* Invite modal */}
      {inviteOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => e.target === e.currentTarget && setInviteOpen(false)}>
          <div className="card" style={{ width: 420, padding: 0 }}>
            <div className="card-head" style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)' }}>
              <Ic name="buyer" size={14} />
              <span className="title">Neuen Benutzer einladen</span>
              <div className="spacer" />
              <button className="iconbtn" onClick={() => setInviteOpen(false)}><Ic name="x" size={14} /></button>
            </div>
            <form onSubmit={handleInvite} style={{ padding: '18px 18px 20px' }}>
              <div style={{ marginBottom: 12 }}>
                <label className="tx3" style={{ fontSize: 10.5, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Name</label>
                <input type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Maryam Kassim" style={inp} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="tx3" style={{ fontSize: 10.5, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>E-Mail *</label>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="name@firma.de" required style={inp} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label className="tx3" style={{ fontSize: 10.5, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rolle</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={{ ...inp }}>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer (nur lesen)</option>
                </select>
              </div>
              {inviteResult && (
                <div style={{ marginBottom: 14, padding: '8px 10px', borderRadius: 5, fontSize: 12,
                  background: inviteResult.ok ? 'rgba(52,211,153,0.07)' : 'rgba(239,68,68,0.07)',
                  border: `1px solid ${inviteResult.ok ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  color: inviteResult.ok ? '#34d399' : '#f87171',
                }}>
                  {inviteResult.msg}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setInviteOpen(false)}>Abbrechen</button>
                <button type="submit" className="btn primary" disabled={inviting}>
                  {inviting ? 'Einladen…' : 'Einladung senden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          {/* Team */}
          <div className="card">
            <div className="card-head">
              <Ic name="buyer" size={14} />
              <span className="title">Team &amp; Rollen</span>
              <span className="meta">{TEAM.length} Mitglieder</span>
            </div>
            {TEAM.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <div className="tx3" style={{ fontSize: 12, marginBottom: 10 }}>Noch keine Benutzer angelegt</div>
                <button className="btn primary" onClick={() => { setInviteOpen(true); setInviteResult(null); }}>
                  <Ic name="plus" size={12} /> Ersten Benutzer einladen
                </button>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>Name</th><th>Rolle</th><th>Aktivität</th><th></th></tr>
                </thead>
                <tbody>
                  {TEAM.map((u, i) => {
                    const online = u.a === 'Online';
                    return (
                      <tr key={i}>
                        <td>
                          <div className="row" style={{ gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 700, flexShrink: 0 }}>
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
                        <td><button className="btn sm ghost"><Ic name="more" size={11} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
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

        {/* Database connection */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-head">
            <Ic name="activity" size={14} />
            <span className="title">Datenbankverbindung · Supabase</span>
            <span className="meta" style={{ marginLeft: 'auto' }}>
              {supabaseUrl ? supabaseUrl.replace('https://', '').replace('.supabase.co', '') + '.supabase.co' : '—'}
            </span>
          </div>
          <div className="card-body">
            <div className="row" style={{ gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Status indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                  background: isConnected ? 'rgba(52,211,153,0.08)' : dbLoading ? 'rgba(96,165,250,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${isConnected ? 'rgba(52,211,153,0.2)' : dbLoading ? 'rgba(96,165,250,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {dbLoading
                    ? <Ic name="refresh" size={16} color="#60a5fa" />
                    : isConnected
                    ? <Ic name="activity" size={16} color="#34d399" />
                    : <Ic name="warn" size={16} color="#f87171" />}
                </div>
                <div>
                  <div className="fw600" style={{ fontSize: 13, color: isConnected ? '#34d399' : dbLoading ? '#60a5fa' : '#f87171' }}>
                    {dbLoading ? 'Verbinde…' : isConnected ? 'Verbunden' : 'Keine Verbindung'}
                  </div>
                  <div className="tx3 mono" style={{ fontSize: 10.5, marginTop: 2 }}>
                    {dbLoading ? 'Daten werden geladen…'
                      : lastSync ? `Letzter Sync: ${lastSync.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                      : 'Noch kein erfolgreicher Sync'}
                  </div>
                </div>
              </div>

              {/* Stats */}
              {isConnected && (
                <div className="row" style={{ gap: 8, flexShrink: 0 }}>
                  {[
                    { l: 'Latenz', v: '< 100ms' },
                    { l: 'Region', v: 'eu-central-1' },
                    { l: 'SSL', v: 'TLS 1.3' },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 6, textAlign: 'center' }}>
                      <div className="tx3" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</div>
                      <div className="mono fw600" style={{ fontSize: 12, color: '#34d399', marginTop: 1 }}>{s.v}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Test button */}
              <button
                className="btn sm"
                style={{ marginLeft: 'auto', flexShrink: 0 }}
                disabled={dbLoading}
                onClick={refresh}
              >
                <Ic name="refresh" size={12} />
                {dbLoading ? 'Teste…' : 'Verbindung testen'}
              </button>
            </div>

            {/* Error details */}
            {dbError && !dbLoading && (
              <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-mono)',
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171' }}>
                <span style={{ opacity: 0.6, marginRight: 6 }}>FEHLER</span>{dbError}
              </div>
            )}
          </div>
        </div>

        {/* Audit trail */}
        <div className="card">
          <div className="card-head">
            <Ic name="history" size={14} />
            <span className="title">Audit Trail</span>
            <span className="meta">Letzte 24 Stunden</span>
          </div>
          {AUDIT_TRAIL.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <div className="tx3" style={{ fontSize: 12 }}>Noch keine Aktivitäten aufgezeichnet</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Zeitstempel</th><th>Benutzer</th><th>Aktion</th><th>Objekt</th></tr>
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
          )}
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

interface ComplianceRoadmapViewProps {
  lang: Lang;
}

// ── Certification data ─────────────────────────────────────────────────────────

type CertStatus = 'held' | 'in_progress' | 'planned' | 'blocked';
type CertPriority = 'core' | 'high' | 'medium' | 'opportunistic';

interface Cert {
  id: number;
  name: string;
  scope: string;
  status: CertStatus;
  validUntil?: string;
  startDate?: string;
  completionDate?: string;
  cost?: string;
  progress?: number;
  priority: CertPriority;
  rationale: string;
  blocker?: string;
}

const CERTS: Cert[] = [];

const CERT_STATUS_KIND: Record<CertStatus, string> = {
  held: 'success', in_progress: 'warning', planned: 'info', blocked: 'danger',
};

const PRIORITY_KIND: Record<CertPriority, string> = {
  core: 'success', high: 'danger', medium: 'warning', opportunistic: 'neutral',
};

// ── Regulation data ────────────────────────────────────────────────────────────

type RegImpact = 'critical' | 'high' | 'medium' | 'low';
type RegPhase = 'active' | 'transition' | 'future';

interface Regulation {
  code: string;
  title: string;
  products: string;
  deadline: string;
  phase: RegPhase;
  impact: RegImpact;
  readiness: number;
  action: string;
  cost: string;
}

const REGULATIONS: Regulation[] = [];

const IMPACT_KIND: Record<RegImpact, string> = {
  critical: 'danger', high: 'warning', medium: 'info', low: 'neutral',
};

const PHASE_KIND: Record<RegPhase, string> = {
  active: 'success', transition: 'warning', future: 'neutral',
};

// ── Audit data ─────────────────────────────────────────────────────────────────

type ItemStatus = 'done' | 'progress' | 'open' | 'parked';

interface AuditCheckItem {
  text: string;
  status: ItemStatus;
}

interface AuditSection {
  title: string;
  items: AuditCheckItem[];
}

interface Audit {
  id: string;
  name: string;
  location: string;
  date: string;
  auditor: string;
  readiness: number;
  sections: AuditSection[];
}

const AUDITS: Audit[] = [];

function auditReadiness(audit: Audit): number {
  const all = audit.sections.flatMap(s => s.items);
  const total = all.length;
  if (total === 0) return 0;
  const done = all.filter(i => i.status === 'done').length;
  const prog = all.filter(i => i.status === 'progress').length;
  return Math.round(((done + prog * 0.5) / total) * 100);
}

// ── Main component ─────────────────────────────────────────────────────────────

export const ComplianceRoadmapView = ({ lang }: ComplianceRoadmapViewProps) => {
  const [tab, setTab] = useState('certs');
  const [selectedAudit, setSelectedAudit] = useState('');

  const tabs = [
    { id: 'certs',  label: 'Zertifizierungsplan', icon: 'task' },
    { id: 'regs',   label: 'Regulations Watch',   icon: 'eye' },
    { id: 'audit',  label: 'Audit-Vorbereitung',  icon: 'quality' },
  ];

  // Cert counts
  const certCounts = {
    held:        CERTS.filter(c => c.status === 'held').length,
    in_progress: CERTS.filter(c => c.status === 'in_progress').length,
    planned:     CERTS.filter(c => c.status === 'planned').length,
    blocked:     CERTS.filter(c => c.status === 'blocked').length,
  };

  // Reg overall readiness
  const avgReadiness = REGULATIONS.length > 0
    ? Math.round(REGULATIONS.reduce((s, r) => s + r.readiness, 0) / REGULATIONS.length)
    : 0;
  const circ = 213.6;
  const ringDash = (avgReadiness / 100) * circ;

  return (
    <div>
      <div className="section-head">
        <h1>Compliance Roadmap</h1>
        <div className="sub">Zertifizierungsplan · Regulations Watch · Audit-Vorbereitung</div>
      </div>

      {/* Tab bar */}
      <div style={{ padding: '0 16px 4px', display: 'flex', gap: 4, borderBottom: '1px solid var(--border)' }}>
        {tabs.map(tb => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`btn${tab === tb.id ? ' active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <Ic name={tb.icon} size={13} />
            {tb.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '12px 16px 16px' }}>

        {/* ── TAB: Certs ────────────────────────────────────────────────────── */}
        {tab === 'certs' && (
          <div>
            {/* KPI tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
              {[
                { l: 'Gehalten',     v: certCounts.held,        c: '#34d399', kind: 'success' },
                { l: 'In Arbeit',    v: certCounts.in_progress,  c: '#fbbf24', kind: 'warning' },
                { l: 'Geplant',      v: certCounts.planned,      c: '#60a5fa', kind: 'info' },
                { l: 'Blockiert',    v: certCounts.blocked,      c: '#f87171', kind: 'danger' },
              ].map((kpi, i) => (
                <div key={i} className="card" style={{ padding: 14 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: 4 }}>{kpi.l}</div>
                  <div className="mono fw700" style={{ fontSize: 28, color: kpi.c }}>{kpi.v}</div>
                  <Badge kind={kpi.kind}>{kpi.l}</Badge>
                </div>
              ))}
            </div>

            {/* Certs table */}
            <div className="card">
              <div className="card-head">
                <Ic name="task" size={14} />
                <span className="title">Zertifizierungsplan</span>
                <span className="meta">{CERTS.length} Zertifikate</span>
              </div>
              {CERTS.length === 0 ? (
                <div className="card-body" style={{ textAlign: 'center', color: 'var(--text-3)', padding: '32px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Noch keine Zertifizierungen erfasst</div>
                  <div style={{ fontSize: 12 }}>Füge Zertifizierungen hinzu um den Plan zu tracken.</div>
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Zertifikat</th>
                      <th>Geltungsbereich</th>
                      <th>Status</th>
                      <th>Zeitplan</th>
                      <th>Priorität</th>
                      <th className="num">Kosten</th>
                      <th>Begründung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CERTS.map((cert, i) => (
                      <tr key={i}>
                        <td className="fw500" style={{ fontSize: 12 }}>{cert.name}</td>
                        <td style={{ fontSize: 11, color: 'var(--text-2)' }}>{cert.scope}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <Badge kind={CERT_STATUS_KIND[cert.status]}>
                              {cert.status === 'held' ? 'Gehalten' : cert.status === 'in_progress' ? 'In Arbeit' : cert.status === 'planned' ? 'Geplant' : 'Blockiert'}
                            </Badge>
                            {cert.status === 'in_progress' && cert.progress != null && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div className="progress" style={{ width: 50 }}>
                                  <div style={{ width: cert.progress + '%', background: '#fbbf24' }} />
                                </div>
                                <span className="mono" style={{ fontSize: 10 }}>{cert.progress}%</span>
                              </div>
                            )}
                            {cert.status === 'blocked' && cert.blocker && (
                              <div style={{ fontSize: 10, color: '#f87171' }}>{cert.blocker}</div>
                            )}
                          </div>
                        </td>
                        <td style={{ fontSize: 11 }}>
                          {cert.validUntil && <div>Bis: {cert.validUntil}</div>}
                          {cert.startDate && <div>{cert.startDate} → {cert.completionDate}</div>}
                          {!cert.validUntil && !cert.startDate && <span className="tx3">—</span>}
                        </td>
                        <td><Badge kind={PRIORITY_KIND[cert.priority]}>{cert.priority}</Badge></td>
                        <td className="num mono" style={{ fontSize: 12 }}>{cert.cost || '—'}</td>
                        <td style={{ fontSize: 11, color: 'var(--text-2)', maxWidth: 240 }}>{cert.rationale}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Regulations Watch ────────────────────────────────────────── */}
        {tab === 'regs' && (
          <div>
            {/* Header ring */}
            <div className="card" style={{ marginBottom: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <svg width={80} height={80} viewBox="0 0 80 80">
                  <circle cx={40} cy={40} r={34} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
                  <circle
                    cx={40} cy={40} r={34} fill="none"
                    stroke={avgReadiness >= 70 ? '#34d399' : avgReadiness >= 40 ? '#fbbf24' : '#f87171'}
                    strokeWidth={8}
                    strokeDasharray={`${ringDash} ${circ - ringDash}`}
                    strokeDashoffset={0}
                    transform="rotate(-90 40 40)"
                    strokeLinecap="round"
                  />
                  <text x={40} y={45} textAnchor="middle" fill="white" fontSize={16} fontWeight={700} fontFamily="var(--font-mono)">{avgReadiness}%</text>
                </svg>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                    {REGULATIONS.length} Verordnungen getrackt · Ø {avgReadiness}% Readiness
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                    <span style={{ color: '#f87171' }}>● {REGULATIONS.filter(r => r.impact === 'critical').length} Critical</span>
                    <span style={{ color: '#fbbf24' }}>● {REGULATIONS.filter(r => r.impact === 'high').length} High</span>
                    <span style={{ color: '#60a5fa' }}>● {REGULATIONS.filter(r => r.impact === 'medium').length} Medium</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Regulations table */}
            <div className="card">
              <div className="card-head">
                <Ic name="eye" size={14} />
                <span className="title">Regulations Watch</span>
                <span className="meta">{REGULATIONS.length} Verordnungen</span>
              </div>
              {REGULATIONS.length === 0 ? (
                <div className="card-body" style={{ textAlign: 'center', color: 'var(--text-3)', padding: '32px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Noch keine Verordnungen erfasst</div>
                  <div style={{ fontSize: 12 }}>Füge relevante EU-Regulierungen hinzu um den Compliance-Status zu tracken.</div>
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Verordnung</th>
                      <th>Frist</th>
                      <th>Phase</th>
                      <th>Impact</th>
                      <th>Readiness</th>
                      <th>Aktion</th>
                      <th className="num">Kosten</th>
                    </tr>
                  </thead>
                  <tbody>
                    {REGULATIONS.map((reg, i) => (
                      <tr key={i}>
                        <td>
                          <div className="mono fw600" style={{ fontSize: 11, color: '#a78bfa' }}>{reg.code}</div>
                          <div style={{ fontSize: 12, fontWeight: 500 }}>{reg.title}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{reg.products}</div>
                        </td>
                        <td style={{ fontSize: 12 }}>{reg.deadline}</td>
                        <td><Badge kind={PHASE_KIND[reg.phase]}>{reg.phase}</Badge></td>
                        <td><Badge kind={IMPACT_KIND[reg.impact]}>{reg.impact}</Badge></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className="progress" style={{ width: 60 }}>
                              <div style={{ width: reg.readiness + '%', background: reg.readiness >= 80 ? '#34d399' : reg.readiness >= 40 ? '#fbbf24' : '#f87171' }} />
                            </div>
                            <span className="mono" style={{ fontSize: 11 }}>{reg.readiness}%</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 11, color: 'var(--text-2)' }}>{reg.action}</td>
                        <td className="num mono" style={{ fontSize: 12 }}>{reg.cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Audit Prep ───────────────────────────────────────────────── */}
        {tab === 'audit' && (
          AUDITS.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Noch keine Audits geplant</div>
              <div style={{ fontSize: 12 }}>Füge Audits hinzu um die Vorbereitung zu tracken.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 12 }}>
              {/* Audit list */}
              <div className="card">
                <div className="card-head">
                  <Ic name="quality" size={14} />
                  <span className="title">Audits</span>
                </div>
                {AUDITS.map(audit => {
                  const rdy = auditReadiness(audit);
                  const isActive = selectedAudit === audit.id;
                  return (
                    <div
                      key={audit.id}
                      onClick={() => setSelectedAudit(audit.id)}
                      style={{
                        padding: '11px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border)',
                        background: isActive ? 'rgba(167,139,250,0.08)' : undefined,
                        borderLeft: isActive ? '3px solid #a78bfa' : '3px solid transparent',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <span className="fw600" style={{ fontSize: 12 }}>{audit.name}</span>
                        <span className="mono" style={{ fontSize: 11, color: rdy >= 80 ? '#34d399' : rdy >= 60 ? '#fbbf24' : '#f87171' }}>{rdy}%</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>
                        {audit.location} · {audit.date} · {audit.auditor}
                      </div>
                      <div className="progress">
                        <div style={{ width: rdy + '%', background: rdy >= 80 ? '#34d399' : rdy >= 60 ? '#fbbf24' : '#f87171' }} />
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <span className="mono id" style={{ fontSize: 10 }}>{audit.id}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Checklist detail */}
              {(() => {
                const audit = AUDITS.find(a => a.id === selectedAudit);
                if (!audit) return null;
                const allItems = audit.sections.flatMap(s => s.items);
                const total = allItems.length;
                const done = allItems.filter(i => i.status === 'done').length;
                const prog = allItems.filter(i => i.status === 'progress').length;
                const openCount = allItems.filter(i => i.status === 'open').length;
                const readinessPct = Math.round(((done + prog * 0.5) / total) * 100);

                const statusIcon = (status: ItemStatus) => {
                  if (status === 'done')     return <span style={{ color: '#34d399', fontSize: 14, lineHeight: 1 }}>✓</span>;
                  if (status === 'progress') return <span style={{ color: '#fbbf24', fontSize: 10 }}>●</span>;
                  if (status === 'parked')   return <span style={{ color: '#60a5fa', fontSize: 10 }}>●</span>;
                  return <span style={{ color: 'var(--text-3)', fontSize: 10 }}>●</span>;
                };

                return (
                  <div className="card">
                    <div className="card-head">
                      <span className="title">{audit.name}</span>
                      <Badge kind={readinessPct >= 80 ? 'success' : readinessPct >= 60 ? 'warning' : 'danger'}>{readinessPct}% bereit</Badge>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{audit.date} · {audit.auditor}</span>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontSize: 12 }}>
                        <span style={{ color: '#34d399' }}>✓ {done}</span>
                        <span style={{ color: '#fbbf24' }}>● {prog}</span>
                        <span style={{ color: 'var(--text-3)' }}>● {openCount}</span>
                      </div>
                    </div>
                    <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {audit.sections.map((section, si) => (
                        <div key={si}>
                          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
                            {section.title}
                            <span className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 8 }}>
                              ({section.items.filter(i => i.status === 'done').length}/{section.items.length})
                            </span>
                          </div>
                          {section.items.map((item, ii) => (
                            <div key={ii} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                              <span style={{ width: 16, textAlign: 'center', flexShrink: 0 }}>{statusIcon(item.status)}</span>
                              <span style={{
                                fontSize: 12,
                                color: item.status === 'done' ? 'var(--text-3)' : item.status === 'parked' ? 'var(--text-3)' : 'var(--text-1)',
                                textDecoration: item.status === 'done' ? 'line-through' : 'none',
                              }}>
                                {item.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )
        )}

      </div>
    </div>
  );
};

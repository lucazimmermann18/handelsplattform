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

const CERTS: Cert[] = [
  { id: 1,  name: 'Organic EU',          scope: 'Mtwara Cashew + Dodoma Sesame',   status: 'held',        validUntil: '2027-04-30', priority: 'core',          rationale: 'Pflichtvoraussetzung für Bio-Premiumpreise in EU' },
  { id: 2,  name: 'Fairtrade',           scope: 'Kilimo Arusha Coffee',            status: 'held',        validUntil: '2026-12-15', priority: 'core',          rationale: 'Differenzierung & Prämie auf Kaffeeumsatz' },
  { id: 3,  name: 'GlobalG.A.P.',        scope: 'Mbeya Avocado, Kenya Macadamia', status: 'held',        validUntil: '2026-09-30', priority: 'core',          rationale: 'Voraussetzung für EU-Einzelhandel & Retail-Käufer' },
  { id: 4,  name: 'HACCP/FSSC 22000',   scope: 'Mtwara Werk',                     status: 'held',        validUntil: '2027-02-20', priority: 'core',          rationale: 'Lebensmittelsicherheit — Pflicht für alle EU-Exporte' },
  { id: 5,  name: 'BRC Food Safety',    scope: 'Mtwara Werk',                     status: 'in_progress', startDate: 'Apr 2026', completionDate: 'Oct 2026', cost: '12.500 €', progress: 62, priority: 'high',          rationale: 'Erschließung UK-Retail & Premium EU Food Service' },
  { id: 6,  name: 'IFS Food',           scope: 'Mtwara Werk',                     status: 'planned',     startDate: 'Nov 2026',  completionDate: 'Mär 2027', cost: '~9.000 €',  priority: 'high',          rationale: 'Zugang zu deutschen und französischen LEH-Kunden' },
  { id: 7,  name: 'Rainforest Alliance',scope: 'Mbeya Coffee',                    status: 'planned',     startDate: 'Jan 2027',  completionDate: 'Mai 2027', cost: '~6.500 €',  priority: 'medium',        rationale: 'Attraktivitätssteigerung für Specialty-Segment' },
  { id: 8,  name: 'Halal IFANCA',       scope: 'Iringa Meat',                     status: 'blocked',     priority: 'opportunistic', rationale: 'Mittlerer-Osten & Asien Export-Potential', blocker: 'EU Veterinärfreigabe Voraussetzung' },
  { id: 9,  name: 'EU Bio neue Charge SUP-101', scope: 'Rwanda Karongi',          status: 'in_progress', startDate: 'Mär 2026', completionDate: 'Aug 2026', cost: '4.800 €', progress: 78, priority: 'medium',  rationale: 'Rwanda-Expansion Bio-Kaffee, neuer Lieferant' },
  { id: 10, name: 'Bio-Knospe Schweiz', scope: 'CH expansion',                    status: 'planned',     startDate: 'Jan 2027',  completionDate: 'Jun 2027', cost: '~5.500 €',  priority: 'medium',        rationale: 'Voraussetzung für Schweizer Bio-Fachhandel' },
  { id: 11, name: 'SMETA/Sedex',        scope: 'All Suppliers',                   status: 'planned',     startDate: 'Nov 2026',  completionDate: 'Feb 2027', cost: '~4.000 €',  priority: 'medium',        rationale: 'Lieferketten-Transparenz, gefordert von EU-Käufern' },
  { id: 12, name: 'CE-Kennzeichnung EN 771-1', scope: 'Bagamoyo Bricks',          status: 'in_progress', startDate: 'Feb 2026', completionDate: 'Aug 2026', cost: '7.200 €', progress: 48, priority: 'high',   rationale: 'EU-Baustoffmarkt Erschließung Mauersteine' },
];

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

const REGULATIONS: Regulation[] = [
  { code: 'EUDR',              title: 'EU Entwaldungsverordnung',       products: 'Kaffee, Kakao, Nüsse',  deadline: 'Dez 2024 (aktiv)', phase: 'active',     impact: 'critical', readiness: 88,  action: 'DDS live, GPS 88% complete',        cost: '—' },
  { code: 'CBAM',              title: 'CO₂-Grenzausgleichsmechanismus', products: 'Alle Exporte',          deadline: '2026 (Phase 2)',   phase: 'transition', impact: 'medium',   readiness: 12,  action: 'Carbon-Footprint Daten sammeln',     cost: '~8.000 €' },
  { code: 'CSRD',              title: 'Nachhaltigkeitsberichterstattung',products: 'Alle',                 deadline: '2026+',            phase: 'future',     impact: 'high',     readiness: 8,   action: 'ESG-Reporting Struktur aufbauen',    cost: '~15.000 €' },
  { code: 'CSDDD',             title: 'Sorgfaltspflichtenrichtlinie',   products: 'Alle Lieferketten',    deadline: '2027+',            phase: 'future',     impact: 'high',     readiness: 5,   action: 'Due Diligence System vorbereiten',   cost: '~12.000 €' },
  { code: 'EU 2024/1735',      title: 'Critical Raw Materials Act',     products: 'Ausgewählte Mineralien',deadline: '2026',             phase: 'future',     impact: 'medium',   readiness: 22,  action: 'Impact-Analyse durchführen',         cost: '~2.000 €' },
  { code: 'Reg. 2024/1252',    title: 'Strategische Technologien',      products: 'N/A Export',           deadline: 'Aktiv',            phase: 'active',     impact: 'low',      readiness: 100, action: 'Kein Handlungsbedarf',               cost: '—' },
  { code: 'EU 396/2005',       title: 'Pestizid-Rückstandshöchstgehalte',products: 'Kaffee, Sesam, Avocado',deadline: 'Aktiv',          phase: 'active',     impact: 'high',     readiness: 94,  action: 'Laufende Laboranalysen SGS',         cost: '~6.000 €/J' },
  { code: 'EU 2073/2005',      title: 'Mikrobiologische Kriterien',     products: 'Alle Lebensmittel',    deadline: 'Aktiv',            phase: 'active',     impact: 'high',     readiness: 96,  action: 'Laufende HACCP-Protokolle',          cost: '—' },
  { code: 'EU 2018/848',       title: 'EU Bio-Verordnung',              products: 'Bio-zertifizierte Produkte',deadline: 'Aktiv',       phase: 'active',     impact: 'critical', readiness: 100, action: 'Organic EU Cert gehalten',           cost: '—' },
  { code: 'Packaging Reg. 2025', title: 'Verpackungsverordnung EU 2025',products: 'Alle verpackten Waren',deadline: '2026/2030',        phase: 'transition', impact: 'medium',   readiness: 38,  action: 'Verpackungsaudit + Umstellung Plan', cost: '~5.000 €' },
];

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

const AUDITS: Audit[] = [
  {
    id: 'AUD-2026-04', name: 'BRC Mid-term Audit', location: 'Mtwara Werk', date: '2026-09-15', auditor: 'SGS', readiness: 62,
    sections: [
      { title: 'Dokumentation', items: [
        { text: 'HACCP-Plan vollständig', status: 'done' },
        { text: 'Prozessfluss-Diagramme', status: 'done' },
        { text: 'Lieferanten-Spezifikationen', status: 'progress' },
        { text: 'Schulungsnachweise Mitarbeiter', status: 'progress' },
        { text: 'Reinigungs-Protokolle', status: 'done' },
        { text: 'Ungezieferbekämpfung', status: 'open' },
      ]},
      { title: 'Rückverfolgbarkeit', items: [
        { text: 'Traceability-System', status: 'done' },
        { text: 'Mock Recall Übung', status: 'progress' },
        { text: 'Aufbewahrungsfristen', status: 'done' },
      ]},
      { title: 'Produktsicherheit', items: [
        { text: 'Aflatoxin-Analytik aktuell', status: 'done' },
        { text: 'Fremdkörper-Kontrolle', status: 'done' },
        { text: 'Allergen-Management', status: 'progress' },
        { text: 'Schädlingsbekämpfung', status: 'open' },
      ]},
      { title: 'Lieferanten-Audit', items: [
        { text: 'Mtwara Co-op Audit', status: 'done' },
        { text: 'Dodoma Sesame Farm', status: 'done' },
        { text: 'Kilimo Arusha', status: 'progress' },
        { text: 'Iringa Meat (parked)', status: 'parked' },
      ]},
      { title: 'Infrastruktur', items: [
        { text: 'Trocknungsanlage geprüft', status: 'done' },
        { text: 'Wiegeanlagen kalibriert', status: 'done' },
        { text: 'Temperaturüberwachung', status: 'done' },
        { text: 'Sortieranlage Wartung', status: 'progress' },
        { text: 'Kühlhalle Inspektion', status: 'open' },
      ]},
    ],
  },
  {
    id: 'AUD-2026-03', name: 'Organic EU Re-Audit', location: 'Mtwara + Dodoma', date: '2026-07-08', auditor: 'Ecocert', readiness: 88,
    sections: [
      { title: 'Dokumentation', items: [
        { text: 'Bio-Anbau-Protokolle', status: 'done' },
        { text: 'Input-Register', status: 'done' },
        { text: 'Parallelproduktion Nachweis', status: 'done' },
        { text: 'Erntemengen-Register', status: 'progress' },
        { text: 'Reinigungs-Protokolle', status: 'done' },
        { text: 'Lager-Trennung Nachweis', status: 'done' },
      ]},
      { title: 'Rückverfolgbarkeit', items: [
        { text: 'Lot-Rückverfolgung', status: 'done' },
        { text: 'Massenbilanz', status: 'done' },
        { text: 'Käufer-Zertifikate', status: 'done' },
      ]},
      { title: 'Produktsicherheit', items: [
        { text: 'Pestizid-Analytik', status: 'done' },
        { text: 'GMO-Freiheit Nachweis', status: 'done' },
        { text: 'Kontamination-Risikobewertung', status: 'progress' },
        { text: 'Schädlingsbekämpfung Bio-konform', status: 'done' },
      ]},
      { title: 'Lieferanten-Audit', items: [
        { text: 'Mtwara Co-op Bio-Status', status: 'done' },
        { text: 'Dodoma Sesame Farm', status: 'done' },
        { text: 'Neue Charge SUP-101 Rwanda', status: 'progress' },
        { text: 'Sub-Lieferanten geprüft', status: 'done' },
      ]},
      { title: 'Infrastruktur', items: [
        { text: 'Bio-Lagerung Trennung', status: 'done' },
        { text: 'Reinigung Konv→Bio Protokoll', status: 'done' },
        { text: 'Kennzeichnung & Etiketten', status: 'done' },
        { text: 'Beschwerdemanagement', status: 'done' },
        { text: 'Interne Audit-Dokumentation', status: 'done' },
      ]},
    ],
  },
  {
    id: 'AUD-2026-02', name: 'GlobalG.A.P. Renewal', location: 'Mbeya + Kenya', date: '2026-08-22', auditor: 'Bureau Veritas', readiness: 74,
    sections: [
      { title: 'Dokumentation', items: [
        { text: 'Risikobewertung aktuell', status: 'done' },
        { text: 'Betriebsplan dokumentiert', status: 'done' },
        { text: 'Pflanzenschutzmittel-Register', status: 'progress' },
        { text: 'Schulungsnachweise', status: 'progress' },
        { text: 'Ernte-Aufzeichnungen', status: 'done' },
        { text: 'Worker Welfare Checkliste', status: 'open' },
      ]},
      { title: 'Rückverfolgbarkeit', items: [
        { text: 'GGN-Nummer aktuell', status: 'done' },
        { text: 'Lot-Tracing System', status: 'done' },
        { text: 'CoC-Kette vollständig', status: 'progress' },
      ]},
      { title: 'Produktsicherheit', items: [
        { text: 'MRL-Analyse aktuell', status: 'done' },
        { text: 'Wasseranalyse', status: 'done' },
        { text: 'Ernte-Hygiene Protokoll', status: 'done' },
        { text: 'Ausrüstungs-Wartung', status: 'progress' },
      ]},
      { title: 'Lieferanten-Audit', items: [
        { text: 'Mbeya Avocado Farm', status: 'done' },
        { text: 'Kenya Macadamia Ltd.', status: 'done' },
        { text: 'Sub-Contractor geprüft', status: 'open' },
        { text: 'Inputlieferanten', status: 'done' },
      ]},
      { title: 'Infrastruktur', items: [
        { text: 'Bewässerungsanlage', status: 'done' },
        { text: 'Lagerkapazität', status: 'done' },
        { text: 'Kalibrierung Geräte', status: 'progress' },
        { text: 'First Aid Ausstattung', status: 'done' },
        { text: 'Chemikalienlager', status: 'done' },
      ]},
    ],
  },
  {
    id: 'AUD-2026-01', name: 'Internes EUDR-Audit', location: 'Alle Standorte', date: '2026-06-15', auditor: 'Intern + GIZ', readiness: 92,
    sections: [
      { title: 'Dokumentation', items: [
        { text: 'DDS vollständig ausgefüllt', status: 'done' },
        { text: 'GPS-Koordinaten ≥88%', status: 'done' },
        { text: 'Lieferanten-Erklärungen', status: 'done' },
        { text: 'Risiko-Klassifizierung', status: 'done' },
        { text: 'Due-Diligence Berichte', status: 'done' },
        { text: 'Beweissicherung Polygon', status: 'progress' },
      ]},
      { title: 'Rückverfolgbarkeit', items: [
        { text: 'Lot-zu-Farm Trace', status: 'done' },
        { text: 'Satellite-Link Mbeya', status: 'done' },
        { text: 'EUDR-Portal Konto aktiv', status: 'done' },
      ]},
      { title: 'Produktsicherheit', items: [
        { text: 'Entwaldungsfreiheit Nachweis', status: 'done' },
        { text: 'Sentinel-2 Coverage 80%', status: 'done' },
        { text: 'High-Risk Countries Map', status: 'done' },
        { text: 'Benchmark-Aktualisierung', status: 'progress' },
      ]},
      { title: 'Lieferanten-Audit', items: [
        { text: 'Kilimo Arusha', status: 'done' },
        { text: 'Mtwara Co-op', status: 'done' },
        { text: 'Rwanda Karongi', status: 'done' },
        { text: 'Kenya Macadamia', status: 'done' },
      ]},
      { title: 'Infrastruktur', items: [
        { text: 'EUDR IT-System', status: 'done' },
        { text: 'Mitarbeiter-Schulung', status: 'done' },
        { text: 'Eskalationsprozess', status: 'done' },
        { text: 'Review-Zyklus definiert', status: 'done' },
        { text: 'GIZ-Kooperation aktiv', status: 'done' },
      ]},
    ],
  },
];

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
  const [selectedAudit, setSelectedAudit] = useState('AUD-2026-04');

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
  const avgReadiness = Math.round(REGULATIONS.reduce((s, r) => s + r.readiness, 0) / REGULATIONS.length);
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

            {/* AI card */}
            <div className="card" style={{ marginBottom: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <Ic name="sparkle" size={14} color="#a78bfa" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#a78bfa' }}>KI-Strategie-Zusammenfassung</div>
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: 'var(--text-2)' }}>
                    Das Zertifizierungsportfolio ist solide aufgestellt: 4 Kernzertifikate sind gehalten und
                    decken den EU-Lebensmittelmarkt ab. Die BRC Food Safety Zertifizierung (62% Fortschritt)
                    ist der kritische Pfad für UK-Retail-Erschließung bis Oktober 2026. Parallel laufen
                    3 Zertifizierungen gleichzeitig — Kapazitätsrisiko im Qualitätsteam beachten.
                    Die Halal-Zertifizierung bleibt sinnvoll geparkt bis zur EU-Veterinärfreigabe.
                    Empfehlung: IFS Food direkt nach BRC starten um Synergien aus Mtwara-Dokumentation zu nutzen.
                  </p>
                </div>
              </div>
            </div>

            {/* Certs table */}
            <div className="card">
              <div className="card-head">
                <Ic name="task" size={14} />
                <span className="title">Zertifizierungsplan</span>
                <span className="meta">{CERTS.length} Zertifikate</span>
              </div>
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
            </div>
          </div>
        )}

        {/* ── TAB: Audit Prep ───────────────────────────────────────────────── */}
        {tab === 'audit' && (
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 12 }}>
            {/* Audit list */}
            <div className="card">
              <div className="card-head">
                <Ic name="quality" size={14} />
                <span className="title">Audits 2026</span>
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
        )}

      </div>
    </div>
  );
};

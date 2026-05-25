'use client';

import React, { useState } from 'react';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtCur } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

interface StrategyViewProps {
  lang: Lang;
}

// ── OKR data ──────────────────────────────────────────────────────────────────

interface KR {
  id: string;
  text: string;
  cur: number;
  target: number;
  unit: string;
}

interface Objective {
  id: string;
  title: string;
  why: string;
  owner: string;
  krs: KR[];
}

const OBJECTIVES: Objective[] = [
  {
    id: 'O1', title: 'Q3 2026 Umsatz auf 1.4M € steigern', why: 'Break-Even-Schwelle', owner: 'CEO',
    krs: [
      { id: 'KR-1', text: 'Run-Rate ≥470k', cur: 380, target: 470, unit: 'k €' },
      { id: 'KR-2', text: '5 neue EU-Käufer', cur: 3, target: 5, unit: '' },
      { id: 'KR-3', text: 'Marge ≥32%', cur: 31, target: 32, unit: '%' },
      { id: 'KR-4', text: 'Win-Rate ≥45%', cur: 38, target: 45, unit: '%' },
    ],
  },
  {
    id: 'O2', title: 'Lieferanten-Netzwerk auf 18 Tier-A/B', why: 'Beschaffungssicherheit', owner: 'Operations',
    krs: [
      { id: 'KR-1', text: 'Aktive Lieferanten ≥18', cur: 10, target: 18, unit: '' },
      { id: 'KR-2', text: '4 neue Länder', cur: 2, target: 4, unit: '' },
      { id: 'KR-3', text: 'Ø Score ≥4.5', cur: 4.4, target: 4.5, unit: '' },
      { id: 'KR-4', text: '12 Audits abgeschlossen', cur: 7, target: 12, unit: '' },
    ],
  },
  {
    id: 'O3', title: 'EUDR-Compliance vollständig', why: 'Regulatorische Pflicht', owner: 'Compliance',
    krs: [
      { id: 'KR-1', text: '100% GPS-Koordinaten erfasst', cur: 88, target: 100, unit: '%' },
      { id: 'KR-2', text: 'Sentinel-2 Monitoring aktiv', cur: 80, target: 100, unit: '%' },
      { id: 'KR-3', text: 'DDS live', cur: 1, target: 1, unit: '' },
      { id: 'KR-4', text: '0 Lieferanten-Verzögerungen', cur: 0, target: 0, unit: '' },
    ],
  },
  {
    id: 'O4', title: 'Operational Excellence: Cycle-Time -20%', why: 'Effizienz & Skalierung', owner: 'Operations',
    krs: [
      { id: 'KR-1', text: 'Cycle-Time ≤18 Tage', cur: 22, target: 18, unit: '' },
      { id: 'KR-2', text: 'Dokument-Vollständigkeit ≥95%', cur: 78, target: 95, unit: '%' },
      { id: 'KR-3', text: 'Reklamationsquote ≤1.5%', cur: 2.3, target: 1.5, unit: '%' },
      { id: 'KR-4', text: 'KI-Nutzung ≥5 Tage/Woche', cur: 4, target: 5, unit: '' },
    ],
  },
  {
    id: 'O5', title: 'Marken-Aufbau: 3 Origin-Stories', why: 'Differenzierung & Premiumpreis', owner: 'Marketing',
    krs: [
      { id: 'KR-1', text: '3 Origin-Stories live', cur: 1, target: 3, unit: '' },
      { id: 'KR-2', text: 'Specialty-Anteil ≥35%', cur: 28, target: 35, unit: '%' },
      { id: 'KR-3', text: 'LinkedIn ≥8k Follower', cur: 3200, target: 8000, unit: '' },
    ],
  },
];

function krProgress(kr: KR): number {
  if (kr.target === 0) return 100;
  // For KRs where lower is better (cycle-time, reklamationsquote)
  if (kr.id === 'KR-1' && kr.cur > kr.target && kr.target < kr.cur) {
    const raw = (1 - (kr.cur - kr.target) / kr.target) * 100;
    return Math.max(0, Math.min(100, raw));
  }
  return Math.min(100, (kr.cur / Math.max(kr.target, 1)) * 100);
}

function objProgress(obj: Objective): number {
  if (obj.krs.length === 0) return 0;
  return obj.krs.reduce((s, kr) => s + krProgress(kr), 0) / obj.krs.length;
}

// ── Gantt data ─────────────────────────────────────────────────────────────────

const GANTT_COLORS: Record<string, string> = {
  Compliance: '#a78bfa',
  Supply: '#34d399',
  Sales: '#60a5fa',
  Product: '#fbbf24',
  Quality: '#22d3ee',
  Capital: '#e0b765',
  Tech: '#c4b5fd',
};

interface GanttItem {
  id: number;
  name: string;
  cat: string;
  start: number;
  end: number;
  state: 'done' | 'active' | 'planned';
  owner: string;
}

const GANTT_ITEMS: GanttItem[] = [
  { id: 1,  name: 'EUDR-Workflow live',            cat: 'Compliance', start: 0, end: 1,  state: 'done',    owner: 'Compliance' },
  { id: 2,  name: 'Lieferanten-Akquise Mtwara',    cat: 'Supply',     start: 1, end: 4,  state: 'active',  owner: 'Operations' },
  { id: 3,  name: 'Markteintritt Frankreich',       cat: 'Sales',      start: 2, end: 6,  state: 'active',  owner: 'Sales' },
  { id: 4,  name: 'BRC-Zertifizierung Mtwara',      cat: 'Quality',    start: 3, end: 7,  state: 'planned', owner: 'Compliance' },
  { id: 5,  name: 'Avocado-Programm Ausbau Mbeya', cat: 'Product',    start: 4, end: 9,  state: 'planned', owner: 'Operations' },
  { id: 6,  name: 'Cold-Outreach EU Spice Buyers', cat: 'Sales',      start: 5, end: 7,  state: 'planned', owner: 'Sales' },
  { id: 7,  name: 'Macadamia Expansion Kenya',      cat: 'Supply',     start: 5, end: 10, state: 'planned', owner: 'Operations' },
  { id: 8,  name: 'Markteintritt Schweden+Dänemark',cat: 'Sales',      start: 6, end: 11, state: 'planned', owner: 'Sales' },
  { id: 9,  name: 'CBAM-Compliance Setup',          cat: 'Compliance', start: 7, end: 10, state: 'planned', owner: 'Compliance' },
  { id: 10, name: 'Investor Round Series Seed',     cat: 'Capital',    start: 8, end: 11, state: 'planned', owner: 'CEO' },
  { id: 11, name: 'WhatsApp-Lieferanten-Integration',cat: 'Tech',      start: 8, end: 9,  state: 'planned', owner: 'Tech' },
];

const MONTHS = ['Jun','Jul','Aug','Sep','Okt','Nov','Dez','Jan','Feb','Mär','Apr','Mai'];
const TODAY_COL = 0;

// ── Market data ────────────────────────────────────────────────────────────────

interface Market {
  code: string;
  name: string;
  flag: string;
  status: string;
  priority: string;
  revenue: number;
  buyers: number;
  pipeline: number;
  desc: string;
  products: string[];
}

const MARKETS: Market[] = [
  { code: 'DE', name: 'Deutschland',    flag: '🇩🇪', status: 'active',       priority: 'core',          revenue: 312000, buyers: 4, pipeline: 180000, desc: 'Kernmarkt mit etablierten Buyer-Relationships. Fokus Specialty Coffee & Cashew.',           products: ['Cashew','Coffee','Sesame'] },
  { code: 'NL', name: 'Niederlande',    flag: '🇳🇱', status: 'active',       priority: 'core',          revenue: 86000,  buyers: 2, pipeline: 90000,  desc: 'Rotierend als Hub für Weiterverteilung in Benelux. Avocado & Macadamia.',                  products: ['Avocado','Macadamia'] },
  { code: 'FR', name: 'Frankreich',     flag: '🇫🇷', status: 'building',     priority: 'priority',      revenue: 0,      buyers: 1, pipeline: 220000, desc: 'Aktiver Markteintritt Q3 2026. Erste LOI von 2 Käufern vorhanden.',                       products: ['Coffee','Sesame','Spices'] },
  { code: 'GB', name: 'Vereinigtes Königreich', flag: '🇬🇧', status: 'active', priority: 'core',       revenue: 92000,  buyers: 2, pipeline: 60000,  desc: 'Post-Brexit stabile Lage. GBP-Risiko wird gehedgt.',                                       products: ['Cashew','Coffee'] },
  { code: 'IT', name: 'Italien',        flag: '🇮🇹', status: 'active',       priority: 'maintain',      revenue: 145000, buyers: 3, pipeline: 75000,  desc: 'Starke Nachfrage für Specialty Coffee & Macadamia. Zahlungsfristen 60-90 Tage.',          products: ['Coffee','Macadamia','Sesame'] },
  { code: 'SE', name: 'Schweden',       flag: '🇸🇪', status: 'prospecting',  priority: 'priority',      revenue: 0,      buyers: 0, pipeline: 140000, desc: 'Skandinavischer Markt hochattraktiv für Sustainability-Positionierung.',                   products: ['Coffee','Cashew'] },
  { code: 'BE', name: 'Belgien',        flag: '🇧🇪', status: 'building',     priority: 'opportunistic', revenue: 0,      buyers: 1, pipeline: 80000,  desc: 'Nähe zu Rotterdam-Hub erleichtert Logistik. Chocolatiers als Zielgruppe.',                products: ['Cashew','Sesame'] },
  { code: 'ES', name: 'Spanien',        flag: '🇪🇸', status: 'planned',      priority: 'next',          revenue: 0,      buyers: 0, pipeline: 95000,  desc: 'Country Readiness in Vorbereitung. Fokus auf Mediterranean Food Distributoren.',          products: ['Sesame','Spices'] },
  { code: 'PL', name: 'Polen',          flag: '🇵🇱', status: 'planned',      priority: 'next',          revenue: 0,      buyers: 0, pipeline: 70000,  desc: 'Wachstumsmarkt für Nüsse & Trockenfrüchte. Low-cost Eintrittsstrategie.',                products: ['Cashew','Macadamia'] },
  { code: 'CH', name: 'Schweiz',        flag: '🇨🇭', status: 'planned',      priority: 'opportunistic', revenue: 0,      buyers: 0, pipeline: 110000, desc: 'Premium-Segment für Bio & Fairtrade. Bio-Knospe Zertifizierung in Planung.',             products: ['Coffee','Cashew'] },
];

const STATUS_KIND: Record<string, string> = {
  active: 'success', building: 'warning', prospecting: 'info', planned: 'neutral',
};

const PRIORITY_KIND: Record<string, string> = {
  core: 'success', priority: 'purple', next: 'info', opportunistic: 'neutral',
};

// ── Pipeline data ──────────────────────────────────────────────────────────────

interface PipelineItem {
  name: string;
  stage: string;
  readiness: number;
  launch: string;
  revenue: string;
  supplier: string;
  tests: number;
}

const PIPELINE: PipelineItem[] = [
  { name: 'Macadamia Style 2',          stage: 'launching',  readiness: 92, launch: 'Q3 2026', revenue: '180k €',  supplier: 'Kenya Macadamia Ltd.',     tests: 4 },
  { name: 'Pekannuss-Pilot Tanzania',   stage: 'piloting',   readiness: 32, launch: 'Q1 2027', revenue: '60k €',   supplier: 'Iringa Nut Farm',          tests: 2 },
  { name: 'Specialty Microlots Coffee', stage: 'launching',  readiness: 78, launch: 'Q3 2026', revenue: '220k €',  supplier: 'Kilimo Arusha',            tests: 5 },
  { name: 'Black Sesame',               stage: 'research',   readiness: 18, launch: 'Q2 2027', revenue: '40k €',   supplier: 'TBD',                      tests: 1 },
  { name: 'Bird-Eye Chili',             stage: 'piloting',   readiness: 48, launch: 'Q4 2026', revenue: '35k €',   supplier: 'Mtwara Agri Co-op',        tests: 2 },
  { name: 'Cassava Flour',              stage: 'research',   readiness: 22, launch: 'Q2 2027', revenue: '55k €',   supplier: 'TBD',                      tests: 1 },
  { name: 'Vanille Madagaskar',         stage: 'evaluating', readiness: 8,  launch: 'Q3 2027', revenue: '90k €',   supplier: 'Madagascar Vanilla Coop',  tests: 0 },
  { name: 'Hibiskusblüten',             stage: 'piloting',   readiness: 38, launch: 'Q1 2027', revenue: '28k €',   supplier: 'Dodoma Flower Farms',      tests: 2 },
];

const STAGE_KIND: Record<string, string> = {
  research: 'neutral', evaluating: 'info', piloting: 'warning', launching: 'success',
};

// ── Country Readiness data ─────────────────────────────────────────────────────

interface CheckItem {
  text: string;
  status: 'done' | 'progress' | 'open' | 'parked';
}

interface CheckSection {
  title: string;
  items: CheckItem[];
}

interface CountryData {
  code: string;
  name: string;
  flag: string;
  target: string;
  sections: CheckSection[];
}

const COUNTRIES: CountryData[] = [
  {
    code: 'ES', name: 'Spanien', flag: '🇪🇸', target: 'Q4 2026',
    sections: [
      { title: 'Steuer & Recht', items: [
        { text: 'Steuerliche Registrierung geprüft', status: 'done' },
        { text: 'Vertragsvorlagen Spanisch-Recht', status: 'done' },
        { text: 'Zollnummer EU importiert', status: 'progress' },
        { text: 'EORI Nummer beantragt', status: 'done' },
      ]},
      { title: 'Compliance & Zoll', items: [
        { text: 'HS-Code Mapping ES abgeschlossen', status: 'done' },
        { text: 'Pestizidgrenzwerte validiert', status: 'progress' },
        { text: 'Phytosanitäres Zertifikat Spanien', status: 'open' },
      ]},
      { title: 'Logistik', items: [
        { text: 'Spediteur Valencia/Barcelona identifiziert', status: 'done' },
        { text: 'Lager-/Cross-Dock Partner', status: 'progress' },
        { text: 'Incoterm-Konditionen finalisiert', status: 'open' },
      ]},
      { title: 'Sales & Marketing', items: [
        { text: '3 Buyer-Kontakte qualifiziert', status: 'done' },
        { text: 'Preisliste ES erstellt', status: 'done' },
        { text: 'Messebesuch Alimentaria vorgemerkt', status: 'progress' },
        { text: 'Spanischsprachige Produktdatenblätter', status: 'open' },
      ]},
      { title: 'Banking & Payments', items: [
        { text: 'EUR-Konto vorhanden', status: 'done' },
        { text: 'LC-Linie für ES Käufer eingerichtet', status: 'open' },
      ]},
    ],
  },
  {
    code: 'PL', name: 'Polen', flag: '🇵🇱', target: 'Q1 2027',
    sections: [
      { title: 'Steuer & Recht', items: [
        { text: 'Steuerliche Registrierung geprüft', status: 'done' },
        { text: 'Vertragsvorlagen Polnisch-Recht', status: 'open' },
        { text: 'Zollnummer EU importiert', status: 'progress' },
        { text: 'EORI Nummer beantragt', status: 'done' },
      ]},
      { title: 'Compliance & Zoll', items: [
        { text: 'HS-Code Mapping PL abgeschlossen', status: 'progress' },
        { text: 'Pestizidgrenzwerte validiert', status: 'open' },
        { text: 'Phytosanitäres Zertifikat Polen', status: 'open' },
      ]},
      { title: 'Logistik', items: [
        { text: 'Spediteur Gdańsk/Warschau identifiziert', status: 'progress' },
        { text: 'Lager-/Cross-Dock Partner', status: 'open' },
        { text: 'Incoterm-Konditionen finalisiert', status: 'open' },
      ]},
      { title: 'Sales & Marketing', items: [
        { text: '3 Buyer-Kontakte qualifiziert', status: 'progress' },
        { text: 'Preisliste PL erstellt', status: 'open' },
        { text: 'Polensprachige Produktdatenblätter', status: 'open' },
        { text: 'Handelsvertreter identifiziert', status: 'parked' },
      ]},
      { title: 'Banking & Payments', items: [
        { text: 'EUR-Konto vorhanden', status: 'done' },
        { text: 'PLN-Hedging Strategie definiert', status: 'open' },
      ]},
    ],
  },
  {
    code: 'CH', name: 'Schweiz', flag: '🇨🇭', target: 'Q2 2027',
    sections: [
      { title: 'Steuer & Recht', items: [
        { text: 'Schweizer Mehrwertsteuerpflicht geprüft', status: 'open' },
        { text: 'Vertragsvorlagen CH-Recht', status: 'open' },
        { text: 'Importeur-Zulassung CH', status: 'open' },
        { text: 'EORI äquivalent CH', status: 'open' },
      ]},
      { title: 'Compliance & Zoll', items: [
        { text: 'Zolltarife CH geprüft', status: 'progress' },
        { text: 'Bio-Knospe Anforderungen analysiert', status: 'progress' },
        { text: 'Phytosanitäres Zertifikat CH', status: 'open' },
      ]},
      { title: 'Logistik', items: [
        { text: 'Spediteur Basel identifiziert', status: 'open' },
        { text: 'Lager CH', status: 'open' },
        { text: 'Incoterm-Konditionen', status: 'open' },
      ]},
      { title: 'Sales & Marketing', items: [
        { text: 'Buyer Research CH abgeschlossen', status: 'progress' },
        { text: 'Preisliste CHF erstellt', status: 'open' },
        { text: 'Bio-Knospe Zertifizierungsplan', status: 'open' },
        { text: 'Messebesuch Anuga FoodTec', status: 'parked' },
      ]},
      { title: 'Banking & Payments', items: [
        { text: 'CHF-Konto geprüft', status: 'open' },
        { text: 'Währungsrisiko CHF definiert', status: 'open' },
      ]},
    ],
  },
  {
    code: 'DK', name: 'Dänemark', flag: '🇩🇰', target: 'Q3 2027',
    sections: [
      { title: 'Steuer & Recht', items: [
        { text: 'Steuerliche Registrierung geprüft', status: 'open' },
        { text: 'Vertragsvorlagen DK-Recht', status: 'open' },
        { text: 'EORI Nummer beantragt', status: 'open' },
        { text: 'Importeur-Zulassung DK', status: 'open' },
      ]},
      { title: 'Compliance & Zoll', items: [
        { text: 'HS-Code Mapping DK', status: 'open' },
        { text: 'Pestizidgrenzwerte DK', status: 'open' },
        { text: 'Phytosanitäres Zertifikat DK', status: 'open' },
      ]},
      { title: 'Logistik', items: [
        { text: 'Spediteur Kopenhagen', status: 'open' },
        { text: 'Lager DK', status: 'open' },
        { text: 'Incoterm DK', status: 'open' },
      ]},
      { title: 'Sales & Marketing', items: [
        { text: 'Buyer Research DK', status: 'parked' },
        { text: 'Preisliste DKK', status: 'open' },
        { text: 'Dänischsprachige Materialien', status: 'open' },
        { text: 'Messeplanung Nordic Organic', status: 'parked' },
      ]},
      { title: 'Banking & Payments', items: [
        { text: 'DKK-Konto geprüft', status: 'open' },
        { text: 'DKK-Hedging Strategie', status: 'open' },
      ]},
    ],
  },
];

// ── Competitor data ────────────────────────────────────────────────────────────

interface Competitor {
  name: string;
  country: string;
  focus: string;
  tier: string;
  strength: string;
  weakness: string;
  threat: string;
}

const COMPETITORS: Competitor[] = [
  { name: 'East African Commodity Brokers', country: 'Kenya',   focus: 'Coffee + Cashew',       tier: 'B', strength: 'Preisführerschaft',          weakness: 'Dokumentenqualität',   threat: 'medium' },
  { name: 'Afri-Export GmbH',              country: 'Germany',  focus: 'All-round',              tier: 'A', strength: 'EU-Netzwerk',               weakness: 'Margen dünn',          threat: 'high' },
  { name: 'Tanzania Commodity Exchange',   country: 'Tanzania', focus: 'Bulk Commodities',       tier: 'C', strength: 'Volumen',                    weakness: 'Langsame Docs',        threat: 'low' },
  { name: 'Nordic Agri Imports',           country: 'Sweden',   focus: 'Nüsse + Coffee',         tier: 'B', strength: 'Skandinavisches Netzwerk',  weakness: 'Afrika-Footprint',     threat: 'medium' },
  { name: 'Atlas Trading House',           country: 'Morocco',  focus: 'Nordafrika + Gewürze',   tier: 'B', strength: 'Mediterranean',             weakness: 'Kein East Africa',     threat: 'low' },
];

const THREAT_KIND: Record<string, string> = { high: 'danger', medium: 'warning', low: 'success' };
const TIER_KIND: Record<string, string> = { A: 'danger', B: 'warning', C: 'neutral' };

// ── Main component ─────────────────────────────────────────────────────────────

export const StrategyView = ({ lang }: StrategyViewProps) => {
  const [tab, setTab] = useState('okr');
  const [selectedCountry, setSelectedCountry] = useState('ES');

  const tabs = [
    { id: 'okr',      label: 'OKRs',               icon: 'task' },
    { id: 'roadmap',  label: '12-Monats-Roadmap',   icon: 'activity' },
    { id: 'markets',  label: 'Markt-Expansion',     icon: 'map' },
    { id: 'products', label: 'Produkt-Pipeline',    icon: 'product' },
    { id: 'country',  label: 'Country Readiness',   icon: 'flag' },
    { id: 'compete',  label: 'Competitor Intel',     icon: 'chart' },
  ];

  // Overall OKR progress
  const allKRs = OBJECTIVES.flatMap(o => o.krs);
  const overallProgress = Math.round(allKRs.reduce((s, kr) => s + krProgress(kr), 0) / allKRs.length);

  const circ = 213.6;
  const ringDash = (overallProgress / 100) * circ;

  return (
    <div>
      <div className="section-head">
        <h1>Strategy Hub</h1>
        <div className="sub">OKRs · Roadmap · Markt-Expansion · Produkt-Pipeline · Country Readiness · Competitor Intel</div>
      </div>

      {/* Tab bar */}
      <div style={{ padding: '0 16px 4px', display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
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

        {/* ── TAB: OKRs ─────────────────────────────────────────────────────── */}
        {tab === 'okr' && (
          <div>
            {/* Header ring card */}
            <div className="card" style={{ marginBottom: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <svg width={80} height={80} viewBox="0 0 80 80">
                  <circle cx={40} cy={40} r={34} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
                  <circle
                    cx={40} cy={40} r={34} fill="none"
                    stroke="#a78bfa" strokeWidth={8}
                    strokeDasharray={`${ringDash} ${circ - ringDash}`}
                    strokeDashoffset={0}
                    transform="rotate(-90 40 40)"
                    strokeLinecap="round"
                  />
                  <text x={40} y={45} textAnchor="middle" fill="white" fontSize={16} fontWeight={700} fontFamily="var(--font-mono)">{overallProgress}%</text>
                </svg>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>5 Objectives · 19 Key Results · Ø {overallProgress}% Fortschritt</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                    <span style={{ color: '#34d399' }}>● 3 on track</span>
                    <span style={{ color: '#fbbf24' }}>● 2 needs focus</span>
                    <span style={{ color: '#f87171' }}>● 0 at risk</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Objective cards */}
            {OBJECTIVES.map(obj => {
              const prog = Math.round(objProgress(obj));
              return (
                <div key={obj.id} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span className="mono fw700" style={{ color: '#a78bfa', fontSize: 12, minWidth: 24 }}>{obj.id}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{obj.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Warum: {obj.why}</div>
                    </div>
                    <Badge kind={prog >= 80 ? 'success' : prog >= 50 ? 'warning' : 'danger'}>{prog}%</Badge>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 80, textAlign: 'right' }}>{obj.owner}</span>
                  </div>
                  <div style={{ padding: '8px 16px' }}>
                    {obj.krs.map((kr, ki) => {
                      const p = Math.round(krProgress(kr));
                      return (
                        <div key={ki} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '5px 0', borderBottom: ki < obj.krs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          <span className="mono" style={{ fontSize: 10, color: 'var(--text-3)', minWidth: 28 }}>{kr.id}</span>
                          <span style={{ flex: 1, fontSize: 12 }}>{kr.text}</span>
                          <span className="mono" style={{ fontSize: 11, color: 'var(--text-2)', minWidth: 90, textAlign: 'right' }}>
                            {kr.cur}{kr.unit} / {kr.target}{kr.unit}
                          </span>
                          <div className="progress" style={{ width: 80 }}>
                            <div style={{ width: p + '%', background: p >= 80 ? '#34d399' : p >= 50 ? '#fbbf24' : '#f87171' }} />
                          </div>
                          <span className="mono" style={{ fontSize: 10, color: 'var(--text-3)', minWidth: 30, textAlign: 'right' }}>{p}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TAB: Roadmap ──────────────────────────────────────────────────── */}
        {tab === 'roadmap' && (
          <div>
            <div className="card" style={{ marginBottom: 12, overflowX: 'auto' }}>
              <div className="card-head">
                <Ic name="activity" size={14} />
                <span className="title">12-Monats-Roadmap — Gantt</span>
                <span className="meta">Jun 2026 – Mai 2027</span>
              </div>
              <div style={{ overflowX: 'auto', padding: '0 0 8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '280px repeat(12, 1fr)', minWidth: 900, fontSize: 11 }}>
                  {/* Header row */}
                  <div style={{ padding: '6px 12px', color: 'var(--text-3)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Initiative</div>
                  {MONTHS.map((m, i) => (
                    <div key={i} style={{
                      padding: '6px 4px',
                      textAlign: 'center',
                      color: i === TODAY_COL ? '#60a5fa' : 'var(--text-3)',
                      fontWeight: i === TODAY_COL ? 700 : 400,
                      borderBottom: '1px solid var(--border)',
                      borderLeft: i === TODAY_COL ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.04)',
                      fontSize: 10,
                    }}>
                      {m}
                    </div>
                  ))}

                  {/* Gantt rows */}
                  {GANTT_ITEMS.map(item => {
                    const color = GANTT_COLORS[item.cat] || '#888';
                    const opacities: Record<string, string> = { done: 'cc', active: 'e6', planned: '66' };
                    const opx = opacities[item.state];

                    return (
                      <React.Fragment key={item.id}>
                        <div style={{
                          padding: '6px 12px',
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                          <span style={{ fontSize: 11.5 }}>{item.name}</span>
                        </div>
                        {MONTHS.map((_, mi) => {
                          const inBar = mi >= item.start && mi < item.end;
                          const isFirst = mi === item.start;
                          const isLast = mi === item.end - 1;
                          return (
                            <div
                              key={mi}
                              style={{
                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                                borderLeft: mi === TODAY_COL ? '2px solid rgba(96,165,250,0.3)' : '1px solid rgba(255,255,255,0.02)',
                                padding: '4px 2px',
                                display: 'flex', alignItems: 'center',
                              }}
                            >
                              {inBar && (
                                <div style={{
                                  height: 16,
                                  width: '100%',
                                  background: color + opx,
                                  borderRadius: isFirst && isLast ? 4 : isFirst ? '4px 0 0 4px' : isLast ? '0 4px 4px 0' : 0,
                                }} />
                              )}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, padding: '8px 12px', fontSize: 11, flexWrap: 'wrap', borderTop: '1px solid var(--border)' }}>
                {Object.entries(GANTT_COLORS).map(([cat, color]) => (
                  <span key={cat} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
                    {cat}
                  </span>
                ))}
                <span style={{ marginLeft: 'auto', color: 'var(--text-3)' }}>
                  <span style={{ opacity: 0.8 }}>■</span> Abgeschlossen &nbsp;
                  <span style={{ opacity: 0.6 }}>■</span> Aktiv &nbsp;
                  <span style={{ opacity: 0.4 }}>■</span> Geplant
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Markets ──────────────────────────────────────────────────── */}
        {tab === 'markets' && (
          <div>
            {/* Revenue distribution */}
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="card-head">
                <Ic name="chart" size={14} />
                <span className="title">Umsatz-Verteilung — Aktive Märkte</span>
              </div>
              <div className="card-body">
                {MARKETS.filter(m => m.revenue > 0).map((m, i) => {
                  const total = MARKETS.reduce((s, x) => s + x.revenue, 0);
                  const pct = Math.round((m.revenue / total) * 100);
                  return (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                        <span>{m.flag} {m.name}</span>
                        <span className="mono fw500">{fmtCur(m.revenue)} · {pct}%</span>
                      </div>
                      <div className="progress">
                        <div style={{ width: pct + '%', background: '#3b82f6' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Market cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {MARKETS.map((m, i) => (
                <div key={i} className="card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 22 }}>{m.flag}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{m.code}</div>
                    </div>
                    <Badge kind={STATUS_KIND[m.status] || 'neutral'}>{m.status}</Badge>
                    <Badge kind={PRIORITY_KIND[m.priority] || 'neutral'}>{m.priority}</Badge>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 8 }}>
                    {[
                      { l: 'Umsatz', v: fmtCur(m.revenue) },
                      { l: 'Käufer', v: String(m.buyers) },
                      { l: 'Pipeline', v: fmtCur(m.pipeline) },
                    ].map((kpi, ki) => (
                      <div key={ki} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '6px 8px' }}>
                        <div style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.l}</div>
                        <div className="mono fw500" style={{ fontSize: 12 }}>{kpi.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 8, lineHeight: 1.5 }}>{m.desc}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {m.products.map((p, pi) => (
                      <Badge key={pi} kind="neutral">{p}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: Products Pipeline ────────────────────────────────────────── */}
        {tab === 'products' && (
          <div>
            {/* Stage KPI tiles */}
            {(() => {
              const stages = ['research', 'evaluating', 'piloting', 'launching'];
              const stageCounts = stages.map(s => ({ stage: s, count: PIPELINE.filter(p => p.stage === s).length }));
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
                  {stageCounts.map((sc, i) => (
                    <div key={i} className="card" style={{ padding: 14 }}>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: 4 }}>{sc.stage}</div>
                      <div className="mono fw700" style={{ fontSize: 28 }}>{sc.count}</div>
                      <Badge kind={STAGE_KIND[sc.stage] || 'neutral'}>{sc.stage}</Badge>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Pipeline table */}
            <div className="card">
              <div className="card-head">
                <Ic name="product" size={14} />
                <span className="title">Produkt-Pipeline</span>
                <span className="meta">{PIPELINE.length} Produkte</span>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Produkt</th>
                    <th>Stage</th>
                    <th>Readiness</th>
                    <th>Launch-Fenster</th>
                    <th className="num">Umsatz-Erwartung</th>
                    <th>Lieferant</th>
                    <th className="num">Tests</th>
                  </tr>
                </thead>
                <tbody>
                  {PIPELINE.map((p, i) => (
                    <tr key={i}>
                      <td className="fw500">{p.name}</td>
                      <td><Badge kind={STAGE_KIND[p.stage] || 'neutral'}>{p.stage}</Badge></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress" style={{ width: 80 }}>
                            <div style={{ width: p.readiness + '%', background: p.readiness >= 70 ? '#34d399' : p.readiness >= 40 ? '#fbbf24' : '#a78bfa' }} />
                          </div>
                          <span className="mono" style={{ fontSize: 11 }}>{p.readiness}%</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>{p.launch}</td>
                      <td className="num mono fw500">{p.revenue}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-2)' }}>{p.supplier}</td>
                      <td className="num mono">{p.tests}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB: Country Readiness ────────────────────────────────────────── */}
        {tab === 'country' && (
          <div>
            {/* Country selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
              {COUNTRIES.map(c => {
                const allItems = c.sections.flatMap(s => s.items);
                const done = allItems.filter(i => i.status === 'done').length;
                const prog = allItems.filter(i => i.status === 'progress').length;
                const total = allItems.length;
                const pct = Math.round(((done + prog * 0.5) / total) * 100);
                const isActive = selectedCountry === c.code;
                return (
                  <div
                    key={c.code}
                    onClick={() => setSelectedCountry(c.code)}
                    className="card"
                    style={{
                      padding: 14, cursor: 'pointer',
                      border: isActive ? '2px solid #a78bfa' : '1px solid var(--border)',
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{c.flag}</div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>Ziel: {c.target}</div>
                    <div className="progress">
                      <div style={{ width: pct + '%', background: '#a78bfa' }} />
                    </div>
                    <div className="mono" style={{ fontSize: 10, marginTop: 3, color: 'var(--text-3)' }}>{pct}% · {done}/{total}</div>
                  </div>
                );
              })}
            </div>

            {/* Checklist for selected country */}
            {(() => {
              const country = COUNTRIES.find(c => c.code === selectedCountry);
              if (!country) return null;
              const allItems = country.sections.flatMap(s => s.items);
              const done = allItems.filter(i => i.status === 'done').length;
              const prog = allItems.filter(i => i.status === 'progress').length;
              const openCount = allItems.filter(i => i.status === 'open').length;

              const statusIcon = (status: string) => {
                if (status === 'done')     return <span style={{ color: '#34d399', fontSize: 14 }}>✓</span>;
                if (status === 'progress') return <span style={{ color: '#fbbf24', fontSize: 10 }}>●</span>;
                if (status === 'parked')   return <span style={{ color: '#60a5fa', fontSize: 10 }}>●</span>;
                return <span style={{ color: 'var(--text-3)', fontSize: 10 }}>●</span>;
              };

              return (
                <div className="card">
                  <div className="card-head">
                    <span style={{ fontSize: 18 }}>{country.flag}</span>
                    <span className="title">{country.name} — Readiness Checklist</span>
                    <span className="meta">Ziel: {country.target}</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontSize: 12 }}>
                      <span style={{ color: '#34d399' }}>✓ {done} Done</span>
                      <span style={{ color: '#fbbf24' }}>● {prog} In Progress</span>
                      <span style={{ color: 'var(--text-3)' }}>● {openCount} Open</span>
                    </div>
                  </div>
                  <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {country.sections.map((section, si) => (
                      <div key={si}>
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
                          {section.title}
                        </div>
                        {section.items.map((item, ii) => (
                          <div key={ii} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                            <span style={{ width: 16, textAlign: 'center', flexShrink: 0 }}>{statusIcon(item.status)}</span>
                            <span style={{ fontSize: 12, color: item.status === 'done' ? 'var(--text-2)' : item.status === 'parked' ? 'var(--text-3)' : 'var(--text-1)' }}>
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

        {/* ── TAB: Competitor Intel ─────────────────────────────────────────── */}
        {tab === 'compete' && (
          <div>
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="card-head">
                <Ic name="chart" size={14} />
                <span className="title">Wettbewerber-Analyse</span>
                <span className="meta">{COMPETITORS.length} Wettbewerber getrackt</span>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Wettbewerber</th>
                    <th>Land</th>
                    <th>Fokus</th>
                    <th>Tier</th>
                    <th>Stärke</th>
                    <th>Schwäche</th>
                    <th>Bedrohungslevel</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPETITORS.map((c, i) => (
                    <tr key={i}>
                      <td className="fw500">{c.name}</td>
                      <td style={{ fontSize: 12 }}>{c.country}</td>
                      <td style={{ fontSize: 12 }}>{c.focus}</td>
                      <td><Badge kind={TIER_KIND[c.tier] || 'neutral'}>Tier {c.tier}</Badge></td>
                      <td style={{ fontSize: 12, color: '#34d399' }}>{c.strength}</td>
                      <td style={{ fontSize: 12, color: '#fbbf24' }}>{c.weakness}</td>
                      <td><Badge kind={THREAT_KIND[c.threat] || 'neutral'}>{c.threat}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* AI analysis */}
            <div className="card" style={{ padding: 16 }}>
              <div className="card-head" style={{ padding: '0 0 10px', marginBottom: 10, borderBottom: '1px solid var(--border)' }}>
                <Ic name="sparkle" size={14} color="#a78bfa" />
                <span className="title">KI-Wettbewerbs-Analyse</span>
              </div>
              <p style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--text-2)', margin: 0 }}>
                Das kompetitive Umfeld im ostafrika-europäischen Agrargüterhandel wird von Afri-Export GmbH
                als Tier-A-Wettbewerber dominiert, der starke EU-Netzwerke nutzt, jedoch unter dünnen Margen
                leidet — ein strukturelles Differenzierungspotenzial für EastAfrica Export OS durch
                Premiumpositionierung und EUDR-Compliance-Leadership. East African Commodity Brokers
                konkurriert primär über Preis mit schwacher Dokumentenqualität, was unsere Stärke in
                transparenter Rückverfolgbarkeit und digitalem Dokumentenmanagement hervorhebt.
                Nordic Agri Imports repräsentiert die größte strategische Bedrohung für die
                Skandinavien-Expansion (SE/DK), da das Netzwerk bereits etabliert ist — jedoch ohne
                eigene ostafrikanische Sourcing-Kapazität. Tanzania Commodity Exchange und Atlas Trading House
                sind als Tier-B/C-Akteure weniger bedrohlich, bieten aber Kooperationspotenzial für
                Spot-Transaktionen und regionale Marktinformationen.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

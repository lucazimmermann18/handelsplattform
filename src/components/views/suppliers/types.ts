// ── Export Readiness ──────────────────────────────────────────────────────────
export type ExportReadiness =
  | 'not_ready' | 'in_prep' | 'sample_ready'
  | 'deal_ready' | 'fully_ready' | 'strategic';

export interface ScorecardEntry { score: number; notes?: string; }

export interface OnboardingItem {
  id: string;
  label: string;
  category: string;
  done: boolean;
  notes?: string;
}

export interface DevStep {
  id: string;
  title: string;
  owner?: string;
  due?: string;
  status: 'open' | 'in_progress' | 'done';
  priority?: 'hoch' | 'mittel' | 'niedrig';
  notes?: string;
}

// ── Supplier type taxonomy ─────────────────────────────────────────────────────
export type SupplierType =
  | 'Einzelbauer' | 'Kooperative' | 'Sammelstelle'
  | 'Lokaler Händler' | 'Verarbeiter' | 'Exporteur'
  | 'Farmnetzwerk' | 'Produktionspartner' | 'Zwischenhändler';

export type DocLevel = 1 | 2 | 3 | 4;
export type TrustLevel = 'hoch' | 'mittel' | 'niedrig' | 'neu';
export type EUDRStatus = 'konform' | 'in_pruefung' | 'nicht_konform' | 'nicht_relevant';
export type DeforestationRisk = 'niedrig' | 'mittel' | 'hoch' | 'unbekannt';
export type LandOwnership = 'Eigentum' | 'Pacht' | 'Gemischt';
export type RiskLevel = 'niedrig' | 'mittel' | 'hoch';
export type QualityConsistency = 'hoch' | 'mittel' | 'niedrig';

// ── Sub-interfaces ─────────────────────────────────────────────────────────────
export interface RiskItem {
  category: string;
  level: RiskLevel;
  description: string;
  mitigation: string;
}

export interface CertEntry {
  name: string;
  issuer: string;
  validFrom: string;
  validUntil: string;
  docLevel: DocLevel;
  notes: string;
}

// ── SupplierMaster ─────────────────────────────────────────────────────────────
export interface SupplierMaster {
  // Farm & Betrieb
  farmSize?: string;
  plotCount?: string;
  employees?: string;
  familyBusiness?: boolean;
  landOwnership?: LandOwnership;
  crops?: string;
  harvestSeason?: string;
  annualCapacity?: string;
  hasIrrigation?: boolean;
  hasProcessing?: boolean;
  hasStorage?: boolean;
  hasElectricity?: boolean;
  hasInternet?: boolean;
  hasTransport?: boolean;
  processingDescription?: string;
  storageDescription?: string;
  infrastructureNotes?: string;

  // Geo & EUDR
  gpsLat?: string;
  gpsLon?: string;
  gpsVerified?: boolean;
  gpsVerifiedDate?: string;
  gpsVerifiedBy?: string;
  eudrStatus?: EUDRStatus;
  eudrDeclared?: boolean;
  eudrDeclarationDate?: string;
  deforestationRisk?: DeforestationRisk;
  deforestationNotes?: string;
  landUseSince?: string;
  nearProtectedArea?: boolean;
  geoNotes?: string;

  // Compliance & Dokumente
  docLevel?: DocLevel;
  exportLicense?: string;
  exportLicenseExpiry?: string;
  bankVerified?: boolean;
  taxIdVerified?: boolean;
  registrationVerified?: boolean;
  certs?: CertEntry[];
  complianceNotes?: string;

  // Vertrauen & Beziehung
  trustLevel?: TrustLevel;
  whatsappPreferred?: boolean;
  preferredContactTime?: string;
  languages?: string;
  partnerSince?: string;
  visitFrequency?: string;
  lastVisitDate?: string;
  strengthsNotes?: string;
  weaknessesNotes?: string;
  culturalNotes?: string;
  localReferences?: string;

  // Risiko
  risks?: RiskItem[];
  overallRiskNotes?: string;

  // Qualität (Durchschnitt)
  avgMoisture?: string;
  avgDefectRate?: string;
  avgBeanSize?: string;
  qualityConsistency?: QualityConsistency;
  qualityNotes?: string;

  // Sourcing & Supplier Development
  exportReadiness?: ExportReadiness;
  scorecard?: Record<string, ScorecardEntry>;
  onboardingItems?: OnboardingItem[];
  devSteps?: DevStep[];
  developmentNotes?: string;
}

// ── Lookup maps ────────────────────────────────────────────────────────────────
export const SUPPLIER_TYPES: SupplierType[] = [
  'Einzelbauer', 'Kooperative', 'Sammelstelle', 'Lokaler Händler',
  'Verarbeiter', 'Exporteur', 'Farmnetzwerk', 'Produktionspartner', 'Zwischenhändler',
];

export const DOC_LEVEL_MAP: Record<DocLevel, { label: string; kind: string; desc: string }> = {
  1: { label: 'Level 1 · Vollständig',     kind: 'success', desc: 'Alle Dokumente vollständig extern verifiziert' },
  2: { label: 'Level 2 · Teilweise',       kind: 'warning', desc: 'Dokumente teilweise vorhanden, Prüfung läuft' },
  3: { label: 'Level 3 · Lokal bestätigt', kind: 'info',    desc: 'Nur lokal bestätigt, noch nicht extern verifiziert' },
  4: { label: 'Level 4 · Unbestätigt',     kind: 'danger',  desc: 'Noch unbestätigt — Sofortmaßnahme erforderlich' },
};

export const TRUST_LEVEL_MAP: Record<TrustLevel, { label: string; kind: string; color: string }> = {
  hoch:    { label: 'Hohes Vertrauen',     kind: 'success', color: '#34d399' },
  mittel:  { label: 'Mittleres Vertrauen', kind: 'warning', color: '#fbbf24' },
  niedrig: { label: 'Geringes Vertrauen',  kind: 'danger',  color: '#f87171' },
  neu:     { label: 'Neuer Partner',       kind: 'neutral', color: '#94a3b8' },
};

export const EUDR_STATUS_MAP: Record<EUDRStatus, { label: string; kind: string }> = {
  konform:        { label: 'EUDR-konform',    kind: 'success' },
  in_pruefung:    { label: 'In Prüfung',      kind: 'warning' },
  nicht_konform:  { label: 'Nicht konform',   kind: 'danger'  },
  nicht_relevant: { label: 'Nicht relevant',  kind: 'neutral' },
};

export const RISK_CATEGORIES = [
  'Ernte & Produktion', 'Qualität', 'Logistik & Transport',
  'Währung & Preise', 'Compliance & Dokumente', 'Kommunikation',
  'Politik & Sicherheit', 'Klima & Natur', 'Reputation',
];

// ── Export Readiness constants ─────────────────────────────────────────────────
export const EXPORT_READINESS_STAGES: {
  key: ExportReadiness; label: string; shortLabel: string; desc: string; color: string;
}[] = [
  { key: 'not_ready',    label: 'Nicht bereit',        shortLabel: 'Nicht bereit',  desc: 'Lieferant erfüllt noch keine Mindestanforderungen für den Export.', color: '#f87171' },
  { key: 'in_prep',      label: 'In Vorbereitung',     shortLabel: 'Vorbereitung',  desc: 'Aktiver Aufbau läuft — Daten, Dokumente und Kapazitäten werden aufgebaut.', color: '#fb923c' },
  { key: 'sample_ready', label: 'Musterfähig',         shortLabel: 'Musterfähig',   desc: 'Kann Muster in Exportqualität liefern. Prozesse und QC etabliert.', color: '#fbbf24' },
  { key: 'deal_ready',   label: 'Deal-fähig',          shortLabel: 'Deal-fähig',    desc: 'Kann erste Exportaufträge abwickeln. Dokumente, Mengen und Qualität vorhanden.', color: '#a3e635' },
  { key: 'fully_ready',  label: 'Voll exportfähig',    shortLabel: 'Exportfähig',   desc: 'Vollständig zertifiziert, verlässlich, skalierbar. Jederzeit exportbereit.', color: '#34d399' },
  { key: 'strategic',    label: 'Strategischer Partner',shortLabel: 'Strategisch',  desc: 'Kernanker der Lieferkette. Langfristige Partnerschaft mit bevorzugten Konditionen.', color: '#60a5fa' },
];

export const READINESS_MAP: Record<ExportReadiness, { label: string; color: string; kind: string }> = {
  not_ready:    { label: 'Nicht bereit',         color: '#f87171', kind: 'danger'  },
  in_prep:      { label: 'In Vorbereitung',      color: '#fb923c', kind: 'warning' },
  sample_ready: { label: 'Musterfähig',          color: '#fbbf24', kind: 'warning' },
  deal_ready:   { label: 'Deal-fähig',           color: '#a3e635', kind: 'success' },
  fully_ready:  { label: 'Voll exportfähig',     color: '#34d399', kind: 'success' },
  strategic:    { label: 'Strategischer Partner',color: '#60a5fa', kind: 'info'    },
};

export const SCORECARD_CRITERIA: {
  key: string; label: string; desc: string; icon: string;
}[] = [
  { key: 'quality',       label: 'Produktqualität',       desc: 'Konsistenz, Sortierung, Feuchte, Sortierung, Defekte', icon: 'star'    },
  { key: 'reliability',   label: 'Zuverlässigkeit',       desc: 'Liefertreue, Mengeneinhaltung, Pünktlichkeit',         icon: 'clock'   },
  { key: 'documentation', label: 'Dokumentationsfähigkeit',desc: 'Vollständigkeit, Qualität, Aktualität von Dokumenten', icon: 'doc'     },
  { key: 'delivery',      label: 'Lieferfähigkeit',       desc: 'Kapazität, Logistik, Verfügbarkeit zu Erntezeiten',    icon: 'box'     },
  { key: 'pricing',       label: 'Preisniveau',           desc: 'Wettbewerbsfähigkeit, Transparenz, Stabilität',        icon: 'finance' },
  { key: 'communication', label: 'Kommunikation',         desc: 'Erreichbarkeit, Reaktionszeit, Klarheit',               icon: 'mail'    },
  { key: 'sustainability',label: 'Nachhaltigkeit',        desc: 'Umweltpraktiken, Fairness, soziale Verantwortung',      icon: 'leaf'    },
  { key: 'compliance',    label: 'Compliance-Risiko',     desc: 'Regulatorik, Zertifikate, EUDR, Exportrecht',           icon: 'shield'  },
  { key: 'eudr',          label: 'EUDR-Datenqualität',    desc: 'GPS-Daten, Landzuordnung, Deforestationsnachweis',      icon: 'map'     },
  { key: 'fraud',         label: 'Zahlung & Betrugsrisiko',desc: 'Bank-Verifikation, Identität, Referenzen, Reputation', icon: 'alert'   },
];

export const DEFAULT_ONBOARDING_ITEMS: { id: string; label: string; category: string }[] = [
  // Stammdaten
  { id: 'ob_masterdata',   label: 'Stammdaten vollständig erfasst',              category: 'Stammdaten' },
  { id: 'ob_identity',     label: 'Identität verifiziert (Ausweis / Pass)',       category: 'Stammdaten' },
  { id: 'ob_bank',         label: 'Bankdaten verifiziert',                        category: 'Stammdaten' },
  { id: 'ob_taxid',        label: 'Steuer-ID / Registrierung geprüft',            category: 'Stammdaten' },
  // Farm & Kapazität
  { id: 'ob_gps',          label: 'Farm-GPS koordinaten erfasst',                 category: 'Farm & Kapazität' },
  { id: 'ob_farmsize',     label: 'Farmgröße dokumentiert',                       category: 'Farm & Kapazität' },
  { id: 'ob_capacity',     label: 'Produktionskapazität plausibel geprüft',       category: 'Farm & Kapazität' },
  { id: 'ob_photos',       label: 'Fotos der Farm / des Betriebs vorhanden',      category: 'Farm & Kapazität' },
  // Qualität
  { id: 'ob_sample',       label: 'Qualitätsmuster gesendet und bewertet',        category: 'Qualität' },
  { id: 'ob_qstandard',    label: 'Qualitätsstandards erklärt und bestätigt',     category: 'Qualität' },
  { id: 'ob_packaging',    label: 'Verpackungsvorgaben abgestimmt',               category: 'Qualität' },
  // Export & Compliance
  { id: 'ob_exportexp',    label: 'Exporterfahrung dokumentiert / abgefragt',     category: 'Export & Compliance' },
  { id: 'ob_certs',        label: 'Zertifizierungen geprüft (Bio, FT, EUDR…)',    category: 'Export & Compliance' },
  { id: 'ob_exportlic',    label: 'Exportlizenz vorhanden / nicht erforderlich',  category: 'Export & Compliance' },
  // Partnerschaft
  { id: 'ob_moq',          label: 'Mindestmengen bestätigt',                      category: 'Partnerschaft' },
  { id: 'ob_references',   label: 'Referenzen eingeholt',                         category: 'Partnerschaft' },
  { id: 'ob_contract',     label: 'Rahmenvertrag / LOI unterzeichnet',            category: 'Partnerschaft' },
];

// ── Trust Score ────────────────────────────────────────────────────────────────
export function calcTrustScore(master: SupplierMaster): number {
  let s = 0;
  if (master.gpsVerified)       s += 15;
  const dl = master.docLevel ?? 4;
  s += dl === 1 ? 25 : dl === 2 ? 15 : dl === 3 ? 8 : 0;
  const tl = master.trustLevel;
  s += tl === 'hoch' ? 20 : tl === 'mittel' ? 12 : tl === 'niedrig' ? 5 : 3;
  if (master.bankVerified)      s += 12;
  if (master.taxIdVerified)     s += 8;
  if (master.eudrStatus === 'konform')     s += 12;
  if (master.eudrStatus === 'in_pruefung') s += 5;
  if (master.certs && master.certs.length > 0) s += 5;
  return Math.min(100, s);
}

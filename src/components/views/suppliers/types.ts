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

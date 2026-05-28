// ── Provider Categories ────────────────────────────────────────────────────────

export type ProviderCategory =
  | 'Logistik & Transport'
  | 'Zoll & Exportabwicklung'
  | 'Qualität & Prüfung'
  | 'Finanzierung & Versicherung'
  | 'Recht & Compliance'
  | 'Marketing & Vertrieb'
  | 'Lokaler Dienstleister'
  | 'Sonstige';

export type ProviderStatus =
  | 'lead' | 'angefragt' | 'in_pruefung' | 'aktiv'
  | 'pausiert' | 'eingeschraenkt' | 'gesperrt' | 'archiviert';

export type RiskLevel = 'niedrig' | 'mittel' | 'hoch' | 'kritisch';
export type Criticality = 'niedrig' | 'mittel' | 'hoch' | 'geschäftskritisch';
export type DocStatus = 'fehlt' | 'angefragt' | 'erhalten' | 'in_pruefung' | 'geprüft' | 'abgelaufen' | 'erneuern' | 'nicht_erforderlich';
export type ContractStatus = 'aktiv' | 'abgelaufen' | 'gekündigt' | 'in_verhandlung' | 'fehlt';
export type CanDecide = 'ja' | 'nein' | 'teilweise' | 'unklar';
export type TaskStatus = 'offen' | 'in_bearbeitung' | 'erledigt' | 'verschoben';
export type TaskPriority = 'hoch' | 'mittel' | 'niedrig';
export type CommChannel = 'email' | 'telefon' | 'whatsapp' | 'meeting' | 'videocall' | 'besuch' | 'notiz';

// ── Sub-interfaces ─────────────────────────────────────────────────────────────

export interface ContactPerson {
  name: string;
  role: string;
  email: string;
  phone: string;
  whatsapp?: string;
  language?: string;
  timezone?: string;
  isPrimary?: boolean;
  isEmergency?: boolean;
  canDecide?: CanDecide;
  notes?: string;
}

export interface PricingItem {
  serviceType: string;
  model: string;
  amount: string;
  currency: string;
  unit: string;
  notes: string;
}

export interface ContractEntry {
  contractType: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  noticeDays: string;
  jurisdiction: string;
  status: ContractStatus;
  notes: string;
}

export interface DocEntry {
  docType: string;
  status: DocStatus;
  issueDate: string;
  expiryDate: string;
  verifiedBy: string;
  verifiedDate: string;
  notes: string;
  isCritical?: boolean;
}

export interface RiskEntry {
  riskType: string;
  level: RiskLevel;
  description: string;
  mitigation: string;
  owner: string;
  nextReview: string;
}

export interface PerformanceEntry {
  period: string;
  rating: number;
  onTimeRate: string;
  issueCount: number;
  costDeviation: string;
  notes: string;
}

export interface CommEntry {
  date: string;
  channel: CommChannel;
  contactName: string;
  subject: string;
  summary: string;
  result: string;
  nextStep: string;
  author: string;
}

export interface TaskEntry {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  owner: string;
  status: TaskStatus;
  notes: string;
}

// ── ProviderMaster (JSONB) ─────────────────────────────────────────────────────

export interface ProviderMaster {
  // Stammdaten
  legalName?: string;
  legalForm?: string;
  founded?: string;
  employees?: string;
  vatId?: string;
  eoriNumber?: string;
  dunsNumber?: string;
  bankName?: string;
  bankAccountHolder?: string;
  iban?: string;
  swiftBic?: string;
  bankCountry?: string;
  paymentCurrency?: string;
  bankVerified?: boolean;
  bankVerifiedBy?: string;
  bankVerifiedDate?: string;
  timezone?: string;
  languages?: string;
  description?: string;
  internalNotes?: string;
  whatsappPreferred?: boolean;
  preferredContactTime?: string;

  // Leistungen
  services?: string[];
  servicesExcluded?: string[];
  specialization?: string;
  exportExperience?: boolean;
  euImportExperience?: boolean;
  tanzaniaExperience?: boolean;
  agriExperience?: boolean;
  bioFairtradeExperience?: boolean;
  countryCoverage?: string[];
  portsCoverage?: string[];
  productFocus?: string[];
  minVolume?: string;
  maxVolume?: string;
  hasSLA?: boolean;
  slaDetails?: string;
  hasSubcontractors?: boolean;
  subcontractorDetails?: string;
  serviceNotes?: string;

  // Prozess & Kritikalität
  processPhases?: string[];
  hasBackupProvider?: boolean;
  backupProviderName?: string;
  isSinglePointOfFailure?: boolean;
  criticalityReason?: string;

  // Kontakte
  contacts?: ContactPerson[];

  // Preise
  pricing?: PricingItem[];
  paymentTermDays?: string;
  paymentMethod?: string;
  advancePaymentRequired?: boolean;
  priceCurrency?: string;
  priceValidUntil?: string;
  reverseChargeRelevant?: boolean;
  pricingNotes?: string;

  // Verträge
  contracts?: ContractEntry[];
  contractNotes?: string;

  // Dokumente
  documents?: DocEntry[];
  documentNotes?: string;

  // Risiko & Compliance
  risks?: RiskEntry[];
  sanctionCheckDone?: boolean;
  sanctionCheckDate?: string;
  sanctionCheckBy?: string;
  ownershipKnown?: boolean;
  conflictsOfInterest?: boolean;
  overallRiskScore?: number;
  complianceNotes?: string;

  // Performance
  performance?: PerformanceEntry[];
  overallRating?: number;
  reliabilityScore?: number;
  communicationScore?: number;
  totalOrders?: number;
  lessonsLearned?: string;

  // Kommunikation
  communications?: CommEntry[];

  // Aufgaben
  tasks?: TaskEntry[];
}

// ── Lookup maps ────────────────────────────────────────────────────────────────

export const PROVIDER_CATEGORIES: ProviderCategory[] = [
  'Logistik & Transport',
  'Zoll & Exportabwicklung',
  'Qualität & Prüfung',
  'Finanzierung & Versicherung',
  'Recht & Compliance',
  'Marketing & Vertrieb',
  'Lokaler Dienstleister',
  'Sonstige',
];

export const PROVIDER_SUBCATEGORIES: Record<ProviderCategory, string[]> = {
  'Logistik & Transport': [
    'Spedition', 'Seefracht-Spediteur', 'Luftfracht-Spediteur', 'Straßentransporteur',
    'Container-Trucking', 'Hafen-Agent', 'Reederei', 'Lagerdienstleister',
    'Kühlkettenanbieter', 'Verpackungsdienstleister', 'Kurierdienst',
  ],
  'Zoll & Exportabwicklung': [
    'Zollagent Exportland', 'Zollagent Importland', 'Import Broker', 'Export Broker',
    'Zollberater', 'Dokumentenservice', 'Inspektionsagentur', 'Ursprungszeugnis-Dienstleister',
  ],
  'Qualität & Prüfung': [
    'Labor', 'Qualitätsinspektor', 'Zertifizierungsstelle', 'Bio-Zertifizierer',
    'Fairtrade-Zertifizierer', 'Phytosanitary Inspection', 'Food Safety Consultant',
    'Vor-Ort-Auditor', 'Wareninspektor',
  ],
  'Finanzierung & Versicherung': [
    'Bank', 'Zahlungsdienstleister', 'Exportkreditversicherung', 'Transportversicherung',
    'Warenversicherung', 'Factoring-Anbieter', 'Steuerberater', 'Wirtschaftsprüfer',
  ],
  'Recht & Compliance': [
    'Anwalt', 'Handelsrecht-Berater', 'Zollrecht-Berater', 'Compliance-Berater',
    'Nachhaltigkeitsberater', 'Lieferkettengesetz-Berater', 'Vertragsberater',
  ],
  'Marketing & Vertrieb': [
    'Handelsvertreter', 'Importeur', 'Distributor', 'Branding-Agentur',
    'Übersetzungsbüro', 'Marktzugangsberater', 'Messeagentur',
  ],
  'Lokaler Dienstleister': [
    'Lokaler Koordinator', 'Farm-Auditor', 'Agrarberater', 'Qualitätskontrolleur vor Ort',
    'Lagerhalter im Ursprungsland', 'Lokaler Transporteur', 'Lokaler Exportagent',
    'Community Liaison', 'Übersetzer', 'Verpacker / Sortierer',
  ],
  'Sonstige': ['Sonstiger Dienstleister'],
};

export const STATUS_MAP: Record<ProviderStatus, { label: string; kind: string }> = {
  lead:            { label: 'Lead',              kind: 'neutral'  },
  angefragt:       { label: 'Angefragt',         kind: 'neutral'  },
  in_pruefung:     { label: 'In Prüfung',        kind: 'warning'  },
  aktiv:           { label: 'Aktiv',             kind: 'success'  },
  pausiert:        { label: 'Pausiert',          kind: 'neutral'  },
  eingeschraenkt:  { label: 'Eingeschränkt',     kind: 'warning'  },
  gesperrt:        { label: 'Gesperrt',          kind: 'danger'   },
  archiviert:      { label: 'Archiviert',        kind: 'neutral'  },
};

export const RISK_MAP: Record<RiskLevel, { label: string; kind: string; color: string }> = {
  niedrig:  { label: 'Niedrig',   kind: 'success', color: '#34d399' },
  mittel:   { label: 'Mittel',    kind: 'warning', color: '#fbbf24' },
  hoch:     { label: 'Hoch',      kind: 'danger',  color: '#f87171' },
  kritisch: { label: 'Kritisch',  kind: 'danger',  color: '#ef4444' },
};

export const CRITICALITY_MAP: Record<Criticality, { label: string; kind: string }> = {
  niedrig:             { label: 'Niedrig',           kind: 'neutral'  },
  mittel:              { label: 'Mittel',            kind: 'warning'  },
  hoch:                { label: 'Hoch',              kind: 'danger'   },
  'geschäftskritisch': { label: 'Geschäftskritisch', kind: 'danger'   },
};

export const DOC_STATUS_MAP: Record<DocStatus, { label: string; kind: string }> = {
  fehlt:             { label: 'Fehlt',           kind: 'danger'   },
  angefragt:         { label: 'Angefragt',       kind: 'warning'  },
  erhalten:          { label: 'Erhalten',        kind: 'info'     },
  in_pruefung:       { label: 'In Prüfung',      kind: 'warning'  },
  'geprüft':         { label: 'Geprüft ✓',       kind: 'success'  },
  abgelaufen:        { label: 'Abgelaufen',      kind: 'danger'   },
  erneuern:          { label: 'Erneuern',        kind: 'warning'  },
  nicht_erforderlich:{ label: 'Nicht nötig',    kind: 'neutral'  },
};

export const CONTRACT_STATUS_MAP: Record<ContractStatus, { label: string; kind: string }> = {
  aktiv:            { label: 'Aktiv',           kind: 'success' },
  abgelaufen:       { label: 'Abgelaufen',      kind: 'danger'  },
  'gekündigt':      { label: 'Gekündigt',       kind: 'danger'  },
  in_verhandlung:   { label: 'In Verhandlung',  kind: 'warning' },
  fehlt:            { label: 'Fehlt',           kind: 'danger'  },
};

export const PROCESS_PHASES = [
  'Sourcing', 'Farmer Onboarding', 'Qualitätsprüfung', 'Sammlung', 'Lagerung',
  'Verarbeitung', 'Verpackung', 'Inlandstransport', 'Exportdokumentation',
  'Zollabwicklung Export', 'Hafenabwicklung', 'Seefracht', 'Importzoll',
  'EU-Verzollung', 'Lagerung in Europa', 'Finanzierung', 'Versicherung',
  'Zertifizierung', 'Audit', 'Reklamationsbearbeitung',
];

export const DOC_TYPES = [
  'Handelsregisterauszug', 'Steuerregistrierung', 'VAT-ID-Nachweis',
  'Exportlizenz', 'Importlizenz', 'Zollbroker-Lizenz', 'Versicherungsnachweis',
  'Betriebshaftpflicht', 'Transportversicherung', 'Zertifikat', 'Auditbericht',
  'Bankbestätigung', 'Compliance-Fragebogen', 'Anti-Korruptions-Erklärung',
  'Sanktionsprüfung', 'NDA', 'Vertrag', 'Preisliste', 'Laborakkreditierung',
  'Vollmacht', 'EORI-Nachweis',
];

export const RISK_TYPES = [
  'Leistungsrisiko', 'Qualitätsrisiko', 'Dokumentationsrisiko', 'Zahlungsrisiko',
  'Korruptionsrisiko', 'Betrugsrisiko', 'Bankdatenrisiko', 'Zollrisiko',
  'Logistikrisiko', 'Landrisiko', 'Abhängigkeitsrisiko', 'Reputationsrisiko',
  'Finanzrisiko', 'Lieferkettenrisiko',
];

export const CONTRACT_TYPES = [
  'Rahmenvertrag', 'NDA', 'Service Agreement', 'Logistikvertrag',
  'Lagervertrag', 'Zollvollmacht', 'Beratungsvertrag', 'Qualitätsprüfvertrag',
  'Versicherungsvertrag', 'Agenturvertrag',
];

export const CONTACT_ROLES = [
  'Hauptansprechpartner', 'Stellvertretung', 'Geschäftsführer', 'Operativer Kontakt',
  'Rechnungswesen', 'Vertragskontakt', 'Notfallkontakt', 'Qualitätskontakt',
  'Zollkontakt', 'Logistikkontakt', 'Eskalationskontakt',
];

export const PRICING_MODELS = [
  'Fixpreis', 'Pro Container', 'Pro Tonne', 'Pro kg', 'Pro Dokument',
  'Pro Stunde', 'Pro Tag', 'Monatspauschale', 'Erfolgsprovision',
];

// ── Buyer Finder types & constants ────────────────────────────────────────────

export type BuyerPipelineStage =
  | 'recherchiert' | 'qualifiziert' | 'kontaktiert' | 'antwort'
  | 'interessiert' | 'muster_angebot' | 'verhandlung' | 'gewonnen'
  | 'verloren' | 'spaeter';

export type BuyerPriority = 'kritisch' | 'hoch' | 'mittel' | 'niedrig';

export interface StageInfo {
  key: BuyerPipelineStage;
  label: string;
  color: string;
  emoji: string;
  isExit?: boolean;
}

export const PIPELINE_STAGES: StageInfo[] = [
  { key: 'recherchiert',   label: 'Recherchiert',     color: '#94a3b8', emoji: '🔍' },
  { key: 'qualifiziert',   label: 'Qualifiziert',     color: '#60a5fa', emoji: '✓'  },
  { key: 'kontaktiert',    label: 'Kontaktiert',      color: '#a78bfa', emoji: '📧' },
  { key: 'antwort',        label: 'Antwort',          color: '#fbbf24', emoji: '💬' },
  { key: 'interessiert',   label: 'Interessiert',     color: '#fb923c', emoji: '⭐' },
  { key: 'muster_angebot', label: 'Muster / Angebot', color: '#34d399', emoji: '📦' },
  { key: 'verhandlung',    label: 'Verhandlung',      color: '#10b981', emoji: '🤝' },
  { key: 'gewonnen',       label: 'Gewonnen',         color: '#22c55e', emoji: '🎉' },
  { key: 'verloren',       label: 'Verloren',         color: '#f87171', emoji: '✗',  isExit: true },
  { key: 'spaeter',        label: 'Später',           color: '#64748b', emoji: '🕐', isExit: true },
];

export const ACTIVE_STAGES = PIPELINE_STAGES.filter(s => !s.isExit);

export const BUYER_TYPES = [
  'Rösterei', 'Importeur', 'Großhändler', 'Distributor', 'Bio-Händler',
  'Feinkosthändler', 'Supermarkt / Retail', 'Gastronomie-Großhandel',
  'Lebensmittelhersteller', 'Private-Label-Anbieter', 'Online-Shop',
  'Spezialitätenhändler', 'Industrieabnehmer', 'Verarbeiter', 'Markenhersteller',
];

export const SOURCES = [
  'Eigenrecherche', 'LinkedIn', 'Messe', 'Empfehlung', 'Google',
  'Branchenverzeichnis', 'Trade-Portal', 'Kaltakquise', 'Netzwerk', 'Sonstiges',
];

export const PRIORITY_MAP: Record<BuyerPriority, { label: string; color: string }> = {
  kritisch: { label: 'Kritisch', color: '#f87171' },
  hoch:     { label: 'Hoch',     color: '#fb923c' },
  mittel:   { label: 'Mittel',   color: '#fbbf24' },
  niedrig:  { label: 'Niedrig',  color: '#94a3b8' },
};

export const DECISION_POWER_MAP: Record<string, { label: string; color: string }> = {
  niedrig:      { label: 'Niedrig',      color: '#94a3b8' },
  mittel:       { label: 'Mittel',       color: '#fbbf24' },
  hoch:         { label: 'Hoch',         color: '#fb923c' },
  entscheidend: { label: 'Entscheidend', color: '#f87171' },
};

export const CONTACT_QUALITY_MAP: Record<string, { label: string; color: string }> = {
  sicher:         { label: 'Sicher',         color: '#34d399' },
  wahrscheinlich: { label: 'Wahrscheinlich', color: '#fbbf24' },
  unklar:         { label: 'Unklar',         color: '#94a3b8' },
  ungültig:       { label: 'Ungültig',       color: '#f87171' },
  unbekannt:      { label: 'Unbekannt',      color: '#64748b' },
};

export function getStageInfo(stage: string): StageInfo {
  return PIPELINE_STAGES.find(s => s.key === stage) ?? PIPELINE_STAGES[0];
}

export function calcTotalScore(fit: number, commercial: number, engagement: number, risk: number): number {
  const base = (fit + commercial + engagement) / 3;
  const penalty = risk * 0.3;
  return Math.max(0, Math.min(100, Math.round(base - penalty)));
}

export function getScoreColor(score: number): string {
  if (score >= 75) return '#34d399';
  if (score >= 50) return '#fbbf24';
  if (score >= 25) return '#fb923c';
  return '#f87171';
}

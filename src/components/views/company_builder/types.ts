// ── Company Builder types & constants ─────────────────────────────────────────

export type CBPriority  = 'kritisch' | 'hoch' | 'mittel' | 'niedrig';
export type CBStatus    = 'open' | 'in_progress' | 'submitted' | 'waiting' | 'done' | 'not_relevant';
export type CBDocQuality = 'vollständig' | 'teilweise' | 'ungeprüft' | 'extern_geprüft' | 'veraltet';

// ── Sections ───────────────────────────────────────────────────────────────────

export const CB_SECTIONS = [
  { key: 'strategie',    label: 'Strategische Grundlage',            icon: 'flag',     color: '#a78bfa', weight: 10 },
  { key: 'gruendung',    label: 'Rechtsform & Gründung',             icon: 'building', color: '#60a5fa', weight: 15 },
  { key: 'steuern',      label: 'Steuern, IDs & Behörden',           icon: 'shield',   color: '#34d399', weight: 15 },
  { key: 'banking',      label: 'Banking & Finanzen',                icon: 'finance',  color: '#fbbf24', weight: 15 },
  { key: 'versicherung', label: 'Versicherungen & Risiko',           icon: 'alert',    color: '#f87171', weight: 10 },
  { key: 'recht',        label: 'Verträge, Recht & Dokumente',       icon: 'doc',      color: '#fb923c', weight: 15 },
  { key: 'export',       label: 'Exportfähigkeit & Infrastruktur',   icon: 'box',      color: '#06b6d4', weight: 15 },
  { key: 'golive',       label: 'Go-Live & erste Deals',             icon: 'check',    color: '#10b981', weight: 5  },
] as const;

export type CBSectionKey = typeof CB_SECTIONS[number]['key'];

// ── Go-Live Phases ─────────────────────────────────────────────────────────────

export const CB_PHASES = [
  { key: 'idee',             label: 'Idee',                   emoji: '💡', desc: 'Noch keine strukturierte Grundlage vorhanden.',                             min: 0  },
  { key: 'gruendungsbereit', label: 'Gründungsbereit',        emoji: '📋', desc: 'Strategie, Rechtsform, Name, Kapitalbedarf und Rollen sind geklärt.',       min: 15 },
  { key: 'gegruendet',       label: 'Formal gegründet',       emoji: '🏢', desc: 'Gewerbe/Gesellschaft, Finanzamt, Konto und Grunddokumente eingerichtet.',    min: 30 },
  { key: 'operativ',         label: 'Operativ vorbereitet',   emoji: '⚙️', desc: 'Buchhaltung, Verträge, Dienstleister, Versicherungen und Prozesse stehen.',  min: 50 },
  { key: 'exportbereit',     label: 'Exportbereit',           emoji: '📦', desc: 'EORI, Zoll, Produkte, Lieferanten, Logistik und Qualitätsprozess bereit.',   min: 65 },
  { key: 'deal_ready',       label: 'Deal-ready',             emoji: '🤝', desc: 'Produkt + Lieferant + Käufer + Kalkulation + alle kritischen Dokumente.',    min: 80 },
  { key: 'live',             label: 'Live 🚀',                emoji: '🚀', desc: 'Erster realer Exportdeal wurde erfolgreich gestartet.',                       min: 95 },
];

export function calcPhase(readiness: number) {
  for (let i = CB_PHASES.length - 1; i >= 0; i--) {
    if (readiness >= CB_PHASES[i].min) return CB_PHASES[i];
  }
  return CB_PHASES[0];
}

// ── Status & Priority maps ─────────────────────────────────────────────────────

export const STATUS_MAP: Record<CBStatus, { label: string; color: string; kind: string }> = {
  open:          { label: 'Offen',              color: 'var(--text-3)', kind: 'neutral'  },
  in_progress:   { label: 'In Arbeit',          color: '#60a5fa',       kind: 'info'     },
  submitted:     { label: 'Eingereicht',         color: '#a78bfa',       kind: 'info'     },
  waiting:       { label: 'Wartet auf Antwort', color: '#fbbf24',       kind: 'warning'  },
  done:          { label: 'Erledigt',            color: '#34d399',       kind: 'success'  },
  not_relevant:  { label: 'Nicht relevant',      color: 'var(--text-4)', kind: 'neutral'  },
};

export const PRIORITY_MAP: Record<CBPriority, { label: string; color: string; kind: string }> = {
  kritisch: { label: 'Kritisch', color: '#f87171', kind: 'danger'  },
  hoch:     { label: 'Hoch',     color: '#fb923c', kind: 'warning' },
  mittel:   { label: 'Mittel',   color: '#fbbf24', kind: 'warning' },
  niedrig:  { label: 'Niedrig',  color: '#94a3b8', kind: 'neutral' },
};

export const DOC_QUALITY_MAP: Record<CBDocQuality, { label: string; kind: string }> = {
  vollständig:    { label: 'Vollständig',      kind: 'success' },
  teilweise:      { label: 'Teilweise',        kind: 'warning' },
  ungeprüft:      { label: 'Ungeprüft',        kind: 'neutral' },
  extern_geprüft: { label: 'Extern geprüft',   kind: 'info'    },
  veraltet:       { label: 'Veraltet',         kind: 'danger'  },
};

export const CB_PHASES_LIST = ['idee', 'vorgruendung', 'gruendung', 'setup', 'go_live', 'betrieb'] as const;
export const CB_PHASE_LABELS: Record<string, string> = {
  idee: 'Idee', vorgruendung: 'Vorgründung', gruendung: 'Gründung',
  setup: 'Setup', go_live: 'Go-Live', betrieb: 'Laufender Betrieb',
};

// ── Score calculation ──────────────────────────────────────────────────────────

export function calcReadiness(tasks: { section: string; status: CBStatus; required: boolean }[]): number {
  if (!tasks.length) return 0;
  let totalWeight = 0;
  let earned = 0;
  for (const section of CB_SECTIONS) {
    const st = tasks.filter(t => t.section === section.key);
    const relevant = st.filter(t => t.status !== 'not_relevant');
    if (!relevant.length) continue;
    const done = relevant.filter(t => t.status === 'done').length;
    totalWeight += section.weight;
    earned += (done / relevant.length) * section.weight;
  }
  return totalWeight > 0 ? Math.round((earned / totalWeight) * 100) : 0;
}

export function calcSectionScore(tasks: { status: CBStatus }[]): number {
  const relevant = tasks.filter(t => t.status !== 'not_relevant');
  if (!relevant.length) return 0;
  const done = relevant.filter(t => t.status === 'done').length;
  return Math.round((done / relevant.length) * 100);
}

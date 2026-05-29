'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useData } from '@/lib/data-context';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import { fmtCur, fmtNum } from '@/lib/utils';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';

// ── Types ────────────────────────────────────────────────────────────────────

interface Assumption {
  id: string;
  text: string;
  status: 'guess' | 'researched' | 'validated' | 'confirmed';
}

interface ChapterData {
  text: string;
  assumptions: Assumption[];
  updatedAt?: string;
}

type ChapterStore = Record<string, ChapterData>;

type TrafficLight = 'green' | 'yellow' | 'red' | 'gray';

interface ChapterDef {
  id: string;
  num: number;
  title: string;
  icon: string;
  autoDataSources: string[];
  navTarget?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const LS_KEY = 'bp_chapters';

const CHAPTER_DEFS: ChapterDef[] = [
  { id: 'exec_summary',   num: 1,  title: 'Executive Summary',        icon: 'flag',     autoDataSources: ['Plattformdaten'],                          navTarget: 'cockpit' },
  { id: 'company',        num: 2,  title: 'Unternehmen & Gründer',    icon: 'settings', autoDataSources: ['Company Builder'],                         navTarget: 'company_builder' },
  { id: 'business_model', num: 3,  title: 'Geschäftsmodell',          icon: 'activity', autoDataSources: ['Aufträge', 'Deals'],                       navTarget: 'deals' },
  { id: 'products',       num: 4,  title: 'Produkte & Sortiment',     icon: 'product',  autoDataSources: ['Produkte'],                                navTarget: 'products' },
  { id: 'market',         num: 5,  title: 'Markt & Zielkunden',       icon: 'buyer',    autoDataSources: ['Käufer', 'Deals'],                         navTarget: 'buyers' },
  { id: 'competition',    num: 6,  title: 'Wettbewerb & Positionierung', icon: 'chart', autoDataSources: ['Manuell'],                                 navTarget: undefined },
  { id: 'sourcing',       num: 7,  title: 'Sourcing & Lieferanten',   icon: 'supplier', autoDataSources: ['Lieferanten'],                             navTarget: 'suppliers' },
  { id: 'operations',     num: 8,  title: 'Operations & Exportprozess', icon: 'ship',   autoDataSources: ['Aufträge', 'Dokumente'],                   navTarget: 'orders' },
  { id: 'sales',          num: 9,  title: 'Vertrieb & Go-to-Market',  icon: 'deals',    autoDataSources: ['Deals', 'Käufer'],                         navTarget: 'deals' },
  { id: 'finance',        num: 10, title: 'Finanzplanung',            icon: 'finance',  autoDataSources: ['Aufträge', 'Finanzen'],                    navTarget: 'finance' },
  { id: 'risk',           num: 11, title: 'Risikoanalyse',            icon: 'warn',     autoDataSources: ['Aufgaben', 'Aufträge'],                    navTarget: 'tasks' },
  { id: 'roadmap',        num: 12, title: 'Roadmap & Meilensteine',   icon: 'clock',    autoDataSources: ['Aufgaben', 'Kalender'],                    navTarget: 'tasks' },
];

const STATUS_COLOR: Record<TrafficLight, string> = {
  green: '#10b981',
  yellow: '#f59e0b',
  red:   '#ef4444',
  gray:  'var(--text-4)',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadChapters(): ChapterStore {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}'); } catch { return {}; }
}

function saveChapters(store: ChapterStore) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(store));
}

function scoreGaugeArc(score: number, cx: number, cy: number, r: number): string {
  // Semi-circle from left (180°) to right (0°), score fills the arc
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const startAngle = Math.PI;
  const endAngle = startAngle + pct * Math.PI;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const large = pct > 0.5 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

function scoreColor(score: number): string {
  if (score >= 86) return '#10b981';
  if (score >= 71) return '#34d399';
  if (score >= 51) return '#f59e0b';
  if (score >= 31) return '#f97316';
  return '#ef4444';
}

function scoreLabel(score: number): string {
  if (score >= 86) return 'Sehr belastbar';
  if (score >= 71) return 'Bankfähig (mit Belegen)';
  if (score >= 51) return 'Solider Entwurf';
  if (score >= 31) return 'Interner Rohentwurf';
  return 'Ideenskizze';
}

// ── Main Component ───────────────────────────────────────────────────────────

interface BusinessPlanViewProps {
  lang: Lang;
  onNav: (view: string, extra?: Record<string, unknown>) => void;
}

export const BusinessPlanView = ({ lang, onNav }: BusinessPlanViewProps) => {
  const { data: M } = useData();
  const [chapters, setChapters] = useState<ChapterStore>(loadChapters);
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => { saveChapters(chapters); }, [chapters]);

  const updateChapter = useCallback((id: string, patch: Partial<ChapterData>) => {
    setChapters(prev => ({
      ...prev,
      [id]: { ...{ text: '', assumptions: [] }, ...prev[id], ...patch, updatedAt: new Date().toISOString() },
    }));
  }, []);

  // ── Score calculation ──────────────────────────────────────────────────────

  const { score, catScores, companyScore } = useMemo(() => {
    if (!M) return { score: 0, catScores: {}, companyScore: 0 };

    const cp = M.companyProfile;
    const cscore =
      (cp ? 8 : 0) +
      (cp?.legalName || cp?.tradeName ? 4 : 0) +
      (cp?.legalForm ? 3 : 0);

    const pscore =
      (M.products.length >= 1 ? 5 : 0) +
      (M.products.length >= 2 ? 3 : 0) +
      (M.products.some(p => p.certs && p.certs.length > 0) ? 4 : 0) +
      (M.products.some(p => p.exportReady) ? 3 : 0);

    const sscore =
      (M.suppliers.length >= 1 ? 5 : 0) +
      (M.suppliers.length >= 3 ? 4 : 0) +
      (M.suppliers.some(s => (s.score ?? 0) >= 80) ? 3 : 0) +
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (M.suppliers.some(s => (s as any).certifications?.length > 0) ? 3 : 0);

    const mscore =
      (M.buyers.length >= 1 ? 5 : 0) +
      (M.buyers.length >= 5 ? 5 : 0) +
      (M.deals.length >= 1 ? 5 : 0) +
      (M.deals.some(d => ['Angebot','Verhandlung','Vertrag','Gewonnen'].includes(d.stage)) ? 5 : 0);

    const fscore =
      (M.orders.length >= 1 ? 8 : 0) +
      (M.orders.reduce((s, o) => s + o.revenue, 0) > 0 ? 7 : 0) +
      (M.orders.some(o => o.paid === 100) ? 5 : 0);

    const oscore =
      (M.tasks.length >= 3 ? 5 : 0) +
      (M.documents.length >= 1 ? 5 : 0) +
      (M.orders.filter(o => o.status === 'problem').length === 0 ? 5 : 0);

    const total = Math.min(100, cscore + pscore + sscore + mscore + fscore + oscore);
    return {
      score: total,
      companyScore: cscore,
      catScores: {
        company:    { pts: cscore,  max: 15, label: 'Unternehmen' },
        products:   { pts: pscore,  max: 15, label: 'Produkte' },
        suppliers:  { pts: sscore,  max: 15, label: 'Lieferanten' },
        market:     { pts: mscore,  max: 20, label: 'Markt & Käufer' },
        finance:    { pts: fscore,  max: 20, label: 'Finanzen' },
        operations: { pts: oscore,  max: 15, label: 'Operations' },
      },
    };
  }, [M]);

  // ── Chapter status computation ─────────────────────────────────────────────

  const chapterStatuses = useMemo((): Record<string, { status: TrafficLight; statusText: string; completionPct: number }> => {
    if (!M) return {};
    const totalRevenue = M.orders.reduce((s, o) => s + o.revenue, 0);

    const hasManual = (id: string) => !!chapters[id]?.text?.trim();

    return {
      exec_summary:   score >= 60 ? { status: 'green',  statusText: 'Gut dokumentiert',         completionPct: score }
                    : score >= 35 ? { status: 'yellow', statusText: 'Mehr Daten benötigt',       completionPct: score }
                                  : { status: 'red',    statusText: 'Datenbasis fehlt',           completionPct: score },

      company:        companyScore >= 12 ? { status: 'green',  statusText: 'Vollständig',              completionPct: Math.round((companyScore/15)*100) }
                    : companyScore >= 6  ? { status: 'yellow', statusText: 'Teilweise ausgefüllt',     completionPct: Math.round((companyScore/15)*100) }
                    : M.companyProfile   ? { status: 'red',    statusText: 'Unvollständig',             completionPct: Math.round((companyScore/15)*100) }
                                        : { status: 'gray',   statusText: 'Keine Daten',               completionPct: 0 },

      business_model: M.orders.length >= 1 && M.deals.length >= 1 ? { status: 'green',  statusText: 'Gut belegt',              completionPct: 100 }
                    : M.orders.length >= 1 || M.deals.length >= 1  ? { status: 'yellow', statusText: 'Teilweise belegt',        completionPct: 50 }
                                                                    : { status: 'red',    statusText: 'Keine Transaktionen',    completionPct: 10 },

      products:       M.products.length >= 2 && M.products.some(p => p.exportReady) ? { status: 'green',  statusText: 'Exportfähig dokumentiert', completionPct: 90 }
                    : M.products.length >= 1                                         ? { status: 'yellow', statusText: 'Basis vorhanden',          completionPct: 50 }
                                                                                     : { status: 'gray',   statusText: 'Keine Produkte',           completionPct: 0 },

      market:         M.buyers.length >= 5 && M.deals.length >= 2 ? { status: 'green',  statusText: 'Pipeline aktiv',      completionPct: 85 }
                    : M.buyers.length >= 1                         ? { status: 'yellow', statusText: 'Käuferbasis aufbauen', completionPct: 40 }
                                                                   : { status: 'gray',   statusText: 'Keine Käufer',        completionPct: 0 },

      competition:    hasManual('competition') ? { status: 'green',  statusText: 'Dokumentiert',      completionPct: 80 }
                                              : { status: 'red',    statusText: 'Manuell ausfüllen', completionPct: 5 },

      sourcing:       M.suppliers.length >= 3 ? { status: 'green',  statusText: 'Diversifiziert',     completionPct: 85 }
                    : M.suppliers.length >= 1 ? { status: 'yellow', statusText: 'Ausbau empfohlen',   completionPct: 40 }
                                             : { status: 'gray',   statusText: 'Keine Lieferanten',  completionPct: 0 },

      operations:     M.orders.length >= 3 ? { status: 'green',  statusText: 'Erfahrung vorhanden',   completionPct: 80 }
                    : M.orders.length >= 1 ? { status: 'yellow', statusText: 'Erste Aufträge',        completionPct: 40 }
                                          : { status: 'gray',   statusText: 'Noch keine Aufträge',   completionPct: 0 },

      sales:          M.deals.length >= 3 ? { status: 'green',  statusText: 'Pipeline stark',         completionPct: 85 }
                    : M.deals.length >= 1 ? { status: 'yellow', statusText: 'Pipeline aufbauen',      completionPct: 40 }
                    : M.buyers.length < 1  ? { status: 'gray',   statusText: 'Keine Käufer',          completionPct: 0 }
                                          : { status: 'red',    statusText: 'Keine Deals',            completionPct: 10 },

      finance:        totalRevenue > 50000 ? { status: 'green',  statusText: 'Solide Datenbasis',      completionPct: 85 }
                    : M.orders.length >= 1 ? { status: 'yellow', statusText: 'Erste Daten vorhanden', completionPct: 40 }
                                          : { status: 'gray',   statusText: 'Keine Finanzdaten',      completionPct: 0 },

      risk:           M.orders.filter(o => o.status === 'problem').length === 0 && M.tasks.length > 0
                      ? { status: 'green',  statusText: 'Keine kritischen Risiken', completionPct: 75 }
                      : M.tasks.length > 0 ? { status: 'yellow', statusText: 'Risiken überwachen',   completionPct: 45 }
                                          : { status: 'gray',   statusText: 'Nicht dokumentiert',    completionPct: 5 },

      roadmap:        M.tasks.length >= 5 ? { status: 'green',  statusText: 'Gut strukturiert',     completionPct: 80 }
                    : M.tasks.length >= 1 ? { status: 'yellow', statusText: 'Mehr Aufgaben anlegen', completionPct: 40 }
                                         : { status: 'gray',   statusText: 'Keine Aufgaben',        completionPct: 0 },
    };
  }, [M, score, companyScore, chapters]);

  // ── Auto-generated chapter texts ───────────────────────────────────────────

  const autoText = useMemo((): Record<string, string> => {
    if (!M) return {};
    const totalRevenue = M.orders.reduce((s, o) => s + o.revenue, 0);
    const totalPipeline = M.deals.reduce((s, d) => s + d.value, 0);
    const avgMargin = M.orders.length > 0
      ? Math.round(M.orders.reduce((s, o) => s + (o.revenue > 0 ? (o.profit / o.revenue) * 100 : 0), 0) / M.orders.length)
      : 0;
    const paidOrders = M.orders.filter(o => o.paid === 100).length;
    const exportReady = M.products.filter(p => p.exportReady).length;
    const certifiedProducts = M.products.filter(p => p.certs && p.certs.length > 0).length;
    const uniqueCountries = Array.from(new Set(M.buyers.map(b => b.country))).length;
    const uniqueCategories = Array.from(new Set(M.products.map(p => p.cat))).length;
    const cp = M.companyProfile;

    return {
      exec_summary: [
        cp?.tradeName || cp?.legalName
          ? `${cp.tradeName ?? cp.legalName} ist ein Handels- und Exportunternehmen mit Fokus auf ausgewählte Produkte aus Ostafrika für europäische B2B-Käufer.`
          : 'Das Unternehmen ist ein Handels- und Exportunternehmen mit Fokus auf ausgewählte Produkte aus Ostafrika für europäische B2B-Käufer.',
        M.products.length > 0
          ? `Das aktuelle Sortiment umfasst ${M.products.length} Produkte in ${uniqueCategories} Kategorien, davon ${exportReady} exportfertig zertifiziert.`
          : 'Die Produktpalette befindet sich im Aufbau.',
        M.buyers.length > 0
          ? `Die Käuferbasis umfasst ${M.buyers.length} qualifizierte B2B-Käufer in ${uniqueCountries} Ländern mit einer aktiven Pipeline von ${fmtCur(totalPipeline)}.`
          : 'Die Käuferpipeline befindet sich im Aufbau.',
        totalRevenue > 0
          ? `Der dokumentierte Gesamtumsatz beträgt ${fmtCur(totalRevenue)} bei einer durchschnittlichen Nettomarge von ${avgMargin}%.`
          : 'Die Umsatzhistorie befindet sich im Aufbau.',
      ].join(' '),

      company: [
        cp ? `${cp.tradeName ?? cp.legalName ?? 'Das Unternehmen'} wurde als ${cp.legalForm ?? 'Handelsunternehmen'} gegründet.`
           : 'Das Unternehmensprofil ist noch nicht vollständig ausgefüllt.',
        cp?.businessModel ? `Geschäftsmodell: ${cp.businessModel}.` : '',
        cp?.currentPhase ? `Aktuelle Phase: ${cp.currentPhase}.` : '',
        cp?.eoriNumber ? 'EORI-Nummer ist vorhanden.' : 'EORI-Nummer noch ausstehend.',
      ].filter(Boolean).join(' '),

      business_model: [
        M.orders.length > 0
          ? `Das Unternehmen betreibt aktiven Eigenhandel mit ${M.orders.length} dokumentierten Aufträgen.`
          : 'Das Geschäftsmodell basiert auf Eigenhandel und Exportvermittlung.',
        M.deals.length > 0
          ? `Die Deals-Pipeline enthält ${M.deals.length} aktive Opportunities im Gesamtwert von ${fmtCur(totalPipeline)}.`
          : 'Die Deals-Pipeline wird aufgebaut.',
        avgMargin > 0 ? `Die durchschnittliche Handelsmarge beträgt ${avgMargin}%.` : '',
      ].filter(Boolean).join(' '),

      products: [
        M.products.length > 0
          ? `Das Sortiment umfasst ${M.products.length} Produkte in ${uniqueCategories} Kategorien.`
          : 'Das Produktsortiment ist noch nicht definiert.',
        exportReady > 0 ? `${exportReady} Produkte sind exportfertig dokumentiert.` : 'Noch kein Produkt ist als exportfertig markiert.',
        certifiedProducts > 0 ? `Zertifizierungen liegen für ${certifiedProducts} Produkte vor.` : 'Produktzertifizierungen stehen noch aus.',
      ].join(' '),

      market: [
        M.buyers.length > 0
          ? `Die Käuferbasis umfasst ${M.buyers.length} qualifizierte B2B-Käufer in ${uniqueCountries} Ländern.`
          : 'Die Zielkundenbasis wird aktuell aufgebaut.',
        M.deals.length > 0
          ? `Die Deals-Pipeline enthält ${M.deals.length} aktive Opportunities im Gesamtwert von ${fmtCur(totalPipeline)}.`
          : 'Erste Käuferkontakte werden hergestellt.',
        M.deals.some(d => d.stage === 'Gewonnen')
          ? `${M.deals.filter(d => d.stage === 'Gewonnen').length} Deal(s) wurden bereits gewonnen.`
          : '',
      ].filter(Boolean).join(' '),

      competition: 'Dieses Kapitel erfordert eine manuelle Wettbewerbsanalyse. Bitte dokumentieren Sie die wichtigsten Mitbewerber, deren Stärken und Schwächen sowie Ihre Positionierung im Markt.',

      sourcing: [
        M.suppliers.length > 0
          ? `Die Lieferantenbasis umfasst ${M.suppliers.length} Lieferanten aus ${Array.from(new Set(M.suppliers.map(s => s.country))).length} Herkunftsländern.`
          : 'Die Lieferantenbasis wird aufgebaut.',
        M.suppliers.some(s => (s.score ?? 0) >= 80)
          ? `${M.suppliers.filter(s => (s.score ?? 0) >= 80).length} Lieferanten haben einen Qualitätsscore von 80+.`
          : '',
        M.suppliers.length >= 3 ? 'Die Lieferantenbasis ist ausreichend diversifiziert.' : 'Eine stärkere Diversifikation der Lieferantenbasis wird empfohlen.',
      ].filter(Boolean).join(' '),

      operations: [
        M.orders.length > 0
          ? `Der Exportprozess ist durch ${M.orders.length} abgewickelte oder laufende Aufträge praktisch erprobt.`
          : 'Die Exportprozesse werden aufgebaut und dokumentiert.',
        M.documents.length > 0
          ? `${M.documents.length} Dokumente sind in der Plattform hinterlegt.`
          : 'Die Dokumentenverwaltung wird eingerichtet.',
        M.orders.filter(o => o.status === 'problem').length > 0
          ? `${M.orders.filter(o => o.status === 'problem').length} Auftrag/Aufträge zeigen aktuell Probleme.`
          : '',
      ].filter(Boolean).join(' '),

      sales: [
        M.deals.length > 0
          ? `Die Vertriebspipeline enthält ${M.deals.length} aktive Opportunities.`
          : 'Die Vertriebspipeline wird aufgebaut.',
        M.buyers.length > 0
          ? `${M.buyers.length} Käufer in ${uniqueCountries} Zielmärkten sind qualifiziert.`
          : '',
        M.deals.some(d => d.stage === 'Angebot' || d.stage === 'Verhandlung')
          ? `${M.deals.filter(d => ['Angebot','Verhandlung','Vertrag'].includes(d.stage)).length} Deals befinden sich in fortgeschrittenen Phasen.`
          : '',
      ].filter(Boolean).join(' '),

      finance: [
        totalRevenue > 0
          ? `Der dokumentierte Gesamtumsatz beträgt ${fmtCur(totalRevenue)}.`
          : 'Finanzdaten werden mit ersten Aufträgen aufgebaut.',
        avgMargin > 0 ? `Die durchschnittliche Nettomarge liegt bei ${avgMargin}%.` : '',
        M.orders.length > 0
          ? `${paidOrders} von ${M.orders.length} Aufträgen sind vollständig bezahlt.`
          : '',
        totalRevenue > 0
          ? `Offene Forderungen: ${fmtCur(M.orders.filter(o => o.paid < 100).reduce((s, o) => s + o.revenue * (1 - o.paid / 100), 0))}.`
          : '',
      ].filter(Boolean).join(' '),

      risk: [
        M.orders.filter(o => o.status === 'problem').length === 0
          ? 'Aktuell keine Aufträge mit kritischen Problemen.'
          : `${M.orders.filter(o => o.status === 'problem').length} Auftrag/Aufträge mit Problemstatus — sofortige Maßnahmen erforderlich.`,
        M.tasks.filter(t => t.prio === 'hoch' && t.status !== 'done').length > 0
          ? `${M.tasks.filter(t => t.prio === 'hoch' && t.status !== 'done').length} hochpriorisierte offene Aufgaben.`
          : '',
        'Vollständige Risikoanalyse mit Wahrscheinlichkeit, Auswirkung und Gegenmaßnahmen sollte manuell ergänzt werden.',
      ].filter(Boolean).join(' '),

      roadmap: [
        M.tasks.length > 0
          ? `Die operative Roadmap umfasst ${M.tasks.length} dokumentierte Aufgaben, davon ${M.tasks.filter(tk => tk.status !== 'done').length} offen.`
          : 'Die Roadmap wird mit konkreten Aufgaben befüllt.',
        M.tasks.filter(tk => tk.prio === 'hoch' && tk.status !== 'done').length > 0
          ? `Hochpriorisiert: ${M.tasks.filter(tk => tk.prio === 'hoch' && tk.status !== 'done').length} kritische Meilensteine ausstehend.`
          : '',
      ].filter(Boolean).join(' '),
    };
  }, [M]);

  // ── Gaps computation ────────────────────────────────────────────────────────

  const gaps = useMemo(() => {
    if (!M) return [];
    const list: { icon: string; title: string; desc: string; nav: string }[] = [];
    const totalRevenue = M.orders.reduce((s, o) => s + o.revenue, 0);

    if (!M.companyProfile || !M.companyProfile.legalName)
      list.push({ icon: 'settings', title: 'Unternehmensprofil vervollständigen', desc: 'Rechtsform, Firmenname und Gründerdaten im Company Builder eintragen.', nav: 'company_builder' });
    if (M.products.length === 0)
      list.push({ icon: 'product', title: 'Produkte anlegen', desc: 'Mindestens ein Startprodukt mit vollständiger Spezifikation und HS-Code dokumentieren.', nav: 'products' });
    else if (!M.products.some(p => p.exportReady))
      list.push({ icon: 'product', title: 'Produkt als exportfertig markieren', desc: 'Zertifikate und Exportdokumentation für das Startprodukt vervollständigen.', nav: 'products' });
    if (M.suppliers.length < 2)
      list.push({ icon: 'supplier', title: 'Lieferanten qualifizieren', desc: `Aktuell ${M.suppliers.length} Lieferant(en) — mindestens 2–3 qualifizierte Lieferanten für Startphase empfohlen.`, nav: 'suppliers' });
    if (M.buyers.length < 5)
      list.push({ icon: 'buyer', title: 'Käuferpipeline aufbauen', desc: `Aktuell ${M.buyers.length} Käufer — Ziel 10+ qualifizierte B2B-Käufer in Zielmärkten.`, nav: 'buyers' });
    if (M.orders.length === 0)
      list.push({ icon: 'box', title: 'Ersten Auftrag anlegen', desc: 'Der erste dokumentierte Auftrag macht den Businessplan sofort belastbarer.', nav: 'orders' });
    if (totalRevenue === 0 && M.orders.length > 0)
      list.push({ icon: 'finance', title: 'Finanzdaten vervollständigen', desc: 'Umsatz- und Margenplanung für bestehende Aufträge ergänzen.', nav: 'finance' });
    if (!chapters['competition']?.text?.trim())
      list.push({ icon: 'chart', title: 'Wettbewerbsanalyse dokumentieren', desc: 'Kapitel "Wettbewerb & Positionierung" manuell ausfüllen — Pflicht für Banken und Investoren.', nav: 'business_plan' });

    return list.slice(0, 6);
  }, [M, chapters]);

  // ── PDF export ──────────────────────────────────────────────────────────────

  const handlePdfExport = async () => {
    if (!M) return;
    setPdfLoading(true);
    try {
      const chapterPayload = CHAPTER_DEFS.map(def => ({
        id: def.id,
        num: def.num,
        title: def.title,
        autoText: autoText[def.id] ?? '',
        manualText: chapters[def.id]?.text ?? '',
        assumptions: chapters[def.id]?.assumptions ?? [],
        status: chapterStatuses[def.id]?.status ?? 'gray',
        statusText: chapterStatuses[def.id]?.statusText ?? '',
      }));
      const payload = {
        score,
        scoreLabel: scoreLabel(score),
        companyName: M.companyProfile?.tradeName ?? M.companyProfile?.legalName ?? 'EastAfrica Exports Ltd.',
        chapters: chapterPayload,
        gaps,
        generatedAt: new Date().toISOString(),
      };
      const res = await fetch('/api/pdf/business-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `businessplan-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPdfLoading(false);
    }
  };

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const totalRevenue = M.orders.reduce((s, o) => s + o.revenue, 0);
  const col = scoreColor(score);

  return (
    <div style={{ padding: '0 0 48px' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="section-head">
        <h1>{t(lang, 'bp_title')}</h1>
        <div className="sub">Dynamischer Businessplan · aus echten Plattformdaten</div>
        <div className="right" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn primary"
            onClick={handlePdfExport}
            disabled={pdfLoading}
            style={{ opacity: pdfLoading ? 0.6 : 1 }}
          >
            <Ic name="upload" size={13} />
            {pdfLoading ? 'Wird erstellt…' : t(lang, 'bp_export_pdf')}
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* ── Score + Category Overview ───────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, marginBottom: 20 }}>

          {/* Score Gauge Card */}
          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 200 110" style={{ width: 180, overflow: 'visible' }}>
              {/* Background arc */}
              <path d={scoreGaugeArc(100, 100, 100, 72)} fill="none" stroke="var(--surface-3)" strokeWidth="14" strokeLinecap="round" />
              {/* Score arc */}
              {score > 0 && (
                <path d={scoreGaugeArc(score, 100, 100, 72)} fill="none" stroke={col} strokeWidth="14" strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 6px ${col}60)` }} />
              )}
              {/* Score text */}
              <text x="100" y="92" textAnchor="middle" fill={col} fontSize="32" fontWeight="700" fontFamily="inherit">{score}</text>
              <text x="100" y="108" textAnchor="middle" fill="var(--text-3)" fontSize="9" fontFamily="inherit">/ 100</text>
            </svg>
            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: col }}>{scoreLabel(score)}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { label: 'Operativ',     val: score >= 51 ? 'Gut' : 'Ausbau nötig',   ok: score >= 51 },
                { label: 'Bankfähig',    val: score >= 71 ? 'Ja' : score >= 51 ? 'Bedingt' : 'Nein', ok: score >= 71 },
                { label: 'Investorfähig',val: score >= 81 ? 'Ja' : score >= 61 ? 'Bedingt' : 'Nein', ok: score >= 81 },
              ].map(b => (
                <div key={b.label} style={{ textAlign: 'center', padding: '4px 8px', borderRadius: 6, background: b.ok ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${b.ok ? 'rgba(16,185,129,0.25)' : 'var(--border)'}` }}>
                  <div style={{ fontSize: 8.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{b.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: b.ok ? '#10b981' : score >= 51 ? '#f59e0b' : 'var(--text-2)', marginTop: 1 }}>{b.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Scores */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Bewertung nach Kategorien</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.values(catScores as Record<string, { pts: number; max: number; label: string }>).map(cat => {
                const pct = Math.round((cat.pts / cat.max) * 100);
                const c = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : pct >= 20 ? '#f97316' : '#ef4444';
                return (
                  <div key={cat.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12 }}>{cat.label}</span>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{cat.pts}/{cat.max} Pkt.</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: c, borderRadius: 3, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Chapter Grid ────────────────────────────────────────────────── */}
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Kapitelübersicht — {CHAPTER_DEFS.length} Kapitel
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {CHAPTER_DEFS.map(def => {
            const st = chapterStatuses[def.id] ?? { status: 'gray' as TrafficLight, statusText: 'Laden…', completionPct: 0 };
            const isActive = activeChapter === def.id;
            const hasManual = !!chapters[def.id]?.text?.trim();
            const hasAssumptions = (chapters[def.id]?.assumptions?.length ?? 0) > 0;

            return (
              <div
                key={def.id}
                className="card"
                onClick={() => setActiveChapter(isActive ? null : def.id)}
                style={{
                  padding: '12px 14px',
                  cursor: 'pointer',
                  borderLeft: `3px solid ${STATUS_COLOR[st.status]}`,
                  background: isActive ? 'var(--surface-2)' : undefined,
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span className="mono tx3" style={{ fontSize: 10, width: 18, flexShrink: 0 }}>{String(def.num).padStart(2, '0')}</span>
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ic name={def.icon} size={11} color={STATUS_COLOR[st.status]} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="fw600" style={{ fontSize: 11.5, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{def.title}</div>
                  </div>
                </div>

                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[st.status], flexShrink: 0 }} />
                  <span style={{ fontSize: 10.5, color: 'var(--text-2)' }}>{st.statusText}</span>
                </div>

                {/* Progress bar */}
                <div style={{ height: 3, borderRadius: 2, background: 'var(--surface-3)', marginBottom: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${st.completionPct}%`, height: '100%', background: STATUS_COLOR[st.status], borderRadius: 2 }} />
                </div>

                {/* Source chips + badges */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {def.autoDataSources.map(src => (
                    <span key={src} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--surface-3)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>{src}</span>
                  ))}
                  {hasManual && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>Manuell</span>}
                  {hasAssumptions && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }}>{chapters[def.id]?.assumptions.length} Annahmen</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Chapter Editor ───────────────────────────────────────────────── */}
        {activeChapter && (() => {
          const def = CHAPTER_DEFS.find(d => d.id === activeChapter)!;
          const chData = chapters[activeChapter] ?? { text: '', assumptions: [] };

          const addAssumption = () => {
            const newA: Assumption = { id: `a${Date.now()}`, text: '', status: 'guess' };
            updateChapter(activeChapter, { assumptions: [...chData.assumptions, newA] });
          };
          const updateAssumption = (id: string, patch: Partial<Assumption>) => {
            updateChapter(activeChapter, {
              assumptions: chData.assumptions.map(a => a.id === id ? { ...a, ...patch } : a),
            });
          };
          const removeAssumption = (id: string) => {
            updateChapter(activeChapter, { assumptions: chData.assumptions.filter(a => a.id !== id) });
          };

          const statusBadgeColor: Record<Assumption['status'], string> = {
            guess:      '#f97316',
            researched: '#f59e0b',
            validated:  '#60a5fa',
            confirmed:  '#10b981',
          };
          const statusLabel: Record<Assumption['status'], string> = {
            guess:      'Annahme',
            researched: 'Recherchiert',
            validated:  'Validiert',
            confirmed:  'Bestätigt',
          };

          return (
            <div className="card" style={{ marginBottom: 20, padding: 0, border: '1px solid var(--border-2)' }}>
              {/* Header */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ic name={def.icon} size={13} color={STATUS_COLOR[chapterStatuses[activeChapter]?.status ?? 'gray']} />
                </div>
                <div>
                  <div className="fw600" style={{ fontSize: 13 }}>Kapitel {def.num}: {def.title}</div>
                  <div className="tx3" style={{ fontSize: 10.5 }}>
                    {chData.updatedAt ? `Zuletzt bearbeitet: ${new Date(chData.updatedAt).toLocaleDateString('de-DE')}` : 'Noch nicht bearbeitet'}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  {def.navTarget && (
                    <button className="btn ghost" style={{ fontSize: 11 }} onClick={() => onNav(def.navTarget!)}>
                      <Ic name="chevR" size={11} /> Zum Modul
                    </button>
                  )}
                  <button className="iconbtn" onClick={() => setActiveChapter(null)}><Ic name="x" size={13} /></button>
                </div>
              </div>

              <div style={{ padding: '18px 18px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* A: Auto-generated text */}
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#60a5fa', display: 'inline-block' }} />
                    Aus Plattformdaten (automatisch)
                  </div>
                  <div style={{ padding: '12px 14px', background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.12)', borderRadius: 6, fontSize: 12, lineHeight: 1.65, color: 'var(--text-2)', minHeight: 80 }}>
                    {autoText[activeChapter] || <span style={{ color: 'var(--text-4)', fontStyle: 'italic' }}>Keine Plattformdaten verfügbar.</span>}
                  </div>
                </div>

                {/* B: Manual additions */}
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Eigene Ergänzungen & Kontext
                  </div>
                  <textarea
                    value={chData.text}
                    onChange={e => updateChapter(activeChapter, { text: e.target.value })}
                    placeholder="Hintergrund, Erklärungen, Strategie, Zusammenhänge, die nicht automatisch erfasst werden…"
                    style={{
                      width: '100%', minHeight: 100, padding: '10px 12px', boxSizing: 'border-box',
                      background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
                      color: 'var(--text)', fontSize: 12, fontFamily: 'inherit', lineHeight: 1.6,
                      resize: 'vertical', outline: 'none',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  />
                  <div className="tx3" style={{ fontSize: 10, textAlign: 'right', marginTop: 3 }}>
                    {chData.text.length} Zeichen
                  </div>
                </div>
              </div>

              {/* C: Assumptions */}
              <div style={{ padding: '0 18px 18px' }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Annahmen ({chData.assumptions.length})
                  <button className="btn sm ghost" style={{ fontSize: 10 }} onClick={addAssumption}>
                    <Ic name="plus" size={10} /> Annahme hinzufügen
                  </button>
                </div>
                {chData.assumptions.length === 0 ? (
                  <div className="tx3" style={{ fontSize: 11, fontStyle: 'italic' }}>Keine Annahmen dokumentiert. Gute Businesspläne machen Annahmen explizit und verfolgen deren Validierung.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {chData.assumptions.map(a => (
                      <div key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusBadgeColor[a.status], flexShrink: 0 }} />
                        <input
                          value={a.text}
                          onChange={e => updateAssumption(a.id, { text: e.target.value })}
                          placeholder="z.B. Käufer akzeptieren 7,50 €/kg für Tansania Arabica"
                          style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text)', fontSize: 11.5, padding: '4px 8px', fontFamily: 'inherit', outline: 'none' }}
                        />
                        <select
                          value={a.status}
                          onChange={e => updateAssumption(a.id, { status: e.target.value as Assumption['status'] })}
                          style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, color: statusBadgeColor[a.status], fontSize: 11, padding: '3px 6px', fontFamily: 'inherit', outline: 'none', fontWeight: 600 }}
                        >
                          {(Object.keys(statusLabel) as Assumption['status'][]).map(s => (
                            <option key={s} value={s}>{statusLabel[s]}</option>
                          ))}
                        </select>
                        <button className="iconbtn" style={{ width: 22, height: 22 }} onClick={() => removeAssumption(a.id)}>
                          <Ic name="x" size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── Gaps Panel ──────────────────────────────────────────────────── */}
        {gaps.length > 0 && (
          <div className="card" style={{ padding: 0, marginBottom: 20 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ic name="warn" size={14} color="#f59e0b" />
              <span className="fw600" style={{ fontSize: 13 }}>{t(lang, 'bp_gaps_title')}</span>
              <Badge kind="warning">{gaps.length} offen</Badge>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {gaps.map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 6, border: '1px solid var(--border)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ic name={g.icon} size={13} color="#f59e0b" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="fw600" style={{ fontSize: 12, marginBottom: 2 }}>{g.title}</div>
                    <div className="tx3" style={{ fontSize: 11, lineHeight: 1.5 }}>{g.desc}</div>
                  </div>
                  <button
                    className="btn ghost"
                    style={{ fontSize: 10.5, flexShrink: 0 }}
                    onClick={() => onNav(g.nav)}
                  >
                    {t(lang, 'bp_go_to_module')} →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Stats Footer ─────────────────────────────────────────────────── */}
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {[
              { label: 'Produkte', value: fmtNum(M.products.length), sub: `${M.products.filter(p => p.exportReady).length} exportfähig` },
              { label: 'Lieferanten', value: fmtNum(M.suppliers.length), sub: `${M.suppliers.filter(s => (s.score ?? 0) >= 80).length} Score 80+` },
              { label: 'Käufer', value: fmtNum(M.buyers.length), sub: `${Array.from(new Set(M.buyers.map(b => b.country))).length} Länder` },
              { label: 'Aufträge', value: fmtNum(M.orders.length), sub: `${M.orders.filter(o => o.paid === 100).length} bezahlt` },
              { label: 'Deals Pipeline', value: fmtCur(M.deals.reduce((s, d) => s + d.value, 0)), sub: `${M.deals.length} aktiv` },
              { label: 'Gesamtumsatz', value: fmtCur(totalRevenue), sub: `Ø ${M.orders.length > 0 ? Math.round(M.orders.reduce((s, o) => s + (o.revenue > 0 ? (o.profit / o.revenue) * 100 : 0), 0) / M.orders.length) : 0}% Marge` },
            ].map(kpi => (
              <div key={kpi.label} className="tile kacheln" style={{ padding: 9 }}>
                <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase' }}>{kpi.label}</div>
                <div className="mono fw600" style={{ fontSize: 16, marginTop: 2 }}>{kpi.value}</div>
                <div className="tx3" style={{ fontSize: 9.5, marginTop: 1 }}>{kpi.sub}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

// ── Workspace types ────────────────────────────────────────────────────────────

export interface WorkspaceStep {
  id: string;
  label: string;
  icon: string;
  question: string;        // The main guided question for this step
  hint: string;            // One-sentence context shown as tooltip/sub-text
  advisorNote?: string;    // What the advisor panel shows for this step specifically
}

export interface WorkspaceState {
  taskId: string;
  answers: Record<string, string>;   // stepId → answer text
  riskRows: RiskRow[];
  assumptions: WsAssumption[];
  evidenceStatus: 'fehlt' | 'in_bearbeitung' | 'vorhanden' | 'extern_geprueft';
  evidenceLocation: string;
  artifact: string;
  artifactGeneratedAt?: string;
  notes: string;
  lastSaved: string;
}

export interface RiskRow {
  id: string;
  risk: string;
  probability: 'hoch' | 'mittel' | 'niedrig';
  impact: 'hoch' | 'mittel' | 'niedrig';
  mitigation: string;
}

export interface WsAssumption {
  id: string;
  text: string;
  status: 'ungeprüft' | 'recherchiert' | 'validiert' | 'bestätigt' | 'widerlegt';
}

// ── Mapping CB section → BusinessPlan chapter ──────────────────────────────────

export const SECTION_TO_BP_CHAPTER: Record<string, string> = {
  strategie:    'company',
  gruendung:    'company',
  steuern:      'company',
  banking:      'finance',
  versicherung: 'risk',
  recht:        'operations',
  export:       'operations',
  golive:       'sales',
};

// ── localStorage helpers ───────────────────────────────────────────────────────

const WS_PREFIX = 'cb_workspace_';

export function wsKey(taskId: string): string { return `${WS_PREFIX}${taskId}`; }

export function loadWs(taskId: string): WorkspaceState {
  if (typeof window === 'undefined') return makeEmptyWs(taskId);
  try {
    const raw = localStorage.getItem(wsKey(taskId));
    return raw ? JSON.parse(raw) : makeEmptyWs(taskId);
  } catch { return makeEmptyWs(taskId); }
}

export function saveWs(state: WorkspaceState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(wsKey(state.taskId), JSON.stringify(state));
}

function makeEmptyWs(taskId: string): WorkspaceState {
  return {
    taskId,
    answers: {},
    riskRows: [],
    assumptions: [],
    evidenceStatus: 'fehlt',
    evidenceLocation: '',
    artifact: '',
    notes: '',
    lastSaved: new Date().toISOString(),
  };
}

// ── Step configurations per section ───────────────────────────────────────────

// Standard steps appended to every task's section-specific steps:
export const COMMON_STEPS: WorkspaceStep[] = [
  {
    id: '_risks',
    label: 'Risiken & Annahmen',
    icon: 'warn',
    question: 'Welche Risiken und offenen Annahmen gibt es bei dieser Aufgabe? Dokumentiere bekannte Risiken mit Wahrscheinlichkeit, Auswirkung und möglichen Gegenmaßnahmen.',
    hint: 'Gut dokumentierte Risiken schützen vor Überraschungen und stärken den Businessplan.',
  },
  {
    id: '_evidence',
    label: 'Nachweise',
    icon: 'doc',
    question: 'Welche Dokumente, Bestätigungen oder Nachweise werden für diese Aufgabe benötigt? Wo liegen sie aktuell?',
    hint: 'Banken, Investoren und Behörden fordern Nachweise. Fehlende Dokumente blockieren Go-Live.',
  },
  {
    id: '_artifact',
    label: 'Ergebnis-Dokument',
    icon: 'flag',
    question: 'Erstelle das finale Ergebnis-Dokument für diese Aufgabe. Nutze "KI-Entwurf" um aus deinen Antworten automatisch ein strukturiertes Dokument zu generieren.',
    hint: 'Das Ergebnis-Dokument ist der Nachweis, dass diese Aufgabe wirklich erledigt ist — nicht nur abgehakt.',
  },
  {
    id: '_finish',
    label: 'Abschluss',
    icon: 'check',
    question: 'Überprüfe alle Schritte. Sind alle Pflichtfragen beantwortet? Ist das Ergebnis-Dokument vollständig? Ist der Nachweis vorhanden?',
    hint: 'Eine Aufgabe ist erst erledigt, wenn das Ergebnis dokumentiert ist.',
  },
];

export const SECTION_STEPS: Record<string, WorkspaceStep[]> = {

  strategie: [
    {
      id: 'strategie_kontext',
      label: 'Kontext & Ausgangslage',
      icon: 'flag',
      question: 'Was ist der aktuelle Stand und Hintergrund dieser strategischen Aufgabe? Beschreibe die Ausgangssituation: Was motiviert diese Entscheidung? Welche externen und internen Faktoren spielen eine Rolle?',
      hint: 'Eine klare Ausgangssituation ist die Basis für jede fundierte strategische Entscheidung.',
      advisorNote: 'Strategische Entscheidungen in der Gründungsphase haben oft jahrelange Auswirkungen. Investiere jetzt Zeit in Klarheit, um später teure Korrekturen zu vermeiden.',
    },
    {
      id: 'strategie_analyse',
      label: 'Analyse & Optionen',
      icon: 'activity',
      question: 'Welche Optionen stehen zur Auswahl? Beschreibe jede Option mit ihren Vor- und Nachteilen, dem benötigten Kapital, den Risiken und der realistischen Umsetzbarkeit in eurer aktuellen Phase.',
      hint: 'Mindestens 2–3 Optionen solltest du durchdenken — auch wenn eine davon "nichts tun" ist.',
      advisorNote: 'Die häufigste strategische Falle ist die zu frühe Festlegung auf eine Option, bevor die Alternativen wirklich bewertet wurden.',
    },
    {
      id: 'strategie_entscheidung',
      label: 'Entscheidung & Begründung',
      icon: 'check',
      question: 'Welche Option wählt ihr und warum? Formuliere die Entscheidung klar und begründe sie mit den ausschlaggebenden Faktoren. Welche Alternativen wurden verworfen und warum?',
      hint: 'Eine gute Entscheidungsdokumentation hilft später beim Onboarding von Investoren, Beratern und neuen Teammitgliedern.',
      advisorNote: 'Banken und Investoren fragen immer nach der Begründung strategischer Weichenstellungen. Ein dokumentiertes Entscheidungsprotokoll zeigt professionelles Vorgehen.',
    },
    {
      id: 'strategie_konsequenzen',
      label: 'Konsequenzen & nächste Schritte',
      icon: 'activity',
      question: 'Welche konkreten Folgeaufgaben entstehen aus dieser Entscheidung? Welche anderen Bereiche (Rechtsform, Versicherung, Verträge, Kapital) werden durch diese Entscheidung beeinflusst? Wer muss informiert oder eingebunden werden?',
      hint: 'Strategische Entscheidungen erzeugen Kaskaden — dokumentiere die wichtigsten Folgewirkungen jetzt.',
      advisorNote: 'Häufiger Fehler: die Entscheidung wird getroffen, aber die Konsequenzen nicht systematisch verfolgt. Das führt zu Lücken, die erst beim Go-Live auffallen.',
    },
  ],

  gruendung: [
    {
      id: 'gruendung_anforderungen',
      label: 'Anforderungen klären',
      icon: 'building',
      question: 'Was genau ist bei dieser Gründungsaufgabe zu klären oder zu erledigen? Welche gesetzlichen Anforderungen gelten? Welche Fristen sind relevant? Welche Dokumente werden benötigt?',
      hint: 'Gründungsfehler sind teuer zu korrigieren — klare Anforderungen vor der Umsetzung.',
      advisorNote: 'Viele Gründer unterschätzen den bürokratischen Aufwand. Plane realistische Zeitpuffer: Ämter und Notare haben oft Wartezeiten von 2–6 Wochen.',
    },
    {
      id: 'gruendung_beratung',
      label: 'Beratung & externe Prüfung',
      icon: 'supplier',
      question: 'Wurden ein Steuerberater, Anwalt oder Notar eingebunden? Was war deren Empfehlung? Welche Fragen sind noch offen? Gibt es Warnhinweise oder kritische Punkte aus der Beratung?',
      hint: 'Für steuerliche und rechtliche Gründungsfragen ist externe Expertise Pflicht, keine Option.',
      advisorNote: 'Achte darauf, dass dein Steuerberater Exporterfahrung hat. Viele Standardberater kennen die Besonderheiten des Außenhandels (Umsatzsteuer, EORI, Zoll) nicht gut genug.',
    },
    {
      id: 'gruendung_umsetzung',
      label: 'Umsetzung & Status',
      icon: 'check',
      question: 'Was wurde konkret beantragt, unterzeichnet, eingereicht oder eingetragen? Welche Bestätigungen liegen vor? Was steht noch aus? Was ist der aktuelle Bearbeitungsstand?',
      hint: 'Dokumentiere jeden Umsetzungsschritt mit Datum und Referenznummer.',
      advisorNote: 'Offizielle Bestätigungen (Registernummern, Steuernummern, EORI) sollten sofort in das Unternehmensprofil eingetragen werden, damit alle Module sie nutzen können.',
    },
    {
      id: 'gruendung_abschluss',
      label: 'Nachweis & Abschluss',
      icon: 'doc',
      question: 'Welches Dokument belegt die Erledigung dieser Aufgabe? Wo liegt es? Welche Nummer, welches Datum, welche Behörde? Ist der Nachweis offiziell und rechtsgültig?',
      hint: 'Ohne Nachweis gilt die Aufgabe nicht als erledigt — auch nicht intern.',
      advisorNote: 'Für Bankkredite, Fördermittel und Exportlizenzen werden Gründungsnachweise systematisch abgefragt. Lege sie von Anfang an strukturiert ab.',
    },
  ],

  steuern: [
    {
      id: 'steuern_relevanz',
      label: 'Relevanz & Pflichten',
      icon: 'shield',
      question: 'Für welche steuerlichen oder behördlichen Pflichten ist euer Unternehmen anmeldepflichtig? Was sind die gesetzlichen Grundlagen? Welche Fristen gelten für die Anmeldung? Gibt es Ausnahmen oder Befreiungen, die geprüft werden sollten?',
      hint: 'Steuerliche Versäumnisse können rückwirkend zu Bußgeldern führen — Frühzeitigkeit zahlt sich aus.',
      advisorNote: 'Im Exporthandel besonders relevant: USt-ID für EU-Geschäfte, EORI für Zollanmeldungen, Lebensmittelregistrierung falls Lebensmittel importiert werden, LUCID falls Verpackungen in den Verkehr gebracht werden.',
    },
    {
      id: 'steuern_antrag',
      label: 'Antrag & Einreichung',
      icon: 'upload',
      question: 'Wie wurde der Antrag oder die Anmeldung eingereicht? Online oder postalisch? Welche Angaben wurden gemacht? Gibt es einen Eingangsstempel oder eine Bestätigung? Bei welcher Behörde läuft das Verfahren?',
      hint: 'Bewahre alle Einreichungsbestätigungen mit Datum und Referenznummer auf.',
      advisorNote: 'Das Finanzamt-Fragebogen-Verfahren ("steuerliche Erfassung") ist der erste kritische Schritt — hier werden Unternehmensform, Tätigkeit und Umsatzsteuerregelung festgelegt. Eine falsche Angabe hier kann später aufwendig korrigiert werden.',
    },
    {
      id: 'steuern_nummer',
      label: 'Nummer & Nachweis',
      icon: 'check',
      question: 'Welche Nummer oder Bestätigung wurde erteilt? Wann? Ist sie bereits im Unternehmensprofil und in den Dokumentvorlagen eingetragen? Welche nächsten Schritte ergeben sich (z.B. USt-ID in Rechnungen verwenden, EORI an Spediteur übermitteln)?',
      hint: 'Behördliche Nummern müssen auf Rechnungen, in Zollanmeldungen und bei Banken korrekt eingetragen sein.',
      advisorNote: 'Häufiger Fehler: EORI-Nummer wurde beantragt aber noch nicht dem Spediteur mitgeteilt. Das blockiert die erste Exportabwicklung.',
    },
  ],

  banking: [
    {
      id: 'banking_anforderungen',
      label: 'Anforderungen definieren',
      icon: 'finance',
      question: 'Was wird von einem Geschäftskonto oder Finanzprodukt für euer Exportgeschäft konkret benötigt? Welche Funktionen sind kritisch (SWIFT-Überweisungen, Fremdwährungskonten, Kreditlinie, Online-Banking)? Wie hoch sind die erwarteten Transaktionsvolumina? Gibt es spezielle Anforderungen für Trade Finance (Akkreditiv, Bankgarantie)?',
      hint: 'Nicht jede Bank ist gleich gut für Exportgeschäfte. Achte auf Auslandserfahrung, Konditionen für SWIFT und Fremdwährung.',
      advisorNote: 'Für Exporteurs besonders wichtig: Manche Banken haben Compliance-Einschränkungen für bestimmte Länder (Ostafrika). Kläre das vor Kontoeröffnung, um spätere Überraschungen zu vermeiden.',
    },
    {
      id: 'banking_auswahl',
      label: 'Vergleich & Auswahl',
      icon: 'activity',
      question: 'Welche Banken oder Finanzdienstleister wurden verglichen? Was waren die ausschlaggebenden Unterschiede bei Konditionen, Erreichbarkeit, Export-Know-how und digitalen Möglichkeiten? Welche Empfehlungen gab es von Beratern oder Netzwerk?',
      hint: 'Hole mindestens 2–3 Angebote ein — die Unterschiede bei Konditionen können bei Exportvolumina erheblich sein.',
      advisorNote: 'Für Exportbetriebe mit Lieferanten in Afrika ist eine Bank mit Afrika-Expertise (z.B. Commerzbank, Deutsche Bank, DZ Bank) oft besser als eine Regionalbank.',
    },
    {
      id: 'banking_setup',
      label: 'Einrichtung & Prozesse',
      icon: 'settings',
      question: 'Wie ist das Banking konkret eingerichtet? Wer hat welche Zugriffe? Ab welchem Betrag ist eine zweite Freigabe nötig? Wie werden neue Bankverbindungen von Lieferanten verifiziert? Welche Buchhaltungsintegration wurde gewählt?',
      hint: 'Interne Zahlungsfreigaberegeln schützen vor Betrug — besonders wichtig im internationalen Geschäft.',
      advisorNote: 'CEO-Fraud und gefälschte Bankdatenänderungen sind im Exportgeschäft ein reales Risiko. Die Regel: Neue oder geänderte Bankdaten werden immer telefonisch über eine bekannte Nummer bestätigt — nie per E-Mail allein.',
    },
  ],

  versicherung: [
    {
      id: 'versicherung_risiken',
      label: 'Risikoanalyse',
      icon: 'warn',
      question: 'Welche spezifischen Risiken deckt diese Versicherung ab? Welche Tätigkeiten, Produkte und Vertragspartner sind betroffen? Welche Schadenszenarien sind realistisch? Wie hoch wäre ein maximaler Schaden ohne Versicherungsschutz?',
      hint: 'Der Versicherungsbedarf ergibt sich direkt aus dem Geschäftsmodell — Eigenhandel braucht anderen Schutz als reine Vermittlung.',
      advisorNote: 'Im Exporthandel mit Lebensmitteln sind Produkthaftpflicht und Rückrufkostenversicherung besonders relevant. Ein einziger Rückruf kann existenzbedrohend sein ohne Versicherungsschutz.',
    },
    {
      id: 'versicherung_markt',
      label: 'Marktrecherche & Angebote',
      icon: 'activity',
      question: 'Welche Versicherer wurden angefragt? Welche Deckungssummen, Selbstbehalte und Prämien wurden angeboten? Gibt es Ausschlüsse oder Einschränkungen, die für euer Geschäft relevant sind? Wurde ein unabhängiger Versicherungsmakler eingeschaltet?',
      hint: 'Für Export-spezifische Versicherungen lohnt sich ein Makler mit Außenhandels-Expertise.',
      advisorNote: 'Kreditversicherung (Forderungsausfallschutz) ist für Exporteure oft wichtiger als für Inlandsgeschäfte — Zahlungsausfälle aus Drittländern sind schwer einzuklagen.',
    },
    {
      id: 'versicherung_abschluss',
      label: 'Abschluss & Nachweis',
      icon: 'check',
      question: 'Welche Versicherung wurde abgeschlossen? Bei welchem Anbieter? Was sind die wesentlichen Vertragsdaten (Policennummer, Laufzeit, Deckungssumme, Prämie, Selbstbehalt)? Wann muss die Police erneuert werden?',
      hint: 'Policen und Deckungsnachweise werden bei Bankkrediten, Lieferantenverträgen und Kaufverträgen oft verlangt.',
      advisorNote: 'Achte auf korrekte Beschreibung der Geschäftstätigkeit in der Police — "Großhandel" deckt internationales Exportgeschäft oft nicht automatisch ab.',
    },
  ],

  recht: [
    {
      id: 'recht_anforderungen',
      label: 'Rechtliche Anforderungen',
      icon: 'doc',
      question: 'Was muss dieses Dokument, diesen Vertrag oder diese rechtliche Grundlage leisten? Welche Klauseln sind für das Exportgeschäft zwingend erforderlich? Welche Rechtsordnung ist anwendbar? Gibt es Branchenstandards (Incoterms, UCP 600, CISG)?',
      hint: 'Verträge im internationalen Handel müssen spezifische Klauseln zu Recht, Gerichtsstand, Incoterms und Zahlungsbedingungen enthalten.',
      advisorNote: 'Kauf auf Offenes Konto (Open Account) ist bequem, aber risikoreich. Für neue Geschäftspartner immer Vorauszahlung oder Akkreditiv bevorzugen bis Vertrauen aufgebaut ist.',
    },
    {
      id: 'recht_erstellung',
      label: 'Entwurf & Prüfung',
      icon: 'edit',
      question: 'Wie wurde dieses Dokument erstellt? Wurde ein Muster verwendet? Von welcher Quelle? Wurde es von einem Anwalt mit Exporterfahrung geprüft? Welche Änderungen wurden vorgenommen? Welche Klauseln sind noch ungeklärt?',
      hint: 'Standardmuster aus dem Internet sind oft nicht auf internationalen Handel ausgelegt.',
      advisorNote: 'Eine einmalige Prüfung durch einen Fachanwalt für Außenhandelsrecht ist deutlich günstiger als ein Rechtsstreit. Gute Verträge verhindern 90% der späteren Konflikte.',
    },
    {
      id: 'recht_abschluss',
      label: 'Finalisierung & Nachweis',
      icon: 'check',
      question: 'Ist das Dokument oder der Vertrag finalisiert und unterzeichnet? Wo liegt das Original? Welches Versionsdatum hat die aktuelle Version? Wann ist die nächste Überprüfung fällig? Gibt es Folgeverpflichtungen aus dem Dokument?',
      hint: 'Verträge sollten regelmäßig auf Aktualität geprüft werden — besonders wenn sich Gesetze oder Geschäftsbedingungen ändern.',
      advisorNote: 'Erstelle eine Dokumenten-Bibliothek mit allen Vertragsvorlagen, klaren Versionsnummern und Überprüfungsterminen. Das spart Zeit und verhindert, dass veraltete Versionen verwendet werden.',
    },
  ],

  export: [
    {
      id: 'export_produkt',
      label: 'Produkt & Spezifikation',
      icon: 'product',
      question: 'Was sind die genauen Produktspezifikationen? Welche Qualitätsparameter (Feuchte, Größe, Farbe, Reinheit, Qualitätsstufe) gelten? Welche Normen oder Standards müssen erfüllt sein (Bio, Fair Trade, Rainforest Alliance, EU-Norm)? Welche Verpackungsanforderungen gibt es?',
      hint: 'Unklare Produktspezifikationen sind die häufigste Ursache für Reklamationen im Exportgeschäft.',
      advisorNote: 'Stelle sicher, dass die Spezifikationen im Lieferantenvertrag und im Käufervertrag identisch sind. Abweichungen zwischen diesen Dokumenten sind ein häufiger Streitpunkt.',
    },
    {
      id: 'export_zoll',
      label: 'Zoll & Regulatorik',
      icon: 'customs',
      question: 'Welcher HS-Code gilt für das Produkt? Welche Zollsätze fallen beim Import in den Zielmarkt an? Welche Ursprungsnachweise sind erforderlich? Welche Lizenzen, Zertifikate oder Genehmigungen müssen bei der Einfuhr vorgelegt werden (Phytosanitär, Analysezertifikat, Ursprungszeugnis)?',
      hint: 'Ein falscher HS-Code kann zu Nachzahlungen, Verzögerungen oder Beschlagnahmen führen.',
      advisorNote: 'Die EU hat für viele afrikanische Länder Präferenzabkommen (EPA). Prüfe, ob ihr davon profitieren könnt — die Einsparungen bei Zöllen können erheblich sein.',
    },
    {
      id: 'export_logistik',
      label: 'Logistik & Infrastruktur',
      icon: 'ship',
      question: 'Welche Logistikkette wurde geplant? Wer sind die beteiligten Dienstleister (Spediteur, Zollagent, Hafendienstleister)? Welche Transitzeiten und -kosten wurden kalkuliert? Gibt es alternative Routen als Backup? Wie wird die Kühlkette sichergestellt (falls relevant)?',
      hint: 'Logistikkosten von 15–30% des Warenwerts sind im Afrika-Export normal — plane realistisch.',
      advisorNote: 'Der häufigste Fehler ist die Unterschätzung von Durchlaufzeiten. Von der Order bis zur Auslieferung in Europa vergehen oft 8–12 Wochen. Plant dies in eure Cashflow-Planung ein.',
    },
    {
      id: 'export_kalkulation',
      label: 'Kalkulation & Marge',
      icon: 'finance',
      question: 'Wie ist die vollständige Kalkulation für dieses Produkt? Einkaufspreis, Qualitätsprüfung, Verpackung, Inland-Transport im Ursprungsland, Exportzoll/-abgaben, Seefracht, Importzoll EU, Lager/Handling beim Importeur, Handling Fee. Wie hoch ist die Zielmarge? Wie hoch ist die Mindestmarge? Was ist das Worst-Case-Szenario?',
      hint: 'Eine vollständige Kalkulation muss alle 8–10 Kostenpositionen enthalten — keine grobe Schätzung.',
      advisorNote: 'Erfahrene Exporteure empfehlen einen Sicherheitspuffer von 10–15% auf die kalkulierten Logistikkosten, da Hafengebühren, Lieferzeiten und Wechselkurse schwankend sind.',
    },
  ],

  golive: [
    {
      id: 'golive_vorbereitung',
      label: 'Vorbereitung & Check',
      icon: 'check',
      question: 'Sind alle Voraussetzungen für diesen Go-Live-Schritt erfüllt? Welche kritischen Blocker (Rechtsform, Konto, EORI, Versicherung, Lieferant, Käufer) wurden geprüft? Was ist noch offen? Was ist der Plan für offene Punkte?',
      hint: 'Ein unvollständiger Go-Live ist teurer als ein verzögerter Go-Live.',
      advisorNote: 'Mache den ersten Deal kleiner als nötig — nicht größer. Ein kleines, erfolgreiches erstes Geschäft ist wertvoller als ein großes, das scheitert. Es validiert den Prozess und baut Vertrauen auf.',
    },
    {
      id: 'golive_kontakt',
      label: 'Kontakt & Kommunikation',
      icon: 'buyer',
      question: 'Wer sind die konkreten Ansprechpartner (Käufer, Lieferant, Spediteur, Zollagent)? Wie wurde der Kontakt hergestellt? Was wurde kommuniziert? Welche Erwartungen wurden gesetzt? Was sind die nächsten vereinbarten Schritte?',
      hint: 'Klare Kommunikation und dokumentierte Vereinbarungen sind die Basis für reibungslose Abwicklung.',
      advisorNote: 'Beim ersten Käuferkontakt geht es primär um Vertrauen, nicht um den Deal. Zeige Fachkompetenz, Zuverlässigkeit und klare Kommunikation — der Deal folgt.',
    },
    {
      id: 'golive_simulation',
      label: 'Simulation & Probelauf',
      icon: 'activity',
      question: 'Wurde der Prozess vorab simuliert oder ein Probelauf durchgeführt? Was waren die Ergebnisse? Welche Probleme wurden entdeckt? Welche Anpassungen wurden vorgenommen? Ist die Dokumentenkette (Proforma, Packing List, B/L, COO) vollständig und korrekt?',
      hint: 'Fehler in einer Simulation kosten Lernzeit. Fehler im ersten echten Deal kosten Geld und Reputation.',
      advisorNote: 'Der "First Deal Simulator" in der Plattform kann vor dem echten Deal alle Dokumente, Kalkulationen und Prozessschritte testen — nutze ihn.',
    },
    {
      id: 'golive_lessons',
      label: 'Ergebnisse & Lessons Learned',
      icon: 'flag',
      question: 'Was hat bei diesem Schritt gut funktioniert? Was hat nicht funktioniert? Was wurde unerwartet gelernt? Welche Prozesse oder Dokumente müssen angepasst werden? Welche Folgeaufgaben entstehen für das nächste Geschäft?',
      hint: 'Systematische Lessons Learned nach jedem wichtigen Schritt sind der Unterschied zwischen zufälligem Erfolg und replizierbarem Prozess.',
      advisorNote: 'Notiere Erkenntnisse unmittelbar nach dem Schritt — das Gedächtnis verblasst schnell. In 6 Monaten wirst du froh sein, diese Notizen zu haben.',
    },
  ],
};

// ── Advisor tips per section (always shown in the right panel) ─────────────────

export const SECTION_ADVISOR_TIPS: Record<string, string[]> = {
  strategie: [
    'Strategische Entscheidungen in der Frühphase haben Auswirkungen auf Rechtsform, Verträge, Kapital und Versicherungen — denke systemisch.',
    'Dokumentiere nicht nur die Entscheidung, sondern auch die verworfenen Alternativen. Investoren und Banken fragen danach.',
    'Validiere strategische Annahmen so früh wie möglich mit echten Marktdaten — bevor du zu viel Kapital investierst.',
  ],
  gruendung: [
    'Gründungsfehler sind teuer zu korrigieren. Investiere jetzt in saubere Strukturen — eine GmbH kostet wenig, Umwandlung später mehr.',
    'Achte auf die richtige Reihenfolge: Beratung → Entscheidung → Anmeldung. Viele springen direkt zur Anmeldung.',
    'Notartermine und Amtsbearbeitungen dauern oft länger als geplant. Plane mindestens 8 Wochen für die Vollgründung ein.',
  ],
  steuern: [
    'Steuerliche Versäumnisse können rückwirkend zu Bußgeldern führen — Frühzeitigkeit zahlt sich buchstäblich aus.',
    'Im Exportgeschäft ist die USt-Behandlung komplex (Steuerbefreiung, Nachweispflichten). Lass das von einem Experten aufsetzen.',
    'EORI-Nummer und USt-ID sind zwei verschiedene Dinge — du brauchst beides für reibungslose Exportabwicklung.',
  ],
  banking: [
    'Nicht jede Bank kann internationalen Zahlungsverkehr gleich gut abwickeln. Exporterfahrung der Bank ist ein echtes Kriterium.',
    'CEO-Fraud und gefälschte Bankdatenänderungen sind im internationalen Handel verbreitet. Etabliere klare interne Freigaberegeln.',
    'Akkreditive (Letters of Credit) bieten maximale Zahlungssicherheit für neue Geschäftsbeziehungen — lass dich von deiner Bank beraten.',
  ],
  versicherung: [
    'Ohne Versicherung riskierst du im Schadenfall die Insolvenz des Unternehmens. Versicherung ist kein Kostenfaktor, sondern Überlebensschutz.',
    'Die Beschreibung der Geschäftstätigkeit in der Police muss präzise sein — "Großhandel" deckt internationales Exportgeschäft oft nicht.',
    'Überprüfe Versicherungen jährlich auf Aktualität — besonders wenn das Geschäftsvolumen oder die Produktpalette wächst.',
  ],
  recht: [
    'Ein gutes Vertragswerk verhindert 90% der späteren Konflikte. Die einmalige Anwaltsgebühr amortisiert sich schnell.',
    'Im internationalen Handel gelten Incoterms (ICC) als Standard. Stelle sicher, dass du und dein Vertragspartner dasselbe darunter verstehen.',
    'Allgemeine Geschäftsbedingungen (AGB) müssen aktiv in den Vertragsschluss einbezogen werden — ein Link auf der Webseite reicht nicht.',
  ],
  export: [
    'Die Exportkalkulation muss alle 8–10 Kostenpositionen vollständig enthalten — nicht nur Einkaufspreis und Fracht.',
    'HS-Codes sind rechtsverbindlich — bei Unsicherheit Vorabauskunft beim Zollamt einholen, nicht raten.',
    'Qualitätsmängel, die erst beim Käufer entdeckt werden, sind 10× teurer zu beheben als solche, die beim Verladen erkannt wurden.',
  ],
  golive: [
    'Der erste Deal ist dein Proof of Concept — mache ihn kleiner und kontrollierbarer, nicht größer und profitabler.',
    'Dokumentiere den ersten Deal vollständig: Dokumente, Kommunikation, Timing, Kosten, Probleme. Das ist dein Prozess-Blueprint.',
    'Lessons Learned nach jedem Deal sind der wichtigste Beitrag zur Professionalität. Teams, die das nicht tun, wiederholen dieselben Fehler.',
  ],
};

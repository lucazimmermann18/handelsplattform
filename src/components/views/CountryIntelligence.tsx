'use client';

import React, { useState, useEffect } from 'react';
import { Ic } from '@/components/ui/icons';
import { t } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';
import { useData } from '@/lib/data-context';
import { useAiConfig } from '@/lib/ai-config';

interface Props { lang: 'de' | 'en' }

interface MarketDocument {
  name: string;
  mandatory: boolean;
  note?: string;
}

interface MarketCert {
  name: string;
  required: boolean;
  description: string;
}

interface MarketImporter {
  name: string;
  city: string;
  segment: 'specialty' | 'commercial' | 'retail' | 'roaster';
  annualVolumeKt: number;
  website?: string;
  notes: string;
}

interface MarketPort {
  name: string;
  country: string;
  transitDaysFromMombasa: number;
  directService: boolean;
  notes: string;
}

interface MarketEntryStep {
  id: string;
  title: string;
  description: string;
  effort: 'low' | 'medium' | 'high';
  timelineWeeks: number;
  category: 'legal' | 'commercial' | 'logistics' | 'certification';
}

interface CountryMarket {
  id: string;
  name: string;
  nameLocal: string;
  flag: string;
  currency: string;
  region: string;
  importVolumeKt: number;
  importValueBn: number;
  perCapitaKg: number;
  growthPctYoY: number;
  specialtySharePct: number;
  premiumSpecialtyMin: number;
  premiumSpecialtyMax: number;
  premiumCommercialMin: number;
  premiumCommercialMax: number;
  dutyMfnPct: number;
  dutyPreferencePct: number;
  preferenceScheme: string;
  importVatPct: number;
  specialTaxNote: string | null;
  aflatoxinLimitPpb: number;
  aflatoxinTotalPpb: number;
  moistureMaxPct: number;
  documents: MarketDocument[];
  labelingLanguages: string[];
  labelingRequirements: string[];
  certifications: MarketCert[];
  importers: MarketImporter[];
  entryPorts: MarketPort[];
  logisticsNotes: string[];
  seasonalDemand: number[]; // 12 values Jan-Dec, scale 1-10
  entrySteps: MarketEntryStep[];
  keyInsights: string[];
  accent: string;
}

const MARKETS: CountryMarket[] = [
  {
    id: 'de', name: 'Deutschland', nameLocal: 'Germany', flag: '🇩🇪', currency: 'EUR', region: 'EU',
    importVolumeKt: 1050, importValueBn: 3.8, perCapitaKg: 8.2, growthPctYoY: 1.8, specialtySharePct: 22,
    premiumSpecialtyMin: 8.5, premiumSpecialtyMax: 22.0, premiumCommercialMin: 3.8, premiumCommercialMax: 6.2,
    dutyMfnPct: 0, dutyPreferencePct: 0, preferenceScheme: 'EBA / DCTS',
    importVatPct: 0, specialTaxNote: '0% MwSt. auf Rohkaffee (B2B-Weiterverkauf)',
    aflatoxinLimitPpb: 10, aflatoxinTotalPpb: 15, moistureMaxPct: 12.5,
    documents: [
      { name: 'Phytosanitäres Zertifikat', mandatory: true, note: 'NPPO Ursprungsland' },
      { name: 'Ursprungszeugnis (Form A / REX)', mandatory: true },
      { name: 'ICO-Exportzertifikat', mandatory: true, note: 'Für äthiopischen Kaffee via ECX' },
      { name: 'Handelsrechnung', mandatory: true },
      { name: 'Packinglist', mandatory: true },
      { name: 'Konnossement (B/L)', mandatory: true },
      { name: 'CHED-PP via EU TRACES', mandatory: true },
      { name: 'Bio-Zertifikat', mandatory: false, note: 'Nur bei Bio-Ware' },
      { name: 'EUDR-Erklärung', mandatory: false, note: 'Ab 2026 Pflicht für Kaffee' },
    ],
    labelingLanguages: ['Deutsch'],
    labelingRequirements: ['Ursprungsland', 'Gewichtsangabe in Gramm', 'Röstdatum / MHD', 'Allergenhinweise', 'Kaffeeart & Qualitätsstufe'],
    certifications: [
      { name: 'Bio (EU 2018/848)', required: false, description: 'Wachsendes Segment, +15% Prämie' },
      { name: 'Fairtrade', required: false, description: 'Relevant für Einzelhandel' },
      { name: 'Rainforest Alliance', required: false, description: 'Zunehmend von Großröstern gefordert' },
      { name: 'UTZ', required: false, description: 'Primär B2B-Handelssegment' },
      { name: 'Cup of Excellence', required: false, description: 'Specialty-Auktionssiegel — hohe Prämien' },
    ],
    importers: [
      { name: 'Neumann Kaffee Gruppe', city: 'Hamburg', segment: 'commercial', annualVolumeKt: 850, notes: 'Weltgrößter Rohkaffee-Händler, Büros in Addis Abeba und Nairobi' },
      { name: 'Volcafe (ED&F Man)', city: 'Hamburg', segment: 'commercial', annualVolumeKt: 400, notes: 'Starker Fokus auf Ostafrika; direkte Farmprogramme' },
      { name: 'ECOM Agroindustrial', city: 'Hamburg', segment: 'commercial', annualVolumeKt: 350, notes: 'Nachhaltigkeit & Tracibility-Programm' },
      { name: 'Bernhard Rothfos', city: 'Hamburg', segment: 'commercial', annualVolumeKt: 180, notes: 'Tochter NKG; Spezialisierung African Origins' },
      { name: 'Coffeeroasters (The Barn)', city: 'Berlin', segment: 'specialty', annualVolumeKt: 0.8, notes: 'Direct Trade; zahlt 2× Marktpreis für Ethiopia Naturals' },
      { name: 'Five Elephant', city: 'Berlin', segment: 'specialty', annualVolumeKt: 0.4, notes: 'SCA Gold Member; Ethiopian & Kenyan focus' },
      { name: 'Gardelli Specialty', city: 'Hamburg', segment: 'specialty', annualVolumeKt: 0.3, notes: 'World Brewers Cup connections' },
      { name: 'EDEKA / Rewe / Aldi', city: 'national', segment: 'retail', annualVolumeKt: 200, notes: 'Private Label; Zertifizierung Pflicht; Preis-sensibel' },
    ],
    entryPorts: [
      { name: 'Hamburg', country: 'Deutschland', transitDaysFromMombasa: 24, directService: true, notes: 'Kaffeebörse Hamburg; CMA CGM & MSC Direktlinien' },
      { name: 'Bremen / Bremerhaven', country: 'Deutschland', transitDaysFromMombasa: 26, directService: false, notes: 'Alternative für Norddeutschland; geringere Hafenkosten' },
    ],
    logisticsNotes: [
      'Hamburg ist der größte Kaffeehafen Europas — direkter Zugang zu Silos, Labs und Brokern',
      'CMA CGM und MSC bieten Direktlinien Mombasa–Hamburg (24–26 Tage)',
      'Mindestbestellmenge vieler Hamburger Händler: 1 Container (18–19 t)',
      'Lagerung in Hamburg möglich (bonded warehouse, Zollaussetzung)',
    ],
    seasonalDemand: [8, 7, 6, 5, 5, 4, 4, 5, 6, 8, 9, 9],
    entrySteps: [
      { id: 'de_1', title: 'EU-Lebensmittelrecht prüfen', description: 'EC 178/2002, EU 852/2004 (Hygiene), Kontaminantenverordnung', effort: 'low', timelineWeeks: 2, category: 'legal' },
      { id: 'de_2', title: 'Importeur / Broker kontaktieren', description: 'Neumann, Volcafe oder einen Hamburger Spezialitätshändler ansprechen; Musterpartie 50 kg', effort: 'medium', timelineWeeks: 4, category: 'commercial' },
      { id: 'de_3', title: 'Cupping & Qualitätsfreigabe', description: 'Probe an externes Labor (SGS/Intertek); Aflatoxin < 10 ppb', effort: 'medium', timelineWeeks: 3, category: 'certification' },
      { id: 'de_4', title: 'CHED-PP / TRACES registrieren', description: 'EU-Importeur muss CHED-PP vor Ankunft in TRACES anlegen', effort: 'low', timelineWeeks: 1, category: 'logistics' },
      { id: 'de_5', title: 'Zertifizierung starten (optional)', description: 'Bio oder Fairtrade für Prämium-Segment; 6–12 Monate Vorlauf', effort: 'high', timelineWeeks: 26, category: 'certification' },
      { id: 'de_6', title: 'Erstlieferung & Feedback', description: '1 FCL (18 t) als Testlieferung; Feedback für Röster einholen', effort: 'medium', timelineWeeks: 6, category: 'commercial' },
    ],
    keyInsights: [
      'Hamburg ist das Herz des europäischen Rohkaffeehandels — hier sitzt die Infrastruktur',
      'Specialty-Segment wächst jährlich ~8%; Berlin & München sind Hotspots',
      '0% Zoll durch EBA/DCTS — kein Kostennachteil gegenüber Brasilien oder Vietnam',
      'EUDR ab Ende 2025/2026 — frühzeitig GPS-Polygone der Farmflächen sichern',
      'Deutsche Röster zahlen für cupped >85 SCA Points bis 22 €/kg',
    ],
    accent: '#2d6a4f',
  },
  {
    id: 'nl', name: 'Niederlande', nameLocal: 'Netherlands', flag: '🇳🇱', currency: 'EUR', region: 'EU',
    importVolumeKt: 950, importValueBn: 3.2, perCapitaKg: 6.4, growthPctYoY: 2.1, specialtySharePct: 18,
    premiumSpecialtyMin: 7.5, premiumSpecialtyMax: 20.0, premiumCommercialMin: 3.5, premiumCommercialMax: 5.8,
    dutyMfnPct: 0, dutyPreferencePct: 0, preferenceScheme: 'EBA / DCTS',
    importVatPct: 9, specialTaxNote: '9% MwSt. auf Kaffee in NL (im Gegensatz zu DE)',
    aflatoxinLimitPpb: 10, aflatoxinTotalPpb: 15, moistureMaxPct: 12.5,
    documents: [
      { name: 'Phytosanitäres Zertifikat', mandatory: true },
      { name: 'EUR.1 / REX-Erklärung', mandatory: true },
      { name: 'CHED-PP (NVWA)', mandatory: true, note: 'Nederlandse Voedsel- en Warenautoriteit' },
      { name: 'Handelsrechnung + Packinglist', mandatory: true },
      { name: 'B/L oder AWB', mandatory: true },
    ],
    labelingLanguages: ['Niederländisch', 'Englisch akzeptiert'],
    labelingRequirements: ['Ursprungsland', 'Nettomenge', 'Haltbarkeitsdatum', 'Importeur-Adresse (NL/EU)'],
    certifications: [
      { name: 'UTZ / Rainforest Alliance', required: false, description: 'De Facto Standard für Supermarktketten' },
      { name: 'Bio (EU)', required: false, description: '+12% Prämie; Albert Heijn Bio-Range wächst' },
      { name: 'Max Havelaar (Fairtrade NL)', required: false, description: 'Starke Marke in Benelux' },
    ],
    importers: [
      { name: 'Sucafina', city: 'Rotterdam', segment: 'commercial', annualVolumeKt: 600, notes: 'Global Trader; Africa-origin Spezialisierung' },
      { name: 'Louis Dreyfus Company', city: 'Rotterdam', segment: 'commercial', annualVolumeKt: 500, notes: 'Rohstoffgigant; direkte Farming-Programme' },
      { name: 'Trabocca', city: 'Amsterdam', segment: 'specialty', annualVolumeKt: 1.5, notes: 'Reines Specialty-Haus; bekannt für Ethiopian Naturals' },
      { name: 'Koffiebranderij Brandmeester', city: 'Amsterdam', segment: 'roaster', annualVolumeKt: 3, notes: 'Independent roaster; Direct Trade Fokus' },
    ],
    entryPorts: [
      { name: 'Rotterdam', country: 'Niederlande', transitDaysFromMombasa: 22, directService: true, notes: 'Größter Containerhafen Europas; CMA CGM, MSC, Hapag-Lloyd' },
      { name: 'Amsterdam', country: 'Niederlande', transitDaysFromMombasa: 24, directService: false, notes: 'Cocoa & Coffee hub; kleinerer Hafen' },
    ],
    logisticsNotes: [
      'Rotterdam = wichtigstes Tor Europas; günstige Hafenkosten & exzellente Infrastruktur',
      'Freie Lagerzone Rotterdam für Zollaussetzung nutzbar',
      'Transhipment-Hub für ganz EU — von hier weiter nach DE/FR/IT per Binnenschiff oder LKW',
    ],
    seasonalDemand: [7, 6, 6, 5, 5, 4, 4, 5, 6, 7, 8, 9],
    entrySteps: [
      { id: 'nl_1', title: 'NVWA-Anforderungen prüfen', description: 'Niederländische Lebensmittelbehörde; Aflatoxin & Pestizidlimits', effort: 'low', timelineWeeks: 1, category: 'legal' },
      { id: 'nl_2', title: 'Rotterdam-Broker ansprechen', description: 'Sucafina oder LDC für erste Partie', effort: 'medium', timelineWeeks: 3, category: 'commercial' },
      { id: 'nl_3', title: 'CHED-PP vorbereiten', description: 'Importeur kümmert sich; Lieferant stellt Phyto-Cert bereit', effort: 'low', timelineWeeks: 1, category: 'logistics' },
      { id: 'nl_4', title: 'Specialty-Netzwerk aufbauen', description: 'Trabocca & Brandmeester für Direct-Trade-Programm', effort: 'medium', timelineWeeks: 8, category: 'commercial' },
    ],
    keyInsights: [
      'Rotterdam ist der günstigste EU-Einstiegshafen für Ostafrika-Kaffee',
      'NL hat 9% MwSt auf Kaffee (anders als DE mit 0%)',
      'Trabocca zahlt für Top-Lots aus Äthiopien bis 20 €/kg',
      'NL ist re-export Hub — von hier gelangt Kaffee in ganz Europa',
    ],
    accent: '#e77d11',
  },
  {
    id: 'it', name: 'Italien', nameLocal: 'Italy', flag: '🇮🇹', currency: 'EUR', region: 'EU',
    importVolumeKt: 550, importValueBn: 2.1, perCapitaKg: 5.8, growthPctYoY: 1.2, specialtySharePct: 8,
    premiumSpecialtyMin: 6.0, premiumSpecialtyMax: 14.0, premiumCommercialMin: 2.8, premiumCommercialMax: 4.5,
    dutyMfnPct: 0, dutyPreferencePct: 0, preferenceScheme: 'EBA / DCTS',
    importVatPct: 22, specialTaxNote: '22% MwSt. auf Kaffee (Standard-MwSt. IT)',
    aflatoxinLimitPpb: 10, aflatoxinTotalPpb: 15, moistureMaxPct: 12.5,
    documents: [
      { name: 'Phytosanitäres Zertifikat', mandatory: true },
      { name: 'EUR.1 / REX', mandatory: true },
      { name: 'CHED-PP (UVAC)', mandatory: true, note: 'Uffici di Sanità Marittima' },
      { name: 'Certificato di Origine (COO)', mandatory: true },
      { name: 'Fattura Commerciale', mandatory: true },
    ],
    labelingLanguages: ['Italienisch'],
    labelingRequirements: ['Paese di Origine', 'Peso netto', 'Data di scadenza', 'Nome importatore IT'],
    certifications: [
      { name: 'Bio (IT BIO)', required: false, description: 'Wächst; ICEA oder Suolo e Salute als Zertifizierer' },
      { name: 'Rainforest Alliance', required: false, description: 'Lavazza und illy bevorzugen es' },
    ],
    importers: [
      { name: 'illycaffè', city: 'Triest', segment: 'roaster', annualVolumeKt: 22, notes: 'Premium-Röster; eigene Qualitätsskala; direkter Ankauf in Ursprungsländern' },
      { name: 'Lavazza', city: 'Turin', segment: 'roaster', annualVolumeKt: 130, notes: 'Weltmarke; wächst in Specialty; Nachhaltigkeitsprogramme' },
      { name: 'Segafredo (Massimo Zanetti)', city: 'Bologna', segment: 'commercial', annualVolumeKt: 90, notes: 'Multi-Origin Blends; preissensibel' },
      { name: 'Pellini Caffè', city: 'Verona', segment: 'commercial', annualVolumeKt: 15, notes: 'Arabica-Fokus; wächst in DE und UK' },
    ],
    entryPorts: [
      { name: 'Triest', country: 'Italien', transitDaysFromMombasa: 26, directService: false, notes: 'Historischer Kaffeehafen; Zugang zu illycaffè' },
      { name: 'Genua', country: 'Italien', transitDaysFromMombasa: 28, directService: false, notes: 'MSC Feeder; für Norditalien' },
    ],
    logisticsNotes: [
      'Triest hat starke Kaffeebörsen-Tradition',
      'Meist Transhipment über Rotterdam oder Hamburg nach IT',
      'illy kauft direkt in Ursprungsländern — Partnership-Gespräch lohnt',
    ],
    seasonalDemand: [8, 8, 7, 7, 6, 5, 5, 6, 7, 8, 8, 9],
    entrySteps: [
      { id: 'it_1', title: 'Importeur-Lizenz (IT)', description: 'UVAC-Registrierung des Importeurs prüfen', effort: 'low', timelineWeeks: 2, category: 'legal' },
      { id: 'it_2', title: 'illy / Lavazza Kontakt', description: 'Cupping-Einladung nach Triest / Turin; Proben einsenden', effort: 'medium', timelineWeeks: 6, category: 'commercial' },
      { id: 'it_3', title: 'Italian Specialty Distributors', description: 'Kleines Specialty-Segment wächst in Mailand, Rom, Florenz', effort: 'high', timelineWeeks: 12, category: 'commercial' },
    ],
    keyInsights: [
      'Italien ist espresso-dominiert — Robusta-Blends vorherrschend; Arabica-Anteil steigt',
      'illy zahlt bis zu 50% Prämie über C-Preis für äthiopische Yirgacheffe-Qualitäten',
      'Specialty-Bewegung wächst in Mailand und Florenz — aber langsam',
      'Hohe 22% MwSt. drückt Margen im B2C-Segment',
    ],
    accent: '#c1121f',
  },
  {
    id: 'us', name: 'USA', nameLocal: 'United States', flag: '🇺🇸', currency: 'USD', region: 'Americas',
    importVolumeKt: 1700, importValueBn: 8.5, perCapitaKg: 4.8, growthPctYoY: 3.2, specialtySharePct: 42,
    premiumSpecialtyMin: 9.0, premiumSpecialtyMax: 35.0, premiumCommercialMin: 4.2, premiumCommercialMax: 7.0,
    dutyMfnPct: 0, dutyPreferencePct: 0, preferenceScheme: 'GSP / AGOA (0% für Äthiopien/Kenia)',
    importVatPct: 0, specialTaxNote: 'Kein Bundeszoll auf grünen Kaffee; State Sales Tax variiert',
    aflatoxinLimitPpb: 20, aflatoxinTotalPpb: 20, moistureMaxPct: 13,
    documents: [
      { name: 'FDA Prior Notice', mandatory: true, note: '8h vor Ankunft via FDA Bioterrorism Act' },
      { name: 'US CBP Entry Summary (CF-7501)', mandatory: true },
      { name: 'Commercial Invoice', mandatory: true },
      { name: 'Bill of Lading / AWB', mandatory: true },
      { name: 'Packing List', mandatory: true },
      { name: 'FDA Food Facility Registration (Exporter)', mandatory: true, note: 'Einmalig für Exporteur erforderlich' },
      { name: 'Phytosanitary Certificate', mandatory: false, note: 'USDA APHIS empfohlen aber nicht immer Pflicht' },
      { name: 'ICO Certificate of Origin', mandatory: false, note: 'Für ICO-Mitgliedsländer empfohlen' },
    ],
    labelingLanguages: ['Englisch'],
    labelingRequirements: ['Country of Origin (COOL)', 'Net weight (oz/g)', 'Importer of Record name/address', 'FDA Facility Reg. Number'],
    certifications: [
      { name: 'USDA Organic', required: false, description: 'Starkes Wachstum; NOP-akkreditierter Zertifizierer nötig' },
      { name: 'Fair Trade USA', required: false, description: 'Eigene US-Organisation; anders als Fairtrade International' },
      { name: 'Rainforest Alliance', required: false, description: 'Starbucks & Grocery' },
      { name: 'Direct Trade', required: false, description: 'Marketing-Label; kein Standard; sehr wirksam im US Specialty' },
      { name: 'SCA Quality Score', required: false, description: '>80 = Specialty; >85 = Premium; >90 = exceptional' },
    ],
    importers: [
      { name: 'Starbucks Coffee Company', city: 'Seattle, WA', segment: 'roaster', annualVolumeKt: 200, notes: 'Direktkäufe über Farmer Support Center Kenia/Äthiopien; C.A.F.E. Practices' },
      { name: 'Royal Coffee', city: 'Oakland, CA', segment: 'specialty', annualVolumeKt: 8, notes: 'Führender US Specialty-Importeur; starke Africa-Origins Abteilung' },
      { name: 'Interamerican Coffee', city: 'New York, NY', segment: 'commercial', annualVolumeKt: 150, notes: 'Volcafe-Tochter; Ethiopia & Kenya-Lots' },
      { name: 'Red Fox Coffee Merchants', city: 'Petaluma, CA', segment: 'specialty', annualVolumeKt: 2, notes: 'Boutique Importer; höchste Prämien; direkte Farmbeziehungen' },
      { name: 'Cafe Imports', city: 'Minneapolis, MN', segment: 'specialty', annualVolumeKt: 5, notes: 'Beste Africa-Selektion im US Specialty-Markt' },
      { name: 'Intelligentsia Coffee', city: 'Chicago, IL', segment: 'roaster', annualVolumeKt: 4, notes: 'Pionier Direct Trade; Äthiopien Yirgacheffe Fokus' },
    ],
    entryPorts: [
      { name: 'Los Angeles / Long Beach', country: 'USA', transitDaysFromMombasa: 28, directService: false, notes: 'Größter US-Hafen; Transhipment über Suez oder Kapstadt' },
      { name: 'New York / Newark', country: 'USA', transitDaysFromMombasa: 25, directService: false, notes: 'Ostküste; näher an Kaffee-Handelsunternehmen' },
      { name: 'Seattle', country: 'USA', transitDaysFromMombasa: 32, directService: false, notes: 'Westküste; Starbucks-Hafen' },
    ],
    logisticsNotes: [
      'Kein Direktservice Ostafrika–USA; Transhipment über Colombo, Jeddah oder europäische Hubs',
      'FDA Bioterrorism Act: Prior Notice mind. 8h vor Hafeneinfahrt',
      'Quarantäne-Inspektion USDA APHIS möglich — Verzögerung einkalkulieren',
      'Für Specialty: Air freight 50 kg Muster für Cupping vorab senden',
    ],
    seasonalDemand: [7, 6, 7, 6, 6, 5, 5, 6, 7, 8, 8, 9],
    entrySteps: [
      { id: 'us_1', title: 'FDA Food Facility Registration', description: 'Exporteur muss sich bei FDA registrieren (kostenlos, biennial renewal)', effort: 'low', timelineWeeks: 1, category: 'legal' },
      { id: 'us_2', title: 'US Importer of Record finden', description: 'IOR haftet gegenüber CBP; Cafe Imports oder Royal Coffee ansprechen', effort: 'medium', timelineWeeks: 4, category: 'commercial' },
      { id: 'us_3', title: 'SCA Cupping Score ermitteln', description: '>85 SCA öffnet US Specialty; unabhängiges Lab beauftragen', effort: 'medium', timelineWeeks: 3, category: 'certification' },
      { id: 'us_4', title: 'USDA Organic (NOP) starten', description: 'Für USDA-Organic: NOP-akkreditierter Zertifizierer; 12+ Monate', effort: 'high', timelineWeeks: 52, category: 'certification' },
      { id: 'us_5', title: 'Erstlieferung (1 FCL)', description: 'Mit IOR abwickeln; FDA Prior Notice 8h vorher', effort: 'medium', timelineWeeks: 8, category: 'logistics' },
    ],
    keyInsights: [
      'USA ist der weltgrößte Specialty-Kaffee-Markt — 42% Specialty-Anteil',
      'Red Fox & Cafe Imports zahlen bis 35 USD/kg für Competition-Lots aus Äthiopien',
      '0% Zoll durch AGOA für Äthiopien und Kenia — direkter Wettbewerbsvorteil',
      'USDA Organic öffnet Whole Foods / Amazon Fresh — deutliche Prämie',
      'Specialty-Einkäufer reisen selbst nach Äthiopien/Kenia — Einladung lohnt',
    ],
    accent: '#3d405b',
  },
  {
    id: 'uk', name: 'Vereinigtes Königreich', nameLocal: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', region: 'Europe',
    importVolumeKt: 190, importValueBn: 1.4, perCapitaKg: 2.8, growthPctYoY: 4.1, specialtySharePct: 31,
    premiumSpecialtyMin: 7.0, premiumSpecialtyMax: 25.0, premiumCommercialMin: 3.2, premiumCommercialMax: 5.5,
    dutyMfnPct: 0, dutyPreferencePct: 0, preferenceScheme: 'UK DCTS / SACUM EPA',
    importVatPct: 0, specialTaxNote: '0% UK VAT auf ungerösteten Kaffee (Zero-rated)',
    aflatoxinLimitPpb: 10, aflatoxinTotalPpb: 15, moistureMaxPct: 12.5,
    documents: [
      { name: 'UK Phytosanitary Certificate', mandatory: true, note: 'APHA (Animal and Plant Health Agency)' },
      { name: 'UK IPAFFS Notification', mandatory: true, note: 'Import of products, animals, food and feed system' },
      { name: 'Certificate of Origin', mandatory: true, note: 'Für UK DCTS Präferenz' },
      { name: 'Commercial Invoice', mandatory: true },
      { name: 'Bill of Lading', mandatory: true },
    ],
    labelingLanguages: ['Englisch'],
    labelingRequirements: ['Country of Origin', 'Net weight', 'Best Before / Roast date', 'UK importer address (post-Brexit)'],
    certifications: [
      { name: 'Rainforest Alliance', required: false, description: "Tesco, Sainsbury's Standard" },
      { name: 'Fairtrade (Fairtrade UK)', required: false, description: 'Sehr bekannte Marke in UK' },
      { name: 'Soil Association Organic', required: false, description: 'UK-Organic Post-Brexit; eigene Zertifizierung' },
    ],
    importers: [
      { name: 'Taylors of Harrogate', city: 'Harrogate', segment: 'commercial', annualVolumeKt: 30, notes: 'Bekannt für Kenyan AA; direkter Origin-Ankauf' },
      { name: 'Union Hand-Roasted', city: 'London', segment: 'specialty', annualVolumeKt: 3, notes: 'Specialty Pionier UK; Ethiopia & Kenya Direct Trade' },
      { name: 'Square Mile Coffee', city: 'London', segment: 'specialty', annualVolumeKt: 1, notes: 'World Barista Championship Connections; Top-Lots' },
      { name: 'Notes Coffee', city: 'London', segment: 'specialty', annualVolumeKt: 0.5, notes: 'London-based multi-site; Africa Specialty focus' },
      { name: 'Olam Agri', city: 'London', segment: 'commercial', annualVolumeKt: 200, notes: 'UK Niederlassung des Global Trader; Africa-Herkunftsexpertise' },
    ],
    entryPorts: [
      { name: 'Felixstowe', country: 'UK', transitDaysFromMombasa: 26, directService: false, notes: 'Größter UK-Containerhafen; Transhipment Rotterdam' },
      { name: 'London Thamesport', country: 'UK', transitDaysFromMombasa: 27, directService: false, notes: 'Näher an Specialty-Röstern in London' },
    ],
    logisticsNotes: [
      'Post-Brexit: Separate UK-Phytozertifikate & IPAFFS nötig (nicht mehr EU TRACES)',
      'Transhipment meist über Rotterdam; direkte Linie selten',
      'UK DCTS ersetzt EU EBA — prüfe Ursprungsregeln (Substantial transformation)',
    ],
    seasonalDemand: [7, 6, 6, 5, 5, 5, 5, 5, 6, 7, 8, 9],
    entrySteps: [
      { id: 'uk_1', title: 'UK DCTS Ursprungsregeln prüfen', description: 'Post-Brexit eigene Regeln; Ursprungszeugnis korrekt ausstellen', effort: 'low', timelineWeeks: 2, category: 'legal' },
      { id: 'uk_2', title: 'IPAFFS-Registrierung', description: 'UK-Importeur muss IPAFFS-Account haben und Vornotifikation machen', effort: 'low', timelineWeeks: 1, category: 'logistics' },
      { id: 'uk_3', title: 'Specialty-Röster ansprechen', description: 'Union Hand-Roasted & Square Mile für Africa-Lots; Proben einsenden', effort: 'medium', timelineWeeks: 6, category: 'commercial' },
      { id: 'uk_4', title: 'Soil Association Organic (optional)', description: 'Für UK-Organic-Markt; eigene Zertifizierung post-Brexit', effort: 'high', timelineWeeks: 30, category: 'certification' },
    ],
    keyInsights: [
      'UK Specialty-Markt wächst stark — Drittgrößter Specialty-Markt nach US und DE',
      'Post-Brexit separate Regulierung — kein EU TRACES mehr; IPAFFS nutzen',
      'Taylors of Harrogate ist großer Abnehmer für Kenyan AA-Qualitäten',
      '0% UK-Zoll durch DCTS für äthiopischen und kenianischen Kaffee',
      'London Coffee Festival jährlich — wichtige Networking-Plattform',
    ],
    accent: '#0b3d91',
  },
  {
    id: 'jp', name: 'Japan', nameLocal: 'Japan (日本)', flag: '🇯🇵', currency: 'JPY', region: 'Asia',
    importVolumeKt: 440, importValueBn: 2.8, perCapitaKg: 3.5, growthPctYoY: 1.5, specialtySharePct: 28,
    premiumSpecialtyMin: 10.0, premiumSpecialtyMax: 40.0, premiumCommercialMin: 4.5, premiumCommercialMax: 7.5,
    dutyMfnPct: 0, dutyPreferencePct: 0, preferenceScheme: 'GSP Japan (0% für Äthiopien/Kenia)',
    importVatPct: 10, specialTaxNote: '10% Consumption Tax Japan; Lebensmittel meist 8%',
    aflatoxinLimitPpb: 10, aflatoxinTotalPpb: 10, moistureMaxPct: 12,
    documents: [
      { name: 'Phytosanitary Certificate', mandatory: true, note: 'Ministry of Agriculture, Forestry and Fisheries (MAFF)' },
      { name: 'Food Sanitation Import Notification (FSN)', mandatory: true, note: 'Ministry of Health, Labour and Welfare; muss vor Ankunft eingereicht werden' },
      { name: 'Certificate of Origin', mandatory: true, note: 'Für GSP Präferenz' },
      { name: 'Commercial Invoice (japanisch oder EN)', mandatory: true },
      { name: 'Packing List', mandatory: true },
      { name: 'Bill of Lading', mandatory: true },
    ],
    labelingLanguages: ['Japanisch'],
    labelingRequirements: ['産地 (Ursprungsland)', '内容量 (Nettogewicht)', '賞味期限 (MHD)', '輸入者名 (Importeur)', 'Allergenkennzeichnung nach JAS'],
    certifications: [
      { name: 'JAS Organic', required: false, description: 'Japanese Agricultural Standard; eigene Zertifizierung; sehr wertvoll' },
      { name: 'Rainforest Alliance', required: false, description: 'UCCやKEYcoffee bevorzugen es' },
      { name: 'Fairtrade Japan', required: false, description: 'Wachsend; UTZ-kompatibel' },
      { name: 'Cup of Excellence Auction Lot', required: false, description: 'Japanische Käufer dominieren CoE-Auktionen; sehr hohe Prämien' },
    ],
    importers: [
      { name: 'UCC Ueshima Coffee', city: 'Tokyo', segment: 'commercial', annualVolumeKt: 90, notes: 'Größter JP-Röster; eigene Farmen in Hawaii und Jamaica' },
      { name: 'Key Coffee', city: 'Tokyo', segment: 'commercial', annualVolumeKt: 60, notes: 'Starker Fokus auf Ethiopia & Tanzania-Lots' },
      { name: 'Maruyama Coffee', city: 'Nagano', segment: 'specialty', annualVolumeKt: 0.8, notes: 'Weltbekannt im Specialty-Segment; zahlt Rekordpreise bei CoE' },
      { name: 'Streamer Coffee', city: 'Tokyo', segment: 'specialty', annualVolumeKt: 0.3, notes: 'Barista-Champion Connections; Africa-Lots fokussiert' },
      { name: 'Wataru & Co.', city: 'Osaka', segment: 'commercial', annualVolumeKt: 40, notes: 'Trading-Haus; Ethiopia Sidama Spezialisierung' },
    ],
    entryPorts: [
      { name: 'Kobe', country: 'Japan', transitDaysFromMombasa: 30, directService: false, notes: 'Traditioneller Kaffeehafen Japans; Transhipment Colombo oder Singapur' },
      { name: 'Yokohama / Tokyo', country: 'Japan', transitDaysFromMombasa: 32, directService: false, notes: 'Nähe zu großen Röstern in Kanto-Region' },
    ],
    logisticsNotes: [
      'Transhipment meist über Colombo, Singapur oder Hongkong',
      'FSN (Food Sanitation Notification) min. 24h vor Ankunft beim MLHW',
      'Japanische Käufer zahlen per T/T nach Dokumentenprüfung — kurze Zahlungsziele verhandeln',
      'CoE-Lots: Luftfracht 50 kg Muster oft günstiger als warten auf Meeresweg',
    ],
    seasonalDemand: [7, 6, 6, 5, 5, 6, 6, 7, 7, 8, 8, 8],
    entrySteps: [
      { id: 'jp_1', title: 'FSN Prozess verstehen', description: 'Food Sanitation Import Notification via MLHW; Importeur muss es einreichen', effort: 'medium', timelineWeeks: 3, category: 'legal' },
      { id: 'jp_2', title: 'JAS Organic prüfen', description: 'Sehr wertvolle Zertifizierung für JP; teuer und aufwendig', effort: 'high', timelineWeeks: 40, category: 'certification' },
      { id: 'jp_3', title: 'CoE-Auktion Lots vorbereiten', description: 'Maruyama und Streamer kaufen Competition-Lots; via Cup of Excellence teilnehmen', effort: 'high', timelineWeeks: 16, category: 'commercial' },
      { id: 'jp_4', title: 'Key Coffee / UCC ansprechen', description: 'Kommerzieller Einstieg über etablierte Trading-Häuser', effort: 'medium', timelineWeeks: 8, category: 'commercial' },
    ],
    keyInsights: [
      'Japan ist der weltweit wichtigste Markt für Ethiopia Sidama und Yirgacheffe',
      'CoE-Auktionsgewinner gehen zu 60-70% an japanische Käufer — höchste Prämien weltweit',
      'JAS Organic öffnet Naturkostläden und Premium-Supermärkte',
      'Etikettierungsvorschriften sind sehr streng — vollständige JP-Übersetzung Pflicht',
      'Japanische Geschäftskultur: Langfristige Beziehungen > Spot-Käufe',
    ],
    accent: '#d62828',
  },
  {
    id: 'ae', name: 'VAE / Dubai', nameLocal: 'United Arab Emirates', flag: '🇦🇪', currency: 'AED', region: 'Gulf',
    importVolumeKt: 95, importValueBn: 0.9, perCapitaKg: 1.8, growthPctYoY: 8.5, specialtySharePct: 35,
    premiumSpecialtyMin: 8.0, premiumSpecialtyMax: 30.0, premiumCommercialMin: 4.0, premiumCommercialMax: 6.5,
    dutyMfnPct: 5, dutyPreferencePct: 0, preferenceScheme: 'GCC Common Tariff (5%); kein EBA',
    importVatPct: 5, specialTaxNote: '5% UAE VAT seit 2018; Grundnahrungsmittel teilweise 0%',
    aflatoxinLimitPpb: 10, aflatoxinTotalPpb: 15, moistureMaxPct: 13,
    documents: [
      { name: 'Phytosanitary Certificate', mandatory: true, note: 'MOCCAE Anforderung' },
      { name: 'Certificate of Origin (Halal/COO)', mandatory: true, note: 'Arabisches Ursprungszeugnis (Arab League COO empfohlen)' },
      { name: 'Commercial Invoice (arabisch oder EN)', mandatory: true },
      { name: 'Health Certificate', mandatory: true, note: 'MOCCAE – Ministry of Climate Change and Environment' },
      { name: 'Packing List', mandatory: true },
      { name: 'Bill of Lading / AWB', mandatory: true },
      { name: 'Halal-Zertifikat', mandatory: false, note: 'Bei verarbeitetem Kaffee (Extrakt, Flavors) empfohlen' },
    ],
    labelingLanguages: ['Arabisch', 'Englisch'],
    labelingRequirements: ['Country of Origin (Arabisch)', 'Net weight (g/kg)', 'Expiry date', 'Importeur VAE', 'Halal-Status (wenn zutreffend)'],
    certifications: [
      { name: 'Halal Certification', required: false, description: 'Für Röst- oder Verarbeitungsprodukte; roher Kaffee meist ausgenommen' },
      { name: 'Rainforest Alliance', required: false, description: 'Hotel- und Hospitality-Segment (Marriott, Hilton etc.)' },
      { name: 'UTZ', required: false, description: 'Wachsend bei großen F&B-Ketten' },
    ],
    importers: [
      { name: 'Dubai Coffee Museum / Al Khayat Group', city: 'Dubai', segment: 'specialty', annualVolumeKt: 2, notes: 'Spezialisiert auf Specialty und Origin-Coffees; starke Markenpräsenz' },
      { name: 'Mitr Phol Sugar & Coffee', city: 'Dubai, JAFZA', segment: 'commercial', annualVolumeKt: 15, notes: 'JAFZA (Jebel Ali) Free Zone; Re-export in die Region' },
      { name: 'Bateel International', city: 'Dubai', segment: 'retail', annualVolumeKt: 1, notes: 'Luxury F&B; Ethiopia single-origin focus' },
      { name: 'Coffee Planet', city: 'Dubai', segment: 'roaster', annualVolumeKt: 3, notes: 'UAE-Röster; wächst in GCC; Africa-Lots gesucht' },
      { name: 'Five Senses / Specialty Distributors', city: 'Dubai', segment: 'specialty', annualVolumeKt: 0.8, notes: 'Boutique Distributor; direkte Farmbeziehungen bevorzugt' },
    ],
    entryPorts: [
      { name: 'Jebel Ali (Dubai)', country: 'VAE', transitDaysFromMombasa: 12, directService: true, notes: 'Direktlinie von Mombasa; 10–14 Tage; CMA CGM, MSC, Maersk' },
      { name: 'Abu Dhabi', country: 'VAE', transitDaysFromMombasa: 13, directService: false, notes: 'Alternative; geringeres Volumen' },
    ],
    logisticsNotes: [
      'Kürzeste Transportzeit aus Ostafrika — 10–14 Tage Mombasa–Jebel Ali',
      'Dubai JAFZA Free Zone für Re-export ideal — Zollaussetzung möglich',
      'Halal-Zertifikat nicht für rohen Kaffee nötig, aber für Kaffeemischungen mit Zusätzen',
      'Starkes Wachstum der Specialty-Szene in Dubai (3rd Wave seit 2015)',
    ],
    seasonalDemand: [5, 5, 5, 4, 4, 3, 3, 4, 5, 6, 6, 7],
    entrySteps: [
      { id: 'ae_1', title: 'MOCCAE Anforderungen prüfen', description: 'Ministry of Climate Change; Phyto + Health Cert erforderlich', effort: 'low', timelineWeeks: 2, category: 'legal' },
      { id: 'ae_2', title: 'JAFZA-Importeur finden', description: 'Free Zone Operator für Re-export Option; Mitr Phol ansprechen', effort: 'medium', timelineWeeks: 4, category: 'commercial' },
      { id: 'ae_3', title: 'Specialty-Röster in Dubai', description: 'Coffee Planet & Dubai Coffee Museum; Proben einsenden', effort: 'medium', timelineWeeks: 4, category: 'commercial' },
      { id: 'ae_4', title: 'Gulf Food Exhibition', description: 'Jährlich in Dubai; wichtigste F&B-Messe für GCC', effort: 'high', timelineWeeks: 8, category: 'commercial' },
    ],
    keyInsights: [
      'Dubai ist Re-export Hub für gesamte GCC-Region (Saudi, Kuwait, Qatar, Oman)',
      'Kürzeste Distanz von Mombasa — 12 Tage Schiffsweg; Kostenvorteil',
      'Specialty-Szene in Dubai wächst exponentiell — 3rd Wave-Cafés boomen',
      '5% GCC-Zoll — einziger Markt in dieser Liste ohne 0% Zollpräferenz',
      'Gulf Food Dubai (Februar) ist die wichtigste Eintrittspforte',
    ],
    accent: '#e9c46a',
  },
  {
    id: 'cn', name: 'China', nameLocal: 'China (中国)', flag: '🇨🇳', currency: 'CNY', region: 'Asia',
    importVolumeKt: 160, importValueBn: 1.2, perCapitaKg: 0.12, growthPctYoY: 15.0, specialtySharePct: 45,
    premiumSpecialtyMin: 7.0, premiumSpecialtyMax: 28.0, premiumCommercialMin: 3.5, premiumCommercialMax: 6.0,
    dutyMfnPct: 10, dutyPreferencePct: 0, preferenceScheme: 'MFN 10%; Reduzierung unter AFCFTA möglich (Äthiopien)',
    importVatPct: 9, specialTaxNote: '9% CN VAT auf Lebensmittel + 10% Einfuhrzoll (MFN)',
    aflatoxinLimitPpb: 5, aflatoxinTotalPpb: 10, moistureMaxPct: 12,
    documents: [
      { name: 'GACC Registration (General Administration of Customs China)', mandatory: true, note: 'Exporteur UND Verarbeitungsstätte müssen bei GACC registriert sein' },
      { name: 'Phytosanitary Certificate', mandatory: true, note: 'GACC-Anforderung; vom NPPO ausgestellt' },
      { name: 'China Customs Declaration', mandatory: true },
      { name: 'Commercial Invoice (chinesisch oder EN)', mandatory: true },
      { name: 'Packing List', mandatory: true },
      { name: 'B/L', mandatory: true },
      { name: 'Food Safety Certificate', mandatory: false, note: 'Empfohlen; SAMR (State Admin. of Market Regulation)' },
    ],
    labelingLanguages: ['Chinesisch (Mandarin)'],
    labelingRequirements: ['原产国 (Ursprungsland)', '净含量 (Nettogehalt)', '生产日期/保质期 (Datum/MHD)', '进口商 (Importeur CN)', '成分表 (Zutaten)', 'GB-Standard Konformität'],
    certifications: [
      { name: 'China Organic (GB19630)', required: false, description: 'Chinesische Bio-Norm; eigene CN-Zertifizierung oder akkreditierter Drittaustausch' },
      { name: 'CQC (China Quality Certification)', required: false, description: 'Stärkt Vertrauen bei chinesischen Käufern' },
      { name: 'UTZ / Rainforest Alliance', required: false, description: 'Bekannt bei Nestlé CN, Starbucks CN' },
    ],
    importers: [
      { name: 'Starbucks China', city: 'Shanghai', segment: 'roaster', annualVolumeKt: 45, notes: 'Größter CN-Röster; eigene Yunnan-Farmen; Prüfung afrikanischer Lots' },
      { name: 'Manner Coffee', city: 'Shanghai', segment: 'roaster', annualVolumeKt: 8, notes: 'Größter chinesischer Specialty-Röster; extrem schnelles Wachstum' },
      { name: 'Tim Hortons China', city: 'Shanghai', segment: 'commercial', annualVolumeKt: 12, notes: 'Franchise; wächst in Tier-1-Städten schnell' },
      { name: 'Shanghai Gafei Coffee', city: 'Shanghai', segment: 'commercial', annualVolumeKt: 20, notes: 'Traditioneller B2B-Importeur; GACC-registriert' },
      { name: 'Seesaw Coffee', city: 'Shanghai', segment: 'specialty', annualVolumeKt: 1, notes: 'Specialty-Kette; Africa-Lots bekannt; starkes Social-Media-Marketing' },
      { name: 'Yundao Coffee Trading', city: 'Kunming (Yunnan)', segment: 'commercial', annualVolumeKt: 5, notes: 'Yunnan-basierter Importeur; Eastern Africa-Lots für Vergleich gesucht' },
    ],
    entryPorts: [
      { name: 'Shanghai (Yangshan)', country: 'China', transitDaysFromMombasa: 22, directService: false, notes: 'Größter Containerhafen der Welt; Transhipment Colombo oder Singapur' },
      { name: 'Guangzhou (Nansha)', country: 'China', transitDaysFromMombasa: 20, directService: false, notes: 'Nähe zu Pearl River Delta; CMA CGM-Feederlinie' },
      { name: 'Tianjin', country: 'China', transitDaysFromMombasa: 28, directService: false, notes: 'Für Nordchina / Beijing' },
    ],
    logisticsNotes: [
      'GACC-Registrierung ist Pflicht — ohne Registrierung kommt die Ware nicht durch den Zoll',
      'Aflatoxin-Grenzwert CN 5 ppb (strenger als EU) — Labor-Analyse vorab Pflicht',
      'Etikettierung komplett auf Chinesisch — externe Übersetzung beauftragen',
      'Transhipment meist über Colombo oder Singapur; kein Direktservice Mombasa–China',
      'Alibaba/1688 für B2B-Leads; WeChat-Präsenz wichtig für CN-Markt',
    ],
    seasonalDemand: [5, 7, 6, 5, 5, 4, 5, 5, 6, 6, 7, 6],
    entrySteps: [
      { id: 'cn_1', title: 'GACC Exporteur-Registrierung', description: 'Pflicht; Antrag über chinesische Botschaft oder Customs Broker; 4–8 Wochen', effort: 'high', timelineWeeks: 8, category: 'legal' },
      { id: 'cn_2', title: 'Aflatoxin-Test (5 ppb)', description: 'Strenger CN-Grenzwert; Testbericht von akkreditiertem Labor besorgen', effort: 'medium', timelineWeeks: 2, category: 'certification' },
      { id: 'cn_3', title: 'CN-Importeur finden', description: 'Shanghai Gafei oder Yundao als erstes; Alibaba-Leadgenerierung', effort: 'medium', timelineWeeks: 6, category: 'commercial' },
      { id: 'cn_4', title: 'Chinesische Etikettierung', description: 'Vollständige Übersetzung Pflicht; GB-Norm-konform; teuer aber nötig', effort: 'medium', timelineWeeks: 4, category: 'legal' },
      { id: 'cn_5', title: 'Manner Coffee / Seesaw ansprechen', description: 'Specialty-Einstieg; Proben via DHL; WeChat-Kontakt aufbauen', effort: 'high', timelineWeeks: 10, category: 'commercial' },
      { id: 'cn_6', title: 'Erstlieferung (1 FCL)', description: 'Mit GACC-registriertem Importeur; Zollanmeldung durch Customs Broker', effort: 'high', timelineWeeks: 12, category: 'logistics' },
    ],
    keyInsights: [
      'China ist der am schnellsten wachsende Kaffeemarkt weltweit — 15% Wachstum p.a.',
      'GACC-Registrierung ist unvermeidbar — frühzeitig starten (8+ Wochen)',
      'Manner Coffee hat 2023 100+ Filialen/Monat eröffnet — riesiger Bedarf',
      '10% MFN-Zoll ist Nachteil — unter AFCFTA kann Äthiopien Sonderkonditionen erhalten',
      'Aflatoxin 5 ppb CN-Grenzwert — EU erlaubt 10 ppb; anderen Standard anlegen',
      'WeChat und Xiaohongshu (RED) sind Pflicht für Markenaufbau im CN-Markt',
    ],
    accent: '#e63946',
  },
];

const MONTHS_DE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SEGMENT_COLORS: Record<string, string> = {
  specialty: '#2d9596',
  commercial: '#6b7280',
  retail: '#7c3aed',
  roaster: '#b45309',
};

const EFFORT_COLORS: Record<string, string> = {
  low: '#16a34a',
  medium: '#d97706',
  high: '#dc2626',
};

const CATEGORY_COLORS: Record<string, string> = {
  legal: '#3b82f6',
  commercial: '#8b5cf6',
  logistics: '#06b6d4',
  certification: '#f59e0b',
};

function SegmentBadge({ segment }: { segment: string }) {
  return (
    <span style={{
      background: SEGMENT_COLORS[segment] ?? '#6b7280',
      color: '#fff',
      fontSize: 10,
      fontWeight: 600,
      padding: '2px 7px',
      borderRadius: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    }}>{segment}</span>
  );
}

function EffortBadge({ effort }: { effort: string }) {
  return (
    <span style={{
      background: EFFORT_COLORS[effort] ?? '#6b7280',
      color: '#fff',
      fontSize: 10,
      fontWeight: 600,
      padding: '2px 7px',
      borderRadius: 6,
      textTransform: 'uppercase',
    }}>{effort}</span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span style={{
      background: CATEGORY_COLORS[category] ?? '#6b7280',
      color: '#fff',
      fontSize: 10,
      fontWeight: 600,
      padding: '2px 7px',
      borderRadius: 6,
    }}>{category}</span>
  );
}

interface MarketSelectorProps {
  markets: CountryMarket[];
  selectedId: string;
  onSelect: (id: string) => void;
  label?: string;
  accent?: string;
}

function MarketSelector({ markets, selectedId, onSelect, label, accent }: MarketSelectorProps) {
  return (
    <div style={{ padding: '0 8px' }}>
      {label && (
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, padding: '6px 8px 2px' }}>
          {label}
        </div>
      )}
      {markets.map(m => {
        const isSelected = m.id === selectedId;
        return (
          <div
            key={m.id}
            onClick={() => onSelect(m.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 8,
              cursor: 'pointer',
              background: isSelected ? (accent ?? m.accent) + '22' : 'transparent',
              borderLeft: isSelected ? `3px solid ${accent ?? m.accent}` : '3px solid transparent',
              marginBottom: 2,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{m.flag}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {m.name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{m.region}</div>
            </div>
            {isSelected && <Ic name="chevR" size={12} />}
          </div>
        );
      })}
    </div>
  );
}

interface KpiPillProps {
  label: string;
  value: string;
  accent: string;
}

function KpiPill({ label, value, accent }: KpiPillProps) {
  return (
    <div style={{
      background: 'var(--surface-2)',
      borderRadius: 8,
      padding: '6px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      border: `1px solid ${accent}44`,
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: accent }}>{value}</div>
    </div>
  );
}

interface SeasonalChartProps {
  data: number[];
  accent: string;
  lang: Lang;
}

function SeasonalChart({ data, accent, lang }: SeasonalChartProps) {
  const months = lang === 'de' ? MONTHS_DE : MONTHS_EN;
  const max = 10;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {data.map((val, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, fontSize: 11, color: 'var(--text-3)', flexShrink: 0 }}>{months[i]}</div>
          <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 4, height: 16, overflow: 'hidden' }}>
            <div style={{
              width: `${(val / max) * 100}%`,
              height: '100%',
              background: accent,
              borderRadius: 4,
              opacity: 0.7 + (val / max) * 0.3,
              transition: 'width 0.3s',
            }} />
          </div>
          <div style={{ width: 16, fontSize: 11, color: 'var(--text-2)', textAlign: 'right' }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

interface TabOverviewProps {
  market: CountryMarket;
  compareMarket: CountryMarket | null;
  lang: Lang;
}

function TabOverview({ market, compareMarket, lang }: TabOverviewProps) {
  const markets = compareMarket ? [market, compareMarket] : [market];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: compareMarket ? '1fr 1fr' : '1fr 1fr', gap: 16 }}>
        {markets.map(m => (
          <div key={m.id} style={{ background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)', padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{m.flag}</span>
              <span>{m.name}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8 }}>{t(lang, 'ci_seasonal_demand')}</div>
            <SeasonalChart data={m.seasonalDemand} accent={m.accent} lang={lang} />
          </div>
        ))}
        {markets.map(m => (
          <div key={`price-${m.id}`} style={{ background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)', padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>{t(lang, 'ci_price_range')} ({m.currency}/kg)</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{t(lang, 'ci_specialty_price')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: m.accent }}>{m.premiumSpecialtyMin.toFixed(1)}</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>–</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: m.accent }}>{m.premiumSpecialtyMax.toFixed(1)}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{t(lang, 'ci_commercial_price')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)' }}>{m.premiumCommercialMin.toFixed(1)}</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>–</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)' }}>{m.premiumCommercialMax.toFixed(1)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)', padding: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Ic name="star" size={14} />
          {t(lang, 'ci_key_insights')} — {market.name}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {market.keyInsights.map((insight, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
              <span style={{ color: market.accent, flexShrink: 0 }}>•</span>
              <span style={{ color: 'var(--text-2)' }}>{insight}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface TabRegulatoryProps {
  market: CountryMarket;
  compareMarket: CountryMarket | null;
  lang: Lang;
}

function TabRegulatory({ market, compareMarket, lang }: TabRegulatoryProps) {
  const markets = compareMarket ? [market, compareMarket] : [market];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: compareMarket ? '1fr 1fr' : '1fr 1fr', gap: 16 }}>
        {markets.map(m => (
          <div key={m.id} style={{ background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)', padding: 16 }}>
            {compareMarket && (
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>{m.flag}</span>{m.name}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[
                { label: t(lang, 'ci_duty_mfn'), value: `${m.dutyMfnPct}%` },
                { label: t(lang, 'ci_duty_pref'), value: `${m.dutyPreferencePct}%` },
                { label: t(lang, 'ci_vat_import'), value: `${m.importVatPct}%` },
                { label: t(lang, 'ci_aflatoxin'), value: `${m.aflatoxinLimitPpb} ppb` },
                { label: t(lang, 'ci_moisture'), value: `${m.moistureMaxPct}%` },
              ].map(item => (
                <div key={item.label} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: m.accent }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{t(lang, 'ci_preference_scheme')}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: m.specialTaxNote ? 8 : 0 }}>{m.preferenceScheme}</div>
            {m.specialTaxNote && (
              <div style={{ fontSize: 11, color: '#f59e0b', background: '#f59e0b11', borderRadius: 6, padding: '6px 8px', marginBottom: 8 }}>
                {m.specialTaxNote}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)', padding: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>{t(lang, 'ci_documents')} — {market.name}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {market.documents.map((doc, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0', borderBottom: i < market.documents.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ marginTop: 2 }}>
                {doc.mandatory
                  ? <Ic name="check" size={14} />
                  : <Ic name="info" size={14} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: doc.mandatory ? 'var(--text)' : 'var(--text-3)', fontWeight: doc.mandatory ? 500 : 400 }}>
                  {doc.name}
                  {!doc.mandatory && <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--surface-2)', borderRadius: 4, padding: '1px 5px' }}>optional</span>}
                </div>
                {doc.note && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{doc.note}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)', padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>{t(lang, 'ci_labeling')}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>
            {market.labelingLanguages.join(', ')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {market.labelingRequirements.map((req, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', gap: 6 }}>
                <span style={{ color: market.accent }}>•</span>{req}
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)', padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>{t(lang, 'ci_certifications')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {market.certifications.map((cert, i) => (
              <div key={i}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{cert.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{cert.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TabBuyersProps {
  market: CountryMarket;
  importerFilter: string;
  setImporterFilter: (v: string) => void;
  lang: Lang;
}

function TabBuyers({ market, importerFilter, setImporterFilter, lang }: TabBuyersProps) {
  const segments = Array.from(new Set(market.importers.map(i => i.segment)));
  const filtered = importerFilter === 'all' ? market.importers : market.importers.filter(i => i.segment === importerFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['all', ...segments] as string[]).map(seg => (
          <button
            key={seg}
            onClick={() => setImporterFilter(seg)}
            style={{
              padding: '5px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: importerFilter === seg ? market.accent : 'var(--bg-2)',
              color: importerFilter === seg ? '#fff' : 'var(--text-2)',
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: importerFilter === seg ? 600 : 400,
            }}
          >
            {seg === 'all' ? t(lang, 'all') : seg}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {filtered.map((imp, i) => (
          <div key={i} style={{ background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)', padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{imp.name}</div>
              <SegmentBadge segment={imp.segment} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Ic name="pin" size={10} />
              {imp.city}
              {imp.annualVolumeKt > 0 && (
                <span style={{ marginLeft: 8 }}>· {imp.annualVolumeKt >= 1 ? `${imp.annualVolumeKt.toFixed(0)} kt/a` : `${(imp.annualVolumeKt * 1000).toFixed(0)} t/a`}</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>{imp.notes}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TabLogisticsProps {
  market: CountryMarket;
  lang: Lang;
}

function TabLogistics({ market, lang }: TabLogisticsProps) {
  const maxDays = 35;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)', padding: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>{t(lang, 'ci_ports')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {market.entryPorts.map((port, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Ic name="ship" size={14} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{port.name}</span>
                  {port.directService && (
                    <span style={{ fontSize: 10, background: market.accent + '22', color: market.accent, border: `1px solid ${market.accent}44`, borderRadius: 4, padding: '1px 6px' }}>
                      Direct
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: market.accent }}>{port.transitDaysFromMombasa}d</span>
              </div>
              <div style={{ background: 'var(--surface-2)', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ width: `${(port.transitDaysFromMombasa / maxDays) * 100}%`, height: '100%', background: market.accent, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{port.notes}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)', padding: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>{t(lang, 'ci_logistics_notes')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {market.logisticsNotes.map((note, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
              <span style={{ color: market.accent, flexShrink: 0 }}>•</span>
              <span style={{ color: 'var(--text-2)', lineHeight: 1.4 }}>{note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface TabEntryProps {
  market: CountryMarket;
  checkedSteps: Record<string, boolean>;
  setCheckedSteps: (v: Record<string, boolean>) => void;
  lang: Lang;
}

function TabEntry({ market, checkedSteps, setCheckedSteps, lang }: TabEntryProps) {
  const totalSteps = market.entrySteps.length;
  const checkedCount = market.entrySteps.filter(s => checkedSteps[s.id]).length;
  const progressPct = totalSteps > 0 ? (checkedCount / totalSteps) * 100 : 0;

  const categories = Array.from(new Set(market.entrySteps.map(s => s.category)));

  const handleToggle = (stepId: string) => {
    const next = { ...checkedSteps, [stepId]: !checkedSteps[stepId] };
    setCheckedSteps(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`ci_checked_steps_${market.id}`, JSON.stringify(next));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{t(lang, 'ci_entry_progress')}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: market.accent }}>{checkedCount} / {totalSteps}</div>
        </div>
        <div style={{ background: 'var(--surface-2)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
          <div style={{ width: `${progressPct}%`, height: '100%', background: market.accent, borderRadius: 6, transition: 'width 0.3s' }} />
        </div>
      </div>
      {categories.map(cat => {
        const steps = market.entrySteps.filter(s => s.category === cat);
        return (
          <div key={cat} style={{ background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <CategoryBadge category={cat} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {steps.map(step => {
                const isChecked = !!checkedSteps[step.id];
                return (
                  <div key={step.id} style={{
                    display: 'flex',
                    gap: 12,
                    padding: 12,
                    background: isChecked ? market.accent + '11' : 'var(--surface-2)',
                    borderRadius: 8,
                    border: `1px solid ${isChecked ? market.accent + '44' : 'transparent'}`,
                    cursor: 'pointer',
                    opacity: isChecked ? 0.8 : 1,
                  }}
                    onClick={() => handleToggle(step.id)}
                  >
                    <div style={{ marginTop: 2, flexShrink: 0 }}>
                      <div style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: `2px solid ${isChecked ? market.accent : 'var(--border)'}`,
                        background: isChecked ? market.accent : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {isChecked && <Ic name="check" size={10} />}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: isChecked ? 'var(--text-3)' : 'var(--text)', textDecoration: isChecked ? 'line-through' : 'none' }}>
                          {step.title}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <EffortBadge effort={step.effort} />
                          <span style={{ fontSize: 10, background: 'var(--surface-2)', color: 'var(--text-3)', borderRadius: 4, padding: '2px 6px' }}>
                            {step.timelineWeeks}w
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.4 }}>{step.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CountryIntelligenceView({ lang }: Props) {
  const { data } = useData();
  const { generate, isConfigured } = useAiConfig();

  const [selectedMarketId, setSelectedMarketId] = useState<string>('de');
  const [activeTab, setActiveTab] = useState<'overview' | 'regulatory' | 'buyers' | 'logistics' | 'entry'>('overview');
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [compareMarketId, setCompareMarketId] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<string>('');
  const [importerFilter, setImporterFilter] = useState<string>('all');

  const market = MARKETS.find(m => m.id === selectedMarketId) ?? MARKETS[0];
  const compareMarket = compareMode && compareMarketId ? (MARKETS.find(m => m.id === compareMarketId) ?? null) : null;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`ci_checked_steps_${selectedMarketId}`);
      if (stored) {
        try {
          setCheckedSteps(JSON.parse(stored) as Record<string, boolean>);
        } catch {
          setCheckedSteps({});
        }
      } else {
        setCheckedSteps({});
      }
    }
    setImporterFilter('all');
    setAiResult('');
  }, [selectedMarketId]);

  if (!data) return <div style={{ padding: 32 }}>Laden…</div>;

  const tabs: Array<{ id: typeof activeTab; label: string }> = [
    { id: 'overview', label: t(lang, 'ci_tab_overview') },
    { id: 'regulatory', label: t(lang, 'ci_tab_regulatory') },
    { id: 'buyers', label: t(lang, 'ci_tab_buyers') },
    { id: 'logistics', label: t(lang, 'ci_tab_logistics') },
    { id: 'entry', label: t(lang, 'ci_tab_entry') },
  ];

  const handleGenerateAi = async () => {
    if (!isConfigured) return;
    setAiLoading(true);
    setAiResult('');
    try {
      const prompt = `Du bist Exportberater spezialisiert auf Ostafrika-Kaffee. Erstelle einen präzisen Marktbrief für ${market.name} für einen äthiopischen/kenianischen Kaffeexporteur. Decke ab: Marktzugang, wichtigste Käufer, regulatorische Besonderheiten, Preiserwartungen, top 3 konkrete nächste Schritte. Maximal 300 Wörter. Auf ${lang === 'de' ? 'Deutsch' : 'Englisch'}.`;
      const result = await generate(prompt);
      setAiResult(result);
    } catch {
      setAiResult('Fehler beim Generieren des Marktbriefs.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100%', background: 'var(--bg)' }}>
      {/* Left Sidebar — Market Selector */}
      <div style={{
        width: 240,
        flexShrink: 0,
        background: 'var(--bg-2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}>
        <div style={{ padding: '16px 16px 8px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t(lang, 'ci_select_market')}
          </div>
        </div>

        <MarketSelector
          markets={MARKETS}
          selectedId={selectedMarketId}
          onSelect={(id) => { setSelectedMarketId(id); setCompareMode(false); setCompareMarketId(null); }}
          accent={market.accent}
        />

        {/* Compare toggle */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', marginTop: 8 }}>
          <button
            onClick={() => {
              setCompareMode(!compareMode);
              if (!compareMode && !compareMarketId) {
                const other = MARKETS.find(m => m.id !== selectedMarketId);
                setCompareMarketId(other?.id ?? null);
              }
            }}
            style={{
              width: '100%',
              padding: '7px 0',
              borderRadius: 8,
              border: `1px solid ${compareMode ? market.accent : 'var(--border)'}`,
              background: compareMode ? market.accent + '22' : 'var(--surface-2)',
              color: compareMode ? market.accent : 'var(--text-2)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Ic name="layers" size={12} />
            {t(lang, 'ci_compare')}
          </button>
        </div>

        {compareMode && (
          <div style={{ padding: '0 0 8px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, padding: '4px 16px' }}>
              {t(lang, 'ci_compare')}
            </div>
            <MarketSelector
              markets={MARKETS.filter(m => m.id !== selectedMarketId)}
              selectedId={compareMarketId ?? ''}
              onSelect={setCompareMarketId}
              accent={compareMarket?.accent}
            />
          </div>
        )}
      </div>

      {/* Right Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 28 }}>{market.flag}</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{market.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{market.nameLocal} · {market.region} · {market.currency}</div>
            </div>
            {compareMarket && (
              <>
                <div style={{ fontSize: 20, color: 'var(--text-3)', margin: '0 4px' }}>vs</div>
                <span style={{ fontSize: 28 }}>{compareMarket.flag}</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{compareMarket.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{compareMarket.region} · {compareMarket.currency}</div>
                </div>
              </>
            )}
          </div>

          {/* Accent bar + KPI row */}
          <div style={{ height: 3, background: market.accent, borderRadius: 2, margin: '12px 0 14px' }} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <KpiPill label={t(lang, 'ci_import_volume')} value={`${market.importVolumeKt} kt`} accent={market.accent} />
            <KpiPill label={t(lang, 'ci_import_value')} value={`€${market.importValueBn}Bn`} accent={market.accent} />
            <KpiPill label={t(lang, 'ci_growth')} value={`+${market.growthPctYoY}%`} accent={market.accent} />
            <KpiPill label={t(lang, 'ci_specialty_share')} value={`${market.specialtySharePct}%`} accent={market.accent} />
            <KpiPill label={t(lang, 'ci_per_capita')} value={`${market.perCapitaKg} kg`} accent={market.accent} />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: 'none' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  color: activeTab === tab.id ? market.accent : 'var(--text-3)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? `2px solid ${market.accent}` : '2px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {activeTab === 'overview' && (
            <TabOverview market={market} compareMarket={compareMarket} lang={lang} />
          )}
          {activeTab === 'regulatory' && (
            <TabRegulatory market={market} compareMarket={compareMarket} lang={lang} />
          )}
          {activeTab === 'buyers' && (
            <TabBuyers
              market={market}
              importerFilter={importerFilter}
              setImporterFilter={setImporterFilter}
              lang={lang}
            />
          )}
          {activeTab === 'logistics' && (
            <TabLogistics market={market} lang={lang} />
          )}
          {activeTab === 'entry' && (
            <TabEntry
              market={market}
              checkedSteps={checkedSteps}
              setCheckedSteps={setCheckedSteps}
              lang={lang}
            />
          )}

          {/* AI Market Brief */}
          <div style={{ marginTop: 24, background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: aiResult ? 12 : 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ic name="sparkle" size={14} />
                {t(lang, 'ci_ai_brief')}
              </div>
              <button
                onClick={handleGenerateAi}
                disabled={!isConfigured || aiLoading}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: `1px solid ${market.accent}`,
                  background: isConfigured ? market.accent : 'var(--surface-2)',
                  color: isConfigured ? '#fff' : 'var(--text-3)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: isConfigured && !aiLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: aiLoading ? 0.7 : 1,
                }}
              >
                <Ic name={aiLoading ? 'refresh' : 'sparkle'} size={12} />
                {aiLoading ? t(lang, 'ci_ai_brief_loading') : t(lang, 'ci_ai_brief_btn')}
              </button>
            </div>
            {aiResult && (
              <div style={{
                fontSize: 13,
                color: 'var(--text-2)',
                lineHeight: 1.6,
                background: 'var(--surface-2)',
                borderRadius: 8,
                padding: 14,
                borderLeft: `3px solid ${market.accent}`,
                whiteSpace: 'pre-wrap',
              }}>
                {aiResult}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

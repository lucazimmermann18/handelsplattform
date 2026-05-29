'use client';

import React, { useState } from 'react';
import { Ic } from '@/components/ui/icons';
import { t } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';
import { useAiConfig } from '@/lib/ai-config';

interface HSLookupProps { lang: Lang; }

interface HSEntry {
  code: string;
  name: string;
  chapter: string;
  chapterName: string;
  position: string;
  mfnRate: number;
  ebaRate: number;
  ukRate: number;
  eudrRelevant: boolean;
  phytosanitaryRequired: boolean;
  documents: string[];
  notes: string;
  emoji: string;
}

const HS_DB: HSEntry[] = [
  { code: '09011100', name: 'Kaffee, nicht geröstet, koffeinhaltig', chapter: '09', chapterName: 'Kaffee, Tee, Mate und Gewürze', position: '0901', mfnRate: 0, ebaRate: 0, ukRate: 0, eudrRelevant: true, phytosanitaryRequired: true, documents: ['Phytosanitäres Zertifikat (NPPO)', 'CHED-PP via EU TRACES', 'Ursprungszeugnis Form A / REX', 'Handelsrechnung'], notes: 'EUDR-relevant ab Dez. 2025. ICO-Exportzertifikat für Äthiopien (ECX) erforderlich. EU-Einfuhr meldepflichtig via TRACES NT.', emoji: '☕' },
  { code: '09012100', name: 'Kaffee, geröstet, koffeinhaltig', chapter: '09', chapterName: 'Kaffee, Tee, Mate und Gewürze', position: '0901', mfnRate: 7.5, ebaRate: 0, ukRate: 0, eudrRelevant: true, phytosanitaryRequired: false, documents: ['Ursprungszeugnis Form A / REX', 'Handelsrechnung', 'Analysezertifikat'], notes: 'Geröstet = höherer MFN-Satz 7,5%. EBA-Präferenz (ACP-Länder) 0%. Verarbeitetes Produkt — kein Phytosanitärzertifikat nötig.', emoji: '☕' },
  { code: '18010000', name: 'Kakaobohnen, auch gebrochen, roh oder geröstet', chapter: '18', chapterName: 'Kakao und Kakaozubereitungen', position: '1801', mfnRate: 0, ebaRate: 0, ukRate: 0, eudrRelevant: true, phytosanitaryRequired: true, documents: ['Phytosanitäres Zertifikat (NPPO)', 'CHED-PP via EU TRACES', 'Ursprungszeugnis Form A / REX', 'Handelsrechnung', 'Analysezertifikat (Aflatoxin, Ochratoxin A)'], notes: 'EUDR-Pflicht. Pflichtanalyse auf Mykotoxine (Aflatoxin B1 max. 5 µg/kg, Ochratoxin A max. 10 µg/kg). EU-Grenzwerte streng.', emoji: '🍫' },
  { code: '18040000', name: 'Kakaobutter, Kakaofett und Kakaoöl', chapter: '18', chapterName: 'Kakao und Kakaozubereitungen', position: '1804', mfnRate: 4.0, ebaRate: 0, ukRate: 0, eudrRelevant: false, phytosanitaryRequired: false, documents: ['Ursprungszeugnis Form A / REX', 'Handelsrechnung', 'Analysezertifikat'], notes: 'Verarbeitetes Kakao-Halbfabrikat. Zollsatz 4% MFN, 0% EBA/ACP. Kein Phytosanitärzertifikat bei verarbeitetem Produkt.', emoji: '🍫' },
  { code: '12074000', name: 'Sesamsamen', chapter: '12', chapterName: 'Ölsaaten und ölhaltige Früchte', position: '1207', mfnRate: 0, ebaRate: 0, ukRate: 0, eudrRelevant: false, phytosanitaryRequired: true, documents: ['Phytosanitäres Zertifikat (NPPO)', 'CHED-PP via EU TRACES', 'Ursprungszeugnis Form A / REX', 'Analysezertifikat (Pestizide, Salmonellen)'], notes: 'Erhöhte EU-Kontrollfrequenz bei Sesam aus Afrika (Pestizidkontrolle). Anlagezertifikat zwingend empfohlen. Aflatoxin-Kontrolle.', emoji: '🌿' },
  { code: '08013100', name: 'Cashewkerne, frisch oder getrocknet, in der Schale', chapter: '08', chapterName: 'Genießbare Früchte und Nüsse', position: '0801', mfnRate: 0, ebaRate: 0, ukRate: 0, eudrRelevant: false, phytosanitaryRequired: true, documents: ['Phytosanitäres Zertifikat (NPPO)', 'CHED-PP via EU TRACES', 'Ursprungszeugnis Form A / REX'], notes: 'Unverarbeitete Cashews. 0% Zoll auch bei MFN. Phytosanitärzertifikat Pflicht.', emoji: '🥜' },
  { code: '20081910', name: 'Cashewkerne, zubereitet oder haltbar gemacht', chapter: '20', chapterName: 'Zubereitungen aus Gemüse, Früchten oder Nüssen', position: '2008', mfnRate: 6.4, ebaRate: 0, ukRate: 0, eudrRelevant: false, phytosanitaryRequired: false, documents: ['Ursprungszeugnis Form A / REX', 'Handelsrechnung', 'Analysezertifikat (Aflatoxin)'], notes: 'Verarbeitete/geröstete Cashews. Zollsatz 6,4% MFN, 0% ACP/EBA. Aflatoxin B1 Kontrolle empfohlen.', emoji: '🥜' },
  { code: '09101110', name: 'Ingwer, nicht gemahlen', chapter: '09', chapterName: 'Kaffee, Tee, Mate und Gewürze', position: '0910', mfnRate: 0, ebaRate: 0, ukRate: 0, eudrRelevant: false, phytosanitaryRequired: true, documents: ['Phytosanitäres Zertifikat (NPPO)', 'CHED-PP via EU TRACES', 'Ursprungszeugnis Form A / REX', 'Analysezertifikat (Pestizide, Aflatoxin)'], notes: 'Hohe EU-Kontrollrate für Ingwer (RASFF-Warnungen). Pestizidanalyse unbedingt vor Versand. 0% Zoll.', emoji: '🫚' },
  { code: '09061100', name: 'Zimt, weder gemahlen noch gepulvert', chapter: '09', chapterName: 'Kaffee, Tee, Mate und Gewürze', position: '0906', mfnRate: 0, ebaRate: 0, ukRate: 0, eudrRelevant: false, phytosanitaryRequired: true, documents: ['Phytosanitäres Zertifikat (NPPO)', 'Ursprungszeugnis Form A / REX', 'Analysezertifikat (Cumarin bei Ceylon-Zimt)'], notes: 'Cumarin-Grenzwert bei bestimmten Zimtsorten beachten (CE 1334/2008). Ceylon-Zimt (Cinnamomum verum) vs. Cassia-Zimt.', emoji: '🍂' },
  { code: '09050000', name: 'Vanille', chapter: '09', chapterName: 'Kaffee, Tee, Mate und Gewürze', position: '0905', mfnRate: 0, ebaRate: 0, ukRate: 0, eudrRelevant: false, phytosanitaryRequired: true, documents: ['Phytosanitäres Zertifikat (NPPO)', 'Ursprungszeugnis Form A / REX', 'Analysezertifikat'], notes: 'Kein Zoll. Phytosanitärzertifikat Pflicht. Hochwertige Nische — Vanille aus Uganda/Tansania gefragt.', emoji: '🌱' },
  { code: '09021000', name: 'Grüner Tee, nicht aufgemacht in Einzelhandelspackungen', chapter: '09', chapterName: 'Kaffee, Tee, Mate und Gewürze', position: '0902', mfnRate: 0, ebaRate: 0, ukRate: 0, eudrRelevant: false, phytosanitaryRequired: true, documents: ['Phytosanitäres Zertifikat (NPPO)', 'CHED-PP via EU TRACES', 'Ursprungszeugnis Form A / REX', 'Analysezertifikat (Pestizide)'], notes: '0% Zoll für Tee aus allen ACP-/EBA-Ländern. Pestizidanalyse wichtig für EU-Marktzugang.', emoji: '🍵' },
  { code: '09024000', name: 'Schwarzer Tee (fermentiert) und teilweise fermentierter Tee', chapter: '09', chapterName: 'Kaffee, Tee, Mate und Gewürze', position: '0902', mfnRate: 0, ebaRate: 0, ukRate: 0, eudrRelevant: false, phytosanitaryRequired: true, documents: ['Phytosanitäres Zertifikat (NPPO)', 'CHED-PP via EU TRACES', 'Ursprungszeugnis Form A / REX'], notes: 'Kenia = weltgrößter Schwarztee-Exporteur. 0% Zoll EU. CHED-PP via EU TRACES erforderlich.', emoji: '🍵' },
  { code: '08041010', name: 'Datteln, frisch oder getrocknet', chapter: '08', chapterName: 'Genießbare Früchte und Nüsse', position: '0804', mfnRate: 2.4, ebaRate: 0, ukRate: 0, eudrRelevant: false, phytosanitaryRequired: true, documents: ['Phytosanitäres Zertifikat (NPPO)', 'Ursprungszeugnis Form A / REX', 'Analysezertifikat'], notes: 'MFN 2,4%, EBA/ACP 0%. Phytosanitärzertifikat nötig.', emoji: '🌴' },
  { code: '07133300', name: 'Kidneybohnen und weiße Bohnen, getrocknet, enthülst', chapter: '07', chapterName: 'Gemüse, Pflanzen, Wurzeln und Knollen', position: '0713', mfnRate: 0, ebaRate: 0, ukRate: 0, eudrRelevant: false, phytosanitaryRequired: true, documents: ['Phytosanitäres Zertifikat (NPPO)', 'Ursprungszeugnis Form A / REX', 'Analysezertifikat (Pestizide, Aflatoxin)'], notes: '0% Zoll auch MFN. Kenia & Tansania: wichtige Anbauländer für EU-Export.', emoji: '🫘' },
  { code: '12010090', name: 'Sojabohnen, auch geschrotet, andere', chapter: '12', chapterName: 'Ölsaaten und ölhaltige Früchte', position: '1201', mfnRate: 0, ebaRate: 0, ukRate: 0, eudrRelevant: false, phytosanitaryRequired: true, documents: ['Phytosanitäres Zertifikat (NPPO)', 'Ursprungszeugnis Form A / REX'], notes: '0% Zoll. GMO-Nachweis kann bei EU-Import verlangt werden.', emoji: '🌿' },
  { code: '08030019', name: 'Bananen, frisch, andere', chapter: '08', chapterName: 'Genießbare Früchte und Nüsse', position: '0803', mfnRate: 17.6, ebaRate: 0, ukRate: 0, eudrRelevant: false, phytosanitaryRequired: true, documents: ['Phytosanitäres Zertifikat (NPPO)', 'CHED-PP via EU TRACES', 'Ursprungszeugnis Form A / REX'], notes: 'HOHER MFN-Satz 17,6 €/100kg (nicht %). ACP/EBA = 0%. EPA-Abkommen relevant. Kühltransport erforderlich.', emoji: '🍌' },
  { code: '08055010', name: 'Zitronen, frisch oder getrocknet', chapter: '08', chapterName: 'Genießbare Früchte und Nüsse', position: '0805', mfnRate: 3.2, ebaRate: 0, ukRate: 0, eudrRelevant: false, phytosanitaryRequired: true, documents: ['Phytosanitäres Zertifikat (NPPO)', 'CHED-PP via EU TRACES', 'Ursprungszeugnis Form A / REX'], notes: 'Saisonale Zollsätze möglich. Phytosanitär und Kältekette kritisch.', emoji: '🍋' },
  { code: '06031300', name: 'Rosen, frisch geschnitten', chapter: '06', chapterName: 'Lebende Pflanzen und Waren des Blumenhandels', position: '0603', mfnRate: 0, ebaRate: 0, ukRate: 0, eudrRelevant: false, phytosanitaryRequired: true, documents: ['Phytosanitäres Zertifikat (NPPO)', 'CHED-PP via EU TRACES', 'Ursprungszeugnis Form A / REX'], notes: 'Kenia = weltgrößter Rosenexporteur. Extrem zeitkritisch: Luftfracht innerhalb 24h. Phytosanitärkontrolle sehr streng. 0% Zoll ACP.', emoji: '🌹' },
  { code: '15079010', name: 'Sojaöl, raffiniert, andere', chapter: '15', chapterName: 'Tierische und pflanzliche Fette und Öle', position: '1507', mfnRate: 3.2, ebaRate: 0, ukRate: 0, eudrRelevant: false, phytosanitaryRequired: false, documents: ['Ursprungszeugnis Form A / REX', 'Analysezertifikat', 'Handelsrechnung'], notes: 'Verarbeitetes Öl — kein Phytosanitärzertifikat. GMO-Status und Erucasäuregehalt prüfen.', emoji: '🫙' },
  { code: '08132000', name: 'Pflaumen und Zwetschgen, getrocknet', chapter: '08', chapterName: 'Genießbare Früchte und Nüsse', position: '0813', mfnRate: 0, ebaRate: 0, ukRate: 0, eudrRelevant: false, phytosanitaryRequired: true, documents: ['Phytosanitäres Zertifikat (NPPO)', 'Ursprungszeugnis Form A / REX', 'Analysezertifikat (Sulfite, Pestizide)'], notes: 'Sulfit-Grenzwerte beachten. 0% Zoll.', emoji: '🍑' },
];

export const HSLookupView = ({ lang }: HSLookupProps) => {
  const { generate, isConfigured } = useAiConfig();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<HSEntry | null>(HS_DB[0]);
  const [aiReasoning, setAiReasoning] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleSearch = (q: string) => {
    setQuery(q);
    if (!q.trim()) return;
    const ql = q.toLowerCase();
    const found = HS_DB.find(e =>
      e.code.includes(q) ||
      e.name.toLowerCase().includes(ql) ||
      e.notes.toLowerCase().includes(ql)
    );
    if (found) { setSelected(found); setAiReasoning(''); }
  };

  const handleClassify = async () => {
    if (!query.trim() || !isConfigured) return;
    setAiLoading(true);
    setAiError('');
    try {
      const prompt = `Du bist ein EU-Zollexperte spezialisiert auf Ostafrika-Agrarprodukte.

Klassifiziere folgendes Produkt in das EU-TARIC-System (8-stelliger HS-Code):
Produktbeschreibung: "${query}"

Antworte in folgendem Format:
HS-CODE: [8-stelliger Code]
BEZEICHNUNG: [offizielle EU-Taric-Bezeichnung auf Deutsch]
KAPITEL: [2-stellig] — [Kapitelbezeichnung]
MFN-ZOLLSATZ: [% oder spezifischer Betrag]
EBA-PRÄFERENZ: [0% für ACP/EBA-Länder (Äthiopien, Kenia, Uganda, Tansania)]
EUDR-RELEVANT: [Ja/Nein]
PHYTOSANITÄR-PFLICHT: [Ja/Nein]
PFLICHTDOKUMENTE: [kommagetrennte Liste]
BESONDERHEITEN: [wichtige Hinweise für EU-Import, max 3 Sätze]
BEGRÜNDUNG: [warum genau dieser HS-Code, max 2 Sätze]`;

      const result = await generate(prompt);
      setAiReasoning(result);
      // Try to extract HS code from result and select from DB
      const codeMatch = result.match(/HS-CODE:\s*([0-9]{8})/);
      if (codeMatch) {
        const dbEntry = HS_DB.find(e => e.code === codeMatch[1]);
        if (dbEntry) setSelected(dbEntry);
      }
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'KI-Fehler');
    } finally {
      setAiLoading(false);
    }
  };

  const rateColor = (rate: number) => rate === 0 ? '#10b981' : rate > 5 ? '#f87171' : '#fbbf24';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic name="customs" size={15} color="#f59e0b" />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{t(lang, 'hs_title')}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{t(lang, 'hs_subtitle')}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {/* Left: Search + Quick */}
        <div style={{ width: '45%', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Search bar */}
          <div style={{ flexShrink: 0, padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={query}
                onChange={e => handleSearch(e.target.value)}
                placeholder={t(lang, 'hs_search_placeholder')}
                style={{ flex: 1, padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              />
              <button
                onClick={handleClassify}
                disabled={!query.trim() || aiLoading || !isConfigured}
                style={{ padding: '7px 14px', borderRadius: 6, background: aiLoading ? 'var(--surface-2)' : 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.4)', color: '#a78bfa', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                {aiLoading
                  ? <><svg width="11" height="11" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="20 60" /></svg> {t(lang, 'hs_classify_loading')}</>
                  : <><Ic name="sparkle" size={11} /> {t(lang, 'hs_classify_btn')}</>
                }
              </button>
            </div>
            {aiError && <div style={{ marginTop: 6, fontSize: 11, color: '#f87171' }}>&#x26A0; {aiError}</div>}
          </div>

          {/* Quick products */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{t(lang, 'hs_quick_products')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {HS_DB.map(entry => (
                <button
                  key={entry.code}
                  onClick={() => { setSelected(entry); setAiReasoning(''); }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                    background: selected?.code === entry.code ? 'rgba(245,158,11,0.1)' : 'transparent',
                    border: `1px solid ${selected?.code === entry.code ? 'rgba(245,158,11,0.35)' : 'transparent'}`,
                    display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.1s',
                  }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{entry.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: selected?.code === entry.code ? 700 : 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-4)', fontFamily: 'Geist Mono, monospace' }}>{entry.code}</div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: rateColor(entry.mfnRate), fontFamily: 'Geist Mono, monospace' }}>{entry.mfnRate}%</div>
                    {entry.eudrRelevant && <div style={{ fontSize: 9, color: '#f59e0b', fontWeight: 700 }}>EUDR</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Detail */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
          {selected ? (
            <div>
              {/* Code + name */}
              <div style={{ marginBottom: 18, padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{selected.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Geist Mono, monospace', color: '#f59e0b', marginBottom: 2 }}>{selected.code}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', marginBottom: 6, lineHeight: 1.4 }}>{selected.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t(lang, 'hs_chapter')} {selected.chapter} — {selected.chapterName}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                    {selected.eudrRelevant && (
                      <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: 10, fontWeight: 700, border: '1px solid rgba(245,158,11,0.3)' }}>
                        &#x26A0; EUDR
                      </span>
                    )}
                    {selected.phytosanitaryRequired && (
                      <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(167,139,250,0.12)', color: '#a78bfa', fontSize: 10, fontWeight: 700, border: '1px solid rgba(167,139,250,0.3)' }}>
                        Phytosanitär
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Duty rates */}
              <div style={{ marginBottom: 14, padding: '12px 14px', background: 'var(--bg)', borderRadius: 7, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{t(lang, 'hs_duties')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: t(lang, 'hs_mfn_rate'), value: selected.mfnRate, note: 'Standard' },
                    { label: t(lang, 'hs_eba_rate'), value: selected.ebaRate, note: 'ACP/EBA-Länder*' },
                    { label: t(lang, 'hs_uk_tariff'), value: selected.ukRate, note: 'UK Global Tariff' },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '8px 10px', background: `${rateColor(item.value)}10`, borderRadius: 5, border: `1px solid ${rateColor(item.value)}30` }}>
                      <div style={{ fontSize: 10, color: 'var(--text-4)', marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Geist Mono, monospace', color: rateColor(item.value) }}>{item.value}%</div>
                      <div style={{ fontSize: 9.5, color: 'var(--text-4)' }}>{item.note}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-4)', fontStyle: 'italic' }}>
                  * EBA = Everything But Arms. Äthiopien, Kenia (EPA), Uganda, Tansania, Ruanda, Burundi = 0% auf fast alle Waren.
                </div>
              </div>

              {/* Documents */}
              <div style={{ marginBottom: 14, padding: '12px 14px', background: 'var(--bg)', borderRadius: 7, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{t(lang, 'hs_import_docs')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {selected.documents.map((doc, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-2)' }}>
                      <span style={{ color: '#10b981', fontSize: 13 }}>&#x2611;</span> {doc}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selected.notes && (
                <div style={{ marginBottom: 14, padding: '10px 12px', background: 'rgba(245,158,11,0.06)', borderRadius: 6, borderLeft: '3px solid rgba(245,158,11,0.5)' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{t(lang, 'hs_notes')}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{selected.notes}</div>
                </div>
              )}

              {/* AI reasoning */}
              {aiReasoning && (
                <div style={{ padding: '12px 14px', background: 'rgba(167,139,250,0.06)', borderRadius: 7, border: '1px solid rgba(167,139,250,0.2)', borderLeft: '3px solid #a78bfa60' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Ic name="sparkle" size={10} color="#a78bfa" /> {t(lang, 'hs_ai_reasoning')}
                  </div>
                  <pre style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.65, margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{aiReasoning}</pre>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-4)', fontSize: 13 }}>
              {t(lang, 'hs_no_result')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

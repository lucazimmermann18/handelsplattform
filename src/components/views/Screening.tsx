'use client';

import React, { useState } from 'react';
import { Ic } from '@/components/ui/icons';
import { t } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';
import { useAiConfig } from '@/lib/ai-config';

interface ScreeningProps { lang: Lang; }

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface ScreeningResult {
  id: string;
  entityName: string;
  country: string;
  entityType: string;
  screenedAt: string;
  riskLevel: RiskLevel;
  aiAnalysis: string;
  recommendation: string;
  sanctionedCountryMatch: boolean;
}

interface SanctionedCountry {
  code: string;
  name: string;
  regime: string;
  level: RiskLevel;
}

const SANCTIONED_COUNTRIES: SanctionedCountry[] = [
  { code: 'IR', name: 'Iran', regime: 'EU/UN/OFAC', level: 'HIGH' },
  { code: 'KP', name: 'Nordkorea', regime: 'EU/UN/OFAC', level: 'HIGH' },
  { code: 'SY', name: 'Syrien', regime: 'EU/OFAC', level: 'HIGH' },
  { code: 'RU', name: 'Russland', regime: 'EU (ab 2022)', level: 'HIGH' },
  { code: 'BY', name: 'Belarus', regime: 'EU (ab 2021)', level: 'HIGH' },
  { code: 'MM', name: 'Myanmar', regime: 'EU/OFAC', level: 'HIGH' },
  { code: 'CU', name: 'Kuba', regime: 'OFAC (US)', level: 'MEDIUM' },
  { code: 'SD', name: 'Sudan', regime: 'OFAC', level: 'MEDIUM' },
  { code: 'SS', name: 'Südsudan', regime: 'EU/OFAC', level: 'MEDIUM' },
  { code: 'SO', name: 'Somalia', regime: 'UN-Waffenembargo', level: 'MEDIUM' },
  { code: 'LY', name: 'Libyen', regime: 'EU/UN', level: 'MEDIUM' },
  { code: 'ZW', name: 'Simbabwe', regime: 'EU (selektiv, Führungspersonen)', level: 'LOW' },
];

const LOG_KEY = 'screening_log';

function loadLog(): ScreeningResult[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LOG_KEY) ?? '[]') as ScreeningResult[]; } catch { return []; }
}
function saveLog(log: ScreeningResult[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOG_KEY, JSON.stringify(log));
}

const RISK_COLORS: Record<RiskLevel, string> = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f87171' };
const RISK_BG: Record<RiskLevel, string> = { LOW: 'rgba(16,185,129,0.08)', MEDIUM: 'rgba(245,158,11,0.08)', HIGH: 'rgba(248,113,113,0.08)' };

export const ScreeningView = ({ lang }: ScreeningProps) => {
  const { generate, isConfigured } = useAiConfig();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [entityType, setEntityType] = useState('Käufer');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [log, setLog] = useState<ScreeningResult[]>(loadLog);
  const [error, setError] = useState('');

  const doScreening = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    // Check against sanctioned countries
    const countryLower = country.toLowerCase();
    const sanctionMatch = SANCTIONED_COUNTRIES.find(sc =>
      countryLower.includes(sc.name.toLowerCase()) ||
      countryLower === sc.code.toLowerCase()
    );

    let riskLevel: RiskLevel = 'LOW';
    let aiText = '';
    let recommendation = 'Standardprozess fortsetzen. Keine Auffälligkeiten in der KI-Erstprüfung.';

    if (sanctionMatch) {
      riskLevel = sanctionMatch.level;
      aiText = `Sanktioniertes Land erkannt: ${sanctionMatch.name} (${sanctionMatch.regime}). Geschäfte mit Unternehmen/Personen aus diesem Land können EU-/OFAC-Sanktionen unterliegen. Sorgfältige Prüfung erforderlich.`;
      recommendation = riskLevel === 'HIGH'
        ? 'Hochrisiko: Sofortiger Stopp aller Transaktionen bis zur vollständigen Compliance-Klärung. Rechtsbeistand empfohlen.'
        : 'Mittelrisiko: Erweiterte Sorgfaltspflichten (Enhanced Due Diligence) vor Geschäftsbeginn. Offizielle Sanktionslisten prüfen.';
    }

    // AI analysis
    if (isConfigured) {
      try {
        const prompt = `Du bist ein Compliance-Experte für internationalen Handel. Analysiere ob folgende Entität Sanktionsrisiken aufweist:

Entität: "${name}"
Land: "${country || 'Nicht angegeben'}"
Typ: "${entityType}"
${sanctionMatch ? `HINWEIS: Das angegebene Land "${country}" steht auf der Sanktionsliste (${sanctionMatch.regime}).` : ''}

Berücksichtige: EU-Sanktionslisten, OFAC SDN-Liste, UN-Sanktionen, bekannte Umgehungsstrukturen.

Antworte AUSSCHLIESSLICH in diesem Format:
RISIKOSTUFE: NIEDRIG oder MITTEL oder HOCH
ANALYSE: [max 3 präzise Sätze zur Einschätzung]
EMPFEHLUNG: [konkrete Handlungsempfehlung, 1 Satz]

WICHTIG: Du kannst keine echten Sanktionsdatenbanken abfragen. Dies ist eine KI-Ersteinschätzung basierend auf allgemeinem Wissen.`;

        const aiResult = await generate(prompt);
        aiText = aiResult;

        // Parse risk level from AI
        if (aiResult.includes('HOCH') || aiResult.includes('HIGH')) riskLevel = 'HIGH';
        else if (aiResult.includes('MITTEL') || aiResult.includes('MEDIUM')) riskLevel = 'MEDIUM';

        const recMatch = aiResult.match(/EMPFEHLUNG:\s*(.+)/);
        if (recMatch) recommendation = recMatch[1].trim();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'KI-Fehler');
        aiText = 'KI-Analyse nicht verfügbar.';
      }
    } else {
      aiText = 'KI nicht konfiguriert. Manuelle Prüfung erforderlich.';
    }

    const entry: ScreeningResult = {
      id: `sc_${Date.now()}`,
      entityName: name,
      country,
      entityType,
      screenedAt: new Date().toISOString(),
      riskLevel,
      aiAnalysis: aiText,
      recommendation,
      sanctionedCountryMatch: !!sanctionMatch,
    };

    setResult(entry);
    const updatedLog = [entry, ...log].slice(0, 50);
    setLog(updatedLog);
    saveLog(updatedLog);
    setLoading(false);
  };

  const exportLog = () => {
    const lines = [
      'EastAfrica Export OS — Sanktionsscreening-Protokoll',
      `Exportiert: ${new Date().toLocaleString('de-DE')}`,
      '═'.repeat(60),
      '',
      ...log.map(e => [
        `Datum: ${new Date(e.screenedAt).toLocaleString('de-DE')}`,
        `Entität: ${e.entityName}`,
        `Land: ${e.country || '—'}`,
        `Typ: ${e.entityType}`,
        `Risikostufe: ${e.riskLevel}`,
        `Empfehlung: ${e.recommendation}`,
        `KI-Analyse: ${e.aiAnalysis.replace(/\n/g, ' ')}`,
        '─'.repeat(40),
        '',
      ].join('\n')),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `screening-protokoll-${Date.now()}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const riskLabel: Record<RiskLevel, string> = { LOW: t(lang, 'sc_risk_low'), MEDIUM: t(lang, 'sc_risk_medium'), HIGH: t(lang, 'sc_risk_high') };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
    color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, padding: '8px 12px',
    outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(248,113,113,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic name="shield" size={15} color="#f87171" />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{t(lang, 'sc_title')}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{t(lang, 'sc_subtitle')}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {/* Left: Input + Result */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', borderRight: '1px solid var(--border)' }}>

          {/* Input form */}
          <div style={{ marginBottom: 20, padding: '18px 20px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Entität prüfen
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5, fontWeight: 600 }}>
                  {t(lang, 'sc_entity_name')} *
                </label>
                <input
                  style={inputStyle}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !loading && doScreening()}
                  placeholder={t(lang, 'sc_placeholder')}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5, fontWeight: 600 }}>
                    {t(lang, 'sc_country')}
                  </label>
                  <input style={inputStyle} value={country} onChange={e => setCountry(e.target.value)} placeholder="z.B. Kenia, Deutschland…" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5, fontWeight: 600 }}>
                    {t(lang, 'sc_type')}
                  </label>
                  <select style={inputStyle} value={entityType} onChange={e => setEntityType(e.target.value)}>
                    <option>{t(lang, 'sc_type_buyer')}</option>
                    <option>{t(lang, 'sc_type_supplier')}</option>
                    <option>{t(lang, 'sc_type_bank')}</option>
                    <option>{t(lang, 'sc_type_other')}</option>
                  </select>
                </div>
              </div>
              <button
                onClick={doScreening}
                disabled={!name.trim() || loading}
                style={{ padding: '10px 20px', borderRadius: 7, background: !name.trim() || loading ? 'var(--surface-3)' : '#f87171', border: 'none', color: !name.trim() || loading ? 'var(--text-4)' : '#fff', cursor: !name.trim() || loading ? 'default' : 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {loading
                  ? <><svg width="13" height="13" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="20 60" /></svg> {t(lang, 'sc_checking')}</>
                  : <><Ic name="shield" size={13} /> {t(lang, 'sc_start_btn')}</>
                }
              </button>
            </div>
          </div>

          {error && <div style={{ marginBottom: 14, padding: '8px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: 6, fontSize: 12, color: '#f87171' }}>&#x26A0; {error}</div>}

          {/* Result card */}
          {result && (
            <div style={{ padding: '18px 20px', background: RISK_BG[result.riskLevel], border: `1px solid ${RISK_COLORS[result.riskLevel]}40`, borderRadius: 10, borderLeft: `4px solid ${RISK_COLORS[result.riskLevel]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{t(lang, 'sc_result_title')}</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{result.entityName}</div>
                  {result.country && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{result.country} · {result.entityType}</div>}
                  <div style={{ fontSize: 10.5, color: 'var(--text-4)', marginTop: 2 }}>
                    Geprüft: {new Date(result.screenedAt).toLocaleString('de-DE')}
                  </div>
                </div>
                <div style={{ padding: '6px 14px', borderRadius: 20, background: `${RISK_COLORS[result.riskLevel]}20`, border: `2px solid ${RISK_COLORS[result.riskLevel]}60`, color: RISK_COLORS[result.riskLevel], fontSize: 13, fontWeight: 800, letterSpacing: '0.05em' }}>
                  &#x25CF; {riskLabel[result.riskLevel]}
                </div>
              </div>

              {result.sanctionedCountryMatch && (
                <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(248,113,113,0.12)', borderRadius: 5, border: '1px solid rgba(248,113,113,0.25)', fontSize: 12, color: '#f87171', fontWeight: 600 }}>
                  &#x1F6AB; {t(lang, 'sc_sanctioned_country_warning')}: {result.country}
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{t(lang, 'sc_ai_analysis')}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6, background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: 5 }}>
                  {result.aiAnalysis}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{t(lang, 'sc_recommendation')}</div>
                <div style={{ fontSize: 12.5, color: RISK_COLORS[result.riskLevel], fontWeight: 600 }}>{result.recommendation}</div>
              </div>

              {/* Disclaimer */}
              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 5, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-4)', lineHeight: 1.5 }}>
                  &#x26A0; <strong style={{ color: 'var(--text-3)' }}>{t(lang, 'sc_ai_note')}.</strong> {t(lang, 'sc_official_check')}
                </div>
              </div>

              <button onClick={() => { setName(''); setCountry(''); setResult(null); }}
                style={{ marginTop: 12, padding: '5px 14px', borderRadius: 5, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-3)', cursor: 'pointer', fontSize: 11 }}>
                {t(lang, 'sc_new_screening')}
              </button>
            </div>
          )}

          {/* Sanctioned countries reference */}
          <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Sanktionierte Länder (Übersicht)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SANCTIONED_COUNTRIES.map(sc => (
                <span key={sc.code} style={{
                  padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                  background: `${RISK_COLORS[sc.level]}12`,
                  border: `1px solid ${RISK_COLORS[sc.level]}35`,
                  color: RISK_COLORS[sc.level],
                }}>
                  {sc.name}
                  <span style={{ fontSize: 9.5, fontWeight: 400, marginLeft: 4, color: `${RISK_COLORS[sc.level]}cc` }}>({sc.regime})</span>
                </span>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-4)' }}>
              Quelle: EU-Sanktionsregime (sanctionsmap.eu), OFAC SDN List, UN Security Council Consolidated List. Stand: 2025. Keine Gewähr auf Vollständigkeit.
            </div>
          </div>
        </div>

        {/* Right: Log */}
        <div style={{ width: 300, flexShrink: 0, overflowY: 'auto', padding: '16px 14px', background: 'var(--surface-2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t(lang, 'sc_log_title')} ({log.length})</div>
            {log.length > 0 && (
              <button onClick={exportLog} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-3)', cursor: 'pointer', fontSize: 10, padding: '3px 7px', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Ic name="download" size={9} /> {t(lang, 'sc_export_log')}
              </button>
            )}
          </div>

          {log.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-4)', fontStyle: 'italic', padding: '12px 0' }}>{t(lang, 'sc_log_empty')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {log.map(entry => (
                <div key={entry.id} style={{ padding: '8px 10px', background: RISK_BG[entry.riskLevel], borderRadius: 6, border: `1px solid ${RISK_COLORS[entry.riskLevel]}25`, cursor: 'pointer' }}
                  onClick={() => setResult(entry)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>{entry.entityName}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: RISK_COLORS[entry.riskLevel] }}>&#x25CF; {riskLabel[entry.riskLevel]}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-4)' }}>
                    {entry.country ? `${entry.country} · ` : ''}{entry.entityType} · {new Date(entry.screenedAt).toLocaleDateString('de-DE')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

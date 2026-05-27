'use client';

import React, { useState } from 'react';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import type { Product } from '@/lib/types';
import type { ProductMaster } from '../types';
import { calcReadinessScore } from '../types';

interface TabProps { product: Product; master: ProductMaster; onSaved: () => void; }

type AIMode = 'hs' | 'readiness' | 'country' | 'docs' | 'invoice';

interface AIResult { mode: AIMode; text: string; }

const COUNTRIES = [
  'Deutschland', 'Niederlande', 'Japan', 'USA', 'Großbritannien',
  'Frankreich', 'Australien', 'Kanada', 'Schweiz', 'Schweden', 'China',
];

async function callAI(prompt: string, system?: string): Promise<string> {
  const res = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      systemPrompt: system ?? 'Du bist ein präziser KI-Assistent für eine Export-Handelsplattform (Ostafrika). Antworte immer auf Deutsch, klar, strukturiert und professionell. Nutze Markdown für Struktur.',
      model: 'claude-haiku-4-5-20251001',
      provider: 'anthropic',
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'AI-Fehler');
  return json.content ?? json.text ?? json.message ?? '';
}

function buildProductContext(product: Product, master: ProductMaster): string {
  return `
Produkt: ${product.name}
Produktart: ${master.productType ?? product.cat ?? '—'}
HS-Code: ${product.hs ?? '—'}
CN-Code: ${master.cnCode ?? '—'}
TARIC: ${master.taricCode ?? '—'}
Ursprungsland: ${product.origin ?? master.productionCountry ?? '—'}
Beschreibung: ${master.descShort ?? master.descLong ?? '—'}
Material/Inhaltsstoffe: ${master.materials ?? master.ingredients ?? '—'}
Qualitätsstandard: ${master.qualityStandard ?? '—'}
EUDR-Status: ${product.eudrStatus ?? master.eudrCompliance ?? '—'}
Zertifizierungen: ${product.certs?.join(', ') ?? '—'}
Verpackung: ${product.packaging ?? master.outerCarton ?? '—'}
Zollbeschreibung: ${master.customsDesc ?? '—'}
`.trim();
}

const Spinner = () => (
  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#60a5fa', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
);

const ResultCard = ({ result, onClose }: { result: AIResult; onClose: () => void }) => (
  <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)', position: 'relative' }}>
    <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4 }}>
      <Ic name="x" size={13} />
    </button>
    <div style={{ fontSize: 12.5, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text-2)' }}>
      {result.text}
    </div>
  </div>
);

export const TabKIAssistent = ({ product, master }: TabProps) => {
  const [loading, setLoading] = useState<AIMode | null>(null);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [targetCountry, setTargetCountry] = useState('Deutschland');
  const [hsDesc, setHsDesc] = useState(master.descShort ?? master.materials ?? '');

  const run = async (mode: AIMode, prompt: string) => {
    setLoading(mode); setError(null); setResult(null);
    try {
      const text = await callAI(prompt);
      setResult({ mode, text });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const ctx = buildProductContext(product, master);
  const score = calcReadinessScore(master);

  const actions = [
    {
      mode: 'hs' as AIMode,
      icon: 'search',
      title: 'HS-Code vorschlagen',
      desc: 'Aus Produktbeschreibung den passenden HS-Code ermitteln',
      color: '#60a5fa',
      onClick: () => run('hs', `Schlage den passenden HS-Code (6-stellig nach Harmonisiertem System) und CN-Code (8-stellig EU) für folgendes Exportprodukt vor:\n\n${ctx}\n\nBeschreibung für Analyse:\n${hsDesc}\n\nGib an:\n1. HS-Code 6-stellig mit Begründung\n2. CN-Code 8-stellig für EU-Import\n3. TARIC-Code 10-stellig (falls bekannt)\n4. Offizielle Zollbeschreibung\n5. Typischer Zollsatz EU`),
    },
    {
      mode: 'readiness' as AIMode,
      icon: 'quality',
      title: 'Export Readiness analysieren',
      desc: `Aktueller Score: ${score}% — Detailanalyse was fehlt`,
      color: score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171',
      onClick: () => run('readiness', `Analysiere die Export-Bereitschaft dieses Produkts und erkläre genau, was für einen reibungslosen Export fehlt:\n\n${ctx}\n\nBewerte:\n1. Vollständigkeit der Produktdaten\n2. Zoll- und Klassifizierungsdaten\n3. Regulatorische Anforderungen (EUDR, REACH, etc.)\n4. Verpackungs- und Logistikdaten\n5. Preiskalkulation\n6. Exportdokumentation\n\nGib konkrete nächste Schritte an, priorisiert nach Wichtigkeit.`),
    },
    {
      mode: 'country' as AIMode,
      icon: 'map',
      title: `Export nach ${targetCountry}`,
      desc: 'Was fehlt? Welche Anforderungen gelten?',
      color: '#a78bfa',
      onClick: () => run('country', `Prüfe was für den Export von "${product.name}" nach ${targetCountry} benötigt wird:\n\n${ctx}\n\nGib an:\n1. Zollsatz und Einfuhrsteuer\n2. Benötigte Zertifizierungen und Dokumente\n3. Lebensmittel-/Produktsicherheitsanforderungen\n4. EUDR-Relevanz für diesen Markt\n5. Besondere Importbeschränkungen\n6. Empfohlener Incoterm\n7. Was von den vorhandenen Produktdaten noch fehlt`),
    },
    {
      mode: 'docs' as AIMode,
      icon: 'doc',
      title: 'Dokumenten-Checkliste',
      desc: 'Vollständige Liste aller benötigten Exportdokumente',
      color: '#34d399',
      onClick: () => run('docs', `Erstelle eine vollständige Dokumenten-Checkliste für den Export von "${product.name}":\n\n${ctx}\n\nListe alle benötigten Dokumente auf:\n1. Pflichtdokumente (immer erforderlich)\n2. Produktspezifische Dokumente\n3. Länderspezifische Dokumente (wichtigste Zielmärkte)\n4. Optionale Dokumente (Wettbewerbsvorteil)\n\nJeweils mit: Dokumentname | Zuständige Stelle | Typische Vorlaufzeit | Hinweis`),
    },
    {
      mode: 'invoice' as AIMode,
      icon: 'edit',
      title: 'Rechnungstext generieren',
      desc: 'Professionelle Produktbezeichnung für Handelsrechnung',
      color: '#fb923c',
      onClick: () => run('invoice', `Formuliere eine professionelle Produktbezeichnung und Beschreibung für eine Handelsrechnung (Commercial Invoice) für folgendes Exportprodukt:\n\n${ctx}\n\nGib an:\n1. Kurze Produktbezeichnung auf Englisch (für Invoice)\n2. Vollständige Beschreibung auf Englisch (2-3 Sätze)\n3. Empfohlene Zollbeschreibung auf Englisch\n4. Produktbezeichnung auf Deutsch\n\nProfessionell, präzise, international verständlich.`),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ padding: '16px 18px', borderRadius: 10, background: 'linear-gradient(135deg, rgba(96,165,250,0.08) 0%, rgba(167,139,250,0.08) 100%)', border: '1px solid rgba(96,165,250,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Ic name="star" size={18} color="#60a5fa" />
          <span style={{ fontSize: 15, fontWeight: 700 }}>KI-Assistent</span>
          <Badge kind="info">Beta</Badge>
        </div>
        <div className="tx3" style={{ fontSize: 12.5 }}>
          Nutze KI um HS-Codes vorzuschlagen, Export-Readiness zu analysieren, Zielland-Anforderungen zu prüfen und Dokumente zu generieren.
        </div>
      </div>

      {/* HS-Code input */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontWeight: 500 }}>
          Produktbeschreibung für HS-Code-Analyse (kann automatisch gefüllt werden)
        </div>
        <textarea
          value={hsDesc}
          onChange={e => setHsDesc(e.target.value)}
          placeholder="Detaillierte Produktbeschreibung, Inhaltsstoffe, Verarbeitung, Verwendungszweck..."
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 12.5, padding: '8px 10px', outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 64, lineHeight: 1.5 }}
        />
      </div>

      {/* Target country selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>Zielland für Export-Check:</span>
        <select
          value={targetCountry}
          onChange={e => setTargetCountry(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, padding: '6px 10px', outline: 'none', cursor: 'pointer' }}
        >
          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="text"
          placeholder="Oder eigenes Land eingeben..."
          onBlur={e => e.target.value && setTargetCountry(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 12.5, padding: '6px 10px', outline: 'none', flex: 1 }}
        />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {actions.map(a => (
          <button
            key={a.mode}
            onClick={a.onClick}
            disabled={loading !== null}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
              padding: '14px 14px', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
              background: `${a.color}0f`, border: `1px solid ${a.color}30`,
              textAlign: 'left', transition: 'all 0.15s', opacity: loading ? 0.6 : 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%' }}>
              {loading === a.mode
                ? <Spinner />
                : <Ic name={a.icon} size={15} color={a.color} />}
              <span style={{ fontSize: 12.5, fontWeight: 600, color: a.color }}>{a.title}</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>{a.desc}</span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12.5, color: '#f87171' }}>
          <strong>Fehler:</strong> {error}
        </div>
      )}

      {/* Result */}
      {result && <ResultCard result={result} onClose={() => setResult(null)} />}

      {/* Product context preview */}
      <details style={{ marginTop: 4 }}>
        <summary style={{ cursor: 'pointer', fontSize: 11.5, color: 'var(--text-3)', padding: '4px 0' }}>
          Produktkontext für KI (zum Prüfen)
        </summary>
        <pre style={{ marginTop: 8, padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 11, color: 'var(--text-3)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
          {ctx}
        </pre>
      </details>
    </div>
  );
};

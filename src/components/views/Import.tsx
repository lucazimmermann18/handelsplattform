'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { Lang } from '@/lib/i18n';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

interface ImportViewProps { lang: Lang; }

const steps = ['Datentyp wählen', 'Datei hochladen', 'Felder zuordnen', 'Validierung', 'Import abschließen'];

const types: Record<string, { label: string; icon: string; cols: string[] }> = {
  suppliers: { label: 'Lieferanten', icon: 'supplier', cols: ['Name', 'Region', 'Land', 'Typ', 'Ansprechpartner', 'Telefon', 'Produkte'] },
  buyers: { label: 'Käufer', icon: 'buyer', cols: ['Firma', 'Stadt', 'Land', 'Branche', 'Ansprechpartner', 'E-Mail', 'Interesse'] },
  products: { label: 'Produkte', icon: 'product', cols: ['Name', 'Kategorie', 'HS-Code', 'Einheit', 'Ursprung', 'Verpackung', 'EK', 'VK'] },
  prices: { label: 'Preisliste', icon: 'finance', cols: ['Produkt-ID', 'Lieferanten-ID', 'Preis', 'Einheit', 'Gültig ab', 'Mindestmenge', 'Frequenz'] },
  orders: { label: 'Historische Aufträge', icon: 'box', cols: ['Auftrag-ID', 'Käufer', 'Produkt', 'Menge', 'Einheit', 'Datum', 'Incoterm', 'Status'] },
};

const validationWarnings = [
  { row: 3, col: 'Land', issue: 'Unbekannter ISO-Code "TZA" — erwartet "TZ"', severity: 'warning' },
  { row: 7, col: 'Telefon', issue: 'Telefonnummer ohne Ländervorwahl', severity: 'warning' },
  { row: 12, col: 'Produkte', issue: 'Produkt "Cashew" nicht im Katalog — wird neu angelegt', severity: 'info' },
];

const fieldMapping = [
  { source: 'Company Name', target: 'Name', confidence: 98 },
  { source: 'State/Province', target: 'Region', confidence: 85 },
  { source: 'Country', target: 'Land', confidence: 96 },
  { source: 'Type', target: 'Typ', confidence: 72 },
  { source: 'Contact Person', target: 'Ansprechpartner', confidence: 91 },
  { source: 'Phone Number', target: 'Telefon', confidence: 88 },
  { source: 'Products', target: 'Produkte', confidence: 74 },
];

export const ImportView = ({ lang: _lang }: ImportViewProps) => {
  const [step, setStep] = useState(0);
  const [type, setType] = useState('suppliers');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [csvText, setCsvText] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (intervalRef.current !== null) clearInterval(intervalRef.current); };
  }, []);

  const handleNext = () => {
    if (step === 3) {
      // Start simulated import
      setImporting(true);
      setProgress(0);
      intervalRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            if (intervalRef.current !== null) { clearInterval(intervalRef.current); intervalRef.current = null; }
            setImporting(false);
            setDone(true);
            setStep(4);
            return 100;
          }
          return p + 4;
        });
      }, 80);
    } else if (step < 4) {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const selectedType = types[type];

  return (
    <div>
      <div className="section-head">
        <h1>Daten importieren</h1>
        <div className="sub">CSV / Excel · Schritt-für-Schritt Import-Assistent</div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
      {/* Step indicator */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: i < step ? 'var(--success)' : i === step ? 'var(--accent)' : 'var(--surface-2)',
                  border: i <= step ? 'none' : '2px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                  color: i <= step ? '#fff' : 'var(--text-3)',
                }}>
                  {i < step ? <Ic name="quality" size={14} color="#fff" /> : i + 1}
                </div>
                <div style={{ fontSize: 10, color: i === step ? 'var(--text)' : 'var(--text-3)', textAlign: 'center', fontWeight: i === step ? 600 : 400 }}>
                  {s}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ height: 2, flex: 1, background: i < step ? 'var(--success)' : 'var(--border)', marginBottom: 24, marginTop: 4 }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="card" style={{ minHeight: 360 }}>
        {/* Step 0: Datentyp wählen */}
        {step === 0 && (
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Welche Daten möchten Sie importieren?</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {Object.entries(types).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  style={{
                    background: type === key ? 'var(--accent)' : 'var(--surface-2)',
                    border: type === key ? '2px solid var(--accent)' : '2px solid var(--border)',
                    borderRadius: 10,
                    padding: '20px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                    color: type === key ? '#fff' : 'var(--text)',
                    transition: 'all 0.15s',
                  }}
                >
                  <Ic name={val.icon} size={28} color={type === key ? '#fff' : 'var(--text-3)'} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{val.label}</span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: 12, background: 'var(--surface-2)', borderRadius: 8, fontSize: 12 }}>
              <strong>Felder:</strong> {selectedType.cols.join(' · ')}
            </div>
          </div>
        )}

        {/* Step 1: Datei hochladen */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Datei hochladen — {selectedType.label}</h2>
            <div style={{
              border: '2px dashed var(--border)',
              borderRadius: 12,
              padding: '48px 24px',
              textAlign: 'center',
              marginBottom: 16,
              cursor: 'pointer',
              background: 'var(--surface-2)',
            }}>
              <Ic name="upload" size={32} color="var(--text-3)" />
              <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600 }}>CSV oder Excel-Datei hierher ziehen</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>oder klicken zum Auswählen</div>
              <button className="btn ghost" style={{ marginTop: 12 }}>Datei auswählen</button>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Oder CSV direkt einfügen:</div>
              <textarea
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                placeholder={`${selectedType.cols.join(',')}
Beispiel GmbH,Hamburg,DE,...`}
                style={{
                  width: '100%',
                  height: 120,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text)',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>
        )}

        {/* Step 2: Felder zuordnen */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Felder zuordnen</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Quell-Spalte</th>
                  <th>Ziel-Feld</th>
                  <th>Konfidenz</th>
                </tr>
              </thead>
              <tbody>
                {fieldMapping.map((fm, i) => (
                  <tr key={i}>
                    <td><span className="mono">{fm.source}</span></td>
                    <td>
                      <select style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', color: 'var(--text)', fontSize: 13 }}>
                        {selectedType.cols.map(c => (
                          <option key={c} selected={c === fm.target}>{c}</option>
                        ))}
                        <option>— ignorieren</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ background: 'var(--border)', borderRadius: 4, height: 6, width: 80, flexShrink: 0 }}>
                          <div style={{
                            background: fm.confidence >= 90 ? 'var(--success)' : fm.confidence >= 75 ? 'var(--warning)' : 'var(--danger)',
                            borderRadius: 4, height: 6,
                            width: `${fm.confidence}%`,
                          }} />
                        </div>
                        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{fm.confidence}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Step 3: Validierung */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Validierung</h2>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 13 }}>
              <span><strong>142</strong> Zeilen erkannt</span>
              <span style={{ color: 'var(--danger)' }}><strong>0</strong> Fehler</span>
              <span style={{ color: 'var(--warning)' }}><strong>{validationWarnings.filter(w => w.severity === 'warning').length}</strong> Warnungen</span>
              <span style={{ color: 'var(--text-3)' }}><strong>{validationWarnings.filter(w => w.severity === 'info').length}</strong> Hinweise</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Zeile</th>
                  <th>Spalte</th>
                  <th>Problem</th>
                  <th>Schwere</th>
                </tr>
              </thead>
              <tbody>
                {validationWarnings.map((w, i) => (
                  <tr key={i}>
                    <td className="mono">{w.row}</td>
                    <td>{w.col}</td>
                    <td style={{ fontSize: 12 }}>{w.issue}</td>
                    <td>
                      <Badge kind={w.severity === 'warning' ? 'warning' : 'info'}>
                        {w.severity === 'warning' ? 'Warnung' : 'Info'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(16,185,129,0.10)', borderRadius: 8, fontSize: 12, color: '#34d399' }}>
              <Ic name="quality" size={14} color="#34d399" /> Import kann fortgesetzt werden — keine kritischen Fehler
            </div>
          </div>
        )}

        {/* Step 4: Import abschließen */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 20 }}>
            {importing && (
              <>
                <Ic name="refresh" size={40} color="var(--accent)" />
                <div style={{ fontSize: 15, fontWeight: 600 }}>Importiere Daten…</div>
                <div style={{ width: 320 }}>
                  <div style={{ background: 'var(--border)', borderRadius: 8, height: 10, overflow: 'hidden' }}>
                    <div style={{ background: 'var(--accent)', borderRadius: 8, height: 10, width: `${progress}%`, transition: 'width 0.1s' }} />
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--text-3)' }}>{progress}%</div>
                </div>
              </>
            )}
            {done && !importing && (
              <>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ic name="quality" size={32} color="#34d399" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#34d399', marginBottom: 6 }}>Import erfolgreich!</div>
                  <div style={{ fontSize: 14, color: 'var(--text-3)' }}>
                    142 {selectedType.label} wurden importiert
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn ghost" onClick={() => { setStep(0); setDone(false); setProgress(0); }}>
                    Weiteren Import starten
                  </button>
                  <button className="btn primary">
                    Daten anzeigen
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      {!done && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingBottom: 12 }}>
          <button
            className="btn ghost"
            onClick={handleBack}
            disabled={step === 0}
            style={{ opacity: step === 0 ? 0.4 : 1 }}
          >
            <Ic name="chevL" size={14} /> Zurück
          </button>
          <button
            className="btn primary"
            onClick={handleNext}
            disabled={step === 4 || importing}
          >
            {step === 3 ? (
              <><Ic name="upload" size={14} /> Importieren</>
            ) : (
              <>Weiter <Ic name="chevR" size={14} /></>
            )}
          </button>
        </div>
      )}
      </div>
    </div>
  );
};

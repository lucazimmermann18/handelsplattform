'use client';

import React from 'react';
import { MOCK } from '@/lib/mock';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

const REQUIRED_DOCS = [
  'Commercial Invoice',
  'Packing List',
  'Certificate of Origin',
  'Phytosanitary Cert',
  'Bill of Lading',
  'Insurance',
  'Lab Report',
  'Health Cert',
  'Fumigation',
] as const;

type DocReq = 'pflicht' | 'opt' | 'na';

function getDocReq(docIdx: number, cat: string): DocReq {
  if (docIdx === 7) return cat === 'Fleisch' ? 'pflicht' : 'na';
  if (docIdx === 6) return 'opt';
  if (docIdx === 8) return cat === 'Baustoffe' ? 'pflicht' : 'opt';
  if (docIdx === 3) {
    return ['Kaffee', 'Nüsse', 'Obst', 'Saaten', 'Gewürze'].includes(cat) ? 'pflicht' : 'na';
  }
  return 'pflicht';
}

const AUTHORITIES = [
  { n: 'TBS — Tanzania Bureau of Standards',   type: 'Produktstandards, COA',                     sla: '5–7 AT', email: 'export@tbs.go.tz' },
  { n: 'TPHPA — Plant Health Authority',        type: 'Phytosanitary Certificate',                  sla: '3–5 AT', email: 'phyto@tphpa.go.tz' },
  { n: 'TanTrade',                              type: 'Certificate of Origin',                      sla: '1–2 AT', email: 'co@tantrade.go.tz' },
  { n: 'EU TRACES NT',                          type: 'Veterinär & Pflanzengesundheit',             sla: 'Live',   email: 'support-traces@ec.europa.eu' },
  { n: 'SGS Tanzania',                          type: 'Laboranalysen, COA',                         sla: '2–3 AT', email: 'lab.tz@sgs.com' },
  { n: 'Bureau Veritas',                        type: 'Inspektion, Verladung',                      sla: 'On-demand', email: 'inspection.tz@bureauveritas.com' },
];

const EU_REQUIREMENTS = [
  { c: 'Kaffee',     r: 'EUDR Sorgfaltspflicht ab 30.12.2025 · GPS-Koordinaten Erzeuger · Ochratoxin A < 5 µg/kg' },
  { c: 'Nüsse',      r: 'Aflatoxin B1 < 2 µg/kg · Aflatoxin total < 4 µg/kg · Salmonellen frei' },
  { c: 'Obst',       r: 'GlobalG.A.P. · MRL Pestizide · Phyto · Cold-chain Dokumentation' },
  { c: 'Fleisch',    r: 'EU Veterinär Listenbetrieb · TRACES · Ohrmarken-Rückverfolgung · Trichinoskopie' },
  { c: 'Gewürze',    r: 'ETO frei · Sudan-Farbstoffe frei · Mikro spec EU 2073/2005' },
  { c: 'Zucker',     r: 'EU-Zollkontingent · Polarisation Cert · Schwermetalle Lab' },
  { c: 'Baustoffe',  r: 'EN 771-1 Konformität · CE-Kennzeichnung · Druckfestigkeitsbericht' },
];

interface ComplianceViewProps {
  lang: Lang;
}

export const ComplianceView = ({ lang }: ComplianceViewProps) => {
  const M = MOCK;
  const exportReady = M.products.filter(p => p.exportReady).length;

  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_compliance')}</h1>
        <div className="sub">Export-/Importanforderungen · HS-Codes · Behörden · EU-Konformität</div>
        <div className="right">
          <Badge kind="success" dot>{exportReady} Export-ready</Badge>
          <Badge kind="danger" dot>{M.products.length - exportReady} Blockiert</Badge>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        {/* Document matrix */}
        <div className="card" style={{ marginBottom: 12, overflowX: 'auto' }}>
          <div className="card-head">
            <Ic name="customs" size={14} />
            <span className="title">Pflicht-Dokumenten-Matrix</span>
            <span className="meta">EU-Export · {M.products.slice(0, 8).length} Produkte</span>
            <div className="row" style={{ marginLeft: 'auto', gap: 12, fontSize: 11 }}>
              <span className="row" style={{ gap: 5 }}><Ic name="task" size={12} color="#34d399" /> Pflicht</span>
              <span className="row" style={{ gap: 5 }}><Ic name="task" size={12} color="#5d667d" /> Optional</span>
              <span className="tx3">— N/A</span>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 180 }}>Produkt · HS-Code</th>
                  {REQUIRED_DOCS.map(d => (
                    <th key={d} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 110, textAlign: 'left', verticalAlign: 'bottom', paddingBottom: 8, fontSize: 10, fontWeight: 500, color: 'var(--text-3)' }}>
                      {d}
                    </th>
                  ))}
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {M.products.slice(0, 8).map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="fw500">{p.name}</div>
                      <div className="tx3 mono" style={{ fontSize: 10 }}>{p.hs} · {p.cat}</div>
                    </td>
                    {REQUIRED_DOCS.map((_, i) => {
                      const req = getDocReq(i, p.cat);
                      return (
                        <td key={i} style={{ textAlign: 'center', padding: 6 }}>
                          {req === 'pflicht' && <Ic name="task" size={14} color="#34d399" />}
                          {req === 'opt'     && <Ic name="task" size={14} color="#5d667d" />}
                          {req === 'na'      && <span className="tx3 mono" style={{ fontSize: 10 }}>—</span>}
                        </td>
                      );
                    })}
                    <td>
                      {p.exportReady
                        ? <Badge kind="success" dot>Export-ready</Badge>
                        : <Badge kind="danger" dot>Blockiert</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* EU requirements + Authorities */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="card">
            <div className="card-head">
              <Ic name="info" size={14} />
              <span className="title">EU-Anforderungen pro Kategorie</span>
            </div>
            <div className="card-body">
              {EU_REQUIREMENTS.map((x, i) => (
                <div key={i} style={{ padding: '9px 0', borderBottom: i < EU_REQUIREMENTS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div className="row" style={{ marginBottom: 3 }}>
                    <span className="fw500" style={{ fontSize: 12 }}>{x.c}</span>
                  </div>
                  <div className="tx2" style={{ fontSize: 11, lineHeight: 1.5 }}>{x.r}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <Ic name="flag" size={14} />
              <span className="title">Behörden &amp; Zertifizierungsstellen</span>
            </div>
            <div className="card-body">
              {AUTHORITIES.map((a, i) => (
                <div key={i} style={{ padding: '9px 0', borderBottom: i < AUTHORITIES.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div className="row" style={{ marginBottom: 3 }}>
                    <div style={{ flex: 1 }}>
                      <div className="fw500" style={{ fontSize: 12 }}>{a.n}</div>
                      <div className="tx3" style={{ fontSize: 10.5 }}>{a.type}</div>
                    </div>
                    <Badge kind="info">{a.sla}</Badge>
                  </div>
                  <div className="tx3 mono" style={{ fontSize: 10.5 }}>{a.email}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

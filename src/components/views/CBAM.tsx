'use client';

import React, { useMemo } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { fmtNum } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

export interface CBAMViewProps { lang: Lang }

const EMISSION_FACTOR = 0.012;
const DISTANCES: Record<string, number> = {
  rotterdam: 11800,
  hamburg: 12200,
  felixstowe: 12000,
  antwerp: 11900,
};

const EUDR_CATS = ['Kaffee', 'Fleisch', 'Saaten'];

function getDistance(dest: string): number {
  if (!dest) return 10000;
  const key = dest.toLowerCase();
  for (const [k, v] of Object.entries(DISTANCES)) {
    if (key.includes(k)) return v;
  }
  return 10000;
}

function toTons(qty: number, unit: string): number {
  if (unit === 'MT') return qty;
  if (unit === 'KG') return qty / 1000;
  return 1;
}

export const CBAMView = ({ lang: _lang }: CBAMViewProps) => {
  const { data: M } = useData();

  const rows = useMemo(() => {
    if (!M) return [];
    return M.orders.map(o => {
      const product = M.products.find(p => p.id === o.productId);
      const tons = toTons(o.qty, o.unit);
      const dist = getDistance(o.portDest);
      const co2Kg = tons * dist * EMISSION_FACTOR;
      const co2PerEur = o.revenue > 0 ? co2Kg / o.revenue : 0;
      const eudrRelevant = product ? EUDR_CATS.includes(product.cat) : false;
      return { o, product, tons, dist, co2Kg, co2PerEur, eudrRelevant };
    });
  }, [M]);

  const byMonth = useMemo(() => {
    const acc: Record<string, number> = {};
    rows.forEach(r => {
      const m = r.o.created?.slice(0, 7) ?? '';
      if (m) acc[m] = (acc[m] ?? 0) + r.co2Kg;
    });
    return Object.entries(acc).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  }, [rows]);

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const totalCO2 = rows.reduce((s, r) => s + r.co2Kg, 0);
  const avgCO2 = rows.length > 0 ? totalCO2 / rows.length : 0;
  const eudrCount = rows.filter(r => r.eudrRelevant).length;
  const totalRev = M.orders.reduce((s, o) => s + o.revenue, 0);
  const co2Intensity = totalRev > 0 ? totalCO2 / totalRev : 0;

  const maxMonthCO2 = Math.max(...byMonth.map(([, v]) => v), 1);

  const handleExportCSV = () => {
    const headers = ['Auftrag','Produkt','Route','Menge (t)','Distanz (km)','CO₂ (kg)','CO₂/€','EU-Status'];
    const csvRows = rows.map(r => [
      r.o.id,
      r.product?.name ?? r.o.productId,
      `${r.o.portLoad} → ${r.o.portDest}`,
      r.tons.toFixed(2),
      r.dist,
      r.co2Kg.toFixed(1),
      r.co2PerEur.toFixed(4),
      r.eudrRelevant ? 'EUDR-relevant' : 'Standard',
    ]);
    const csv = [headers, ...csvRows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `cbam-${new Date().toISOString().slice(0,10)}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <div className="section-head">
        <h1>CBAM / CO₂-Tracking</h1>
        <div className="sub">Emissionsberechnung · Seefracht</div>
        <div className="right">
          <button className="btn" onClick={handleExportCSV}><Ic name="download" size={13} /> CSV Export</button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { l: 'Total CO₂ YTD', v: `${fmtNum(Math.round(totalCO2))} kg`, c: '#34d399' },
            { l: 'Ø pro Auftrag', v: `${fmtNum(Math.round(avgCO2))} kg`, c: '#60a5fa' },
            { l: 'EU-Reportpflichtig', v: `${eudrCount} Aufträge`, c: '#fbbf24' },
            { l: 'CO₂ Intensität', v: `${co2Intensity.toFixed(3)} kg/€`, c: '#a78bfa' },
          ].map((k, i) => (
            <div key={i} className="card" style={{ padding: 14 }}>
              <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase' }}>{k.l}</div>
              <div className="mono fw600" style={{ fontSize: 18, color: k.c, marginTop: 4 }}>{k.v}</div>
            </div>
          ))}
        </div>

        {byMonth.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-head">
              <Ic name="chart" size={14} />
              <span className="title">Monatlicher CO₂-Trend (kg)</span>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
              {byMonth.map(([month, val]) => (
                <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: '100%', background: '#34d399', borderRadius: '3px 3px 0 0', height: `${(val / maxMonthCO2) * 72}px` }} />
                  <div className="mono tx3" style={{ fontSize: 9 }}>{month.slice(5)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card" style={{ marginBottom: 16 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Auftrag</th>
                <th>Produkt</th>
                <th>Route</th>
                <th className="num">Menge (t)</th>
                <th className="num">Distanz (km)</th>
                <th className="num">CO₂ (kg)</th>
                <th className="num">CO₂/€</th>
                <th>EU-Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)' }}>Keine Aufträge</td></tr>
              )}
              {rows.map(({ o, product, tons, dist, co2Kg, co2PerEur, eudrRelevant }) => (
                <tr key={o.id}>
                  <td><span className="id">{o.id}</span></td>
                  <td className="tx2" style={{ fontSize: 12 }}>{product?.name ?? o.productId}</td>
                  <td className="mono tx3" style={{ fontSize: 10 }}>{o.portLoad} → {o.portDest}</td>
                  <td className="num mono">{tons.toFixed(2)}</td>
                  <td className="num mono">{fmtNum(dist)}</td>
                  <td className="num mono fw500">{fmtNum(Math.round(co2Kg))}</td>
                  <td className="num mono tx3" style={{ fontSize: 11 }}>{co2PerEur.toFixed(4)}</td>
                  <td>
                    <Badge kind={eudrRelevant ? 'warning' : 'neutral'}>
                      {eudrRelevant ? 'EUDR-relevant' : 'Standard'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="card-head" style={{ padding: '0 0 10px' }}>
            <Ic name="info" size={14} color="#22d3ee" />
            <span className="title">CBAM-Zeitplan &amp; Informationen</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="row" style={{ gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <Badge kind="success">2023–2025</Badge>
              <span className="tx2" style={{ fontSize: 12 }}>Übergangsphase: nur Berichtspflicht, keine Zahlungen</span>
            </div>
            <div className="row" style={{ gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <Badge kind="warning">Jan 2026</Badge>
              <span className="tx2" style={{ fontSize: 12 }}>CBAM-Vollregime: Zertifikatskauf für eingebettete Emissionen verpflichtend</span>
            </div>
            <div className="row" style={{ gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <Badge kind="info">Produkte</Badge>
              <span className="tx2" style={{ fontSize: 12 }}>Stahl, Aluminium, Zement, Düngemittel, Strom, Wasserstoff — Agrargüter derzeit ausgenommen</span>
            </div>
            <div className="row" style={{ gap: 10, padding: '8px 0' }}>
              <Badge kind="neutral">Emissionsfaktor</Badge>
              <span className="tx2" style={{ fontSize: 12 }}>Seefracht: {EMISSION_FACTOR} kg CO₂/Tonne-km (GLEC Framework)</span>
            </div>
          </div>
          <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(34,211,238,0.06)', borderRadius: 6, border: '1px solid rgba(34,211,238,0.2)' }}>
            <div className="tx2" style={{ fontSize: 11.5, lineHeight: 1.55 }}>
              Ostafrika-Exporte (Kaffee, Nüsse, Gewürze) sind derzeit nicht direkt CBAM-pflichtig. Dennoch empfehlen wir Emissionserfassung für Kundentransparenz und zukünftige Scope-3-Berichtspflichten unter CSRD.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

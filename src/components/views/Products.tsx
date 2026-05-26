'use client';

import React from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtNum, fmtKg } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge, Stars } from '@/components/ui/primitives';

// ────────────────────────────────────────────────────────────
// Products List
// ────────────────────────────────────────────────────────────

interface ProductsListProps {
  lang: Lang;
  onOpen: (id: string) => void;
}

export const ProductsList = ({ lang, onOpen }: ProductsListProps) => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const totalVariants = M.products.reduce((s, p) => s + p.variants.length, 0);

  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_products')}</h1>
        <div className="sub">{M.products.length} Produkte · {totalVariants} Varianten</div>
        <div className="right">
          <button className="btn primary" onClick={() => window.dispatchEvent(new CustomEvent('open-product-wizard'))}><Ic name="plus" size={13} /> Neues Produkt</button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {M.products.map(p => {
            const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
            const iconName = p.cat === 'Kaffee' ? 'coffee' : 'leaf';
            return (
              <div key={p.id} className="card" style={{ cursor: 'pointer' }} onClick={() => onOpen(p.id)}>
                <div className="card-head">
                  <Ic name={iconName} size={14} />
                  <span className="title">{p.name}</span>
                  <span className="meta">{p.cat}</span>
                  {!p.exportReady && <Badge kind="danger">nicht export</Badge>}
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                    <div>
                      <div className="tx3" style={{ fontSize: 10 }}>HS-Code</div>
                      <div className="mono fw500" style={{ fontSize: 12 }}>{p.hs}</div>
                    </div>
                    <div>
                      <div className="tx3" style={{ fontSize: 10 }}>Ursprung</div>
                      <div className="mono" style={{ fontSize: 11 }}>{p.origin}</div>
                    </div>
                    <div>
                      <div className="tx3" style={{ fontSize: 10 }}>MOQ</div>
                      <div className="mono" style={{ fontSize: 11 }}>{p.moq}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                    <div>
                      <div className="tx3" style={{ fontSize: 10 }}>EK</div>
                      <div className="mono fw500" style={{ fontSize: 12 }}>{p.buyPrice.toFixed(2)} €</div>
                    </div>
                    <div>
                      <div className="tx3" style={{ fontSize: 10 }}>VK</div>
                      <div className="mono fw500" style={{ fontSize: 12, color: '#34d399' }}>{p.sellPrice.toFixed(2)} €</div>
                    </div>
                    <div>
                      <div className="tx3" style={{ fontSize: 10 }}>Marge</div>
                      <div className="mono fw500" style={{ fontSize: 12, color: '#34d399' }}>{p.margin}%</div>
                    </div>
                  </div>

                  <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>
                    Varianten · {fmtKg(totalStock)} verfügbar
                  </div>
                  {p.variants.map((v, i) => (
                    <div key={i} className="row" style={{ padding: '4px 0', fontSize: 11.5, borderBottom: i < p.variants.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span>{v.v}</span>
                      <Badge kind="neutral">{v.grade}</Badge>
                      <span className="mono tx2" style={{ marginLeft: 'auto' }}>{fmtNum(v.stock)} {p.unit}</span>
                    </div>
                  ))}

                  <div className="sep" />
                  <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                    {p.certs.map((c, i) => <Badge key={i} kind="ocean">{c}</Badge>)}
                  </div>
                  <div className="row tx3" style={{ fontSize: 10.5, marginTop: 8 }}>
                    <span>{p.buyers} Käufer interessiert</span>
                    <span style={{ marginLeft: 'auto' }}>{p.suppliers} Lieferanten</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Product Detail
// ────────────────────────────────────────────────────────────

interface ProductDetailProps {
  id: string;
  lang: Lang;
  onBack: () => void;
}

interface QcRow { p: string; min: string; tgt: string; max: string; eu: string; }

function getQcRows(cat: string): QcRow[] {
  if (cat === 'Kaffee') return [
    { p: 'Feuchtigkeit', min: '10%', tgt: '11.5%', max: '12.5%', eu: '12.5%' },
    { p: 'Defects (Specialty)', min: '—', tgt: '4', max: '8', eu: '—' },
    { p: 'Cup Score (SCA)', min: '85', tgt: '87', max: '—', eu: '—' },
    { p: 'Ochratoxin A', min: '—', tgt: '<1 µg/kg', max: '5 µg/kg', eu: '5 µg/kg' },
    { p: 'Größe', min: 'Screen 15', tgt: '17+', max: '—', eu: '—' },
  ];
  if (cat === 'Nüsse') return [
    { p: 'Feuchtigkeit', min: '3%', tgt: '4.2%', max: '5%', eu: '5%' },
    { p: 'Reinheit', min: '99%', tgt: '99.5%', max: '—', eu: '—' },
    { p: 'Aflatoxin B1', min: '—', tgt: '<1 ppb', max: '2 ppb', eu: '2 µg/kg' },
    { p: 'Aflatoxin Total', min: '—', tgt: '<2 ppb', max: '4 ppb', eu: '4 µg/kg' },
    { p: 'Salmonellen', min: '—', tgt: 'n.n.', max: 'n.n.', eu: 'n.n. in 25g' },
    { p: 'Bruchanteil', min: '—', tgt: '3%', max: '5%', eu: '—' },
  ];
  return [
    { p: 'Feuchtigkeit', min: '5%', tgt: '7%', max: '8%', eu: '—' },
    { p: 'Fremdkörper', min: '—', tgt: '0.3%', max: '0.5%', eu: '—' },
    { p: 'MRL Pestizide', min: '—', tgt: 'EU-konform', max: '—', eu: 'EU 396/2005' },
  ];
}

export const ProductDetail = ({ id, lang, onBack }: ProductDetailProps) => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const p = M.products.find(x => x.id === id);
  if (!p) return <div className="empty">Produkt nicht gefunden</div>;

  const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
  const buyersForProduct = M.buyers.filter(b =>
    b.interests.some(i => i.toLowerCase().includes(p.name.split(' ')[0].toLowerCase()))
  );
  const qcRows = getQcRows(p.cat);
  const iconName = p.cat === 'Kaffee' ? 'coffee' : 'leaf';

  return (
    <div>
      <div className="section-head">
        <button className="btn ghost" onClick={onBack} style={{ padding: 4 }}>
          <Ic name="chevL" size={14} /> {t(lang, 'back')}
        </button>
        <h1 style={{ margin: 0, fontSize: 18 }}>{p.name}</h1>
        <Badge kind="neutral">{p.cat}</Badge>
        <Badge kind="info" dot>HS {p.hs}</Badge>
        {p.exportReady
          ? <Badge kind="success" dot>Export-ready</Badge>
          : <Badge kind="danger" dot>blockiert</Badge>}
        <div className="right">
          <button className="btn" onClick={() => window.print()}><Ic name="download" size={13} /> Datenblatt PDF</button>
          <button className="btn primary" onClick={() => window.dispatchEvent(new CustomEvent('open-wizard', { detail: { productId: p.id } }))}><Ic name="star" size={13} /> Angebot erstellen</button>
        </div>
      </div>

      <div className="detail-grid">
        {/* ── LEFT ── */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Specification */}
          <div className="card">
            <div className="card-head"><Ic name="info" size={14} /><span className="title">Spezifikation</span></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="fields">
                  <div className="l">HS-Code</div><div className="v mono fw500">{p.hs}</div>
                  <div className="l">Ursprung</div><div className="v">{p.origin}</div>
                  <div className="l">Einheit</div><div className="v">{p.unit}</div>
                  <div className="l">Verpackung</div><div className="v">{p.packaging}</div>
                  <div className="l">MOQ</div><div className="v">{p.moq}</div>
                  <div className="l">Lagertemp</div><div className="v">15–25°C, trocken</div>
                  <div className="l">Haltbarkeit</div><div className="v">12 Monate</div>
                </div>
                <div className="fields">
                  <div className="l">Einkaufspreis</div>
                  <div className="v mono fw500">{p.buyPrice.toFixed(2)} €/{p.unit}</div>
                  <div className="l">Verkaufspreis</div>
                  <div className="v mono fw500" style={{ color: '#34d399' }}>{p.sellPrice.toFixed(2)} €/{p.unit}</div>
                  <div className="l">Mindestpreis</div>
                  <div className="v mono">{(p.buyPrice * 1.15).toFixed(2)} €/{p.unit}</div>
                  <div className="l">Zielmarge</div>
                  <div className="v mono fw500" style={{ color: '#34d399' }}>{p.margin}%</div>
                  <div className="l">Lieferanten</div><div className="v">{p.suppliers}</div>
                  <div className="l">Käufer-Interesse</div><div className="v">{p.buyers}</div>
                  <div className="l">EU-Status</div>
                  <div className="v">
                    <Badge kind={p.exportReady ? 'success' : 'danger'}>
                      {p.exportReady ? 'EU-konform' : 'blockiert'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="card">
            <div className="card-head">
              <Ic name="layers" size={14} />
              <span className="title">Varianten</span>
              <span className="meta">{fmtKg(totalStock)} verfügbar</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Variante</th>
                  <th>Grade</th>
                  <th className="num">Bestand</th>
                  <th>Spezifikation</th>
                  <th>EU-Status</th>
                </tr>
              </thead>
              <tbody>
                {p.variants.map((v, i) => (
                  <tr key={i}>
                    <td className="fw500">{v.v}</td>
                    <td><Badge kind="neutral">{v.grade}</Badge></td>
                    <td className="num fw500">{fmtNum(v.stock)} {p.unit}</td>
                    <td className="tx2" style={{ fontSize: 11 }}>
                      {v.grade.includes('Bio') ? 'Organic EU, COA, Phyto' : 'Standard EU spec'}
                    </td>
                    <td><Badge kind="success">OK</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* QC Specification */}
          <div className="card">
            <div className="card-head">
              <Ic name="quality" size={14} />
              <span className="title">Qualitäts-Spezifikation</span>
            </div>
            <div className="card-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Min</th>
                    <th>Ziel</th>
                    <th>Max</th>
                    <th>EU-Grenzwert</th>
                  </tr>
                </thead>
                <tbody>
                  {qcRows.map((row, i) => (
                    <tr key={i}>
                      <td className="fw500">{row.p}</td>
                      <td className="mono">{row.min}</td>
                      <td className="mono fw500" style={{ color: '#34d399' }}>{row.tgt}</td>
                      <td className="mono">{row.max}</td>
                      <td className="mono tx2" style={{ fontSize: 11 }}>{row.eu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Product image placeholder */}
          <div className="card">
            <div style={{
              aspectRatio: '4/3',
              background: 'repeating-linear-gradient(45deg, #131927, #131927 8px, #0e131f 8px, #0e131f 16px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', borderRadius: '10px 10px 0 0',
            }}>
              <Ic name={iconName} size={40} color="#3b82f6" />
              <div className="tx3 mono" style={{ marginTop: 8, fontSize: 10 }}>PRODUCT_IMAGE_{p.id}</div>
            </div>
            <div className="card-body">
              <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Zertifizierungen</div>
              <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                {p.certs.map((c, i) => <Badge key={i} kind="ocean">{c}</Badge>)}
              </div>
            </div>
          </div>

          {/* Matching buyers */}
          <div className="card">
            <div className="card-head">
              <Ic name="buyer" size={14} />
              <span className="title">Passende Käufer</span>
              <span className="meta">{buyersForProduct.length}</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {buyersForProduct.length === 0 && (
                <div className="empty">Noch keine Käufer verknüpft</div>
              )}
              {buyersForProduct.map((b) => (
                <div key={b.id} className="row" style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', gap: 8 }}>
                  <span className="mono" style={{ fontSize: 11, width: 24 }}>{b.country}</span>
                  <div style={{ flex: 1 }}>
                    <div className="fw500" style={{ fontSize: 12 }}>{b.name.split(' ').slice(0, 3).join(' ')}</div>
                    <div className="tx3" style={{ fontSize: 10.5 }}>{b.industry}</div>
                  </div>
                  <Stars value={b.rating} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

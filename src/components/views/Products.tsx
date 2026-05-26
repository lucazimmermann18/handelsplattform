'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtNum, fmtKg } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge, Stars } from '@/components/ui/primitives';
import type { Product } from '@/lib/types';

const UNITS = ['kg', 't', 'Stk', 'L'];

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

// ── Edit modal ────────────────────────────────────────────────────────────────

interface EditModalProps {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
}

const EditModal = ({ product, onClose, onSaved }: EditModalProps) => {
  const { refresh } = useData();
  const [form, setForm] = useState({
    name:        product.name,
    cat:         product.cat,
    origin:      product.origin,
    hs:          product.hs,
    unit:        product.unit,
    packaging:   product.packaging,
    moq:         product.moq,
    buyPrice:    product.buyPrice,
    sellPrice:   product.sellPrice,
    certs:       product.certs.join(', '),
    exportReady: product.exportReady,
  });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const set = (key: keyof typeof form, val: string | number | boolean) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const margin = form.sellPrice > 0
    ? Math.round((form.sellPrice - form.buyPrice) / form.sellPrice * 100)
    : 0;

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name ist erforderlich.'); return; }
    setSaving(true); setError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const certsArr = form.certs.split(',').map(s => s.trim()).filter(Boolean);
      const { error: sbErr } = await createClient().from('products').update({
        name:         form.name,
        cat:          form.cat,
        origin:       form.origin,
        hs:           form.hs,
        unit:         form.unit,
        packaging:    form.packaging,
        moq:          form.moq,
        buy_price:    form.buyPrice,
        sell_price:   form.sellPrice,
        margin,
        export_ready: form.exportReady,
        certs:        certsArr,
      }).eq('id', product.id);
      if (sbErr) throw new Error(sbErr.message);
      refresh();
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '5vh' }}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ width: '92vw', maxWidth: 520, maxHeight: '88vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
      >
        <div className="modal-head">
          <Ic name="product" size={14} />
          <span style={{ fontWeight: 700 }}>Produkt bearbeiten</span>
          <span className="mono tx3" style={{ fontSize: 11, marginLeft: 4 }}>· {product.id}</span>
          <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={onClose}>
            <Ic name="x" size={13} />
          </button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Name */}
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Name *</div>
              <input autoFocus type="text" value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle} />
            </div>

            {/* Cat + Origin */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Kategorie</div>
                <input type="text" value={form.cat} onChange={e => set('cat', e.target.value)} placeholder="z.B. Kaffee" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Herkunft</div>
                <input type="text" value={form.origin} onChange={e => set('origin', e.target.value)} placeholder="z.B. TZ" style={inputStyle} />
              </div>
            </div>

            {/* HS + Einheit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>HS-Code</div>
                <input type="text" value={form.hs} onChange={e => set('hs', e.target.value)} placeholder="z.B. 0901.11" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500 }}>Einheit</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {UNITS.map(u => (
                    <span key={u} className={`chip${form.unit === u ? ' on' : ''}`} onClick={() => set('unit', u)} style={{ cursor: 'pointer' }}>{u}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Packaging + MOQ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Verpackung</div>
                <input type="text" value={form.packaging} onChange={e => set('packaging', e.target.value)} placeholder="z.B. 60 kg Jutesack" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>MOQ</div>
                <input type="text" value={form.moq} onChange={e => set('moq', e.target.value)} placeholder="z.B. 1000 kg" style={inputStyle} />
              </div>
            </div>

            {/* Prices */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Einkaufspreis (€)</div>
                <input type="number" min={0} step={0.01} value={form.buyPrice || ''} onChange={e => set('buyPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Verkaufspreis (€)</div>
                <input type="number" min={0} step={0.01} value={form.sellPrice || ''} onChange={e => set('sellPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" style={inputStyle} />
              </div>
            </div>

            {/* Margin pill */}
            <div style={{ padding: '7px 12px', borderRadius: 7, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 12.5 }}>
              <span style={{ color: 'var(--text-3)' }}>Marge: </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: margin >= 20 ? '#34d399' : margin >= 10 ? '#fbbf24' : margin > 0 ? '#f87171' : 'var(--text-3)' }}>
                {margin}%
              </span>
            </div>

            {/* Certs */}
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Zertifikate</div>
              <input type="text" value={form.certs} onChange={e => set('certs', e.target.value)} placeholder="z.B. Fairtrade, Organic" style={inputStyle} />
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 3 }}>Kommagetrennt</div>
            </div>

            {/* Export ready */}
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500 }}>Exportstatus</div>
              <span className={`chip${form.exportReady ? ' on' : ''}`} onClick={() => set('exportReady', !form.exportReady)} style={{ cursor: 'pointer' }}>Export bereit</span>
            </div>

            {error && (
              <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11.5, color: '#f87171' }}>
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose}>Abbrechen</button>
          <div style={{ flex: 1 }} />
          <button className="btn primary" onClick={handleSave} disabled={saving} style={{ minWidth: 110 }}>
            {saving
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 11, height: 11, border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Speichern…
                </span>
              : <><Ic name="check" size={13} /> Speichern</>
            }
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

// ── Products List ─────────────────────────────────────────────────────────────

interface ProductsListProps { lang: Lang; onOpen: (id: string) => void; }

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
          <button className="btn primary" onClick={() => window.dispatchEvent(new CustomEvent('open-product-wizard'))}>
            <Ic name="plus" size={13} /> Neues Produkt
          </button>
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
                    <div><div className="tx3" style={{ fontSize: 10 }}>HS-Code</div><div className="mono fw500" style={{ fontSize: 12 }}>{p.hs}</div></div>
                    <div><div className="tx3" style={{ fontSize: 10 }}>Ursprung</div><div className="mono" style={{ fontSize: 11 }}>{p.origin}</div></div>
                    <div><div className="tx3" style={{ fontSize: 10 }}>MOQ</div><div className="mono" style={{ fontSize: 11 }}>{p.moq}</div></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                    <div><div className="tx3" style={{ fontSize: 10 }}>EK</div><div className="mono fw500" style={{ fontSize: 12 }}>{p.buyPrice.toFixed(2)} €</div></div>
                    <div><div className="tx3" style={{ fontSize: 10 }}>VK</div><div className="mono fw500" style={{ fontSize: 12, color: '#34d399' }}>{p.sellPrice.toFixed(2)} €</div></div>
                    <div><div className="tx3" style={{ fontSize: 10 }}>Marge</div><div className="mono fw500" style={{ fontSize: 12, color: '#34d399' }}>{p.margin}%</div></div>
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

// ── Product Detail ────────────────────────────────────────────────────────────

interface ProductDetailProps { id: string; lang: Lang; onBack: () => void; }
interface QcRow { p: string; min: string; tgt: string; max: string; eu: string; }

function getQcRows(cat: string): QcRow[] {
  if (cat === 'Kaffee') return [
    { p: 'Feuchtigkeit', min: '10%',       tgt: '11.5%',    max: '12.5%', eu: '12.5%' },
    { p: 'Defects (Specialty)', min: '—',  tgt: '4',        max: '8',     eu: '—' },
    { p: 'Cup Score (SCA)', min: '85',     tgt: '87',        max: '—',     eu: '—' },
    { p: 'Ochratoxin A',    min: '—',      tgt: '<1 µg/kg', max: '5 µg/kg', eu: '5 µg/kg' },
    { p: 'Größe',           min: 'Screen 15', tgt: '17+',   max: '—',     eu: '—' },
  ];
  if (cat === 'Nüsse') return [
    { p: 'Feuchtigkeit', min: '3%',  tgt: '4.2%',   max: '5%',   eu: '5%' },
    { p: 'Reinheit',     min: '99%', tgt: '99.5%',  max: '—',    eu: '—' },
    { p: 'Aflatoxin B1', min: '—',   tgt: '<1 ppb', max: '2 ppb', eu: '2 µg/kg' },
    { p: 'Aflatoxin Total', min: '—', tgt: '<2 ppb', max: '4 ppb', eu: '4 µg/kg' },
    { p: 'Salmonellen',  min: '—',   tgt: 'n.n.',   max: 'n.n.', eu: 'n.n. in 25g' },
    { p: 'Bruchanteil',  min: '—',   tgt: '3%',     max: '5%',   eu: '—' },
  ];
  return [
    { p: 'Feuchtigkeit',  min: '5%', tgt: '7%',        max: '8%', eu: '—' },
    { p: 'Fremdkörper',   min: '—',  tgt: '0.3%',      max: '0.5%', eu: '—' },
    { p: 'MRL Pestizide', min: '—',  tgt: 'EU-konform', max: '—',  eu: 'EU 396/2005' },
  ];
}

export const ProductDetail = ({ id, lang, onBack }: ProductDetailProps) => {
  const { data: M, refresh } = useData();
  const [editOpen, setEditOpen]         = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [deleteError, setDeleteError]   = useState<string | null>(null);

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const p = M.products.find(x => x.id === id);
  if (!p) return <div className="empty">Produkt nicht gefunden</div>;

  const totalStock      = p.variants.reduce((s, v) => s + v.stock, 0);
  const buyersForProduct = M.buyers.filter(b =>
    b.interests.some(i => i.toLowerCase().includes(p.name.split(' ')[0].toLowerCase()))
  );
  const qcRows  = getQcRows(p.cat);
  const iconName = p.cat === 'Kaffee' ? 'coffee' : 'leaf';

  const handleDelete = async () => {
    setDeleting(true); setDeleteError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { error: sbErr } = await createClient().from('products').delete().eq('id', p.id);
      if (sbErr) throw new Error(sbErr.message);
      refresh();
      onBack();
    } catch (e) {
      setDeleteError((e as Error).message);
      setDeleting(false);
    }
  };

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
          <button className="btn" onClick={() => window.dispatchEvent(new CustomEvent('open-product-wizard'))}>
            <Ic name="download" size={13} /> Datenblatt PDF
          </button>
          <button className="btn" onClick={() => setEditOpen(true)}>
            <Ic name="edit" size={13} /> Bearbeiten
          </button>
          <button className="btn" style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }} onClick={() => setDeleteConfirm(true)}>
            <Ic name="trash" size={13} /> Löschen
          </button>
          <button className="btn primary" onClick={() => window.dispatchEvent(new CustomEvent('open-wizard'))}>
            <Ic name="star" size={13} /> Angebot erstellen
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div style={{ margin: '0 16px 12px', padding: '12px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#f87171' }}>
            Produkt &quot;{p.name}&quot; ({p.id}) dauerhaft löschen?
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 10 }}>
            Diese Aktion kann nicht rückgängig gemacht werden. Alle zugehörigen Daten werden entfernt.
          </div>
          {deleteError && <div style={{ fontSize: 11, color: '#f87171', marginBottom: 8 }}>{deleteError}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }} onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Löschen…' : <><Ic name="trash" size={12} /> Ja, löschen</>}
            </button>
            <button className="btn ghost" onClick={() => { setDeleteConfirm(false); setDeleteError(null); }}>Abbrechen</button>
          </div>
        </div>
      )}

      <div className="detail-grid">
        {/* ── LEFT ── */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

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

          <div className="card">
            <div className="card-head">
              <Ic name="layers" size={14} />
              <span className="title">Varianten</span>
              <span className="meta">{fmtKg(totalStock)} verfügbar</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Variante</th><th>Grade</th><th className="num">Bestand</th>
                  <th>Spezifikation</th><th>EU-Status</th>
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

          <div className="card">
            <div className="card-head">
              <Ic name="quality" size={14} />
              <span className="title">Qualitäts-Spezifikation</span>
            </div>
            <div className="card-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Parameter</th><th>Min</th><th>Ziel</th><th>Max</th><th>EU-Grenzwert</th>
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

      {/* Edit modal */}
      {editOpen && (
        <EditModal
          product={p}
          onClose={() => setEditOpen(false)}
          onSaved={() => setEditOpen(false)}
        />
      )}
    </div>
  );
};

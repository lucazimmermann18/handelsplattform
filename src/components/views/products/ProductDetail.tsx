'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import type { ProductMaster } from './types';
import { STATUS_MAP, calcReadinessScore } from './types';

import { TabUebersicht }   from './tabs/Uebersicht';
import { TabZoll }         from './tabs/Zoll';
import { TabUrsprung }     from './tabs/Ursprung';
import { TabSpezifikation } from './tabs/Spezifikation';
import { TabVerpackung }   from './tabs/Verpackung';
import { TabPreise }       from './tabs/Preise';
import { TabDokumente }    from './tabs/Dokumente';
import { TabCompliance }   from './tabs/Compliance';
import { TabQualitaet }    from './tabs/Qualitaet';
import { TabKIAssistent }  from './tabs/KIAssistent';

type Tab =
  | 'uebersicht' | 'zoll' | 'ursprung' | 'spezifikation'
  | 'verpackung' | 'preise' | 'dokumente' | 'compliance'
  | 'qualitaet' | 'ki';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'uebersicht',    label: 'Übersicht',              icon: 'info'    },
  { key: 'zoll',          label: 'Zoll & HS-Code',         icon: 'shield'  },
  { key: 'ursprung',      label: 'Ursprung & Lieferkette', icon: 'map'     },
  { key: 'spezifikation', label: 'Spezifikationen',        icon: 'quality' },
  { key: 'verpackung',    label: 'Verpackung & Logistik',  icon: 'box'     },
  { key: 'preise',        label: 'Preise & Marge',         icon: 'finance' },
  { key: 'dokumente',     label: 'Dokumente',              icon: 'doc'     },
  { key: 'compliance',    label: 'Compliance',             icon: 'shield'  },
  { key: 'qualitaet',     label: 'Chargen & Qualität',     icon: 'layers'  },
  { key: 'ki',            label: 'KI-Assistent',           icon: 'star'    },
];

interface ProductDetailProps { id: string; lang: Lang; onBack: () => void; }

export const ProductDetail = ({ id, lang, onBack }: ProductDetailProps) => {
  const { data: M, refresh } = useData();
  const [tab,           setTab]           = useState<Tab>('uebersicht');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [deleteError,   setDeleteError]   = useState<string | null>(null);

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const p = M.products.find(x => x.id === id);
  if (!p) return <div className="empty">Produkt nicht gefunden</div>;

  const master: ProductMaster = (p as unknown as { product_master?: ProductMaster }).product_master ?? {};

  const score      = calcReadinessScore(master);
  const scoreColor = score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';
  const statusInfo = STATUS_MAP[master.productStatus ?? 'active'] ?? STATUS_MAP['active'];

  const handleDelete = async () => {
    setDeleting(true); setDeleteError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { error: sbErr } = await createClient().from('products').delete().eq('id', p.id);
      if (sbErr) throw new Error(sbErr.message);
      refresh(); onBack();
    } catch (e) {
      setDeleteError((e as Error).message);
      setDeleting(false);
    }
  };

  const tabProps = { product: p, master, onSaved: refresh };

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="section-head">
        <button className="btn ghost" onClick={onBack} style={{ padding: 4 }}>
          <Ic name="chevL" size={14} /> {t(lang, 'back')}
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h1 style={{ margin: 0, fontSize: 18 }}>{p.name}</h1>
          {master.nameInvoice && (
            <div className="tx3 mono" style={{ fontSize: 10.5 }}>{master.nameInvoice}</div>
          )}
        </div>
        <Badge kind={statusInfo.kind as string}>{statusInfo.label}</Badge>
        {master.productType && <Badge kind="neutral">{master.productType}</Badge>}
        {p.hs && <Badge kind="info" dot>HS {p.hs}</Badge>}
        {p.exportReady
          ? <Badge kind="success" dot>Export-ready</Badge>
          : <Badge kind="danger"  dot>Nicht bereit</Badge>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: `${scoreColor}15`, border: `1px solid ${scoreColor}40` }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor }}>{score}%</span>
          <span className="tx3" style={{ fontSize: 10 }}>Readiness</span>
        </div>
        <div className="right">
          <button className="btn" onClick={() => window.print()}>
            <Ic name="download" size={13} /> Datenblatt
          </button>
          <button
            className="btn"
            style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
            onClick={() => setDeleteConfirm(true)}
          >
            <Ic name="trash" size={13} /> Löschen
          </button>
          <button
            className="btn primary"
            onClick={() => window.dispatchEvent(new CustomEvent('open-wizard', { detail: { productId: p.id } }))}
          >
            <Ic name="star" size={13} /> Angebot erstellen
          </button>
        </div>
      </div>

      {/* ── Delete confirm ──────────────────────────────────────────────────── */}
      {deleteConfirm && (
        <div style={{ margin: '0 16px 12px', padding: '12px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#f87171' }}>
            Produkt &quot;{p.name}&quot; ({p.id}) dauerhaft löschen?
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 10 }}>
            Diese Aktion kann nicht rückgängig gemacht werden.
          </div>
          {deleteError && <div style={{ fontSize: 11, color: '#f87171', marginBottom: 8 }}>{deleteError}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn"
              style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Löschen…' : <><Ic name="trash" size={12} /> Ja, löschen</>}
            </button>
            <button className="btn ghost" onClick={() => { setDeleteConfirm(false); setDeleteError(null); }}>
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* ── Tab navigation ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 16px', gap: 1, overflowX: 'auto', scrollbarWidth: 'none',
        marginBottom: 16,
      }}>
        {TABS.map(tb => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', flexShrink: 0,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '9px 14px', fontSize: 12.5,
              fontWeight: tab === tb.key ? 600 : 400,
              color: tab === tb.key ? 'var(--text)' : 'var(--text-3)',
              borderBottom: tab === tb.key ? '2px solid #60a5fa' : '2px solid transparent',
              marginBottom: -1, transition: 'color 0.15s',
            }}
          >
            <Ic name={tb.icon} size={12} />
            {tb.label}
            {tb.key === 'ki' && <Badge kind="info">KI</Badge>}
          </button>
        ))}
      </div>

      {/* ── Tab content ────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px 32px' }}>
        {tab === 'uebersicht'    && <TabUebersicht    {...tabProps} />}
        {tab === 'zoll'          && <TabZoll          {...tabProps} />}
        {tab === 'ursprung'      && <TabUrsprung      {...tabProps} />}
        {tab === 'spezifikation' && <TabSpezifikation {...tabProps} />}
        {tab === 'verpackung'    && <TabVerpackung    {...tabProps} />}
        {tab === 'preise'        && <TabPreise        {...tabProps} />}
        {tab === 'dokumente'     && <TabDokumente     {...tabProps} />}
        {tab === 'compliance'    && <TabCompliance    {...tabProps} />}
        {tab === 'qualitaet'     && <TabQualitaet     {...tabProps} />}
        {tab === 'ki'            && <TabKIAssistent   {...tabProps} />}
      </div>
    </div>
  );
};

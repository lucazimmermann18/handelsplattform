'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import { ConfirmDelete } from '@/components/ui/ConfirmDelete';
import type { SupplierMaster } from './types';
import { calcTrustScore, TRUST_LEVEL_MAP, SUPPLIER_TYPES } from './types';

import { TabUebersicht }   from './tabs/Uebersicht';
import { TabFarmBetrieb }  from './tabs/FarmBetrieb';
import { TabGeoEUDR }      from './tabs/GeoEUDR';
import { TabCompliance }   from './tabs/Compliance';
import { TabVertrauen }    from './tabs/Vertrauen';
import { TabRisiko }       from './tabs/Risiko';
import { TabKommunikation } from './tabs/Kommunikation';
import { TabScorecard }    from './tabs/Scorecard';
import { TabEntwicklung }  from './tabs/Entwicklung';
import { READINESS_MAP }   from './types';

type Tab = 'uebersicht' | 'farm' | 'geo' | 'compliance' | 'vertrauen' | 'risiko' | 'komm' | 'scorecard' | 'entwicklung';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'uebersicht',  label: 'Übersicht',        icon: 'info'    },
  { key: 'farm',        label: 'Farm & Betrieb',   icon: 'leaf'    },
  { key: 'geo',         label: 'Geo & EUDR',       icon: 'map'     },
  { key: 'compliance',  label: 'Compliance',       icon: 'shield'  },
  { key: 'vertrauen',   label: 'Vertrauen',        icon: 'star'    },
  { key: 'risiko',      label: 'Risiko',           icon: 'alert'   },
  { key: 'komm',        label: 'Kommunikation',    icon: 'mail'    },
  { key: 'scorecard',   label: 'Scorecard',        icon: 'star'    },
  { key: 'entwicklung', label: 'Entwicklung',      icon: 'clock'   },
];

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

interface SupplierDetailProps { id: string; lang: Lang; onBack: () => void; }

export const SupplierDetail = ({ id, lang, onBack }: SupplierDetailProps) => {
  const { data: M, refresh } = useData();
  const [tab, setTab] = useState<Tab>('uebersicht');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', type: '', country: '', region: '', city: '', contact: '', phone: '', email: '', whatsapp: '', capacity: '', tier: 'B' as 'A'|'B'|'C', risk: 'niedrig' as 'niedrig'|'mittel'|'hoch', status: 'aktiv', language: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const s = M.suppliers.find(x => x.id === id);
  if (!s) return <div className="empty">Lieferant nicht gefunden</div>;

  const master: SupplierMaster = (s as unknown as { supplier_master?: SupplierMaster }).supplier_master ?? {};
  const score = calcTrustScore(master);
  const scoreColor = score >= 70 ? '#34d399' : score >= 40 ? '#fbbf24' : '#f87171';
  const tl = master.trustLevel;
  const trustInfo = tl ? TRUST_LEVEL_MAP[tl] : null;
  const readinessInfo = master.exportReadiness ? READINESS_MAP[master.exportReadiness] : null;

  const openEdit = () => {
    setEditForm({
      name: s.name, type: s.type, country: s.country, region: s.region, city: s.city,
      contact: s.contact, phone: s.phone, email: s.email, whatsapp: s.whatsapp ?? '',
      capacity: s.capacity, tier: s.tier, risk: s.risk, status: s.status, language: s.language ?? '',
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    setEditSaving(true); setEditError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { error } = await createClient().from('suppliers').update({
        name: editForm.name, type: editForm.type, country: editForm.country,
        region: editForm.region, city: editForm.city, contact: editForm.contact,
        phone: editForm.phone, email: editForm.email, whatsapp: editForm.whatsapp || null,
        capacity: editForm.capacity, tier: editForm.tier, risk: editForm.risk,
        status: editForm.status, language: editForm.language || null,
      }).eq('id', s.id);
      if (error) throw new Error(error.message);
      setEditOpen(false);
      refresh();
    } catch (e) { setEditError((e as Error).message); }
    finally { setEditSaving(false); }
  };

  const tabProps = { supplier: s, master, onSaved: refresh };

  return (
    <>
      <div>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="section-head">
          <button className="btn ghost" onClick={onBack} style={{ padding: 4 }}>
            <Ic name="chevL" size={14} /> {t(lang, 'back')}
          </button>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: 'linear-gradient(135deg, #1a2540, #0e1828)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#60a5fa', fontFamily: 'Geist Mono', fontSize: 13 }}>
            {s.country.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <h1 style={{ margin: 0, fontSize: 18 }}>{s.name}</h1>
            <div className="tx3" style={{ fontSize: 11 }}>{s.id} · {s.type} · {s.region}, {s.country}</div>
          </div>
          <Badge kind={s.status === 'aktiv' ? 'success' : 'neutral'} dot>{s.status}</Badge>
          {trustInfo && <Badge kind={trustInfo.kind}>{trustInfo.label}</Badge>}
          {readinessInfo && (
            <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: readinessInfo.color, background: `${readinessInfo.color}15`, border: `1px solid ${readinessInfo.color}30` }}>
              {readinessInfo.label}
            </span>
          )}
          <Badge kind={s.risk === 'niedrig' ? 'success' : s.risk === 'mittel' ? 'warning' : 'danger'}>Risiko {s.risk}</Badge>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: `${scoreColor}15`, border: `1px solid ${scoreColor}40` }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor }}>{score}</span>
            <span className="tx3" style={{ fontSize: 9 }}>Trust</span>
          </div>
          <div className="right">
            {s.phone && (
              <button className="btn" onClick={() => window.open('tel:' + s.phone.replace(/\s/g, ''), '_blank')}>
                <Ic name="phone" size={13} /> Anrufen
              </button>
            )}
            <button className="btn primary" onClick={openEdit}>
              <Ic name="edit" size={13} /> Bearbeiten
            </button>
            <button className="btn" style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }} onClick={() => setDeleteOpen(true)}>
              <Ic name="trash" size={13} /> Löschen
            </button>
          </div>
        </div>

        {/* ── Tab Navigation ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 16px', gap: 1, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 16 }}>
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
            </button>
          ))}
        </div>

        {/* ── Tab Content ─────────────────────────────────────────────────── */}
        <div style={{ padding: '0 16px 32px' }}>
          {tab === 'uebersicht'  && <TabUebersicht    {...tabProps} />}
          {tab === 'farm'        && <TabFarmBetrieb  {...tabProps} />}
          {tab === 'geo'         && <TabGeoEUDR      {...tabProps} />}
          {tab === 'compliance'  && <TabCompliance   {...tabProps} />}
          {tab === 'vertrauen'   && <TabVertrauen    {...tabProps} />}
          {tab === 'risiko'      && <TabRisiko       {...tabProps} />}
          {tab === 'komm'        && <TabKommunikation {...tabProps} />}
          {tab === 'scorecard'   && <TabScorecard    {...tabProps} />}
          {tab === 'entwicklung' && <TabEntwicklung  {...tabProps} />}
        </div>
      </div>

      {/* ── Edit Modal ──────────────────────────────────────────────────────── */}
      {editOpen && (
        <div className="overlay" onClick={() => setEditOpen(false)}>
          <div className="modal" style={{ width: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <Ic name="edit" size={15} color="#60a5fa" />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Lieferant bearbeiten</span>
              <button className="btn ghost" style={{ marginLeft: 'auto', padding: 4 }} onClick={() => setEditOpen(false)}>
                <Ic name="x" size={13} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Name</div>
                <input style={inputStyle} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Typ</div>
                  <select style={inputStyle} value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}>
                    {SUPPLIER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Status</div>
                  <select style={inputStyle} value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="aktiv">Aktiv</option>
                    <option value="inaktiv">Inaktiv</option>
                    <option value="in Prüfung">In Prüfung</option>
                  </select>
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Land</div>
                  <input style={inputStyle} value={editForm.country} onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))} />
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Region</div>
                  <input style={inputStyle} value={editForm.region} onChange={e => setEditForm(f => ({ ...f, region: e.target.value }))} />
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Stadt</div>
                  <input style={inputStyle} value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Kapazität</div>
                  <input style={inputStyle} value={editForm.capacity} onChange={e => setEditForm(f => ({ ...f, capacity: e.target.value }))} />
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Ansprechpartner</div>
                  <input style={inputStyle} value={editForm.contact} onChange={e => setEditForm(f => ({ ...f, contact: e.target.value }))} />
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Telefon</div>
                  <input style={inputStyle} value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>WhatsApp</div>
                  <input style={inputStyle} value={editForm.whatsapp} onChange={e => setEditForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="z.B. +255 712 345 678" />
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Sprache(n)</div>
                  <input style={inputStyle} value={editForm.language} onChange={e => setEditForm(f => ({ ...f, language: e.target.value }))} placeholder="z.B. sw / en" />
                </div>
              </div>
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>E-Mail</div>
                <input style={inputStyle} value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 6 }}>Tier</div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {(['A','B','C'] as const).map(t => (
                      <span key={t} className={`chip${editForm.tier === t ? ' on' : ''}`} onClick={() => setEditForm(f => ({ ...f, tier: t }))} style={{ cursor: 'pointer' }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 6 }}>Risiko</div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {(['niedrig','mittel','hoch'] as const).map(r => (
                      <span key={r} className={`chip${editForm.risk === r ? ' on' : ''}`} onClick={() => setEditForm(f => ({ ...f, risk: r }))} style={{ cursor: 'pointer', fontSize: 11 }}>{r}</span>
                    ))}
                  </div>
                </div>
              </div>
              {editError && <div style={{ color: '#f87171', fontSize: 12 }}>{editError}</div>}
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setEditOpen(false)}>Abbrechen</button>
              <button className="btn primary" onClick={handleEditSave} disabled={editSaving}>
                {editSaving ? 'Speichern…' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteOpen && s && (
        <ConfirmDelete label={`Lieferant '${s.name}'`} table="suppliers" id={s.id} onClose={() => setDeleteOpen(false)} onDeleted={onBack} />
      )}
    </>
  );
};

'use client';

import React, { useMemo, useState } from 'react';
import { useData } from '@/lib/data-context';
import { createClient } from '@/lib/supabase/client';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtCur, fmtNum, fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge, Stars, BarChart, StatusBadge } from '@/components/ui/primitives';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { ConfirmDelete } from '@/components/ui/ConfirmDelete';
import { GenericEditModal, type FieldDef } from '@/components/ui/GenericEditModal';
import { useDelete } from '@/lib/use-entity-action';
import { TabBuyerContacts } from './buyers/tabs/BuyerContacts';
import { TabBuyerRequirements } from './buyers/tabs/BuyerRequirements';
import { PIPELINE_STAGES, PRIORITY_MAP, getStageInfo, calcTotalScore, getScoreColor, BUYER_TYPES, SOURCES } from './buyers/types';

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

const BUYER_FIELDS: FieldDef[] = [
  { key: 'name',      label: 'Name',      type: 'text',   required: true, span: 2 },
  { key: 'country',   label: 'Land',      type: 'text',   placeholder: 'z.B. DE' },
  { key: 'city',      label: 'Stadt',     type: 'text' },
  { key: 'industry',  label: 'Branche',   type: 'text' },
  { key: 'contact',   label: 'Kontakt',   type: 'text' },
  { key: 'position',  label: 'Position',  type: 'text' },
  { key: 'email',     label: 'E-Mail',    type: 'text' },
  { key: 'phone',     label: 'Telefon',   type: 'text' },
  { key: 'status',    label: 'Status',    type: 'select', options: [
      { value: 'active', label: 'Aktiv' }, { value: 'inactive', label: 'Inaktiv' },
      { value: 'prospect', label: 'Prospect' },
    ]
  },
  { key: 'incoterm',  label: 'Incoterm',  type: 'text' },
  { key: 'terms',     label: 'Zahlungsbedingungen', type: 'text' },
  { key: 'moq',       label: 'MOQ',       type: 'text' },
  { key: 'interests', label: 'Interessen', type: 'chips', span: 2 },
];

// ────────────────────────────────────────────────────────────
// Buyers List
// ────────────────────────────────────────────────────────────

interface BuyersListProps {
  lang: Lang;
  onOpen: (id: string) => void;
}

export const BuyersList = ({ lang, onOpen }: BuyersListProps) => {
  const { data: M } = useData();
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>{t(lang, 'loading')}</div>;
  const totalRevenue = M.buyers.reduce((s, b) => s + b.revenue, 0);

  const editRecord = editId ? M.buyers.find(x => x.id === editId) ?? null : null;
  const deleteRecord = deleteId ? M.buyers.find(x => x.id === deleteId) ?? null : null;

  const handleExport = () => {
    const headers = ['ID','Name','Land','Stadt','Branche','Kontakt','Email','Rating','Incoterm','MOQ','Umsatz (€)','Status'];
    const rows = M.buyers.map(b => [b.id, b.name, b.country, b.city, b.industry, b.contact, b.email, b.rating, b.incoterm, b.moq, b.revenue, b.status]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `kaeufer-${new Date().toISOString().slice(0,10)}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_buyers')}</h1>
        <div className="sub">
          {M.buyers.length} Käufer · 7 Länder · {fmtCur(totalRevenue)} YTD
        </div>
        <div className="right">
          <button className="btn" onClick={handleExport}><Ic name="download" size={13} /> Export</button>
          <button className="btn primary" onClick={() => window.dispatchEvent(new CustomEvent('open-buyer-wizard'))}><Ic name="plus" size={13} /> Neuer Käufer</button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {M.buyers.map(b => (
            <div key={b.id} className="card" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => onOpen(b.id)}>
              <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }} onClick={e => e.stopPropagation()}>
                <ActionMenu
                  onEdit={() => setEditId(b.id)}
                  onDelete={() => setDeleteId(b.id)}
                />
              </div>
              <div style={{ padding: 14 }}>
                <div className="row" style={{ marginBottom: 8 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 6,
                    background: 'linear-gradient(135deg, #1a2540, #0e1828)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 600, color: '#60a5fa', fontFamily: 'Geist Mono', fontSize: 13,
                    border: '1px solid var(--border)', flexShrink: 0,
                  }}>
                    {b.country}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="fw600" style={{ fontSize: 13 }}>{b.name}</div>
                    <div className="tx3" style={{ fontSize: 11 }}>{b.industry} · {b.city}</div>
                  </div>
                  <Badge kind={b.status === 'aktiv' ? 'success' : b.status === 'in Verhandlung' ? 'warning' : 'info'} dot>
                    {b.status}
                  </Badge>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div className="tx3" style={{ fontSize: 10 }}>Umsatz YTD</div>
                    <div className="mono fw500" style={{ fontSize: 13 }}>{fmtCur(b.revenue)}</div>
                  </div>
                  <div>
                    <div className="tx3" style={{ fontSize: 10 }}>Rating</div>
                    <Stars value={b.rating} />
                  </div>
                  <div>
                    <div className="tx3" style={{ fontSize: 10 }}>Incoterm</div>
                    <div className="mono" style={{ fontSize: 11 }}>{b.incoterm}</div>
                  </div>
                  <div>
                    <div className="tx3" style={{ fontSize: 10 }}>MOQ</div>
                    <div className="mono" style={{ fontSize: 11 }}>{b.moq}</div>
                  </div>
                </div>

                <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Interesse</div>
                <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                  {b.interests.map((p, i) => <Badge key={i} kind="info">{p}</Badge>)}
                </div>

                <div className="sep" />
                <div className="row tx3" style={{ fontSize: 11, gap: 6 }}>
                  <Ic name="mail" size={11} />
                  <span>{b.email}</span>
                  <span style={{ marginLeft: 8 }}><Ic name="phone" size={11} /></span>
                  <span>{b.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editRecord && (
        <GenericEditModal
          title="Käufer bearbeiten"
          subtitle={`${editRecord.id}`}
          record={editRecord as unknown as Record<string, unknown>}
          fields={BUYER_FIELDS}
          table="buyers"
          onClose={() => setEditId(null)}
        />
      )}
      {deleteRecord && (
        <ConfirmDelete
          label={`${deleteRecord.name} (${deleteRecord.id})`}
          table="buyers"
          id={deleteRecord.id}
          onClose={() => setDeleteId(null)}
        />
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Buyer Detail
// ────────────────────────────────────────────────────────────

interface BuyerDetailProps {
  id: string;
  lang: Lang;
  onBack: () => void;
}

export const BuyerDetail = ({ id, lang, onBack }: BuyerDetailProps) => {
  const { data: M, refresh } = useData();
  const b = M?.buyers.find(x => x.id === id);
  const buyerOrders = M ? M.orders.filter(o => o.buyerId === id) : [];
  const buyerDeals = M ? M.deals.filter(d => d.buyerId === id) : [];
  const [detailTab, setDetailTab] = useState<'overview' | 'pipeline' | 'contacts' | 'requirements' | 'comms'>('overview');
  const [pipelineForm, setPipelineForm] = useState<{
    pipelineStage: string; priority: string; source: string; buyerType: string;
    nextFollowUp: string; nextAction: string;
    fitScore: string; commercialScore: string; engagementScore: string; riskScore: string;
    estimatedVolume: string;
  } | null>(null);
  const [pipelineSaving, setPipelineSaving] = useState(false);
  const [commModalOpen, setCommModalOpen] = useState(false);
  const [commForm, setCommForm] = useState({
    type: 'note' as 'email' | 'call' | 'meeting' | 'note' | 'whatsapp',
    direction: 'out' as 'in' | 'out' | 'internal',
    date: new Date().toISOString().slice(0, 10),
    subject: '', body: '', author: 'Admin',
  });
  const [commSaving, setCommSaving] = useState(false);
  const [commError, setCommError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { deleteItem } = useDelete('communications');

  const handleSaveComm = async () => {
    setCommSaving(true); setCommError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { error } = await createClient().from('communications').insert({
        contact_id: id, contact_type: 'buyer',
        type: commForm.type, direction: commForm.direction,
        date: commForm.date, subject: commForm.subject,
        body: commForm.body, author: commForm.author,
      });
      if (error) throw new Error(error.message);
      setCommModalOpen(false);
      setCommForm({ type: 'note', direction: 'out', date: new Date().toISOString().slice(0, 10), subject: '', body: '', author: 'Admin' });
      refresh();
    } catch (e) { setCommError((e as Error).message); }
    finally { setCommSaving(false); }
  };

  const openPipelineForm = () => {
    if (!b) return;
    setPipelineForm({
      pipelineStage: b.pipelineStage ?? 'recherchiert',
      priority: b.priority ?? 'mittel',
      source: b.source ?? '',
      buyerType: b.buyerType ?? '',
      nextFollowUp: b.nextFollowUp ?? '',
      nextAction: b.nextAction ?? '',
      fitScore: String(b.fitScore ?? 0),
      commercialScore: String(b.commercialScore ?? 0),
      engagementScore: String(b.engagementScore ?? 0),
      riskScore: String(b.riskScore ?? 0),
      estimatedVolume: b.estimatedVolume ?? '',
    });
  };

  const savePipelineForm = async () => {
    if (!pipelineForm || !b) return;
    setPipelineSaving(true);
    try {
      await createClient().from('buyers').update({
        pipeline_stage: pipelineForm.pipelineStage,
        priority: pipelineForm.priority,
        source: pipelineForm.source || null,
        buyer_type: pipelineForm.buyerType || null,
        next_follow_up: pipelineForm.nextFollowUp || null,
        next_action: pipelineForm.nextAction || null,
        fit_score: parseInt(pipelineForm.fitScore) || 0,
        commercial_score: parseInt(pipelineForm.commercialScore) || 0,
        engagement_score: parseInt(pipelineForm.engagementScore) || 0,
        risk_score: parseInt(pipelineForm.riskScore) || 0,
        estimated_volume: pipelineForm.estimatedVolume || null,
      }).eq('id', b.id);
      refresh();
    } finally {
      setPipelineSaving(false);
    }
  };

  const commTypeIcon = (tp: string) => {
    if (tp === 'email') return 'mail';
    if (tp === 'call') return 'phone';
    if (tp === 'meeting') return 'buyer';
    if (tp === 'whatsapp') return 'phone';
    return 'doc';
  };

  const revHistory = useMemo(() => {
    const months = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
    const byMonth = new Array(12).fill(0);
    buyerOrders.forEach(o => {
      const d = new Date(o.created);
      if (!isNaN(d.getTime())) byMonth[d.getMonth()] += o.revenue / 1000;
    });
    return months.map((m, i) => ({ m, v: parseFloat(byMonth[i].toFixed(1)) }));
  }, [buyerOrders]);

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>{t(lang, 'loading')}</div>;
  if (!b) return <div className="empty">{t(lang, 'no_data')}</div>;

  const creditLimit = b.revenue * 1.5 + 50000;
  const creditUsed = b.revenue * 0.3;

  return (
    <div>
      <div className="section-head">
        <button className="btn ghost" onClick={onBack} style={{ padding: 4 }}>
          <Ic name="chevL" size={14} /> {t(lang, 'back')}
        </button>
        <div style={{
          width: 44, height: 44, borderRadius: 8,
          background: 'linear-gradient(135deg, #1a2540, #0e1828)',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 600, color: '#60a5fa', fontFamily: 'Geist Mono',
        }}>
          {b.country}
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 18 }}>{b.name}</h1>
          <div className="tx3" style={{ fontSize: 12 }}>{b.id} · {b.industry} · {b.city}, {b.country}</div>
        </div>
        <Badge kind={b.status === 'aktiv' ? 'success' : 'warning'} dot>{b.status}</Badge>
        {(() => {
          const si = getStageInfo(b.pipelineStage ?? 'recherchiert');
          return (
            <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, color: si.color, background: `${si.color}18`, border: `1px solid ${si.color}30` }}>
              {si.emoji} {si.label}
            </span>
          );
        })()}
        <Stars value={b.rating} />
        <div className="right">
          <button
            className="btn"
            onClick={() => window.dispatchEvent(new CustomEvent('open-email', { detail: {
              type: 'general', to: b.email,
              subject: `EastAfrica Export — ${new Date().toLocaleDateString('de-DE')}`,
              recipientName: b.name, data: {},
            }}))}
          >
            <Ic name="mail" size={13} /> Mail
          </button>
          <button className="btn" onClick={() => window.dispatchEvent(new CustomEvent('open-wizard'))}>
            <Ic name="star" size={13} /> Angebot
          </button>
          <button className="btn" onClick={() => setEditOpen(true)}>
            <Ic name="edit" size={13} /> Bearbeiten
          </button>
          <button className="btn" style={{ color: '#f87171' }} onClick={() => setDeleteOpen(true)}>
            <Ic name="trash" size={13} /> Löschen
          </button>
          <button className="btn primary" onClick={() => window.dispatchEvent(new CustomEvent('open-wizard'))}>
            <Ic name="plus" size={13} /> Neuer Auftrag
          </button>
        </div>
      </div>

      <div style={{ padding: '0 0 0 16px' }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          <div className={`tab${detailTab === 'overview' ? ' on' : ''}`} onClick={() => setDetailTab('overview')}>
            <Ic name="buyer" size={12} /> {t(lang, 'tab_overview')}
          </div>
          <div className={`tab${detailTab === 'pipeline' ? ' on' : ''}`} onClick={() => { setDetailTab('pipeline'); if (!pipelineForm) openPipelineForm(); }}>
            <Ic name="deals" size={12} /> {t(lang, 'tab_pipeline')}
          </div>
          <div className={`tab${detailTab === 'contacts' ? ' on' : ''}`} onClick={() => setDetailTab('contacts')}>
            <Ic name="buyer" size={12} /> {t(lang, 'tab_contacts')}{M.buyerContacts.filter(c => c.buyerId === id).length > 0 ? ` (${M.buyerContacts.filter(c => c.buyerId === id).length})` : ''}
          </div>
          <div className={`tab${detailTab === 'requirements' ? ' on' : ''}`} onClick={() => setDetailTab('requirements')}>
            <Ic name="doc" size={12} /> {t(lang, 'tab_requirements')}{M.buyerRequirements.filter(r => r.buyerId === id).length > 0 ? ` (${M.buyerRequirements.filter(r => r.buyerId === id).length})` : ''}
          </div>
          <div className={`tab${detailTab === 'comms' ? ' on' : ''}`} onClick={() => setDetailTab('comms')}>
            <Ic name="mail" size={12} /> {t(lang, 'tab_communications')}
          </div>
        </div>
      </div>

      {detailTab === 'pipeline' && pipelineForm && (
        <div style={{ padding: '20px 16px 24px' }}>
          <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Stage visual */}
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 24, paddingBottom: 6 }}>
              {PIPELINE_STAGES.map(s => (
                <div key={s.key} onClick={() => setPipelineForm(f => f ? { ...f, pipelineStage: s.key } : f)}
                  style={{ flexShrink: 0, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', textAlign: 'center', minWidth: 90,
                    background: pipelineForm.pipelineStage === s.key ? `${s.color}22` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${pipelineForm.pipelineStage === s.key ? s.color : 'rgba(255,255,255,0.08)'}`,
                  }}>
                  <div style={{ fontSize: 18 }}>{s.emoji}</div>
                  <div style={{ fontSize: 10.5, fontWeight: pipelineForm.pipelineStage === s.key ? 700 : 400, color: pipelineForm.pipelineStage === s.key ? s.color : 'var(--text-3)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Priorität</div>
                <select style={inputStyle} value={pipelineForm.priority} onChange={e => setPipelineForm(f => f ? { ...f, priority: e.target.value } : f)}>
                  {Object.entries(PRIORITY_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Käufer-Typ</div>
                <select style={inputStyle} value={pipelineForm.buyerType} onChange={e => setPipelineForm(f => f ? { ...f, buyerType: e.target.value } : f)}>
                  <option value="">— wählen —</option>
                  {BUYER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Quelle</div>
                <select style={inputStyle} value={pipelineForm.source} onChange={e => setPipelineForm(f => f ? { ...f, source: e.target.value } : f)}>
                  <option value="">— wählen —</option>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Follow-up Datum</div>
                <input type="date" style={inputStyle} value={pipelineForm.nextFollowUp} onChange={e => setPipelineForm(f => f ? { ...f, nextFollowUp: e.target.value } : f)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Nächste Aktion</div>
                <input style={inputStyle} value={pipelineForm.nextAction} onChange={e => setPipelineForm(f => f ? { ...f, nextAction: e.target.value } : f)} placeholder="Was ist als nächstes zu tun?" />
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Geschätztes Volumen</div>
                <input style={inputStyle} value={pipelineForm.estimatedVolume} onChange={e => setPipelineForm(f => f ? { ...f, estimatedVolume: e.target.value } : f)} placeholder="z.B. 20t/Jahr" />
              </div>
            </div>

            <div style={{ marginTop: 16, padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 10 }}>Scores (0–100)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { key: 'fitScore', label: 'Fit', color: '#60a5fa' },
                  { key: 'commercialScore', label: 'Commercial', color: '#34d399' },
                  { key: 'engagementScore', label: 'Engagement', color: '#fb923c' },
                  { key: 'riskScore', label: 'Risiko', color: '#f87171' },
                ].map(sc => (
                  <div key={sc.key}>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 4 }}>{sc.label}</div>
                    <input type="number" min={0} max={100} style={{ ...inputStyle, fontFamily: 'Geist Mono', color: sc.color }}
                      value={pipelineForm[sc.key as keyof typeof pipelineForm]}
                      onChange={e => setPipelineForm(f => f ? { ...f, [sc.key]: e.target.value } : f)} />
                  </div>
                ))}
              </div>
              {(() => {
                const total = calcTotalScore(
                  parseInt(pipelineForm.fitScore) || 0,
                  parseInt(pipelineForm.commercialScore) || 0,
                  parseInt(pipelineForm.engagementScore) || 0,
                  parseInt(pipelineForm.riskScore) || 0,
                );
                return total > 0 ? (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Buyer Score:</span>
                    <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'Geist Mono', color: getScoreColor(total) }}>{total}</span>
                  </div>
                ) : null;
              })()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button onClick={savePipelineForm} disabled={pipelineSaving}
                style={{ padding: '8px 20px', borderRadius: 6, background: '#60a5fa', border: 'none', color: '#0d0f1a', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: pipelineSaving ? 0.6 : 1 }}>
                {pipelineSaving ? 'Speichern…' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailTab === 'contacts' && (
        <TabBuyerContacts
          buyerId={id}
          contacts={M.buyerContacts.filter(c => c.buyerId === id)}
          onRefresh={refresh}
        />
      )}

      {detailTab === 'requirements' && (
        <TabBuyerRequirements
          buyerId={id}
          requirements={M.buyerRequirements.filter(r => r.buyerId === id)}
          onRefresh={refresh}
        />
      )}

      {detailTab === 'comms' && (
        <div style={{ padding: '16px 16px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn primary" onClick={() => setCommModalOpen(true)}>
              <Ic name="plus" size={13} /> {t(lang, 'log_communication')}
            </button>
          </div>
          {(() => {
            const comms = (M.communications ?? []).filter(c => c.contactId === id && c.contactType === 'buyer')
              .sort((a, b) => b.date.localeCompare(a.date));
            if (comms.length === 0) return (
              <div className="card" style={{ padding: '40px 16px', textAlign: 'center' }}>
                <Ic name="mail" size={28} color="var(--text-3)" />
                <div className="tx3" style={{ fontSize: 12, marginTop: 8 }}>{t(lang, 'no_communications')}</div>
                <div className="tx3" style={{ fontSize: 11, marginTop: 4 }}>{t(lang, 'no_comms_hint')}</div>
              </div>
            );
            return (
              <div className="card">
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {comms.map((c, i) => (
                    <div key={c.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < comms.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Ic name={commTypeIcon(c.type)} size={13} color="#60a5fa" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="row" style={{ gap: 6, marginBottom: 3 }}>
                          <span className="fw600" style={{ fontSize: 12 }}>{c.subject || '(kein Betreff)'}</span>
                          <Badge kind={c.direction === 'in' ? 'success' : c.direction === 'out' ? 'info' : 'neutral'}>
                            {c.direction === 'in' ? 'Eingehend' : c.direction === 'out' ? 'Ausgehend' : 'Intern'}
                          </Badge>
                          <span className="tx3 mono" style={{ fontSize: 10, marginLeft: 'auto' }}>{fmtDate(c.date)}</span>
                          <button
                            className="btn sm ghost"
                            style={{ padding: '2px 5px', color: '#f87171' }}
                            onClick={() => deleteItem(c.id)}
                            title="Löschen"
                          >×</button>
                        </div>
                        <div className="tx2" style={{ fontSize: 11.5, lineHeight: 1.5, marginBottom: 3 }}>{c.body}</div>
                        <div className="tx3" style={{ fontSize: 10 }}>{c.author}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {detailTab === 'overview' && <div className="detail-grid">
        {/* ── LEFT ── */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Revenue history */}
          <div className="card">
            <div className="card-head">
              <Ic name="chart" size={14} />
              <span className="title">Umsatz-Historie · 12 Monate</span>
              <span className="meta">k €</span>
            </div>
            <div className="card-body">
              <BarChart data={revHistory} w={680} h={150} color="#34d399" lblKey="m" valKey="v" />
              <div className="row tx3" style={{ fontSize: 11, marginTop: 6 }}>
                <span>Gesamt: <span className="mono fw500" style={{ color: '#34d399' }}>{fmtCur(b.revenue)}</span></span>
                <span style={{ marginLeft: 'auto' }}>Ø Auftragsgröße: <span className="mono">{fmtCur(b.revenue / Math.max(1, buyerOrders.length))}</span></span>
              </div>
            </div>
          </div>

          {/* Orders */}
          <div className="card">
            <div className="card-head">
              <Ic name="box" size={14} />
              <span className="title">Aufträge</span>
              <span className="meta">{buyerOrders.length}</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Auftrag</th>
                  <th>Produkt</th>
                  <th className="num">Menge</th>
                  <th className="num">Umsatz</th>
                  <th>Incoterm</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {buyerOrders.length === 0 && (
                  <tr><td colSpan={6} className="empty">Noch keine Aufträge</td></tr>
                )}
                {buyerOrders.map(o => (
                  <tr key={o.id}>
                    <td><span className="id">{o.id}</span></td>
                    <td>{o.productVariant}</td>
                    <td className="num">{fmtNum(o.qty)} {o.unit}</td>
                    <td className="num fw500">{fmtCur(o.revenue)}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{o.incoterm}</td>
                    <td><StatusBadge s={o.status} lang={lang} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pipeline */}
          {buyerDeals.length > 0 && (
            <div className="card">
              <div className="card-head">
                <Ic name="deals" size={14} />
                <span className="title">Pipeline</span>
                <span className="meta">{buyerDeals.length}</span>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Deal</th>
                    <th>Produkt</th>
                    <th className="num">Wert</th>
                    <th>Stage</th>
                    <th>Wahrsch.</th>
                    <th>Follow-up</th>
                  </tr>
                </thead>
                <tbody>
                  {buyerDeals.map(d => {
                    const p = M.products.find(x => x.id === d.productId);
                    return (
                      <tr key={d.id}>
                        <td><span className="id">{d.id}</span></td>
                        <td>{p?.name}</td>
                        <td className="num fw500">{fmtCur(d.value)}</td>
                        <td><Badge kind="info">{d.stage}</Badge></td>
                        <td className="mono">{d.prob}%</td>
                        <td className="mono tx2" style={{ fontSize: 11 }}>{fmtDate(d.nextFollow)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── RIGHT ── */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Kreditprofil */}
          <div className="card">
            <div className="card-head"><Ic name="finance" size={14} /><span className="title">Kreditprofil</span></div>
            <div className="card-body">
              <div className="kpi" style={{ marginBottom: 8 }}>
                <div>
                  <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase' }}>Kreditlimit</div>
                  <div className="mono fw600" style={{ fontSize: 18 }}>{fmtCur(creditLimit)}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase' }}>Genutzt</div>
                  <div className="mono fw600" style={{ fontSize: 14 }}>{fmtCur(creditUsed)}</div>
                </div>
              </div>
              <div className="progress"><div style={{ width: '32%' }} /></div>
              <div className="sep" />
              <div className="fields">
                <div className="l">Zahlungsziel</div><div className="v">{b.terms}</div>
                <div className="l">Ø Zahlungsdauer</div><div className="v mono">{b.terms || '—'}</div>
                <div className="l">Bonität</div>
                <div className="v">
                  <Badge kind={b.rating >= 4 ? 'success' : b.rating >= 3 ? 'warning' : 'danger'} dot>
                    {b.rating >= 4 ? 'A' : b.rating >= 3 ? 'B' : 'C'}
                  </Badge>
                </div>
                <div className="l">Versicherung</div><div className="v">Allianz Trade · 80% Coverage</div>
                <div className="l">FX-Hedge</div><div className="v">{b.country === 'GB' ? 'GBP Forward 3M' : 'EUR · keiner'}</div>
              </div>
            </div>
          </div>

          {/* Profil */}
          <div className="card">
            <div className="card-head"><Ic name="buyer" size={14} /><span className="title">Profil</span></div>
            <div className="card-body">
              <div className="fields">
                <div className="l">Ansprechpartner</div><div className="v">{b.contact}</div>
                <div className="l">Position</div><div className="v tx2">{b.position}</div>
                <div className="l">E-Mail</div><div className="v mono" style={{ fontSize: 11 }}>{b.email}</div>
                <div className="l">Telefon</div><div className="v mono">{b.phone}</div>
                {b.website && <><div className="l">Website</div><div className="v mono">{b.website}</div></>}
                <div className="l">MOQ</div><div className="v mono">{b.moq}</div>
                <div className="l">Incoterm</div><div className="v mono">{b.incoterm}</div>
              </div>
              <div className="sep" />
              <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Anforderungen</div>
              <div className="row" style={{ gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                {b.certs.map((c, i) => <Badge key={i} kind="ocean">{c}</Badge>)}
              </div>
              <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Produkte von Interesse</div>
              <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                {b.interests.map((p, i) => <Badge key={i} kind="info">{p}</Badge>)}
              </div>
            </div>
          </div>

          {/* AI Insight */}
          <div className="ai-card">
            <div className="head">
              <span className="pill">AI</span>
              <span className="fw600" style={{ fontSize: 12 }}>Käufer-Analyse</span>
            </div>
            <div className="tx2" style={{ fontSize: 11.5, lineHeight: 1.55 }}>
              {b.revenue > 200000 && <span>Top-Kunde mit zuverlässiger Zahlungsmoral. </span>}
              {b.status === 'in Verhandlung' && <span>Aktuelle Verhandlung — Empfehlung: Muster-Versand priorisieren. </span>}
              Reagiert auf <span className="fw500" style={{ color: '#e6eaf2' }}>{b.country === 'DE' ? 'detaillierte technische Specs' : 'Pricing & Lieferzeit'}</span>. Nächste sinnvolle Aktion:{' '}
              <span className="fw500" style={{ color: '#34d399' }}>
                {b.status === 'aktiv' ? `Cross-sell ${b.interests[1] ?? b.interests[0] ?? '—'}` : 'Erstkontakt-Follow-up in 3 Tagen'}
              </span>.
            </div>
          </div>
        </div>
      </div>}

      {commModalOpen && (
        <div className="overlay" onClick={() => setCommModalOpen(false)}>
          <div className="modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <Ic name="mail" size={15} color="#60a5fa" />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Kommunikation erfassen</span>
              <button className="btn ghost" style={{ marginLeft: 'auto', padding: 4 }} onClick={() => setCommModalOpen(false)}>
                <Ic name="x" size={13} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Typ</div>
                  <select style={inputStyle} value={commForm.type} onChange={e => setCommForm(f => ({ ...f, type: e.target.value as typeof commForm.type }))}>
                    <option value="email">E-Mail</option>
                    <option value="call">Anruf</option>
                    <option value="meeting">Meeting</option>
                    <option value="note">Notiz</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Richtung</div>
                  <select style={inputStyle} value={commForm.direction} onChange={e => setCommForm(f => ({ ...f, direction: e.target.value as typeof commForm.direction }))}>
                    <option value="in">Eingehend</option>
                    <option value="out">Ausgehend</option>
                    <option value="internal">Intern</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Datum</div>
                  <input type="date" style={inputStyle} value={commForm.date} onChange={e => setCommForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Autor</div>
                  <input style={inputStyle} value={commForm.author} onChange={e => setCommForm(f => ({ ...f, author: e.target.value }))} />
                </div>
              </div>
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Betreff</div>
                <input style={inputStyle} value={commForm.subject} onChange={e => setCommForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div>
                <div className="tx3" style={{ fontSize: 11, marginBottom: 4 }}>Inhalt</div>
                <textarea rows={4} style={{ ...inputStyle, resize: 'vertical' }} value={commForm.body} onChange={e => setCommForm(f => ({ ...f, body: e.target.value }))} />
              </div>
              {commError && <div style={{ color: '#f87171', fontSize: 12 }}>{commError}</div>}
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setCommModalOpen(false)}>Abbrechen</button>
              <button className="btn primary" onClick={handleSaveComm} disabled={commSaving}>
                {commSaving ? 'Speichern…' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && b && (
        <GenericEditModal
          title="Käufer bearbeiten"
          subtitle={`${b.id}`}
          record={b as unknown as Record<string, unknown>}
          fields={BUYER_FIELDS}
          table="buyers"
          onClose={() => setEditOpen(false)}
        />
      )}

      {deleteOpen && b && (
        <ConfirmDelete
          label={`${b.name} (${b.id})`}
          table="buyers"
          id={b.id}
          onClose={() => setDeleteOpen(false)}
          onDeleted={onBack}
        />
      )}
    </div>
  );
};

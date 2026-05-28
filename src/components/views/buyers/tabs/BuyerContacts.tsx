'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { BuyerContact } from '@/lib/types';
import { DECISION_POWER_MAP, CONTACT_QUALITY_MAP } from '../types';
import { useLang } from '@/lib/lang-context';
import { t } from '@/lib/i18n';

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 12.5,
  padding: '6px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  fontSize: 10.5, color: 'var(--text-3)', marginBottom: 4, display: 'block',
  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
};

// ── Contact modal ──────────────────────────────────────────────────────────────

interface ContactModalProps {
  initial?: Partial<BuyerContact>;
  buyerId: string;
  onSaved: () => void;
  onClose: () => void;
}

const ContactModal = ({ initial, buyerId, onSaved, onClose }: ContactModalProps) => {
  const lang = useLang();
  const [form, setForm] = useState({
    firstName: initial?.firstName ?? '',
    lastName: initial?.lastName ?? '',
    role: initial?.role ?? '',
    department: initial?.department ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    linkedin: initial?.linkedin ?? '',
    language: initial?.language ?? '',
    decisionPower: initial?.decisionPower ?? 'niedrig',
    preferredChannel: initial?.preferredChannel ?? 'email',
    contactQuality: initial?.contactQuality ?? 'unbekannt',
    lastContactedAt: initial?.lastContactedAt ?? '',
    notes: initial?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.lastName.trim()) return;
    setSaving(true);
    try {
      const sb = createClient();
      const payload = {
        buyer_id: buyerId,
        first_name: form.firstName || null,
        last_name: form.lastName,
        role: form.role || null,
        department: form.department || null,
        email: form.email || null,
        phone: form.phone || null,
        linkedin: form.linkedin || null,
        language: form.language || null,
        decision_power: form.decisionPower,
        preferred_channel: form.preferredChannel,
        contact_quality: form.contactQuality,
        last_contacted_at: form.lastContactedAt || null,
        notes: form.notes || null,
      };
      if (initial?.id) {
        await sb.from('buyer_contacts').update(payload).eq('id', initial.id);
      } else {
        await sb.from('buyer_contacts').insert({ ...payload, created_at: new Date().toISOString() });
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--bg-2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{initial?.id ? t(lang, 'contact_edit') : t(lang, 'contact_new')}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>{t(lang, 'first_name')}</label><input style={inputStyle} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Max" /></div>
          <div><label style={labelStyle}>{t(lang, 'last_name')} *</label><input style={inputStyle} value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Mustermann" /></div>
          <div><label style={labelStyle}>{t(lang, 'contact_role')}</label><input style={inputStyle} value={form.role} onChange={e => set('role', e.target.value)} /></div>
          <div><label style={labelStyle}>{t(lang, 'department')}</label><input style={inputStyle} value={form.department} onChange={e => set('department', e.target.value)} /></div>
          <div><label style={labelStyle}>{t(lang, 'email')}</label><input style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} placeholder="name@company.com" /></div>
          <div><label style={labelStyle}>{t(lang, 'phone')}</label><input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+49 ..." /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>LinkedIn</label><input style={inputStyle} value={form.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="linkedin.com/in/..." /></div>
          <div><label style={labelStyle}>{t(lang, 'language')}</label><input style={inputStyle} value={form.language} onChange={e => set('language', e.target.value)} placeholder="de / en" /></div>
          <div><label style={labelStyle}>{t(lang, 'preferred_channel')}</label>
            <select style={inputStyle} value={form.preferredChannel} onChange={e => set('preferredChannel', e.target.value)}>
              {['email','phone','linkedin','whatsapp','persönlich'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>{t(lang, 'decision_power')}</label>
            <select style={inputStyle} value={form.decisionPower} onChange={e => set('decisionPower', e.target.value)}>
              {Object.entries(DECISION_POWER_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>{t(lang, 'contact_quality')}</label>
            <select style={inputStyle} value={form.contactQuality} onChange={e => set('contactQuality', e.target.value)}>
              {Object.entries(CONTACT_QUALITY_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>{t(lang, 'last_contacted')}</label><input type="date" style={inputStyle} value={form.lastContactedAt} onChange={e => set('lastContactedAt', e.target.value)} /></div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>{t(lang, 'notes')}</label>
            <textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '7px 16px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>{t(lang, 'cancel')}</button>
          <button onClick={handleSave} disabled={saving || !form.lastName.trim()}
            style={{ padding: '7px 16px', borderRadius: 6, background: '#60a5fa', border: 'none', color: '#0d0f1a', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
            {saving ? `${t(lang, 'save')}…` : t(lang, 'save')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

interface TabBuyerContactsProps {
  buyerId: string;
  contacts: BuyerContact[];
  onRefresh: () => void;
}

export const TabBuyerContacts = ({ buyerId, contacts, onRefresh }: TabBuyerContactsProps) => {
  const lang = useLang();
  const [modal, setModal] = useState<Partial<BuyerContact> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    await createClient().from('buyer_contacts').delete().eq('id', id);
    onRefresh();
    setDeleteId(null);
  };

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button onClick={() => setModal({})}
          style={{ padding: '6px 14px', borderRadius: 6, background: '#60a5fa', border: 'none', color: '#0d0f1a', cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>
          {t(lang, 'bf_contact_new')}
        </button>
      </div>

      {contacts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: 13 }}>
          {t(lang, 'no_contacts')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {contacts.map(c => {
            const dpInfo = DECISION_POWER_MAP[c.decisionPower] ?? DECISION_POWER_MAP['niedrig'];
            const cqInfo = CONTACT_QUALITY_MAP[c.contactQuality] ?? CONTACT_QUALITY_MAP['unbekannt'];
            return (
              <div key={c.id} style={{
                padding: '14px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)', display: 'grid',
                gridTemplateColumns: '1fr auto', gap: 12,
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 13.5 }}>{[c.firstName, c.lastName].filter(Boolean).join(' ')}</span>
                    {c.role && <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{c.role}{c.department ? ` · ${c.department}` : ''}</span>}
                    <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, color: dpInfo.color, background: `${dpInfo.color}18`, border: `1px solid ${dpInfo.color}30` }}>
                      {dpInfo.label}
                    </span>
                    <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, color: cqInfo.color, background: `${cqInfo.color}18`, border: `1px solid ${cqInfo.color}30` }}>
                      {cqInfo.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {c.email && <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>✉ {c.email}</span>}
                    {c.phone && <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>📞 {c.phone}</span>}
                    {c.linkedin && <span style={{ fontSize: 11.5, color: '#60a5fa' }}>in</span>}
                    {c.lastContactedAt && <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Zuletzt: {c.lastContactedAt}</span>}
                    {c.preferredChannel && <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Bevorzugt: {c.preferredChannel}</span>}
                  </div>
                  {c.notes && <p style={{ fontSize: 11.5, color: 'var(--text-3)', margin: '6px 0 0', fontStyle: 'italic' }}>{c.notes}</p>}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <button onClick={() => setModal(c)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '4px 8px', color: 'var(--text-3)', cursor: 'pointer', fontSize: 11 }}>✏️</button>
                  <button onClick={() => setDeleteId(c.id)} style={{ background: 'none', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 5, padding: '4px 8px', color: '#f87171', cursor: 'pointer', fontSize: 11 }}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal !== null && (
        <ContactModal initial={modal} buyerId={buyerId} onSaved={onRefresh} onClose={() => setModal(null)} />
      )}

      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 24, maxWidth: 340, width: '100%' }}>
            <p style={{ margin: '0 0 18px', fontSize: 14 }}>{t(lang, 'confirm_delete_contact')}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: '7px 14px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>{t(lang, 'cancel')}</button>
              <button onClick={() => handleDelete(deleteId)} style={{ padding: '7px 14px', borderRadius: 6, background: '#f87171', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>{t(lang, 'delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

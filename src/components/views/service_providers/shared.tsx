'use client';

import React, { useState } from 'react';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import type { ProviderMaster } from './types';

// ── Styles ────────────────────────────────────────────────────────────────────
export const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};
export const textareaStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 12.5,
  padding: '8px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
  resize: 'vertical', minHeight: 68, lineHeight: 1.5,
};
export const cellInput: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 4, color: 'var(--text)', fontFamily: 'inherit', fontSize: 12,
  padding: '4px 7px', outline: 'none', width: '100%', boxSizing: 'border-box',
};
export const thStyle: React.CSSProperties = {
  textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text-3)',
  textTransform: 'uppercase' as const, letterSpacing: '0.05em',
  padding: '5px 4px', borderBottom: '1px solid rgba(255,255,255,0.08)',
};
export const labelStyle: React.CSSProperties = {
  fontSize: 11, color: 'var(--text-3)', fontWeight: 500,
  textTransform: 'uppercase' as const, letterSpacing: '0.04em',
};

// ── useSectionSave ────────────────────────────────────────────────────────────
export function useSectionSave(providerId: string, refresh: () => void) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (patch: Partial<ProviderMaster>) => {
    setSaving(true); setError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const { data: existing } = await sb
        .from('service_providers').select('provider_master').eq('id', providerId).single();
      const merged = { ...(existing?.provider_master ?? {}), ...patch };
      const { error: sbErr } = await sb
        .from('service_providers').update({ provider_master: merged }).eq('id', providerId);
      if (sbErr) throw new Error(sbErr.message);
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return { save, saving, error, setError };
}

// ── SectionCard ───────────────────────────────────────────────────────────────
interface SectionCardProps {
  icon: string;
  title: string;
  badge?: string;
  editMode?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  saving?: boolean;
  children: React.ReactNode;
}

export const SectionCard = ({
  icon, title, badge, editMode, onEdit, onSave, onCancel, saving, children,
}: SectionCardProps) => (
  <div className="card">
    <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <Ic name={icon} size={14} color="var(--text-3)" />
      <span style={{ fontWeight: 600, fontSize: 13 }}>{title}</span>
      {badge && <Badge kind="neutral">{badge}</Badge>}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
        {editMode ? (
          <>
            <button className="btn sm ghost" onClick={onCancel} disabled={saving}>Abbrechen</button>
            <button className="btn sm primary" onClick={onSave} disabled={saving}>
              {saving ? 'Speichert…' : 'Speichern'}
            </button>
          </>
        ) : (
          onEdit && <button className="btn sm ghost" onClick={onEdit}><Ic name="edit" size={11} /> Bearbeiten</button>
        )}
      </div>
    </div>
    <div style={{ padding: '14px' }}>{children}</div>
  </div>
);

// ── FormGrid ──────────────────────────────────────────────────────────────────
export const FormGrid = ({ cols = 2, children }: { cols?: number; children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '10px 14px' }}>
    {children}
  </div>
);

// ── FormField ─────────────────────────────────────────────────────────────────
export const FormField = ({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) => (
  <div style={full ? { gridColumn: '1 / -1' } : {}}>
    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 500 }}>{label}</div>
    {children}
  </div>
);

// ── FieldRow ──────────────────────────────────────────────────────────────────
export const FieldRow = ({ label, value }: { label: string; value?: string | null }) => (
  <>
    <div className="l">{label}</div>
    <div className="v" style={{ fontSize: 12.5 }}>{value || '—'}</div>
  </>
);

// ── CheckFlag ─────────────────────────────────────────────────────────────────
interface CheckFlagProps { label: string; value: boolean; onChange?: (v: boolean) => void; editMode?: boolean; }
export const CheckFlag = ({ label, value, onChange, editMode }: CheckFlagProps) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
    {editMode && onChange ? (
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)}
        style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }} />
    ) : (
      <span style={{ color: value ? '#34d399' : 'var(--text-3)', fontSize: 13 }}>{value ? '✓' : '○'}</span>
    )}
    <span style={{ fontSize: 12.5, color: value ? 'var(--text)' : 'var(--text-3)' }}>{label}</span>
  </div>
);

// ── DeleteBtn ─────────────────────────────────────────────────────────────────
export const DeleteBtn = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      background: 'none', border: 'none', cursor: 'pointer',
      color: '#f87171', padding: '2px 4px', borderRadius: 4,
      lineHeight: 1, fontSize: 13,
    }}
    title="Entfernen"
  >×</button>
);

// ── SaveError ─────────────────────────────────────────────────────────────────
export const SaveError = ({ error }: { error: string | null }) =>
  error ? <div style={{ color: '#f87171', fontSize: 11.5, marginTop: 8 }}>⚠ {error}</div> : null;

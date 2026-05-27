'use client';

import React, { useState } from 'react';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import type { ProductMaster } from './types';

// ── Shared styles ──────────────────────────────────────────────────────────────

export const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};
export const cellInput: React.CSSProperties = { ...inputStyle, padding: '5px 7px', fontSize: 12 };
export const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical', minHeight: 72, lineHeight: 1.5,
};
export const labelStyle: React.CSSProperties = {
  fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 500, display: 'block',
};
export const thStyle: React.CSSProperties = {
  padding: '5px 4px', textAlign: 'left' as const, fontSize: 10.5, color: 'var(--text-3)',
  fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em',
};

// ── Shared save hook ──────────────────────────────────────────────────────────

export function useSectionSave(productId: string, refresh: () => void) {
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const save = async (masterPatch: Partial<ProductMaster>, topPatch?: Record<string, unknown>) => {
    setSaving(true); setError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const { data: row } = await sb
        .from('products').select('product_master').eq('id', productId).single();
      const merged = { ...(row?.product_master ?? {}), ...masterPatch };
      const payload: Record<string, unknown> = { product_master: merged, ...(topPatch ?? {}) };
      const { error: sbErr } = await sb.from('products').update(payload).eq('id', productId);
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
  icon?: string;
  title: string;
  badge?: string;
  onEdit?: () => void;
  editMode?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  saving?: boolean;
  children: React.ReactNode;
  empty?: boolean;
  emptyText?: string;
}

export const SectionCard = ({
  icon, title, badge, onEdit, editMode, onSave, onCancel, saving, children, empty, emptyText,
}: SectionCardProps) => (
  <div className="card">
    <div className="card-head">
      {icon && <Ic name={icon} size={14} />}
      <span className="title">{title}</span>
      {badge && <span className="meta">{badge}</span>}
      {!editMode && onEdit && (
        <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={onEdit}>
          <Ic name="edit" size={12} /> Bearbeiten
        </button>
      )}
      {editMode && (
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          <button className="btn sm ghost" onClick={onCancel} disabled={saving}>Abbrechen</button>
          <button className="btn sm primary" onClick={onSave} disabled={saving} style={{ minWidth: 90 }}>
            {saving
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Speichern…
                </span>
              : <><Ic name="check" size={12} /> Speichern</>}
          </button>
        </div>
      )}
    </div>
    <div className="card-body">
      {empty && !editMode
        ? <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '10px 0' }}>
            {emptyText ?? 'Noch nicht gepflegt.'}
            {onEdit && <button className="btn sm ghost" style={{ marginLeft: 8 }} onClick={onEdit}><Ic name="plus" size={11} /> Jetzt pflegen</button>}
          </div>
        : children}
    </div>
  </div>
);

// ── Field display helpers ─────────────────────────────────────────────────────

export const FieldRow = ({ label, value, mono }: { label: string; value?: string | null | boolean; mono?: boolean }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <>
      <div className="l">{label}</div>
      <div className={`v${mono ? ' mono' : ''}`} style={{ fontSize: 12 }}>
        {typeof value === 'boolean' ? (value ? 'Ja' : 'Nein') : value}
      </div>
    </>
  );
};

export const BoolBadge = ({ value, trueLabel = 'Ja', falseLabel = 'Nein' }: { value?: boolean; trueLabel?: string; falseLabel?: string }) => {
  if (value === undefined) return <Badge kind="neutral">—</Badge>;
  return <Badge kind={value ? 'success' : 'neutral'}>{value ? trueLabel : falseLabel}</Badge>;
};

// ── SaveError ─────────────────────────────────────────────────────────────────

export const SaveError = ({ error }: { error: string | null }) =>
  error ? (
    <div style={{ marginTop: 10, padding: '7px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11.5, color: '#f87171' }}>
      {error}
    </div>
  ) : null;

// ── FormField helper ─────────────────────────────────────────────────────────

export const FormField = ({
  label, children, full,
}: { label: string; children: React.ReactNode; full?: boolean }) => (
  <div style={full ? { gridColumn: '1 / -1' } : {}}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
);

export const FormGrid = ({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>
    {children}
  </div>
);

// ── DeleteBtn ─────────────────────────────────────────────────────────────────

export const DeleteBtn = ({ onClick }: { onClick: () => void }) => (
  <button
    className="btn sm ghost"
    onClick={onClick}
    style={{ color: '#f87171', padding: '3px 6px' }}
    title="Entfernen"
  >
    <Ic name="trash" size={12} />
  </button>
);

// ── CheckFlag (compliance row) ────────────────────────────────────────────────

export const CheckFlag = ({
  label, value, onChange, editMode,
}: { label: string; value?: boolean; onChange?: (v: boolean) => void; editMode?: boolean }) => {
  const color = value ? '#f87171' : '#34d399';
  if (editMode) {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer', fontSize: 13 }}>
        <input
          type="checkbox"
          checked={!!value}
          onChange={e => onChange?.(e.target.checked)}
          style={{ accentColor: '#60a5fa', width: 15, height: 15 }}
        />
        {label}
      </label>
    );
  }
  return (
    <div className="row" style={{ padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: 8 }}>
      <span style={{ fontSize: 12.5 }}>{label}</span>
      <span style={{ marginLeft: 'auto', fontSize: 12, color, fontWeight: 600 }}>
        {value ? 'Relevant' : 'Nicht relevant'}
      </span>
    </div>
  );
};

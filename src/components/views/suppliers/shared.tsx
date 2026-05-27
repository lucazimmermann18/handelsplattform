'use client';

import React, { useState } from 'react';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';
import type { SupplierMaster } from './types';

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
export function useSectionSave(supplierId: string, refresh: () => void) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (patch: Partial<SupplierMaster>) => {
    setSaving(true); setError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const { data: existing } = await sb
        .from('suppliers').select('supplier_master').eq('id', supplierId).single();
      const merged = { ...(existing?.supplier_master ?? {}), ...patch };
      const { error: sbErr } = await sb
        .from('suppliers').update({ supplier_master: merged }).eq('id', supplierId);
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
  empty?: boolean;
  emptyText?: string;
  children: React.ReactNode;
}

export const SectionCard = ({
  icon, title, badge, editMode, onEdit, onSave, onCancel, saving, empty, emptyText, children,
}: SectionCardProps) => (
  <div className="card">
    <div className="card-head">
      <Ic name={icon} size={14} />
      <span className="title">{title}</span>
      {badge && <span className="meta">{badge}</span>}
      {(onEdit || onSave) && (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {editMode ? (
            <>
              <button className="btn sm primary" onClick={onSave} disabled={saving}>
                {saving ? 'Speichern…' : <><Ic name="check" size={11} /> Speichern</>}
              </button>
              <button className="btn sm ghost" onClick={onCancel}>Abbrechen</button>
            </>
          ) : (
            <button className="btn sm ghost" onClick={onEdit}>
              <Ic name="edit" size={11} /> Bearbeiten
            </button>
          )}
        </div>
      )}
    </div>
    <div className="card-body">
      {empty && !editMode ? (
        <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
          {emptyText ?? 'Noch keine Daten gepflegt.'}
        </div>
      ) : children}
    </div>
  </div>
);

// ── FormGrid & FormField ──────────────────────────────────────────────────────
export const FormGrid = ({ cols = 2, children }: { cols?: number; children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '10px 14px' }}>
    {children}
  </div>
);

export const FormField = ({
  label, full, children,
}: { label: string; full?: boolean; children: React.ReactNode }) => (
  <div style={full ? { gridColumn: '1 / -1' } : undefined}>
    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 500 }}>{label}</div>
    {children}
  </div>
);

// ── FieldRow ──────────────────────────────────────────────────────────────────
export const FieldRow = ({ label, value }: { label: string; value?: string | number | null }) =>
  value ? (
    <>
      <div className="l">{label}</div>
      <div className="v">{value}</div>
    </>
  ) : null;

// ── BoolBadge ─────────────────────────────────────────────────────────────────
export const BoolBadge = ({
  value, trueLabel = 'Ja', falseLabel = 'Nein',
}: { value?: boolean; trueLabel?: string; falseLabel?: string }) =>
  value === undefined ? (
    <span style={{ color: 'var(--text-3)' }}>—</span>
  ) : value ? (
    <Badge kind="success">{trueLabel}</Badge>
  ) : (
    <Badge kind="neutral">{falseLabel}</Badge>
  );

// ── CheckFlag ─────────────────────────────────────────────────────────────────
export const CheckFlag = ({
  label, value, onChange, editMode,
}: { label: string; value: boolean; onChange: (v: boolean) => void; editMode: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    {editMode ? (
      <input
        type="checkbox"
        checked={value}
        onChange={e => onChange(e.target.checked)}
        style={{ accentColor: '#60a5fa', width: 14, height: 14 }}
      />
    ) : (
      <div style={{
        width: 14, height: 14, borderRadius: 3,
        background: value ? '#34d399' : 'rgba(255,255,255,0.08)',
        border: `1px solid ${value ? '#34d399' : 'rgba(255,255,255,0.15)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {value && <Ic name="check" size={9} color="white" />}
      </div>
    )}
    <span style={{ fontSize: 12.5, color: value ? 'var(--text)' : 'var(--text-3)' }}>{label}</span>
  </div>
);

// ── DeleteBtn ─────────────────────────────────────────────────────────────────
export const DeleteBtn = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: 4 }}
  >
    <Ic name="trash" size={12} />
  </button>
);

// ── SaveError ─────────────────────────────────────────────────────────────────
export const SaveError = ({ error }: { error: string | null }) =>
  error ? (
    <div style={{
      marginTop: 8, padding: '7px 10px', borderRadius: 6,
      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
      fontSize: 12, color: '#f87171',
    }}>
      {error}
    </div>
  ) : null;

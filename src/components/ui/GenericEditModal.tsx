'use client';

import React, { useState } from 'react';
import { Ic } from '@/components/ui/icons';
import { useUpdate } from '@/lib/use-entity-action';

// ── Field definitions ─────────────────────────────────────────────────────────

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'toggle' | 'date' | 'chips';

export interface FieldDef {
  key:          string;
  label:        string;
  type:         FieldType;
  placeholder?: string;
  required?:    boolean;
  options?:     { value: string; label: string }[];
  /** DB column name if different from key (snake_case) */
  dbKey?:       string;
  /** Column span in the 2-column grid (default 1) */
  span?:        1 | 2;
  /** Convert form value → DB value before saving */
  toDb?:        (v: string | number | boolean) => unknown;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface GenericEditModalProps {
  title:       string;
  subtitle?:   string;
  record:      Record<string, unknown>;
  fields:      FieldDef[];
  table:       string;
  onClose:     () => void;
  onSaved?:    () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const GenericEditModal = ({
  title, subtitle, record, fields, table, onClose, onSaved,
}: GenericEditModalProps) => {
  const { updateItem, updating, error } = useUpdate(table);

  // Initialise form from record, coercing to string for controlled inputs
  const [form, setForm] = useState<Record<string, string | number | boolean>>(() => {
    const init: Record<string, string | number | boolean> = {};
    for (const f of fields) {
      const raw = record[f.key];
      if (f.type === 'toggle')   init[f.key] = !!raw;
      else if (f.type === 'chips') init[f.key] = Array.isArray(raw) ? (raw as string[]).join(', ') : String(raw ?? '');
      else if (f.type === 'number') init[f.key] = typeof raw === 'number' ? raw : Number(raw) || 0;
      else init[f.key] = raw !== null && raw !== undefined ? String(raw) : '';
    }
    return init;
  });

  const set = (key: string, val: string | number | boolean) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    const required = fields.filter(f => f.required && !form[f.key]);
    if (required.length) return;

    const data: Record<string, unknown> = {};
    for (const f of fields) {
      const dbKey = f.dbKey ?? f.key;
      const val   = form[f.key];
      if (f.toDb)           data[dbKey] = f.toDb(val);
      else if (f.type === 'chips') data[dbKey] = String(val).split(',').map(s => s.trim()).filter(Boolean);
      else if (f.type === 'number') data[dbKey] = Number(val) || 0;
      else if (f.type === 'toggle') data[dbKey] = !!val;
      else data[dbKey] = val;
    }

    updateItem(String(record.id), data, () => {
      onSaved?.();
      onClose();
    });
  };

  // ── Render one field ───────────────────────────────────────────────────────

  const renderField = (f: FieldDef) => {
    const val = form[f.key];

    if (f.type === 'toggle') {
      return (
        <span
          className={`chip${val ? ' on' : ''}`}
          onClick={() => set(f.key, !val)}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          {val ? 'Ja' : 'Nein'}
        </span>
      );
    }

    if (f.type === 'select' && f.options) {
      return (
        <select
          value={String(val)}
          onChange={e => set(f.key, e.target.value)}
          style={{ ...inputStyle, appearance: 'none' }}
        >
          {f.options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    }

    if (f.type === 'textarea') {
      return (
        <textarea
          value={String(val)}
          onChange={e => set(f.key, e.target.value)}
          placeholder={f.placeholder}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
        />
      );
    }

    return (
      <input
        type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
        value={f.type === 'number' ? (Number(val) || '') : String(val)}
        onChange={e => set(f.key, f.type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value)}
        placeholder={f.placeholder}
        style={{ ...inputStyle, borderColor: f.required && !form[f.key] ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.1)' }}
      />
    );
  };

  // ── Layout ─────────────────────────────────────────────────────────────────

  return (
    <div className="overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '5vh' }}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ width: '92vw', maxWidth: 520, maxHeight: '88vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
      >
        {/* Header */}
        <div className="modal-head">
          <Ic name="edit" size={14} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 1 }}>{subtitle}</div>}
          </div>
          <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={onClose}>
            <Ic name="x" size={13} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {fields.map(f => (
              <div key={f.key} style={{ gridColumn: f.span === 2 ? '1 / -1' : undefined }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>
                  {f.label}{f.required && ' *'}
                  {f.type === 'chips' && <span style={{ fontWeight: 400 }}> (kommagetrennt)</span>}
                </div>
                {renderField(f)}
              </div>
            ))}
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11.5, color: '#f87171' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose} disabled={updating}>Abbrechen</button>
          <div style={{ flex: 1 }} />
          <button className="btn primary" onClick={handleSave} disabled={updating} style={{ minWidth: 110 }}>
            {updating
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

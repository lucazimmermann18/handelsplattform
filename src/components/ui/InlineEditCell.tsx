'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useData } from '@/lib/data-context';

interface SelectOption {
  value: string;
  label: string;
}

interface InlineEditCellProps {
  table: string;
  id: string;
  column: string;
  value: string | number;
  type?: 'text' | 'number' | 'select';
  options?: SelectOption[];
  renderValue?: (v: string | number) => React.ReactNode;
  min?: number;
  max?: number;
}

export function InlineEditCell({
  table,
  id,
  column,
  value,
  type = 'text',
  options = [],
  renderValue,
  min,
  max,
}: InlineEditCellProps) {
  const { refresh } = useData();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  // Reset draft and focus only when entering edit mode, not on every value change
  useEffect(() => {
    if (editing) {
      setDraft(String(value));
      setTimeout(() => inputRef.current?.focus(), 20);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const save = async () => {
    if (!isSupabaseConfigured()) { setEditing(false); return; }
    const newVal = type === 'number' ? Number(draft) : draft;
    if (newVal === value) { setEditing(false); return; }
    setSaving(true);
    setError(false);
    try {
      const sb = createClient();
      const { error: err } = await sb.from(table).update({ [column]: newVal }).eq('id', id);
      if (err) throw err;
      refresh();
      setEditing(false);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setEditing(false);
    setDraft(String(value));
    setError(false);
  };

  if (!editing) {
    return (
      <span
        className="inline-edit-wrap"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'default' }}
      >
        {renderValue ? renderValue(value) : <span>{value}</span>}
        <span
          className="inline-edit-trigger"
          onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          title="Bearbeiten"
          style={{
            opacity: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
            padding: '1px 3px', borderRadius: 3,
            background: 'rgba(96,165,250,0.12)', transition: 'opacity 0.15s',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9.5 2.5 11.5 4.5 5 11 2 12l1-3 6.5-6.5z" />
          </svg>
        </span>
      </span>
    );
  }

  const baseStyle: React.CSSProperties = {
    padding: '2px 6px', borderRadius: 4, fontSize: 12, fontFamily: 'inherit',
    background: 'var(--bg)', color: 'var(--text)',
    border: `1px solid ${error ? '#ef4444' : 'rgba(96,165,250,0.5)'}`,
    outline: 'none', minWidth: 0,
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  };

  if (type === 'select') {
    return (
      <span onClick={e => e.stopPropagation()}>
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          disabled={saving}
          style={{ ...baseStyle, cursor: 'pointer' }}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {saving && <Spinner />}
      </span>
    );
  }

  return (
    <span onClick={e => e.stopPropagation()}>
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={type}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        disabled={saving}
        min={min}
        max={max}
        style={{ ...baseStyle, width: type === 'number' ? 60 : 140 }}
      />
      {saving && <Spinner />}
    </span>
  );
}

function Spinner() {
  return (
    <span style={{ display: 'inline-block', marginLeft: 4, verticalAlign: 'middle' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    </span>
  );
}

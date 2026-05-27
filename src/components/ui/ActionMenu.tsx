'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Ic } from '@/components/ui/icons';

interface ActionMenuProps {
  onEdit:        () => void;
  onDelete:      () => void;
  editLabel?:    string;
  deleteLabel?:  string;
  disabled?:     boolean;
}

export const ActionMenu = ({
  onEdit,
  onDelete,
  editLabel   = 'Bearbeiten',
  deleteLabel = 'Löschen',
  disabled    = false,
}: ActionMenuProps) => {
  const [open, setOpen]  = useState(false);
  const ref              = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="btn sm ghost"
        style={{ padding: '3px 6px' }}
        disabled={disabled}
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
      >
        <Ic name="more" size={13} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', zIndex: 200,
          background: 'var(--surface-1)', border: '1px solid var(--border)',
          borderRadius: 7, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          minWidth: 140, padding: 4, marginTop: 3,
        }}>
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '7px 10px', background: 'none', border: 'none',
              borderRadius: 5, cursor: 'pointer', fontSize: 12.5, color: 'var(--text)',
              textAlign: 'left',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            onClick={e => { e.stopPropagation(); setOpen(false); onEdit(); }}
          >
            <Ic name="edit" size={13} /> {editLabel}
          </button>
          <div style={{ height: 1, background: 'var(--border)', margin: '2px 4px' }} />
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '7px 10px', background: 'none', border: 'none',
              borderRadius: 5, cursor: 'pointer', fontSize: 12.5, color: '#f87171',
              textAlign: 'left',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            onClick={e => { e.stopPropagation(); setOpen(false); onDelete(); }}
          >
            <Ic name="trash" size={13} /> {deleteLabel}
          </button>
        </div>
      )}
    </div>
  );
};

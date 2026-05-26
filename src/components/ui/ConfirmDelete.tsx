'use client';

import React from 'react';
import { Ic } from '@/components/ui/icons';
import { useDelete } from '@/lib/use-entity-action';

interface ConfirmDeleteProps {
  /** Human-readable label shown in the dialog, e.g. "Käufer 'Müller GmbH' (BUY-001)" */
  label:      string;
  table:      string;
  id:         string;
  onClose:    () => void;
  onDeleted?: () => void;
}

export const ConfirmDelete = ({ label, table, id, onClose, onDeleted }: ConfirmDeleteProps) => {
  const { deleteItem, deleting, error } = useDelete(table);

  const handleConfirm = () => {
    deleteItem(id, () => {
      onDeleted?.();
      onClose();
    });
  };

  return (
    <div className="overlay" onClick={onClose} style={{ alignItems: 'center' }}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ width: '92vw', maxWidth: 400, padding: 0, overflow: 'hidden' }}
      >
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(239,68,68,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Ic name="trash" size={15} color="#f87171" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>Löschen bestätigen</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Kann nicht rückgängig gemacht werden</div>
          </div>
          <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={onClose}>
            <Ic name="x" size={13} />
          </button>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            <span style={{ color: 'var(--text-3)' }}>Soll </span>
            <strong>{label}</strong>
            <span style={{ color: 'var(--text-3)' }}> dauerhaft gelöscht werden?</span>
          </p>
          {error && (
            <div style={{
              marginTop: 10, padding: '7px 10px', borderRadius: 6,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              fontSize: 11.5, color: '#f87171',
            }}>
              {error}
            </div>
          )}
        </div>

        <div style={{
          padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', gap: 8, justifyContent: 'flex-end',
        }}>
          <button className="btn ghost" onClick={onClose} disabled={deleting}>Abbrechen</button>
          <button
            className="btn"
            style={{ background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171', minWidth: 100 }}
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 11, height: 11, border: '1.5px solid rgba(248,113,113,0.3)', borderTopColor: '#f87171', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Löschen…
                </span>
              : <><Ic name="trash" size={12} /> Ja, löschen</>
            }
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

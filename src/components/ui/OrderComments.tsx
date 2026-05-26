'use client';

import React, { useState, useEffect } from 'react';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

interface Comment {
  id: string;
  order_id: string;
  author: string;
  content: string;
  type: string;
  created_at: string;
}

const TYPE_ICON: Record<string, string> = {
  note: 'doc', email: 'mail', call: 'phone',
};
const TYPE_LABEL: Record<string, string> = {
  note: 'Notiz', email: 'E-Mail', call: 'Anruf',
};
const TYPE_KIND: Record<string, string> = {
  note: 'neutral', email: 'info', call: 'success',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

interface OrderCommentsProps {
  orderId: string;
}

export const OrderComments = ({ orderId }: OrderCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'note' | 'email' | 'call'>('note');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/comments`);
      if (res.ok) setComments(await res.json());
    } catch (_e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: 'Admin', content: newContent, type: newType }),
      });
      if (res.ok) {
        setNewContent('');
        await load();
      }
    } catch (_e) {}
    setSaving(false);
  };

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      {/* Timeline */}
      {loading ? (
        <div className="tx3" style={{ fontSize: 12, padding: '8px 0' }}>Lädt…</div>
      ) : comments.length === 0 ? (
        <div className="tx3" style={{ fontSize: 12, padding: '8px 0' }}>Noch keine Kommunikation erfasst.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ic name={TYPE_ICON[c.type] ?? 'doc'} size={12} color="#5d667d" />
              </div>
              <div style={{ flex: 1 }}>
                <div className="row" style={{ gap: 8, marginBottom: 3 }}>
                  <span className="fw500" style={{ fontSize: 12 }}>{c.author}</span>
                  <Badge kind={TYPE_KIND[c.type] ?? 'neutral'}>{TYPE_LABEL[c.type] ?? c.type}</Badge>
                  <span className="tx3 mono" style={{ fontSize: 10, marginLeft: 'auto' }}>{fmtTime(c.created_at)}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{c.content}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <div className="row" style={{ gap: 6, marginBottom: 8 }}>
          {(['note', 'email', 'call'] as const).map(tp => (
            <span key={tp} className={`chip${newType === tp ? ' on' : ''}`} onClick={() => setNewType(tp)} style={{ cursor: 'pointer', fontSize: 11 }}>
              {TYPE_LABEL[tp]}
            </span>
          ))}
        </div>
        <textarea
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          placeholder="Neue Notiz, E-Mail oder Anruf erfassen…"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            className="btn primary sm"
            onClick={handleAdd}
            disabled={saving || !newContent.trim()}
          >
            {saving ? 'Speichern…' : <><Ic name="plus" size={12} /> Hinzufügen</>}
          </button>
        </div>
      </div>
    </div>
  );
};

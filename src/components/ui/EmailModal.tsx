'use client';

import React, { useState } from 'react';
import { Ic } from '@/components/ui/icons';
import { useAuth } from '@/lib/auth-context';

export interface EmailModalData {
  type: 'offer' | 'order_confirmation' | 'alert';
  to: string;
  subject: string;
  recipientName: string;
  data: Record<string, unknown>;
}

interface EmailModalProps {
  initial: EmailModalData;
  onClose: () => void;
}

function getDisplayName(email?: string, name?: string): string {
  if (name) return name;
  if (email) {
    const local = email.split('@')[0];
    return local.split(/[._-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return '';
}

export function EmailModal({ initial, onClose }: EmailModalProps) {
  const { user } = useAuth();
  const senderEmail = user?.email ?? '';
  const senderName = getDisplayName(senderEmail, user?.user_metadata?.full_name as string | undefined);

  const [to, setTo] = useState(initial.to);
  const [subject, setSubject] = useState(initial.subject);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!to || !subject) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: initial.type,
          to,
          subject,
          senderEmail,
          senderName,
          data: { ...initial.data, recipientName: to, senderName },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Sendefehler');
      } else {
        setSent(true);
        setTimeout(onClose, 1800);
      }
    } catch {
      setError('Netzwerkfehler. Bitte erneut versuchen.');
    } finally {
      setSending(false);
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 10px', boxSizing: 'border-box',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 5, color: 'var(--text)', fontSize: 13,
    fontFamily: 'inherit', outline: 'none',
  };

  const TYPE_LABEL = { offer: 'Angebot', order_confirmation: 'Auftragsbestätigung', alert: 'Alert' };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width: 500, padding: 0, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        {/* Header */}
        <div className="card-head" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13 }}>✉</span>
          <span className="title">E-Mail senden · {TYPE_LABEL[initial.type]}</span>
          <div className="spacer" />
          <button className="iconbtn" onClick={onClose}><Ic name="x" size={14} /></button>
        </div>

        {sent ? (
          <div style={{ padding: 36, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <div className="fw600" style={{ fontSize: 15, color: '#34d399' }}>E-Mail versendet</div>
            <div className="tx3" style={{ fontSize: 12, marginTop: 4 }}>An: {to}</div>
            {senderEmail && (
              <div className="tx3" style={{ fontSize: 11, marginTop: 2 }}>Antworten gehen an: {senderEmail}</div>
            )}
          </div>
        ) : (
          <div style={{ padding: '18px 18px 20px' }}>
            {/* Sender row */}
            {senderEmail && (
              <div style={{ marginBottom: 12, padding: '8px 10px', background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {senderName ? senderName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600 }}>{senderName || senderEmail}</div>
                  <div className="tx3" style={{ fontSize: 10.5 }}>Absender · Antworten gehen direkt an {senderEmail}</div>
                </div>
                <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 3, background: 'rgba(96,165,250,0.15)', color: '#60a5fa', fontWeight: 600 }}>REPLY-TO</span>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label className="tx3" style={{ fontSize: 10.5, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>An</label>
              <input type="email" value={to} onChange={(e) => setTo(e.target.value)} style={inp} placeholder="empfaenger@firma.com" />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="tx3" style={{ fontSize: 10.5, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Betreff</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} style={inp} />
            </div>

            <div style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: 5, border: '1px solid var(--border)', marginBottom: 16 }}>
              <div className="tx3" style={{ fontSize: 10.5, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vorlage</div>
              <div className="tx2" style={{ fontSize: 12, lineHeight: 1.5 }}>
                Professionelle E-Mail-Vorlage ({TYPE_LABEL[initial.type]}) mit allen relevanten
                Auftragsdaten wird automatisch befüllt und im EastAfrica Export OS Branding versendet.
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: 12, padding: '8px 10px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 5, fontSize: 12, color: '#f87171' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={onClose}>Abbrechen</button>
              <button
                className="btn primary"
                onClick={handleSend}
                disabled={sending || !to}
                style={{ opacity: sending ? 0.6 : 1 }}
              >
                <Ic name="upload" size={12} />
                {sending ? 'Wird gesendet…' : 'Jetzt senden'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

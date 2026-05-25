import React from 'react';

type AlertKind = 'cold_chain' | 'eudr' | 'payment' | 'quality' | 'general';

interface AlertEmailProps {
  kind: AlertKind;
  recipientName: string;
  title: string;
  body: string;
  orderId?: string;
  actionLabel?: string;
  actionUrl?: string;
  senderName: string;
}

const KIND_COLOR: Record<AlertKind, string> = {
  cold_chain: '#fbbf24',
  eudr: '#34d399',
  payment: '#f87171',
  quality: '#60a5fa',
  general: '#818cf8',
};

const KIND_LABEL: Record<AlertKind, string> = {
  cold_chain: 'Cold Chain Alert',
  eudr: 'EUDR Compliance',
  payment: 'Zahlungsalert',
  quality: 'Qualitätshinweis',
  general: 'Systembenachrichtigung',
};

export function AlertEmail({ kind, recipientName, title, body, orderId, actionLabel, actionUrl, senderName }: AlertEmailProps) {
  const color = KIND_COLOR[kind];
  const label = KIND_LABEL[kind];

  const s = {
    body: { fontFamily: 'Helvetica Neue, Arial, sans-serif', background: '#f0f2f5', margin: 0, padding: '32px 0' },
    wrap: { maxWidth: 560, margin: '0 auto', background: '#ffffff', borderRadius: 8, overflow: 'hidden' as const },
    header: { background: '#0d0f1a', padding: '20px 28px', borderBottom: `3px solid ${color}` },
    badge: { display: 'inline-block', background: `${color}22`, color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: '0.04em' },
    alert: { margin: '24px 28px', padding: '16px 18px', background: `${color}10`, border: `1px solid ${color}33`, borderRadius: 7 },
    footer: { background: '#f7f8fa', padding: '16px 28px', borderTop: '1px solid #e5e7eb', fontSize: 11, color: '#8892a4' },
  };

  return (
    <html>
      <body style={s.body}>
        <div style={s.wrap}>
          <div style={s.header}>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>
              EastAfrica Export OS
            </div>
            <div style={s.badge}>{label}</div>
          </div>

          <div style={{ padding: '24px 28px 8px' }}>
            <p style={{ fontSize: 14, color: '#1a1a2e', marginBottom: 4 }}>
              Hallo {recipientName},
            </p>
          </div>

          <div style={s.alert}>
            <div style={{ fontSize: 15, fontWeight: 700, color, marginBottom: 8 }}>{title}</div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{body}</div>
            {orderId && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>
                Auftrag: {orderId}
              </div>
            )}
          </div>

          {actionLabel && (
            <div style={{ padding: '8px 28px 24px' }}>
              <a
                href={actionUrl || '#'}
                style={{
                  display: 'inline-block', background: color, color: '#fff', textDecoration: 'none',
                  padding: '10px 20px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                }}
              >
                {actionLabel} →
              </a>
            </div>
          )}

          <div style={{ padding: '0 28px 20px' }}>
            <p style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.6 }}>
              Mit freundlichen Grüßen,<br />
              <strong>{senderName}</strong> · EastAfrica Export OS
            </p>
          </div>

          <div style={s.footer}>
            Diese Nachricht wurde automatisch von EastAfrica Export OS generiert.
          </div>
        </div>
      </body>
    </html>
  );
}

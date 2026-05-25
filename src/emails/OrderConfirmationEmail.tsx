import React from 'react';

interface OrderConfirmationEmailProps {
  recipientName: string;
  recipientCompany?: string;
  orderId: string;
  product: string;
  quantity: string;
  unit: string;
  value: string;
  currency: string;
  etd: string;
  eta: string;
  portLoad: string;
  portDest: string;
  paymentTerms?: string;
  incoterms?: string;
  senderName: string;
}

export function OrderConfirmationEmail({
  recipientName, recipientCompany, orderId, product, quantity, unit, value, currency,
  etd, eta, portLoad, portDest, paymentTerms = 'L/C at sight', incoterms = 'CIF',
  senderName,
}: OrderConfirmationEmailProps) {
  const s = {
    body: { fontFamily: 'Helvetica Neue, Arial, sans-serif', background: '#f0f2f5', margin: 0, padding: '32px 0' },
    wrap: { maxWidth: 600, margin: '0 auto', background: '#ffffff', borderRadius: 8, overflow: 'hidden' as const },
    header: { background: '#0d0f1a', padding: '28px 32px', borderBottom: '3px solid #34d399' },
    badge: { display: 'inline-block', background: 'rgba(52,211,153,0.15)', color: '#34d399', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, marginTop: 8 },
    body2: { padding: '28px 32px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: '#f7f8fa', borderRadius: 6, padding: '16px 18px', marginBottom: 24 },
    label: { fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#8892a4', marginBottom: 3 },
    value: { fontSize: 13, color: '#1a1a2e', fontWeight: 600 },
    sep: { borderTop: '1px solid #e5e7eb', margin: '20px 0' },
    footer: { background: '#f7f8fa', padding: '18px 32px', borderTop: '1px solid #e5e7eb', fontSize: 11, color: '#8892a4', lineHeight: 1.6 },
  };

  return (
    <html>
      <body style={s.body}>
        <div style={s.wrap}>
          <div style={s.header}>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>
              EastAfrica Export OS
            </div>
            <div style={{ color: '#8892a4', fontSize: 12, marginTop: 4 }}>Auftragsbestätigung · {orderId}</div>
            <div style={s.badge}>✓ Bestätigt</div>
          </div>

          <div style={s.body2}>
            <p style={{ fontSize: 15, color: '#1a1a2e', marginBottom: 20, lineHeight: 1.5 }}>
              Sehr geehrte/r {recipientName}{recipientCompany ? ` von ${recipientCompany}` : ''},<br /><br />
              wir bestätigen hiermit Ihren Auftrag. Alle Details entnehmen Sie bitte den folgenden Informationen.
            </p>

            <div style={s.grid}>
              <div>
                <div style={s.label}>Auftrags-Nr.</div>
                <div style={s.value}>{orderId}</div>
              </div>
              <div>
                <div style={s.label}>Produkt</div>
                <div style={s.value}>{product}</div>
              </div>
              <div>
                <div style={s.label}>Menge</div>
                <div style={s.value}>{quantity} {unit}</div>
              </div>
              <div>
                <div style={s.label}>Auftragswert</div>
                <div style={{ fontSize: 15, color: '#6366f1', fontWeight: 700 }}>{value} {currency}</div>
              </div>
              <div>
                <div style={s.label}>Zahlungsbedingung</div>
                <div style={s.value}>{paymentTerms}</div>
              </div>
              <div>
                <div style={s.label}>Incoterms</div>
                <div style={s.value}>{incoterms}</div>
              </div>
            </div>

            <div style={{ ...s.grid, gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
              <div>
                <div style={s.label}>Verladehafen</div>
                <div style={s.value}>{portLoad}</div>
              </div>
              <div>
                <div style={s.label}>Bestimmungshafen</div>
                <div style={s.value}>{portDest}</div>
              </div>
              <div>
                <div style={s.label}>ETD</div>
                <div style={s.value}>{etd}</div>
              </div>
              <div>
                <div style={s.label}>ETA</div>
                <div style={s.value}>{eta}</div>
              </div>
            </div>

            <div style={s.sep} />

            <p style={{ fontSize: 12.5, color: '#4b5563', lineHeight: 1.6 }}>
              Alle Dokumente (Handelsrechnung, Packungsliste, B/L, Ursprungszeugnis, Phytosanitäres Zertifikat)
              werden Ihnen spätestens 3 Werktage nach ETD per DHL Express zugestellt bzw. digital über das Portal bereitgestellt.
            </p>

            <p style={{ fontSize: 12.5, color: '#4b5563', lineHeight: 1.6 }}>
              Mit freundlichen Grüßen,<br />
              <strong>{senderName}</strong><br />
              EastAfrica Export OS
            </p>
          </div>

          <div style={s.footer}>
            EUDR-Sorgfaltserklärungen (DDS) sind für alle betroffenen Produkte hinterlegt und auf Anfrage abrufbar.
            Bei Fragen zu diesem Auftrag stehen wir Ihnen jederzeit zur Verfügung.
          </div>
        </div>
      </body>
    </html>
  );
}

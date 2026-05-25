import React from 'react';

interface OfferEmailProps {
  buyerName: string;
  buyerCompany?: string;
  offerRef: string;
  validUntil: string;
  products: { name: string; qty: string; unit: string; price: string; total: string }[];
  totalValue: string;
  currency: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  senderName: string;
  senderRole?: string;
  notes?: string;
}

export function OfferEmail({
  buyerName, buyerCompany, offerRef, validUntil, products, totalValue, currency,
  paymentTerms = 'L/C at sight', deliveryTerms = 'CIF Rotterdam',
  senderName, senderRole = 'Sales', notes,
}: OfferEmailProps) {
  const s = {
    body: { fontFamily: 'Helvetica Neue, Arial, sans-serif', background: '#f0f2f5', margin: 0, padding: '32px 0' },
    wrap: { maxWidth: 600, margin: '0 auto', background: '#ffffff', borderRadius: 8, overflow: 'hidden' as const },
    header: { background: '#0d0f1a', padding: '28px 32px', borderBottom: '3px solid #6366f1' },
    logo: { color: '#fff', fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px', margin: 0 },
    sub: { color: '#8892a4', fontSize: 12, marginTop: 4 },
    body2: { padding: '28px 32px' },
    greeting: { fontSize: 15, color: '#1a1a2e', marginBottom: 20, lineHeight: 1.5 },
    label: { fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#8892a4', marginBottom: 4 },
    value: { fontSize: 13, color: '#1a1a2e', fontWeight: 600 },
    meta: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, background: '#f7f8fa', borderRadius: 6, padding: '16px 18px', marginBottom: 24 },
    table: { width: '100%', borderCollapse: 'collapse' as const, marginBottom: 20 },
    th: { fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#8892a4', padding: '8px 10px', borderBottom: '1px solid #e5e7eb', textAlign: 'left' as const },
    td: { fontSize: 13, color: '#1a1a2e', padding: '10px 10px', borderBottom: '1px solid #f0f2f5' },
    tdRight: { fontSize: 13, color: '#1a1a2e', padding: '10px 10px', borderBottom: '1px solid #f0f2f5', textAlign: 'right' as const },
    total: { textAlign: 'right' as const, marginBottom: 24 },
    totalLabel: { fontSize: 12, color: '#8892a4' },
    totalValue: { fontSize: 22, fontWeight: 700, color: '#6366f1', letterSpacing: '-0.5px' },
    note: { background: '#fffbf0', border: '1px solid #fde68a', borderRadius: 6, padding: '12px 16px', marginBottom: 20, fontSize: 12.5, color: '#92400e', lineHeight: 1.5 },
    footer: { background: '#f7f8fa', padding: '18px 32px', borderTop: '1px solid #e5e7eb', fontSize: 11, color: '#8892a4', lineHeight: 1.6 },
    cta: { display: 'block', background: '#6366f1', color: '#fff', textDecoration: 'none', padding: '12px 24px', borderRadius: 6, fontSize: 13, fontWeight: 600, textAlign: 'center' as const, marginBottom: 20 },
  };

  return (
    <html>
      <body style={s.body}>
        <div style={s.wrap}>
          {/* Header */}
          <div style={s.header}>
            <div style={s.logo}>EastAfrica Export OS</div>
            <div style={s.sub}>Angebot / Quotation · {offerRef}</div>
          </div>

          {/* Body */}
          <div style={s.body2}>
            <p style={s.greeting}>
              Sehr geehrte/r {buyerName}{buyerCompany ? ` von ${buyerCompany}` : ''},<br /><br />
              wir freuen uns, Ihnen folgendes Angebot zu unterbreiten. Bitte prüfen Sie die Details und nehmen Sie bei Rückfragen gerne Kontakt mit uns auf.
            </p>

            {/* Offer meta */}
            <div style={s.meta}>
              <div>
                <div style={s.label}>Angebot-Nr.</div>
                <div style={s.value}>{offerRef}</div>
              </div>
              <div>
                <div style={s.label}>Gültig bis</div>
                <div style={s.value}>{validUntil}</div>
              </div>
              <div>
                <div style={s.label}>Währung</div>
                <div style={s.value}>{currency}</div>
              </div>
              <div>
                <div style={s.label}>Zahlungsbedingung</div>
                <div style={s.value}>{paymentTerms}</div>
              </div>
              <div>
                <div style={s.label}>Lieferbedingung</div>
                <div style={s.value}>{deliveryTerms}</div>
              </div>
            </div>

            {/* Product table */}
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Produkt</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>Menge</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>Einheit</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>Preis/{'{'}unit{'}'}</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>Gesamt</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={i}>
                    <td style={s.td}>{p.name}</td>
                    <td style={s.tdRight}>{p.qty}</td>
                    <td style={s.tdRight}>{p.unit}</td>
                    <td style={s.tdRight}>{p.price}</td>
                    <td style={s.tdRight}>{p.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total */}
            <div style={s.total}>
              <div style={s.totalLabel}>Gesamtbetrag inkl. {deliveryTerms}</div>
              <div style={s.totalValue}>{totalValue} {currency}</div>
            </div>

            {/* Notes */}
            {notes && (
              <div style={s.note}>
                <strong>Hinweis:</strong> {notes}
              </div>
            )}

            <a href="#" style={s.cta}>Angebot bestätigen / Reply to Offer</a>

            <p style={{ fontSize: 12.5, color: '#4b5563', lineHeight: 1.6 }}>
              Mit freundlichen Grüßen,<br />
              <strong>{senderName}</strong>{senderRole ? ` · ${senderRole}` : ''}<br />
              EastAfrica Export OS
            </p>
          </div>

          {/* Footer */}
          <div style={s.footer}>
            Dieses Angebot ist rechtlich nicht bindend bis zur schriftlichen Auftragsbestätigung.
            EUDR-Konformitätsnachweise werden mit der Auftragsbestätigung bereitgestellt.
          </div>
        </div>
      </body>
    </html>
  );
}

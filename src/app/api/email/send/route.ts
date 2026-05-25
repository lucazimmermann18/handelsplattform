import { NextRequest, NextResponse } from 'next/server';
import { resend, FROM_EMAIL, isResendConfigured } from '@/lib/resend';
import { OfferEmail } from '@/emails/OfferEmail';
import { OrderConfirmationEmail } from '@/emails/OrderConfirmationEmail';
import { AlertEmail } from '@/emails/AlertEmail';
import React from 'react';

type EmailType = 'offer' | 'order_confirmation' | 'alert';

export async function POST(req: NextRequest) {
  if (!isResendConfigured()) {
    return NextResponse.json(
      { error: 'E-Mail nicht konfiguriert. Bitte RESEND_API_KEY in den Umgebungsvariablen setzen.' },
      { status: 503 }
    );
  }

  let body: { type: EmailType; to: string; subject: string; data: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body.' }, { status: 400 });
  }

  const { type, to, subject, data } = body;

  if (!type || !to || !subject) {
    return NextResponse.json({ error: 'Pflichtfelder fehlen: type, to, subject.' }, { status: 400 });
  }

  let emailComponent: React.ReactElement;
  switch (type) {
    case 'offer':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      emailComponent = React.createElement(OfferEmail, data as any);
      break;
    case 'order_confirmation':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      emailComponent = React.createElement(OrderConfirmationEmail, data as any);
      break;
    case 'alert':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      emailComponent = React.createElement(AlertEmail, data as any);
      break;
    default:
      return NextResponse.json({ error: `Unbekannter E-Mail-Typ: ${type}` }, { status: 400 });
  }

  const { data: result, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: Array.isArray(to) ? to : [to],
    subject,
    react: emailComponent,
  });

  if (error) {
    console.error('Resend error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: result?.id });
}

import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { PackingList } from '@/pdf/PackingList';
import { ProformaInvoice } from '@/pdf/ProformaInvoice';
import { OrderConfirmation } from '@/pdf/OrderConfirmation';
import { BusinessPlanPDF } from '@/pdf/BusinessPlanPDF';

type PdfType = 'packing-list' | 'proforma-invoice' | 'order-confirmation' | 'business-plan';

export async function POST(
  req: NextRequest,
  { params }: { params: { type: string } }
) {
  const type = params.type as PdfType;
  if (!['packing-list', 'proforma-invoice', 'order-confirmation', 'business-plan'].includes(type)) {
    return NextResponse.json({ error: `Unknown PDF type: ${type}` }, { status: 400 });
  }

  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  let element: React.ReactElement;
  if (type === 'packing-list') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    element = React.createElement(PackingList, { data: data as any });
  } else if (type === 'proforma-invoice') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    element = React.createElement(ProformaInvoice, { data: data as any });
  } else if (type === 'business-plan') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    element = React.createElement(BusinessPlanPDF, { data: data as any });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    element = React.createElement(OrderConfirmation, { data: data as any });
  }

  const buffer = await renderToBuffer(element);
  const uint8 = new Uint8Array(buffer);

  const filename = type === 'business-plan'
    ? `businessplan-${new Date().toISOString().slice(0, 10)}.pdf`
    : `${type}-${(data.orderId as string) ?? 'doc'}.pdf`;

  return new NextResponse(uint8, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const S = StyleSheet.create({
  page:        { fontFamily: 'Helvetica', fontSize: 9, padding: 40, color: '#1a1a2e' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, borderBottom: '2px solid #3b82f6', paddingBottom: 12 },
  logo:        { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#3b82f6', marginBottom: 2 },
  tagline:     { fontSize: 8, color: '#6b7280' },
  sellerInfo:  { textAlign: 'right' },
  sellerLine:  { fontSize: 8, color: '#374151', marginBottom: 1 },
  title:       { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 6, color: '#111827' },
  invoiceNum:  { fontSize: 10, color: '#6b7280', marginBottom: 16 },
  row2:        { flexDirection: 'row', gap: 20, marginBottom: 16 },
  box:         { flex: 1, padding: 10, backgroundColor: '#f9fafb', borderRadius: 4, border: '1px solid #e5e7eb' },
  boxLabel:    { fontSize: 7, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Helvetica-Bold' },
  boxLine:     { fontSize: 8.5, color: '#111827', marginBottom: 1 },
  table:       { marginTop: 16 },
  thead:       { flexDirection: 'row', backgroundColor: '#1e3a5f', padding: '6 8', borderRadius: '3 3 0 0' },
  th:          { fontSize: 7.5, color: '#fff', fontFamily: 'Helvetica-Bold' },
  tr:          { flexDirection: 'row', padding: '6 8', borderBottom: '1px solid #f3f4f6' },
  trAlt:       { flexDirection: 'row', padding: '6 8', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f8faff' },
  td:          { fontSize: 8.5, color: '#374151' },
  totals:      { marginTop: 12, alignItems: 'flex-end' },
  totalRow:    { flexDirection: 'row', gap: 8, marginBottom: 3, justifyContent: 'flex-end' },
  totalLabel:  { fontSize: 8.5, color: '#6b7280', width: 120, textAlign: 'right' },
  totalValue:  { fontSize: 8.5, width: 80, textAlign: 'right' },
  grandTotal:  { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 6, paddingTop: 6, borderTop: '1.5px solid #111827' },
  grandLabel:  { fontSize: 10, fontFamily: 'Helvetica-Bold', width: 120, textAlign: 'right' },
  grandValue:  { fontSize: 10, fontFamily: 'Helvetica-Bold', width: 80, textAlign: 'right', color: '#3b82f6' },
  terms:       { marginTop: 20, padding: 10, backgroundColor: '#f9fafb', borderRadius: 4 },
  termsTitle:  { fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 4, color: '#374151' },
  termsText:   { fontSize: 7.5, color: '#6b7280', lineHeight: 1.4 },
  sigs:        { flexDirection: 'row', gap: 40, marginTop: 32 },
  sigBox:      { flex: 1, borderTop: '1px solid #d1d5db', paddingTop: 4 },
  sigLabel:    { fontSize: 7.5, color: '#9ca3af' },
  footer:      { position: 'absolute', bottom: 30, left: 40, right: 40, borderTop: '1px solid #e5e7eb', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText:  { fontSize: 7.5, color: '#9ca3af' },
});

export interface ProformaInvoiceData {
  orderId: string;
  buyer: string;
  buyerAddress?: string;
  buyerCountry?: string;
  product: string;
  qty: number;
  unit: string;
  unitPrice: number;
  currency?: string;
  shippingCost?: number;
  paymentTerms?: string;
  incoterm?: string;
  portLoad?: string;
  portDest?: string;
  etd?: string;
  sellerName?: string;
  sellerAddress?: string;
}

export function ProformaInvoice({ data }: { data: ProformaInvoiceData }) {
  const cur = data.currency ?? 'EUR';
  const fmt = (v: number) => `${cur} ${v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const lineTotal = data.qty * data.unitPrice;
  const shipping = data.shippingCost ?? 0;
  const grandTotal = lineTotal + shipping;

  return (
    <Document>
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <View>
            <Text style={S.logo}>EastAfrica Export OS</Text>
            <Text style={S.tagline}>Professional Export Documentation Platform</Text>
          </View>
          <View style={S.sellerInfo}>
            <Text style={S.sellerLine}>{data.sellerName ?? 'EastAfrica Exports Ltd.'}</Text>
            {data.sellerAddress?.split('\n').map((l, i) => <Text key={i} style={S.sellerLine}>{l}</Text>)}
          </View>
        </View>

        <Text style={S.title}>PROFORMA INVOICE</Text>
        <Text style={S.invoiceNum}>Invoice No.: PI-{data.orderId} · Date: {new Date().toLocaleDateString('de-DE')}</Text>

        <View style={S.row2}>
          <View style={S.box}>
            <Text style={S.boxLabel}>Bill To</Text>
            <Text style={S.boxLine}>{data.buyer}</Text>
            {data.buyerAddress && <Text style={S.boxLine}>{data.buyerAddress}</Text>}
            {data.buyerCountry && <Text style={S.boxLine}>{data.buyerCountry}</Text>}
          </View>
          <View style={S.box}>
            <Text style={S.boxLabel}>Shipping</Text>
            {data.incoterm && <Text style={S.boxLine}>Incoterm: {data.incoterm}</Text>}
            {data.portLoad && <Text style={S.boxLine}>From: {data.portLoad}</Text>}
            {data.portDest && <Text style={S.boxLine}>To: {data.portDest}</Text>}
            {data.etd && <Text style={S.boxLine}>ETD: {data.etd}</Text>}
          </View>
          <View style={S.box}>
            <Text style={S.boxLabel}>Payment</Text>
            <Text style={S.boxLine}>{data.paymentTerms ?? 'T/T 30 days'}</Text>
            <Text style={S.boxLine}>Currency: {cur}</Text>
          </View>
        </View>

        <View style={S.table}>
          <View style={S.thead}>
            <Text style={[S.th, { flex: 3 }]}>Description</Text>
            <Text style={[S.th, { flex: 1, textAlign: 'right' }]}>Qty</Text>
            <Text style={[S.th, { flex: 1, textAlign: 'right' }]}>Unit Price</Text>
            <Text style={[S.th, { flex: 1, textAlign: 'right' }]}>Amount</Text>
          </View>
          <View style={S.tr}>
            <Text style={[S.td, { flex: 3 }]}>{data.product}</Text>
            <Text style={[S.td, { flex: 1, textAlign: 'right' }]}>{data.qty} {data.unit}</Text>
            <Text style={[S.td, { flex: 1, textAlign: 'right' }]}>{fmt(data.unitPrice)}</Text>
            <Text style={[S.td, { flex: 1, textAlign: 'right' }]}>{fmt(lineTotal)}</Text>
          </View>
        </View>

        <View style={S.totals}>
          <View style={S.totalRow}>
            <Text style={S.totalLabel}>Subtotal:</Text>
            <Text style={S.totalValue}>{fmt(lineTotal)}</Text>
          </View>
          <View style={S.totalRow}>
            <Text style={S.totalLabel}>Freight & Insurance:</Text>
            <Text style={S.totalValue}>{fmt(shipping)}</Text>
          </View>
          <View style={S.grandTotal}>
            <Text style={S.grandLabel}>TOTAL:</Text>
            <Text style={S.grandValue}>{fmt(grandTotal)}</Text>
          </View>
        </View>

        <View style={S.terms}>
          <Text style={S.termsTitle}>Terms & Conditions</Text>
          <Text style={S.termsText}>
            This proforma invoice is valid for 30 days from the date of issue. Payment terms as stated above.
            Prices are subject to final confirmation. Bank details available upon request.
          </Text>
        </View>

        <View style={S.sigs}>
          <View style={S.sigBox}>
            <Text style={S.sigLabel}>Authorized Signature & Stamp</Text>
          </View>
          <View style={S.sigBox}>
            <Text style={S.sigLabel}>Buyer Acceptance</Text>
          </View>
        </View>

        <View style={S.footer}>
          <Text style={S.footerText}>EastAfrica Export OS · PI-{data.orderId}</Text>
          <Text style={S.footerText}>Generated: {new Date().toLocaleDateString('de-DE')}</Text>
        </View>
      </Page>
    </Document>
  );
}

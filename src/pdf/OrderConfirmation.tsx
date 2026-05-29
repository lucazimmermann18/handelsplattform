import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const S = StyleSheet.create({
  page:        { fontFamily: 'Helvetica', fontSize: 9, padding: 44, color: '#1a1a2e' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28, borderBottom: '2px solid #3b82f6', paddingBottom: 14 },
  logo:        { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#3b82f6', marginBottom: 2 },
  tagline:     { fontSize: 8, color: '#6b7280' },
  dateBlock:   { textAlign: 'right' },
  dateLine:    { fontSize: 8.5, color: '#374151', marginBottom: 1 },
  confNum:     { fontSize: 8, color: '#9ca3af' },
  title:       { fontSize: 15, fontFamily: 'Helvetica-Bold', marginBottom: 4, color: '#111827' },
  subtitle:    { fontSize: 9, color: '#6b7280', marginBottom: 20 },
  section:     { marginBottom: 14 },
  sectionTitle:{ fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 6, color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: 3 },
  row2:        { flexDirection: 'row', gap: 20, marginBottom: 16 },
  box:         { flex: 1, padding: 10, backgroundColor: '#f9fafb', borderRadius: 4, border: '1px solid #e5e7eb' },
  boxLabel:    { fontSize: 7, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Helvetica-Bold' },
  boxLine:     { fontSize: 8.5, color: '#111827', marginBottom: 1 },
  bodyText:    { fontSize: 9, lineHeight: 1.6, color: '#374151', marginBottom: 10 },
  highlight:   { padding: '10 14', backgroundColor: '#eff6ff', borderRadius: 4, border: '1px solid #bfdbfe', marginBottom: 16 },
  highlightText: { fontSize: 8.5, color: '#1e40af', lineHeight: 1.5 },
  infoRow:     { flexDirection: 'row', marginBottom: 4 },
  infoLabel:   { width: 120, fontSize: 8.5, color: '#6b7280', fontFamily: 'Helvetica-Bold' },
  infoValue:   { flex: 1, fontSize: 8.5, color: '#111827' },
  sigs:        { flexDirection: 'row', gap: 40, marginTop: 36 },
  sigBox:      { flex: 1, borderTop: '1px solid #d1d5db', paddingTop: 4 },
  sigLabel:    { fontSize: 7.5, color: '#9ca3af' },
  footer:      { position: 'absolute', bottom: 30, left: 44, right: 44, borderTop: '1px solid #e5e7eb', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText:  { fontSize: 7.5, color: '#9ca3af' },
});

export interface OrderConfirmationData {
  orderId: string;
  buyer: string;
  buyerAddress?: string;
  buyerCountry?: string;
  product: string;
  qty: number;
  unit: string;
  unitPrice: number;
  currency?: string;
  incoterm?: string;
  portLoad?: string;
  portDest?: string;
  etd?: string;
  eta?: string;
  paymentTerms?: string;
  batch?: string;
  sellerName?: string;
  sellerContact?: string;
}

export function OrderConfirmation({ data }: { data: OrderConfirmationData }) {
  const cur = data.currency ?? 'EUR';
  const fmt = (v: number) => `${cur} ${(isNaN(v) ? 0 : v).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const total = (data.qty ?? 0) * (data.unitPrice ?? 0);

  return (
    <Document>
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <View>
            <Text style={S.logo}>EastAfrica Export OS</Text>
            <Text style={S.tagline}>Professional Export Documentation Platform</Text>
          </View>
          <View style={S.dateBlock}>
            <Text style={S.dateLine}>{new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            <Text style={S.confNum}>Order Confirmation</Text>
          </View>
        </View>

        <Text style={S.title}>ORDER CONFIRMATION</Text>
        <Text style={S.subtitle}>Reference: {data.orderId}</Text>

        <View style={S.bodyText}>
          <Text>Dear {data.buyer},</Text>
        </View>
        <View style={S.bodyText}>
          <Text>
            We are pleased to confirm the following order. Please review the details below and
            sign and return a copy of this confirmation to proceed.
          </Text>
        </View>

        <View style={S.highlight}>
          <Text style={S.highlightText}>
            Order ID: {data.orderId}{data.batch ? `  ·  Batch: ${data.batch}` : ''}  ·  Total Value: {fmt(total)}
          </Text>
        </View>

        <View style={S.row2}>
          <View style={S.box}>
            <Text style={S.boxLabel}>Buyer</Text>
            <Text style={S.boxLine}>{data.buyer}</Text>
            {data.buyerAddress && <Text style={S.boxLine}>{data.buyerAddress}</Text>}
            {data.buyerCountry && <Text style={S.boxLine}>{data.buyerCountry}</Text>}
          </View>
          <View style={S.box}>
            <Text style={S.boxLabel}>Seller</Text>
            <Text style={S.boxLine}>{data.sellerName ?? 'EastAfrica Exports Ltd.'}</Text>
            {data.sellerContact && <Text style={S.boxLine}>{data.sellerContact}</Text>}
          </View>
        </View>

        <View style={S.section}>
          <Text style={S.sectionTitle}>Product Specifications</Text>
          <View style={S.infoRow}><Text style={S.infoLabel}>Product:</Text><Text style={S.infoValue}>{data.product}</Text></View>
          <View style={S.infoRow}><Text style={S.infoLabel}>Quantity:</Text><Text style={S.infoValue}>{data.qty} {data.unit}</Text></View>
          <View style={S.infoRow}><Text style={S.infoLabel}>Unit Price:</Text><Text style={S.infoValue}>{fmt(data.unitPrice)}</Text></View>
          <View style={S.infoRow}><Text style={S.infoLabel}>Total Value:</Text><Text style={S.infoValue}>{fmt(total)}</Text></View>
          {data.incoterm && <View style={S.infoRow}><Text style={S.infoLabel}>Incoterm:</Text><Text style={S.infoValue}>{data.incoterm}</Text></View>}
          {data.paymentTerms && <View style={S.infoRow}><Text style={S.infoLabel}>Payment Terms:</Text><Text style={S.infoValue}>{data.paymentTerms}</Text></View>}
        </View>

        <View style={S.section}>
          <Text style={S.sectionTitle}>Delivery Details</Text>
          {data.portLoad && <View style={S.infoRow}><Text style={S.infoLabel}>Port of Loading:</Text><Text style={S.infoValue}>{data.portLoad}</Text></View>}
          {data.portDest && <View style={S.infoRow}><Text style={S.infoLabel}>Port of Destination:</Text><Text style={S.infoValue}>{data.portDest}</Text></View>}
          {data.etd && <View style={S.infoRow}><Text style={S.infoLabel}>Estimated Departure:</Text><Text style={S.infoValue}>{data.etd}</Text></View>}
          {data.eta && <View style={S.infoRow}><Text style={S.infoLabel}>Estimated Arrival:</Text><Text style={S.infoValue}>{data.eta}</Text></View>}
        </View>

        <View style={S.sigs}>
          <View style={S.sigBox}>
            <Text style={S.sigLabel}>Authorized by — {data.sellerName ?? 'EastAfrica Exports Ltd.'}</Text>
          </View>
          <View style={S.sigBox}>
            <Text style={S.sigLabel}>Accepted by — {data.buyer}</Text>
          </View>
        </View>

        <View style={S.footer}>
          <Text style={S.footerText}>EastAfrica Export OS · {data.orderId}</Text>
          <Text style={S.footerText}>Generated: {new Date().toLocaleDateString('de-DE')}</Text>
        </View>
      </Page>
    </Document>
  );
}

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const S = StyleSheet.create({
  page:        { fontFamily: 'Helvetica', fontSize: 9, padding: 40, color: '#1a1a2e' },
  header:      { marginBottom: 20 },
  logo:        { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#3b82f6', marginBottom: 2 },
  tagline:     { fontSize: 8, color: '#6b7280' },
  title:       { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 12, marginTop: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 6 },
  row2:        { flexDirection: 'row', gap: 20, marginBottom: 12 },
  box:         { flex: 1, padding: 10, backgroundColor: '#f9fafb', borderRadius: 4 },
  boxLabel:    { fontSize: 7, color: '#9ca3af', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  boxValue:    { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  boxSub:      { fontSize: 8, color: '#6b7280', marginTop: 1 },
  table:       { marginTop: 12 },
  thead:       { flexDirection: 'row', backgroundColor: '#3b82f6', borderRadius: 3, padding: '5 8', marginBottom: 2 },
  th:          { fontSize: 7.5, color: '#fff', fontFamily: 'Helvetica-Bold', flex: 1 },
  tbody:       {},
  tr:          { flexDirection: 'row', padding: '5 8', borderBottom: '1px solid #f3f4f6' },
  trAlt:       { flexDirection: 'row', padding: '5 8', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' },
  td:          { fontSize: 8.5, flex: 1, color: '#374151' },
  footer:      { position: 'absolute', bottom: 30, left: 40, right: 40, borderTop: '1px solid #e5e7eb', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText:  { fontSize: 7.5, color: '#9ca3af' },
  section:     { marginBottom: 14 },
  sectionTitle:{ fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 6, color: '#1f2937' },
  infoRow:     { flexDirection: 'row', marginBottom: 3 },
  infoLabel:   { width: 100, fontSize: 8, color: '#6b7280' },
  infoValue:   { flex: 1, fontSize: 8, color: '#111827' },
});

export interface PackingListData {
  orderId: string;
  buyer: string;
  buyerAddress?: string;
  product: string;
  qty: number;
  unit: string;
  netWeight?: string;
  grossWeight?: string;
  dimensions?: string;
  container?: string;
  portLoad?: string;
  portDest?: string;
  vessel?: string;
  etd?: string;
  eta?: string;
  batch?: string;
  marks?: string;
}

export function PackingList({ data }: { data: PackingListData }) {
  return (
    <Document>
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Text style={S.logo}>EastAfrica Export OS</Text>
          <Text style={S.tagline}>Professional Export Documentation Platform</Text>
        </View>

        <Text style={S.title}>PACKING LIST</Text>

        <View style={S.row2}>
          <View style={S.box}>
            <Text style={S.boxLabel}>Reference</Text>
            <Text style={S.boxValue}>{data.orderId}</Text>
            {data.batch && <Text style={S.boxSub}>Batch: {data.batch}</Text>}
          </View>
          <View style={S.box}>
            <Text style={S.boxLabel}>Consignee</Text>
            <Text style={S.boxValue}>{data.buyer}</Text>
            {data.buyerAddress && <Text style={S.boxSub}>{data.buyerAddress}</Text>}
          </View>
          <View style={S.box}>
            <Text style={S.boxLabel}>Date</Text>
            <Text style={S.boxValue}>{new Date().toLocaleDateString('de-DE')}</Text>
          </View>
        </View>

        <View style={S.section}>
          <Text style={S.sectionTitle}>Cargo Details</Text>
          <View style={S.infoRow}><Text style={S.infoLabel}>Product:</Text><Text style={S.infoValue}>{data.product}</Text></View>
          <View style={S.infoRow}><Text style={S.infoLabel}>Quantity:</Text><Text style={S.infoValue}>{data.qty} {data.unit}</Text></View>
          {data.netWeight && <View style={S.infoRow}><Text style={S.infoLabel}>Net Weight:</Text><Text style={S.infoValue}>{data.netWeight}</Text></View>}
          {data.grossWeight && <View style={S.infoRow}><Text style={S.infoLabel}>Gross Weight:</Text><Text style={S.infoValue}>{data.grossWeight}</Text></View>}
          {data.dimensions && <View style={S.infoRow}><Text style={S.infoLabel}>Dimensions:</Text><Text style={S.infoValue}>{data.dimensions}</Text></View>}
          {data.marks && <View style={S.infoRow}><Text style={S.infoLabel}>Marks & Numbers:</Text><Text style={S.infoValue}>{data.marks}</Text></View>}
        </View>

        <View style={S.section}>
          <Text style={S.sectionTitle}>Shipping Information</Text>
          {data.container && <View style={S.infoRow}><Text style={S.infoLabel}>Container No.:</Text><Text style={S.infoValue}>{data.container}</Text></View>}
          {data.portLoad && <View style={S.infoRow}><Text style={S.infoLabel}>Port of Loading:</Text><Text style={S.infoValue}>{data.portLoad}</Text></View>}
          {data.portDest && <View style={S.infoRow}><Text style={S.infoLabel}>Port of Destination:</Text><Text style={S.infoValue}>{data.portDest}</Text></View>}
          {data.vessel && <View style={S.infoRow}><Text style={S.infoLabel}>Vessel:</Text><Text style={S.infoValue}>{data.vessel}</Text></View>}
          {data.etd && <View style={S.infoRow}><Text style={S.infoLabel}>ETD:</Text><Text style={S.infoValue}>{data.etd}</Text></View>}
          {data.eta && <View style={S.infoRow}><Text style={S.infoLabel}>ETA:</Text><Text style={S.infoValue}>{data.eta}</Text></View>}
        </View>

        <View style={S.table}>
          <View style={S.thead}>
            <Text style={[S.th, { flex: 0.4 }]}>Pkg No.</Text>
            <Text style={[S.th, { flex: 2 }]}>Description</Text>
            <Text style={[S.th, { flex: 1 }]}>Quantity</Text>
            <Text style={[S.th, { flex: 1 }]}>Net Wt.</Text>
            <Text style={[S.th, { flex: 1 }]}>Gross Wt.</Text>
          </View>
          <View style={S.tr}>
            <Text style={[S.td, { flex: 0.4 }]}>1</Text>
            <Text style={[S.td, { flex: 2 }]}>{data.product}</Text>
            <Text style={[S.td, { flex: 1 }]}>{data.qty} {data.unit}</Text>
            <Text style={[S.td, { flex: 1 }]}>{data.netWeight ?? '—'}</Text>
            <Text style={[S.td, { flex: 1 }]}>{data.grossWeight ?? '—'}</Text>
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

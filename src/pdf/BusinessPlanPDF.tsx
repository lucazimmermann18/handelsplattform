import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const S = StyleSheet.create({
  page:          { fontFamily: 'Helvetica', fontSize: 9, padding: 44, color: '#1a1a2e' },
  coverPage:     { fontFamily: 'Helvetica', fontSize: 9, padding: 0, color: '#1a1a2e', backgroundColor: '#0f172a' },
  // Cover
  coverTop:      { padding: '60 50 40', flex: 1 },
  coverLogo:     { fontSize: 11, color: '#60a5fa', fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  coverTagline:  { fontSize: 8, color: '#475569', marginBottom: 60 },
  coverTitle:    { fontSize: 28, fontFamily: 'Helvetica-Bold', color: '#f1f5f9', marginBottom: 6, lineHeight: 1.2 },
  coverCompany:  { fontSize: 16, color: '#94a3b8', marginBottom: 40 },
  coverDate:     { fontSize: 9, color: '#475569', marginBottom: 10 },
  coverScoreBox: { padding: '16 20', backgroundColor: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 8, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  coverScore:    { fontSize: 36, fontFamily: 'Helvetica-Bold', color: '#3b82f6', width: 60 },
  coverScoreLabel:{ fontSize: 11, color: '#94a3b8', marginBottom: 3 },
  coverScoreClass:{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#f1f5f9' },
  coverBadges:   { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  coverBadge:    { padding: '4 10', borderRadius: 4, fontSize: 8.5, fontFamily: 'Helvetica-Bold' },
  coverFoot:     { padding: '20 50', borderTop: '1px solid rgba(255,255,255,0.06)', flexDirection: 'row', justifyContent: 'space-between' },
  coverFootText: { fontSize: 8, color: '#475569' },
  // Chapter pages
  header:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid #e5e7eb', paddingBottom: 10 },
  headerLogo:    { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#3b82f6' },
  headerMeta:    { fontSize: 7.5, color: '#9ca3af', textAlign: 'right' },
  chTitle:       { fontSize: 15, fontFamily: 'Helvetica-Bold', color: '#111827', marginBottom: 4 },
  chNum:         { fontSize: 9, color: '#9ca3af', marginBottom: 14 },
  statusRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  statusDot:     { width: 8, height: 8, borderRadius: 4 },
  statusText:    { fontSize: 8.5, color: '#6b7280' },
  section:       { marginBottom: 14 },
  sectionLabel:  { fontSize: 7.5, color: '#9ca3af', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5 },
  autoBox:       { padding: '10 12', backgroundColor: '#eff6ff', borderRadius: 4, border: '1px solid #bfdbfe', marginBottom: 12 },
  autoText:      { fontSize: 8.5, color: '#1e40af', lineHeight: 1.6 },
  manualBox:     { padding: '10 12', backgroundColor: '#f9fafb', borderRadius: 4, border: '1px solid #e5e7eb', marginBottom: 12 },
  manualText:    { fontSize: 8.5, color: '#374151', lineHeight: 1.6 },
  noData:        { fontSize: 8.5, color: '#9ca3af', fontStyle: 'italic' },
  assumptionRow: { flexDirection: 'row', gap: 8, marginBottom: 5, alignItems: 'flex-start' },
  assumptionDot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  assumptionText:{ flex: 1, fontSize: 8, color: '#374151', lineHeight: 1.5 },
  assumptionTag: { fontSize: 7, padding: '1 5', borderRadius: 3, fontFamily: 'Helvetica-Bold' },
  footer:        { position: 'absolute', bottom: 30, left: 44, right: 44, borderTop: '1px solid #e5e7eb', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText:    { fontSize: 7.5, color: '#9ca3af' },
  // Gaps page
  gapsTitle:     { fontSize: 15, fontFamily: 'Helvetica-Bold', color: '#111827', marginBottom: 4 },
  gapCard:       { padding: '10 12', backgroundColor: '#fffbeb', borderRadius: 4, border: '1px solid #fde68a', marginBottom: 8 },
  gapTitle:      { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#92400e', marginBottom: 3 },
  gapDesc:       { fontSize: 8.5, color: '#78350f', lineHeight: 1.5 },
});

const STATUS_COLORS: Record<string, string> = {
  green:  '#10b981',
  yellow: '#f59e0b',
  red:    '#ef4444',
  gray:   '#9ca3af',
};

const ASSUMPTION_COLORS: Record<string, string> = {
  guess:      '#f97316',
  researched: '#f59e0b',
  validated:  '#60a5fa',
  confirmed:  '#10b981',
};

const ASSUMPTION_LABELS: Record<string, string> = {
  guess:      'Annahme',
  researched: 'Recherchiert',
  validated:  'Validiert',
  confirmed:  'Bestätigt',
};

export interface BPChapter {
  id: string;
  num: number;
  title: string;
  autoText: string;
  manualText: string;
  assumptions: { id: string; text: string; status: string }[];
  status: string;
  statusText: string;
}

export interface BPGap {
  icon: string;
  title: string;
  desc: string;
  nav: string;
}

export interface BusinessPlanData {
  score: number;
  scoreLabel: string;
  companyName: string;
  chapters: BPChapter[];
  gaps: BPGap[];
  generatedAt: string;
}

function scoreBadges(score: number) {
  return [
    { label: 'Operativ',      val: score >= 51 ? 'Gut' : 'Ausbau nötig',           ok: score >= 51 },
    { label: 'Bankfähig',     val: score >= 71 ? 'Ja' : score >= 51 ? 'Bedingt' : 'Nein', ok: score >= 71 },
    { label: 'Investorfähig', val: score >= 81 ? 'Ja' : score >= 61 ? 'Bedingt' : 'Nein', ok: score >= 81 },
  ];
}

function scoreColor(score: number): string {
  if (score >= 86) return '#10b981';
  if (score >= 71) return '#34d399';
  if (score >= 51) return '#f59e0b';
  if (score >= 31) return '#f97316';
  return '#ef4444';
}

export function BusinessPlanPDF({ data }: { data: BusinessPlanData }) {
  const dateStr = new Date(data.generatedAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
  const col = scoreColor(data.score);
  const badges = scoreBadges(data.score);

  return (
    <Document>
      {/* ── Cover Page ─────────────────────────────────────────────────────── */}
      <Page size="A4" style={S.coverPage}>
        <View style={S.coverTop}>
          <Text style={S.coverLogo}>EastAfrica Export OS</Text>
          <Text style={S.coverTagline}>Professional Export Documentation Platform</Text>

          <Text style={S.coverTitle}>Businessplan</Text>
          <Text style={S.coverCompany}>{data.companyName}</Text>

          <Text style={S.coverDate}>Erstellt am {dateStr}</Text>

          <View style={S.coverScoreBox}>
            <Text style={[S.coverScore, { color: col }]}>{data.score}</Text>
            <View>
              <Text style={S.coverScoreLabel}>Readiness Score / 100</Text>
              <Text style={[S.coverScoreClass, { color: col }]}>{data.scoreLabel}</Text>
            </View>
          </View>

          <View style={S.coverBadges}>
            {badges.map(b => (
              <View
                key={b.label}
                style={[S.coverBadge, {
                  backgroundColor: b.ok ? 'rgba(16,185,129,0.15)' : 'rgba(156,163,175,0.12)',
                  border: `1px solid ${b.ok ? 'rgba(16,185,129,0.3)' : 'rgba(156,163,175,0.2)'}`,
                  color: b.ok ? '#10b981' : '#9ca3af',
                }]}
              >
                <Text>{b.label}: {b.val}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={S.coverFoot}>
          <Text style={S.coverFootText}>EastAfrica Export OS — Businessplan Builder</Text>
          <Text style={S.coverFootText}>Vertraulich · {dateStr}</Text>
        </View>
      </Page>

      {/* ── Chapter Pages ───────────────────────────────────────────────────── */}
      {data.chapters.map(ch => (
        <Page key={ch.id} size="A4" style={S.page}>
          <View style={S.header}>
            <Text style={S.headerLogo}>EastAfrica Export OS — Businessplan</Text>
            <Text style={S.headerMeta}>Kapitel {ch.num} von {data.chapters.length}</Text>
          </View>

          <Text style={S.chTitle}>{ch.title}</Text>
          <Text style={S.chNum}>Kapitel {String(ch.num).padStart(2, '0')}</Text>

          <View style={S.statusRow}>
            <View style={[S.statusDot, { backgroundColor: STATUS_COLORS[ch.status] ?? '#9ca3af' }]} />
            <Text style={S.statusText}>{ch.statusText}</Text>
          </View>

          {/* Auto-generated text */}
          <View style={S.section}>
            <Text style={S.sectionLabel}>Aus Plattformdaten (automatisch)</Text>
            <View style={S.autoBox}>
              <Text style={S.autoText}>
                {ch.autoText || 'Keine automatischen Plattformdaten für dieses Kapitel verfügbar.'}
              </Text>
            </View>
          </View>

          {/* Manual content */}
          {ch.manualText ? (
            <View style={S.section}>
              <Text style={S.sectionLabel}>Eigene Ergänzungen & Kontext</Text>
              <View style={S.manualBox}>
                <Text style={S.manualText}>{ch.manualText}</Text>
              </View>
            </View>
          ) : null}

          {/* Assumptions */}
          {ch.assumptions.length > 0 && (
            <View style={S.section}>
              <Text style={S.sectionLabel}>Annahmen ({ch.assumptions.length})</Text>
              {ch.assumptions.map(a => (
                <View key={a.id} style={S.assumptionRow}>
                  <View style={[S.assumptionDot, { backgroundColor: ASSUMPTION_COLORS[a.status] ?? '#9ca3af' }]} />
                  <Text style={S.assumptionText}>{a.text || '(Kein Text)'}</Text>
                  <View style={[S.assumptionTag, {
                    backgroundColor: `${ASSUMPTION_COLORS[a.status] ?? '#9ca3af'}20`,
                    color: ASSUMPTION_COLORS[a.status] ?? '#9ca3af',
                    border: `1px solid ${ASSUMPTION_COLORS[a.status] ?? '#9ca3af'}40`,
                  }]}>
                    <Text>{ASSUMPTION_LABELS[a.status] ?? a.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={S.footer}>
            <Text style={S.footerText}>{data.companyName} — Businessplan</Text>
            <Text style={S.footerText}>Erstellt: {dateStr}</Text>
          </View>
        </Page>
      ))}

      {/* ── Gaps & Next Steps Page ──────────────────────────────────────────── */}
      {data.gaps.length > 0 && (
        <Page size="A4" style={S.page}>
          <View style={S.header}>
            <Text style={S.headerLogo}>EastAfrica Export OS — Businessplan</Text>
            <Text style={S.headerMeta}>Lücken & Nächste Schritte</Text>
          </View>

          <Text style={S.gapsTitle}>Lücken & nächste Schritte</Text>
          <Text style={[S.chNum, { marginBottom: 18 }]}>
            {data.gaps.length} offene Punkte zur Verbesserung des Readiness Score
          </Text>

          {data.gaps.map((g, i) => (
            <View key={i} style={S.gapCard}>
              <Text style={S.gapTitle}>{g.title}</Text>
              <Text style={S.gapDesc}>{g.desc}</Text>
            </View>
          ))}

          <View style={S.footer}>
            <Text style={S.footerText}>{data.companyName} — Businessplan</Text>
            <Text style={S.footerText}>Erstellt: {dateStr}</Text>
          </View>
        </Page>
      )}
    </Document>
  );
}
